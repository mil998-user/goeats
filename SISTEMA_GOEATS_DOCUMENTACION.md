# 🍽️ SISTEMA GOEATS - Documentación Completa del Sistema

> **Documento Vivo** — Este archivo se actualiza con cada mejora del sistema para mantener el contexto completo.
> 
> **Última actualización:** 2026-08-31
> **Versión:** 0.6.0 (Lógica Financiera de Repartidores, Sistema Antifraude y Documentación Modular)

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
SISTEMA GOEATS/LIMPIO/
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