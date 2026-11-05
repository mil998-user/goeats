import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const username = "cliente_domicilio_demo";
const password = "GoEats123!";

async function main() {
  const hashedPassword = await bcrypt.hash(password, 10);
  const customer = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      name: "Cliente de Prueba",
      email: "cliente.domicilio.demo@goeats.app",
      phone: "0990001122",
      cedula: null,
      role: Role.CUSTOMER,
      isActive: true,
      restaurantId: null,
      deliveryAddress: null,
      deliveryLatitude: null,
      deliveryLongitude: null,
      deliveryFloorApartment: null,
      deliverySecondaryStreet: null,
      deliveryReferences: null,
    },
    create: {
      username,
      password: hashedPassword,
      name: "Cliente de Prueba",
      email: "cliente.domicilio.demo@goeats.app",
      phone: "0990001122",
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  console.log("Cuenta de prueba para completar el registro y guardar domicilio:");
  console.log(`Usuario: ${customer.username}`);
  console.log(`Contraseña: ${password}`);
  console.log("La dirección se reinició para volver a probar el flujo desde cero.");
}

main()
  .catch((error) => {
    console.error("No se pudo crear el cliente de prueba:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
