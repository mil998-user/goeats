import React, { useState } from "react";
import { ArrowRightLeft, CheckCircle, KeyRound, Play, UserX, XCircle } from "lucide-react";
import { apiRequest } from "../utils/api";

type ReasonAction = "pass" | "cancel" | "no-code" | "no-show";

interface Props {
  orderId: number;
  pickedUpAt?: string | null;
  requiresPin?: boolean;
  busy: boolean;
  onComplete: () => void;
  onChanged: (message: string) => void;
}

const REASON_MIN = 10;

const actionText: Record<ReasonAction, { title: string; help: string; confirm: string; placeholder: string }> = {
  pass: {
    title: "Pasar orden",
    help: "El pedido vuelve a la lista para que lo tome otro motorizado. Te devolvemos la comisión.",
    confirm: "Pasar orden",
    placeholder: "Ej. Se me pinchó la llanta camino al local",
  },
  cancel: {
    title: "Cancelar orden",
    help: "Úsalo solo si el local está cerrado o el pedido no se puede hacer. El pedido se cancela y el administrador revisa el motivo.",
    confirm: "Cancelar orden",
    placeholder: "Ej. El local está cerrado y nadie contesta",
  },
  "no-code": {
    title: "El cliente no tiene el código",
    help: "Entregas el pedido sin código. El administrador revisa el motivo, así que explica qué pasó.",
    confirm: "Entregar sin código",
    placeholder: "Ej. Se le apagó el celular, mostró su cédula a nombre del pedido",
  },
  "no-show": {
    title: "El cliente no salió",
    help: "El pedido queda como no entregado. El administrador revisa el caso y decide qué pasa con el dinero.",
    confirm: "Reportar que no salió",
    placeholder: "Ej. Esperé 10 minutos, llamé 3 veces y no contestó",
  },
};

const baseButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px 16px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  minHeight: "46px",
  flex: "1 1 180px",
};

const primaryButton: React.CSSProperties = { ...baseButton, background: "#1e293b", color: "#ffffff", border: "none" };
const outlineButton: React.CSSProperties = { ...baseButton, background: "#ffffff", color: "#1e293b", border: "1px solid #cbd5e1" };
const dangerButton: React.CSSProperties = { ...baseButton, background: "#ffffff", color: "#b91c1c", border: "1px solid #fecaca" };

// Buttons for an order the driver already took: before pickup (start, pass, cancel)
// and after pickup (deliver with code, customer without code, customer didn't come out)
export const DriverOrderActions: React.FC<Props> = ({ orderId, pickedUpAt, requiresPin, busy, onComplete, onChanged }) => {
  const [openAction, setOpenAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = busy || sending;

  const send = async (path: string, body?: Record<string, unknown>) => {
    setSending(true);
    setError(null);
    try {
      const res = await apiRequest(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      setOpenAction(null);
      setReason("");
      onChanged(res.message || "Listo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const confirmReason = () => {
    if (!openAction) return;
    const text = reason.trim();
    if (text.length < REASON_MIN) {
      setError(`Escribe el motivo con al menos ${REASON_MIN} letras.`);
      return;
    }
    if (openAction === "no-code") {
      send(`/delivery/complete/${orderId}`, { withoutPin: true, reason: text });
    } else {
      send(`/delivery/${openAction}/${orderId}`, { reason: text });
    }
  };

  if (openAction) {
    const copy = actionText[openAction];
    const fieldId = `reason-${openAction}-${orderId}`;
    return (
      <div data-testid="driver-reason-form" style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", background: "#f8fafc" }}>
        <h4 style={{ margin: "0 0 6px", fontSize: "17px", color: "#1e293b" }}>{copy.title}</h4>
        <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#475569" }}>{copy.help}</p>
        <label htmlFor={fieldId} style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
          Motivo
        </label>
        <textarea
          id={fieldId}
          value={reason}
          maxLength={500}
          rows={3}
          placeholder={copy.placeholder}
          onChange={(e) => setReason(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "15px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }}
        />
        {error && <p role="alert" style={{ color: "#b91c1c", fontSize: "14px", margin: "8px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <button type="button" style={outlineButton} disabled={disabled} onClick={() => { setOpenAction(null); setError(null); }}>
            Volver
          </button>
          <button type="button" style={openAction === "pass" || openAction === "no-code" ? primaryButton : { ...primaryButton, background: "#b91c1c" }} disabled={disabled} onClick={confirmReason}>
            {sending ? "Enviando..." : copy.confirm}
          </button>
        </div>
      </div>
    );
  }

  const open = (action: ReasonAction) => {
    setError(null);
    setReason("");
    setOpenAction(action);
  };

  if (!pickedUpAt) {
    return (
      <div data-testid="driver-actions-before" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          Cuando retires la comida del local, presiona <strong>Empezar traslado</strong>.
        </p>
        {error && <p role="alert" style={{ color: "#b91c1c", fontSize: "14px", margin: 0 }}>{error}</p>}
        <button type="button" style={{ ...primaryButton, flex: "none" }} disabled={disabled} onClick={() => send(`/delivery/start/${orderId}`)}>
          <Play size={18} /> {sending ? "Guardando..." : "Empezar traslado"}
        </button>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" style={outlineButton} disabled={disabled} onClick={() => open("pass")}>
            <ArrowRightLeft size={17} /> Pasar orden
          </button>
          <button type="button" style={dangerButton} disabled={disabled} onClick={() => open("cancel")}>
            <XCircle size={17} /> Cancelar orden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="driver-actions-after" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <button type="button" style={{ ...primaryButton, background: "#15803d", flex: "none" }} disabled={disabled} onClick={onComplete}>
        <CheckCircle size={18} /> {requiresPin ? "Entregar con código del cliente" : "Confirmar entrega"}
      </button>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {requiresPin && (
          <button type="button" style={outlineButton} disabled={disabled} onClick={() => open("no-code")}>
            <KeyRound size={17} /> No tiene el código
          </button>
        )}
        <button type="button" style={dangerButton} disabled={disabled} onClick={() => open("no-show")}>
          <UserX size={17} /> El cliente no salió
        </button>
      </div>
    </div>
  );
};
