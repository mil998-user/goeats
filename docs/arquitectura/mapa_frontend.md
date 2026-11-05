# 🎨 Mapa de Arquitectura del Frontend

> **Ruta base:** `frontend/`  
> **Tecnologías:** React 19 + Vite 6 + TypeScript + CSS Vanilla Premium + Lucide Icons + Recharts  
> **Punto de Entrada:** [`frontend/src/App.tsx`](../../frontend/src/App.tsx)

---

## 🖥️ Páginas y Pantallas del Sistema

| Vista / Pantalla | Archivo | Rol de Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| **Panel del Repartidor** | [`src/pages/DeliveryDashboard.tsx`](../../frontend/src/pages/DeliveryDashboard.tsx) | `MOTORIZADO` | Órdenes disponibles, pantalla de pedido activo estilo Zaymi ("Pagar Proveedor", "Cobrar Cliente"), historial de billetera y estado de deuda. |
| **Panel de SuperAdmin** | [`src/pages/SuperAdmin.tsx`](../../frontend/src/pages/SuperAdmin.tsx) | `SUPER_ADMIN` | Gestión de restaurantes SaaS, tarifas de delivery, cortes de liquidación (cada 5h) y recarga de saldo/desbloqueo de motorizados. |
| **Punto de Venta (POS)** | [`src/pages/POS.tsx`](../../frontend/src/pages/POS.tsx) | `RESTAURANT_OWNER`, `CAJERO`, `MOZO` | Grilla de mesas, selección rápida de platos, comensales, pedidos mostrador y delivery, y facturación SRI. |
| **Cocina (KDS)** | [`src/pages/Kitchen.tsx`](../../frontend/src/pages/Kitchen.tsx) | `PRODUCCION`, `RESTAURANT_OWNER` | Monitor en tiempo real para despachar pedidos por orden de llegada con alertas audibles. |
| **Caja y Movimientos** | [`src/pages/Cash.tsx`](../../frontend/src/pages/Cash.tsx) | `CAJERO`, `RESTAURANT_OWNER` | Apertura de turnos, arqueos, egresos/gastos y conciliación de ventas. |
| **Agregador Público** | [`src/pages/Aggregator.tsx`](../../frontend/src/pages/Aggregator.tsx) | Público | Marketplace web de restaurantes afiliados con categorías y buscador. |
| **Catálogo Digital Restaurante** | [`src/pages/PublicCatalog.tsx`](../../frontend/src/pages/PublicCatalog.tsx) | Público / QR | Menú online por restaurante, pedidos para entrega a domicilio o pedidos QR en mesa. |

---

## ⚡ Contextos Globales
- **Autenticación:** [`frontend/src/context/AuthContext.tsx`](../../frontend/src/context/AuthContext.tsx) (Gestiona usuario actual, token JWT y cierre de sesión).
- **WebSockets:** [`frontend/src/context/SocketContext.tsx`](../../frontend/src/context/SocketContext.tsx) (Conexión persistente en tiempo real para eventos de pedidos).
