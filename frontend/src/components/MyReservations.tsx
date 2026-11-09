import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { apiRequest } from "../utils/api";

interface MyReservation {
  id: number;
  people: number;
  reservedAt: string;
  status: string;
  notes: string | null;
  restaurant: { name: string; slug: string };
  table: { number: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmada",
  SEATED: "Atendida",
  NO_SHOW: "No asististe",
  CANCELLED: "Cancelada",
};

export const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/reservations/mine")
      .then((res) => !cancelled && setReservations(res.reservations || []))
      .catch((err: unknown) => !cancelled && setError((err instanceof Error && err.message) || "No se pudieron cargar tus reservas."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const cancel = async (id: number) => {
    if (!window.confirm("¿Cancelar esta reserva?")) return;
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/reservations/mine/${id}/cancel`, { method: "POST" });
      setReservations((list) => list.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)));
    } catch (err) {
      setError((err instanceof Error && err.message) || "No se pudo cancelar.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px 0" }}>Mis reservas</h2>
      {error && (
        <p role="alert" style={{ color: "var(--accent-primary)", fontSize: "14px" }}>
          {error}
        </p>
      )}
      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
      ) : reservations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)" }}>
          <CalendarDays size={40} style={{ opacity: 0.3, margin: "0 auto 10px" }} />
          <p style={{ margin: 0 }}>No tienes reservas. Puedes reservar desde la página de cada restaurante.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reservations.map((r) => {
            const open = r.status === "PENDING" || r.status === "CONFIRMED";
            return (
              <div key={r.id} data-testid={`my-reservation-${r.id}`} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/r/${r.restaurant.slug}`} style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.restaurant.name}
                  </Link>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {new Date(r.reservedAt).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" })} · {r.people}{" "}
                    {r.people === 1 ? "persona" : "personas"}
                    {r.table ? ` · Mesa ${r.table.number}` : ""}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>{STATUS_LABEL[r.status] || r.status}</div>
                </div>
                {open && (
                  <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} disabled={busyId === r.id} onClick={() => cancel(r.id)}>
                    {busyId === r.id ? "Cancelando..." : "Cancelar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
