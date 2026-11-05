const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating all DELIVERED orders to APPROVED paymentStatus...");
  const result = await prisma.order.updateMany({
    where: {
      status: "DELIVERED",
      paymentStatus: "PENDING"
    },
    data: {
      paymentStatus: "APPROVED"
    }
  });
  console.log(`Updated ${result.count} orders successfully.`);
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
