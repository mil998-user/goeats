# Manual de marca GoEats adaptado al frontend

Base: `Manual de marca - GOEATS.pdf` (entregado por la empresa).
Archivo en el código: `frontend/src/styles/brand.css`. Es la única fuente de colores, fuentes y logos; las pantallas usan sus variables y no escriben colores a mano.

## 1. Colores oficiales

| Color | Código | Variable | Uso en la interfaz |
|---|---|---|---|
| Rojo | `#d42518` | `--brand-red` | Acción principal: pedir, confirmar, guardar, enlaces importantes |
| Naranja | `#f86015` | `--brand-orange` | En proceso, en camino, avisos |
| Amarillo | `#ffca26` | `--brand-yellow` | Resaltar: contadores, etiquetas, selección sobre negro |
| Crema | `#f3e8cc` | `--brand-cream` | Fondos cálidos y bordes |
| Negro | `#000000` | `--brand-black` | Texto, menú activo, elementos fuertes |
| Blanco | `#ffffff` | `--brand-white` | Tarjetas, texto sobre rojo o negro |

Los tonos suaves (`--brand-cream-soft`, `--brand-red-tint`, etc.) son los mismos colores mezclados con blanco o negro, no colores nuevos.

Combinaciones legibles: blanco sobre rojo, negro sobre amarillo, amarillo sobre negro, negro sobre crema. No usar amarillo ni crema como texto sobre blanco.

Fuera del manual: el verde `#2ed573` se mantiene solo para "entregado / correcto", porque el manual no trae un color de éxito. Confirmar con la empresa.

### Estados de pedido

| Estado | Fondo | Texto |
|---|---|---|
| Pendiente (nuevo) | Amarillo suave | Negro |
| Preparando | Naranja suave | Naranja |
| Listo | Rojo suave | Rojo |
| En camino | Negro | Amarillo |
| Entregado | Verde suave | Verde |
| Cancelado | Gris suave | Gris |

Tipo de pedido: Mesa en negro sobre crema, Recoger en local en naranja, Domicilio en rojo.
Avisos informativos (antes azules o morados): negro sobre crema.

## 2. Tipografías

| Fuente | Pesos | Variable | Uso |
|---|---|---|---|
| TAN St. Canard | Display | `--brand-font-logo` | Palabra GOEATS y títulos grandes |
| More Sugar | Ultradelgada, Regular | `--brand-font-accent` | Frases con carácter: saludos, "gracias", pantallas vacías |
| Cocomat Pro | Ultradelgada, Regular, Negrita, Muy gruesa | `--brand-font-text` | Todo el texto del sistema |

Los archivos `.woff2` van en `frontend/public/fonts/` con estos nombres: `tan-st-canard`, `more-sugar-thin`, `more-sugar-regular`, `cocomat-pro-thin`, `cocomat-pro-regular`, `cocomat-pro-bold`, `cocomat-pro-heavy`. Son fuentes comerciales: se necesita la licencia para web. Mientras no estén, se usa la letra del sistema (San Francisco en iPhone y Mac).

## 3. Logo

Símbolo: boca abierta dibujada a mano, en cinco variantes (`frontend/public/brand/`):

| Archivo | Fondo recomendado |
|---|---|
| `boca-negra.png` | Blanco, crema, amarillo |
| `boca-amarilla.png` | Negro, rojo |
| `boca-roja.png` | Blanco, crema |
| `boca-naranja.png` | Blanco, crema, negro |
| `boca-crema.png` | Negro, rojo, naranja |

Falta: el logo con la palabra GOEATS en SVG y los íconos de la app (192 y 512 px) hechos con la boca.

## 4. Estilo de la interfaz

Limpio y fijo, tipo iOS, sin librerías de componentes genéricas (no Material UI ni Bootstrap):

- Tarjetas blancas sin borde, sombra suave, esquinas de 14 a 20 px.
- Botones en forma de pastilla, mínimo 44 px de alto.
- Campos con fondo crema, letra de 16 px (evita el zoom del iPhone).
- Ventanas con fondo de vidrio difuminado; en celular, hojas que suben desde abajo (`vaul`).
- Animaciones cortas con `motion`; se desactivan si el usuario pide reducir movimiento.

## 5. Pendiente con la empresa

1. Archivos de las fuentes y su licencia web.
2. Logo con la palabra GOEATS en SVG.
3. Confirmar el verde para estados correctos.

## Color en superficies (16/11)

La marca no va solo en letras y logos:

- Menu lateral y barra del celular: negro, con el enlace activo en amarillo y texto negro.
- Titulos de pantalla: letra del logo con marcador amarillo debajo (clase `brand-marker` para titulos de seccion).
- Tarjetas de resumen (`StatTile`): bloques amarillo, negro, rojo, naranja o crema con la boca del logo de fondo.
- Boton principal: rojo solido. Boton destacado: `yellow-btn` (amarillo con texto negro), por ejemplo los precios del catalogo.
- Banner de bienvenida del cliente (`brand-hero-band`): amarillo con toque naranja.
- Login con fondo amarillo; aviso de cocina en amarillo.
- Grises azulados genericos reemplazados por tonos crema y negro de la paleta. Un solo verde para "listo/entregado": #1e8f4e (pendiente de aprobar con la empresa).

## Pagina de inicio y app del cliente (16/11)

- Inicio (`components/LandingExperience.tsx` + `styles/landing.css`): estructura centrada inspirada en landings limpias. Titular "La comida de Loja, a tu puerta." con la boca del logo en lugar de la "o"; restaurantes reales (de la base) flotando alrededor; boton amarillo en pastilla.
- Cada seccion muestra una pantalla de GoEats con avisos de estados reales (recibido, en cocina, en camino). Banda amarilla de beneficios, banda negra de repartidores y cierre rojo.
- Se quitaron las resenas de ejemplo y la ventana emergente de promociones (no mostrar opiniones inventadas).
- Celular: barra inferior negra con pestanas (Inicio, Pedidos, Plus, Perfil) para el cliente (`components/CustomerTabBar.tsx`), pestana activa en amarillo. Categorias compactas tipo chip.
- Skills instaladas solo en este equipo (`.claude/skills`, fuera de git): ui-ux-pro-max y design-taste-frontend. Los scripts y el hook de design-taste-frontend no se usan sin permiso.

## Regla de uso del color (16/11, pedido del usuario)

No cargar la pantalla de negro ni de amarillo. Base blanca y crema; rojo para la accion principal; amarillo y negro solo como acentos (pestana activa, un boton, una tarjeta destacada, iconos). Fondos suaves: `--brand-yellow-soft`, `--brand-red-soft`, `--brand-orange-soft`.

- Menu lateral y barra del celular: blancos. Activo en amarillo suave con icono rojo.
- Tarjetas de resumen: fondo suave del color y el icono en color solido.
- Barra inferior del cliente: blanca con sombra.
- Catalogo en celular: cabecera con la foto arriba y los datos del local en tarjeta blanca; chips de categorias fijos arriba; platos con foto cuadrada; boton de precio crema con "+" rojo; barra roja "Ver mi pedido" con contador.
- Inicio: carrusel de restaurantes reales (foto, logo, nombre, categoria, abierto/cerrado y promocion). Avanza solo cada 3,5 s, se detiene al tocarlo, tiene flechas y lleva al catalogo. Secciones con fondos suaves: inicio calido, como funciona en durazno, beneficios en rojo suave, restaurantes en verde fresco (#1e8f4e al 8%), repartidores en crema, cierre en rojo.
- Inicio (cambio): el carrusel se reemplazo por un muro de 4 filas de restaurantes reales detras del titular. Cada fila se mueve despacio hacia un lado (la siguiente al reves) y se detiene al pasar el mouse. Un velo crema en el centro deja leer el texto. Cada tarjeta lleva al catalogo. Con "reducir movimiento" el muro queda quieto.
- Inicio (ajuste): sin difuminado. Las tarjetas del muro se ven nitidas y el titular va sobre un panel crema solido con sombra.
- Inicio (rediseno): sin panel ni difuminado. Titular a la izquierda sobre crema y a la derecha 3 columnas de restaurantes reales que suben y bajan despacio (se detienen al pasar el mouse). En el celular el texto va arriba y debajo 2 filas que se deslizan.
- Inicio (ajuste): "Crear mi cuenta gratis" centrado bajo "Ver restaurantes". Cabecera con logo a la izquierda, enlaces al centro y "Pedir ahora" a la derecha; el logo queda alineado con el titular.
- Como funciona (rediseno): dos columnas. Izquierda: titulo, los 3 pasos como tarjetas blancas con numero en amarillo, naranja y rojo, y boton rojo "Empezar a pedir". Derecha: bloque rojo con la boca crema del logo, la foto de un plato real y la pantalla del pedido con avisos. En celular va todo en una columna.
- Beneficios (rediseno): mosaico de 3 tarjetas. Plus en amarillo (alto, con los beneficios reales del plan: envio gratis ilimitado, prioridad en cocina, bono de $0.50 al repartidor y soporte preferencial, mas un ticket "Envio a domicilio $0.00"). Promociones en naranja con las ofertas reales de los locales (si no hay, un texto) y fotos de restaurantes. Cuenta en blanco con 3 ventajas con icono y foto de un plato. En celular van una debajo de otra.
- Restaurantes y Repartidores (rediseno): dos columnas con ilustraciones propias animadas en SVG (`components/LandingIllustrations.tsx`), con colores de marca y trazo negro como el logo. Chef salteando (comida que salta, vapor, gorro que se mueve) y repartidor en scooter con la caja de GoEats (ruedas que giran, calle y lineas de velocidad). La pantalla de la app va encima de la ilustracion y al lado una lista de funciones con icono. Sin fotos reales para no romper el estilo. Con "reducir movimiento" quedan quietas.
- Pie de pagina (rediseno): tarjeta crema con esquinas redondeadas que sube sobre el cierre rojo. Logo, frase corta y chip "Loja, Ecuador"; tres columnas de enlaces reales (Para clientes, Para negocios, GoEats); firma grande "G(boca)EATS" en amarillo con borde negro y la boca que se mueve; abajo el copyright "Hecho en Loja" y boton "Volver arriba". Sin redes ni paginas legales porque aun no existen.
- Cierre unido al pie: se quito la banda roja "¿Que se te antoja hoy?". Ahora la pregunta (con "hoy?" en rojo) y el boton rojo "Ver restaurantes" son la parte de arriba del pie, que es un solo bloque amarillo suave con esquinas redondeadas.
- Pie (ajuste): fondo crema mas intenso (amarillo 38% sobre crema) para separarse del resto; "¿Que se te antoja hoy?" todo en negro; la firma grande "G(boca)EATS" en blanco con borde negro.
- Pie (ajuste): la firma grande "G(boca)EATS" ahora es solo contorno rojo, sin relleno, con el mismo estilo de linea de la boca del logo.
- Pie (ajuste): el contorno de la firma grande paso a negro (sin relleno) para no cargar de rojo; la boca roja queda como unico acento.
- Beneficios (ajuste): el ticket "Envio a domicilio $0.00" ya no va inclinado.
- Pie (ajuste): en el celular el copyright y el boton "Volver arriba" van centrados.

## Ingreso y registro (16/11)

- Una sola pantalla para todos los roles. Web: panel amarillo con "Pide, cocina y reparte en un solo lugar" y la ilustracion del repartidor en tarjeta blanca; a la derecha la tarjeta blanca del formulario. Celular: sin panel, formulario a pantalla completa sobre blanco con el logo arriba.
- Campos crema suave de 52 px y radio 16; al enfocarlos se ponen blancos con borde negro y halo amarillo. Boton principal rojo en pastilla; "Corregir" en crema.
- Registro por pasos con barra de progreso roja y cuadro de confirmacion de datos en cada paso. Tipo de cuenta con tarjetas: Cliente (rojo), Repartidor (naranja), Restaurante (verde).
