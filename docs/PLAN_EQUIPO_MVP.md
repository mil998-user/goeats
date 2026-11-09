# Plan del equipo para el MVP de GoEats

Actualizado el 6 de noviembre de 2026.

**Equipo:** Deyvi (full stack y revisión), Jhosept (backend) y Janneth (frontend y parte visual).

Este plan se basa en lo que explicaron los jefes y en una revisión del código. Algunos puntos pueden cambiar cuando lleguen sus respuestas.

---

## Plan de tres semanas

Agregado el 6 de noviembre de 2026. Mientras Jhosept y Janneth no estén disponibles, Deyvi avanza con la base local. La base compartida espera hasta que vuelvan.

**Fechas:** prototipo e idea de negocio el 20 de noviembre; MVP y testing el 27 de noviembre. Son fechas calculadas desde "dos semanas" y "una semana después": ajustarlas si hay una fecha oficial.

**Forma de trabajo:** un bloque a la vez. Cada bloque termina probado en la copia aislada, anotado en la documentación y en el registro del día. Los commits se hacen solo cuando Deyvi lo pide.

| # | Semana | Bloque | Listo cuando | Estado |
|---|---|---|---|---|
| 0 | 1 | Aislamiento entre restaurantes (C2, C3) | Ataques en 403 y roles funcionando | Hecho, sin commit |
| 1 | 1 | Secretos y accesos abiertos (C10, C4, A19, A11) | Sin claves en el código, tiempo real con login, reinicio cerrado al dueño, catálogo sin datos privados | Hecho, sin commit. Falta cambiar la clave SMTP en el proveedor |
| 2 | 1 | Dinero validado en el servidor (C6, C8, C9, A12, M10; C7 marcado como simulado) | Precios, envío, Plus y recargas no se pueden alterar desde el navegador | Hecho, sin commit |
| 3 | 1 | Protección de cuentas y datos (C5, A10, A18, M7, M13, M14) y revisión de cifrado | Límite de intentos, entradas validadas y datos sensibles revisados | Hecho, sin commit. Cédula y HTTPS siguen pendientes |
| 4 | 1 | Pedido correcto y caja que cobra (C1, A1, A3 a A7, A9) | Se cobra en caja y los estados del pedido no se pueden saltar | Hecho, sin commit. Falta pantalla de datos de facturación |
| 5 | 2 | Cliente (A8, M2, M5, A13, cédula única, varias direcciones) | Registro simple y pedido completo sin perder el PIN | Hecho, sin commit. Migración solo en la copia de prueba |
| 6 | 2 | Motorizado (A2, pasar y cancelar orden, salida sin código) | Flujo completo con la regla de saldo confirmada | Hecho, sin commit. Regla elegible por el administrador hasta que los jefes la confirmen. Migración solo en la copia de prueba |
| 7 | 2 | Restaurante (A17, A20, mesero y cocinero por pedido, promociones) | Flujo de mesa a cobro listo para mostrar | Hecho, sin commit. IVA en 15 % hasta que los jefes lo confirmen. Migración solo en la copia de prueba |
| 8 | 2 | Demo presentable (A14 a A16, M1, M3, M4, M18, M19, B8, blanco y negro en pantallas clave) | Sin datos falsos, textos grandes y usable en celular | Hecho, sin commit. Falta la cuenta bancaria real de GoEats |
| 9 | 2 | Idea de negocio, guion de demo y ensayo | Documento listo y demo ensayada de principio a fin | Pendiente |
| 10 | 3 | Lo que falte del MVP (reservas, propina, combinar mesas) y base compartida o despliegue, con confirmación previa | Sistema disponible para probar fuera de esta PC | Funciones hechas, sin commit: Plus, cupones, calificaciones, propina, unir y cambiar mesas, reservas, historial de cocina, espera del mesero, motorizado cercano con aviso y pagar antes o después. Falta la base compartida o el despliegue, que espera confirmación. Migración solo en la copia de prueba |
| 11 | 3 | Testing (repetir el test, teléfono real, pruebas automáticas de API) y corrección | Sin errores críticos ni altos abiertos | En curso: regresión completa de los bloques 0 a 10 sin fallas (24/24 grupos), un error del mapa del motorizado corregido y pruebas automáticas en el repo (`npm run test:api`, 15/15). Falta la prueba en un celular real (pasos en `practicas/2026-11-08/prueba-celular-real.md`) |

**Fuera del MVP, salvo que los jefes digan otra cosa:** facturación real con el SRI, pago real con PayPhone, Scooter, notificaciones push y la app Flutter. En la demo, lo simulado se muestra como simulado.

**Si falta tiempo:** primero se recorta el bloque 7, después el 10. La seguridad y el dinero no se recortan.

**Decisiones que necesitan a los jefes:**

- Bloque 6: recarga y planes, o saldo negativo con límite de $50.
- Bloque 7: tasa de IVA.
- Bloque 9: comisiones, planes y precios reales del negocio.

**Puesta al día del equipo:** cuando Jhosept o Janneth vuelvan, se usa esta tabla y `errores-e2e.md` para pasarle a cada uno qué se hizo, qué cambió en su parte y qué bloque toma. Antes de eso se acuerda cómo subir la migración única y los commits locales.

---

## Tecnologías: qué no tocar

- **Web:** React 19, TypeScript, Vite 8, React Router 6, Leaflet, Recharts y Socket.io.
- **Backend:** Node, Express 4, TypeScript, Prisma 6, MySQL y Socket.io.
- **Versiones:** no se actualiza ninguna versión ni se suma una dependencia sin consultarlo antes.
- **Móvil:** web instalable, sin dependencias nuevas. Ya existe `frontend/public/sw.js`; faltan el manifest y su registro. La app Flutter queda quieta y no se borra.
- **Pruebas:** el proyecto no tiene pruebas automáticas. Cada entrega debe pasar `tsc`, `npm run build` y una prueba manual del flujo.

---

## Reglas para no pisarse

1. **Base de datos:** Jhosept propone los cambios de `backend/prisma/schema.prisma` y prueba las migraciones en su PC. Deyvi los revisa y es el único que los aplica en la base compartida. Solo se agregan campos o tablas nuevas, sin renombrar ni borrar.
2. **Estilos:** Janneth es la dueña de `frontend/src/index.css`.
3. **Archivos grandes:** `Settings.tsx`, `SuperAdmin.tsx`, `POS.tsx` y `Aggregator.tsx` son los más propensos a conflictos. Lo nuevo va en componentes nuevos.
4. **Backend y web:** Jhosept deja escrita cada ruta y evento antes de que Janneth los conecte.
5. **Git:** todos trabajan en `desarrollo`, ejecutan `git pull --ff-only origin desarrollo` antes de empezar y hacen commits pequeños. Deyvi revisa cada entrega. `main` no se toca.

---

## Base de datos compartida de pruebas

Deyvi crea y administra una sola base MySQL en la nube para todo el proyecto. Sirve solo para pruebas y para trabajar entre los tres, sin datos reales. La base real la entregarán los jefes después; allí se aplicarán las mismas migraciones.

- **Conexión:** cada uno pone `DATABASE_URL` en su `.env`, nunca en el repositorio. La clave se pasa por un medio privado.
- **Migraciones:** en la base compartida solo se usa `npx prisma migrate deploy`. Nunca `prisma migrate dev`, `prisma migrate reset` ni `prisma db push`.
- **Orden:** Jhosept prueba en su PC, Deyvi revisa, aplica la migración y luego se sube el código.
- **Datos:** los seeds y scripts que cambian datos no se corren sin avisar al equipo.
- **Pruebas que pueden dañar datos:** se hacen en una copia local.
- **Antes de crearla:** subir la migración única cuando se avise al equipo y restringir la ruta `/reset-database`, que puede borrar los datos de todos.
- **Trabajo diario:** cada uno corre la web y el backend en su PC; solo la base es compartida.

---

## Fases

| Fase | Deyvi (full stack) | Jhosept (backend) | Janneth (frontend) |
|---|---|---|---|
| **0. Base común** | Adoptar la migración única (preparada de forma local, sin subir), crear la base compartida de pruebas, aplicar las migraciones, cargar datos de prueba y pasar la conexión al equipo | Restringir `/reset-database`; corregir recargas que se aprueban con cualquier monto | Bajar los cambios, pasar cómo creó su base y sus datos de prueba, y tomar el blanco y negro como estilo base |
| **1. Cliente** | Conectar y revisar el flujo completo del pedido | Varias direcciones, cédula o RUC único, Plus y billetera | Registro paso a paso, direcciones, seguimiento, textos grandes, marketplace sin cupones ni reseñas falsas |
| **2. Motorizado** | Pasar orden, cancelar y entrega sin código de punta a punta | Radio, temporizador, aviso al administrador, costo estimado real, recarga o saldo según lo que digan los jefes | Pantalla del motorizado y vistas de administrador |
| **3. Restaurante** | Pedir-comer-pagar o al revés; cocinero en cada plato | Reservas, combinar mesas, propina, inventario por compra, llamar al mesero, promociones | Pantallas de mesas y reservas, cocina grande con historial, promociones en la landing |
| **4. Demo** | Quitar datos y login falsos de `frontend/src/utils/api.ts`; desplegar la web y el backend, con confirmación previa | CORS, variables y `JWT_SECRET` propio | Ocultar el acceso Sandbox, permitir zoom en celular, pulir lo visual |

Además, las 12 sugerencias al final de [SISTEMA_GOEATS_DOCUMENTACION.md](SISTEMA_GOEATS_DOCUMENTACION.md) se reparten entre Janneth y Deyvi.

**Público de 40 años o más:** todo debe ser simple, con textos grandes y pocos pasos.

**Blanco y negro:** se pasa pantalla por pantalla porque hay colores escritos a mano en muchas páginas. Los colores de estado, como listo o rechazado, pueden quedarse para que se entiendan mejor.

---

## Lo documentado frente al código

| Función | Estado |
|---|---|
| Comisión por restaurante, límite de deuda, PIN de entrega | Los campos existen; falta probar el flujo completo |
| Liquidar y recargar al motorizado | Las rutas existen |
| Pasar orden y cancelar orden | No se encontraron en el backend ni en la pantalla del motorizado |
| Cortes cada 5 horas | No hay tarea automática |
| Reservas, propina, calificaciones | Tampoco están en el panel del sistema antiguo; hay que hacerlas nuevas |
| Cambiar de mesa | Existe en el sistema antiguo (`usp_restCambiarMesa`); sirve de referencia |

---

## Supuestos hasta tener respuestas

- El equipo y la demo usan la base compartida de pruebas hasta que los jefes entreguen la real.
- Para el MVP basta la web instalable en el celular.
- PayPhone queda simulado y marcado como tal.
- El radio, los 3 minutos, las tarifas y los planes se configuran desde el administrador, sin valores fijos.
- Las recetas siguen como opción.
- La conexión con Scooter espera la reunión con su responsable.

---

## Preguntas abiertas para los jefes

1. ¿Dónde dijeron que está todo y qué es "Nico"? Lo más probable es que sea `docs/`, sobre todo `docs/repartidores/`, pero no está confirmado.
2. ¿El motorizado trabaja con recarga y planes, como dice el audio, o con saldo negativo y límite de $50, como dice la documentación?

---

## Primer paso

Empezar por la Fase 0. Cada persona debe recrear su base local cuando se suba la migración única. Janneth explica cómo creó su base y qué datos de prueba tiene, para que Deyvi levante la base compartida con eso. Antes hay que elegir el servicio y revisar su precio.
