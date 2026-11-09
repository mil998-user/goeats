import React, { useState } from "react";
import { apiRequest } from "../utils/api";

interface TableLite {
  id: number;
  number: string;
  status: string;
  joinedToId?: number | null;
}

// Move the order to another table, join more tables to this one, or separate them
export const TableGroupActions: React.FC<{
  table: TableLite;
  orderId: number;
  allTables: TableLite[];
  onChanged: (message: string) => void;
}> = ({ table, orderId, allTables, onChanged }) => {
  const [moveTo, setMoveTo] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joined = allTables.filter((t) => t.joinedToId === table.id);
  const isGroupMain = (id: number) => allTables.some((t) => t.joinedToId === id);
  // Free tables that are not part of any group
  const freeTables = allTables.filter((t) => t.id !== table.id && t.status === "FREE" && !t.joinedToId && !isGroupMain(t.id));
  // Any other table outside a group can be joined; its open orders move to this bill
  const joinable = allTables.filter((t) => t.id !== table.id && !t.joinedToId && !isGroupMain(t.id));

  const run = async (path: string, body?: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      onChanged(res.message || "Listo.");
      setMoveTo("");
      setJoinId("");
    } catch (err) {
      setError((err instanceof Error && err.message) || "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="table-group-actions" style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px dashed var(--border-light)", paddingTop: "12px", marginBottom: "12px" }}>
      {joined.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>Mesas unidas</span>
          {joined.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>Mesa {t.number}</span>
              <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} disabled={busy} onClick={() => run(`/tables/${t.id}/separate`)}>
                Separar
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor="join-table" style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Unir otra mesa a esta
          </label>
          <select id="join-table" className="input-field" style={{ fontSize: "16px", width: "100%" }} value={joinId} onChange={(e) => setJoinId(e.target.value)}>
            <option value="">Elegir mesa</option>
            {joinable.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa {t.number} {t.status === "OCCUPIED" ? "(ocupada)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="secondary-btn"
          style={{ minHeight: "44px" }}
          disabled={busy || !joinId}
          onClick={() => run(`/tables/${joinId}/join`, { intoTableId: table.id })}
        >
          Unir
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor="move-table" style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Cambiar el pedido a otra mesa
          </label>
          <select id="move-table" className="input-field" style={{ fontSize: "16px", width: "100%" }} value={moveTo} onChange={(e) => setMoveTo(e.target.value)} disabled={joined.length > 0}>
            <option value="">{joined.length > 0 ? "Separa las mesas primero" : "Elegir mesa libre"}</option>
            {freeTables.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa {t.number}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="secondary-btn"
          style={{ minHeight: "44px" }}
          disabled={busy || !moveTo}
          onClick={() => run(`/orders/${orderId}/change-table`, { newTableId: Number(moveTo) })}
        >
          Cambiar
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--accent-primary)", fontSize: "13px", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
};
