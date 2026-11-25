# 🍽️ SISTEMA GOEATS - Documentación Completa del Sistema

> **Documento Vivo** — Este archivo se actualiza con cada mejora del sistema para mantener el contexto completo.
> 
> **Última actualización:** 2026-11-08
> **Versión:** 0.7.12 (Testing)

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Sistema Existente (PHP)](#sistema-existente-php)
3. [Base de Datos MySQL Existente](#base-de-datos-mysql-existente)
4. [Módulos del Sistema Actual](#módulos-del-sistema-actual)
5. [Migración a Node.js](#migración-a-nodejs)
6. [Sistema Multi-Restaurante (SaaS)](#sistema-multi-restaurante-saas)
7. [Integración con Facturación SRI](#integración-con-facturación-sri)
8. [Stack Tecnológico Nuevo](#stack-tecnológico-nuevo)
9. [API Endpoints (Nuevo)](#api-endpoints-nuevo)
10. [Estructura de Archivos (Nuevo)](#estructura-de-archivos-nuevo)
11. [Historial de Cambios](#historial-de-cambios)

---

## 🎯 Visión General

**SISTEMA GOEATS** es un sistema completo de gestión para restaurantes originalmente desarrollado en **PHP + MySQL (MariaDB 10.1)**. El proyecto tiene como objetivo:

1. ✅ **Migrar** el sistema PHP existente a **Node.js (Express.js + React)**
2. ✅ **Hacerlo Multi-Restaurante** (modelo SaaS de alquiler)
3. ✅ **Integrar la base de datos** con el sistema de **Facturación SRI** existente (Prisma)
4. ✅ Crear un sistema **completo y estable** para producción

### Credenciales Conocidas
- **Hosting/Email**: `ribs@goparty.club` / `ribs.goeats.2023`
- **BD Sistema Admin**: MySQL `restofe2023` (localhost, root, sin password)
- **BD Web Pedidos**: MySQL `restord` (localhost, root, sin password)
- **Admin por defecto**: usuario `admin` / contraseña `admin`
- **Mesero por defecto**: usuario `mesero` / contraseña `mesero`

---

## 🏗️ Sistema Existente (PHP)

### Ubicación de Archivos
```
legacy/sistema-php/
├── CON_IMPRESION/          ← Versión con impresión de tickets (impresora térmica)
│   ├── base_de_datos_03_2023.sql   (108KB - 3,256 líneas)
│   ├── sistema/                     ← Panel Admin (MVC PHP)
│   └── web/                         ← App Web Pública (pedidos online)
│
├── SIN_IMPRESION/          ← Versión sin impresión (misma BD y funcionalidad)
│   ├── base_de_datos_03_2023.sql   (108KB - 3,256 líneas)
│   ├── sistema/                     ← Panel Admin (MVC PHP)
│   └── web/                         ← App Web Pública
│   └── web.zip
```

### Diferencia CON/SIN Impresión
- **CON_IMPRESION**: Incluye soporte para impresoras térmicas (tickets de cocina/bar)
- **SIN_IMPRESION**: Misma funcionalidad pero sin el módulo de impresión directa

### Arquitectura del Sistema PHP

```
┌────────────────────────────────────────────────┐
│           SISTEMA ADMIN (sistema/)              │
│     PHP 5.6 + MVC + jQuery + Bootstrap          │
│                                                  │
│  controller/                                     │
│  ├── areaprod/    → Áreas de producción (Cocina/Bar)
│  ├── caja/        → Apertura/Cierre de caja, ingresos, egresos
│  ├── cliente/     → Gestión de clientes
│  ├── compras/     → Compras a proveedores
│  ├── config/      → Configuración (mesas, productos, usuarios, etc.)
│  ├── creditos/    → Créditos de compras
│  ├── facturacion/ → Facturación electrónica (SRI Ecuador)
│  ├── informes/    → Reportes y estadísticas
│  ├── inicio/      → Punto de Venta (POS)
│  ├── inventario/  → Stock, Kardex, Entradas/Salidas
│  ├── login/       → Autenticación
│  └── tablero/     → Dashboard con gráficos de ventas
│                                                  │
│  model/           → Modelos de datos (PDO MySQL) │
│  view/            → Vistas PHP (Bootstrap 3)     │
│  assets/          → CSS, JS, imágenes, plugins   │
│                                                  │
│  BD: restofe2023 (MariaDB 10.1, PDO)            │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│           WEB PÚBLICA (web/)                     │
│     PHP + jQuery + Bootstrap                     │
│                                                  │
│  Páginas:                                        │
│  ├── index.php          → Página principal       │
│  ├── productos.php      → Catálogo de productos  │
│  ├── productos_mesa.php → Catálogo por mesa (QR) │
│  ├── carrito.php        → Carrito de compras      │
│  ├── carrito_mesa.php   → Carrito desde mesa QR   │
│  ├── order.php          → Proceso de pedido       │
│  ├── crearcuenta.php    → Registro de clientes    │
│  ├── micuenta.php       → Mi cuenta / perfil      │
│  ├── mispedidos.php     → Historial de pedidos    │
│  ├── contacto.php       → Formulario de contacto  │
│  ├── gracias.php        → Confirmación delivery    │
│  ├── gracias1.php       → Confirmación web         │
│  ├── gracias_mesa.php   → Confirmación mesa QR     │
│  └── phpqrcode/         → Generación de códigos QR │
│                                                  │
│  db/model/conexion.php  → Conexión MySQL          │
│  BD: restord (MySQL, mysqli)                     │
└────────────────────────────────────────────────┘
```

### Roles del Sistema (tabla `tm_rol`)
| ID | Rol | Acceso |
|----|-----|--------|
| 1 | **ADMINISTRADOR** | Todo el sistema (POS, Caja, Compras, Inventario, Informes, Ajustes, Tablero) |
| 2 | **CAJERO** | POS, Caja, Clientes, Compras, Créditos, Tablero |
| 3 | **PRODUCCIÓN** | Área de producción (Cocina/Bar - Kitchen Display) |
| 4 | **MOZO** | Punto de Venta (tomar pedidos) |

### Tipos de Pedido (tabla `tm_tipo_pedido`)
| ID | Tipo | Descripción |
|----|------|-------------|
| 1 | **MESA** | Pedido en mesa con asignación de mozo |
| 2 | **LLEVAR** | Pedido para llevar (mostrador) |
| 3 | **DELIVERY** | Pedido con envío a domicilio |

### Formas de Pago (tabla `tm_tipo_pago`)
| ID | Tipo |
|----|------|
| 1 | EFECTIVO |
| 2 | TARJETA |
| 3 | AMBOS (mixto) |

### Tipos de Documento (tabla `tm_tipo_doc`)
| ID | Tipo | Serie |
|----|------|-------|
| 1 | BOLETA | 001 |
| 2 | FACTURA | 001 |
| 3 | TICKET | 001 |
| 4 | NOTA DE VENTA | 002 |

---

## 🗄️ Base de Datos MySQL Existente

> **Base de datos**: `restofe2023` (sistema admin) / `restord` (web pedidos)
> **Motor**: MariaDB 10.1 / MySQL
> **Archivo SQL**: `base_de_datos_03_2023.sql` (108KB, 3,256 líneas)
> **Incluye**: 45 tablas + 22 vistas + 35 stored procedures

### Tablas Principales (45 tablas)

#### 🏢 Empresa y Configuración
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_empresa` | Datos de la empresa/restaurante | id_de, ruc, raz_soc, direccion, logo, fac_ele, clave, usuariosol, clavesol, imp_acr(IVA), imp_val(12%), mon_acr(DOLAR) |
| `tm_tienda` | Sucursales/locales | id_tie, nombre, direccion, telefono, estado |
| `tm_turno` | Turnos de trabajo | id_turno, descripcion (MEDIO TURNO, TURNO COMPLETO) |
| `tm_margen_venta` | Metas de venta por día | cod_dia, dia, margen |

#### 👥 Usuarios y Roles
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_usuario` | Usuarios del sistema | id_usu, id_tie, id_rol, id_areap, dni, nombres, ape_paterno, ape_materno, email, usuario, contrasena, imagen |
| `tm_rol` | Roles (Admin, Cajero, Producción, Mozo) | id_rol, descripcion |
| `tm_cliente` | Clientes (facturación + web) | id_cliente, dni, ruc, nombres, ape_paterno, ape_materno, razon_social, telefono, correo, direccion, password |

#### 🍽️ Productos y Menú
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_producto` | Productos base | id_prod, id_tipo, id_catg, id_areap, nombre, descripcion, estado |
| `tm_producto_catg` | Categorías de productos | id_catg, descripcion (BOLSAS, CARNES, etc.) |
| `tm_producto_pres` | **Presentaciones** (variantes con precio) | id_pres, id_prod, cod_prod, presentacion, precio, receta, stock_min, imagen, **opciones** (texto con opciones), **limite** (límite diario) |
| `tm_producto_ingr` | Receta/ingredientes del producto | id_pres, id_tipo_ins, id_ins, id_med, cant |
| `tm_area_prod` | Áreas de producción | id_areap, id_imp, nombre (COCINA, BAR), estado |

#### 📦 Insumos e Inventario
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_insumo` | Insumos/materias primas | id_ins, id_catg, id_med, cod_ins, nomb_ins, stock_min, cos_uni |
| `tm_insumo_catg` | Categorías de insumos | id_catg, descripcion |
| `tm_almacen` | Almacenes (ABARROTES, BEBIDAS, etc.) | id_alm, nombre, estado |
| `tm_inventario` | Movimientos de inventario | id_inv, id_tipo_ope, id_ope, id_tipo_ins, id_ins, cos_uni, cant, fecha_r |
| `tm_inventario_entsal` | Entradas y salidas manuales | id_es, id_usu, id_tipo, motivo, fecha |
| `tm_tipo_medida` | Unidades de medida | id_med, descripcion (UNIDAD, KILOS, GRAMOS, LITRO, etc.) |

#### 🛒 Pedidos
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_pedido` | Pedido base | id_pedido, id_tipo_pedido, id_usu, fecha_pedido, estado (a=activo, c=completado, i=inactivo, x=despachado) |
| `tm_pedido_mesa` | Detalles pedido MESA | id_pedido, id_mesa, id_mozo, nomb_cliente, nro_personas, comentario |
| `tm_pedido_llevar` | Detalles pedido LLEVAR | id_pedido, nro_pedido, nomb_cliente, comentario |
| `tm_pedido_delivery` | Detalles pedido DELIVERY | id_pedido, nro_pedido, nomb_cliente, direccion, telefono, comentario, **motorizado** |
| `tm_detalle_pedido` | Ítems del pedido | id_pedido, id_pres, cantidad, cant, precio, comentario, fecha_pedido, fecha_envio, estado, codigo |
| `tm_carrito` | Carrito web (sesión) | id, id_producto, cantidad, precio, sessionn_id, fecha, opciones |

#### 🪑 Mesas y Salones
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_mesa` | Mesas del restaurante | id_mesa, id_catg(salón), nro_mesa, estado (a=disponible, i=ocupada) |
| `tm_salon` | Salones/Áreas | id_catg, descripcion (SALA 1), estado |

#### 💰 Ventas y Facturación
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_venta` | Ventas realizadas | id_venta, id_pedido, id_tipo_pedido, id_cliente, id_tipo_doc, id_tipo_pago, id_usu, id_apc, serie_doc, nro_doc, pago_efe, pago_tar, descuento, bolsa, igv, total, fecha_venta, id_tiraje, secuencia |
| `tm_detalle_venta` | Detalle de cada venta | id_venta, id_prod, cantidad, precio |
| `tm_tipo_doc` | Tipos de documento (Boleta, Factura, Ticket, Nota de Venta) | id_tipo_doc, descripcion, serie, numero |
| `tm_tipo_pago` | Formas de pago | id_tipo_pago, descripcion |
| `tm_tipo_venta` | Tipos de venta (CONTADO, CREDITO) | id_tipo_venta, descripcion |
| `tm_tiraje` | **Tiraje SRI** (autorizaciones de impresión fiscal) | idtiraje, contribuyente, regimen, ciudad, serie, aut_sri, desde, hasta, id_comprobante, disponibles, imprenta, imp_dueno, imp_ruc |

#### 💵 Caja
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_caja` | Cajas registradoras | id_caja, descripcion, estado |
| `tm_aper_cierre` | Apertura y cierre de caja | id_apc, id_tie, id_usu, id_caja, id_turno, fecha_aper, monto_aper, fecha_cierre, monto_cierre, monto_sistema, estado |
| `tm_gastos_adm` | Gastos administrativos | id_ga, id_tipo_gasto, id_tipo_doc, id_usu, id_apc, importe, motivo |
| `tm_ingresos_adm` | Ingresos administrativos | id_ing, id_usu, id_apc, importe, motivo |
| `tm_tipo_gasto` | Tipos de gasto (Compras, Servicios, Remuneración, Crédito) | id_tipo_gasto, descripcion |

#### 🛍️ Compras y Proveedores
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_compra` | Compras a proveedores | id_compra, id_prov, id_tipo_compra, id_tipo_doc, id_usu, fecha_c, serie_doc, num_doc, igv, total, descuento |
| `tm_compra_detalle` | Detalle de compras | id_compra, id_tp, id_pres, cant, precio |
| `tm_compra_credito` | Compras a crédito | id_credito, id_compra, total, interes, fecha, estado |
| `tm_credito_detalle` | Pagos de créditos | id_credito, id_usu, importe, fecha |
| `tm_proveedor` | Proveedores | id_prov, ruc, razon_social, direccion, telefono, email, contacto |
| `tm_tipo_compra` | Tipos compra (CONTADO, CREDITO) | id_tipo_compra, descripcion |

#### 🖨️ Impresoras
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `tm_impresora` | Impresoras térmicas | id_imp, nombre (NINGUNO, TICKET-COCINA, TICKET-BAR), estado |

### Vistas (22 vistas)
| Vista | Descripción |
|-------|-------------|
| `v_caja_aper` | Caja con datos de usuario/turno |
| `v_clientes` | Clientes con nombre completo concatenado |
| `v_cocina_de` | Pedidos delivery para cocina |
| `v_cocina_me` | Pedidos mesa para cocina |
| `v_cocina_mo` | Pedidos mostrador para cocina |
| `v_compras` | Compras con datos de proveedor |
| `v_det_delivery` | Detalle de pedidos delivery |
| `v_det_llevar` | Detalle de pedidos para llevar |
| `v_gastosadm` | Gastos administrativos detallados |
| `v_insprod` | Insumos de productos |
| `v_insumos` | Insumos con categoría y medida |
| `v_inventario` | Inventario consolidado |
| `v_inventario_ent` | Entradas de inventario |
| `v_inventario_sal` | Salidas de inventario |
| `v_listar_mesas` | Mesas con salón |
| `v_mesas` | Mesas con pedido activo |
| `v_pedido_delivery` | Pedidos delivery con detalles |
| `v_pedido_llevar` | Pedidos para llevar con detalles |
| `v_pedido_mesa` | Pedidos mesa con mozo y mesa |
| `v_productos` | Productos con categoría y área |
| `v_usuarios` | Usuarios con rol y tienda |
| `v_ventas_con` | Ventas consolidadas |

### Stored Procedures (35 procedures)
| Procedimiento | Función |
|--------------|---------|
| `usp_cajaAperturar` | Abrir caja con monto inicial |
| `usp_cajaCerrar` | Cerrar caja con monto de cierre |
| `usp_comprasAnular` | Anular una compra |
| `usp_comprasContado` | Registrar compra al contado |
| `usp_comprasCreditoCuotas` | Pagar cuota de crédito |
| `usp_comprasRegProveedor` | Registrar/Editar proveedor |
| `usp_configAlmacenes` | CRUD almacenes |
| `usp_configAreasProd` | CRUD áreas de producción |
| `usp_configCajas` | CRUD cajas registradoras |
| `usp_configEliminarCategoriaIns` | Eliminar categoría insumos |
| `usp_configEliminarCategoriaProd` | Eliminar categoría productos |
| `usp_configImpresoras` | CRUD impresoras |
| `usp_configInsumo` | CRUD insumos |
| `usp_configInsumoCatgs` | CRUD categorías insumos |
| `usp_configMesas` | CRUD mesas |
| `usp_configProducto` | CRUD productos |
| `usp_configProductoCatgs` | CRUD categorías productos |
| `usp_configProductoIngrs` | CRUD ingredientes/recetas |
| `usp_configProductoPres` | CRUD presentaciones (variantes) |
| `usp_configRol` | CRUD roles |
| `usp_configSalones` | CRUD salones |
| `usp_configTiendas` | CRUD tiendas/sucursales |
| `usp_configUsuario` | CRUD usuarios |
| `usp_invESAnular` | Anular entrada/salida inventario |
| `usp_restCambiarMesa` | Cambiar mesa de pedido |
| `usp_restCancelarPedido` | Cancelar pedido |
| `usp_restDesocuparMesa` | Liberar mesa |
| `usp_restEmitirVenta` | **Emitir venta** (genera doc, descuenta inventario) |
| `usp_restEmitirVentaDet` | Procesar detalle de venta |
| `usp_restRegCliente` | Registrar/Editar cliente |
| `usp_restRegDelivery` | Registrar pedido delivery |
| `usp_restRegMesa` | Registrar pedido en mesa |
| `usp_restRegMostrador` | Registrar pedido mostrador |
| `usp_restRegTiraje` | Registrar tiraje fiscal SRI |
| `usp_tableroControl` | Dashboard datos de ventas semanales |
| `vsp_clientes` | Vista clientes con nombre completo |

---

## 📦 Módulos del Sistema Actual

### 1. 🖥️ Punto de Venta (POS)
- **Tres modos**: Mesa, Llevar (Mostrador), Delivery
- **Pedido Mesa**: Seleccionar mesa → Asignar mozo → Agregar productos → Enviar a cocina → Cobrar
- **Pedido Llevar**: Nombre cliente → Agregar productos → Enviar a cocina → Cobrar
- **Pedido Delivery**: Datos cliente + dirección + motorizado → Agregar productos → Enviar → Cobrar
- Productos con **presentaciones** (variantes), opciones y límite diario
- Comentarios por ítem para cocina
- Búsqueda de productos en tiempo real

### 2. 💰 Caja
- **Apertura de caja**: Monto inicial, turno, usuario
- **Cierre de caja**: Monto final vs monto sistema (cuadre)
- **Ingresos**: Registro de ingresos extra
- **Egresos/Gastos**: Categorizado (Compras, Servicios, Remuneración, Crédito)

### 3. 👨‍🍳 Área de Producción (Kitchen Display)
- **Cocina y Bar** por separado (cada uno con su impresora)
- Vista de pedidos pendientes por tipo (Mesa, Delivery, Mostrador)
- Marcar ítems como preparados
- Impresión de tickets de cocina (versión CON_IMPRESION)
- **Notificación de pedidos preparados** (campana en barra superior)

### 4. 👥 Clientes
- Registro con DNI/RUC, datos personales
- Razón social para facturación
- Historial de pedidos
- Login web para clientes (password en tabla tm_cliente)

### 5. 🛒 Compras y Proveedores
- Registro de compras al contado y a crédito
- Gestión de proveedores (RUC, contacto)
- Compras con tipo de documento y serie
- Sistema de créditos con cuotas

### 6. 📦 Inventario
- **Stock** consolidado por insumo
- **Kardex Valorizado** (movimientos con costo)
- **Entradas y Salidas** manuales
- Descuento automático de inventario al vender (por receta)
- Unidades de medida (kg, g, mg, litro, ml, unidad, libras, onzas)

### 7. 🧾 Facturación
- Boleta, Factura, Ticket, Nota de Venta
- **Tiraje SRI**: Control de autorizaciones fiscales
- Numeración automática de documentos (serie + correlativo)
- Facturación electrónica (módulo config_electronica.php)
- IVA configurable (empresa)

### 8. 📊 Informes
- Ventas por período
- Productos más vendidos
- Clientes frecuentes
- Mozos (rendimiento)
- Compras y proveedores
- Caja (ingresos vs egresos)
- Descuentos aplicados
- Impuestos recaudados
- Remuneraciones

### 9. 📈 Tablero de Control (Dashboard)
- Gráfico de ventas de los últimos 7 días
- Margen de venta esperado vs real por día
- Indicadores de rendimiento

### 10. ⚙️ Ajustes (Solo Admin)
- Gestión de **Tiendas/Sucursales**
- Gestión de **Usuarios** y roles
- Gestión de **Mesas** y salones
- Gestión de **Productos** y categorías
- Gestión de **Presentaciones** (variantes con precio y opciones)
- Gestión de **Insumos** y categorías
- Gestión de **Impresoras** (tickets)
- Gestión de **Cajas** registradoras
- Gestión de **Áreas de producción** (Cocina/Bar)

### 11. 🌐 Web Pública (Pedidos Online)
- **Catálogo de productos** con imágenes
- **Carrito de compras** por sesión
- **Pedidos web**: dirección de entrega, teléfono
- **Pedidos por QR en mesa**: escanear QR → ver menú → pedir desde el celular
- **Registro/Login de clientes**
- **Mi cuenta**: perfil del cliente
- **Mis pedidos**: historial
- **Contacto**: formulario
- **Generación de QR** para mesas (phpqrcode)

---

## 🔌 Integración con Facturación SRI

### Sistema Existente de Facturación SRI (Proyecto Separado)

El proyecto **FACTURACION SRI** en `PROYECTOS 2026/FACTURACION SRI/` contiene un sistema completo de facturación electrónica ya migrado a Next.js + Prisma:

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| **Schema Prisma** | `prisma/schema.prisma` | 6 modelos: Issuer, Client, Product, Invoice, InvoiceItem, PaymentRequest, SystemConfig |
| **Módulo 11** | `src/lib/sri/sri-utils.ts` | Cálculo de dígito verificador + Clave de Acceso (49 dígitos) |
| **Firma Digital** | `src/lib/sri/sri-signer.ts` | Firma XAdES-BES con certificado .p12 (ec-sri-invoice-signer) |
| **SOAP Client** | `src/lib/sri/sri-client.ts` | Cliente SOAP para WS del SRI (Recepción + Autorización) |
| **XML Generator** | `src/lib/sri/xml-generator.ts` | Generador de XML de factura estándar SRI |
| **PDF RIDE** | `src/lib/sri/ride-generator.ts` | Generador de PDF RIDE con PDFKit |
| **Email** | `src/lib/email.ts` | Envío de facturas por email (Nodemailer) |

### Flujo de Facturación Electrónica SRI
```
1. Generar XML → 2. Firmar con .p12 (XAdES-BES) → 3. Enviar a SRI SOAP Recepción
→ 4. Consultar Autorización → 5. Generar PDF RIDE → 6. Email al cliente
```

### Endpoints SRI
| Ambiente | Recepción | Autorización |
|----------|-----------|-------------|
| Pruebas | `celcer.sri.gob.ec/...RecepcionComprobantesOffline` | `celcer.sri.gob.ec/...AutorizacionComprobantesOffline` |
| Producción | `cel.sri.gob.ec/...RecepcionComprobantesOffline` | `cel.sri.gob.ec/...AutorizacionComprobantesOffline` |

### Códigos de IVA SRI
| Porcentaje | Código |
|-----------|--------|
| 0% | 0 |
| 5% | 5 |
| 12% | 2 |
| 15% | 4 |

---

## 🏢 Sistema Multi-Restaurante (SaaS)

### Estrategia de Migración

```
SISTEMA ACTUAL (Single-Tenant)          SISTEMA NUEVO (Multi-Tenant SaaS)
┌─────────────────────┐                 ┌─────────────────────────────────┐
│  1 restaurante      │                 │  N restaurantes                 │
│  1 base de datos    │     ──────►     │  1 base de datos compartida     │
│  PHP + MySQL        │                 │  Node.js + Prisma + MySQL/PG    │
│  Sin factura elect. │                 │  + Facturación SRI integrada    │
└─────────────────────┘                 └─────────────────────────────────┘
```

### Modelo Multi-Tenant
- **Shared Database** con `restaurantId` en cada tabla
- Cada `Restaurant` vinculado a un `Issuer` (facturación SRI)
- Middleware de aislamiento de datos por tenant
- SuperAdmin gestiona todos los restaurantes

---

## 🛠️ Stack Tecnológico Nuevo

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js 20+ | Runtime |
| Express.js 5 | Framework HTTP |
| TypeScript 5 | Lenguaje |
| Prisma 6.19 | ORM (shared con Facturación SRI) |
| Socket.io 4 | Tiempo real (cocina, pedidos) |
| JWT | Autenticación |
| bcrypt | Hash de contraseñas |
| PDFKit | PDF RIDE |
| Nodemailer | Emails |
| ec-sri-invoice-signer | Firma digital SRI |

### Frontend
| Tecnología | Uso |
|-----------|-----|
| React 19 | UI Framework |
| Vite 6 | Build tool |
| TypeScript 5 | Lenguaje |
| CSS Vanilla | Estilos (premium, dark mode) |
| Lucide React | Iconos |
| Recharts | Gráficos |
| Socket.io-client | Tiempo real |

---

## 📝 Historial de Cambios

### v0.7.40 — 2026-11-25 (Scroll fluido en la landing)
El scroll se trababa. Se midió con el procesador 4 veces más lento, alternando la versión publicada y la nueva en el mismo equipo: en computadora de 45–50 a 95–142 cuadros por segundo; en tamaño de celular (6 veces más lento) de 46–76 a 72–112.
- **Dibujos animados:** el navegador los redibujaba enteros en cada cuadro. Ahora se congelan mientras se baja y cuando no se ven (`utils/useCalmScroll.ts`, reemplaza a `useParallax.ts`).
- **Escena del inicio y pizza:** cada parte que se mueve es su propio svg, así la mueve la tarjeta gráfica.
- **Fotos y hojas que se mueven al bajar:** ahora con CSS (`animation-timeline: view()`), sin JavaScript. Donde el navegador no lo tiene, quedan quietas.
- **Cabecera:** es fija y está en su propio componente; antes empujaba la página y volvía a dibujarla entera.
- **Se quitó el efecto de aparecer al bajar** en la landing. La plantilla tampoco lo tiene.
- Probado en la copia aislada: 63 de 63. No se probó en celular real.

### v0.7.39 — 2026-11-25 (Landing con la estructura y el movimiento de la plantilla)
Solo la página de inicio. Sin dependencias nuevas, sin cambios en el servidor. Textos, dibujos y fotos propios.
- **Cabecera:** se esconde al bajar y vuelve al subir o con el teclado. Debajo sale una barra amarilla de promo (Envío $0 con Plus) que se puede cerrar (`sessionStorage`).
- **Franja debajo del inicio** (reemplaza la cinta): una frase grande que cambia sola y los locales reales pasando de a uno. La plantilla pone citas de prensa; aquí no, porque no hay reales y no se inventan. Tiene botón de pausa y se detiene con el mouse encima.
- **Cómo funciona:** tres pasos escalonados, sin círculos detrás.
- **Locales:** cuántos hay, un dibujo nuevo en el sofá y el carrusel.
- **Beneficios:** 6 iconos negros y un solo botón.
- **Collage:** tres fotos reales sueltas que se mueven distinto al bajar, con el título montado y un plato que gira.
- **Seguimiento:** foto y celular sobre coral, con flechas a los lados.
- **Repartidores:** la moto sobre una pizza que gira, con casas y la iglesia de dos torres.
- **Restaurantes:** foto, título montado y tres hojas inclinadas (cocina, carta con QR y caja).
- **Cierre y pie:** franja con un solo botón y pie con el logo grande. Se quitó la palabra GOEATS gigante del pie.
- Archivos: `LandingExperience.tsx`, `LandingScenes.tsx` (nuevo), `LandingIllustrations.tsx`, `styles/landing-template.css` (nuevo), `utils/useParallax.ts` (nuevo). Se quitaron unas 950 líneas de estilos que ya no se usaban.
- Con "reducir movimiento" todo queda quieto. Sin restaurantes o sin fotos, las demás secciones salen igual.
- Las fuentes del manual no están en `frontend/public/fonts`, así que se ve la letra de reemplazo del sistema.
- Probado en la copia aislada: 62 de 62 en 320, 375, 768, 861, 1024, 1440 y 1920 px. No se probó en celular real.

### v0.7.38 — 2026-11-24 (Mesas reservadas al mover pedidos y cocina al día)
Solo pantallas. Sin migraciones ni cambios en el servidor.
- `TableGroupActions.tsx`: al unir una mesa o cambiar un pedido a una mesa reservada en las próximas 2 horas, pregunta antes (nombre, hora y personas). Las listas marcan "(reservada)".
- `Reservations.tsx`: al elegir mesa se ve cuántas personas caben y si está "(ya reservada)" a esa hora o "(queda pequeña)". Es una guía: quien decide sigue siendo el servidor. La lista se actualiza al volver la conexión.
- `Kitchen.tsx`, `POS.tsx`, `Orders.tsx` y `TablesPage.tsx`: cuando un pedido cambia de mesa, se enteran al instante. Antes el servidor avisaba y ninguna pantalla escuchaba, y cocina seguía mostrando la mesa anterior. Cocina, POS y Pedidos también se enteran al unir o separar mesas.
- Probado en la copia aislada: 48 de 48 en 390 y 1366 px, y reservas dobles 30 de 30. No se probó en celular real ni en la página publicada.

### v0.7.37 — 2026-11-24 (Errores falsos del editor)
- `backend/scripts/tsconfig.json` y `backend/prisma/tsconfig.json`: VS Code marcaba errores en `db-local.ts` y otros porque `backend/tsconfig.json` solo incluye `src`. El código no tenía errores y no se cambió.
- Comprobado con el TypeScript de VS Code (6.0.3): `db-local.ts` pasa de 11 errores a 0. `npm run db:check` y la compilación del servidor siguen igual.

### v0.7.36 — 2026-11-24 (Sin reservas dobles)
`reservations.controller.ts` y `Reservations.tsx`. Sin migraciones.
- Una mesa no se da dos veces con menos de 2 horas entre reservas (`TABLE_HOLD_MS`). Cuentan las que están por confirmar, confirmadas y "Ya llegaron".
- Se revisa al registrar con mesa, asignar o cambiar mesa, confirmar y reactivar. Marcar la llegada o cancelar nunca se bloquea.
- Si dos personas asignan la misma mesa a la vez, solo entra una: la mesa se bloquea dentro de una transacción.
- El servidor responde 409 y la pantalla dice quién tiene la mesa y a qué hora, en hora de Ecuador y sin teléfono.
- El cliente sigue reservando sin elegir mesa; el choque se revisa cuando el local la asigna.
- Las reservas dobles que ya existan no se tocan. Una mesa unida a otra se revisa por su propio número.
- Probado en la copia aislada (MySQL 9.4): 30 de 30, con choques simultáneos, y se repitieron 81 de 81 y 15 de 15. No se probó contra TiDB, en un celular real ni en la página publicada.

### v0.7.35 — 2026-11-23 (Mesa reservada, aviso para calificar y velocidad)
Plan 5.4, 5.6, 5.8, 5.9 y parte de la fase 7. Sin migraciones ni dependencias nuevas.
- **Mesa reservada:**
  - cada mesa muestra su próxima reserva de los siguientes 7 días, con día, hora, nombre y personas;
  - si está confirmada y faltan 2 horas o menos, la mesa dice "Reservada" en amarillo y abrirla pide confirmación;
  - las que faltan por confirmar dicen "Por confirmar" y no bloquean; se quita sola 1 hora después o al marcar "Ya llegaron";
  - sale en Servicios de Mesa y en la pantalla del mesero, en tiempo real (`reservation-updated`);
  - `/tables/dining-areas` no manda el teléfono del cliente.
- **Aviso para calificar:** `RateReminder.tsx` y `ratings/ratingReminder.ts`.
  - El servidor avisa entre 15 y 20 minutos después de la entrega (`rate-order`).
  - Si la app estaba cerrada, sale al volver dentro de 3 días (`GET /api/ratings/pending`). "Ahora no" con la X se recuerda en ese equipo.
  - Usa `updatedAt` del pedido como hora de entrega, porque no hay un campo propio.
- **Tiempo de entrega:** una sola regla en `utils/rideTime.ts` (3,2 min por km más 1, y nunca menos que la ruta). 5 km dan 17 minutos. El margen es uno solo; todavía no hay uno por ciudad.
- **Recargas:** la bandeja del administrador ya existía. Ahora van primero las pendientes, dice cuántas faltan y el comprobante solo viaja en las que faltan revisar.
- **Velocidad:** `GET /api/orders?active=1` trae solo pedidos abiertos. Lo usan el contador del menú, Mesas y el mesero, que antes bajaban todo el historial. Medido en la copia local con 500 pedidos viejos: de 676 KB y 49 ms a 1 KB y 5 ms. Mesas pide sus dos consultas a la vez.
- **Pruebas del repositorio:** cuatro estaban viejas desde `ddb0af8` (teléfono obligatorio en para llevar y bloqueo de pedidos repetidos). Se actualizaron.
- **Segunda revisión (lectura de código, unitarias y mutaciones).** Encontró y se corrigió:
  - en una pantalla de mesas abierta sin actividad, "Reservada" no aparecía al llegar la hora ni se quitaba después (`utils/useNow.ts`);
  - una ubicación tardía del motorizado cambiaba un pedido ya terminado y atrasaba el aviso para calificar;
  - calificar en la lista no cerraba el aviso, ni al revés, y un segundo aviso podía borrar lo que se estaba escribiendo;
  - una reserva por confirmar podía tapar la confirmada de la misma mesa;
  - si fallaban los pedidos, tampoco salían las mesas;
  - el servidor consultaba la base cada minuto aunque no hubiera nadie conectado.
- Pendiente: `Order` no tiene índice por estado y fecha (pide migración) y todavía se puede reservar la misma mesa a la misma hora (resuelto en v0.7.36).
- Probado en la copia aislada: 81 de 81 de punta a punta, 15 de 15 del repositorio, y 16 de 16 errores plantados detectados por las unitarias. No se probó en el celular real ni en la página publicada.

### v0.7.34 — 2026-11-22 (Landing pulida para celular)
Revisión pantalla por pantalla a 390 y 320 px, comparada con la versión de celular de la plantilla.
- **Cabecera:** el botón "Pedir ahora" también se ve en celular, en una línea; en pantallas de 360 px o menos dice "Pedir".
- **Menú del celular:**
  - abre a pantalla completa en coral, con los enlaces grandes en mayúsculas separados por líneas negras;
  - abajo van "Ver restaurantes" y "o crea tu cuenta gratis";
  - tocar un enlace cierra el menú.
- **Cómo funciona:** el número va al lado del dibujo y el texto debajo. Cada paso ocupa la mitad del alto.
- **Seguimiento en vivo:**
  - los puntos se veían enormes, porque la regla general de botones táctiles los llevaba a 40 px;
  - ahora el botón conserva la zona de toque y el punto se dibuja adentro, chico;
  - la foto de arriba es más baja.
- **Collage:** el título y el botón van arriba de las fotos, en lugar de taparlas.
- **Restaurantes y repartidores:** primero el texto y después el dibujo, más chico. En el panel de muestra cada fila entra en una línea.
- **Botones de la landing:** rectangulares y en mayúsculas, como los de la plantilla, con los colores de la marca.
- **Pie:** los títulos de las columnas pasan a negro, porque el rojo sobre coral casi no se leía. El botón final es negro, como el del inicio.
- Margen lateral de 20 px en celular. El carrusel de locales y los beneficios corren de borde a borde sin pasarse.
- Probado: 74 de 74 en la landing, 14 de ellas nuevas para celular (puntos, pasos, collage, bloques de negocio, botón de la cabecera y menú a 390 y 320 px).

### v0.7.33 — 2026-11-22 (Inicio de la landing igual que la plantilla)
El usuario revisó en su pantalla (1920 px) y el inicio no se parecía a la plantilla. Además, el titular se partía palabra por palabra y el texto se salía por arriba.
- **Inicio como la plantilla:**
  - un solo campo coral de borde a borde, hecho con el naranja 55% y el crema del manual, sin la pantalla partida;
  - la cabecera es del mismo coral arriba del todo;
  - el titular va grande y negro a la derecha, con un solo botón negro y rectangular "Ver restaurantes" y el enlace "o crea tu cuenta gratis".
- **Escena propia** en lugar de la foto de producto de la plantilla (`HeroScene` en `LandingIllustrations.tsx`). Es la caja de GoEats abierta, con "La comida de Loja" en la tapa, hamburguesa, papas y bebida, más la bolsa de papel con la boca y dos tickets ("Tu pedido" y "En camino").
  - Usa las sombras planas y el trazo negro de nuestras ilustraciones.
  - Sale por la esquina de abajo a la izquierda, como la caja de la plantilla.
  - La comida sube y baja y la tapa se mece.
- **Arreglos:**
  - el titular se mide con el ancho de su columna (`container-type` y `cqi`) y sus líneas no se parten, así que siempre son 3 líneas enteras;
  - el inicio tiene alto mínimo de la pantalla, pero crece si hace falta, así que nada se sale.
- **Más como la plantilla:**
  - títulos de sección en mayúsculas gruesas;
  - la cinta va en blanco con frases grandes en mayúsculas, como las citas de prensa, con la boca roja, naranja o negra;
  - el botón "Pedir ahora" de la cabecera es negro y rectangular, y el pie va en coral.
- Se quitaron del inicio la foto del plato, el sello que giraba y la etiqueta del local.
- La landing no muestra la barra de desplazamiento del navegador. Su fondo crema se veía como una raya junto al coral. Se sigue bajando con la rueda, el teclado o el dedo, y las demás pantallas conservan su barra.
- Probado: 60 de 60 en la landing, con el titular revisado en 7 anchos (de 320 a 1920 px).

### v0.7.32 — 2026-11-22 (Estilo de la plantilla en las pantallas del cliente)
El estilo de la landing (v0.7.31) pasa a las pantallas que ve el cliente. Ningún bloque grande queda de un solo color fuerte: se usan fondos suaves de la paleta y los colores fuertes solo como acentos.
- **Compartido:**
  - `utils/useReveal.ts` y `styles/motion.css`: las secciones aparecen al bajar, ahora también en la landing.
  - Fondos suaves `--ge-peach`, `--ge-sun` y `--ge-blush`, más la clase `ge-mark`: palabra en rojo con trazo amarillo debajo.
  - Con "reducir movimiento" o sin JavaScript, todo se ve quieto.
- **Restaurantes (`Aggregator.tsx`, `restaurants.css`):**
  - la banda de bienvenida pasa de roja a durazno, con "hoy?" subrayado en amarillo y un sello amarillo con la boca;
  - "Hecho para ti" pasa de amarillo entero a amarillo suave, con el botón "Elegir mis gustos" en rojo;
  - las bandas cambian de color: nuevos en blanco, lo más pedido en rosa (antes negra), mismo precio en durazno, ofertas en naranja suave y todos en blanco.
- **Carta del restaurante (`PublicCatalog.tsx`, `catalog.css`):**
  - cada categoría lleva un fondo suave distinto: amarillo suave, blanco, durazno o rosa, en vez de amarillo, crema, naranja y rojo;
  - el chef pasa de rojo a rosa;
  - "Información del local" pasa de negro a durazno, con texto negro y acentos rojos.
- **Ingreso (`Auth.tsx`, `auth.css`):** el panel de marca pasa de amarillo a durazno, con "un solo lugar." subrayado y un sello amarillo sobre el dibujo.
- **Plus (`PlusPromo.tsx`, `plus.css`):**
  - inicio en durazno con un ticket "Envío a domicilio $0.00", un sello que se mueve y el botón "Ver los planes";
  - beneficios en tarjetas con iconos en círculos de color;
  - títulos con la letra gruesa del logo;
  - se quitó "SaaS Platform" del pie y "Planes Flexibles para Todos" pasa a "Elige tu plan".
- **Panel del cliente (`CustomerDashboard.tsx`, `customer.css`):**
  - saludo "Hola, (nombre)" sobre durazno;
  - títulos gruesos;
  - las cifras con iconos en círculos rojo, amarillo y negro;
  - textos más simples.
- Probado en la copia aislada: 46 de 46 en las pantallas del cliente (web, celular, reducir movimiento y 4 anchos) y 55 de 55 en la landing. Además se repitieron las pruebas anteriores de todo el sistema.

### v0.7.31 — 2026-11-22 (Landing con el estilo y las animaciones de la plantilla)
Se tomó como referencia la plantilla de los jefes (Good Pair Days): fondos suaves que cambian en cada sección, titulares grandes, fotos de borde a borde y movimiento al bajar. Pedido del usuario: nada de bloques grandes de un solo color, todo con la paleta del manual.
- **Colores:** ya no hay secciones enteras en rojo, naranja o amarillo. Cada sección tiene un fondo suave distinto hecho con los colores del manual: durazno (naranja con crema), sol (amarillo con blanco), rosa (rojo con blanco), crema y blanco. Los colores fuertes quedan como acentos: números, iconos, botones, sellos y la cinta.
- **Cabecera:** arriba es alta, del color del inicio y con el logo un poco más grande; al bajar se achica a 64 px, queda blanca y lleva sombra.
- **Inicio:**
  - fondo durazno con la foto real de un plato a la derecha, de borde a borde, que entra como una cortina y se acerca despacio;
  - el titular sube línea por línea y "a tu puerta." se pinta con un trazo amarillo debajo;
  - un sello redondo amarillo que gira ("Hecho en Loja • A tu puerta") con la boca del logo al centro;
  - el botón principal pasa a rojo. En celular, el titular va arriba y la foto asoma abajo, de borde a borde.
- **Cinta:** negra, con frases en crema y la boca de un color distinto en cada frase.
- **Locales:** como el bloque de reseñas de la plantilla. A la izquierda el número real de restaurantes, grande y en rojo, con la boca al lado; a la derecha el carrusel, que corre hasta el borde de la pantalla.
- **Beneficios:** sobre blanco, cada icono en un círculo de distinto color con borde negro. En celular se deslizan de lado, uno por vez, con una barra que muestra el avance.
- **Nueva sección "Sigue tu pedido paso a paso":** foto real de un local a un lado y, al otro, un celular que muestra los 4 pasos reales del pedido (Recibido, Preparando, En camino, Entregado), cada uno con su color.
  - Pasa solo cada 3,2 segundos, solo mientras se ve en pantalla; se detiene al pasar el mouse o al enfocarlo.
  - Tiene flechas, puntos y botón de pausa.
  - Sin fotos de los locales sale el dibujo del motorizado.
- **Para restaurantes:** texto sobre rosa suave con iconos en círculos rojos y botón rojo. **Para repartidores:** texto en negro con iconos amarillos y el dibujo sobre durazno.
- **Aparecer al bajar:** títulos, pasos, tarjetas y fotos aparecen al llegar a ellos. El dibujo de cada paso entra por su lado y el número salta. Los botones mueven su flecha al pasar el mouse.
- **Reducir movimiento:** si el usuario lo pide en su equipo, todo se ve quieto desde el inicio: el sello no gira, la cinta queda fija, el celular no avanza solo y no sale su botón de pausa. Sin JavaScript también se ve todo.
- Sin dependencias nuevas: solo CSS y React. Archivos: `components/LandingExperience.tsx`, `styles/landing.css`, `styles/landing-sections.css`.
- Probado en la copia aislada: 55 de 55. Se revisaron la página en web y celular, el movimiento, las secciones, la página sin locales y 6 anchos, de 320 a 1600 px, sin scroll de lado ni errores.

### v0.7.30 — 2026-11-20 (Textos simples para el público de 40 años o más)
Mejoras B1 a B4 del análisis de punta a punta. El jefe pidió "todo muy simple".
- **Admin (`SuperAdmin.tsx`):**
  - "Panel de SuperAdministrador" pasa a "Administración de GoEats".
  - Se quitó "SaaS GoEats — Gestión Centralizada…".
  - "slug" pasa a "enlace", "Planes SaaS" a "Pagos de recargas y de Plus" y "Wallet" a "saldo".
- **Motorizado (`DeliveryDashboard.tsx`):**
  - "Saldo Wallet" pasa a "Tu saldo" y "SOS / Soporte en Ruta" a "Necesito ayuda".
  - Las pestañas quedan cortas: Pedidos, Mis Entregas, Billetera y Recargar.
- **Caja (`POS.tsx`):**
  - "Apertura de Caja Obligatoria… sesión de caja registradora… menú POS" pasa a "Abre la caja para empezar. Escribe con cuánto dinero en efectivo empiezas. Al cerrar, la caja te dirá si cuadra."
  - El campo dice "¿Con cuánto dinero empiezas?" y el botón "Abrir caja".
- **Ajustes (`Settings.tsx`):**
  - El logo se ve como imagen y ya no como la ruta del archivo. El cuadro de texto queda solo para pegar un enlace https.
  - En celular la barra de guardar muestra solo el botón "Guardar cambios", así que tapa menos el formulario.
  - "CONTADO (Aplica egreso directo de Caja POS)" pasa a "Contado (sale de la caja)".
- "Sistema POS" en la lista de restaurantes pasa a "Caja y comandas". "Restaurante / POS" en soporte pasa a "Restaurante".
- Probado en la copia aislada: se repitieron todas las pruebas, 345 de 345, y se revisaron las capturas de celular.

### v0.7.29 — 2026-11-20 (Prueba de punta a punta y pedidos duplicados del cliente)
- **Prueba de punta a punta de todo el sistema**, por rol, en la copia aislada. Cubrió registros, restaurante nuevo, cliente a domicilio, cocina, motorizado, mesa, caja, para llevar, QR, reservas, inventario, Plus, admin, reportes y seguridad entre restaurantes.
  - Funciones: 91 de 91.
  - Pantallas: 26 pantallas de los 8 roles, en celular y en web (52 de 52), sin errores, sin textos rotos y sin scroll de lado.
  - El análisis y las mejoras propuestas están en el registro de prácticas del día (`analisis-e2e-y-mejoras.md`).
- **Arreglo: pedidos duplicados desde la carta del cliente.** Si el cliente pulsaba dos veces o la red reintentaba, se guardaban dos pedidos iguales. Ahora la carta pública rechaza el mismo pedido enviado otra vez en menos de 8 segundos: mismo cliente (o misma conexión si no inició sesión), mismo tipo, misma mesa, mismo nombre y mismos platos.
  - El control quedó en `backend/src/utils/orderDedup.ts` y lo usan la caja (`POST /orders`) y la carta pública (`createPublicOrder`).
  - Si el pedido falla al guardarse, se puede reenviar de inmediato.
- **Encontrado y sin cambiar**, porque necesita decisión o migración:
  - los tickets de soporte no se guardan en la base;
  - los correos de soporte están fijos en el código;
  - la pantalla de notificaciones del admin escribe claves en el `.env`.

### v0.7.28 — 2026-11-20 (Landing completa con la plantilla de los jefes)
Partes 9.2 a 9.10 del plan. Archivos:
- `LandingExperience.tsx`;
- `LandingIllustrations.tsx`, con el dibujo nuevo `CustomerIllustration`;
- `styles/landing-sections.css`, nuevo;
- `styles/landing.css`.

Son bloques de color de borde a borde, uno tras otro: rojo, amarillo, crema, naranja, amarillo, negro, rojo y crema, negro y crema, y el pie.
- **9.2 Cinta:** una franja amarilla con frases propias:
  - "Paga en efectivo o con transferencia";
  - "Sigue tu pedido en vivo";
  - "Retira en el local";
  - "Restaurantes de Loja".

  Lleva la boca de la marca entre frases. Se mueve sola y se detiene al pasar el mouse o con su botón de pausa.

  Con "reducir movimiento" queda quieta y centrada. El lector de pantalla lee cada frase una sola vez.
- **9.3 Cómo funciona:** Elige, Pide y Recibe en zigzag. Cada paso tiene un número grande en amarillo, naranja y rojo, con borde negro como los dibujos.
  - Elige lleva el dibujo nuevo de una persona comiendo, Pide el del chef y Recibe el del motorizado.
  - En celular cada paso queda en una columna: número, dibujo y texto.
- **9.4 Restaurantes de Loja:** franja naranja con todos los locales reales en un carrusel.
  - Se mueve con flechas o deslizando, no solo.
  - Cada tarjeta abre la carta del local.
  - Lleva el botón "Ver todos".
  - Sin locales, la franja no sale.

  Ocupa el lugar de las columnas que estaban en el inicio.
- **9.5 Beneficios:** grid de 6 con íconos y sin cajas, sobre amarillo: envío $0 con Plus, pago en efectivo, retiro en el local, seguimiento en vivo, direcciones guardadas y repetir un pedido.
  - 3 columnas en web, 2 en tablet y 1 en celular.
  - Botón "Ver el plan Plus".
  - Se quitó el mosaico anterior, con las promociones y la cuenta.
- **9.6 Collage:** hasta 6 fotos de portada de los locales, sin repetir la del inicio, con "Un antojo para cada momento." encima. El título va sobre bloques rojos, así que se lee sobre cualquier foto.
  - Con menos de 3 fotos no sale.
- **9.7 Para restaurantes:** bloque partido. A un lado, el chef con el panel "Pedidos de hoy" sobre crema; al otro, un bloque rojo con el texto y "Registrar mi restaurante" (`/login?role=restaurant&mode=register`).
  - Se cambió "Comanda impresa con tu logo" por "Pantalla de cocina con tiempos", porque la comanda ya no lleva logo (v0.7.24).
- **9.8 Para repartidores:** igual pero al revés, con el texto en negro y el motorizado. El botón es "Quiero repartir" (`/login?role=driver&mode=register`).
- **9.9 Pie:**
  - Se quitaron las esquinas redondeadas, que dejaban ver blanco.
  - Se agregaron enlaces a "Locales" y "Para repartidores".
  - La cabecera ahora es blanca opaca, porque los bloques de color se veían a través.
- **Menú:** Cómo funciona, Locales, Beneficios y Para negocios.
- **9.10 Revisión final** en 320, 375, 768, 1024, 1440 y 1600 px:
  - no hay scroll de lado y nada se sale;
  - todos los enlaces y botones muestran el foco con teclado;
  - con "reducir movimiento" nada se mueve sin parar.
- Del CSS viejo se quitaron las reglas de las secciones reemplazadas: columnas, mosaico, burbujas, pasos y bandas anteriores.
- Probado en la copia aislada: 44 comprobaciones de la landing y 25 del inicio. Se repitieron todas las anteriores: 133 de 133.
- Al probar salió que, con "reducir movimiento", las frases quietas de la cinta se salían por el costado en celular. Ahora bajan de línea.

### v0.7.27 — 2026-11-20 (Landing: nuevo inicio)
Primera parte de la landing nueva, con la plantilla de los jefes (plan 9.1). `LandingExperience.tsx` y `styles/landing.css`.
- **Bloque rojo de borde a borde** con el titular en blanco: "La comida de Loja, a tu puerta.", con "a tu puerta." en amarillo y la "o" con la boca crema de la marca.
- Debajo van el botón amarillo "Ver restaurantes" y el enlace "Crear mi cuenta".
- **Un plato real al otro lado.** Es la foto de portada de un local, recortada en círculo con borde crema como un plato. En web sale un poco por el borde derecho.
- Encima lleva una etiqueta con el logo y el nombre del local que abre su carta.
- **Sin fotos de los locales**, el plato muestra la boca de la marca.
- **En celular**, el plato va arriba y el texto debajo, y todo entra sin bajar. Se oculta la etiqueta "Loja, Ecuador".
- **Teclado:** el foco se ve en amarillo sobre el rojo.
- **Movimiento:** el plato entra girando un poco al cargar, y queda quieto con "reducir movimiento".
- Las columnas de restaurantes que se movían en el inicio se quitaron. Los locales vuelven en su propia franja en 9.4; sus estilos `.gl-cols` y `.gl-rcard` siguen en el CSS para eso.
- Probado en la copia aislada: 25 comprobaciones.
  - Completo sin bajar en 1440×900 y 390×844.
  - Sin scroll de lado en 320, 375, 768, 1024 y 1600 px.
  - El foco se ve, la etiqueta abre la carta y sin fotos sale la boca.
  - Se repitieron todas las anteriores: 133 de 133.

### v0.7.26 — 2026-11-20 (Seguimiento visual del cliente)
Pedido de los jefes del 17 de noviembre (plan 9.11.7). Nuevo `frontend/src/components/OrderTracker.tsx` y estilos en `frontend/src/styles/tracking.css`.
- **Menos texto, más visual.** Arriba va un ícono grande del paso actual, una frase corta ("Están preparando tu pedido") y el tiempo en una etiqueta negra y amarilla ("Llega en ~18 min").
- **Cuatro pasos con íconos sobre una barra que se llena:**
  - a domicilio: Recibido, Preparando, En camino, Entregado;
  - para llevar: Recibido, Preparando, Listo, Retirado;
  - en mesa: Recibido, Preparando, Listo, Servido.
- **El tiempo se calcula así:**
  - en cocina, con la misma regla de la pantalla de cocina, que se movió a `utils/kitchenTime.ts`;
  - a domicilio se suma el viaje, a unos 3,2 minutos por km;
  - en camino, con la distancia que le falta al motorizado.
- **En camino:** la barra avanza con el motorizado y el tiempo baja solo. Dice quién lo lleva ("Carlos lo lleva").
- **Pedido listo a domicilio:** marca "En camino" con "Buscando motorizado".
- **El mapa solo sale cuando el motorizado va en camino.** Antes salía desde que se hacía el pedido.
- **La tarjeta de cada pedido activo** en "Mis Pedidos" lleva la versión pequeña, en lugar de la etiqueta de estado. Los pedidos entregados o cancelados siguen con su etiqueta.
- Todo cambia en tiempo real con los avisos que ya existían, sin recargar.
- **Se quitó texto:**
  - las descripciones de cada paso;
  - el título "Ruta y Ubicación en Tiempo Real" y su etiqueta;
  - "Instrucciones: Acércate al local", que repetía lo de para llevar.
  - El botón ahora dice "Cerrar".
- **Mapa:** la etiqueta flotante (km, minutos y GPS) va en una sola línea y ya no tapa el botón de centrar en celular.
- Probado en la copia aislada: 17 comprobaciones.
  - Estados en tiempo real, barra y tiempo que cambian cuando avanza el motorizado, mapa solo en camino y entregado con la barra llena.
  - Celular de 320 y 390 px y web.
  - Se repitieron todas las anteriores: 116 de 116.

### v0.7.25 — 2026-11-20 (Simulador de entregas)
Para probar el reparto sin salir a la calle (plan 9.12). `frontend/src/components/RouteMap.tsx`.
- **Botón "Simular recorrido"** en el mapa del pedido en camino del motorizado. El motorizado recorre solo la ruta por calles, del local a la casa del cliente, en unos 60 segundos (40 puntos, uno cada 1,5 s).
- Cada punto se manda al servidor por la ruta normal de ubicación (`POST /api/delivery/location`). Por eso el cliente ve moverse al motorizado en su seguimiento, igual que con el GPS real. No hay rutas nuevas en el servidor.
- Mientras simula:
  - dice "Prueba: en camino al cliente (N%)";
  - el botón pasa a "Detener simulación";
  - el GPS real del equipo no mueve al motorizado.
- Al llegar dice que pida el PIN. La entrega sigue necesitando el PIN, como en la vida real.
- **Solo para pruebas:** aparece con `npm run dev`, o en una versión publicada si se arma con `VITE_DELIVERY_SIMULATOR=true` (anotado en `frontend/.env.example`). En la versión final normal no existe; se revisó que el botón no queda en el código armado.
- Reemplaza al botón anterior "Probar Avance GPS (+20%)", que avanzaba en línea recta y a mano.
- De paso, en celular los botones Google Maps y Waze del mapa ya no se cortan por la derecha.
- Probado en la copia aislada: 17 comprobaciones (motorizado en celular, cliente en web, detener, llegada a 6 m de la casa, entrega con PIN). Se repitieron todas las anteriores: 99 de 99.

### v0.7.24 — 2026-11-20 (Comanda solo con lo necesario)
Pedido de los jefes del 17 de noviembre (plan 9.11.2).
- **Una sola comanda** para Pedidos, Caja y Mesas, en `frontend/src/utils/comanda.ts` (`buildComandaHtml`, `comandaFromOrder`, `printComanda`). Antes cada pantalla tenía su propio formato.
- **Lleva solo:**
  - el tipo de servicio en grande ("MESA 3", "PARA LLEVAR · nombre" o "DOMICILIO · nombre");
  - el número de pedido;
  - la fecha y la hora;
  - los platos en letra grande (cantidad a 24 px, nombre a 20 px), con su nota y "PARA LLEVAR" si va dentro de una mesa;
  - la observación del pedido.
- **Se quitó:** el logo, el RUC, la dirección, el teléfono, los precios, el total, "No válido como factura" y "Gracias por su preferencia".
- **Mesas:** el botón "Imprimir Comanda / Pre-cuenta" pasa a "Imprimir comanda" y ya no lleva precios ni total. El cobro sigue saliendo de Caja.
- Entra en papel de 80 mm y de 58 mm sin cortarse. Tiene fondo blanco aunque el navegador esté en modo oscuro.
- `utils/comandaHeader.ts` quedó sin uso; no se borró.
- Probado en la copia aislada: 9 comprobaciones (las tres pantallas imprimen el mismo formato, sin precios ni RUC, en 80 y 58 mm). Se repitieron todas las anteriores: 90 de 90.

### v0.7.23 — 2026-11-20 (Cocina: una sola pantalla simple)
Pedido de los jefes del 17 de noviembre (plan 9.11.6). `frontend/src/pages/Kitchen.tsx` y estilos `.kds-*` en `index.css`.
- **Una sola pantalla con una tarjeta por pedido.** Primero van los que faltan preparar, del más antiguo al más nuevo; los ya listos pasan al final hasta entregarse.
- **Cada tarjeta muestra:**
  - el tipo grande: PARA SERVIR (negro), PARA LLEVAR (naranja) o DOMICILIO (rojo);
  - la mesa o el nombre, y el número de pedido;
  - la observación en amarillo;
  - los platos con su cantidad grande, la nota y PARA LLEVAR si es un plato para llevar dentro de una mesa.
- **Tiempo aproximado:** 10 min por pedido más 2 por cada plato extra, hasta 30 (`estimateMinutes`). Se cuenta desde el plato más antiguo que falta, así lo agregado después a una mesa tiene su propio tiempo.
  - Muestra "Listo en ~X min" y se actualiza cada 15 s.
  - La tarjeta va en verde; en naranja cuando faltan 3 min o menos; en rojo con "Atrasado N min" cuando se pasa.
  - La regla está escrita en la pantalla. Cuando el menú tenga tiempo por plato, se cambia solo ahí.
- **Se quitaron:**
  - las pestañas "Todos / Cocina / Bar", que estaban escritas fijas en el código y no salían de la base;
  - la barra de porcentaje.

  El historial queda en un botón. "Llamar al mesero" solo sale en pedidos de mesa, y para llevar dice "Entregado al cliente".
- Probado en la copia aislada: 18 comprobaciones (orden, tipo, tiempo, colores, listo, historial, celular sin desborde). Se repitieron todas las anteriores: 72 de 72.

### v0.7.22 — 2026-11-20 (Mesero: primero la mesa)
Pedido de los jefes del 17 de noviembre (plan 9.11.3).
- **Mesero:**
  - al entrar ve "¿Qué mesa vas a atender?" con sus mesas en botones grandes;
  - toca una y se abre la carta de esa mesa, con su cuenta si ya estaba ocupada;
  - sin mesa no puede abrir la carta;
  - al enviar a cocina vuelve a las mesas.
- **Botones de mesa** (también en caja): rejilla de botones de al menos 104 px de alto, con el número grande, las personas y "Libre" u "Ocupada". En celular van en 2 columnas. Clases `.pos-table-grid` y `.pos-table-btn`.
- **El mesero ya no ve Mesa / Llevar.** El servidor también le rechaza los pedidos para llevar, a domicilio o de mesa sin mesa (403, `orders.controller.ts`). Caja y dueño siguen igual.
- Probado en la copia aislada: 14 comprobaciones (API, mesero en celular de punta a punta y mesas de caja en web). Se repitieron las pruebas de 9.11.1, 9.11.4 y 9.11.5: 58 de 58.

### v0.7.21 — 2026-11-20 (Observaciones y datos según el tipo de pedido)
Pedido de los jefes del 17 de noviembre (plan 9.11.5).
- **Carrito del cliente:**
  - cada plato tiene "Nota para cocina" (hasta 150 letras);
  - hay un cuadro "Observaciones del pedido" (hasta 180 letras), con ejemplos que cambian según el tipo.
- **Datos según el tipo:**
  - mesa: elige la mesa;
  - para llevar: "¿Quién retira el pedido?" y "Teléfono para avisarte" (obligatorio; el servidor lo valida);
  - domicilio: "¿Quién lo recibe?", dirección y teléfono, como antes.
- **Caja:** cuadro "Observaciones del pedido". Para llevar pide quién retira (no deja "Varios") y un teléfono opcional. Domicilio no se envía sin dirección y teléfono. La nota por plato tiene límite.
- **La observación del pedido ahora es solo lo que escribe la persona.** Antes el sistema guardaba ahí "Pedido público web, distancia, forma de pago…" y cocina lo mostraba como "Obs". La forma de pago y el tipo ya tienen su propio campo. El teléfono de para llevar se guarda en `deliveryPhone`.
- **Arreglos que salieron al probar:**
  - la columna de observaciones admite 191 letras: una nota más larga hacía fallar el pedido, y ahora se corta (`ORDER_NOTE_MAX`, `ITEM_NOTE_MAX` en `backend/src/utils/takeAway.ts`);
  - ese fallo devolvía al cliente el error interno de la base, con la ruta del archivo; ahora el pedido público responde con un mensaje simple y el detalle va solo al registro del servidor;
  - en cocina, una nota larga sin espacios se salía de la tarjeta; ahora baja de línea.
- Probado en la copia aislada: 15 comprobaciones por API y en pantalla. El cliente arma en el celular un pedido para llevar con nota por plato y observación, lo envía y cocina lo muestra.

**Entorno de prueba aislado (para no tocar la base compartida):** MySQL 9.4 en el puerto 3310 con la base `goeats_t20`, servidor en el 5001 con su propio `.env` (sin correo y sin la base compartida) y web compilada en el 5174. Se rearma desde cero antes de cada prueba. Está en la carpeta temporal de Claude, fuera del repositorio.

### v0.7.20 — 2026-11-20 (Caja: platos para llevar en un pedido de mesa)
Pedido de los jefes del 17 de noviembre (plan 9.11.4).
- **Caja:** con una mesa elegida aparece el selector "Para la mesa / Para llevar". En "Para llevar", los platos que se agregan van marcados así. Cada plato del carrito tiene un botón para pasarlo de la mesa a para llevar y al revés. Un mismo plato puede estar dos veces: una para comer ahí y otra para llevar.
- **Cocina:** los platos ya enviados conservan su estado. Lo nuevo entra como pendiente, así que a cocina solo llega lo agregado, con la etiqueta naranja "PARA LLEVAR". La cuenta de la mesa suma todo.
- **Cómo se guarda:** sin columna nueva en la base. La marca va al inicio de la observación del plato (`PARA LLEVAR` o `PARA LLEVAR · nota`). La regla está en `backend/src/utils/takeAway.ts` y en `frontend/src/utils/takeAway.ts`. Así sale también en la comanda, en el historial y en los reportes, sin migración.
- **Quién puede:**
  - solo caja y dueño, y solo en pedidos de mesa;
  - el mesero no ve la opción y el servidor no le deja marcar platos nuevos, pero si edita la mesa se respetan los que marcó caja;
  - en los pedidos del cliente por QR o por la web, la marca se quita.
- Probado en la copia aislada: por API (pedido de mesa, plato listo que no vuelve a cocina, mesero, cliente por QR) y en pantalla (caja, cocina, mesero en celular). Al probarlo se vio que el cajero no tenía la carta en caja: ahora "Para llevar" le abre la carta con la misma mesa y "Para la mesa" lo devuelve a las mesas.

### v0.7.19 — 2026-11-20 (Motorizado: 1 minuto de espera y cartera sin negativos)
Pedido de los jefes del 17 de noviembre (plan 9.11.1).
- **Espera fija de 1 minuto:** un pedido listo se ofrece 1 minuto solo a los motorizados cercanos y después a todos. La alerta al admin sale al mismo minuto. Antes la espera la elegía el admin (3 min por defecto); el campo se quitó del panel y el valor está en `DISPATCH_WAIT_MIN` (`backend/src/modules/delivery/dispatch.ts`). La columna `dispatchWaitMin` sigue en la base pero ya no se usa.
- **La cartera nunca baja de $0:** se quitó la regla "con límite de deuda" (`DEBT_LIMIT`, hasta -$50). Al tomar un pedido, el saldo debe cubrir:
  - la comisión por tomarlo (no en Plus);
  - la parte de GoEats del efectivo de ese pedido, que se descuenta al entregarlo;
  - la de los pedidos en efectivo que ya lleva en camino.

  La revisión se hace con el motorizado bloqueado en la transacción, así dos tomas a la vez no pueden dejarlo en negativo. Al guardar una tarifa se graba siempre `PREPAID`. Archivos: `deliveryWallet.ts`, `delivery.controller.ts`.
- **Billetera del motorizado:** muestra "Tu saldo" sin signo menos. Avisa cuánto está apartado para el efectivo en camino y, sin saldo, dice cuánto necesita. Si un motorizado quedó en negativo con la regla anterior, ve "$0.00" y cuánto tiene pendiente con GoEats; no puede tomar pedidos hasta recargar. Los saldos que ya estaban en negativo no se tocaron en la base.
- Probado en la copia aislada: 30 comprobaciones por API (espera de 1 minuto, cartera justa, dos pedidos a la vez, entrega, tarifa) y en pantalla (billetera del motorizado, saldo negativo de antes, tarifa del admin). El aviso de saldo dice cuánto recargar.

### v0.7.18 — 2026-11-17 (Pantalla de pedir /restaurants)
- Titulos de seccion (`.brand-marker`): se quito la raya amarilla de subrayado; ahora van en peso 800 con una pastilla amarilla a la izquierda, como la landing.
- Caja "Recomendados segun tus gustos": fondo crema sin borde gris, eyebrow rojo, gustos en pastillas blancas, boton "Cambiar gustos" negro (rojo al pasar), tarjetas blancas con sombra de la landing, sello "Recomendado" amarillo, favorito rojo y deslizamiento por tarjeta en celular. Estilos en clases `.rec-*` de `index.css`. El fondo crema sale 20px a cada lado para que el contenido quede alineado con "Nuevos restaurantes" (en celular va de borde a borde).
- Una sola tarjeta de restaurante (`renderCard`) para todas las secciones: blanca, radio 24px, sombra de la landing, foto con zoom suave, sello de color (amarillo nuevo/recomendado, rojo oferta, negro top 3 de la semana), favorito rojo, logo, calificacion en pastilla amarilla y estado abierto/cerrado.
- Encabezados de seccion con flechas redondas (`renderSectionHead`); se quito el texto "Ver todos" porque no hacia nada.
- Categorias en cuadros redondeados crema con icono rojo; la elegida pasa a amarillo. Subcategorias en pastillas (negra la elegida).
- Banner, estados de carga, vacio y error con la marca.
- Modal "Tus gustos" (`FoodPreferencesModal`): cabecera amarilla con la boca del logo, tarjetas blancas (amarillo suave al elegir), boton rojo "Guardar mis gustos", se cierra con Escape o tocando fuera; en celular sube como hoja desde abajo.
- Celular: secciones cortas y carruseles se deslizan por tarjeta, sin flechas; categorias mas compactas.
- Pie nuevo igual al de la landing: crema amarillento con esquinas redondeadas, logo, "Loja, Ecuador", columnas Para clientes / Para negocios / GoEats (con "Cambiar mis gustos" y "Ayuda y soporte" que abren sus ventanas), y boton negro "Volver arriba". En celular las columnas van de a dos y el pie llega hasta la barra inferior sin franja blanca.
- Menos blanco (inspirado en Buy Me a Coffee y el kit de delivery): fondo de la pagina crema suave, barra superior crema translucida con buscador blanco, banner rojo con circulo naranja y boca crema, iconos de categoria blancos sobre crema, caja de recomendados amarilla con la boca del logo de fondo y seccion de ofertas en banda naranja suave. Lo blanco queda solo para tarjetas.
- Sin gustos elegidos (o sin sesion) ahora sale la caja amarilla "Cuéntanos qué se te antoja": pastillas de categorias y boton "Elegir mis gustos" que abren el modal, y debajo un carrusel con los 8 mejor calificados. Antes ese espacio quedaba vacio.
- Gustos sin sesion: se guardan en el navegador (`goeats_food_preferences`). Al iniciar sesion un cliente cuya cuenta no tiene gustos, se guardan solos en su cuenta (`POST /auth/preferences`, en `AuthContext`). Si la cuenta ya tiene gustos, se respetan. Al cerrar sesion se borran del navegador para que la siguiente persona del equipo no herede los gustos de otra.
- Cada seccion va en su banda de color: "Nuevos restaurantes" y "Todos los restaurantes" en crema, "Lo más pedido esta semana" en negro (titulo blanco, flechas que se ponen amarillas), "Mismo precio que en el local" en rojo suave y ofertas en naranja suave. En celular las bandas van de borde a borde y pegadas, como bloques de color.
- Si aun no hay top de la semana, sale el mensaje "Muy pronto · Aquí verás lo que Loja más pide" con la boca amarilla, en vez de "Aún no hay pedidos registrados".
- Barra superior: ya no ocupa todo el ancho de pantallas grandes; usa el mismo ancho que el contenido (1200px), asi el logo y "Iniciar Sesión" quedan alineados con el banner. Buscador mas grande (46px, crece hasta 480px) con aro amarillo al escribir. En celular la barra tambien es crema.
- Categorias en web: se reparten todo el ancho (sin hueco despues de "Postres, Heladerías y Cafeterías") y los nombres largos ya se leen completos. En celular siguen deslizandose.
- Estilos en `src/styles/restaurants.css` y `src/styles/preferences.css`.

### Carta de un restaurante (/r/:slug) — 2026-11-17
- Fondo crema y barra superior crema translucida al ancho del contenido; boton "Volver" en pastilla blanca.
- Portada redondeada (32px) con degradado; logo grande en cuadro blanco, nombre en 800, descripcion y pastillas: calificacion, abierto/cerrado (nuevo), direccion, telefono (se puede llamar) y "Reservar mesa" en amarillo. En celular la foto va arriba y los datos debajo en negro sobre crema, con el logo montado sobre la foto.
- Cada categoria del menu va en su banda de color (amarillo, crema, naranja suave, rojo suave, y se repite). Platos en tarjetas blancas con sombra de la landing, nombre en 800 y foto de 132px (96px en celular).
- Carrito "Tu pedido" con cabecera amarilla y contador negro de productos.
- Informacion del local en tarjeta negra: etiquetas amarillas, mapa con marco amarillo, boton amarillo "Abrir en Google Maps" y boton de soporte con borde.
- El mapa salio de la tarjeta negra: ahora tiene su propia tarjeta blanca, mapa de borde a borde y pie con "Cómo llegar", la direccion y boton negro "Abrir mapa".
- Columna derecha en web: debajo va una tarjeta roja con el chef animado de la landing ("Hecho al momento") que se queda a la vista mientras se baja por el menu, para que no quede vacio. En celular no se muestra.
- Informacion del local y mapa ya no van en la columna del carrito: ahora son una banda negra debajo del menu (`localInfo`, clase `pc-visit`), con los datos a la izquierda y el mapa grande a la derecha. En celular esa banda se ve en la pagina (antes solo se veia dentro de la hoja del carrito). La columna derecha queda con el carrito y el chef.
- Se adapta a todos los anchos: hasta 1024px va en una sola columna (carrito debajo del menu, sin chef) y la pagina tiene `overflow-x: clip` para que nada la empuje hacia los lados. Revisado sin desbordes en 320, 360, 820 y 1500px.
- Carrito mas claro: cada producto en su recuadro con nombre, presentacion y precio por unidad, boton rojo de basurero para quitarlo de una vez (`removeFromCart`), contador redondo (− cantidad +; con 1 el "−" se vuelve basurero) y subtotal del producto.
- Portada en celular: foto y datos son una sola pieza; la foto se funde en negro hacia abajo y los datos siguen debajo sin cortes (logo que sube sobre la parte oscura, nombre y descripcion). Todo se ve sin deslizar: calificacion, abierto/cerrado y telefono en pastillas que bajan de linea si no caben, la direccion completa en su propia linea con icono amarillo y "Reservar mesa" como boton amarillo a todo lo ancho.
- Chef redibujado con mas detalle (`ChefIllustration` en `LandingIllustrations.tsx`, se usa en la carta y en la landing): cejas, ojos con brillo, bigote, sonrisa, pañuelo rojo, filipina cruzada con sombra y botones, gorro con pliegues, hornilla con fuego bajo la sarten, comida variada saltando (camaron, tomate, hoja, pimiento) y tabla con tomate y cuchillo en el meson. Animaciones nuevas: el fuego titila (`gl-ill-flame`) y el chef parpadea (`gl-ill-blink`); se apagan con "reducir movimiento".
- Estilos en `src/styles/catalog.css`. Clases nuevas `pc-*` en `PublicCatalog.tsx`.

### v0.7.17 — 2026-11-16 (Sesión, marca, landing e ingreso)
- ✅ **Límite de sesión.** Todas las sesiones duran 8 horas; al cerrar sesión el token queda anulado en el servidor; en el navegador la sesión se cierra tras 1 hora sin uso.
- ✅ **Colores de marca** en las pantallas internas y nueva landing (detalle en `docs/MANUAL_DE_MARCA_FRONTEND.md`).
- ✅ **Un solo inicio de sesión para todos.** Clientes, dueños, personal del restaurante, motorizados y administrador entran por la misma pantalla; cada uno va a su panel según su rol. Ya no hay que elegir el perfil antes.
- ✅ **Registro por pasos.** Primero el tipo de cuenta (si no viene del enlace), luego nombre y correo, contacto (celular y cédula o RUC), vehículo o datos del local según el rol, y al final usuario y contraseña. Después de cada paso sale un cuadro "¿Tus datos están bien?" con lo escrito y los botones "Corregir" y "Sí, continuar". Cada paso valida con las mismas reglas del servidor (`utils/accountValidation.ts`: cédula, RUC, correo, teléfono, usuario y contraseña de 8 caracteres con letras y números).
- ✅ **Pantalla de ingreso nueva** (`pages/Auth.tsx`, `styles/auth.css`). Web: panel amarillo de marca con la ilustración del repartidor y el formulario a la derecha. Celular: solo el formulario a pantalla completa, campos de 52 px y letra de 16 px para que el iPhone no haga zoom. Repartidor y restaurante terminan en "Solicitud enviada" en lugar de un `alert`. Mensajes del servidor en inglés traducidos.
- 📝 Los accesos de prueba (solo en desarrollo) usan usuarios `owner`, `cajero`, etc. con contraseña igual al usuario; en la base compartida esas cuentas no existen, así que dicen "Usuario o contraseña incorrectos". Las cuentas demo reales están en `practicas/credenciales-demo.txt`.

### v0.7.16 — 2026-11-10 (Arreglos del recorrido de demo)
- ✅ **Pedido duplicado.** Si el envío tardaba y se pulsaba dos veces "Enviar a Cocina", el pedido se guardaba dos veces. El botón ahora se bloquea y muestra "Enviando..." hasta que el servidor responde. Falta el rechazo del duplicado en el servidor.
- ✅ **Campana de avisos.** En computadora tapaba "Enviar a Cocina" y "Cobrar". Ahora va junto al menú lateral.
- ✅ **Recarga con tarjeta del motorizado.** Mostraba "Pago Exitoso" y luego decía que no estaba disponible. La opción queda apagada como "Tarjeta (pronto)" y la recarga abre en Transferencia. Se enciende con `VITE_CARD_PAYMENTS=true` cuando exista la cuenta del proveedor de pagos.
- ✅ **Saldo del motorizado.** Sin saldo, la pantalla explica el motivo y ofrece el botón "Recargar saldo". La billetera explica la regla que está activa (recarga previa o límite de deuda) en lugar de mostrar siempre el límite de deuda.
- ✅ **Factura del SRI.** La casilla de factura electrónica viene desmarcada, porque la conexión con el SRI todavía no existe.
- ✅ **Etiqueta de los platos.** En la pantalla del mesero todos los platos decían "Carnes". Ahora muestran su categoría real.
- ✅ **Botón "Iniciar sesión" en la landing**, para cualquier tipo de cuenta.
- ✅ **Contador de pedidos en el menú.** Junto a "Pedidos" y "Cocina KDS" sale un número en rojo con los pedidos por atender (pendientes o en preparación). Se actualiza solo al entrar un pedido o cambiar su estado.
- ✅ **Cuadros propios.** Los avisos, confirmaciones y el código de entrega ya no usan los cuadros del navegador ("localhost dice"); salen en un cuadro de la app en blanco y negro (`components/AppDialogs.tsx`).
- ✅ **Pedidos del motorizado.** El panel revisa solo los pedidos disponibles cada 15 segundos.
- ✅ **Pedido entregado.** El seguimiento del cliente dice "Pedido entregado con éxito" cuando ya se entregó, en lugar de "en curso".
- ✅ **Motorizado en celular.** La tarjeta de la entrega con el mapa ya no se corta en pantallas angostas y las pestañas van en dos columnas.
- ✅ **Responsivo a 320 px.** Revisadas 33 pantallas (dueño, administrador, cliente y motorizado). Corregidos los cortes en lista de restaurantes, menú del dueño, ajustes generales, correos del administrador y billetera del motorizado. Las rejillas con ancho mínimo fijo ahora usan `minmax(min(Npx, 100%), 1fr)`.
- ✅ **Comprobante del pedido.** Muestra subtotal de platos, envío, total y propina, para que el total cuadre.
- ✅ **Cliente.** Acceso "Restaurantes" en su menú y botón "Ver más restaurantes" en el seguimiento.
- ✅ **Ventas del Día.** El reporte suma también los pedidos en línea entregados (solo la comida, sin el envío); antes contaba solo lo cobrado en caja.
- ✅ **Clientes del restaurante.** El listado incluye a los clientes facturados en caja, no solo a los que tienen cuenta en la app.
- ✅ **Errores cortos del plan (fase 1).** Referencia de entrega sin repetir; forma de pago visible en el seguimiento; tarjeta apagada como "Tarjeta (pronto)" en el pago del cliente y en Plus; recarga del administrador sin "(null)"; botón de prueba de GPS solo en desarrollo; "+ Abrir" solo para el mesero; cocina muestra "Esperando al motorizado" en pedidos a domicilio.
- ✅ **Resto de la fase 1.** El servidor rechaza el mismo pedido enviado dos veces en 8 segundos; detalle del cobro del motorizado con textos correctos; buscador de cliente por cédula, RUC o nombre; mapa del local según las coordenadas guardadas; "Total gastado" aclara que no incluye propinas; el catálogo público no muestra platos sin precio.
- ✅ **Preparación para publicar (fase 2).** Variable `CORS_ORIGINS` para la dirección del frontend publicado; el tiempo real usa el servidor de `VITE_API_URL` si no hay `VITE_SOCKET_URL`; en producción el servidor no escribe su `.env`.
- ✅ **Velocidad.** Medido contra la base compartida: cada consulta tarda unos 150 ms de ida y vuelta. La lista de restaurantes se guarda 30 segundos en memoria (de 1,1 s a menos de 0,01 s en visitas repetidas; se apaga con `PUBLIC_LIST_CACHE_SECONDS=0`). El catálogo lanza sus consultas en paralelo (de 1,7 s a 1,1 s aproximadamente).
- ✅ **Textos más claros.** El código de entrega explica que se le muestra al motorizado, y el bloque de cobro del motorizado dice "Pagas en el local", "Ganas por esta entrega" y "Cobras al cliente", con letra oscura sobre fondo claro.
- 📝 **Recorrido completo de demo** con 88 observaciones en `practicas/2026-11-10/observaciones-recorrido.md` y 12 preguntas para los jefes.
- 🔜 **Pendiente:** el pago con tarjeta del cliente y de Plus muestra el mismo "Pago Exitoso"; clientes de caja que no aparecen en "Clientes"; referencia repetida en el destino; forma de pago "no especificado" en el seguimiento.

### v0.7.15 — 2026-11-10 (Mapa de entrega, regreso al restaurante y requisitos)
- ✅ **Mapa de entrega en blanco y negro.** La búsqueda ahora es blanca con borde y texto oscuro (antes parecía apagada), el botón Buscar, los pines y la ruta pasaron de rojo a negro, y "Mi GPS actual" quedó con un solo ícono. El pin del restaurante es blanco con borde negro para distinguirlo del punto de entrega.
- ✅ **Mapa en celular.** El mapa ocupa al menos la mitad de la pantalla, los botones miden 44 px de alto y la búsqueda usa letra de 16 px para que el iPhone no haga zoom al escribir.
- ✅ **El cliente sin dirección ya no pierde el restaurante.** Si iniciaba sesión desde un restaurante y todavía no tenía dirección, al guardarla terminaba en la lista de restaurantes. Ahora vuelve al mismo restaurante con su carrito. Solo se acepta como regreso una página de restaurante (`/r/…`).
- ✅ **Pruebas:** mapa y regreso al restaurante en web y celular (16/16), motorizado con pausas (22/22; la prueba ahora espera el cambio real en vez de un tiempo fijo).
- 📝 **Documentos nuevos:** [REQUISITOS_GOEATS.md](REQUISITOS_GOEATS.md) con historias de usuario, requisitos no funcionales medibles, prioridades y guion de entrevista; reparto del equipo en [PLAN_EQUIPO_MVP.md](PLAN_EQUIPO_MVP.md).

### v0.7.14 — 2026-11-09 (Cierre de la regresión)
- ✅ **Cédula en caja desde el enlace directo.** Al entrar a cobrar desde Pedidos o Mesas (`/pos?orderId=…&checkout=true`), la ventana de cobro no traía la cédula del cliente de la app, porque se abría antes de saber cuál era el pedido. Ahora recibe el pedido directamente.
- ✅ **Regresión completa sin fallas** con el código de hoy: servidor, celular, pantallas de los bloques 1 a 10, `npm run test:api` (15/15) y las 3 correcciones del 2026-11-08 (9/9).
- 📝 **Problemas comunes de la base:** en Mac, el Receptor AirPlay ocupa el puerto 5000; `DATABASE_URL es obligatoria` cuando falta `backend/.env`.
- ✅ **Mapa de entrega:** hecho en la v0.7.15.

### v0.7.13 — 2026-11-09 (Base de datos del equipo)
- ✅ **Base compartida en la nube (TiDB Cloud Starter, gratis y sin tarjeta) y base local con un comando.** Ya no se copia `backend/db-data` entre compañeros. Guía completa en `docs/BASE_DE_DATOS_EQUIPO.md`.
- ✅ **Conexión validada al arrancar** (`backend/src/config/databaseUrl.ts`):
  - `DATABASE_URL` es obligatoria. Antes, si faltaba, se conectaba a `localhost:3306`.
  - Contra una base remota exige `sslaccept=strict` con el certificado `certs/ca.pem`. Sin eso, Prisma acepta cualquier certificado.
- ✅ **Protección de la base compartida:**
  - `scripts/reset.ts`, el botón "Vaciar Sistema", `seed_maku.ts` y `db:local` solo corren contra una base local.
  - El seed pide las contraseñas demo del `.env` en una base remota y lo revisa antes de escribir nada.
- ✅ **Comandos nuevos:**
  - `npm run db:check`: muestra a qué base apunta, si va cifrada y si faltan migraciones. No escribe nada.
  - `npm run db:local`: crea la carpeta de datos, levanta MySQL solo para la propia PC, aplica migraciones y siembra si está vacía. Se puede repetir.
- ✅ **Probado** en una base aparte (puerto 3311):
  - instalación desde cero (37 s) y segunda corrida sin volver a sembrar;
  - `db:check` local;
  - rechazo de URL remota sin SSL, del reseteo, del seed sin contraseñas y de `db:local` remoto;
  - conexión cifrada con certificado relativo; `strict` rechaza un certificado que no es del servidor.
- ✅ **Base compartida creada y cargada** en TiDB Cloud (`goeats-db`, AWS N. Virginia, límite de gasto $0):
  - las 5 migraciones pasaron sin cambios y `prisma migrate diff` no encuentra diferencias con el esquema;
  - 45 tablas, 71 llaves foráneas, 15 restaurantes, 78 platos y 17 cuentas;
  - las cuentas demo usan contraseñas aleatorias del `.env`; ninguna usa las conocidas del código;
  - backend levantado contra TiDB: el inicio de sesión responde 200 y el catálogo público trae los 15 restaurantes, en unos 2 s por la distancia al servidor.

### v0.7.12 — 2026-11-08 (Testing)
- ✅ **Pruebas automáticas en el repo** (`backend/tests/api/`, con `node:test` y sin dependencias nuevas):
  - **Seguridad:** sesiones, roles, aislamiento entre restaurantes y datos públicos del catálogo.
  - **Dinero:** el precio lo pone el servidor; propina con tope y fuera del total; calificar solo pedidos entregados y propios.
  - **Reservas:** validaciones, privacidad del teléfono y que nadie cancele reservas ajenas.
- ✅ **Cómo correrlas:** `API_URL=http://127.0.0.1:5001 TEST_OWNER_USER=... TEST_OWNER_PASSWORD=... npm run test:api`.
  - Opcionales: `TEST_OTHER_OWNER_USER` y `TEST_OTHER_OWNER_PASSWORD`.
  - Requieren Node 22 o más y solo funcionan contra una base de prueba local; se niegan a correr contra otra máquina salvo con `TEST_ALLOW_REMOTE=1`.
  - Resultado: 15/15.
- ✅ **Corrección en las pruebas:** `configError` vale `false` en lugar de `null`, porque `node:test` toma `skip: null` como prueba omitida.
- ⏳ **Celular real**: pasos en `practicas/2026-11-08/prueba-celular-real.md`. En la red local el GPS del navegador no funciona sin HTTPS.
- ✅ **Recorrido manual en la base local (2026-11-09)**: con las 4 migraciones aplicadas, un pedido a domicilio completo pasó por cliente, cocina, administrador y motorizado. Salieron y se corrigieron 2 errores:
  - **Confirmación del pedido** (`PublicCatalog.tsx`): el total no incluía la propina. Ahora muestra la propina y el "Total a pagar", igual que Mis pedidos.
  - **Calificar el pedido** (`OrderRatingBox.tsx`): si el motorizado calificaba al cliente primero, el cliente ya no podía calificar, porque ambas notas van en el mismo registro. Ahora se toma como calificado solo si tiene estrellas para el local.
  - **Nota del pedido en mesa** (`PublicCatalog.tsx`): un pedido hecho con el QR de la mesa llegaba a cocina con la distancia, "Efectivo/Contraentrega" y la referencia del domicilio. Ahora dice "En Mesa. Pago en caja."
- ✅ **Segundo recorrido (salón):** reserva confirmada con mesa asignada, pedido desde el QR de la mesa, llamado al mesero con espera de 10 min, alta de mesero y cajero desde Ajustes, unir, separar y cambiar de mesa, apertura de caja, bloqueo de cobro mientras la cocina no termina y cobro con descuento y propina.
- ✅ **Corregidos después del segundo recorrido:**
  - **Carrito al iniciar sesión.**
    - El carrito se guarda en `sessionStorage` (`goeats_cart_<slug>`), así que sobrevive al inicio de sesión o al registro.
    - Al cargar el catálogo se quitan los platos que ya no existen y se actualizan los precios.
    - El login vuelve al restaurante (o a la mesa del QR) con `returnTo`. `Auth.tsx` solo acepta rutas `/r/<slug>` o `/r/<slug>/mesa/<n>`, para que nadie use el enlace para mandar al cliente a otro sitio.
    - Al cerrar sesión se borran los carritos guardados, porque en un equipo compartido la siguiente persona no debe ver el carrito anterior.
  - **Cédula en caja.**
    - Nueva ruta `GET /api/orders/:id/billing-customer`, solo para el dueño y el cajero del local que recibió el pedido.
    - Devuelve nombre, cédula o RUC, correo, teléfono y dirección del cliente de la app. A otro local le responde 404 y al cliente 403.
    - En el POS, al abrir el cobro se llena la cédula. Si el cliente aún no está en la lista de clientes del local, el alta de cliente nuevo sale ya llena.
    - `seguridad.test.mjs` prueba estos permisos.
  - **Propina en efectivo en la caja.**
    - La propina cobrada en efectivo ya suma en el efectivo esperado, tanto en la pantalla de caja como en el cierre (`closeCashSession`, campo `cashTips` del resumen).
    - La pantalla avisa que son propinas para los meseros: no son ventas ni van en la factura. Al entregarlas se registran como egreso.
- ⚠️ **Regla de saldo para la demo:** con "Con recarga", ningún motorizado puede conseguir saldo, porque la tarjeta está bloqueada en el servidor y falta la cuenta bancaria para transferencias. En la base local se dejó "Con límite de deuda" desde Configuración de Tarifas hasta que los jefes decidan.

### v0.7.11 — 2026-11-08 (Pedidos de los jefes)
- ✅ **Migración** `20261108120000_bloque10_calificaciones_reservas_mesas`. Agrega:
  - **Restaurant:** `waiterCallEnabled`, `waiterCallWaitMin`, `payBeforeEating` y `reservationsEnabled`.
  - **User:** `lastLat`, `lastLng` y `lastLocationAt`.
  - **Table:** `joinedToId`.
  - **Order:** `tipAmount`, `readyAt` y `dispatchAlertAt`.
  - **OrderItem:** `readyAt`.
  - **DeliveryRate:** `dispatchRadiusKm` (5) y `dispatchWaitMin` (3).
  - **Modelos nuevos:** `OrderRating` y `Reservation`. El teléfono de la reserva se guarda cifrado con `encryptSecret`.
  - Cada quien debe aplicarla en su base.
- ✅ **Pago Plus del motorizado**: `getDeliveryPayout` e `isPlusDelivery` en `delivery.controller.ts` hacen la cuenta en un solo lugar.
  - Plus usa la distancia real, ya no 2,5 km fijos.
  - En efectivo descuenta la comisión retenida.
  - En línea devuelve lo pagado en el local.
- ✅ **Cupones**: se quitan los códigos de ejemplo HOLA30 y LOJALOVE de `LandingExperience.tsx`. La página muestra las promociones reales de los locales y la oferta Plus.
- ✅ **Calificaciones** (`modules/ratings`):
  - El cliente califica un pedido entregado: local, motorizado y comentario. Solo una vez; de 1 a 5 estrellas; comentario de hasta 500 caracteres sin caracteres de control.
  - El motorizado califica al cliente, y el cliente no ve esa nota.
  - El promedio se muestra en el catálogo, la lista pública, Mis pedidos, el panel del motorizado, la lista de motorizados del administrador y Reportes.
  - Componentes: `Stars.tsx`, `OrderRatingBox.tsx`, `RateCustomerModal.tsx` y `RestaurantRatings.tsx`.
- ✅ **Propina**:
  - **Domicilio:** montos fijos en el catálogo; se guarda en `tipAmount`. En línea se acredita a la billetera del motorizado; en efectivo la cobra él.
  - **Caja:** campo en el cobro del POS (`tip` en `POST /api/sales`, máximo $100). No entra en la venta ni en la factura.
  - Propinas por mesero en Reportes.
- ✅ **Mesas**: `POST /api/tables/:id/join` y `/:id/separate`, y `changeTable` reescrito.
  - `utils/tables.ts` con `releaseTable` y `resolveOrderTable`: un pedido por QR a una mesa unida va a la principal.
  - En `TablesPage.tsx` (`TableGroupActions.tsx`) el mesero y la caja pueden unir, separar y cambiar de mesa.
- ✅ **Reservas** (`modules/reservations`):
  - El cliente reserva desde el catálogo (`ReserveTable.tsx`), con al menos 30 minutos de anticipación y hasta 60 días, de 1 a 30 personas y un máximo de 3 abiertas por local. Las ve y cancela en "Mis reservas".
  - El local las gestiona en `/reservations`, con el aviso `reservation-updated` por socket.
- ✅ **Cocina**: `GET /api/kitchen/history?hours=` (máximo 72 h) y pestaña Historial (`KitchenHistory.tsx`) con los minutos de cada plato y el promedio.
- ✅ **Llamar al mesero**: cada local lo activa o desactiva y fija la espera entre llamados, de 0 a 30 min. Si se repite antes, responde 429 con el tiempo que falta. Pedir la cuenta espera 2 min como máximo.
- ✅ **Motorizado cercano** (`delivery/dispatch.ts`):
  - Mientras dura la espera, el pedido listo solo lo ven los motorizados dentro del radio; después lo ven todos.
  - Si nadie lo toma, el vigilante (cada 30 s) avisa al administrador por el socket `dispatch-alert` (sala `admins`).
  - La pantalla del motorizado envía su ubicación cada 60 s, aunque no tenga pedido, y muestra la distancia, "Pedido cercano" y la propina.
  - El administrador configura el radio y la espera en la tarifa, y ve los pedidos listos sin motorizado (`UnassignedDeliveries.tsx`, `GET /api/delivery/unassigned`).
- ✅ **Pagar antes de comer** (`payBeforeEating`): el pedido de mesa queda pendiente y pasa a cocina al cobrarlo, sin liberar la mesa. El catálogo lo avisa en la mesa.
- ✅ **Errores encontrados y corregidos**:
  - Una actualización parcial del restaurante borraba `mapLatitude` y `mapLongitude`.
  - Los reportes de "hoy" dejaban fuera ventas por la zona horaria; ahora `getReportRange` usa días de Ecuador (UTC-5).
  - `POST /delivery/location` aceptaba coordenadas fuera de rango.
  - `RouteMap.tsx`: si el mapa se cerraba mientras se acercaba a la ruta, Leaflet fallaba (`_leaflet_pos`). Ese `fitBounds` ya no usa animación.
  - El seed tenía contraseñas fijas. Ahora lee `SEED_ADMIN_PASSWORD`, `SEED_DRIVER_PASSWORD` y `SEED_OWNER_PASSWORD`; en producción son obligatorias.
- ✅ **POS**: el descuento tiene `id="pos-discount"` y su etiqueta asociada, para no confundirlo con la propina.
- ✅ **Pruebas**:
  - API del bloque 10: 129/129.
  - Navegador y celular del bloque 10: 44/44.
  - Regresión completa (servidor, navegador, celular y pedido completo), bloques 0 a 10: 24/24 grupos sin fallas.
  - `backend/tests/api/` (`npm run test:api`): pruebas automáticas del repo. Seguridad, dinero y reservas.
  - Informe en `practicas/2026-11-08/`.
- ⚠️ **Por decidir con los jefes**: valores finales de radio y espera, si la espera del mesero de 10 a 20 min es entre llamados (así quedó), IVA, regla de saldo y billetera del cliente.

### v0.7.10 — 2026-11-07 (Prueba completa)
- ✅ **Prueba de punta a punta de los bloques 0 a 8**: API 640/640, navegador 147/147, pedido completo 14/14, rutas por rol 114 pantallas y responsividad 147 pantallas (Android 360, iPhone 390, tablet 768). Cada grupo arranca con datos limpios. Informe en `practicas/2026-11-07/prueba-completa.md`.
- ✅ **Celular**: `Reports.tsx` (filtro de fechas que baja de línea; clase `reports-grid`, una columna en 900 px o menos), `TablesPage.tsx` (encabezado y pestañas del salón), `Settings.tsx` (encabezados de salones; tablas de personal, cajas e inventario con `mobile-cards`), `Orders.tsx` (pestañas con `scrollable-tabs`), `.customer-dashboard-tabs` que baja de línea.
- ✅ **Tablas como tarjetas en todas las páginas**: nuevo `components/MobileTableLabels.tsx`, montado en `AppLayout`, pone `data-label` a las celdas de `table.mobile-cards` (reemplaza el efecto que había en `SuperAdmin.tsx`; ignora celdas con `colSpan`).
- ✅ **Tamaño táctil**: en `index.css`, con `(max-width: 1024px) and (pointer: coarse)`, botones, `select` y `.glow-btn` de al menos 40 px. Campos con `max-width: 100%` en celular. Etiquetas de mapas a 12 px.
- ✅ **Plus**: `PlusPromo.tsx` pide `/saas/plans` solo con sesión (antes dejaba un 401 en la consola).
- ⚠️ **Observado**: en una vuelta el backend de prueba dejó de responder a mitad del recorrido; no se repitió.

### v0.7.9 — 2026-11-07 (Demo presentable)
- ✅ **A14**: `PUBLIC_RESTAURANT` en `restaurants.controller.ts`: lista pública, catálogo, pedido público y llamar al mesero exigen `isActive` y estado `APPROVED` o `ACTIVE`. Aprobar activa al dueño aunque no tenga correo.
- ✅ **A15**: `utils/api.ts` ya no devuelve restaurantes ni sesiones inventadas sin servidor; lanza `OFFLINE_MESSAGE`. Los errores 502 a 504 del proxy también.
- ✅ **Cuentas bancarias**: `PublicCatalog.tsx` ofrece transferencia solo con `bankAccountsJson` del local. Nuevo `components/PlatformBankInfo.tsx`, que lee `VITE_PLATFORM_BANK_*`, para recargas, billetera y Plus.
- ✅ **A16 y M4**: Sandbox y "Vaciar Sistema" solo con `import.meta.env.DEV`. Tablas del admin con clase `mobile-cards` (tarjetas en celular).
- ✅ **M3**: aviso de notificaciones en `#layout-notices` (`App.tsx`), dentro del flujo y no flotante; cierre recordado en `localStorage` (`goeats_push_notice_closed`).
- ✅ **M18 y M19**: `public/manifest.webmanifest`, íconos en `public/icons/` y viewport sin bloqueo de zoom.
- ✅ **B8**: seeds y `Aggregator.tsx` con locales inventados (`pollo-dorado`, `brasa-burger`, `la-granja`, `burger-costena`, `la-nonna`) y logos nuevos.
- ✅ **Blanco y negro**: `--accent-primary` #111111; los tonos verdes fijos pasan a negro translúcido. Letra mínima de 12 px y campos de 16 px en celular. Menú del dueño y pestañas adaptados al celular.
- ⚠️ **Pendiente**: cuenta bancaria real de GoEats e ícono definitivo.

### v0.7.8 — 2026-11-07 (Restaurante)
- ✅ **A17**: `DELETE /auth/account` y `/auth/profile` responden 409 si el dueño es el único activo de su local.
- ✅ **A20**: `Restaurant.taxRate` (0, 5, 12 o 15; 15 por defecto), editable en Ajustes. `sales.controller.ts` lo usa con todos los platos y la venta guarda su tasa.
- ✅ **Mesero**: `POST /orders/:id/attend` (solo MOZO) toma un pedido sin mesero; editar o cambiar el estado también lo asigna si estaba vacío.
- ✅ **Cocinero**: `OrderItem.preparedById`, puesto al pasar un plato a preparación o listo, o al marcar todo el pedido listo. `GET /reports/waiters` devuelve también `cooks`. Componente `OrderStaffLine`.
- ✅ **Personal**: `DELETE /auth/staff/:id` desactiva a quien tiene historial y elimina a quien no.
- ✅ **Promociones**: `MenuItemVariant.promoPrice` y `promoEndsAt`, validados en `utils/promotions.ts`. El catálogo público y `/menu/categories` (POS) devuelven el precio vigente y `regularPrice`; el editor (`?includeHidden=true`) ve los campos crudos. Los pedidos se cobran con `getEffectivePrice`.
- ⚠️ **Migración**: `20261107230000_restaurante_iva_promos_personal`, aplicada solo en la copia de prueba.
- ⚠️ **Por confirmar**: tasa de IVA.

### v0.7.7 — 2026-11-07 (Motorizado)
- ✅ **Regla de saldo**: `DeliveryRate.balanceRule` es `PREPAID` (recarga) o `DEBT_LIMIT` (negativo hasta `maxDebtLimit`). La aplica `deliveryWallet.ts` al tomar, y `/delivery/wallet` devuelve `canTakeOrders`.
- ✅ **Traslado**: `Order.pickedUpAt` y `POST /delivery/start/:id`.
- ✅ **Pasar y cancelar**: `POST /delivery/pass/:id` y `/delivery/cancel/:id`, antes de retirar y con motivo. Devuelven la comisión.
- ✅ **Entregas con problema**: `POST /delivery/complete/:id` con `withoutPin` y motivo; `POST /delivery/no-show/:id` después de retirar, sin mover dinero.
- ✅ **Incidencias**: modelo `DeliveryIncident`; `GET /delivery/incidents` y `POST /delivery/incidents/:id/review` para el administrador. Pantallas `DriverOrderActions` y `DeliveryIncidentsPanel`.
- ✅ **Devolución de comisión**: `refundTakeCommission` devuelve lo cobrado menos lo ya devuelto, también al cancelar desde el local.
- ⚠️ **Migración**: `20261107200000_motorizado_incidencias`, aplicada solo en la copia de prueba.
- ⚠️ **Por confirmar**: regla de saldo y tiempo de espera cuando el cliente no sale.

### v0.7.6 — 2026-11-07 (Cliente)
- ✅ **Código de entrega**: se ve en Mis pedidos, en el seguimiento y al recargar el catálogo.
- ✅ **Registro**: `/login` ofrece "Registrarse" al cliente. Acepta cédula o RUC (`isValidRuc`, `getSameIdentityValues` en `utils/validation.ts`) y una persona tiene una sola cuenta.
- ✅ **Sesión vencida**: `apiRequest` avisa con `goeats:session-expired` y `AuthContext` lleva al login. La sesión se lee antes del primer dibujo.
- ✅ **Platos**: `MenuItem.isActive` oculta un plato del catálogo y la caja. Los platos con pedidos no se borran y `OrderItem` usa `onDelete: Restrict`.
- ✅ **Direcciones**: modelo `CustomerAddress` y rutas `/api/orders/customer/addresses`. La principal se copia a los campos de entrega del usuario. Pantallas `SavedAddresses`, `CustomerLocationSetup?new=1` y selector en `PublicCatalog`.
- ✅ **Datos**: Mis pedidos ya no envía ganancias del motorizado ni comisiones. `errorHandler` responde 409 a datos repetidos.
- ⚠️ **Migración**: `20261107120000_direcciones_y_platos_ocultos`, aplicada solo en la copia de prueba.
- ⚠️ **Por confirmar**: si una misma cédula puede tener cuenta de cliente y de motorizado.

### v0.7.5 — 2026-11-07 (Pedido Correcto y Caja que Cobra)
- ✅ **Estados**: `backend/src/utils/orderRules.ts` define los cambios permitidos, quién verifica pagos y cuándo se cobra o se cancela.
- ✅ **Cobro**: `emitSale` funciona sin emisor, calcula el monto en el servidor y no repite ventas ni números. La factura electrónica sigue necesitando emisor.
- ✅ **Caja**: el cierre y la pantalla cuentan solo efectivo, con descuentos aplicados una vez.
- ✅ **Motorizado**: solo ve pedidos `READY`. Tomar y entregar son atómicos, y solo se toman domicilios.
- ✅ **Cancelación**: devuelve la comisión del motorizado (`COMMISSION_REFUND`) y marca `REFUND_PENDING` si el pedido estaba pagado.
- ✅ **PIN**: `hideDeliveryPin` lo retira de las respuestas y eventos al personal y al motorizado.
- ✅ **Edición**: valida cantidades, bloquea pedidos cerrados y conserva el avance de los platos sin cambios.
- ✅ **Pantallas**: `POS` usa los comprobantes de la base y avisa si la factura no se emitió. `Orders` agrega "Marcar entregado" y "Reembolso pendiente". `RouteMap` ignora rutas que llegan tarde.
- ⚠️ **Reglas por confirmar**: mesa solo se cobra cuando cocina terminó, domicilios fuera de caja y pedidos cobrados sin cancelación.
- ⚠️ **Falta**: pantalla de datos de facturación, inventario de pedidos pagados en línea y devolución real de dinero.

### v0.7.4 — 2026-11-06 (Protección de Cuentas y Datos)
- ✅ **Mapa**: `backend/src/utils/maps.ts` solo guarda enlaces o iframes de Google Maps. `PublicCatalog` ya no usa `dangerouslySetInnerHTML`.
- ✅ **Límite de intentos**: `backend/src/utils/rateLimit.ts` cubre login, PIN de entrega, registros, ingreso social, tickets, pedidos públicos, llamadas al mesero y búsqueda de mapas.
- ✅ **Sesiones**: `getSessionUser` en `middlewares/auth.ts` revisa la cuenta en cada petición y en cada conexión de tiempo real.
- ✅ **Registros**: `validation.ts` valida clave, cédula, correo, teléfono y usuario.
- ✅ **Cifrado**: `backend/src/utils/secrets.ts` guarda `payphoneToken` con AES-256-GCM usando `DATA_ENCRYPTION_KEY`. La firma del SRI se descifra al usarla si llega cifrada.
- ✅ **Fugas**: `hideRestaurantSecrets` retira token y firma de las respuestas. Cambiar el estado de un pedido ya no envía el hash de la clave del cliente.
- ✅ **Soporte**: 5 tickets por hora, campos validados y texto escapado.
- ✅ **Pantallas**: `frontend/src/utils/html.ts` escapa datos en comandas y mapas. Los accesos rápidos solo aparecen en desarrollo.
- ✅ **Servidor**: cabeceras de seguridad, cuerpos pequeños en rutas públicas y errores 500 sin detalles.
- ⚠️ **Variables nuevas**: `DATA_ENCRYPTION_KEY`, obligatoria en producción, y `TRUST_PROXY` al publicar detrás de un proxy.
- ⚠️ **Por definir**: cifrar la cédula, cerrar sesiones al cambiar la clave, CSP y registro de extranjeros.

### v0.7.3 — 2026-11-06 (Dinero Validado en el Servidor)
- ✅ **Envío**: `createPublicOrder` calcula el costo con `backend/src/utils/shipping.ts`. La web usa la misma fórmula en `frontend/src/utils/shipping.ts`, y el catálogo público entrega `deliveryRate`.
- ✅ **Tarjeta**: solo con `ALLOW_SIMULATED_PAYMENTS=true` y siempre como simulación.
- ✅ **Plus**: `toggle-plus` solo cancela; activarlo exige comprar un plan.
- ✅ **Recargas**: `/saas/purchase` toma el monto de `SaaSPlan`, valida rol y tipo, y la aprobación no acredita dos veces.
- ✅ **Validaciones**: `backend/src/utils/validation.ts` se usa en precios, caja, tarifas, recargas, planes y compras. El pedido público valida tipo, pago, dirección, teléfono, coordenadas y cantidad.
- ⚠️ **Por definir**: la distancia es en línea recta, y sin ubicación se cobran 2,5 km.

### v0.7.2 — 2026-11-06 (Bloque 1 de Seguridad)
- ✅ **Claves fuera del código**: se quitaron la contraseña SMTP y las claves JWT por defecto. `JWT_SECRET` es obligatorio y en producción debe tener al menos 32 caracteres.
- ✅ **Configuración de correo**: ya no reemplaza `JWT_SECRET` ni `DATABASE_URL` del `.env`.
- ✅ **Tiempo real con sesión**: la lógica está en `backend/src/config/socket.ts`. Socket.io exige token, el servidor asigna la sala del restaurante y `join-order` valida quién puede entrar. Se quitaron los envíos a todos los conectados.
- ✅ **Ubicación del motorizado**: solo el motorizado asignado puede actualizarla.
- ✅ **`/reset-database`**: solo `SUPER_ADMIN`, con `ALLOW_DATABASE_RESET=true` y confirmación VACIAR.
- ✅ **Catálogo público**: no entrega `payphoneToken`. `wifiPassword` solo sale con un `tableId` válido del restaurante.
- ⚠️ **Pendiente**: cambiar la contraseña SMTP en el proveedor, porque sigue en el historial de Git. Las cuentas bancarias siguen visibles en el catálogo para pagos por transferencia.

### v0.7.1 — 2026-11-06 (Aislamiento entre Restaurantes)
- ✅ **Restaurante desde el token**: `tenantMiddleware` usa siempre el `restaurantId` del token. Si `x-restaurant-id` dice otro, responde 403. Solo `SUPER_ADMIN` puede elegir restaurante con esa cabecera.
- ✅ **Clientes y motorizados**: ya no entran a las rutas de restaurante.
- ✅ **Roles en rutas de lectura**: pedidos, caja, ventas, clientes, inventario, menú, reportes, compras y mesas. Mozo: pedidos, cajas, sesión activa, clientes, menú y mesas. Cocina: sus rutas de `/kitchen`.
- ✅ **Prueba en copia aislada**: 148 de 148 comprobaciones por API, pedido completo por pantalla y 114 rutas en web y celular emulado, sin errores 500.
- ✅ **Plan de tres semanas**: agregado a `docs/PLAN_EQUIPO_MVP.md`, con prototipo e idea de negocio el 20 de noviembre y MVP con testing el 27.
- ⚠️ **Sigue pendiente**: Socket.io sin login y `/reset-database`.

### v0.7.0 — 2026-11-06 (Orden del Proyecto, Plan del Equipo y Migración Única)
- ✅ **Orden del proyecto**: el sistema PHP pasó a `legacy/sistema-php/`, la documentación suelta a `docs/`, los scripts a `backend/scripts/` y los seeds y SQL a `backend/prisma/seeds/` y `backend/prisma/sql/`. No se borró ningún archivo.
- ✅ **Plan del equipo**: se creó `docs/PLAN_EQUIPO_MVP.md` con fases, reglas de trabajo, supuestos y dudas para los jefes.
- ✅ **Migración única (local, sin subir)**: se creó `20261106120000_estructura_unica`, que crea 40 tablas y coincide con `schema.prisma`. Las 4 migraciones anteriores están en `backend/prisma/migraciones_anteriores/`.
- ✅ **Prueba local**: migración, datos de prueba, backend y web iniciados correctamente en la PC de Deyvi.
- ⚠️ **Pendientes detectados**:
  - `/reset-database` permite entrar a un dueño y borra tablas sin filtrar por restaurante.
  - `backend/src/services/email.ts` contiene credenciales SMTP escritas en el código como valor por defecto.
  - La migración anterior `20260712163449_init` usaba tablas en minúsculas y podría fallar en Linux; falta comprobarlo.
  - Los datos de prueba no crean cliente, mesero, cocina ni caja, e incluyen marcas reales.
  - Una ruta inexistente regresa al inicio, sin página 404.
  - La web genera un archivo JavaScript de 1,5 MB, que puede tardar en cargar en celulares.
- ✅ **Test end to end en web y celular emulado**: realizado en una copia aislada, sin cambiar código. El pedido a domicilio completo funciona.
- ⚠️ **Errores críticos del test** (pendientes de corregir):
  - La caja no puede cobrar: nada crea el `Issuer` de facturación.
  - `x-restaurant-id` manda sobre el token, y clientes y motorizados pueden leer datos de restaurantes. Corregido en v0.7.1.
  - Socket.io entrega pedidos y PIN sin login.
  - `mapIframe` permite ejecutar código en el navegador de los visitantes.
  - El envío, la tarjeta, Plus y las recargas no se validan en el servidor.
  - Credenciales SMTP y clave JWT por defecto en el código, también en `backend/src/config/env.ts`.
  - La regla de saldo negativo hasta -$50 no se cumple, porque tomar un pedido exige $0.50.

---

### v0.6.0 — 2026-08-31 (Lógica Financiera de Repartidores, Sistema Antifraude y Documentación Modular)
- ✅ **Lógica Financiera y Antifraude para Motorizados (Modelo Zaymi)**:
  - **Pagar Proveedor con Descuento**: El motorizado paga en el mostrador del restaurante el precio de la carta menos la comisión acordada con el restaurante (`deliveryCommissionPercentage`), evitando la necesidad de cobros posteriores al local.
  - **Cobrar al Cliente Total**: El motorizado cobra el 100% de la comida + flete en efectivo.
  - **Cálculo de Deuda y Antifraude**: La comisión de la empresa retenida en el bolsillo del motorizado se carga como deuda al balance de su billetera.
  - **Límite de Deuda de $50.00 (`maxDebtLimit`)**: Si el motorizado acumula una deuda de $-\$50.00$ o superior, el sistema pausa automáticamente la recepción de nuevos pedidos en efectivo.
  - **Cruce Automático de Cuentas**: Los pedidos pagados en línea (tarjeta/transferencia) acreditan el reembolso del plato y el flete directamente a favor en la billetera, amortizando automáticamente cualquier deuda previa.
  - **Cortes de 5 Horas y Liquidaciones de 1-Clic**: Endpoint administrativo `/delivery/settle` y botón en `SuperAdmin.tsx` para liquidar con un solo clic los saldos positivos a favor de los motorizados tras verificar transferencias bancarias.
- ✅ **Interfaz Zaymi en Delivery Dashboard (`DeliveryDashboard.tsx`)**:
  - Tarjetas de pedido con panel de desglose: **"💵 Pagar proveedor: $X.XX"**, **"🧾 Cobrar cliente: $X.XX"**, y **"💰 Total que ganará por esta orden: $X.XX"**.
  - Indicador de estado de cuenta ("ACTIVO" vs "⚠️ CUENTA PAUSADA POR DEUDA") y barra de deuda máxima.
- ✅ **Creación de Arquitectura de Documentación Modular (`docs/`)**:
  - `docs/README.md`: Índice maestro y mapa del repositorio para navegación inmediata.
  - `docs/repartidores/01_logica_financiera.md`: Fórmulas matemáticas y antifraude.
  - `docs/repartidores/02_flujo_operativo.md`: Flujo y estados de la pantalla de pedidos.
  - `docs/repartidores/03_liquidacion_cortes.md`: Políticas de cortes de 5h y pagos.
  - `docs/arquitectura/mapa_backend.md`: Rutas directas a controladores y Prisma schema.
  - `docs/arquitectura/mapa_frontend.md`: Rutas directas a componentes y vistas React.
  - `docs/arquitectura/mapa_mobile.md`: Rutas a la app Flutter (`goeats_customer_app`).
- ✅ **Módulo de Pedidos Públicos**: Implementado el endpoint de creación de pedidos públicos (`createPublicOrder`) que permite pedidos de Delivery y Dine-in (QR) anónimos directamente desde el celular si el restaurante tiene habilitado el autoservicio QR (`qrOrderingEnabled`).
- ✅ **Frontend React + Vite**: Construcción completa de la interfaz en React + TypeScript y CSS premium:
  - **Auth**: Pantalla de Login y registro SaaS de restaurante con generación automática del tenant.
  - **POS**: Panel táctil e interactivo de punto de venta (grilla de mesas con estado ocupado/libre, selector de categorías, carro de compras con personalización por plato y modal de facturación SRI).
  - **Kitchen KDS**: Monitor de cocina agrupado por pedidos con soporte WebSockets para actualizaciones automáticas y sonidos de alerta.
  - **Caja**: Gestión de aperturas, cierres de sesión de caja, saldo estimado por sistema y registro de ingresos/egresos.
  - **Menú**: CRUD completo de categorías, productos, variantes y edición interactiva de recetas (insumos por presentación).
  - **Reportes**: Tablero de control con KPI cards, gráfico comparativo de ventas semanales vs metas diarias (Recharts), y reportes de personal.
  - **Web Pública**: Catálogo digital público con validación QR y listado de restaurantes activos (agregador).

### v0.4.0 — 2026-06-16 (Fase 3 del Backend Completada)
- ✅ **Caja y Control Financiero**: Implementado el CRUD de cajas físicas, aperturas y cierres de sesión de caja, control de egresos/gastos y de ingresos administrativos adicionales.
- ✅ **Ventas y SRI**: Desarrollada la lógica de emisión de ventas con cálculo de impuestos en Ecuador (subtotal 0, subtotal 12, IVA y descuentos), integración automática con firma electrónica XAdES-BES, SOAP SRI, y generación de PDF RIDE con envío nodemailer.
- ✅ **Módulo de Clientes**: CRUD para gestionar clientes fiscales y de POS.
- ✅ **Módulo de Inventario**: Gestión de stock y Kardex, con descuento de insumos automatizado por receta al realizar ventas.
- ✅ **Compras y Créditos**: CRUD de proveedores, compras al contado y a crédito con abonos de cuotas e inyección automática en caja chica.
- ✅ **Reportes y Tableros**: Panel administrativo del Dashboard con ventas semanales comparadas con metas por día, indicators de rendimiento, y reportes de productos/mozos.

### v0.3.0 — 2026-06-16 (Fase 1 y 2 del Backend Completadas)
- ✅ **Base de Datos limpia**: Inicializada base de datos MySQL 8.4 limpia local en puerto 3309.
- ✅ **Esquema Prisma Relacional**: Diseñado `schema.prisma` integrando facturación SRI y operaciones multi-tenant.
- ✅ **Servidor Express + WebSockets**: Configurado Express y Socket.io con middlewares de seguridad (`auth`, `tenant`, `rbac`).
- ✅ **Módulos Core del Backend**:
  - **Auth**: Registro de dueños, staff y login con hashing bcrypt y tokens JWT.
  - **Restaurantes**: CRUD administrativo y catalogación pública (agregador).
  - **Mesas y Salones**: CRUD de salones y mesas con soporte para códigos QR de mesa.
  - **Menú**: CRUD de categorías, productos, presentaciones (variantes de precio) e ingredientes (recetas).
  - **Pedidos**: Lógica unificada para Dine-in, Takeout y Delivery con WebSockets en tiempo real.
  - **Cocina**: Kitchen Display System para despachar items por áreas de producción (Cocina/Bar).
- ✅ **Seeding**: Script para poblar unidades de medida, tipos de documentos de Ecuador y SuperAdmin.
- ✅ **Integración SRI**: Copiados módulos SRI de facturación al proyecto backend.

### v0.2.0 — 2026-06-16 (Sistema PHP Encontrado y Analizado)
- ✅ **CORRECCIÓN**: Se descubrió sistema PHP completo en `LIMPIO/SIN_IMPRESION/` y `LIMPIO/CON_IMPRESION/`
- ✅ Análisis de base de datos MySQL: 45 tablas, 22 vistas, 35 stored procedures
- ✅ Análisis del panel admin PHP (MVC): 12 módulos completos
- ✅ Análisis de la web pública PHP: pedidos online + QR para mesas
- ✅ Identificación de versiones CON/SIN impresión térmica
- ✅ Documentación de credenciales y accesos
- ✅ Actualización completa del documento con sistema real

### v0.1.0 — 2026-06-15 (Planificación Inicial)
- ⚠️ Error: Se reportó directorio vacío (los archivos estaban en subcarpeta `LIMPIO/`)
- ✅ Análisis de sistema FACTURACION SRI (base de código a reutilizar)
- ✅ Análisis del sistema COMERCIO (patrones RBAC, pedidos, pagos)
- ✅ Definición de arquitectura multi-restaurante SaaS

---

> **Nota**: Este documento debe ser actualizado cada vez que se implemente una nueva funcionalidad, se corrija un bug, o se modifique la arquitectura del sistema.

### sugerencias
- En la pagian de cliente los filtros de mis pedidos y mi perfil al mmomento de cambiarse no muestran lo correspondiente
- datos incorrectos en lo que es la parte de iniciar sesion en restaurante
- falta de diseño para los mensajes de confirmacion 
- falta alerta de que es obligatorio que se escriba el motivo de rechazo del restaurant
- falta actualizacion automaticamente de las acciones que se hacen en super admin
- al momento de querer editar que se envie a la parte de donde se esta editando para que le sea mas facil al usuario 
- revisar el envio de correos por parte del admin
- iconos un poco mas realistas
- diseñar un pequeño icono correspondiente a la app
- agregar un limite de caracteres al campo de usuario
- agregar un filtro para que la contraseña sea segura
- restriccion de caracteres en los campos