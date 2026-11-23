// Pedidos recién enviados, para no guardar dos veces el mismo si se pulsa doble o la red reintenta.
// Lo usan la caja (POST /orders) y la carta pública del cliente. Vive en memoria: sirve con un solo
// servidor encendido; con varios habría que guardarlo en la base.
export const DUPLICATE_WINDOW_MS = 8000;
const recentOrderKeys = new Map<string, number>();

// Same dishes in any order give the same signature
export function itemsSignature(items: { variantId: unknown; quantity: unknown }[]) {
  return items
    .map((item) => `${parseInt(String(item.variantId), 10)}x${parseFloat(String(item.quantity))}`)
    .sort()
    .join(",");
}

// true when the order can go on; false when the same one was sent a moment ago
export function claimOrderKey(key: string, now = Date.now()) {
  for (const [savedKey, at] of recentOrderKeys) {
    if (now - at > DUPLICATE_WINDOW_MS) recentOrderKeys.delete(savedKey);
  }
  if (recentOrderKeys.has(key)) return false;
  recentOrderKeys.set(key, now);
  return true;
}

// If the order was not saved, it can be sent again right away
export function releaseOrderKey(key: string | null) {
  if (key) recentOrderKeys.delete(key);
}

export const DUPLICATE_ORDER_MESSAGE = "Este pedido ya se envió hace un momento. Revisa la lista antes de enviarlo otra vez.";
