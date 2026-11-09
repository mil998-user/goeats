import React from "react";

interface StaffOrder {
  id: number;
  status: string;
  mozo?: { id: number; name: string } | null;
  items?: { preparedBy?: { id: number; name: string } | null }[];
}

// Who attended the order and who prepared its dishes, for the restaurant's history
export const OrderStaffLine: React.FC<{ order: StaffOrder; canAttend?: boolean; onAttend?: (orderId: number) => void }> = ({ order, canAttend, onAttend }) => {
  const free = !order.mozo && order.status !== "CANCELLED" && order.status !== "DELIVERED";
  const cooks = Array.from(
    new Map((order.items || []).filter((item) => item.preparedBy).map((item) => [item.preparedBy!.id, item.preparedBy!.name])).values()
  );

  return (
    <div data-testid="order-staff" style={{ fontSize: "13px", color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
      Atendió: <strong style={{ color: "var(--text-primary)" }}>{order.mozo?.name || "Sin mesero"}</strong>
      {" · "}
      Preparó: <strong style={{ color: "var(--text-primary)" }}>{cooks.length > 0 ? cooks.join(", ") : "Aún nadie"}</strong>
      {canAttend && free && onAttend && (
        <button
          type="button"
          onClick={() => onAttend(order.id)}
          style={{ display: "block", marginTop: "8px", padding: "10px 14px", fontSize: "14px", fontWeight: 700, borderRadius: "8px", border: "none", background: "#1e293b", color: "#ffffff", cursor: "pointer" }}
        >
          Yo atiendo este pedido
        </button>
      )}
    </div>
  );
};
