import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

interface HistoryRow {
  id: number;
  dish: string;
  variant: string;
  quantity: number;
  readyAt: string | null;
  minutes: number | null;
  preparedBy: string | null;
  orderId: number;
  place: string | null;
}

const HOUR_CHOICES = [4, 12, 24, 72];

// Dishes already prepared, with how long each one took
export const KitchenHistory: React.FC = () => {
  const [hours, setHours] = useState(12);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/kitchen/history", { params: { hours: String(hours) } })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items || []);
        setAverage(res.averageMinutes ?? null);
      })
      .catch((err: unknown) => !cancelled && setError((err instanceof Error && err.message) || "No se pudo cargar el historial."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hours]);

  return (
    <div data-testid="kitchen-history">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} role="group" aria-label="Periodo">
          {HOUR_CHOICES.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={hours === h}
              className={hours === h ? "glow-btn" : "secondary-btn"}
              style={{ minHeight: "44px", padding: "8px 14px" }}
              onClick={() => {
                setLoading(true);
                setError(null);
                setHours(h);
              }}
            >
              Últimas {h} h
            </button>
          ))}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700 }}>
          Tiempo promedio: {average === null ? "sin datos" : `${average} min`}
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--accent-primary)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No hay platos terminados en este periodo.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-light)" }}>
                <th style={{ padding: "8px" }}>Hora</th>
                <th style={{ padding: "8px" }}>Plato</th>
                <th style={{ padding: "8px" }}>Pedido</th>
                <th style={{ padding: "8px" }}>Tardó</th>
                <th style={{ padding: "8px" }}>Preparó</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                    {row.readyAt ? new Date(row.readyAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {row.quantity}x {row.dish}
                    {row.variant && row.variant !== "Unidad" ? ` (${row.variant})` : ""}
                  </td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                    #{row.orderId} {row.place ? `· ${row.place}` : ""}
                  </td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{row.minutes === null ? "-" : `${row.minutes} min`}</td>
                  <td style={{ padding: "8px" }}>{row.preparedBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
