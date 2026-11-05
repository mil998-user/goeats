# 🍔 GoEats - Plataforma SaaS de Restaurantes, POS & Delivery

GoEats es una plataforma web completa de gestión para restaurantes y pedidos de comida a domicilio (SaaS). Incluye catálogo público de locales (Marketplace), sistema de punto de venta (POS) para mozos y cajeros, panel de cocina (KDS en tiempo real), panel de repartidores con mapas de ruta (Live GPS Tracking), panel administrativo de propietarios y panel SuperAdmin para gestión de franquicias y locales.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript, Vite 8, React Router 6, Lucide Icons, Leaflet (Mapas interactivos), Recharts (Reportes gráficos).
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Socket.io (WebSockets en tiempo real).
- **Base de Datos:** MySQL / MariaDB (con soporte para transacciones y recuperación de integridad).
- **Servicios Cloud Integrados:** Google Gmail OAuth2 API (correos transaccionales), Google Maps API / ipwho.is (resolución de GPS y ubicaciones).

---

## 📂 Estructura del Proyecto

```text
goeats/
├── backend/                      # API REST & Servidor WebSockets
│   ├── prisma/                   # Esquema, migraciones, datos de prueba (seeds) y SQL
│   ├── scripts/                  # Tareas manuales: crear admin, usuarios demo, revisar y reiniciar la base
│   ├── src/
│   │   ├── config/               # Configuración de base de datos, CORS y entorno
│   │   ├── middlewares/          # Autenticación JWT y control de roles
│   │   └── modules/              # Módulos: auth, restaurants, orders, delivery, etc.
│   └── package.json
│
├── frontend/                     # Aplicación Web React + Vite (SPA)
│   ├── public/                   # Logos de marcas y recursos estáticos
│   ├── src/
│   │   ├── components/           # Modales, mapas, selector de ubicación, perfil
│   │   ├── context/              # AuthContext y SocketContext
│   │   ├── pages/                # Vistas: POS, Cocina, Delivery, SuperAdmin, Marketplace...
│   │   └── utils/                # Cliente API unificado con soporte proxy
│   ├── vercel.json               # Configuración de reescritura SPA para Vercel
│   └── vite.config.ts            # Proxy inverso de desarrollo (/api, /socket.io)
│
├── legacy/                       # Sistema PHP antiguo, solo como referencia
├── docs/                         # Documentación del sistema e historial de cambios
│   └── historial_de_cambios.md   # Registro exhaustivo de cambios y mejoras implementadas
└── README.md                     # Documentación principal del repositorio
```

---

## 🚀 Inicio Rápido en Entorno Local

### 1. Requisitos Previos
- **Node.js** v18+ instalado.
- **MySQL / XAMPP** activo en el puerto `3306` (Base de datos: `goeats`).

### 2. Configuración del Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*El servidor backend iniciará en `http://localhost:5000`.*

### 3. Configuración del Frontend
```bash
cd frontend
npm install
npm run dev
```
*El frontend iniciará en `http://localhost:5173` con proxy inverso automático hacia el backend.*

---

## ☁️ Guía de Despliegue en Producción

### 1. Frontend en Vercel
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"** e importa el repositorio `Victor12-ui/goeats`.
3. **Punto Clave:** En **Root Directory**, haz clic en *Edit* y escribe `frontend`.
4. El *Framework Preset* se detectará automáticamente como `Vite`.
5. En **Environment Variables**, agrega `VITE_API_URL` con la URL pública de tu backend.
6. Haz clic en **"Deploy"**.

### 2. Backend en Render o Railway
1. Conecta el mismo repositorio en [Render](https://render.com) o [Railway](https://railway.app).
2. Selecciona **Root Directory:** `backend`.
3. Build Command: `npm install && npx prisma generate && npm run build`.
4. Start Command: `node dist/index.js`.
5. Variables de entorno: `DATABASE_URL`, `PORT=5000`, `JWT_SECRET`.

---

## 📖 Historial Detallado de Cambios

Para consultar el registro completo de todas las características y mejoras implementadas (adaptabilidad móvil, flechas de carruseles, corazones de favoritos, solución GPS multinivel, sistema de aprobación de locales y soporte por WhatsApp), consulta el archivo:

👉 **[`docs/historial_de_cambios.md`](./docs/historial_de_cambios.md)**
