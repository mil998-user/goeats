// Shared helpers for the automated API tests (node:test, no extra dependencies).
//
// Run them only against a TEST database with the demo seed loaded, never against real data:
//   API_URL=http://127.0.0.1:5001 TEST_OWNER_USER=... TEST_OWNER_PASSWORD=... npm run test:api
//
// Optional: TEST_RESTAURANT_SLUG (default el-artesanal, must belong to the test owner),
// TEST_OTHER_OWNER_USER / TEST_OTHER_OWNER_PASSWORD for the isolation tests between restaurants.

export const API_URL = (process.env.API_URL || "").replace(/\/$/, "");
export const SLUG = process.env.TEST_RESTAURANT_SLUG || "el-artesanal";

// Refuse to run against anything that is not this machine, unless explicitly allowed
const isLocal = (url) => {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
};

export const configError = !API_URL
  ? "Falta API_URL (por ejemplo http://127.0.0.1:5001)."
  : !isLocal(API_URL) && process.env.TEST_ALLOW_REMOTE !== "1"
    ? "API_URL no es local. Estas pruebas crean datos: úsalas solo con una base de prueba."
    : false; // node:test treats skip: null as skipped, so it must be false

export async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

export async function login(username, password) {
  const res = await api("POST", "/api/auth/login", { body: { username, password } });
  if (!res.json?.token) throw new Error(`No se pudo iniciar sesión como ${username}: ${res.status}`);
  return { token: res.json.token, user: res.json.user };
}

// A valid Ecuadorian ID number, different on each call (test data only)
let counter = Date.now() % 1000000;
export function testCedula() {
  counter = (counter + 1) % 1000000;
  const nine = "171" + String(counter).padStart(6, "0");
  let sum = 0;
  [...nine].forEach((digit, i) => {
    let value = Number(digit) * (i % 2 ? 1 : 2);
    if (value > 9) value -= 9;
    sum += value;
  });
  return nine + ((10 - (sum % 10)) % 10);
}

export const TEST_PASSWORD = "Prueba.1234";

export async function newCustomer(tag) {
  const username = `t${tag}${Date.now()}`;
  const res = await api("POST", "/api/auth/register-customer", {
    body: {
      username,
      name: `Cliente ${tag} Prueba`,
      email: `${username}@example.test`,
      password: TEST_PASSWORD,
      cedula: testCedula(),
      phone: "0991234567",
    },
  });
  if (!res.json?.token) throw new Error(`No se pudo registrar el cliente: ${res.status} ${res.text.slice(0, 160)}`);
  return { token: res.json.token, user: res.json.user };
}

export async function ownerSession() {
  const user = process.env.TEST_OWNER_USER;
  const password = process.env.TEST_OWNER_PASSWORD;
  if (!user || !password) return null;
  return login(user, password);
}

export async function catalogVariant() {
  const res = await api("GET", `/api/restaurants/public/catalog/${SLUG}`);
  const variant = (res.json?.menuCategories || []).flatMap((c) => c.items).flatMap((i) => i.variants)[0];
  if (!variant) throw new Error(`El catálogo ${SLUG} no tiene platos.`);
  return { restaurant: res.json.restaurant, variant };
}
