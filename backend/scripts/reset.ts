import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Starting database reset (setting transactions and orders to 0)...");

  try {
    await prisma.$transaction([
      prisma.walletTransaction.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.invoiceItem.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.expense.deleteMany(),
      prisma.income.deleteMany(),
      prisma.cashSession.deleteMany(),
      prisma.inventoryMovement.deleteMany(),
      prisma.purchaseCredit.deleteMany(),
      prisma.purchaseItem.deleteMany(),
      prisma.purchase.deleteMany(),
      
      // Reset statuses
      prisma.table.updateMany({
        data: { status: "FREE" }
      }),
      prisma.user.updateMany({
        data: { walletBalance: 0.0 }
      })
    ]);

    console.log("✅ Database transactions wiped and reset successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
