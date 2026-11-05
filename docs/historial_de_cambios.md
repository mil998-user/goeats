# Documentación Integral del Sistema GoEats - Registro de Cambios y Mejoras

Este documento contiene el historial detallado de todas las optimizaciones, nuevas características, refactorizaciones y correcciones implementadas en el sistema GoEats.

---

## Índice
1. [Adaptabilidad y Rediseño Móvil Global](#1-adaptabilidad-y-rediseño-móvil-global)
2. [Rediseño del POS para Meseros en Móvil](#2-rediseño-del-pos-para-meseros-en-móvil)
3. [Cocina KDS y Servicios de Mesa](#3-cocina-kds-y-servicios-de-mesa)
4. [Catálogo Público: Preguntas Frecuentes Dinámicas](#4-catálogo-público-preguntas-frecuentes-dinámicas)
5. [Rediseño del Navbar del Cliente en el Marketplace](#5-rediseño-del-navbar-del-cliente-en-el-marketplace)
6. [Centro de Ayuda y Soporte: Modal Flotante y Tarjeta WhatsApp](#6-centro-de-ayuda-y-soporte-modal-flotante-y-tarjeta-whatsapp)
7. [Panel SuperAdmin: Módulo de Aprobación de Locales](#7-panel-superadmin-módulo-de-aprobación-de-locales)
8. [Optimización de Customer Dashboard, Perfil y Club Plus](#8-optimización-de-customer-dashboard-perfil-y-club-plus)
9. [Solución al Error de GPS en Dispositivos Móviles (Detección Multinivel)](#9-solución-al-error-de-gps-en-dispositivos-móviles-detección-multinivel)
10. [Sincronización de Base de Datos MySQL y Enlace Backend-Frontend (Vite Proxy)](#10-sincronización-de-base-de-datos-mysql-y-enlace-backend-frontend-vite-proxy)
11. [Corazones de Favoritos Condicionados a Sesión Activa](#11-corazones-de-favoritos-condicionados-a-sesión-activa)
12. [Flechas de Navegación y Scroll Suave en Carruseles de Categorías](#12-flechas-de-navegación-y-scroll-suave-en-carruseles-de-categorías)
13. [Guía de Despliegue en Producción (Vercel + Render/Railway)](#13-guía-de-despliegue-en-producción-vercel--renderrailway)

---

## 1. Adaptabilidad y Rediseño Móvil Global
- **Viewport Meta (`index.html`):** Configurado con `maximum-scale=1.0, user-scalable=no, viewport-fit=cover` para prevenir zooms involuntarios y rebotes elásticos en iOS/Android.
- **Cabecera Móvil:** Altura estandarizada a 56px, truncado con elipsis del nombre del local para evitar solapamientos con el botón hamburguesa, y áreas táctiles mínimas de 40x40px.
- **Menú Lateral (Drawer):** Animación fluida de deslizamiento con fondo traslúcido interactivo (`backdrop-filter: blur(4px)`) que se cierra al pulsar fuera.

---

## 2. Rediseño del POS para Meseros en Móvil
- **Pestañas Segmentadas:** `🍽️ Carta`, `🪑 Mesas` y `🛒 Pedido (${total})` para alternar rápidamente sin recargar.
- **Grilla de Platos de Alta Densidad (2 Columnas):** Fotos compactas de 85px, precio destacado, botones táctiles `+ Agregar` y contador `[ - 1 + ]`.
- **Barra Flotante Inferior de Comanda:** Notificación flotante `🛒 X platos • $Total ➔ [ Ver Pedido ]` que aparece en cuanto se añade un producto.
- **Botón de Envío a Cocina:** Estilo fluorescente de alto contraste para confirmación inmediata de comanda.

---

## 3. Cocina KDS y Servicios de Mesa
- **Cocina (`Kitchen.tsx`):** Grilla responsiva de tickets adaptada con `minmax(min(100%, 300px), 1fr)` y scroll horizontal sin desbordamiento para el selector de áreas (Cocina / Bar / Todos).
- **Mesas (`TablesPage.tsx`):** En smartphones, el panel lateral de 380px se convierte en un cajón inferior deslizable (*Bottom Sheet*) para consultar cuentas y facturar con comodidad.

---

## 4. Catálogo Público: Preguntas Frecuentes Dinámicas
- **Archivo:** [`frontend/src/pages/PublicCatalog.tsx`](file:///frontend/src/pages/PublicCatalog.tsx)
- Se eliminaron las preguntas fijas predeterminadas (ej. sobre bolones o dietas vegetarianas).
- La sección ahora valida si el restaurante posee `restaurant.faqsJson` con preguntas redactadas por el dueño. Si no tiene ninguna creada en `Settings.tsx`, la sección no se renderiza (retorna `null`), evitando información errónea.

---

## 5. Rediseño del Navbar del Cliente en el Marketplace
- **Archivo:** [`frontend/src/pages/Aggregator.tsx`](file:///frontend/src/pages/Aggregator.tsx)
- Se sustituyó una fila caótica de 7 botones horizontales por una interfaz minimalista de dos componentes:
  1. **Píldora Plus:** Botón `Hazte Plus ✨` o `Miembro Plus ⭐` en dorado.
  2. **Menú de Usuario con Avatar:**
     - Avatar con degradado e iniciales del usuario, nombre y badge del rol.
     - Detección de clic fuera (`useRef` + `handleClickOutside`) para cierre automático.
     - Menú desplegable completo: *Mis Pedidos*, *Mi Perfil*, *Mis Preferencias*, accesos según rol (*POS*, *Repartidor*, *SuperAdmin*), *Ayuda* y *Cerrar Sesión*.

---

## 6. Centro de Ayuda y Soporte: Modal Flotante y Tarjeta WhatsApp
- **Archivo:** [`frontend/src/components/SupportModal.tsx`](file:///frontend/src/components/SupportModal.tsx)
- **Teletransportación con `createPortal`:** Montado en `document.body` con `zIndex: 999999` para centrado perfecto sin verse tapado por la barra de tareas.
- **Tarjeta de WhatsApp Minimalista:** Diseño blanco puro (`#ffffff`), borde sutil (`#e2e8f0`), ícono de 42x42px en fondo menta suave (`#f0fdf4`), badge `● En línea` y botón compacto a la derecha `[ 💬 Chatear ↗ ]`.
- **Tarjeta de Correo Sutil:** Estilo sobrio en gris neutro eliminando botones morados discordantes.
- **Horario de Operadores:** Integrado limpiamente en una sola línea.

---

## 7. Panel SuperAdmin: Módulo de Aprobación de Locales
- **Ruta:** `/admin/restaurants?tab=approvals`
- **Banner de Alerta:** Notificación ámbar cuando existen solicitudes de restaurantes en estado `PENDING`.
- **Filtros por Estado:** Pestañas con conteo dinámico: *Todos*, *Pendientes*, *En Revisión*, *Aprobados* y *Rechazados*.
- **Acciones Directas:**
  - `✓ Aprobar Local`: Activa el restaurante, su usuario propietario y despacha correo de bienvenida vía Gmail OAuth2.
  - `🔍 En Revisión`: Cambia el estado a `UNDER_REVIEW` y notifica al dueño.
  - `✕ Rechazar`: Permite registrar motivo de rechazo y enviarlo por correo.

---

## 8. Optimización de Customer Dashboard, Perfil y Club Plus
- **Pestañas Móviles Táctiles:** Creación de `.customer-dashboard-tabs` con scroll horizontal sin saltos de línea forzados.
- **Grillas sin Desborde:** Formularios de perfil y tarjetas de contraseña adaptadas con `minmax(min(100%, 250px), 1fr)`.
- **Modal de Preferencias Gastronómicas:** Cuadrícula de 2 columnas perfectas en móvil (`minmax(130px, 1fr)`) y teletransportado con `createPortal`.
- **Página Promocional Club Plus:** Tipografía fluida con `clamp()`.

---

## 9. Solución al Error de GPS en Dispositivos Móviles (Detección Multinivel)
- **Archivos:** [`LocationPickerMap.tsx`](file:///frontend/src/components/LocationPickerMap.tsx) y [`RestaurantLocationPicker.tsx`](file:///frontend/src/components/RestaurantLocationPicker.tsx)
- **Causa Raíz:** Al ingresar por IP de red local (`http://192.168.x.x:5173`), los navegadores modernos restringen `navigator.geolocation` por considerarlo origen no seguro, lanzando alertas intrusivas.
- **Arquitectura de 4 Etapas:**
  1. *GPS Satelital:* Intento de alta precisión.
  2. *Triangulación Celular/Wi-Fi:* Baja precisión en interiores.
  3. *Geolocalización IP Automática:* Fallback inmediato con `https://ipwho.is/` (centra en la ciudad correcta sin pedir permisos).
  4. *Cero Alertas Bloqueantes:* Eliminación de `alert()`, sustituido por animación suave de cámara (`flyTo`).

---

## 10. Sincronización de Base de Datos MySQL y Enlace Backend-Frontend (Vite Proxy)
- **Sincronización Prisma:** Se agregaron las columnas faltantes a la tabla `User` (`phone`, `maxDebtLimit`, `preferencesJson`, `vehiclePlate`, `vehicleType`), eliminando el error `Status 500`.
- **Proxy Inverso en Vite (`vite.config.ts`):**
  - Proxy automático de `/api`, `/health`, `/socket.io` y `/uploads` hacia `http://localhost:5000`.
  - En [`api.ts`](file:///frontend/src/utils/api.ts) y [`SocketContext.tsx`](file:///frontend/src/context/SocketContext.tsx), las peticiones usan la ruta relativa `/api`.
  - **Ventaja:** Todo el tráfico viaja a través del puerto 5173, eliminando bloqueos de firewall de Windows en el puerto 5000 y problemas de CORS en móviles.

---

## 11. Corazones de Favoritos Condicionados a Sesión Activa
- **Sin Sesión Iniciada:** Los botones del corazón quedan completamente ocultos en todas las tarjetas de restaurantes.
- **Con Sesión Iniciada:** Los corazones se hacen visibles de inmediato, cargan los favoritos almacenados del usuario en `localStorage` (`goeats_favorites_${user.id}`) y permiten guardar/eliminar locales favoritos.

---

## 12. Flechas de Navegación y Scroll Suave en Carruseles de Categorías
- **Problema:** En pantallas de PC, categorías como *"Italiana"* quedaban cortadas por la mitad en el borde derecho.
- **Solución (`Aggregator.tsx`):**
  - Botones circulares flotantes (`<` y `>`) que aparecen reactivamente para desplazarse de forma suave.
  - Soporte de rueda de ratón (`onWheel`) para scroll horizontal fluido en PC.
  - Botones de navegación agregados también en los carruseles de *"Favoritos nacionales"* y *"Las ofertas más populares"*.

---

## 13. Guía de Despliegue en Producción (Vercel + Render/Railway)

### A. Frontend en Vercel
1. Conectar el repositorio GitHub `Victor12-ui/goeats`.
2. Establecer **Root Directory:** `frontend`.
3. Framework Preset: `Vite` (Build command: `npm run build`, Output directory: `dist`).
4. Variable de entorno: `VITE_API_URL` apuntando a tu backend en la nube.
5. Archivo [`frontend/vercel.json`](file:///frontend/vercel.json) ya configurado con rewrite para React Router SPA.

### B. Backend en Render / Railway
1. Conectar el mismo repositorio en Render o Railway.
2. Root Directory: `backend`.
3. Build Command: `npm install && npx prisma generate && npm run build`.
4. Start Command: `node dist/index.js` (o `npm start`).
5. Variables de entorno: `DATABASE_URL` (MySQL en Railway o Aiven), `PORT`, `JWT_SECRET`.
