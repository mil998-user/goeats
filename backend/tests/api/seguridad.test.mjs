// Access control: sessions, roles and isolation between restaurants
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { api, login, configError, newCustomer, ownerSession, catalogVariant, SLUG } from "./helpers.mjs";

let customer;
let owner;

before(async () => {
  if (configError) return;
  customer = await newCustomer("seg");
  owner = await ownerSession();
});

test("una contraseña equivocada no inicia sesión", { skip: configError }, async () => {
  const res = await api("POST", "/api/auth/login", { body: { username: "admin", password: "no-es-la-clave" } });
  assert.equal(res.status, 401);
  assert.equal(res.json?.token, undefined);
});

test("sin sesión no se ven los pedidos del local", { skip: configError }, async () => {
  const res = await api("GET", "/api/orders");
  assert.equal(res.status, 401);
});

test("un token alterado no sirve", { skip: configError }, async () => {
  const forged = customer.token.slice(0, -4) + "AAAA";
  const res = await api("GET", "/api/orders/customer/my-orders", { token: forged });
  assert.equal(res.status, 401);
});

test("un cliente no entra a pantallas del personal", { skip: configError }, async () => {
  for (const path of ["/api/orders", "/api/tables/dining-areas", "/api/reservations", "/api/kitchen/history"]) {
    const res = await api("GET", path, { token: customer.token });
    assert.ok(res.status === 403 || res.status === 400, `${path} respondió ${res.status}`);
  }
});

test("un cliente no usa rutas del administrador", { skip: configError }, async () => {
  const res = await api("GET", "/api/delivery/unassigned", { token: customer.token });
  assert.equal(res.status, 403);
});

test("el catálogo público no expone datos privados del local", { skip: configError }, async () => {
  const res = await api("GET", `/api/restaurants/public/catalog/${SLUG}`);
  assert.equal(res.status, 200);
  const text = JSON.stringify(res.json);
  for (const secret of ["password", "sriCertificate", "smtpPass", "certificatePassword"]) {
    assert.ok(!text.includes(secret), `el catálogo incluye ${secret}`);
  }
});

test("un dueño no ve pedidos de otro restaurante", { skip: configError || !process.env.TEST_OTHER_OWNER_USER }, async () => {
  assert.ok(owner, "Falta TEST_OWNER_USER");
  const other = await login(process.env.TEST_OTHER_OWNER_USER, process.env.TEST_OTHER_OWNER_PASSWORD);
  // Make sure the test owner's restaurant has at least one order to look for
  const { variant } = await catalogVariant();
  const created = await api("POST", `/api/restaurants/public/catalog/${SLUG}/order`, {
    token: customer.token,
    body: { type: "TAKEOUT", customerName: "Prueba automática", paymentMethod: "CASH", items: [{ variantId: variant.id, quantity: 1 }] },
  });
  assert.equal(created.status, 201, created.text.slice(0, 200));
  const orderId = created.json.order.id;
  const mine = await api("GET", `/api/orders/${orderId}`, { token: owner.token });
  assert.equal(mine.status, 200, "el dueño del local debe ver su pedido");
  const res = await api("GET", `/api/orders/${orderId}`, { token: other.token });
  assert.ok(res.status === 404 || res.status === 403, `respondió ${res.status}`);

  // Billing data of the customer: only the restaurant that received the order
  const billing = await api("GET", `/api/orders/${orderId}/billing-customer`, { token: owner.token });
  assert.equal(billing.status, 200);
  const foreign = await api("GET", `/api/orders/${orderId}/billing-customer`, { token: other.token });
  assert.ok(foreign.status === 404 || foreign.status === 403, `datos de facturación ajenos: ${foreign.status}`);
  const byCustomer = await api("GET", `/api/orders/${orderId}/billing-customer`, { token: customer.token });
  assert.equal(byCustomer.status, 403);
});
