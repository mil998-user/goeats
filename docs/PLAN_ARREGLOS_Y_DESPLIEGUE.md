# Plan de arreglos y despliegue de GoEats

Fecha: 11 de noviembre de 2026. Rama: `desarrollo`.

Este plan ordena todo lo que salió del recorrido de demo (observaciones 1 a 94) hasta dejar el sistema publicado en internet. Cada tarea tiene una prueba escrita ("listo cuando"): si la prueba no pasa, la tarea no está terminada.

Fuente de las observaciones: `practicas/2026-11-10/observaciones-recorrido.md`. El número entre paréntesis en cada tarea es el punto de ese archivo.

## Cómo leer el plan

- **Tamaño:** S (menos de una hora), M (medio día), L (un día o más).
- **Quién:** Deyvi, Jhosept o Jannet. Es una propuesta; se ajusta en la reunión del equipo.
- **Orden:** las fases van en orden. Dentro de una fase, las tareas no dependen entre sí, salvo que se indique.
- **Regla de pruebas:** cada arreglo se prueba primero en la copia aislada (base local de pruebas) y después una sola vez en la base compartida. No se crean pedidos de prueba de más en la compartida.

## Resumen de fases

| Fase | Qué se logra | Bloquea el despliegue |
|---|---|---|
| 0 | Cerrar lo de hoy: probar, guardar en Git y devolver ajustes de demo | Sí |
| 1 | Errores de datos y dinero corregidos | Sí |
| 2 | Seguridad y preparación para producción | Sí |
| 3 | Sistema publicado y probado desde celulares | Es el despliegue |
| 4 | Textos claros en todas las pantallas | No |
| 5 | Funciones nuevas pedidas en el recorrido | No |
| 6 | Mejora visual por partes | No |
| 7 | Velocidad | No |

Recomendación: desplegar apenas terminen las fases 0, 1 y 2. Las fases 4 a 7 se siguen trabajando con el sistema ya publicado, y cada cambio se prueba desde el celular de cada uno, sin abrir varias ventanas en una sola PC.

---

## Fase 0. Cerrar lo de hoy

Hay 29 archivos cambiados sin guardar en Git. Antes de tocar nada más hay que confirmar que funcionan y guardarlos.

| ID | Tarea | Quién | Tamaño | Listo cuando |
|---|---|---|---|---|
| 0.1 | Vuelta completa de prueba del pedido a domicilio | Deyvi | S | Con un pedido real se ve: contador rojo "1" en Pedidos y Cocina; el pedido aparece solo al motorizado en menos de 15 s; cuadro propio al tomar el pedido y al escribir el código; título "Pedido entregado con éxito"; botón "Ver más restaurantes" |
| 0.2 | Revisar el comprobante del pedido | Deyvi | S | En un pedido a domicilio, subtotal de platos + envío = total, y la propina sale aparte |
| 0.3 | Revisar reportes y clientes en pantalla | Deyvi | S | "Ventas del Día" muestra el valor de los pedidos entregados hoy; en Clientes aparecen Ana, Luis Miguel y Nayeli |
| 0.4 | Revisar en celular lo que la medición no cubrió | Jannet | S | A 320 px no se corta: ventana de cobro, formulario de plato, seguimiento con pedido activo, entrega con mapa del motorizado |
| 0.5 | Guardar en Git por partes | Deyvi | S | Commits separados por tema en `desarrollo`: mapa y regreso al restaurante; arreglos del recorrido; cuadros propios; responsivo; reportes y clientes; documentación |
| 0.6 | Devolver la espera de reparto a 3 minutos | Deyvi | S | En el administrador, Configuración de Tarifas muestra "Espera: 3 min" |
| 0.7 | Borrar de Descargas los archivos con contraseñas | Deyvi | S | No existen `mensaje-*.txt` ni `acceso-base-*.txt` en Descargas |

---

## Fase 1. Errores de datos y dinero

Son errores que un usuario real notaría o que dejan datos mal guardados.

| ID | Tarea | Quién | Tamaño | Listo cuando |
|---|---|---|---|---|
| 1.1 | Referencia repetida en el destino (10, 37) | Deyvi | S | En seguimiento y en el panel del motorizado, la referencia aparece una sola vez |
| 1.2 | Forma de pago "no especificado" (15) | Deyvi | S | Un pedido pagado en efectivo muestra "Efectivo" en el seguimiento y en Mis Pedidos |
| 1.3 | Rechazo de pedido duplicado en el servidor (72) | Jhosept | M | Dos envíos iguales de la misma mesa en menos de 5 s crean un solo pedido; hay prueba automática |
| 1.4 | "Pago Exitoso" falso con tarjeta, en cliente y en Plus (38) | Deyvi | S | Con tarjeta apagada, el cliente y la compra de Plus muestran "Tarjeta (pronto)" y nunca un pago exitoso |
| 1.5 | "(null)" y cédula vacía en la recarga del administrador (45) | Deyvi | S | La ventana de recarga muestra el nombre sin "(null)" y la cédula del motorizado, o "Sin cédula" |
| 1.6 | "Total de Productos (Ya cobrado)" en el motorizado (36) | Deyvi | S | En un pedido en efectivo el texto dice lo que se cobra al cliente, y la cifra no mezcla envío con productos |
| 1.7 | Buscador de cliente al cobrar (79) | Deyvi | M | Al buscar "ana" el cliente seleccionado es el que se ve resaltado; no queda otro seleccionado |
| 1.8 | Mapa del local en el seguimiento (9) | Deyvi | S | El pin del local coincide con las coordenadas guardadas del restaurante |
| 1.9 | "Total gastado" y propina (27) | Deyvi | S | La pantalla aclara si el total incluye propina, y la suma coincide con los pedidos |
| 1.10 | Botón "Probar Avance GPS" a la vista (54) | Deyvi | S | El botón no aparece fuera del modo de desarrollo |
| 1.11 | "+ Abrir" para quien no puede abrir mesas (63, 74) | Deyvi | S | El cajero no ve "+ Abrir"; el dueño ve un mensaje que explica que el mesero toma el pedido, con enlace a Personal |
| 1.12 | Botón "Entregar" en pedidos a domicilio (23, 25) | Deyvi | S | En Pedidos y en Cocina, un pedido a domicilio no muestra "Entregar"; muestra "Listo para el motorizado" |
| 1.13 | "Salir" duplicado (84) | Deyvi | S | Revisado en cocina a tamaño normal y en celular: un solo "Salir" |
| 1.14 | Plato sin precio (90, parte de error) | Deyvi | S | Un plato sin presentación de precio no aparece en el catálogo del cliente ni en la pantalla del mesero |

Avance al 11 de noviembre: las 14 tareas están hechas en el código. Probada contra el servidor: 1.14. Las demás faltan verse en pantalla con el guion de prueba. Pendiente de la 1.3: la prueba automática, y pasar la marca de duplicados a la base si algún día hay más de un servidor.

Prueba de cierre de la fase: repetir el guion de regresión del arnés (pedido a domicilio, pedido en mesa, cobro, recarga) sin fallas.

---

## Fase 2. Seguridad y preparación para producción

Nada de esto se ve en la demo, pero sin esto no se puede publicar.

| ID | Tarea | Quién | Tamaño | Listo cuando |
|---|---|---|---|---|
| 2.1 | "Vaciar Sistema" (47) | Deyvi | S | El botón no está junto a "Salir"; en producción la ruta responde "no permitido" aunque se la llame a mano |
| 2.2 | Bloque "Acceso rápido Sandbox" del inicio de sesión (18) | Deyvi | S | No aparece en la versión publicada |
| 2.3 | Cambiar las contraseñas de las cuentas de demo | Deyvi | S | Las tres claves `SEED_*` y la de las cuentas `*_demo` son nuevas y no están en ningún chat ni archivo fuera del `.env` |
| 2.4 | Rotar secretos de la base y de cifrado | Deyvi | M | Clave del usuario principal de la base, clave de Jannet y `DATA_ENCRYPTION_KEY` nuevas; datos re-cifrados; los tres integrantes conectan |
| 2.5 | Variables de producción | Jhosept | S | Lista escrita de variables del servidor y del frontend; secreto de sesión propio de producción; `ALLOW_SIMULATED_PAYMENTS` apagado; orígenes permitidos limitados al dominio publicado |
| 2.6 | El servidor no debe escribir su archivo `.env` | Jhosept | M | La configuración de correo se guarda en la base (cifrada) o en variables del servicio; no hay escritura de archivos en `notification.controller.ts` |
| 2.7 | Validación de campos (80) | Jhosept y Jannet | M | Cédula, teléfono y montos rechazan valores inválidos en el servidor y la pantalla lo avisa antes de enviar |
| 2.8 | Regla del motorizado sin ubicación | Deyvi, con los jefes | S | Decidido y escrito: qué pasa si el motorizado no comparte ubicación (hoy espera 3 minutos) |
| 2.9 | Datos de demo completos (35, 65, 70) | Deyvi | M | El seed crea mesero, cajero y cocinero en El Artesanal, deja saldo al motorizado y pone foto a los platos principales |
| 2.10 | Revisión de seguridad de los cambios | Deyvi | S | Revisadas las rutas nuevas o cambiadas: cada una exige sesión y rol, y solo devuelve datos del propio restaurante |

---

Avance al 11 de noviembre:

- 2.1 y 2.2 ya estaban resueltas: el botón y el bloque solo existen en modo desarrollo, y el servidor rechaza el vaciado fuera de una base local.
- 2.5 hecha: variable `CORS_ORIGINS` para la dirección publicada, tiempo real apuntando al servidor de `VITE_API_URL`, y ejemplos de variables actualizados.
- 2.6 hecha de forma mínima: en producción el servidor no escribe su `.env`; el correo se configura en las variables del servicio. Guardarlo cifrado en la base queda como mejora.
- 2.10 hecha para las rutas cambiadas estos días.
- Faltan 2.3, 2.4, 2.7, 2.8 y 2.9.

### Variables para publicar

Servidor: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (32 caracteres o más), `DATA_ENCRYPTION_KEY`, `CORS_ORIGINS` (dirección de Vercel), `TRUST_PROXY=1`, `ALLOW_DATABASE_RESET=false`, `ALLOW_SIMULATED_PAYMENTS=false`, `SEED_*` solo si se corre el seed, y las de correo y de inicio con Google o Facebook si se usan.

Frontend (Vercel): `VITE_API_URL` (dirección del servidor terminada en `/api`), `VITE_SOCKET_URL` (opcional), `VITE_CARD_PAYMENTS=false`, `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID` y las `VITE_PLATFORM_BANK_*`.

El certificado de la base (`backend/certs/ca.pem`) no está en Git: hay que subirlo al servicio como archivo secreto o ajustar la conexión para usar los certificados del sistema.

---

## Fase 3. Despliegue

### Decisión previa: dónde corre el servidor

El frontend ya está listo para Vercel (`frontend/vercel.json` existe). El servidor es distinto: usa conexiones en tiempo real (avisos de pedidos) y una tarea que corre cada 30 segundos (alerta de pedidos sin motorizado). Las funciones de Vercel no mantienen conexiones abiertas ni procesos en segundo plano, así que el servidor necesita un servicio que lo deje encendido. La guía anterior del proyecto (`docs/historial_de_cambios.md`, sección 13) ya proponía Vercel para el frontend y Render o Railway para el servidor.

Antes de elegir hay que confirmar dos cosas en la página de cada servicio: que el plan gratis no pida tarjeta y cuánto tarda en "despertar" si se duerme por falta de uso.

| ID | Tarea | Quién | Tamaño | Listo cuando |
|---|---|---|---|---|
| 3.1 | Elegir el servicio del servidor | Deyvi | S | Servicio elegido, sin tarjeta, con la limitación del plan gratis anotada |
| 3.2 | Publicar el servidor | Jhosept | M | `/health` responde desde internet; conecta a la base con certificado; las migraciones se aplican con `prisma migrate deploy` |
| 3.3 | Publicar el frontend en Vercel | Deyvi | S | La dirección pública abre la landing; `VITE_API_URL` apunta al servidor publicado; al recargar una ruta interna no da error 404 |
| 3.4 | Tiempo real en producción | Jhosept | S | En Cocina dice "Conectado"; un pedido nuevo aparece sin recargar |
| 3.5 | Ubicación y avisos con HTTPS | Jannet | S | Desde un celular, el motorizado puede activar su ubicación y el restaurante puede permitir avisos |
| 3.6 | Prueba completa desde celulares | Los tres | M | Guion de prueba final (al final de este documento) completo, cada rol en un celular distinto |
| 3.7 | Guía de despliegue actualizada | Deyvi | S | `docs/` explica cómo publicar una versión nueva y cómo volver a la anterior |

---

## Fase 4. Textos claros

Cambios de palabras, sin tocar reglas. Se pueden hacer en una sola tanda.

| ID | Tarea | Quién | Listo cuando |
|---|---|---|---|
| 4.1 | "Para llevar" pasa a "Recoger en local" (21, 24) | Jannet | No queda "Para llevar" en ninguna pantalla |
| 4.2 | Estados del pedido en palabras simples (31) | Jannet | "Listo para Despacho" pasa a "Listo, esperando al motorizado" |
| 4.3 | Menú del administrador en español simple (48) | Jannet | No quedan "SuperAdmin SaaS", "Tenants" ni "Wallet Conductores" |
| 4.4 | Mensajes sin "POS" ni "administrador" para el dueño (64) | Jannet | Los mensajes dicen "dueño" y "pedido en mesa" |
| 4.5 | "Cap. 4" pasa a "4 personas" (75) | Jannet | Las mesas muestran "4 personas" |
| 4.6 | Botón "Pausar" del administrador (44) | Jannet | Dice "Pausar motorizado" y explica qué hace |
| 4.7 | Nombres de recargas (41) | Jannet | "Tarjeta Recarga Bronce" pasa a "Recarga de $10" |
| 4.8 | Explicación del saldo del motorizado (34, 57) | Jannet | Una frase explica para qué sirve el saldo; el saldo y la deuda por efectivo se ven separados |
| 4.9 | Título del pedido en mesa (76) | Jannet | El título dice "Mesa 1" y no "Pedido Externo" |

---

## Fase 5. Funciones nuevas

Cada una es una historia de usuario; antes de empezar se escribe con el formato de `docs/REQUISITOS_GOEATS.md` (dado, cuando, entonces).

| ID | Función | Quién | Tamaño | Listo cuando |
|---|---|---|---|---|
| 5.1 | Horario del local: abierto o cerrado (89) | Jhosept (datos) y Jannet (pantalla) | L | El dueño define horario por día; el catálogo muestra "Abierto" o "Cerrado, abre a las ..."; el servidor rechaza pedidos fuera de horario |
| 5.2 | Precio al crear el plato (90) | Deyvi | M | El formulario "Nuevo Plato" pide nombre, descripción, área, presentación y precio; no se puede guardar sin precio |
| 5.3 | Código QR del Wi-Fi (91) | Jannet | S | En Ajustes y en el catálogo hay un QR que conecta al Wi-Fi al escanearlo. La librería de QR ya está instalada |
| 5.4 | Bandeja de recargas del administrador (42, 43, 46) | Jhosept y Jannet | L | El administrador ve la lista de solicitudes con monto, comprobante y botones Aprobar y Rechazar; no escribe el monto |
| 5.5 | Historial del motorizado (61) | Jhosept y Jannet | M | El motorizado ve sus entregas del día con ganancia y descuentos |
| 5.6 | Mesa reservada visible (86) | Jhosept y Jannet | M | En Servicios de Mesa la mesa muestra "Reservada" con día y hora |
| 5.7 | Nombre del cliente al abrir la mesa (76) | Deyvi | S | El mesero puede escribir el nombre al abrir; aparece en cocina y en el cobro |
| 5.8 | Tiempo estimado realista (50) | Jhosept | M | El tiempo usa un margen por ciudad; 5 km no da menos de 15 minutos |
| 5.9 | Aviso para calificar (59) | Jhosept | M | El cliente recibe un aviso entre 15 y 20 minutos después de la entrega. Depende de los avisos (HU-06) |
| 5.10 | Registro por pasos (19) | Jannet | M | El registro se completa en pasos de dos o tres campos, usable en celular |
| 5.11 | Pedir a otra dirección (7) | Deyvi | S | Probado: un cliente con dirección guardada puede pedir a otra dirección; si no se entiende, se ajusta el texto |
| 5.12 | El dueño toma pedidos (71) | Depende de los jefes | M | Solo si lo aprueban |
| 5.13 | El dueño ve qué motorizado lleva el pedido (26) | Depende de los jefes | S | Solo si lo aprueban |

---

## Fase 6. Mejora visual por partes

Se hace pantalla por pantalla, manteniendo cómo funciona. Criterio común para todas: blanco y negro como el mapa de entrega, letra de al menos 14 px, botones de al menos 44 px de alto, y sin cortes a 320 px.

| Orden | Pantalla | Puntos | Quién |
|---|---|---|---|
| 6.1 | Seguimiento del pedido y mapa de ruta (quitar verde, naranja y amarillo) | 12, 16, 29, 30 | Jannet |
| 6.2 | Panel del motorizado: tres cifras grandes y mapa en blanco y negro | 51, 53 | Jannet |
| 6.3 | Catálogo del restaurante | 4 | Jannet |
| 6.4 | Mis Pedidos: los pedidos primero, Plus en su lugar | 28, 60 | Jannet |
| 6.5 | Pantalla del mesero: categorías y panel del pedido sin montarse | 68 | Jannet |
| 6.6 | Cobro y formulario de cliente | 77 | Jannet |
| 6.7 | Ajustes completos, incluido Personal | 66, 92 | Jannet |
| 6.8 | Mapa de entrega | 5 | Jannet |
| 6.9 | Landing | 1 | Jannet |
| 6.10 | Tamaño de letra en toda la app | 13 | Jannet |

Cada pantalla se entrega con captura de antes y después, en computadora y en celular.

---

## Fase 7. Velocidad

Medido el 10 de noviembre: cada consulta a la base tarda unos 150 ms de ida y vuelta, y una pantalla con siete consultas pasa de un segundo.

| ID | Tarea | Quién | Listo cuando |
|---|---|---|---|
| 7.1 | Medir cada pantalla y anotar la línea base | Jhosept | Tabla con el tiempo de las diez pantallas más usadas |
| 7.2 | Quitar la consulta de usuario en cada petición con sesión | Jhosept | La validación de sesión no consulta la base en cada petición, sin perder la revisión de cuenta desactivada |
| 7.3 | Reducir consultas en catálogo, pedidos y cocina (2, 3, 22) | Jhosept | Catálogo en menos de 800 ms; "Preparar" cambia el estado en pantalla al instante |
| 7.4 | Servidor en la misma región que la base | Deyvi | El servidor publicado está en la misma región que la base (este de Estados Unidos) |
| 7.5 | Meta del requisito RNF-05 | Jhosept | Se cumple la meta escrita en `docs/REQUISITOS_GOEATS.md` |

---

## Decisiones que dependen de los jefes

Están en `practicas/2026-11-10/dudas-para-los-jefes.txt`. Las que frenan tareas de este plan:

| Decisión | Frena |
|---|---|
| Cómo se valida una transferencia y quién administra a los motorizados | 5.4 |
| Proveedor de pago con tarjeta | 1.4 queda apagado hasta decidir |
| Facturación electrónica del SRI | La casilla sigue desmarcada |
| Si el dueño puede tomar pedidos y ver al motorizado | 5.12 y 5.13 |
| Qué pasa con el motorizado sin ubicación | 2.8 |

---

## Ya hecho (no repetir)

Hecho entre el 10 y el 11 de noviembre, pendiente de guardar en Git (tarea 0.5):

- Mapa de entrega en blanco y negro y regreso al restaurante con el carrito.
- Botón "Enviar a Cocina" bloqueado mientras envía (72, parte de pantalla).
- Campana de avisos fuera de los botones (67, 81).
- Recarga con tarjeta del motorizado apagada (38, parte del motorizado).
- Texto de la billetera según la regla activa y botón "Recargar saldo" (33, 39).
- Casilla del SRI desmarcada (78).
- Etiqueta con la categoría real del plato (69).
- Botón "Iniciar sesión" en la landing (17, 32).
- Lista de restaurantes guardada 30 segundos y catálogo con consultas en paralelo.
- Contador rojo de pedidos en "Pedidos" y "Cocina" (20).
- El panel del motorizado revisa pedidos solo cada 15 segundos.
- Cuadros propios en lugar de los del navegador (40).
- Título "Pedido entregado con éxito" y botón "Ver más restaurantes".
- Revisión responsiva de 33 pantallas a 320 px, con cinco cortes corregidos.
- Comprobante con subtotal, envío y propina.
- "Ventas del Día" suma los pedidos en línea entregados (93).
- Clientes facturados en caja en el listado de Clientes (88, 94).

---

## Guion de prueba final

Se corre completo antes de desplegar y otra vez después, ya con la dirección pública y cada rol en un celular distinto.

### A. Pedido a domicilio

1. El cliente entra, elige un restaurante abierto y agrega dos platos.
2. Confirma dirección en el mapa y paga en efectivo.
3. El restaurante ve el contador "1" y el pedido nuevo sin recargar.
4. Cocina marca los platos como listos.
5. El motorizado ve el pedido, lo toma y su saldo baja la comisión.
6. El cliente ve el estado "en camino" sin recargar.
7. El motorizado entrega con el código del cliente.
8. El cliente ve "Pedido entregado con éxito" y califica.
9. El comprobante cuadra y "Ventas del Día" sube.

### B. Pedido en mesa

1. El mesero abre una mesa, agrega platos y envía a cocina una sola vez.
2. Cocina ve un solo pedido y lo marca listo.
3. El cajero cobra en efectivo a un cliente con cédula.
4. La caja cuadra y el cliente aparece en Clientes.

### C. Motorizado sin saldo

1. Con saldo insuficiente, la pantalla explica por qué no puede tomar pedidos.
2. Pide una recarga por transferencia.
3. El administrador la aprueba y el saldo sube.

### D. Seguridad

1. Sin sesión, las pantallas internas llevan al inicio de sesión.
2. Un mesero no puede abrir Ajustes ni Reportes.
3. Un restaurante no ve pedidos ni clientes de otro.
4. "Vaciar Sistema" no funciona en producción.

### E. Celular

1. Las pantallas de los pasos A, B y C se ven completas a 320 px, sin desplazamiento lateral.
2. Las ventanas emergentes (cobro, formularios) caben en pantalla.

Resultado esperado: todos los pasos pasan. Cualquier paso que falle se anota con su número y vuelve a la fase que corresponde.
