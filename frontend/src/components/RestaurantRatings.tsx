import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { apiRequest } from "../utils/api";
import { StarAverage } from "./Stars";

interface RatingRow {
  orderId: number;
  stars: number;
  comment: string;
  createdAt: string;
  customerName: string;
}

// What customers said about the restaurant: average and latest comments
export const RestaurantRatings: React.FC = () => {
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest("/ratings/restaurant")
      .then((res) => {
        setAverage(res.average ?? null);
        setCount(res.count ?? 0);
        setRows(res.ratings || []);
      })
      .catch((err: unknown) => setError((err instanceof Error && err.message) || "No se pudieron cargar las calificaciones."));
  }, []);

  return (
    <div className="glass-card" data-testid="restaurant-ratings" style={{ padding: "25px", borderRadius: "var(--radius-md)", marginTop: "30px" }}>
      <h3 style={{ fontSize: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <Star size={18} />
        Calificaciones de clientes
        <StarAverage average={average} count={count} />
      </h3>
      {error && <p style={{ color: "var(--accent-primary)" }}>{error}</p>}
      {rows.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Todavía no hay calificaciones.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map((row) => (
            <div key={row.orderId} style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", fontSize: "13px" }}>
                <strong>
                  {"★".repeat(row.stars)}
                  <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - row.stars)}</span> · {row.customerName}
                </strong>
                <span style={{ color: "var(--text-muted)" }}>
                  Pedido #{row.orderId} · {new Date(row.createdAt).toLocaleDateString("es-EC")}
                </span>
              </div>
              {row.comment && <p style={{ fontSize: "14px", margin: "4px 0 0" }}>{row.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
