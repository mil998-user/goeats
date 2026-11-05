import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://root:root@127.0.0.1:3306/mysql",
      },
    },
  });

  try {
    const res: any = await prisma.$queryRawUnsafe("SELECT VERSION();");
    console.log("Database Version:", res[0]["VERSION()"]);
  } catch (e: any) {
    console.error("Error connecting or query:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
