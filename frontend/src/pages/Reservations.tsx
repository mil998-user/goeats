import { appConfirm } from "../components/AppDialogs";
import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Phone, Plus, Users, X } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";

interface Reservation {
  id: number;
  name: string;
  phone: string;
  people: number;
  reservedAt: string;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED" | "NO_SHOW";
  fromApp: boolean;
  table: { id: number; number: string } | null;
}

interface TableOption {
  id: number;
  number: string;
  area: string;
}

const STATUS_LABEL: Record<Reservation["status"], string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmada",
  SEATED: "Ya llegaron",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vinieron",
};

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
const todayInput = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const emptyForm = { name: "", phone: "", people: 2, date: todayInput(), time: "19:00", tableId: "", notes: "" };

export const Reservations: React.FC = () => {
  const { socket } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await apiRequest("/reservations");
      setReservations(res.reservations || []);
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudieron cargar las reservas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    apiRequest("/tables/dining-areas")
      .then((res) =>
        setTables(
          (res.diningAreas || []).flatMap((area: any) =>
            (area.tables || []).map((table: any) => ({ id: table.id, number: table.number, area: area.name }))
          )
        )
      )
      .catch(() => setTables([]));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("reservation-updated", refresh);
    return () => {
      socket.off("reservation-updated", refresh);
    };
  }, [socket]);

  const visible = useMemo(
    () => reservations.filter((r) => showClosed || r.status === "PENDING" || r.status === "CONFIRMED"),
    [reservations, showClosed]
  );
  const byDay = useMemo(() => {
    const groups = new Map<string, Reservation[]>();
    for (const reservation of visible) {
      const key = new Date(reservation.reservedAt).toDateString();
      groups.set(key, [...(groups.get(key) || []), reservation]);
    }
    return [...groups.values()];
  }, [visible]);
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

  const update = async (id: number, body: Record<string, unknown>) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await apiRequest(`/reservations/${id}`, { method: "PUT", body: JSON.stringify(body) });
      setReservations((list) => list.map((r) => (r.id === id ? res.reservation : r)));
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo actualizar la reserva." });
    } finally {
      setBusyId(null);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const reservedAt = new Date(`${form.date}T${form.time}`).toISOString();
      await apiRequest("/reservations", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          people: Number(form.people),
          reservedAt,
          notes: form.notes,
          tableId: form.tableId ? Number(form.tableId) : null,
        }),
      });
      setForm(emptyForm);
      setFormOpen(false);
      setMessage({ ok: true, text: "Reserva registrada." });
      load();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo registrar la reserva." });
    } finally {
      setSaving(false);
    }
  };

  const field = { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px" };

  return (
    <div style={{ padding: "clamp(12px, 3vw, 25px)", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Reservas</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            {pendingCount > 0 ? `${pendingCount} por confirmar. ` : ""}Confirma, asigna mesa y marca la llegada.
          </p>
        </div>
        <button className="glow-btn" onClick={() => setFormOpen((open) => !open)} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          {formOpen ? <X size={16} /> : <Plus size={16} />} {formOpen ? "Cerrar" : "Nueva reserva"}
        </button>
      </div>

      {message && (
        <div role="status" className="glass-card" style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, borderLeft: `4px solid ${message.ok ? "var(--text-primary)" : "var(--text-secondary)"}` }}>
          {message.text}
        </div>
      )}

      {formOpen && (
        <form onSubmit={create} className="glass-card" style={{ padding: "18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Nombre
            <input className="input-field" style={field} required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Teléfono
            <input className="input-field" style={field} required inputMode="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Personas
            <input className="input-field" style={field} type="number" min={1} max={30} required value={form.people} onChange={(e) => setForm({ ...form, people: Number(e.target.value) })} />
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Fecha
            <input className="input-field" style={field} type="date" required min={todayInput()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Hora
            <input className="input-field" style={field} type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>
            Mesa (opcional)
            <select className="input-field" style={field} value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })}>
              <option value="">Sin asignar</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>Mesa {table.number} · {table.area}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: "13px", fontWeight: 600, gridColumn: "1 / -1" }}>
            Nota (opcional)
            <input className="input-field" style={field} maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej.: cumpleaños, silla para bebé" />
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="glow-btn" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar reserva"}</button>
          </div>
        </form>
      )}

      <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
        <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
        Mostrar también las canceladas y las ya atendidas
      </label>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Cargando reservas...</p>
      ) : byDay.length === 0 ? (
        <div className="glass-card" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
          <CalendarDays size={32} style={{ marginBottom: "8px" }} />
          <p style={{ margin: 0 }}>No hay reservas próximas.</p>
        </div>
      ) : (
        byDay.map((day) => (
          <section key={day[0].reservedAt} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, textTransform: "capitalize" }}>{dayLabel(day[0].reservedAt)}</h2>
            {day.map((reservation) => {
              const open = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
              const busy = busyId === reservation.id;
              return (
                <article key={reservation.id} className="glass-card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: "18px" }}>{timeLabel(reservation.reservedAt)}</strong>{" "}
                      <span style={{ fontSize: "16px", fontWeight: 700 }}>{reservation.name}</span>
                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Users size={14} /> {reservation.people} {reservation.people === 1 ? "persona" : "personas"}</span>
                        <a href={`tel:${reservation.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "inherit" }}><Phone size={14} /> {reservation.phone}</a>
                        <span>{reservation.fromApp ? "Desde la app" : "Por teléfono o en el local"}</span>
                      </div>
                      {reservation.notes && <p style={{ margin: "6px 0 0 0", fontSize: "14px" }}>Nota: {reservation.notes}</p>}
                    </div>
                    <span style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--border-light)", fontSize: "13px", fontWeight: 700, background: reservation.status === "PENDING" ? "var(--text-primary)" : "var(--bg-secondary)", color: reservation.status === "PENDING" ? "var(--bg-primary)" : "var(--text-primary)" }}>
                      {STATUS_LABEL[reservation.status]}
                    </span>
                  </div>

                  {open && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        className="input-field"
                        aria-label={`Mesa para la reserva de ${reservation.name}`}
                        disabled={busy}
                        value={reservation.table?.id ?? ""}
                        onChange={(e) => update(reservation.id, { tableId: e.target.value ? Number(e.target.value) : null })}
                        style={{ padding: "8px 10px", maxWidth: "100%" }}
                      >
                        <option value="">Sin mesa</option>
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>Mesa {table.number} · {table.area}</option>
                        ))}
                      </select>
                      {reservation.status === "PENDING" && (
                        <button className="glow-btn" disabled={busy} onClick={() => update(reservation.id, { status: "CONFIRMED" })}>Confirmar</button>
                      )}
                      {reservation.status === "CONFIRMED" && (
                        <>
                          <button className="glow-btn" disabled={busy} onClick={() => update(reservation.id, { status: "SEATED" })}>Ya llegaron</button>
                          <button className="secondary-btn" disabled={busy} onClick={() => update(reservation.id, { status: "NO_SHOW" })}>No vinieron</button>
                        </>
                      )}
                      <button
                        className="secondary-btn"
                        disabled={busy}
                        onClick={async () => (await appConfirm(`¿Cancelar la reserva de ${reservation.name}?`)) && update(reservation.id, { status: "CANCELLED" })}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  {!open && reservation.table && <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Mesa {reservation.table.number}</span>}
                </article>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
};
