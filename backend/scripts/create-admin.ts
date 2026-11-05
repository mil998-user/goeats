import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrador GoEats";
  const email = process.env.ADMIN_EMAIL || "admin@goeats.app";

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      name,
      email,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      username,
      password: hashedPassword,
      name,
      email,
      role: Role.SUPER_ADMIN,
      isActive: true,
      walletBalance: 0,
    },
  });

  console.log(" Super Admin registrado o actualizado con éxito:");
  console.log({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error("Error registrando admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
