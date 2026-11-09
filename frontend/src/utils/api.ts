export function getBaseApiUrl(): string {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  // If explicitly configured with a remote external URL (e.g. production https://...), use it
  if (envApiUrl && !envApiUrl.includes("localhost") && !envApiUrl.includes("127.0.0.1") && envApiUrl.startsWith("http")) {
    return envApiUrl.replace(/\/$/, "");
  }

  // In local development (PC or mobile LAN via Vite proxy), use relative /api
  // This avoids CORS, firewall port 5000 blocks, and mismatched IP issues
  return "/api";
}

export const SESSION_EXPIRED_EVENT = "goeats:session-expired";

// Login answers 401 for a wrong password; that is not an expired session
const isLoginEndpoint = (endpoint: string) =>
  endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/social-login");

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export const OFFLINE_MESSAGE = "No hay conexión con GoEats. Revisa tu internet e inténtalo de nuevo.";

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem("goeats_token");
  const storedUser = localStorage.getItem("goeats_user");
  let restaurantId: string | null = null;

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.restaurantId) {
        restaurantId = user.restaurantId.toString();
      }
    } catch (e) {
      // ignore
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Inject current restaurant tenant context if available
  if (restaurantId && !headers.has("x-restaurant-id")) {
    headers.set("x-restaurant-id", restaurantId);
  }

  const baseUrl = getBaseApiUrl();
  let url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    // The server no longer accepts this session: expired, closed or deleted account
    if (response.status === 401 && token && !isLoginEndpoint(endpoint)) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    if (!response.ok) {
      // A proxy without backend answers 502-504
      if (response.status >= 502 && response.status <= 504 && !data.message) throw new Error(OFFLINE_MESSAGE);
      throw new Error(data.message || "Ocurrió un error. Inténtalo de nuevo.");
    }

    return data;
  } catch (err: any) {
    // Server unreachable: never invent data or sessions, just say it plainly
    if (err?.name === "TypeError" || /Failed to fetch|NetworkError/i.test(err?.message || "")) {
      throw new Error(OFFLINE_MESSAGE);
    }
    throw err;
  }
}
