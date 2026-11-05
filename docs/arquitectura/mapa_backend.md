# 🗺️ Mapa de Arquitectura del Backend

> **Ruta base:** `backend/`  
> **Framework:** Express 4.21 + TypeScript + Prisma ORM 6.19 + Socket.io 4.8  
> **Punto de Entrada:** [`backend/src/index.ts`](../../backend/src/index.ts)

---

## 🗄️ Esquema de Base de Datos (Prisma)
- **Archivo:** [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma)
- **Entidades Clave:**
  - `User`: Usuarios del sistema (con roles `SUPER_ADMIN`, `RESTAURANT_OWNER`, `CAJERO`, `PRODUCCION`, `MOZO`, `CUSTOMER`, `MOTORIZADO`). Contiene `walletBalance` y `maxDebtLimit`.
  - `Restaurant`: Restaurantes multi-tenant. Incluye `deliveryCommissionPercentage` para calcular descuentos al local.
  - `Order`: Pedidos unificados (Dine-in, Takeout, Delivery). Contiene `shippingCost`, `deliveryDriverId`, y estados `PENDING`, `PREPARING`, `READY`, `DELIVERING`, `DELIVERED`.
  - `WalletTransaction`: Registro contable de abonos, deducciones de comisiones y pagos a motorizados.
  - `DeliveryRate`: Tarifas dinámicas de envío base, costo por km y bonos para motorizados.

---

## 🛣️ Módulos y Rutas de la API

| Módulo | Directorio | Archivo Rutas | Archivo Controlador | Funcionalidad |
| :--- | :--- | :--- | :--- | :--- |
| **Delivery / Repartidores** | `src/modules/delivery/` | [`delivery.routes.ts`](../../backend/src/modules/delivery/delivery.routes.ts) | [`delivery.controller.ts`](../../backend/src/modules/delivery/delivery.controller.ts) | Aceptar pedidos, finalizar, cálculo de deuda antifraude, liquidaciones y tarifas. |
| **Órdenes** | `src/modules/orders/` | [`orders.routes.ts`](../../backend/src/modules/orders/orders.routes.ts) | [`orders.controller.ts`](../../backend/src/modules/orders/orders.controller.ts) | Creación de pedidos POS/Delivery, cambio de estados y websockets. |
| **Restaurantes** | `src/modules/restaurants/` | [`restaurants.routes.ts`](../../backend/src/modules/restaurants/restaurants.routes.ts) | [`restaurants.controller.ts`](../../backend/src/modules/restaurants/restaurants.controller.ts) | CRUD de restaurantes, configuración de comisión y catálogo público. |
| **Caja y Sesiones** | `src/modules/cash/` | [`cash.routes.ts`](../../backend/src/modules/cash/cash.routes.ts) | [`cash.controller.ts`](../../backend/src/modules/cash/cash.controller.ts) | Apertura/cierre de cajas físicas, ingresos y egresos. |
| **Ventas y SRI** | `src/modules/sales/` | [`sales.routes.ts`](../../backend/src/modules/sales/sales.routes.ts) | [`sales.controller.ts`](../../backend/src/modules/sales/sales.controller.ts) | Emisión de comprobantes electrónicos, firma digital XAdES-BES y RIDE PDF. |
| **Cocina (KDS)** | `src/modules/kitchen/` | [`kitchen.routes.ts`](../../backend/src/modules/kitchen/kitchen.routes.ts) | [`kitchen.controller.ts`](../../backend/src/modules/kitchen/kitchen.controller.ts) | Pantalla de cocina con estados PENDING, PREPARING, READY. |

---

## 🔒 Middlewares
- **Autenticación:** [`backend/src/middlewares/auth.ts`](../../backend/src/middlewares/auth.ts) (Valida JWT y carga `req.user`).
- **Aislamiento Multi-Tenant:** [`backend/src/middlewares/tenant.ts`](../../backend/src/middlewares/tenant.ts) (Inyecta `req.restaurantId`).
- **Control de Roles (RBAC):** [`backend/src/middlewares/rbac.ts`](../../backend/src/middlewares/rbac.ts) (Autorización por roles).
