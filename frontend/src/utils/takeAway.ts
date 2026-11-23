// Same rule as backend/src/utils/takeAway.ts: a table dish the customer takes away
// carries "PARA LLEVAR" at the start of its note.
export const TAKE_AWAY_TAG = "PARA LLEVAR";
const SEPARATOR = " · ";

export function splitTakeAway(comments?: string | null) {
  const text = (comments || "").trim();
  if (text === TAKE_AWAY_TAG) return { takeAway: true, note: "" };
  if (text.startsWith(TAKE_AWAY_TAG + SEPARATOR)) return { takeAway: true, note: text.slice(TAKE_AWAY_TAG.length + SEPARATOR.length).trim() };
  return { takeAway: false, note: text };
}
