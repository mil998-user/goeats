const MAPS_LINK_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "maps.google.com.ec",
  "www.google.com",
  "www.google.com.ec",
  "google.com",
  "google.com.ec",
  "consent.google.com",
]);

// Keep in sync with frontend/src/utils/maps.ts
const MAPS_EMBED_HOSTS = new Set(["www.google.com", "maps.google.com"]);

function parseHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port ? url : null;
  } catch (error) {
    return null;
  }
}

export function isGoogleMapsLink(value: string) {
  const url = parseHttpsUrl(value);
  return Boolean(url && MAPS_LINK_HOSTS.has(url.hostname));
}

export function getMapEmbedUrl(value: string) {
  const source = value.match(/<iframe\b[^>]*\bsrc=["']([^"'<>]+)["']/i)?.[1] ?? value.trim();
  const url = parseHttpsUrl(source);
  if (!url || !MAPS_EMBED_HOSTS.has(url.hostname) || !url.pathname.startsWith("/maps")) {
    return null;
  }
  return url.toString();
}

export function buildMapIframe(embedUrl: string) {
  const src = embedUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<iframe src="${src}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
}
