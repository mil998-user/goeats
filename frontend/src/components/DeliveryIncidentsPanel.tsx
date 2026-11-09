import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

interface Incident {
  id: number;
  type: "PASS" | "CANCEL" | "NO_SHOW" | "NO_CODE";
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  driver: { id: number; name: string; phone: string | null };
  order: {
    id: number;
    status: string;
    total: number;
    paymentMethodString: string | null;
    paymentStatus: string;
    customerName: string;
    restaurant: { id: number; name: string };
  };
}

const typeLabel: Record<Incident["type"], string> = {
  PASS: "Pasó la orden",
  CANCEL: "Canceló la orden",
  NO_SHOW: "Cliente no salió",
  NO_CODE: "Entregó sin código",
};

const paymentLabel = (method: string | null) =>
  method === "CASH" || !method ? "Efectivo" : method === "TRANSFER" ? "Transferencia" : "En línea";

// Administrator: what drivers reported (pass, cancel, customer without code or not coming out)
export const DeliveryIncidentsPanel: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  // Bumped to reload the list after a review
  const [reloadKey, setReloadKey] = useState(0);

  // State is only set after the server answers; whoever asks for a reload sets "loading"
  useEffect(() => {
    let cancelled = false;
    apiRequest(`/delivery/incidents${showAll ? "?all=true" : ""}`)
      .then((res) => {
        if (cancelled) return;
        setIncidents(res.incidents || []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron cargar las incidencias.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showAll, reloadKey]);

  const review = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/delivery/incidents/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ note: notes[id] || "" }),
      });
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar como revisada.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div data-testid="delivery-incidents" className="glass-card" style={{ padding: "25px", marginBottom: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Incidencias de motorizados</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Pedidos pasados, cancelados, entregados sin código o con cliente que no salió.
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
          <input type="checkbox" checked={showAll} onChange={(e) => { setLoading(true); setShowAll(e.target.checked); }} />
          Ver también las revisadas
        </label>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c", fontSize: "14px" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
      ) : incidents.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No hay incidencias pendientes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {incidents.map((incident) => (
            <div key={incident.id} style={{ border: "1px solid var(--border-light)", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "15px" }}>
                  {typeLabel[incident.type] || incident.type} · Pedido #{incident.order.id}
                </strong>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {new Date(incident.createdAt).toLocaleString("es-EC")}
                </span>
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px", overflowWrap: "anywhere" }}>
                Motorizado: {incident.driver.name}{incident.driver.phone ? ` (${incident.driver.phone})` : ""} · Local: {incident.order.restaurant.name} ·
                Cliente: {incident.order.customerName} · ${incident.order.total.toFixed(2)} {paymentLabel(incident.order.paymentMethodString)}
                {incident.order.paymentStatus === "REFUND_PENDING" ? " · Devolución pendiente al cliente" : ""}
              </div>
              <p style={{ fontSize: "15px", margin: "8px 0 0", overflowWrap: "anywhere" }}>
                <strong>Motivo:</strong> {incident.reason}
              </p>
              {incident.reviewedAt ? (
                <p style={{ fontSize: "14px", color: "var(--success)", margin: "8px 0 0" }}>
                  Revisada el {new Date(incident.reviewedAt).toLocaleString("es-EC")}
                  {incident.reviewNote ? `: ${incident.reviewNote}` : ""}
                </p>
              ) : (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  <input
                    type="text"
                    className="input-field"
                    aria-label={`Nota de revisión del pedido ${incident.order.id}`}
                    placeholder="Nota (opcional): qué se decidió"
                    maxLength={500}
                    value={notes[incident.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                    style={{ flex: "1 1 220px" }}
                  />
                  <button type="button" className="glow-btn" style={{ padding: "10px 16px" }} disabled={busyId !== null} onClick={() => review(incident.id)}>
                    {busyId === incident.id ? "Guardando..." : "Marcar como revisada"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
