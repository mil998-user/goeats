// Money and orders: the server decides prices, totals and tips
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { api, configError, newCustomer, catalogVariant, SLUG } from "./helpers.mjs";

const ORDER = `/api/restaurants/public/catalog/${SLUG}/order`;
let customer;
let variant;
let restaurant;
const restaurantPoint = () => ({ lat: (restaurant?.mapLatitude ?? -3.99) + 0.004, lng: (restaurant?.mapLongitude ?? -79.2) + 0.004 });

before(async () => {
  if (configError) return;
  customer = await newCustomer("ped");
  ({ variant, restaurant } = await catalogVariant());
});

// The server rejects two identical orders in a row as duplicates, so each one has its own quantity
let quantity = 1;
const takeout = (extra = {}) => ({
  type: "TAKEOUT",
  customerName: "Prueba automática",
  deliveryPhone: "0991112233",
  paymentMethod: "CASH",
  items: [{ variantId: variant.id, quantity: ++quantity }],
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
    // Delivery needs the point on the map (25 nov): near the restaurant
    deliveryLat: restaurantPoint().lat,
    deliveryLng: restaurantPoint().lng,
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

test("domicilio y para llevar piden sesión de cliente y ubicación", { skip: configError }, async () => {
  const body = { type: "DELIVERY", customerName: "Prueba", paymentMethod: "CASH", deliveryAddress: "Calle", deliveryPhone: "0991112233", items: [{ variantId: variant.id, quantity: 1 }] };
  assert.equal((await api("POST", ORDER, { body: { ...body, deliveryLat: restaurantPoint().lat, deliveryLng: restaurantPoint().lng } })).status, 401);
  assert.equal((await api("POST", ORDER, { token: customer.token, body })).status, 400);
});

test("en efectivo el pedido espera a la caja y el cliente lo puede cancelar", { skip: configError }, async () => {
  const res = await api("POST", ORDER, { token: customer.token, body: takeout() });
  assert.equal(res.json.order.status, "PENDING");
  const other = await newCustomer("ped3");
  assert.equal((await api("POST", `/api/orders/customer/${res.json.order.id}/cancel`, { token: other.token })).status, 404);
  const cancel = await api("POST", `/api/orders/customer/${res.json.order.id}/cancel`, { token: customer.token });
  assert.equal(cancel.status, 200, cancel.text.slice(0, 200));
});
