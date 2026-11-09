import React, { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { apiRequest } from "../utils/api";

// Earliest time the server accepts: 30 minutes from now, rounded up to 5 minutes
const earliestLocalValue = () => {
  const date = new Date(Date.now() + 35 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const ReserveTable: React.FC<{
  slug: string;
  restaurantName: string;
  defaultName: string;
  defaultPhone: string;
  onClose: () => void;
}> = ({ slug, restaurantName, defaultName, defaultPhone, onClose }) => {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [people, setPeople] = useState(2);
  const [reservedAt, setReservedAt] = useState(earliestLocalValue);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const when = new Date(reservedAt);
    if (Number.isNaN(when.getTime())) {
      setError("Elige la fecha y la hora.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/reservations/public/${encodeURIComponent(slug)}`, {
        method: "POST",
        body: JSON.stringify({ name, phone, people, reservedAt: when.toISOString(), notes }),
      });
      setDone(true);
    } catch (err) {
      setError((err instanceof Error && err.message) || "No se pudo guardar la reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-title"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", padding: "22px", background: "var(--bg-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <h2 id="reserve-title" style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarDays size={20} /> Reservar en {restaurantName}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="secondary-btn" style={{ minWidth: "44px", minHeight: "44px", padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div>
            <p style={{ fontWeight: 700, marginBottom: "8px" }}>Reserva enviada.</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              El local la confirmará. Puedes verla o cancelarla en "Mis reservas" de tu cuenta.
            </p>
            <button type="button" className="glow-btn" style={{ width: "100%" }} onClick={onClose}>
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="input-group">
              <label htmlFor="reserve-name">Nombre</label>
              <input id="reserve-name" className="input-field" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label htmlFor="reserve-phone">Teléfono</label>
              <input id="reserve-phone" type="tel" inputMode="tel" className="input-field" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: "10px" }}>
              <div className="input-group">
                <label htmlFor="reserve-people">Personas</label>
                <input id="reserve-people" type="number" min={1} max={30} className="input-field" required value={people} onChange={(e) => setPeople(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label htmlFor="reserve-when">Fecha y hora</label>
                <input id="reserve-when" type="datetime-local" className="input-field" required min={earliestLocalValue()} value={reservedAt} onChange={(e) => setReservedAt(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="reserve-notes">Nota (opcional)</label>
              <input id="reserve-notes" className="input-field" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: cumpleaños, silla para bebé" />
            </div>
            {error && (
              <p role="alert" style={{ color: "var(--accent-primary)", fontSize: "14px", margin: "0 0 12px" }}>
                {error}
              </p>
            )}
            <button type="submit" className="glow-btn" style={{ width: "100%", minHeight: "44px" }} disabled={saving}>
              {saving ? "Enviando..." : "Enviar reserva"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
