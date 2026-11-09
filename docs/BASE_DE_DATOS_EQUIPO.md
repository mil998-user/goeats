# Base de datos del equipo

Hay dos bases, y cada una tiene su uso:

| Base | Para qué | Quién la cambia |
|---|---|---|
| **Compartida (TiDB Cloud, en la nube, plan gratis sin tarjeta)** | Trabajar con los mismos datos los tres, y luego el deploy | Solo el responsable (Deyvi) aplica migraciones |
| **Local (en tu PC)** | Probar sin miedo, crear migraciones nuevas, trabajar sin internet | Cada uno la suya |

Ya no se copia la carpeta `backend/db-data` entre compañeros. La base local se arma con un comando, a partir de las migraciones y el seed que están en git.

---

## 1. Conectarte a la base compartida

Necesitas:

- tu usuario y contraseña de la base, que Deyvi te pasa **por mensaje privado**;
- el archivo `ca.pem`, el certificado del servidor, que sirve para que la conexión vaya cifrada y verificada.

Pasos:

1. Trae lo último de la rama:
   ```bash
   git checkout desarrollo
   git pull
   ```
2. Instala dependencias en `backend`:
   ```bash
   cd backend
   npm install
   ```
3. Si aún no tienes `backend/.env`, copia `backend/.env.example` como `backend/.env`.
4. Guarda el certificado en `backend/certs/ca.pem`. Es público: descárgalo de https://letsencrypt.org/certs/isrgrootx1.pem y cámbiale el nombre a `ca.pem`.
   - En tu `.env` pon el mismo `DATA_ENCRYPTION_KEY` que Deyvi te pasa. Los tres deben usar la misma clave: con otra, el backend no puede leer lo que otro cifró, por ejemplo los teléfonos de las reservas.
   - Deja vacíos `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` para no enviar correos reales.
5. En `backend/.env`, deja así la línea de la base, con tus datos (la de la base local queda comentada con `#`):
   ```
   DATABASE_URL="mysql://TU_USUARIO:TU_CONTRASENA@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/goeats?sslaccept=strict&sslcert=../certs/ca.pem"
   ```
   Si tu contraseña tiene símbolos como `@`, `:`, `/` o `#`, escríbelos codificados (`@` es `%40`, `#` es `%23`).
6. Genera el cliente de Prisma y comprueba la conexión:
   ```bash
   npx prisma generate
   npm run db:check
   ```
   Debe decir `Cifrado: sí` y `Migraciones: al día`.
7. Levanta el backend con `npm run dev` y entra con una cuenta demo.
8. Ya puedes borrar tu copia vieja de `backend/db-data`, si no la usas como base local.

## 2. Armar tu base local

Necesitas MySQL Server 8.4 o superior instalado (no hace falta que corra como servicio).

1. En `backend/.env`, usa la base local:
   ```
   DATABASE_URL="mysql://root:@127.0.0.1:3309/goeats"
   ```
2. Corre:
   ```bash
   npm run db:local
   ```

El comando hace todo y se puede repetir sin problema:

- La primera vez crea la carpeta `backend/db-data`.
- Si MySQL no está corriendo, lo levanta. Solo acepta conexiones de tu PC.
- Aplica las migraciones que falten.
- Carga los datos demo solo si la base está vacía.

Si no encuentra MySQL, agrega en el `.env` la carpeta `bin` de tu instalación, por ejemplo:
```
MYSQL_BIN="C:\Program Files\MySQL\MySQL Server 8.4\bin"
```

Para apagarla:
```bash
mysqladmin -h127.0.0.1 -P3309 -uroot shutdown
```

## 3. Reglas para no pisarnos

| ✅ Se puede | ❌ No se puede |
|---|---|
| Usar la base compartida para trabajar y probar flujos normales | Correr `prisma migrate dev`, `prisma migrate reset` o `prisma db push` contra la compartida |
| Crear migraciones nuevas en tu base **local** | Subir el `.env` o el `ca.pem` a git (ya están en `.gitignore`) |
| Pedirle a Deyvi que aplique una migración en la compartida | Pasar credenciales por el grupo o por correo |
| Vaciar tu base local cuando quieras | Vaciar la compartida: el sistema lo bloquea |

**Protecciones que ya trae el proyecto:**

- El backend no arranca contra una base remota si la conexión no verifica el certificado (`sslaccept=strict`).
- `scripts/reset.ts`, el botón "Vaciar Sistema", `seed_maku.ts` y `db:local` se niegan a correr si la base no es local.
- El seed no crea cuentas con contraseñas conocidas en una base remota: pide `SEED_ADMIN_PASSWORD`, `SEED_DRIVER_PASSWORD` y `SEED_OWNER_PASSWORD` en el `.env`.

## 4. Cuando alguien cambia el esquema (`schema.prisma`)

1. Con tu base **local** activa, crea la migración:
   ```bash
   npx prisma migrate dev --name que_cambia
   ```
2. Sube a `desarrollo` el cambio del esquema junto con la carpeta nueva de `prisma/migrations`.
3. Avísale a Deyvi. Él la aplica en la compartida:
   ```bash
   npx prisma migrate deploy
   ```
4. Los demás hacen `git pull` y `npx prisma generate`.

Nunca edites una migración que ya está aplicada en la compartida: crea una nueva.

## 5. Solo para el responsable (Deyvi)

**Primera carga** de la base compartida, una sola vez. ✅ Hecha el 2026-11-09: 5 migraciones, 15 restaurantes, 17 cuentas, sin diferencias con el esquema.

Para repetirla en otra instancia:

1. En tu `.env`, con la base compartida activa, define contraseñas propias (mínimo 8 caracteres) para:
   - `SEED_ADMIN_PASSWORD`;
   - `SEED_DRIVER_PASSWORD`;
   - `SEED_OWNER_PASSWORD`.
2. Corre:
   ```bash
   npm run db:check
   # si la base goeats no existe, créala antes desde el SQL Editor de TiDB: CREATE DATABASE goeats;
   npx prisma migrate deploy
   npm run prisma:seed
   ```
3. Pasa a tus compañeros las contraseñas de las cuentas demo por privado.

**Accesos:**

- Cada compañero tiene su propio usuario de base, si el plan lo permite. Si alguien deja el equipo, se borra su usuario y no hay que cambiarle la clave a nadie más.
- Activa la verificación en dos pasos en la cuenta de TiDB Cloud.
- La instancia es `goeats-db` (plan Starter, AWS N. Virginia), con límite de gasto en **$0**: si se acaba el cupo gratis, se pone lenta pero nunca cobra.
- Si TiDB pide autorizar direcciones IP, agrega la de cada compañero en **Settings > Networking** de la instancia.

## 6. Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| `La base remota necesita conexión cifrada y verificada` | Falta `?sslaccept=strict&sslcert=../certs/ca.pem` al final de `DATABASE_URL` |
| `Error opening a TLS connection` | Revisa que `backend/certs/ca.pem` exista y sea el de la base compartida |
| `Can't reach database server` | Sin internet, tu IP no está autorizada en TiDB (avísale a Deyvi) o se agotó el cupo gratis del mes |
| `Migraciones pendientes` en la compartida | Avísale a Deyvi; no las apliques tú |
| `No encontré MySQL` en `db:local` | Instala MySQL Server o pon `MYSQL_BIN` en el `.env` |
