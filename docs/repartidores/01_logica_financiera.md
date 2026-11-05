# 💰 Lógica Financiera, Comisiones y Sistema Antifraude para Repartidores

> **Archivo de Código Principal:** [`backend/src/modules/delivery/delivery.controller.ts`](../../backend/src/modules/delivery/delivery.controller.ts)  
> **Modelo de Datos:** [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma)

---

## 🎯 1. Principio Operativo y Antifraude

En los pedidos de comida a domicilio con pago en efectivo:
1. El repartidor **paga al restaurante con su propio dinero** al retirar el pedido.
2. El restaurante le cobra al repartidor el valor de los platos **menos la comisión acordada con GoEats** (ej. 10%). De este modo, la empresa no tiene que perseguir al restaurante a fin de mes para cobrar su comisión: la comisión ya fue descontada directamente en el mostrador.
3. El repartidor va donde el cliente y **le cobra el 100% del valor de la carta + el costo del envío**.
4. Al recibir el dinero del cliente:
   - El repartidor recupera lo que pagó en el restaurante.
   - Cobra su tarifa de envío y bonos ganados.
   - **Le sobra en el bolsillo la comisión que le pertenece a GoEats**.
5. **Riesgo Antifraude:** Si el repartidor acumula esas comisiones en su bolsillo y no las devuelve, se fugaría con el dinero de la empresa.
6. **Solución:** Esa comisión retenida se carga automáticamente a su **Billetera como Saldo Negativo (Deuda)**. Se establece un **límite de deuda máxima de $50.00**. Si la deuda alcanza o supera los $50.00, el sistema le bloquea automáticamente la aceptación de nuevos pedidos en efectivo.

---

## 🧮 2. Fórmulas Matemáticas Exactas

### Caso A: Pedido en EFECTIVO (Modelo Zaymi)

#### Variables:
- $P_{carta}$: Precio total de la comida en carta (subtotal de platos).
- $C_{\%}$: Porcentaje de comisión del restaurante (configurable por restaurante, ej. 10%).
- $E$: Costo del servicio de entrega (flete cobrado al cliente).
- $B$: Bono o incentivo pagado por la plataforma al repartidor (ej. $0.10).

#### Fórmulas:
1. **Comisión del Restaurante:**
   $$\text{Comisión} = P_{carta} \times \frac{C_{\%}}{100}$$

2. **Pagar Proveedor / Restaurante:**
   $$\text{Pago Local} = P_{carta} - \text{Comisión}$$

3. **Cobrar al Cliente:**
   $$\text{Cobro Cliente} = P_{carta} + E$$

4. **Ganancia Neta del Repartidor:**
   $$\text{Ganancia Repartidor} = E + B$$

5. **Excedente Retenido en Mano del Repartidor:**
   $$\text{Efectivo en Mano} = \text{Cobro Cliente} - \text{Pago Local} = (P_{carta} + E) - (P_{carta} - \text{Comisión}) = E + \text{Comisión}$$

6. **Impacto en el Balance de la Billetera (Deuda generada):**
   $$\Delta \text{Balance} = \text{Ganancia Repartidor} - \text{Efectivo en Mano} = (E + B) - (E + \text{Comisión}) = B - \text{Comisión}$$

> **Interpretación:** Como la Comisión casi siempre es mayor al Bono, $\Delta \text{Balance}$ es negativo. Ese valor negativo se descuenta de la billetera o se suma como deuda.

---

### 📊 Ejemplo Numérico Real (Captura Zaymi):
- $P_{carta} = \$3.90$
- $C_{\%} = 10\%$ $\rightarrow$ $\text{Comisión} = \$0.39$
- $E = \$0.95$ (envío)
- $B = \$0.10$ (bono plataforma)

1. **Pagar Proveedor:** $\$3.90 - \$0.39 = \mathbf{\$3.51}$
2. **Cobrar Cliente:** $\$3.90 + \$0.95 = \mathbf{\$4.85}$
3. **Ganancia Repartidor:** $\$0.95 + \$0.10 = \mathbf{\$1.05}$
4. **Efectivo Físico Sobrante en Mano:** $\$4.85 - \$3.51 = \mathbf{\$1.34}$
5. **Ajuste en Balance de la Billetera:**
   $$\$1.05 - \$1.34 = -\mathbf{\$0.29} \text{ (Deuda con GoEats)}$$

---

### Caso B: Pedido Pagado EN LÍNEA (Tarjeta / Transferencia directa a GoEats)

En este escenario, el cliente paga previamente a la empresa:
- El repartidor paga en el restaurante: $\text{Pago Local} = P_{carta} - \text{Comisión}$
- El repartidor cobra al cliente: $\$0.00$
- El repartidor debe recibir:
  $$\Delta \text{Balance} = +\text{Pago Local} + \text{Ganancia Repartidor}$$

#### Cruce Automático de Deuda:
Si el repartidor tenía una deuda de $-\$18.50$ y entrega un pedido en línea donde le corresponde cobrar $+\$4.56$:
$$\text{Nuevo Balance} = -\$18.50 + \$4.56 = -\$13.94$$
La deuda se amortiza de manera 100% automática sin intervención manual.

---

## 🛡️ 3. Reglas de Negocio y Antifraude

| Regla | Parámetro | Comportamiento del Sistema |
| :--- | :--- | :--- |
| **Comisión por Restaurante** | `restaurant.deliveryCommissionPercentage` | Cada local tiene su propio porcentaje pactado (ej. 8%, 10%, 15%). |
| **Límite de Deuda Máxima** | `user.maxDebtLimit = 50.0` | Si `walletBalance <= -50.0`, el backend rechaza `takeOrder` para pedidos con pago CASH. |
| **Desbloqueo de Repartidor** | Pago / Recarga | El repartidor debe realizar un abono a la cuenta de GoEats o esperar que pedidos en línea compensen su saldo negativo. |
| **Transparencia en Pantalla** | Desglose en Orden | La pantalla del repartidor muestra explícitamente: "Pagar Proveedor", "Cobrar Cliente", y "Total que ganará". |

---

## 📌 Enlaces Directos en el Código

- **Cálculo al tomar y completar orden:** [`backend/src/modules/delivery/delivery.controller.ts`](../../backend/src/modules/delivery/delivery.controller.ts#L69-L290)
- **Registro en el historial de transacciones:** [`WalletTransaction` en schema.prisma](../../backend/prisma/schema.prisma#L542-L550)
- **Visualización en panel móvil/web:** [`frontend/src/pages/DeliveryDashboard.tsx`](../../frontend/src/pages/DeliveryDashboard.tsx)
