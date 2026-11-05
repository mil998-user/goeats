import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba (Seed)...');

  // Limpiar datos existentes (Opcional, pero recomendado para desarrollo local si se quiere empezar fresco)
  // No borraremos todo, solo crearemos si no existe.

  // 1. Crear Restaurante de Prueba: "El Rincón del Sabor"
  let restaurant1 = await prisma.restaurant.findUnique({ where: { slug: 'el-rincon-del-sabor' } });
  
  if (!restaurant1) {
    restaurant1 = await prisma.restaurant.create({
      data: {
        name: 'El Rincón del Sabor',
        slug: 'el-rincon-del-sabor',
        description: 'La mejor comida tradicional con el sazón de casa. ¡Visítanos o pide a domicilio!',
        address: 'Av. Principal 123 y Calle Secundaria',
        phone: '0991234567',
        qrOrderingEnabled: true,
        isActive: true,
        coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop',
        logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop',
        openingHours: 'Lunes a Domingo de 12:00 a 22:00',
      }
    });
    console.log('✅ Restaurante creado:', restaurant1.name);
  } else {
    console.log('⚡ Restaurante', restaurant1.name, 'ya existe. Omitiendo creación.');
  }

  // 2. Crear Restaurante de Prueba 2: "Burger Master"
  let restaurant2 = await prisma.restaurant.findUnique({ where: { slug: 'burger-master' } });
  
  if (!restaurant2) {
    restaurant2 = await prisma.restaurant.create({
      data: {
        name: 'Burger Master',
        slug: 'burger-master',
        description: 'Las hamburguesas más jugosas de la ciudad. 100% carne de res.',
        address: 'Plaza Central, Local 4',
        phone: '0987654321',
        qrOrderingEnabled: true,
        isActive: true,
        coverImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop',
        logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop',
        openingHours: 'Martes a Domingo de 17:00 a 23:00',
      }
    });
    console.log('✅ Restaurante creado:', restaurant2.name);
  } else {
    console.log('⚡ Restaurante', restaurant2.name, 'ya existe. Omitiendo creación.');
  }

  // 3. Crear Categorías y Productos para Restaurante 1
  const categoriasR1 = await prisma.menuCategory.findMany({ where: { restaurantId: restaurant1.id } });
  
  if (categoriasR1.length === 0) {
    // Categoría: Platos Fuertes
    const fuertes = await prisma.menuCategory.create({
      data: {
        name: 'Platos Fuertes',
        description: 'Nuestros mejores cortes y especialidades',
        restaurantId: restaurant1.id,
        items: {
          create: [
            {
              name: 'Churrasco Ecuatoriano',
              description: 'Carne de res, arroz, papas fritas, huevo frito y ensalada.',
              image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2070&auto=format&fit=crop',
              variants: {
                create: [
                  { name: 'Normal', price: 6.50 },
                  { name: 'Especial (Extra Carne)', price: 8.50 },
                ]
              }
            },
            {
              name: 'Ceviche de Camarón',
              description: 'Tradicional ceviche con camarones frescos, limón y cebolla.',
              image: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?q=80&w=2070&auto=format&fit=crop',
              variants: {
                create: [
                  { name: 'Pequeño', price: 7.00 },
                  { name: 'Grande', price: 10.00 },
                ]
              }
            }
          ]
        }
      }
    });

    // Categoría: Bebidas
    const bebidas = await prisma.menuCategory.create({
      data: {
        name: 'Bebidas Frías',
        restaurantId: restaurant1.id,
        items: {
          create: [
            {
              name: 'Jugo Natural',
              description: 'Jugos de frutas de temporada (Mora, Naranja, Guanábana)',
              image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop',
              variants: {
                create: [
                  { name: 'Vaso', price: 1.50 },
                  { name: 'Jarra', price: 4.00 },
                ]
              }
            }
          ]
        }
      }
    });
    console.log('✅ Menú creado para:', restaurant1.name);
  }

  // 4. Crear Categorías y Productos para Restaurante 2 (Burger Master)
  const categoriasR2 = await prisma.menuCategory.findMany({ where: { restaurantId: restaurant2.id } });
  
  if (categoriasR2.length === 0) {
    await prisma.menuCategory.create({
      data: {
        name: 'Hamburguesas',
        restaurantId: restaurant2.id,
        items: {
          create: [
            {
              name: 'Classic Cheeseburger',
              description: '150g de carne de res, queso cheddar, lechuga, tomate y salsa de la casa.',
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop',
              variants: {
                create: [
                  { name: 'Simple', price: 5.00 },
                  { name: 'En Combo (Papas y Bebida)', price: 7.50 },
                ]
              }
            },
            {
              name: 'Bacon Doble Burger',
              description: 'Doble carne de res, doble queso, tocino crujiente y cebolla caramelizada.',
              image: 'https://images.unsplash.com/photo-1594212202875-5ebce4c0f8d7?q=80&w=1965&auto=format&fit=crop',
              variants: {
                create: [
                  { name: 'Sola', price: 8.00 },
                  { name: 'Combo', price: 10.50 },
                ]
              }
            }
          ]
        }
      }
    });
    console.log('✅ Menú creado para:', restaurant2.name);
  }

  // 5. Crear un usuario de prueba (Customer)
  const hashedPassword = await bcrypt.hash('123456', 10);
  let customerUser = await prisma.user.findUnique({ where: { username: 'juanperez' } });
  
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        username: 'juanperez',
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        password: hashedPassword,
        role: 'CUSTOMER',
      }
    });
    console.log('✅ Usuario cliente creado:', customerUser.username, '(Clave: 123456)');
  } else {
    console.log('⚡ Usuario', customerUser.username, 'ya existe.');
  }

  // 6. Crear un usuario de prueba (Dueño de Restaurante 1)
  let ownerUser = await prisma.user.findUnique({ where: { username: 'owner1' } });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        username: 'owner1',
        name: 'Dueño Rincón',
        email: 'owner@rincon.com',
        password: hashedPassword,
        role: 'RESTAURANT_OWNER',
        restaurantId: restaurant1.id,
      }
    });
    console.log('✅ Usuario dueño creado:', ownerUser.username, '(Clave: 123456)');
  }

  console.log('🎉 Carga de datos de prueba finalizada correctamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
