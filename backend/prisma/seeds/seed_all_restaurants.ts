import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciar la siembra de todos los restaurantes del agregador...");

  const restaurantsData = [
    {
      name: "KFC",
      slug: "kfc",
      logo: "https://images.unsplash.com/photo-1513639776629-7b61b0ac2313?w=120&auto=format&fit=crop&q=80",
      address: "Av. Orellana y Amazonas",
      phone: "02-224488",
      description: "El mejor pollo frito del mundo. ¡Receta Secreta y Crujiente!",
      coverImage: "https://images.unsplash.com/photo-1513639776629-7b61b0ac2313?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Combos Compartir",
          description: "Perfectos para disfrutar con amigos y familia",
          items: [
            {
              name: "Balde de 8 Presas",
              description: "8 riquísimas presas de pollo receta original o crispy, papas fritas familiares y refresco grande.",
              price: 14.99,
              variants: [{ name: "Normal", price: 14.99 }, { name: "Picante", price: 15.99 }]
            },
            {
              name: "Balde de 12 Presas",
              description: "12 presas de pollo, papas fritas familiares, ensalada familiar y gaseosa grande.",
              price: 19.99,
              variants: [{ name: "Normal", price: 19.99 }]
            }
          ]
        },
        {
          name: "Hamburguesas y Wraps",
          description: "La especialidad en pan o tortilla",
          items: [
            {
              name: "Kentucky Deluxe",
              description: "Filete de pechuga extra crujiente, queso cheddar, tocino, lechuga y mayonesa.",
              price: 5.50,
              variants: [{ name: "Simple", price: 5.50 }, { name: "En Combo", price: 7.50 }]
            },
            {
              name: "Twister Clásico",
              description: "Filetes de pechuga de pollo, lechuga, tomate y salsa especial envueltos en tortilla de trigo.",
              price: 4.50,
              variants: [{ name: "Simple", price: 4.50 }, { name: "En Combo", price: 6.50 }]
            }
          ]
        }
      ]
    },
    {
      name: "Burger King® Orellana",
      slug: "burger-king",
      logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80",
      address: "Av. Francisco de Orellana 123",
      phone: "02-998877",
      description: "A la parrilla sabe mejor. Hamburguesas 100% de res.",
      coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Whopper Family",
          description: "Nuestras icónicas hamburguesas a la parrilla",
          items: [
            {
              name: "Whopper con Queso",
              description: "Carne de res a la parrilla, queso derretido, jugosos tomates, lechuga fresca, mayonesa, kétchup y pepinillos.",
              price: 6.50,
              variants: [{ name: "Simple", price: 6.50 }, { name: "Doble", price: 8.50 }, { name: "En Combo", price: 9.00 }]
            },
            {
              name: "Mega XL Bacon Burger",
              description: "Doble carne a la parrilla, crujiente tocino, queso cheddar y salsa barbacoa.",
              price: 8.99,
              variants: [{ name: "Simple", price: 8.99 }, { name: "Combo", price: 11.49 }]
            }
          ]
        }
      ]
    },
    {
      name: "Pollo Campero",
      slug: "pollo-campero",
      logo: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=120&auto=format&fit=crop&q=80",
      address: "Centro Comercial El Recreo",
      phone: "02-556677",
      description: "Tierno, jugoso y crujiente. El sabor del pollo campero.",
      coverImage: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Pollo Frito Tradicional",
          description: "El auténtico pollo campero",
          items: [
            {
              name: "Combo Campero de 3 Presas",
              description: "3 presas de pollo, papas fritas, pan de ajo o tortilla y refresco.",
              price: 6.25,
              variants: [{ name: "Tradicional", price: 6.25 }, { name: "Extra Crujiente", price: 6.25 }]
            }
          ]
        }
      ]
    },
    {
      name: "TropiBurger",
      slug: "tropiburger",
      logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80",
      address: "Av. de los Shyris y Naciones Unidas",
      phone: "02-334455",
      description: "Las hamburguesas clásicas de siempre con un toque tropical.",
      coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Hamburguesas Clásicas",
          description: "La tradición de TropiBurger",
          items: [
            {
              name: "Tropi Queso",
              description: "Carne de res, queso cheddar derretido, lechuga, tomate y salsa Tropi.",
              price: 4.99,
              variants: [{ name: "Simple", price: 4.99 }, { name: "Combo", price: 6.99 }]
            }
          ]
        }
      ]
    },
    {
      name: "Papa John's Pizza",
      slug: "papa-johns",
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop&q=80",
      address: "Av. Interoceánica, Cumbayá",
      phone: "02-887766",
      description: "Mejores Ingredientes. Mejor Pizza.",
      coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Pizzas Especiales",
          description: "Nuestras recetas más solicitadas",
          items: [
            {
              name: "Pizza Super Pepperoni",
              description: "Doble pepperoni de alta calidad y abundante queso mozzarella sobre salsa de tomate premium.",
              price: 12.99,
              variants: [{ name: "Mediana", price: 12.99 }, { name: "Familiar", price: 18.99 }]
            },
            {
              name: "Pizza Hawaiana",
              description: "Jamón seleccionado, trozos piña dulce y doble queso mozzarella.",
              price: 11.50,
              variants: [{ name: "Mediana", price: 11.50 }, { name: "Familiar", price: 16.99 }]
            }
          ]
        }
      ]
    },
    {
      name: "Sushi Tokyo Express",
      slug: "sushi-tokyo",
      logo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120&auto=format&fit=crop&q=80",
      address: "Av. Eloy Alfaro",
      phone: "099887766",
      description: "Sushi fresco y fusión de comida japonesa al instante.",
      coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Rolls Especiales",
          description: "Rollos gourmet de sushi (10 bocados)",
          items: [
            {
              name: "California Roll",
              description: "Cangrejo, aguacate, pepino y cobertura de ajonjolí fresco tostado.",
              price: 7.50,
              variants: [{ name: "10 Bocados", price: 7.50 }]
            },
            {
              name: "Salmon Skin Roll",
              description: "Piel de salmón tostada crocante, aguacate, queso crema y salsa de anguila dulce.",
              price: 8.50,
              variants: [{ name: "10 Bocados", price: 8.50 }]
            }
          ]
        }
      ]
    },
    {
      name: "Salad Green & Co",
      slug: "salad-green",
      logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80",
      address: "Av. República del Salvador",
      phone: "099112233",
      description: "Comida saludable, fresca y ensaladas armadas a tu gusto.",
      coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Ensaladas Saludables",
          description: "Ingredientes premium seleccionados del día",
          items: [
            {
              name: "César con Pollo",
              description: "Lechuga romana fresca, tiras pechuga a la parrilla, croutones crujientes, queso parmesano y aderezo César.",
              price: 6.00,
              variants: [{ name: "Porción Normal", price: 6.00 }, { name: "Porción Grande", price: 8.00 }]
            }
          ]
        }
      ]
    },
    {
      name: "El Auténtico Taco Mexicano",
      slug: "taco-mexicano",
      logo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=120&auto=format&fit=crop&q=80",
      address: "Av. Real Audiencia",
      phone: "099443322",
      description: "Tacos tradicionales, quesadillas y antojitos 100% mexicanos.",
      coverImage: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80",
      categories: [
        {
          name: "Tacos y Antojitos",
          description: "El auténtico sabor de México",
          items: [
            {
              name: "Orden de 3 Tacos al Pastor",
              description: "Tacos con carne de cerdo marinada al pastor, cilantro, cebolla picada y piña en doble tortilla de maíz.",
              price: 5.50,
              variants: [{ name: "Orden 3 Tacos", price: 5.50 }]
            },
            {
              name: "Quesadilla Gigante de Pollo",
              description: "Gran tortilla de harina rellena de queso fundido, tiras de pollo y guacamole.",
              price: 6.50,
              variants: [{ name: "Porción Única", price: 6.50 }]
            }
          ]
        }
      ]
    }
  ];

  for (const item of restaurantsData) {
    // 1. Create or update restaurant
    console.log(`Guardando restaurante: ${item.name}...`);
    const rest = await prisma.restaurant.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        logo: item.logo,
        address: item.address,
        phone: item.phone,
        description: item.description,
        coverImage: item.coverImage,
        isActive: true,
        qrOrderingEnabled: true
      },
      create: {
        name: item.name,
        slug: item.slug,
        logo: item.logo,
        address: item.address,
        phone: item.phone,
        description: item.description,
        coverImage: item.coverImage,
        isActive: true,
        qrOrderingEnabled: true
      }
    });

    // 2. Create production areas for this restaurant
    const cocina = await prisma.productionArea.findFirst({
      where: { name: "Cocina", restaurantId: rest.id }
    }) || await prisma.productionArea.create({
      data: { name: "Cocina", restaurantId: rest.id }
    });

    // 3. Create Categories and Items
    for (const cat of item.categories) {
      const menuCat = await prisma.menuCategory.findFirst({
        where: { name: cat.name, restaurantId: rest.id }
      }) || await prisma.menuCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          restaurantId: rest.id
        }
      });

      for (const prod of cat.items) {
        const menuItem = await prisma.menuItem.findFirst({
          where: { name: prod.name, categoryId: menuCat.id }
        }) || await prisma.menuItem.create({
          data: {
            name: prod.name,
            description: prod.description,
            categoryId: menuCat.id,
            productionAreaId: cocina.id
          }
        });

        // Add variants
        for (const variant of prod.variants) {
          const existingVariant = await prisma.menuItemVariant.findFirst({
            where: { name: variant.name, menuItemId: menuItem.id }
          });
          if (!existingVariant) {
            await prisma.menuItemVariant.create({
              data: {
                name: variant.name,
                price: variant.price,
                menuItemId: menuItem.id
              }
            });
          }
        }
      }
    }
    console.log(`✅ Restaurante ${item.name} sembrado con éxito.`);
  }

  console.log("🎉 ¡Siembra de restaurantes del agregador finalizada!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
