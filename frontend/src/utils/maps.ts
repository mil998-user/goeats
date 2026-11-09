// Keep in sync with backend/src/utils/maps.ts
const MAPS_EMBED_HOSTS = new Set(["www.google.com", "maps.google.com"]);

export function getMapEmbedUrl(value?: string | null) {
  if (!value) return null;

  const source = value.match(/<iframe\b[^>]*\bsrc=["']([^"'<>]+)["']/i)?.[1] ?? value.trim();
  try {
    const url = new URL(source.replace(/&amp;/g, "&"));
    const isGoogleMaps = url.protocol === "https:" && MAPS_EMBED_HOSTS.has(url.hostname) && url.pathname.startsWith("/maps");
    return isGoogleMaps ? url.toString() : null;
  } catch {
    return null;
  }
}
