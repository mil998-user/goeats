// A dish of a table order that the customer takes away (bosses, 17 nov).
// It is kept as a tag at the start of the dish note, so kitchen, comanda and history show it
// without a new database column. The frontend reads it with the same rule (frontend/src/utils/takeAway.ts).
export const TAKE_AWAY_TAG = "PARA LLEVAR";
const SEPARATOR = " · ";
// The comments columns are VARCHAR(191): a dish note plus the tag, and the order note, must fit
export const ORDER_NOTE_MAX = 180;
export const ITEM_NOTE_MAX = 150;

export function splitTakeAway(comments?: string | null) {
  const text = (comments || "").trim();
  if (text === TAKE_AWAY_TAG) return { takeAway: true, note: "" };
  if (text.startsWith(TAKE_AWAY_TAG + SEPARATOR)) return { takeAway: true, note: text.slice(TAKE_AWAY_TAG.length + SEPARATOR.length).trim() };
  return { takeAway: false, note: text };
}

export function joinTakeAway(takeAway: boolean, note?: string | null) {
  const clean = splitTakeAway(note).note;
  if (!takeAway) return clean || null;
  return clean ? `${TAKE_AWAY_TAG}${SEPARATOR}${clean}` : TAKE_AWAY_TAG;
}

// Note of the whole order (the customer's or the cashier's). Kitchen and comanda show it
export function readOrderNote(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, ORDER_NOTE_MAX) : null;
}

// Final note of a dish sent by the POS. Only table orders taken by the cashier or owner can have take-away dishes:
// the waiter never marks them and the other order types are already take-away or delivery
export function readItemComments(item: { comments?: unknown; takeAway?: unknown }, canTakeAway: boolean) {
  const note = typeof item.comments === "string" ? item.comments.slice(0, ITEM_NOTE_MAX) : null;
  if (!canTakeAway) return joinTakeAway(false, note);
  if (item.takeAway === undefined) return note?.trim() || null;
  return joinTakeAway(item.takeAway === true, note);
}
