# ⏱️ Liquidación, Cortes Periódicos (Cada 5 Horas) y Desbloqueos

> **Controlador de SuperAdmin:** [`backend/src/modules/delivery/delivery.controller.ts`](../../backend/src/modules/delivery/delivery.controller.ts)  
> **Panel de Administración:** [`frontend/src/pages/SuperAdmin.tsx`](../../frontend/src/pages/SuperAdmin.tsx)

---

## 🕒 1. Política de Cortes Cada 5 Horas

Para evitar acumulaciones excesivas de dinero tanto a favor de los motorizados (por pedidos en línea/tarjeta) como de deudas hacia la empresa (por retención de comisión en efectivo), GoEats implementa **cortes periódicos programados**:

```
08:00 AM (Inicio) ──► 01:00 PM (Corte 1) ──► 06:00 PM (Corte 2) ──► 11:00 PM (Corte 3)
```

### Objetivo del Corte:
1. **Compensar saldos:** Se cruzan todas las entregas en efectivo contra las entregas con tarjeta/transferencia de cada motorizado en esa ventana de 5 horas.
2. **Determinar saldo neto por repartidor:**
   - **Si el saldo es POSITIVO ($> \$0.00$):** La empresa le debe dinero al repartidor (reembolso de comida pagada en local + comisiones de flete). Aparece en la lista de **Pagos Pendientes por Liquidar**.
   - **Si el saldo es NEGATIVO ($< \$0.00$):** El repartidor tiene dinero retenido de la empresa en su bolsillo.
3. **Control del Límite de Deuda de $50.00:**
   - Si la deuda supera los **$-\$50.00$**, el motorizado entra en estado **PAUSADO PARA EFECTIVO**.
   - Solo podrá tomar pedidos con pago en línea hasta que baje su deuda o realice un abono a la cuenta de la empresa.

---

## 🖥️ 2. Vista de Liquidación Administrativa (1 Clic)

En el panel de SuperAdmin (`/superadmin`):

| Motorizado | Cédula / Cel | Balance Actual | Estado | Acción Rápida (1 Clic) |
| :--- | :--- | :--- | :--- | :--- |
| **Juan Pérez** | 0987654321 | **+\$34.50** | Saldo a favor | `[ Liquidar $34.50 (Transferido) ]` |
| **Carlos Mendoza** | 0912345678 | **-\$18.20** | En regla (< $50) | `[ Registrar Abono ]` |
| **Pedro Gómez** | 0955566778 | **-\$52.10** | ⚠️ BLOQUEADO (> $50) | `[ Registrar Pago / Desbloquear ]` |

### ¿Qué hace el botón `[ Liquidar Saldo ]` con 1 Clic?
1. El Administrador transfiere los $\$34.50$ desde la banca de GoEats a la cuenta bancaria del motorizado.
2. Hace clic en `Liquidar Saldo`.
3. El sistema:
   - Registra una transacción de egreso en el historial (`SETTLEMENT_PAYMENT`).
   - Resetea el balance positivo a $\$0.00$.
   - Envía notificación push / alerta al motorizado confirmando el depósito de su corte.

---

## 🔒 3. Desbloqueo de Repartidores por Deuda

Cuando un repartidor supera los $-\$50.00$ de deuda:
1. El repartidor deposita o transfiere a la cuenta bancaria de GoEats el valor adeudado (ej. $\$50.00$).
2. Sube la foto del comprobante desde la app o la envía al soporte.
3. El Administrador verifica en su banco y pulsa **"Abonar / Recargar Saldo"**.
4. Su balance sube inmediatamente a $\$0.00$ o positivo, y el sistema **levanta la restricción de pedidos en efectivo al instante**.
