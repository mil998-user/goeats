import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🍱 Seeding Maku Sushi with full menu, profile, tables and categories...");

  // Find or create Maku Sushi
  let maku = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { slug: "makushi" },
        { slug: "maku-sushi" },
        { name: { contains: "Maku" } }
      ]
    }
  });

  const faqs = [
    {
      question: "¿Tienen opciones vegetarianas o veganas?",
      answer: "Sí, disponemos de Rolls Veggie Zen con aguacate, pepino, espárragos tempura, palmito y salsa de maracuyá."
    },
    {
      question: "¿Cuál es el tiempo promedio de entrega a domicilio?",
      answer: "El tiempo estimado es de 25 a 35 minutos en toda la ciudad de Loja con empaques térmicos especiales para sushi."
    },
    {
      question: "¿Disponen de mesas y autoservicio QR en el local?",
      answer: "¡Sí! Puedes visitarnos en nuestro local en Rocafuerte y Mariana de Jesús, escanear el código QR de tu mesa y pedir directamente."
    }
  ];

  const profileData = {
    name: "Maku Sushi",
    slug: "makushi",
    logo: "/logos/maku-sushi.svg",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    description: "Auténtica gastronomía japonesa, sushi rolls artesanales, ramen tradicional y cocina fusión en Loja.",
    address: "Calle Rocafuerte y Mariana de Jesús, Loja, Ecuador",
    phone: "0983534850",
    reference: "Frente al Parque Infantil de Loja, sector céntrico",
    openingHours: "Lunes a Domingo: 12:00 p.m. - 11:00 p.m.",
    mapLatitude: -3.992677,
    mapLongitude: -79.202349,
    mapIframe: `<iframe src="https://maps.google.com/maps?q=-3.992677,-79.202349&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`,
    wifiSsid: "MakuSushi_5G",
    wifiPassword: "makusushiloja",
    qrOrderingEnabled: true,
    isActive: true,
    deliveryCommissionPercentage: 10.0,
    faqsJson: JSON.stringify(faqs)
  };

  if (!maku) {
    maku = await prisma.restaurant.create({
      data: profileData
    });
    console.log(`Created new Maku restaurant with ID ${maku.id}`);
  } else {
    maku = await prisma.restaurant.update({
      where: { id: maku.id },
      data: profileData
    });
    console.log(`Updated Maku restaurant ID ${maku.id}`);
  }

  // Link categories (Sushi, Asiática, Bebidas, etc.)
  const saasCats = await prisma.saaSCategory.findMany();
  const targetCatNames = ["Sushi", "Comida rápida", "Saludable", "Bebidas", "Postres"];
  const matchingCats = saasCats.filter((c: any) => targetCatNames.some(tc => c.name.toLowerCase().includes(tc.toLowerCase())));
  
  if (matchingCats.length > 0) {
    await prisma.restaurant.update({
      where: { id: maku.id },
      data: {
        categories: {
          set: matchingCats.map((c: any) => ({ id: c.id }))
        }
      }
    });
  }

  // Clean old menu categories to rebuild full fresh menu
  const oldCats = await prisma.menuCategory.findMany({
    where: { restaurantId: maku.id }
  });
  for (const cat of oldCats) {
    const items = await prisma.menuItem.findMany({ where: { categoryId: cat.id } });
    for (const item of items) {
      await prisma.orderItem.deleteMany({ where: { variant: { menuItemId: item.id } } });
      await prisma.menuItemVariant.deleteMany({ where: { menuItemId: item.id } });
      await prisma.menuItem.delete({ where: { id: item.id } });
    }
    await prisma.menuCategory.delete({ where: { id: cat.id } });
  }

  // Full Menu Data
  const MENU_DATA = [
    {
      name: "🍱 Tablas & Combos de Sushi",
      description: "Las mejores combinaciones de rolls, nigiris y tempuras para compartir",
      items: [
        {
          name: "Tabla Maku Premium (30 Bocados)",
          description: "10 California Special + 10 Maku Volcano + 10 Ebi Furai Crunch con salsas teriyaki y acevichada",
          image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Tabla 30 Bocados", price: 22.50 },
            { name: "Tabla 30 Bocados + 2 Bebidas", price: 24.50 }
          ]
        },
        {
          name: "Barco Imperial Maku (50 Bocados)",
          description: "50 piezas de autor con sashimi de salmón fresco, nigiris flameados, tempuras y rolls especiales",
          image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Barco 50 Piezas", price: 35.00 }
          ]
        },
        {
          name: "Combo Dúo Lovers (20 Bocados)",
          description: "10 Roll Tentación de Maracuyá + 10 Dragon Roll con langostino crocante y láminas de palta",
          image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Combo Dúo 20 Bocados", price: 16.50 }
          ]
        },
        {
          name: "Bento Box Individual Ejecutivo",
          description: "12 bocados de sushi a elección + 3 gyozas al vapor + ensalada fresca con aderezo sésamo y té frío",
          image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Bento Box Completo", price: 9.90 }
          ]
        }
      ]
    },
    {
      name: "🍣 Rolls Especiales & Fusión",
      description: "Rolls artesanales con pescado fresco, langostinos crocantes y salsas de autor",
      items: [
        {
          name: "Maku Volcano Roll (10 Bocados)",
          description: "Langostino crocante y queso crema por dentro, gratinado con tartar de salmón flameado al soplete y salsa unagi",
          image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 8.90 },
            { name: "15 Bocados", price: 12.50 }
          ]
        },
        {
          name: "Dragon Roll Especial (10 Bocados)",
          description: "Langostino tempura y queso crema, cubierto de láminas de aguacate maduro, sésamo tostado y salsa teriyaki",
          image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 7.90 }
          ]
        },
        {
          name: "Acevichado Roll Fusión (10 Bocados)",
          description: "Cangrejo crocante y palta por dentro, bañado en cremosa salsa acevichada peruana-japonesa y togarashi",
          image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 7.80 }
          ]
        },
        {
          name: "Salmón Crispy Flameado (10 Bocados)",
          description: "Salmón fresco sellado al soplete por fuera con queso crema, cebollín y salsa tártara japonesa",
          image: "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 8.50 }
          ]
        },
        {
          name: "California Special Roll (10 Bocados)",
          description: "Cangrejo kanikama, pepino y aguacate con masago naranja y ajonjolí tostado",
          image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 6.90 }
          ]
        },
        {
          name: "Roll Veggie Zen (10 Bocados)",
          description: "Palmito, espárragos tempura, palta fresca y reducción artesanal de maracuyá",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "10 Bocados", price: 5.90 }
          ]
        }
      ]
    },
    {
      name: "🍜 Ramen & Platos Calientes",
      description: "Sopas ramen japonesas tradicionales y bowls al wok",
      items: [
        {
          name: "Tonkotsu Ramen Maku",
          description: "Caldo concentrado de cerdo 12 horas, fideos ramen artesanales, chashu de cerdo tierno, huevo ajitsuke marinado, nori y cebollín",
          image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Tazón Grande", price: 8.90 },
            { name: "Tazón + Porción Gyozas", price: 11.50 }
          ]
        },
        {
          name: "Chicken Teriyaki Bowl",
          description: "Pechuga de pollo marinada en salsa teriyaki de la casa con arroz jazmín al vapor y vegetales salteados al wok",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Plato Completo", price: 6.50 }
          ]
        },
        {
          name: "Yakisoba Mixto al Wok",
          description: "Fideos japoneses salteados al wok con lomo fino, camarones y verduras crocantes en salsa yakisoba",
          image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Plato Grande", price: 7.50 }
          ]
        }
      ]
    },
    {
      name: "🥟 Entradas & Acompañamientos",
      description: "Bocados tradicionales para comenzar tu experiencia",
      items: [
        {
          name: "Gyozas de Cerdo & Camarón (6u)",
          description: "Empanaditas japonesas artesanales al vapor y doradas a la plancha con salsa ponzu cítrica",
          image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "6 Unidades", price: 4.50 },
            { name: "12 Unidades", price: 8.00 }
          ]
        },
        {
          name: "Edamames Salteados con Sal Marina",
          description: "Vainas de soja tiernas al vapor con toque de aceite de sésamo y sal marina",
          image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Porción 200g", price: 3.50 }
          ]
        },
        {
          name: "Ebi Furai Crocantes (6u)",
          description: "Langostinos gigantes empanizados en panko japonés con salsa tártara y limón",
          image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "6 Unidades", price: 5.90 }
          ]
        }
      ]
    },
    {
      name: "🍵 Bebidas & Postres Japoneses",
      description: "Bebidas frías, cervezas japonesas y mochis artesanales",
      items: [
        {
          name: "Té Helado Matcha con Menta",
          description: "Té verde japonés matcha natural con infusión de menta fresca y limón 450ml",
          image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Vaso 450ml", price: 2.50 }
          ]
        },
        {
          name: "Mochis Japoneses Variados (3u)",
          description: "Masa tradicional de arroz glutinoso rellena de helado de té verde matcha, chocolate y fresa",
          image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Orden de 3 Mochis", price: 4.00 }
          ]
        },
        {
          name: "Cerveza Japonesa Sapporo Premium 330ml",
          description: "Auténtica cerveza japonesa lager importada, ligera y refrescante",
          image: "https://images.unsplash.com/photo-1608270191850-c83177651036?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Botella 330ml", price: 4.50 }
          ]
        },
        {
          name: "Gaseosa 350ml",
          description: "Coca Cola Clásica, Coca Cola Zero, Sprite o Fanta",
          image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
          variants: [
            { name: "Lata 350ml", price: 1.50 }
          ]
        }
      ]
    }
  ];

  for (const catData of MENU_DATA) {
    const category = await prisma.menuCategory.create({
      data: {
        name: catData.name,
        description: catData.description,
        restaurantId: maku.id
      }
    });

    for (const itemData of catData.items) {
      const menuItem = await prisma.menuItem.create({
        data: {
          name: itemData.name,
          description: itemData.description,
          image: itemData.image,
          categoryId: category.id
        }
      });

      for (const varData of itemData.variants) {
        await prisma.menuItemVariant.create({
          data: {
            name: varData.name,
            price: varData.price,
            menuItemId: menuItem.id
          }
        });
      }
    }
  }

  // Dining Areas & Tables for QR Autoservice
  const existingAreas = await prisma.diningArea.findMany({ where: { restaurantId: maku.id } });
  if (existingAreas.length === 0) {
    await prisma.diningArea.create({
      data: {
        name: "Salón Principal Zen",
        restaurantId: maku.id,
        tables: {
          create: [
            { number: "Mesa 1", capacity: 4 },
            { number: "Mesa 2", capacity: 4 },
            { number: "Mesa 3", capacity: 4 },
            { number: "Mesa 4", capacity: 6 }
          ]
        }
      }
    });

    await prisma.diningArea.create({
      data: {
        name: "Barra Sushi & Teppanyaki",
        restaurantId: maku.id,
        tables: {
          create: [
            { number: "Barra 1", capacity: 2 },
            { number: "Barra 2", capacity: 2 },
            { number: "Barra 3", capacity: 2 }
          ]
        }
      }
    });

    await prisma.diningArea.create({
      data: {
        name: "Terraza Jardín Japonés",
        restaurantId: maku.id,
        tables: {
          create: [
            { number: "Terraza 1", capacity: 4 },
            { number: "Terraza 2", capacity: 6 }
          ]
        }
      }
    });

    console.log("Created 3 dining areas with 9 tables for Maku Sushi.");
  }

  console.log("✅ Maku Sushi successfully seeded with full menu, tables, profile, and categories!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
