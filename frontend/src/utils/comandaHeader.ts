import { apiRequest } from "./api";
import { escapeHtml } from "./html";

interface RestaurantInfo {
  name: string;
  address?: string | null;
  phone?: string | null;
  ruc?: string | null;
  logo?: string | null;
}

let cached: { id: number; info: RestaurantInfo } | null = null;

// Datos del local para la comanda; se piden una vez y se guardan mientras la pagina esta abierta
async function getRestaurantInfo(): Promise<RestaurantInfo | null> {
  try {
    const user = JSON.parse(localStorage.getItem("goeats_user") || "null");
    const id = Number(user?.restaurantId);
    if (!id) return null;
    if (cached?.id === id) return cached.info;
    const res = await apiRequest(`/restaurants/${id}`);
    if (!res?.success || !res.restaurant) return null;
    const r = res.restaurant;
    const info: RestaurantInfo = {
      name: r.name,
      address: r.address,
      phone: r.phone,
      ruc: r.issuer?.ruc,
      // Solo imagenes propias, en linea o por https; las rutas internas se completan con el dominio
      logo:
        typeof r.logo !== "string"
          ? null
          : /^(data:image\/|https:\/\/)/.test(r.logo)
          ? r.logo
          : /^\/[\w./-]+$/.test(r.logo)
          ? `${window.location.origin}${r.logo}`
          : null,
    };
    cached = { id, info };
    return info;
  } catch {
    return null;
  }
}

// Estilos del encabezado (van dentro del <style> de la ventana de impresion)
export const COMANDA_HEADER_CSS = `
  .brand-head { text-align: center; margin-bottom: 12px; }
  .brand-head img.logo { max-width: 120px; max-height: 60px; object-fit: contain; margin: 0 auto 6px; display: block; }
  .brand-head .name { font-size: 17px; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
  .brand-head .meta { font-size: 11px; line-height: 1.4; }
  .brand-head .doc { margin-top: 6px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .brand-foot { text-align: center; margin-top: 14px; font-size: 10px; }
  .brand-foot img { width: 26px; height: 22px; object-fit: contain; vertical-align: middle; margin-right: 4px; }
`;

// Encabezado: logo y datos del restaurante; si no hay datos queda el nombre de GoEats
export async function buildComandaHeader(): Promise<string> {
  const info = await getRestaurantInfo();
  const goeatsLogo = `${window.location.origin}/brand/boca-negra.png`;
  if (!info) {
    return `<div class="brand-head">
      <img class="logo" src="${goeatsLogo}" alt="" />
      <div class="name">GoEats</div>
      <div class="doc">COMANDA</div>
    </div>`;
  }
  const lines = [
    info.ruc ? `RUC: ${escapeHtml(info.ruc)}` : "",
    info.address ? escapeHtml(info.address) : "",
    info.phone ? `Tel: ${escapeHtml(info.phone)}` : "",
  ].filter(Boolean);
  return `<div class="brand-head">
    ${info.logo ? `<img class="logo" src="${escapeHtml(info.logo)}" alt="" />` : ""}
    <div class="name">${escapeHtml(info.name)}</div>
    <div class="meta">${lines.join("<br/>")}</div>
    <div class="doc">COMANDA</div>
  </div>`;
}

// Pie con la marca GoEats
export function buildComandaFooter(): string {
  return `<div class="brand-foot"><img src="${window.location.origin}/brand/boca-negra.png" alt="" />Pedido gestionado con GoEats</div>`;
}
