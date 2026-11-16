import React from "react";
import { DAY_NAMES, defaultWeek, describeWeek, parseWeeklyHours, type WeeklyHours } from "../utils/openingHours";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunes primero

// Horario por dias: con el se calcula si el local esta abierto o cerrado
export const OpeningHoursEditor: React.FC<Props> = ({ value, onChange }) => {
  const week = parseWeeklyHours(value);
  const legacyText = !week && value.trim() ? value : "";

  const update = (next: WeeklyHours) => onChange(JSON.stringify(next));
  const setDay = (day: number, patch: Partial<WeeklyHours["days"][number]>) => {
    const base = week || defaultWeek();
    update({ ...base, days: base.days.map((d, i) => (i === day ? { ...d, ...patch } : d)) });
  };
  const copyMondayToAll = () => {
    const base = week || defaultWeek();
    update({ ...base, days: base.days.map(() => ({ ...base.days[1] })) });
  };

  if (!week) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {legacyText && (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
            Horario actual (texto): <strong>{legacyText}</strong>. Con texto no se puede saber si está abierto.
          </p>
        )}
        <button type="button" className="secondary-btn" onClick={() => update(defaultWeek())} style={{ alignSelf: "flex-start" }}>
          Configurar horario por días
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {ORDER.map((day) => {
        const info = week.days[day];
        return (
          <div
            key={day}
            style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "8px", width: "130px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
              <input type="checkbox" checked={!info.closed} onChange={(e) => setDay(day, { closed: !e.target.checked })} />
              {DAY_NAMES[day]}
            </label>
            {info.closed ? (
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Cerrado</span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <input
                  type="time"
                  className="input-field"
                  value={info.open}
                  onChange={(e) => e.target.value && setDay(day, { open: e.target.value })}
                  aria-label={`${DAY_NAMES[day]} abre`}
                  style={{ width: "auto", minWidth: "120px" }}
                />
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>a</span>
                <input
                  type="time"
                  className="input-field"
                  value={info.close}
                  onChange={(e) => e.target.value && setDay(day, { close: e.target.value })}
                  aria-label={`${DAY_NAMES[day]} cierra`}
                  style={{ width: "auto", minWidth: "120px" }}
                />
              </div>
            )}
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
        <button type="button" className="secondary-btn" onClick={copyMondayToAll}>
          Copiar el lunes a todos los días
        </button>
        <button type="button" className="secondary-btn" onClick={() => onChange("")}>
          Quitar horario
        </button>
      </div>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
        Si la hora de cierre es menor que la de apertura, se entiende que cierra pasada la medianoche. Fuera de este horario
        no se reciben pedidos en línea. Así lo verá el cliente: {describeWeek(week).join(" · ")}
      </p>
    </div>
  );
};
