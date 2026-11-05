import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany();
  console.log("RESTAURANTS:", JSON.stringify(restaurants, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, restaurantId: true, isActive: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
