// One comanda for Pedidos, Caja and Mesas (bosses, 17 nov): only date and time, type of service,
// order number and the dishes in big letters. No logo, RUC, prices or "no válido como factura".
import { escapeHtml } from "./html";
import { splitTakeAway } from "./takeAway";

export interface ComandaItem {
  quantity: number;
  name: string;
  variant?: string | null;
  comments?: string | null;
  takeAway?: boolean;
}

export interface ComandaData {
  orderId?: number | null;
  createdAt?: string | Date | null;
  type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
  tableNumber?: string | number | null;
  customerName?: string | null;
  note?: string | null;
  items: ComandaItem[];
}

function serviceLine(data: ComandaData) {
  const name = data.customerName && data.customerName !== "Varios" ? ` · ${escapeHtml(data.customerName)}` : "";
  if (data.type === "DINE_IN") return data.tableNumber != null && data.tableNumber !== "" ? `MESA ${escapeHtml(String(data.tableNumber))}` : "EN MESA";
  if (data.type === "TAKEOUT") return `PARA LLEVAR${name}`;
  return `DOMICILIO${name}`;
}

function formatDate(value: ComandaData["createdAt"]) {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function buildComandaHtml(data: ComandaData) {
  const items = data.items
    .map((item) => {
      // A note saved with the take-away tag is shown as its own line
      const { takeAway, note } = splitTakeAway(item.comments);
      const isTakeAway = (item.takeAway ?? takeAway) && data.type === "DINE_IN";
      return `<li>
        <div class="dish"><span class="qty">${item.quantity}×</span><span class="name">${escapeHtml(item.name)}${item.variant ? ` <small>(${escapeHtml(item.variant)})</small>` : ""}</span></div>
        ${isTakeAway ? `<div class="tag">PARA LLEVAR</div>` : ""}
        ${note ? `<div class="note">→ ${escapeHtml(note)}</div>` : ""}
      </li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Comanda${data.orderId ? ` #${data.orderId}` : ""}</title>
    <style>
      @page { margin: 4mm; }
      * { box-sizing: border-box; }
      :root { color-scheme: light; }
      html { background: #fff; }
      body { background: #fff; }
      body { margin: 0 auto; padding: 8px; width: 100%; max-width: 80mm; font-family: Arial, Helvetica, sans-serif; color: #000; }
      .service { font-size: 26px; font-weight: 900; line-height: 1.1; text-align: center; overflow-wrap: anywhere; }
      .order { margin-top: 4px; font-size: 18px; font-weight: 700; text-align: center; }
      .date { margin-top: 2px; font-size: 14px; text-align: center; }
      hr { border: 0; border-top: 2px dashed #000; margin: 10px 0; }
      ul { list-style: none; margin: 0; padding: 0; }
      li { padding: 8px 0; border-bottom: 1px dashed #000; }
      li:last-child { border-bottom: 0; }
      .dish { display: flex; gap: 8px; align-items: baseline; }
      .qty { font-size: 24px; font-weight: 900; min-width: 2.2ch; }
      .name { flex: 1; min-width: 0; font-size: 20px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
      .name small { font-size: 15px; font-weight: 400; }
      .tag { display: inline-block; margin: 4px 0 0 2.6ch; padding: 1px 6px; border: 2px solid #000; font-size: 15px; font-weight: 900; }
      .note { margin: 4px 0 0 2.6ch; font-size: 17px; font-style: italic; overflow-wrap: anywhere; }
      .obs { font-size: 17px; font-weight: 700; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <div class="service">${serviceLine(data)}</div>
    <div class="order">${data.orderId ? `Pedido #${data.orderId}` : "Pedido sin enviar"}</div>
    <div class="date">${formatDate(data.createdAt)}</div>
    <hr />
    <ul>${items}</ul>
    ${data.note ? `<hr /><div class="obs">Obs: ${escapeHtml(data.note)}</div>` : ""}
    <script>
      window.onload = function () {
        window.print();
        setTimeout(function () { window.close(); }, 500);
      };
    </script>
  </body>
</html>`;
}

// Saved order as the API returns it (Pedidos, Mesas)
export function comandaFromOrder(order: any): ComandaData {
  return {
    orderId: order.id,
    createdAt: order.createdAt,
    type: order.type,
    tableNumber: order.table?.number ?? null,
    customerName: order.customerName,
    note: order.comments,
    items: (order.items || []).map((item: any) => ({
      quantity: item.quantity,
      name: item.variant?.menuItem?.name || "Plato",
      variant: item.variant?.name || null,
      comments: item.comments,
    })),
  };
}

export function printComanda(data: ComandaData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para poder imprimir.");
    return;
  }
  printWindow.document.write(buildComandaHtml(data));
  printWindow.document.close();
}
