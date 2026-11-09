// Money and orders: the server decides prices, totals and tips
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { api, configError, newCustomer, catalogVariant, SLUG } from "./helpers.mjs";

const ORDER = `/api/restaurants/public/catalog/${SLUG}/order`;
let customer;
let variant;

before(async () => {
  if (configError) return;
  customer = await newCustomer("ped");
  ({ variant } = await catalogVariant());
});

const takeout = (extra = {}) => ({
  type: "TAKEOUT",
  customerName: "Prueba automática",
  paymentMethod: "CASH",
  items: [{ variantId: variant.id, quantity: 2 }],
  ...extra,
});

test("el precio lo pone el servidor, no el navegador", { skip: configError }, async () => {
  const res = await api("POST", ORDER, {
    token: customer.token,
    body: takeout({ items: [{ variantId: variant.id, quantity: 2, price: 0.01 }], total: 0.02 }),
  });
  assert.equal(res.status, 201, res.text.slice(0, 200));
  assert.equal(res.json.order.total, Math.round(variant.price * 2 * 100) / 100);
});

test("no se aceptan cantidades inválidas", { skip: configError }, async () => {
  for (const quantity of [0, -1, 1.5, "abc"]) {
    const res = await api("POST", ORDER, { token: customer.token, body: takeout({ items: [{ variantId: variant.id, quantity }] }) });
    assert.equal(res.status, 400, `cantidad ${quantity} respondió ${res.status}`);
  }
});

test("la propina tiene tope y no entra al total", { skip: configError }, async () => {
  const base = {
    type: "DELIVERY",
    customerName: "Prueba automática",
    paymentMethod: "CASH",
    deliveryAddress: "Calle de prueba",
    deliveryPhone: "0991112233",
    items: [{ variantId: variant.id, quantity: 1 }],
  };
  const tooHigh = await api("POST", ORDER, { token: customer.token, body: { ...base, tipAmount: 500 } });
  assert.equal(tooHigh.status, 400);
  const negative = await api("POST", ORDER, { token: customer.token, body: { ...base, tipAmount: -1 } });
  assert.equal(negative.status, 400);
  const ok = await api("POST", ORDER, { token: customer.token, body: { ...base, tipAmount: 1 } });
  assert.equal(ok.status, 201, ok.text.slice(0, 200));
  const order = ok.json.order;
  assert.equal(order.tipAmount, 1);
  assert.equal(Math.round((order.total - order.shippingCost) * 100) / 100, variant.price);
});

test("calificar exige que el pedido esté entregado", { skip: configError }, async () => {
  const res = await api("POST", ORDER, { token: customer.token, body: takeout() });
  const rating = await api("POST", `/api/ratings/orders/${res.json.order.id}`, {
    token: customer.token,
    body: { restaurantStars: 5 },
  });
  assert.equal(rating.status, 400);
});

test("otro cliente no ve ni califica pedidos ajenos", { skip: configError }, async () => {
  const other = await newCustomer("ped2");
  const res = await api("POST", ORDER, { token: customer.token, body: takeout() });
  const orderId = res.json.order.id;
  const list = await api("GET", "/api/orders/customer/my-orders", { token: other.token });
  assert.ok(!(list.json.orders || []).some((o) => o.id === orderId));
  const rating = await api("POST", `/api/ratings/orders/${orderId}`, { token: other.token, body: { restaurantStars: 5 } });
  assert.equal(rating.status, 404);
});
