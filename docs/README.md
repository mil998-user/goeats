# 🧭 GoEats - Índice Maestro de Documentación y Mapa del Sistema

> **Propósito:** Esta carpeta `docs/` contiene la documentación modular y mapas directos del código para que cualquier desarrollador o agente de IA pueda ubicar exactamente dónde está cada lógica sin necesidad de escanear todo el repositorio.

---

## 📂 Estructura de la Documentación

```
docs/
├── README.md                          <- Este archivo (Índice Maestro y Guía de Navegación)
├── SISTEMA_GOEATS_DOCUMENTACION.md    <- Documentación general del sistema
├── historial_de_cambios.md            <- Registro de cambios y mejoras
├── PLAN_EQUIPO_MVP.md                 <- Plan del equipo por fases, reglas de trabajo y dudas abiertas
│
├── repartidores/                      <- Lógica financiera, operativa y antifraude de motorizados
│   ├── 01_logica_financiera.md        <- Fórmulas matemáticas, deudas, comisiones y balance antifraude
│   ├── 02_flujo_operativo.md          <- Pantalla estilo Zaymi, estados de orden y acciones del motorizado
│   └── 03_liquidacion_cortes.md       <- Cortes periódicos (cada 5h), aprobación administrativa y pagos
│
└── arquitectura/                      <- Mapas exactos de código fuente (rutas, modelos y componentes)
    ├── mapa_backend.md                <- Rutas Express, Prisma schema, Socket.io y controladores
    ├── mapa_frontend.md               <- Páginas React, componentes, estados y pantallas POS/Repartidor
    └── mapa_mobile.md                 <- Aplicación Flutter (goeats_customer_app), providers y servicios
```

---

## ⚡ Guía Rápida: ¿Dónde buscar qué?

| ¿Qué necesitas consultar o modificar? | Archivo de referencia | Ubicación en código |
| :--- | :--- | :--- |
| **Lógica matemática de comisión, deuda y pagos de repartidor** | [01_logica_financiera.md](../docs/repartidores/01_logica_financiera.md) | [delivery.controller.ts](../backend/src/modules/delivery/delivery.controller.ts) |
| **Pantalla del repartidor (Pagar Proveedor / Cobrar Cliente estilo Zaymi)** | [02_flujo_operativo.md](../docs/repartidores/02_flujo_operativo.md) | [DeliveryDashboard.tsx](../frontend/src/pages/DeliveryDashboard.tsx) |
| **Cortes de 5 horas y liquidaciones a motorizados** | [03_liquidacion_cortes.md](../docs/repartidores/03_liquidacion_cortes.md) | [SuperAdmin.tsx](../frontend/src/pages/SuperAdmin.tsx) y backend `/delivery/recharge` |
| **Modelos de Base de Datos y Entidades** | [mapa_backend.md](../docs/arquitectura/mapa_backend.md) | [schema.prisma](../backend/prisma/schema.prisma) |
| **Punto de Venta (POS) y Facturación SRI** | [mapa_frontend.md](../docs/arquitectura/mapa_frontend.md) | [POS.tsx](../frontend/src/pages/POS.tsx) |
| **App Móvil de Clientes / Pedidos** | [mapa_mobile.md](../docs/arquitectura/mapa_mobile.md) | [goeats_customer_app/lib/](../goeats_customer_app/lib) |

---

## 🛠️ Entorno de Ejecución

- **Backend:** Node.js v20+, TypeScript, Express, Prisma ORM, Socket.io.
  * Puerto por defecto: `http://localhost:4000`
  * Comando para iniciar: `npm run dev` en `backend/`
- **Frontend Web:** Vite, React 19, TypeScript, Lucide Icons.
  * Puerto por defecto: `http://localhost:5173`
  * Comando para iniciar: `npm run dev` en `frontend/`
- **App Móvil:** Flutter SDK, Dart.
  * Carpeta: `goeats_customer_app/`
