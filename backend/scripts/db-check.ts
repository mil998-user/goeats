// Comprueba la conexión a la base: a dónde apunta, si va cifrada y si las migraciones están al día.
// No escribe nada. Uso: npm run db:check
import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { describeDatabase, isLocalDatabase, validateDatabaseUrl } from "../src/config/databaseUrl";

async function main() {
  const url = validateDatabaseUrl(process.env.DATABASE_URL);
  const local = isLocalDatabase(url);
  console.log(`Base: ${describeDatabase(url)} (${local ? "local" : "compartida"})`);

  const prisma = new PrismaClient();
  try {
    const [version] = await prisma.$queryRaw<{ v: string }[]>`SELECT VERSION() AS v`;
    console.log(`MySQL: ${version.v}`);

    const cipher = await prisma.$queryRaw<{ Value: string }[]>`SHOW SESSION STATUS LIKE 'Ssl_cipher'`;
    const tls = cipher[0]?.Value || "";
    console.log(`Cifrado: ${tls ? `sí (${tls})` : "no"}`);
    if (!local && !tls) {
      throw new Error("La conexión con la base compartida no va cifrada. Revisa DATABASE_URL.");
    }

    const folder = path.join(__dirname, "..", "prisma", "migrations");
    const expected = fs
      .readdirSync(folder, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    let applied: string[] = [];
    try {
      const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM _prisma_migrations
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      applied = rows.map((row) => row.migration_name);
    } catch {
      // La tabla no existe todavía: la base está vacía.
    }

    const missing = expected.filter((name) => !applied.includes(name));
    if (missing.length) {
      console.log(`Migraciones pendientes (${missing.length}):`);
      missing.forEach((name) => console.log(`  - ${name}`));
      console.log(
        local
          ? "Aplícalas con: npx prisma migrate deploy"
          : "En la base compartida las aplica solo el responsable. Avísale."
      );
      process.exitCode = 1;
    } else {
      console.log(`Migraciones: al día (${expected.length})`);
    }

    const users = await prisma.user.count().catch(() => null);
    if (users !== null) console.log(`Usuarios registrados: ${users}`);
    if (!process.exitCode) console.log("Todo listo.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
