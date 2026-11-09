import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export interface SavedAddress {
  id: number;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  floorApartment: string | null;
  secondaryStreet: string | null;
  references: string | null;
  isDefault: boolean;
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#1e293b",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
};

// Customer's saved delivery places. The default one is used when ordering
export const SavedAddresses: React.FC = () => {
  const { updateUser } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest("/orders/customer/addresses")
      .then((res) => setAddresses(res.addresses || []))
      .catch((err) => setError(err.message || "No se pudieron cargar tus direcciones."))
      .finally(() => setLoading(false));
  }, []);

  const run = async (id: number, path: string, method: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await apiRequest(path, { method });
      setAddresses(res.addresses || []);
      if (res.profile) updateUser(res.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = (address: SavedAddress) => {
    if (!window.confirm(`¿Borrar la dirección "${address.label}"?`)) return;
    run(address.id, `/orders/customer/addresses/${address.id}`, "DELETE");
  };

  return (
    <div data-testid="saved-addresses" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Mis direcciones</h3>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            La principal es la que usamos al pedir. Puedes cambiarla cuando quieras.
          </p>
        </div>
        <Link to="/customer/location-setup?new=1" style={{ ...buttonStyle, textDecoration: "none", background: "#1e293b", color: "#ffffff", border: "none" }}>
          <Plus size={16} /> Agregar dirección
        </Link>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", fontSize: "14px", margin: "0 0 12px" }}>{error}</p>
      )}

      {loading ? (
        <p style={{ fontSize: "15px", color: "#64748b" }}>Cargando direcciones...</p>
      ) : addresses.length === 0 ? (
        <p style={{ fontSize: "15px", color: "#64748b" }}>Todavía no tienes direcciones guardadas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {addresses.map((address) => (
            <div
              key={address.id}
              style={{
                border: address.isDefault ? "2px solid #1e293b" : "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", minWidth: 0, flex: "1 1 220px" }}>
                <MapPin size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#475569" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                    {address.label}
                    {address.isDefault && (
                      <span style={{ marginLeft: "8px", fontSize: "13px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "#1e293b", color: "#ffffff" }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "14px", color: "#475569", overflowWrap: "anywhere" }}>{address.address}</div>
                  {address.references && (
                    <div style={{ fontSize: "13px", color: "#64748b", overflowWrap: "anywhere" }}>{address.references}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {!address.isDefault && (
                  <button
                    type="button"
                    style={buttonStyle}
                    disabled={busyId !== null}
                    onClick={() => run(address.id, `/orders/customer/addresses/${address.id}/default`, "POST")}
                  >
                    <Star size={15} /> Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...buttonStyle, color: "#b91c1c" }}
                  disabled={busyId !== null}
                  onClick={() => remove(address)}
                  aria-label={`Borrar ${address.label}`}
                >
                  <Trash2 size={15} /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
