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