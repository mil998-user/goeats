// Arma y levanta la base local de pruebas, sin copiar carpetas entre compañeros.
// Se puede correr las veces que haga falta:
//   1. Si no existe la carpeta de datos, la crea (mysqld --initialize-insecure).
//   2. Si MySQL no está escuchando en el puerto de DATABASE_URL, lo levanta en segundo plano.
//   3. Crea la base si falta y aplica las migraciones.
//   4. Corre el seed solo si la base no tiene usuarios.
// Uso: npm run db:local
// Variables opcionales: MYSQL_BIN (carpeta bin de MySQL), LOCAL_DB_DATADIR (carpeta de datos).
import "dotenv/config";
import fs from "fs";
import net from "net";
import path from "path";
import { spawn, spawnSync } from "child_process";
import { assertLocalDatabase, parseDatabaseUrl } from "../src/config/databaseUrl";

const backendDir = path.join(__dirname, "..");
const isWindows = process.platform === "win32";
const exe = (name: string) => (isWindows ? `${name}.exe` : name);

function findMysqlBin(): string {
  const candidates = [
    process.env.MYSQL_BIN,
    ...(isWindows
      ? ["8.4", "9.0", "9.1", "9.2", "9.3", "9.4", "9.5"]
          .reverse()
          .map((v) => `C:\\Program Files\\MySQL\\MySQL Server ${v}\\bin`)
      : []),
    isWindows ? "C:\\xampp\\mysql\\bin" : undefined,
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, exe("mysqld")))) return dir;
  }
  // Último intento: que esté en el PATH.
  const which = spawnSync(isWindows ? "where" : "which", [exe("mysqld")], { encoding: "utf8" });
  if (which.status === 0) return path.dirname(which.stdout.split(/\r?\n/)[0].trim());

  throw new Error(
    "No encontré MySQL. Instala MySQL Server 8.4 o superior, o pon la carpeta bin en MYSQL_BIN dentro del .env."
  );
}

function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function waitForPort(port: number, seconds: number): Promise<void> {
  for (let i = 0; i < seconds * 2; i++) {
    if (await isListening(port)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`MySQL no respondió en el puerto ${port} después de ${seconds} s.`);
}

function run(command: string, args: string[], label: string, extraEnv: Record<string, string> = {}): void {
  const viaShell = isWindows && command === "npx";
  // Con consola se pasa una sola cadena: los argumentos son fijos de este script, nunca del usuario.
  const result = spawnSync(viaShell ? [command, ...args].join(" ") : command, viaShell ? [] : args, {
    cwd: backendDir,
    stdio: "inherit",
    // npx en Windows es un .cmd y necesita la consola; los .exe de MySQL van directo
    // (su ruta tiene espacios, "Program Files", y la consola la partiría).
    shell: viaShell,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) throw new Error(`Falló: ${label}`);
}

async function main() {
  assertLocalDatabase("db:local");
  const url = parseDatabaseUrl(process.env.DATABASE_URL)!;
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username || "root");
  const database = url.pathname.replace(/^\//, "");
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error("El nombre de la base solo puede tener letras, números y _.");

  const datadir = path.resolve(backendDir, process.env.LOCAL_DB_DATADIR || "db-data");
  const bin = findMysqlBin();
  console.log(`MySQL: ${bin}`);
  console.log(`Datos: ${datadir}`);

  if (!(await isListening(port))) {
    if (!fs.existsSync(path.join(datadir, "mysql"))) {
      console.log("Creando la carpeta de datos (solo la primera vez)...");
      fs.mkdirSync(datadir, { recursive: true });
      // Sin contraseña para root, y solo acepta conexiones de esta máquina (bind-address abajo).
      run(path.join(bin, exe("mysqld")), ["--initialize-insecure", `--datadir=${datadir}`], "inicializar MySQL");
    }

    console.log(`Levantando MySQL en el puerto ${port}...`);
    const child = spawn(
      path.join(bin, exe("mysqld")),
      [`--datadir=${datadir}`, `--port=${port}`, "--bind-address=127.0.0.1", "--mysqlx=OFF"],
      { detached: true, stdio: "ignore", windowsHide: true }
    );
    child.unref();
    await waitForPort(port, 60);
  } else {
    console.log(`MySQL ya está corriendo en el puerto ${port}.`);
  }

  console.log(`Creando la base "${database}" si no existe...`);
  run(
    path.join(bin, exe("mysql")),
    ["-h127.0.0.1", `-P${port}`, `-u${user}`, "-e", `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`],
    "crear la base",
    // La contraseña va por variable de entorno, no en la línea de comandos donde otros procesos la ven.
    { MYSQL_PWD: decodeURIComponent(url.password || "") }
  );

  console.log("Aplicando migraciones...");
  run("npx", ["prisma", "migrate", "deploy"], "prisma migrate deploy");
  run("npx", ["prisma", "generate"], "prisma generate");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const users = await prisma.user.count();
  await prisma.$disconnect();

  if (users === 0) {
    console.log("Base vacía: cargando datos demo...");
    run("npx", ["ts-node", "prisma/seeds/seed.ts"], "seed");
  } else {
    console.log(`La base ya tiene ${users} usuarios: no se vuelve a sembrar.`);
  }

  console.log(`\nBase local lista en 127.0.0.1:${port}/${database}.`);
  console.log("Para apagarla: mysqladmin -h127.0.0.1 -P" + port + " -uroot shutdown");
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
