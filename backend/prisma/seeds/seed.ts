import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

interface RestaurantSeedData {
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  description: string;
  address: string;
  phone: string;
  lat?: number;
  lng?: number;
  categoryNames: string[];
  commissionPct: number;
  menuCategories: Array<{
    name: string;
    description: string;
    items: Array<{
      name: string;
      description: string;
      variants: Array<{ name: string; price: number }>;
    }>;
  }>;
}

const RESTAURANTS_DATA: RestaurantSeedData[] = [
  {
    name: "Maku Sushi",
    slug: "makushi",
    logo: "/logos/maku-sushi.svg",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    description: "Auténtica gastronomía japonesa, sushi rolls artesanales, ramen tradicional y cocina fusión en Loja.",
    address: "Calle Rocafuerte y Mariana de Jesús, Loja, Ecuador",
    phone: "0983534850",
    lat: -3.992677,
    lng: -79.202349,
    categoryNames: ["Sushi", "Comida rápida", "Saludable", "Bebidas", "Postres"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "🍱 Tablas & Combos de Sushi",
        description: "Las mejores combinaciones de rolls, nigiris y tempuras para compartir",
        items: [
          {
            name: "Tabla Maku Premium (30 Bocados)",
            description: "10 California Special + 10 Maku Volcano + 10 Ebi Furai Crunch con salsas teriyaki y acevichada",
            variants: [
              { name: "Tabla 30 Bocados", price: 22.50 },
              { name: "Tabla 30 Bocados + 2 Bebidas", price: 24.50 }
            ]
          },
          {
            name: "Barco Imperial Maku (50 Bocados)",
            description: "50 piezas de autor con sashimi de salmón fresco, nigiris flameados, tempuras y rolls especiales",
            variants: [
              { name: "Barco 50 Piezas", price: 35.00 }
            ]
          },
          {
            name: "Combo Dúo Lovers (20 Bocados)",
            description: "10 Roll Tentación de Maracuyá + 10 Dragon Roll con langostino crocante y láminas de palta",
            variants: [
              { name: "Combo Dúo 20 Bocados", price: 16.50 }
            ]
          },
          {
            name: "Bento Box Individual Ejecutivo",
            description: "12 bocados de sushi a elección + 3 gyozas al vapor + ensalada fresca con aderezo sésamo y té frío",
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
            variants: [
              { name: "10 Bocados", price: 8.90 },
              { name: "15 Bocados", price: 12.50 }
            ]
          },
          {
            name: "Dragon Roll Especial (10 Bocados)",
            description: "Langostino tempura y queso crema, cubierto de láminas de aguacate maduro, sésamo tostado y salsa teriyaki",
            variants: [
              { name: "10 Bocados", price: 7.90 }
            ]
          },
          {
            name: "Acevichado Roll Fusión (10 Bocados)",
            description: "Cangrejo crocante y palta por dentro, bañado en cremosa salsa acevichada peruana-japonesa y togarashi",
            variants: [
              { name: "10 Bocados", price: 7.80 }
            ]
          },
          {
            name: "Salmón Crispy Flameado (10 Bocados)",
            description: "Salmón fresco sellado al soplete por fuera con queso crema, cebollín y salsa tártara japonesa",
            variants: [
              { name: "10 Bocados", price: 8.50 }
            ]
          },
          {
            name: "California Special Roll (10 Bocados)",
            description: "Cangrejo kanikama, pepino y aguacate con masago naranja y ajonjolí tostado",
            variants: [
              { name: "10 Bocados", price: 6.90 }
            ]
          },
          {
            name: "Roll Veggie Zen (10 Bocados)",
            description: "Palmito, espárragos tempura, palta fresca y reducción artesanal de maracuyá",
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
            variants: [
              { name: "Tazón Grande", price: 8.90 },
              { name: "Tazón + Porción Gyozas", price: 11.50 }
            ]
          },
          {
            name: "Chicken Teriyaki Bowl",
            description: "Pechuga de pollo marinada en salsa teriyaki de la casa con arroz jazmín al vapor y vegetales salteados al wok",
            variants: [
              { name: "Plato Completo", price: 6.50 }
            ]
          },
          {
            name: "Yakisoba Mixto al Wok",
            description: "Fideos japoneses salteados al wok con lomo fino, camarones y verduras crocantes en salsa yakisoba",
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
            variants: [
              { name: "6 Unidades", price: 4.50 },
              { name: "12 Unidades", price: 8.00 }
            ]
          },
          {
            name: "Edamames Salteados con Sal Marina",
            description: "Vainas de soja tiernas al vapor con toque de aceite de sésamo y sal marina",
            variants: [
              { name: "Porción 200g", price: 3.50 }
            ]
          },
          {
            name: "Ebi Furai Crocantes (6u)",
            description: "Langostinos gigantes empanizados en panko japonés con salsa tártara y limón",
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
            variants: [
              { name: "Vaso 450ml", price: 2.50 }
            ]
          },
          {
            name: "Mochis Japoneses Variados (3u)",
            description: "Masa tradicional de arroz glutinoso rellena de helado de té verde matcha, chocolate y fresa",
            variants: [
              { name: "Orden de 3 Mochis", price: 4.00 }
            ]
          },
          {
            name: "Cerveza Japonesa Sapporo Premium 330ml",
            description: "Auténtica cerveza japonesa lager importada, ligera y refrescante",
            variants: [
              { name: "Botella 330ml", price: 4.50 }
            ]
          },
          {
            name: "Gaseosa 350ml",
            description: "Coca Cola Clásica, Coca Cola Zero, Sprite o Fanta",
            variants: [
              { name: "Lata 350ml", price: 1.50 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "El Artesanal Resto-Bar",
    slug: "el-artesanal",
    logo: "/logos/el-artesanal.svg",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    description: "Auténticas hamburguesas artesanales, cecina lojana y costillas BBQ en Loja.",
    address: "Calle 24 de Mayo y Mercadillo, Loja, Ecuador",
    phone: "0987654321",
    lat: -3.9965,
    lng: -79.2030,
    categoryNames: ["Hamburguesas", "BBQ", "Comida rápida", "Bebidas"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Hamburguesas Artesanales Lojanas",
        description: "Carne 100% artesanal a la parrilla con pan brioche horneado en Loja",
        items: [
          {
            name: "Hamburguesa Cecina Lojana",
            description: "Carne de res angus 200g, láminas de cecina tradicional lojana ahumada, queso manaba y chimichurri",
            variants: [
              { name: "Simple 200g", price: 7.90 },
              { name: "Doble Carne + Cecina Extra", price: 9.90 },
            ],
          },
          {
            name: "Hamburguesa Artesanal Clásica",
            description: "Carne madurada 200g, queso cheddar fundido, cebolla caramelizada, tocino y salsa artesanal",
            variants: [
              { name: "Simple", price: 6.50 },
              { name: "En Combo (Papas Rústicas + Cola)", price: 8.50 },
            ],
          },
          {
            name: "Monster Artesanal Doble",
            description: "Doble carne de 180g, tocino crocante, queso mozzarella y aros de cebolla crocantes",
            variants: [{ name: "Gigante", price: 9.50 }],
          },
        ],
      },
      {
        name: "Costillas BBQ & Picadas",
        description: "Asadas lentamente con madera y salsa BBQ de la casa",
        items: [
          {
            name: "Costillas BBQ al Horno",
            description: "Costillar de cerdo bañado en salsa BBQ artesanal con papas rústicas y ensalada coleslaw",
            variants: [
              { name: "Media Porción", price: 7.50 },
              { name: "Costillar Completo", price: 11.90 },
            ],
          },
          {
            name: "Picada Artesanal Loja",
            description: "Cecina lojana, chorizo artesanal, alitas BBQ, patacones crocantes y queso frito",
            variants: [{ name: "Para 2 Personas", price: 13.90 }],
          },
        ],
      },
      {
        name: "Bebidas & Cervezas",
        description: "Bebidas frías y artesanales",
        items: [
          {
            name: "Cerveza Artesanal Lojana Rubia",
            description: "Botella 330ml de cebada malteada local con notas cítricas",
            variants: [{ name: "Botella 330ml", price: 3.50 }],
          },
          {
            name: "Limonada Imperial con Menta",
            description: "Jugo natural de limón con hojas de menta fresca y hielo granizado 450ml",
            variants: [{ name: "Vaso 450ml", price: 2.00 }],
          },
        ],
      },
    ],
  },
  {
    name: "Goeats de Prueba",
    slug: "prueba",
    logo: "/logos/prueba.svg",
    coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    description: "Restaurante oficial de demostración y pruebas integrales de GoEats.",
    address: "Av. Amazonas N24-15 y Foch, Quito, Ecuador",
    phone: "0999999999",
    lat: -0.1807,
    lng: -78.4842,
    categoryNames: ["Pizza", "Bebidas", "Comida rápida"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Pizzas Artesanales",
        description: "Al horno con masa madre e ingredientes selectos",
        items: [
          {
            name: "Pizza Pepperoni",
            description: "Queso mozzarella, salsa de tomate y abundante pepperoni premium",
            variants: [
              { name: "Personal", price: 8.50 },
              { name: "Familiar", price: 15.00 },
            ],
          },
          {
            name: "Pizza Margherita",
            description: "Queso mozzarella fior di latte, salsa de tomate y albahaca fresca",
            variants: [
              { name: "Personal", price: 7.50 },
              { name: "Familiar", price: 13.50 },
            ],
          },
        ],
      },
      {
        name: "Bebidas",
        description: "Bebidas frías y refrescos",
        items: [
          {
            name: "Coca Cola",
            description: "Lata fría de 350ml",
            variants: [{ name: "Lata 350ml", price: 1.50 }],
          },
        ],
      },
    ],
  },
  {
    name: "KFC",
    slug: "kfc",
    logo: "/logos/kfc.svg",
    coverImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
    description: "El mejor y más crujiente pollo frito con receta secreta de 11 hierbas y especias.",
    address: "Av. Orellana y Amazonas, Quito",
    phone: "02-224488",
    lat: -0.1834,
    lng: -78.4820,
    categoryNames: ["Pollo", "Comida rápida", "Alitas"],
    commissionPct: 12.0,
    menuCategories: [
      {
        name: "Buckets & Combos",
        description: "Para compartir o disfrutar en familia",
        items: [
          {
            name: "Mega Bucket 8 Presas",
            description: "8 presas de pollo crujiente + 2 papas medianas + 2 ensaladas",
            variants: [{ name: "Combo Completo", price: 14.99 }],
          },
          {
            name: "Combo Twister Clásico",
            description: "Wrap de tiras de pechuga crujiente, lechuga, tomate y salsa especial + papas + gaseosa",
            variants: [{ name: "Combo Normal", price: 5.99 }],
          },
        ],
      },
      {
        name: "Alitas & Snacks",
        description: "Crujientes y picantes",
        items: [
          {
            name: "Alitas Hot Wings (6u)",
            description: "6 alitas bañadas en condimento picante con salsa a elección",
            variants: [{ name: "6 Unidades", price: 4.50 }],
          },
          {
            name: "Popcorn Chicken Gigante",
            description: "Bocados 100% pechuga de pollo empanizados y dorados",
            variants: [{ name: "Caja Gigante", price: 3.75 }],
          },
          {
            name: "Papas Fritas Grandes",
            description: "Papas fritas corte clásico con toque de sal marina",
            variants: [{ name: "Grande", price: 2.25 }],
          },
        ],
      },
    ],
  },
  {
    name: "Burger King® Orellana",
    slug: "burger-king",
    logo: "/logos/burger-king.svg",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    description: "Hamburguesas 100% hechas a la parrilla con sabor inigualable.",
    address: "Av. Francisco de Orellana 123, Quito",
    phone: "02-998877",
    lat: -0.1812,
    lng: -78.4795,
    categoryNames: ["Hamburguesas", "Comida rápida"],
    commissionPct: 12.0,
    menuCategories: [
      {
        name: "Hamburguesas a la Parrilla",
        description: "Carne 100% de res asada al fuego",
        items: [
          {
            name: "Whopper Doble con Queso",
            description: "Dos carnes a la parrilla, queso americano, lechuga, tomate, mayonesa y pepinillos",
            variants: [
              { name: "Solo Hamburguesa", price: 7.50 },
              { name: "En Combo (Papas + Cola)", price: 9.80 },
            ],
          },
          {
            name: "Hamburguesa Rodeo BBQ",
            description: "Carne a la parrilla, aros de cebolla crocantes y salsa BBQ dulce",
            variants: [
              { name: "Solo", price: 4.99 },
              { name: "En Combo", price: 6.99 },
            ],
          },
          {
            name: "King de Pollo Crujiente",
            description: "Pechuga de pollo empanizada en pan con ajonjolí y lechuga fresca",
            variants: [{ name: "Individual", price: 5.25 }],
          },
        ],
      },
      {
        name: "Acompañamientos & Postres",
        description: "Complementa tu combo favorito",
        items: [
          {
            name: "Aros de Cebolla King",
            description: "Aros de cebolla dorados y crocantes con salsa especial",
            variants: [{ name: "Medianos", price: 2.50 }],
          },
          {
            name: "Sundae de Chocolate",
            description: "Helado cremoso con sirope de chocolate y trocitos de maní",
            variants: [{ name: "Vaso", price: 1.75 }],
          },
        ],
      },
    ],
  },
  {
    name: "Pollo Campero",
    slug: "pollo-campero",
    logo: "/logos/pollo-campero.svg",
    coverImage: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&auto=format&fit=crop&q=80",
    description: "Sabor tierno, jugoso y crujiente que une a la familia.",
    address: "Centro Comercial El Recreo, Quito",
    phone: "02-556677",
    lat: -0.2482,
    lng: -78.5140,
    categoryNames: ["Pollo", "Comida rápida"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Combos y Banquetes",
        description: "Pollo tradicional y extra crujiente",
        items: [
          {
            name: "Banquete Campero 10 Piezas",
            description: "10 piezas de pollo tierno y crujiente + 3 guarniciones familiares",
            variants: [{ name: "Familiar", price: 16.50 }],
          },
          {
            name: "Sándwich Campero Crujiente",
            description: "Pechuga empanizada, pepinillos y aderezo especial en pan brioche",
            variants: [{ name: "Individual", price: 4.99 }],
          },
        ],
      },
      {
        name: "Entradas",
        description: "Para abrir el apetito",
        items: [
          {
            name: "Empanadas de Pollo (3u)",
            description: "Rellenas de pollo desmechado sazonado a la perfección",
            variants: [{ name: "Orden de 3", price: 3.25 }],
          },
          {
            name: "Papas Camperas",
            description: "Papas sazonadas con especias exclusivas Campero",
            variants: [{ name: "Porción", price: 2.00 }],
          },
        ],
      },
    ],
  },
  {
    name: "TropiBurger",
    slug: "tropiburger",
    logo: "/logos/tropiburger.svg",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    description: "Las hamburguesas ecuatorianas con más tradición, piña asada y salsas caseras.",
    address: "Av. de los Shyris y Naciones Unidas, Quito",
    phone: "02-334455",
    lat: -0.1765,
    lng: -78.4792,
    categoryNames: ["Hamburguesas", "Comida rápida"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Hamburguesas Clásicas & Especiales",
        description: "Sabor tropical tradicional",
        items: [
          {
            name: "TropiEspecial con Piña y Tocineta",
            description: "Carne de res, rodaja de piña asada, queso derretido, tocino y salsa golf",
            variants: [
              { name: "Simple", price: 5.50 },
              { name: "Doble Carne", price: 6.75 },
            ],
          },
          {
            name: "TropiBurger Clásica",
            description: "Carne jugosa, lechuga, tomate, cebolla caramelizada y papas hilo",
            variants: [{ name: "Clásica", price: 4.80 }],
          },
        ],
      },
      {
        name: "Batidos y Papas",
        description: "Los mejores acompañamientos",
        items: [
          {
            name: "Papas Rústicas con Queso Cheddar",
            description: "Papas con cáscara cubiertas de queso cheddar fundido y tocino picado",
            variants: [{ name: "Grande", price: 2.80 }],
          },
          {
            name: "Milkshake de Vainilla",
            description: "Batido cremoso de helado con crema chantilly",
            variants: [{ name: "400ml", price: 2.50 }],
          },
        ],
      },
    ],
  },
  {
    name: "Papa John's Pizza",
    slug: "papa-johns",
    logo: "/logos/papa-johns.svg",
    coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    description: "Mejores Ingredientes. Mejor Pizza. Masa fresca nunca congelada.",
    address: "Av. Interoceánica, Cumbayá",
    phone: "02-887766",
    lat: -0.2015,
    lng: -78.4350,
    categoryNames: ["Pizza", "Italiana"],
    commissionPct: 12.0,
    menuCategories: [
      {
        name: "Pizzas Tradicionales",
        description: "Con masa original e ingredientes frescos",
        items: [
          {
            name: "Pizza Super Pepperoni",
            description: "Doble porción de pepperoni y extra queso mozzarella sobre salsa de tomate dulce",
            variants: [
              { name: "Mediana (8 Porciones)", price: 12.99 },
              { name: "Familiar (12 Porciones)", price: 17.99 },
            ],
          },
          {
            name: "Pizza Cuatro Quesos & Ajo",
            description: "Mezcla de mozzarella, parmesano, queso azul y fontina con borde de ajo",
            variants: [
              { name: "Mediana", price: 13.50 },
              { name: "Familiar", price: 18.50 },
            ],
          },
        ],
      },
      {
        name: "Acompañamientos",
        description: "Imprescindibles para tu pizza",
        items: [
          {
            name: "Palitos de Ajo con Salsa Especial",
            description: "Palitos horneados bañados en mantequilla de ajo con salsa Garlic Dipping",
            variants: [{ name: "Orden 8u", price: 3.99 }],
          },
          {
            name: "Cheesesticks con Queso Relleno",
            description: "Masa horneada rellena de queso derretido con dip marinara",
            variants: [{ name: "Orden", price: 4.50 }],
          },
        ],
      },
    ],
  },
  {
    name: "Sushi Tokyo Express",
    slug: "sushi-tokyo",
    logo: "/logos/sushi-tokyo.svg",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    description: "Rolls de sushi artesanales preparados al momento con pescado fresco.",
    address: "Av. Eloy Alfaro y Portugal, Quito",
    phone: "099887766",
    lat: -0.1820,
    lng: -78.4760,
    categoryNames: ["Sushi", "China", "Saludable"],
    commissionPct: 15.0,
    menuCategories: [
      {
        name: "Rolls Clásicos & Especiales",
        description: "Elaborados con alga nori y arroz japonés de primera",
        items: [
          {
            name: "Combo California Roll",
            description: "12 bocados de cangrejo kanikama, aguacate y pepino cubierto de ajonjolí tostado",
            variants: [{ name: "12 Bocados", price: 8.50 }],
          },
          {
            name: "Roll Tempura de Salmón",
            description: "Roll frito crujiente relleno de salmón fresco, queso crema y cebollín con salsa teriyaki",
            variants: [{ name: "10 Bocados", price: 9.90 }],
          },
          {
            name: "Geishas de Atún y Aguacate",
            description: "Láminas finas de atún fresco rellenas de queso crema y palta con reducción de soya",
            variants: [{ name: "6 Unidades", price: 6.50 }],
          },
        ],
      },
      {
        name: "Entradas Japonesas",
        description: "Bocados tradicionales orientales",
        items: [
          {
            name: "Gyozas al Vapor",
            description: "Empanaditas japonesas rellenas de cerdo y verduras con salsa ponzu",
            variants: [{ name: "6 Unidades", price: 4.20 }],
          },
        ],
      },
    ],
  },
  {
    name: "Salad Green & Co",
    slug: "salad-green",
    logo: "/logos/salad-green.svg",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    description: "Comida saludable, ingredientes orgánicos, bowls nutritivos y smoothies naturales.",
    address: "Av. República del Salvador, Quito",
    phone: "099112233",
    lat: -0.1802,
    lng: -78.4815,
    categoryNames: ["Saludable", "Sandwiches"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Ensaladas & Bowls",
        description: "Frescos, energéticos y deliciosos",
        items: [
          {
            name: "Ensalada César con Pollo a la Plancha",
            description: "Lechuga romana orgánica, pechuga a la parrilla, croutons integrales y aderezo césar light",
            variants: [{ name: "Plato Grande", price: 6.90 }],
          },
          {
            name: "Bowl Quinoa & Aguacate",
            description: "Quinoa tricolor, aguacate, garbanzos crocantes, espinaca baby y vinagreta de limón",
            variants: [{ name: "Bowl Nutritivo", price: 7.50 }],
          },
        ],
      },
      {
        name: "Wraps & Bebidas Detox",
        description: "Opciones ligeras y refrescantes",
        items: [
          {
            name: "Wrap de Atún y Vegetales",
            description: "Tortilla integral con atún al agua, tomate cherry, maíz dulce y yogur griego",
            variants: [{ name: "Wrap Completo", price: 5.20 }],
          },
          {
            name: "Smoothie Verde Detox",
            description: "Manzana verde, espinaca, apio, pepino y jugo de piña natural 450ml",
            variants: [{ name: "Vaso 450ml", price: 3.20 }],
          },
        ],
      },
    ],
  },
  {
    name: "Tacos & Tequila MX",
    slug: "tacos-mx",
    logo: "/logos/tacos-mx.svg",
    coverImage: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80",
    description: "Auténtica taquería mexicana con tortillas de maíz nixtamalizado y salsas caseras.",
    address: "La Mariscal, Calle Foch y Reina Victoria, Quito",
    phone: "02-445566",
    lat: -0.1980,
    lng: -78.4910,
    categoryNames: ["Mexicana", "Comida rápida"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Tacos & Quesadillas",
        description: "Servidos con cilantro, cebollita y limones",
        items: [
          {
            name: "Orden de Tacos al Pastor (3u)",
            description: "Carne de cerdo adobada al trompo con piña asada, cebolla y cilantro en tortilla de maíz",
            variants: [{ name: "Orden 3 Tacos", price: 5.99 }],
          },
          {
            name: "Quesadilla Gigante de Carne Asada",
            description: "Tortilla grande rellena de queso oaxaca fundido y filete de res con guacamole",
            variants: [{ name: "Gigante", price: 6.50 }],
          },
        ],
      },
      {
        name: "Antojitos Mexicanos",
        description: "Para picar y compartir",
        items: [
          {
            name: "Nachos Supremos con Guacamole",
            description: "Totopos crocantes bañados en queso fundido, frijoles refritos, pico de gallo y jalapeños",
            variants: [{ name: "Plato Familiar", price: 5.20 }],
          },
          {
            name: "Burrito Especial de Pollo",
            description: "Tortilla de trigo rellena de arroz mexicano, frijoles, pechuga marinada y crema agria",
            variants: [{ name: "Burrito Grande", price: 6.00 }],
          },
        ],
      },
    ],
  },
  {
    name: "Sweet Bakery & Café",
    slug: "sweet-bakery",
    logo: "/logos/sweet-bakery.svg",
    coverImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    description: "Repostería fina, tortas artesanales y café de especialidad de altura.",
    address: "Av. González Suárez 456, Quito",
    phone: "099556677",
    lat: -0.1890,
    lng: -78.4750,
    categoryNames: ["Postres", "Sandwiches"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Pastelería & Tortas",
        description: "Hechas con ingredientes de repostería gourmet",
        items: [
          {
            name: "Torta Tres Leches Casera",
            description: "Bizcochuelo bañado en salsa de tres leches con canela y merengue tostado",
            variants: [{ name: "Porción", price: 3.50 }],
          },
          {
            name: "Cheesecake de Frutos Rojos",
            description: "Base crujiente de galleta con crema de queso suave y mermelada de moras y frambuesas",
            variants: [{ name: "Porción", price: 3.80 }],
          },
        ],
      },
      {
        name: "Cafetería & Panadería",
        description: "Café recién tostado y panes calientes",
        items: [
          {
            name: "Croissant de Mantequilla Francés",
            description: "Hojaldre ligero y dorado horneado todos los días",
            variants: [{ name: "Unidad", price: 1.80 }],
          },
          {
            name: "Café Latte Especial",
            description: "Espresso doble con leche cremada y arte latte",
            variants: [{ name: "Taza 300ml", price: 2.20 }],
          },
        ],
      },
    ],
  },
  {
    name: "Arroz Relleno & Chifa Imperial",
    slug: "arroz-relleno",
    logo: "/logos/arroz-relleno.svg",
    coverImage: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80",
    description: "Especialistas en arroz relleno al wok, chaulafán y comida chifa al instante.",
    address: "Av. 10 de Agosto y Colón, Quito",
    phone: "02-778899",
    lat: -0.1950,
    lng: -78.4930,
    categoryNames: ["China", "Comida rápida"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Platos Fuertes al Wok",
        description: "Cocinados a fuego vivo con el auténtico sazón oriental",
        items: [
          {
            name: "1 - ARROZ RELLENO (POLLO)",
            description: "Arroz salteado con pechuga de pollo, tortilla de huevo, cebollín y verduras al wok",
            variants: [{ name: "Plato Completo", price: 3.90 }],
          },
          {
            name: "Chaulafán Especial Familiar",
            description: "Arroz salteado con camarón, chancho asado, pollo, verduras y salsa de soya oscura",
            variants: [{ name: "Familiar", price: 8.50 }],
          },
          {
            name: "Tallarín Saltado de Carne",
            description: "Fideos al dente salteados con lomo de res, cebolla morada, tomate y pimiento",
            variants: [{ name: "Porción Individual", price: 5.50 }],
          },
        ],
      },
      {
        name: "Entradas",
        description: "Bocados chinos crocantes",
        items: [
          {
            name: "Wantan Frito (10u) con Salsa Agridulce",
            description: "Crocantes masas rellenas acompañadas de salsa tamarindo agridulce",
            variants: [{ name: "10 Unidades", price: 3.50 }],
          },
        ],
      },
    ],
  },
  {
    name: "Parrilladas El Gaucho",
    slug: "el-gaucho",
    logo: "/logos/el-gaucho.svg",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    description: "Cortes de carne angus a la brasa, embutidos artesanales y chimichurri tradicional.",
    address: "Av. Brasil y Granda Centeno, Quito",
    phone: "02-991122",
    lat: -0.1720,
    lng: -78.4900,
    categoryNames: ["BBQ"],
    commissionPct: 12.0,
    menuCategories: [
      {
        name: "Cortes & Parrilladas",
        description: "Asados con carbón de quebracho a punto perfecto",
        items: [
          {
            name: "Parrillada Completa para Dos",
            description: "Bife de chorizo, pechuga de pollo, chuleta de cerdo, chorizo parrillero, morcilla y papas",
            variants: [{ name: "Para 2 Personas", price: 18.90 }],
          },
          {
            name: "Bife de Chorizo Angus 350g",
            description: "Corte jugoso a la parrilla con sal en grano y chimichurri",
            variants: [{ name: "350 Gramos", price: 12.50 }],
          },
        ],
      },
      {
        name: "Guarniciones",
        description: "Para complementar tus carnes",
        items: [
          {
            name: "Papas Asadas con Crema de Queso",
            description: "Papas cocidas a la brasa con toque de mantequilla y crema agria",
            variants: [{ name: "Porción", price: 3.00 }],
          },
        ],
      },
    ],
  },
  {
    name: "Picantería El Sabrosón",
    slug: "el-sabroson",
    logo: "/logos/el-sabroson.svg",
    coverImage: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
    description: "El auténtico encebollado manaba, ceviches frescos y platos típicos ecuatorianos.",
    address: "Av. América y Mariana de Jesús, Quito",
    phone: "099334455",
    lat: -0.1850,
    lng: -78.4980,
    categoryNames: ["Saludable"],
    commissionPct: 10.0,
    menuCategories: [
      {
        name: "Mariscos & Típicos",
        description: "Recetas tradicionales de la costa ecuatoriana",
        items: [
          {
            name: "Encebollado Mixto (Pescado y Camarón)",
            description: "Caldo espeso de albacora con yuca, camarones, cebolla curtida, chifles y canguil",
            variants: [{ name: "Plato Grande", price: 4.50 }],
          },
          {
            name: "Ceviche de Camarón Manaba",
            description: "Camarones frescos marinados en jugo de limón, naranja, cilantro y cebolla colorada",
            variants: [{ name: "Ceviche", price: 6.50 }],
          },
          {
            name: "Guatita Tradicional",
            description: "Guiso de mondongo en salsa de maní con papas, servido con arroz y aguacate",
            variants: [{ name: "Plato Completo", price: 4.00 }],
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Starting complete GoEats database seeding with all active restaurants...");

  // 1. Document Types (Ecuador SRI)
  const documentTypes = [
    { name: "FACTURA", code: "01" },
    { name: "NOTA DE VENTA", code: "02" },
    { name: "LIQUIDACION DE COMPRA", code: "03" },
    { name: "TICKET", code: "09" },
  ];
  for (const docType of documentTypes) {
    await prisma.documentType.upsert({
      where: { id: documentTypes.indexOf(docType) + 1 },
      update: { name: docType.name, code: docType.code },
      create: { id: documentTypes.indexOf(docType) + 1, name: docType.name, code: docType.code },
    });
  }

  // 2. Units of Measure
  const units = ["Unidad", "Kilo", "Gramo", "Litro", "Mililitro", "Libra", "Onza"];
  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { id: units.indexOf(unit) + 1 },
      update: { name: unit },
      create: { id: units.indexOf(unit) + 1, name: unit },
    });
  }

  // 3. Supply Categories
  const supplyCategories = ["Abarrotes", "Bebidas", "Carnes", "Verduras", "Lácteos", "Especias", "Otros"];
  for (const cat of supplyCategories) {
    await prisma.supplyCategory.upsert({
      where: { id: supplyCategories.indexOf(cat) + 1 },
      update: { name: cat },
      create: { id: supplyCategories.indexOf(cat) + 1, name: cat },
    });
  }

  // 4. SuperAdmin user
  const adminPassword = await bcrypt.hash("admin", SALT_ROUNDS);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      password: adminPassword,
      name: "Administrador del Sistema",
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      username: "admin",
      password: adminPassword,
      name: "Administrador del Sistema",
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 5. Motorizado demo user
  const driverPassword = await bcrypt.hash("motorizado", SALT_ROUNDS);
  await prisma.user.upsert({
    where: { username: "motorizado" },
    update: {
      password: driverPassword,
      name: "Carlos Repartidor Express",
      role: Role.MOTORIZADO,
      walletBalance: 0.0,
      maxDebtLimit: 50.0,
      isActive: true,
    },
    create: {
      username: "motorizado",
      password: driverPassword,
      name: "Carlos Repartidor Express",
      role: Role.MOTORIZADO,
      walletBalance: 0.0,
      maxDebtLimit: 50.0,
      isActive: true,
    },
  });

  // 6. SaaS Global Categories
  const globalCats = [
    { name: "Pollo", description: "Pollo frito, asado y crujiente" },
    { name: "Hamburguesas", description: "Hamburguesas a la parrilla y smash" },
    { name: "Pizza", description: "Pizzas artesanales y al horno" },
    { name: "Sushi", description: "Rolls de sushi y cocina japonesa" },
    { name: "Mexicana", description: "Tacos, burritos y quesadillas" },
    { name: "Saludable", description: "Ensaladas, bowls y comida fitness" },
    { name: "Postres", description: "Tortas, helados y repostería" },
    { name: "China", description: "Chifa, arroz relleno y tallarines" },
    { name: "BBQ", description: "Parrilladas y cortes de carne" },
    { name: "Comida rápida", description: "Combos rápidos y snacks" },
    { name: "Italiana", description: "Pastas y especialidades italianas" },
    { name: "Sandwiches", description: "Sándwiches y bocadillos calientes" },
    { name: "Bebidas", description: "Refrescos, cafés y batidos" },
  ];

  const catMap: Record<string, number> = {};
  for (const gc of globalCats) {
    let cat = await prisma.saaSCategory.findFirst({ where: { name: gc.name } });
    if (!cat) {
      cat = await prisma.saaSCategory.create({
        data: { name: gc.name, description: gc.description },
      });
    }
    catMap[gc.name] = cat.id;
  }

  // 7. Seed all 13 Restaurants with full details
  console.log(`Seeding ${RESTAURANTS_DATA.length} active restaurants...`);

  for (const restData of RESTAURANTS_DATA) {
    console.log(`  -> Processing restaurant: ${restData.name} (${restData.slug})`);

    const categoryIds = restData.categoryNames
      .map((cn) => catMap[cn])
      .filter((id) => Boolean(id));

    const restaurant = await prisma.restaurant.upsert({
      where: { slug: restData.slug },
      update: {
        name: restData.name,
        logo: restData.logo,
        coverImage: restData.coverImage,
        description: restData.description,
        address: restData.address,
        phone: restData.phone,
        mapLatitude: restData.lat ?? -0.1807,
        mapLongitude: restData.lng ?? -78.4842,
        isActive: true,
        qrOrderingEnabled: true,
        deliveryCommissionPercentage: restData.commissionPct,
        wifiSsid: `WiFi_${restData.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
        wifiPassword: `${restData.slug.replace(/[^a-z0-9]/g, "")}2026`,
        categories: {
          set: categoryIds.map((cid) => ({ id: cid })),
        },
      },
      create: {
        name: restData.name,
        slug: restData.slug,
        logo: restData.logo,
        coverImage: restData.coverImage,
        description: restData.description,
        address: restData.address,
        phone: restData.phone,
        mapLatitude: restData.lat ?? -0.1807,
        mapLongitude: restData.lng ?? -78.4842,
        isActive: true,
        qrOrderingEnabled: true,
        deliveryCommissionPercentage: restData.commissionPct,
        wifiSsid: `WiFi_${restData.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
        wifiPassword: `${restData.slug.replace(/[^a-z0-9]/g, "")}2026`,
        categories: {
          connect: categoryIds.map((cid) => ({ id: cid })),
        },
      },
    });

    // Create staff owner user
    const sanitizedSlug = restData.slug.replace(/[^a-z0-9]/g, "_");
    const ownerUsername = `${sanitizedSlug}_owner`;
    const ownerPassword = await bcrypt.hash("owner123", SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: ownerUsername },
      update: {
        password: ownerPassword,
        name: `Gerente ${restData.name}`,
        role: Role.RESTAURANT_OWNER,
        restaurantId: restaurant.id,
        isActive: true,
      },
      create: {
        username: ownerUsername,
        password: ownerPassword,
        name: `Gerente ${restData.name}`,
        role: Role.RESTAURANT_OWNER,
        restaurantId: restaurant.id,
        isActive: true,
      },
    });

    // Create Dining Area
    let area = await prisma.diningArea.findFirst({
      where: { restaurantId: restaurant.id, name: "Salón Principal" },
    });
    if (!area) {
      area = await prisma.diningArea.create({
        data: {
          name: "Salón Principal",
          restaurantId: restaurant.id,
        },
      });
    }

    // Create Tables if not present
    const tableCount = await prisma.table.count({ where: { diningAreaId: area.id } });
    if (tableCount === 0) {
      await prisma.table.createMany({
        data: [
          { number: "1", capacity: 4, status: "FREE", diningAreaId: area.id },
          { number: "2", capacity: 6, status: "FREE", diningAreaId: area.id },
          { number: "3", capacity: 2, status: "FREE", diningAreaId: area.id },
        ],
      });
    }

    // Create Production Area (Cocina)
    let prodArea = await prisma.productionArea.findFirst({
      where: { restaurantId: restaurant.id, name: "Cocina" },
    });
    if (!prodArea) {
      prodArea = await prisma.productionArea.create({
        data: {
          name: "Cocina",
          restaurantId: restaurant.id,
        },
      });
    }

    // Create Menu Categories and Items
    for (const menuCatData of restData.menuCategories) {
      let menuCat = await prisma.menuCategory.findFirst({
        where: { restaurantId: restaurant.id, name: menuCatData.name },
      });
      if (!menuCat) {
        menuCat = await prisma.menuCategory.create({
          data: {
            name: menuCatData.name,
            description: menuCatData.description,
            restaurantId: restaurant.id,
          },
        });
      }

      for (const itemData of menuCatData.items) {
        let menuItem = await prisma.menuItem.findFirst({
          where: { categoryId: menuCat.id, name: itemData.name },
        });
        if (!menuItem) {
          menuItem = await prisma.menuItem.create({
            data: {
              name: itemData.name,
              description: itemData.description,
              categoryId: menuCat.id,
              productionAreaId: prodArea.id,
            },
          });

          for (const variantData of itemData.variants) {
            await prisma.menuItemVariant.create({
              data: {
                name: variantData.name,
                price: variantData.price,
                menuItemId: menuItem.id,
              },
            });
          }
        }
      }
    }

    // Create Cash Register
    const reg = await prisma.cashRegister.findFirst({
      where: { restaurantId: restaurant.id, name: "Caja Principal POS" },
    });
    if (!reg) {
      await prisma.cashRegister.create({
        data: {
          name: "Caja Principal POS",
          restaurantId: restaurant.id,
          isActive: true,
        },
      });
    }

    // Default Customer Client
    const client = await prisma.client.findFirst({
      where: { restaurantId: restaurant.id, identification: "9999999999999" },
    });
    if (!client) {
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
    }
  }

  // 8. Delivery rates
  const existingRate = await prisma.deliveryRate.findFirst({ where: { isActive: true } });
  if (!existingRate) {
    await prisma.deliveryRate.create({
      data: {
        name: "Tarifa Estándar Urbana",
        basePrice: 1.0,
        pricePerKm: 0.5,
        costPerOrder: 0.5,
        plusDriverBonus: 0.1,
        isActive: true,
      },
    });
  }

  console.log("🎉 All 13 restaurants, logos, covers, menus and categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

