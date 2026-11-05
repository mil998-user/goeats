# 📱 Mapa de Arquitectura de la App Móvil Flutter

> **Ruta base:** `goeats_customer_app/`  
> **Framework:** Flutter (Dart)  
> **Punto de Entrada:** [`goeats_customer_app/lib/main.dart`](../../goeats_customer_app/lib/main.dart)

---

## 📂 Organización de Capas (`lib/`)

```
lib/
├── core/
│   ├── constants/constants.dart       <- URLs base del backend (http://localhost:4000/api)
│   ├── network/api_client.dart        <- Cliente HTTP Dio / http con interceptores de Auth JWT
│   └── theme/app_theme.dart           <- Paleta de colores dark/orange de GoEats
│
└── features/
    ├── auth/                          <- Login de clientes y motorizados
    │   ├── providers/auth_provider.dart
    │   └── ui/login_screen.dart
    │
    ├── aggregator/                    <- Pantalla principal con lista de restaurantes afiliados
    │   ├── providers/restaurant_list_provider.dart
    │   └── ui/home_screen.dart
    │
    ├── restaurant/                    <- Catálogo del restaurante y selector de platos/variantes
    │   ├── providers/catalog_provider.dart
    │   └── ui/restaurant_detail_screen.dart
    │
    ├── cart/                          <- Carrito de compras con cálculo de subtotal y envío
    │   └── providers/cart_provider.dart
    │
    ├── checkout/                      <- Confirmación de dirección, teléfono y método de pago
    │   └── ui/checkout_screen.dart
    │
    └── orders/                        <- Seguimiento de pedidos activos en tiempo real
        ├── providers/orders_provider.dart
        └── ui/orders_screen.dart
```

---

## 🔗 Integración con la Lógica de Repartidores
- Cuando el cliente confirma un pedido en `checkout_screen.dart`, se envía al endpoint `/orders/customer/checkout`.
- El pedido queda disponible para que el repartidor lo visualice con el costo de flete correspondiente y el desglose de "Pagar proveedor" y "Cobrar cliente".
