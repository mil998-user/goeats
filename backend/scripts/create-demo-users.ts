import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log(" Creando usuario Tienda / Restaurante y usuario Repartidor / Motorizado...");

  // ==========================================
  // 1. CREACIÓN DE USUARIO TIENDA / RESTAURANTE
  // ==========================================
  const storeUsername = "tienda_demo";
  const storePassword = "Tienda123!";
  const storeSlug = "burger-pizza-go";
  const storeHashedPassword = await bcrypt.hash(storePassword, SALT_ROUNDS);

  // Asegurar o crear restaurante
  let restaurant = await prisma.restaurant.findUnique({
    where: { slug: storeSlug },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: "Burger & Pizza Go",
        slug: storeSlug,
        address: "Av. Amazonas y Av. Colón, Quito",
        phone: "0998887766",
        status: "APPROVED",
        isActive: true,
        deliveryCommissionPercentage: 10,
        qrOrderingEnabled: true,
      },
    });

    // 1.1 Salón y Mesas
    const diningArea = await prisma.diningArea.create({
      data: {
        name: "Salón Principal",
        restaurantId: restaurant.id,
      },
    });

    await prisma.table.createMany({
      data: [
        { number: "1", capacity: 4, diningAreaId: diningArea.id },
        { number: "2", capacity: 4, diningAreaId: diningArea.id },
        { number: "3", capacity: 4, diningAreaId: diningArea.id },
        { number: "4", capacity: 6, diningAreaId: diningArea.id },
      ],
    });

    // 1.2 Caja Registradora
    await prisma.cashRegister.create({
      data: {
        name: "Caja Principal POS",
        restaurantId: restaurant.id,
        isActive: true,
      },
    });

    // 1.3 Cliente consumidor final
    await prisma.client.create({
      data: {
        name: "CONSUMIDOR FINAL",
        typeId: "07",
        identification: "9999999999999",
        address: "S/N",
        email: "cf@gmail.com",
        phone: "0999999999",
        restaurantId: restaurant.id,
      },
    });

    // 1.4 Áreas de producción (Cocina, Bar)
    await prisma.productionArea.createMany({
      data: [
        { name: "Cocina", restaurantId: restaurant.id },
        { name: "Bar / Bebidas", restaurantId: restaurant.id },
      ],
    });
  } else {
    // Si ya existía, asegurarse de que esté aprobado y activo
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { status: "APPROVED", isActive: true },
    });
  }

  // Usuario Dueño de Restaurante
  const ownerUser = await prisma.user.upsert({
    where: { username: storeUsername },
    update: {
      password: storeHashedPassword,
      name: "Carlos Dueño (Burger & Pizza Go)",
      email: "tienda.demo@goeats.app",
      role: Role.RESTAURANT_OWNER,
      isActive: true,
      restaurantId: restaurant.id,
    },
    create: {
      username: storeUsername,
      password: storeHashedPassword,
      name: "Carlos Dueño (Burger & Pizza Go)",
      email: "tienda.demo@goeats.app",
      role: Role.RESTAURANT_OWNER,
      isActive: true,
      restaurantId: restaurant.id,
      phone: "0998887766",
    },
  });

  // ==========================================
  // 2. CREACIÓN DE USUARIO MOTORIZADO / REPARTIDOR
  // ==========================================
  const driverUsername = "moto_demo";
  const driverPassword = "Moto123!";
  const driverHashedPassword = await bcrypt.hash(driverPassword, SALT_ROUNDS);
  const driverCedula = "1720304050";

  const driverUser = await prisma.user.upsert({
    where: { username: driverUsername },
    update: {
      password: driverHashedPassword,
      name: "Pedro Repartidor Express",
      email: "moto.demo@goeats.app",
      role: Role.MOTORIZADO,
      isActive: true, // Aprobado para entrar de inmediato
      cedula: driverCedula,
      phone: "0991234567",
      vehicleType: "MOTO",
      vehiclePlate: "PBC-1234",
      walletBalance: 25.0, // Saldo a favor para operar
    },
    create: {
      username: driverUsername,
      password: driverHashedPassword,
      name: "Pedro Repartidor Express",
      email: "moto.demo@goeats.app",
      role: Role.MOTORIZADO,
      isActive: true, // Aprobado para entrar de inmediato
      cedula: driverCedula,
      phone: "0991234567",
      vehicleType: "MOTO",
      vehiclePlate: "PBC-1234",
      walletBalance: 25.0, // Saldo a favor para operar
    },
  });

  console.log("\n=======================================================");
  console.log(" USUARIOS CREADOS Y APROBADOS SATISFACTORIAMENTE");
  console.log("=======================================================");
  console.log(" 1. TIENDA / RESTAURANTE:");
  console.log(`   - Usuario:    ${ownerUser.username}`);
  console.log(`   - Contraseña: ${storePassword}`);
  console.log(`   - Rol:        ${ownerUser.role}`);
  console.log(`   - Local:      ${restaurant.name} (/r/${restaurant.slug})`);
  console.log(`   - Estado:     APROBADO Y ACTIVO (Acceso a POS, Cocina, Reportes)`);
  console.log("-------------------------------------------------------");
  console.log(" 2. REPARTIDOR / MOTORIZADO:");
  console.log(`   - Usuario:    ${driverUser.username}`);
  console.log(`   - Contraseña: ${driverPassword}`);
  console.log(`   - Rol:        ${driverUser.role}`);
  console.log(`   - Vehículo:   ${driverUser.vehicleType} (${driverUser.vehiclePlate})`);
  console.log(`   - Billetera:  $${driverUser.walletBalance.toFixed(2)}`);
  console.log(`   - Estado:     APROBADO Y ACTIVO (Acceso a /delivery)`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error(" Error creando usuarios:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
