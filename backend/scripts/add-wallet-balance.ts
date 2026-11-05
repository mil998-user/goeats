import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding $100 to all delivery drivers (MOTORIZADO)...");

  const drivers = await prisma.user.findMany({
    where: { role: Role.MOTORIZADO }
  });

  console.log(`Found ${drivers.length} drivers.`);

  for (const driver of drivers) {
    const updated = await prisma.user.update({
      where: { id: driver.id },
      data: {
        walletBalance: {
          increment: 100.00
        }
      }
    });

    // Also log a transaction for the wallet recharge
    await prisma.walletTransaction.create({
      data: {
        userId: driver.id,
        amount: 100.00,
        type: "RECHARGE",
        description: "Recarga de saldo manual por el administrador"
      }
    });

    console.log(`Updated driver "${updated.username}": New balance: $${updated.walletBalance}`);
  }

  console.log("Done!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
