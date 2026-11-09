// Reservations: validation, privacy of the phone and ownership
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { api, configError, newCustomer, SLUG } from "./helpers.mjs";

const URL = `/api/reservations/public/${SLUG}`;
const inDays = (days, hour = 19) => {
  const date = new Date(Date.now() + days * 864e5);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
let customer;

before(async () => {
  if (configError) return;
  customer = await newCustomer("res");
});

test("se rechazan reservas inválidas", { skip: configError }, async () => {
  const cases = [
    [{ people: 2, reservedAt: new Date(Date.now() - 3600e3).toISOString() }, "en el pasado"],
    [{ people: 2, reservedAt: new Date(Date.now() + 10 * 60e3).toISOString() }, "con menos de 30 minutos"],
    [{ people: 2, reservedAt: inDays(90) }, "a más de 60 días"],
    [{ people: 0, reservedAt: inDays(2) }, "con 0 personas"],
    [{ people: 31, reservedAt: inDays(2) }, "con 31 personas"],
    [{ people: 2, reservedAt: "mañana" }, "con fecha inválida"],
    [{ people: 2, reservedAt: inDays(2), phone: "abc" }, "con teléfono inválido"],
  ];
  for (const [body, name] of cases) {
    const res = await api("POST", URL, { token: customer.token, body });
    assert.equal(res.status, 400, `reserva ${name} respondió ${res.status}`);
  }
});

test("sin sesión de cliente no se reserva", { skip: configError }, async () => {
  const res = await api("POST", URL, { body: { people: 2, reservedAt: inDays(2) } });
  assert.equal(res.status, 401);
});

test("el cliente reserva, la ve y la cancela; otro cliente no puede", { skip: configError }, async () => {
  const created = await api("POST", URL, { token: customer.token, body: { people: 3, reservedAt: inDays(3), notes: "Prueba" } });
  assert.equal(created.status, 201, created.text.slice(0, 200));
  const id = created.json.reservation.id;

  const mine = await api("GET", "/api/reservations/mine", { token: customer.token });
  const found = (mine.json.reservations || []).find((r) => r.id === id);
  assert.ok(found, "la reserva no aparece en Mis reservas");
  assert.equal(found.phone, undefined, "Mis reservas no debe devolver el teléfono");

  const other = await newCustomer("res2");
  const stolen = await api("POST", `/api/reservations/mine/${id}/cancel`, { token: other.token });
  assert.equal(stolen.status, 404);

  const cancelled = await api("POST", `/api/reservations/mine/${id}/cancel`, { token: customer.token });
  assert.equal(cancelled.status, 200);
});
