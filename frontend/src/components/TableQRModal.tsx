import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Wifi,
  Store,
  Layers
} from "lucide-react";

export interface TableItem {
  id: number;
  number: string | number;
  capacity?: number;
  diningAreaId?: number;
  status?: string;
}

export interface DiningAreaItem {
  id: number;
  name: string;
  tables?: TableItem[];
}

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: TableItem | null;
  diningAreas: DiningAreaItem[];
  restaurantSlug: string;
  restaurantName?: string;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  suggestedNetworkIp?: string | null;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  selectedTable: initialTable,
  diningAreas,
  restaurantSlug,
  restaurantName = "Restaurante",
  wifiSsid,
  wifiPassword,
  suggestedNetworkIp
}) => {
  // Flatten all tables
  const allTablesWithArea = diningAreas.flatMap((area) =>
    (area.tables || []).map((t) => ({ ...t, areaName: area.name }))
  );

  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeAreaFilter, setActiveAreaFilter] = useState<number | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"SINGLE" | "BATCH">("SINGLE");

  // Helper to determine base URL for the QR code:
  // - If accessed via public domain or LAN IP (not localhost), use window.location.origin
  // - If running locally on localhost, use the detected Wi-Fi IP so mobile devices can access it!
  const getActiveBaseUrl = () => {
    if (typeof window !== "undefined" && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
        return window.location.origin;
      }
    }
    const ip = suggestedNetworkIp && suggestedNetworkIp !== "localhost" ? suggestedNetworkIp : "192.168.1.76";
    return `http://${ip}:5173`;
  };

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [batchQrMap, setBatchQrMap] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  // Helper to build QR URL
  const getTableUrl = (tableId: number) => {
    const base = getActiveBaseUrl();
    const slug = restaurantSlug || "restaurante";
    return `${base}/r/${slug}?tableId=${tableId}`;
  };

  // Initialize selected table
  useEffect(() => {
    if (initialTable) {
      setActiveTableId(initialTable.id);
      if (initialTable.diningAreaId) {
        setActiveAreaFilter(initialTable.diningAreaId);
      }
    } else if (allTablesWithArea.length > 0 && !activeTableId) {
      setActiveTableId(allTablesWithArea[0].id);
    }
  }, [initialTable, diningAreas]);

  // Current table object
  const currentTable = allTablesWithArea.find((t) => t.id === activeTableId) || allTablesWithArea[0];

  // Generate QR for single table
  useEffect(() => {
    if (!currentTable) return;
    const url = getTableUrl(currentTable.id);

    QRCode.toDataURL(url, {
      width: 380,
      margin: 2,
      color: {
        dark: "#1e293b",
        light: "#ffffff"
      },
      errorCorrectionLevel: "H"
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });
  }, [currentTable, restaurantSlug, suggestedNetworkIp]);

  // Generate batch QRs for all tables
  useEffect(() => {
    if (viewMode === "BATCH" && allTablesWithArea.length > 0) {
      setGenerating(true);
      const promises = allTablesWithArea.map((t) => {
        const url = getTableUrl(t.id);
        return QRCode.toDataURL(url, {
          width: 260,
          margin: 1,
          color: { dark: "#1e293b", light: "#ffffff" },
          errorCorrectionLevel: "M"
        }).then((uri) => ({ id: t.id, uri }));
      });

      Promise.all(promises)
        .then((results) => {
          const map: Record<number, string> = {};
          results.forEach((r) => {
            map[r.id] = r.uri;
          });
          setBatchQrMap(map);
        })
        .finally(() => {
          setGenerating(false);
        });
    }
  }, [viewMode, diningAreas, restaurantSlug, suggestedNetworkIp]);

  if (!isOpen) return null;

  const currentUrl = currentTable ? getTableUrl(currentTable.id) : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMenu = () => {
    window.open(currentUrl, "_blank");
  };

  // Download high-resolution PNG card
  const handleDownloadPNG = () => {
    if (!currentTable || !qrDataUrl) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1250;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. White Background with rounded corners
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Decorative Top Accent Bar
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#ff4757");
    gradient.addColorStop(1, "#ffa502");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 24);

    // 3. Restaurant Brand Name
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 44px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(restaurantName.toUpperCase(), canvas.width / 2, 85);

    ctx.font = "500 24px 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("PEDIDOS EN MESA & AUTOSERVICIO", canvas.width / 2, 130);

    // 4. Table Number Badge
    ctx.fillStyle = "#ff4757";
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 190, 170, 380, 75, 20);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`MESA ${currentTable.number}`, canvas.width / 2, 208);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 22px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(currentTable.areaName.toUpperCase(), canvas.width / 2, 275);

    // 5. Draw QR Code in white container
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 540;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 315;

      // Subtle shadow/border around QR
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 24);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Action Callout
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("¡Escanea con tu cámara y ordena!", canvas.width / 2, 925);

      ctx.fillStyle = "#475569";
      ctx.font = "500 22px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Tu pedido va directo a la pantalla de cocina", canvas.width / 2, 965);

      // 7. WiFi & Call Waiter Footer
      if (wifiSsid) {
        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.roundRect(80, 1010, canvas.width - 160, 60, 14);
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.font = "bold 20px 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(
          `Wi-Fi de cortesía: ${wifiSsid}${wifiPassword ? ` • Clave: ${wifiPassword}` : ""}`,
          canvas.width / 2,
          1040
        );
      }

      // Bottom Branding
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 18px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("POTENCIADO POR GOEATS", canvas.width / 2, 1140);

      // Trigger download
      const link = document.createElement("a");
      link.download = `QR-Mesa-${currentTable.number}-${restaurantSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    qrImg.src = qrDataUrl;
  };

  // Direct print trigger
  const handlePrint = () => {
    window.print();
  };

  // Filtered tables list for selector
  const visibleTables = allTablesWithArea.filter((t) =>
    activeAreaFilter === "ALL" ? true : t.diningAreaId === activeAreaFilter
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* PRINT-ONLY CSS INJECTION */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #goeats-qr-printable-area, #goeats-qr-printable-area * {
            visibility: visible !important;
          }
          #goeats-qr-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 2px dashed #cbd5e1 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: viewMode === "BATCH" ? "980px" : "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "20px",
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden"
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-secondary)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 71, 87, 0.12)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Códigos QR para Mesas
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                {restaurantName} • Los clientes escanean el QR para ordenar directo a cocina
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: "flex",
                backgroundColor: "var(--bg-tertiary)",
                borderRadius: "10px",
                padding: "3px",
                border: "1px solid var(--border-light)"
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("SINGLE")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: viewMode === "SINGLE" ? "var(--bg-primary)" : "transparent",
                  color: viewMode === "SINGLE" ? "var(--accent-primary)" : "var(--text-secondary)",
                  boxShadow: viewMode === "SINGLE" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <QrCode size={14} />
                Mesa Individual
              </button>
              <button
                type="button"
                onClick={() => setViewMode("BATCH")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: viewMode === "BATCH" ? "var(--bg-primary)" : "transparent",
                  color: viewMode === "BATCH" ? "var(--accent-primary)" : "var(--text-secondary)",
                  boxShadow: viewMode === "BATCH" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <Layers size={14} />
                Imprimir Todo el Salón
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-secondary)"
              }}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {viewMode === "SINGLE" ? (
            /* SINGLE TABLE VIEW */
            <div>
              {/* Salones & Tables Navigation Bar */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Selecciona una mesa para ver su código:
                  </label>
                  {diningAreas.length > 1 && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <Store size={14} style={{ color: "var(--text-muted)" }} />
                      <select
                        value={activeAreaFilter}
                        onChange={(e) => {
                          const val = e.target.value === "ALL" ? "ALL" : parseInt(e.target.value, 10);
                          setActiveAreaFilter(val);
                        }}
                        style={{
                          fontSize: "13px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-light)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        <option value="ALL">Todos los Salones</option>
                        {diningAreas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Table Badges */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "8px"
                  }}
                >
                  {visibleTables.map((tbl) => {
                    const isSelected = tbl.id === currentTable?.id;
                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setActiveTableId(tbl.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          border: isSelected
                            ? "1px solid var(--accent-primary)"
                            : "1px solid var(--border-light)",
                          backgroundColor: isSelected
                            ? "var(--accent-glow)"
                            : "var(--bg-secondary)",
                          color: isSelected
                            ? "var(--accent-primary)"
                            : "var(--text-primary)",
                          transition: "var(--transition-fast)"
                        }}
                      >
                        Mesa {tbl.number}
                        <span
                          style={{
                            fontSize: "13px",
                            marginLeft: "6px",
                            opacity: 0.7,
                            fontWeight: 500
                          }}
                        >
                          ({tbl.areaName})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentTable ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 340px",
                    gap: "28px",
                    alignItems: "start"
                  }}
                >
                  {/* Left Column: Visual Table Stand Preview */}
                  <div
                    id="goeats-qr-printable-area"
                    ref={printableRef}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      backgroundColor: "var(--bg-secondary)",
                      padding: "24px",
                      borderRadius: "16px",
                      border: "1px solid var(--border-light)"
                    }}
                  >
                    {/* The Physical Table Stand Card */}
                    <div
                      className="qr-print-card"
                      style={{
                        width: "320px",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        borderRadius: "20px",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      {/* Top Header Bar */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #ff4757, #ffa502)",
                          height: "10px",
                          width: "100%"
                        }}
                      />

                      <div style={{ padding: "24px 20px 20px 20px" }}>
                        {/* Restaurant Name */}
                        <div
                          style={{
                            fontSize: "17px",
                            fontWeight: 900,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            color: "#0f172a"
                          }}
                        >
                          {restaurantName}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#64748b",
                            marginTop: "2px",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px"
                          }}
                        >
                          Menú Digital & Autoservicio
                        </div>

                        {/* Table Number Pill */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#ff4757",
                            color: "#ffffff",
                            padding: "6px 18px",
                            borderRadius: "20px",
                            fontSize: "16px",
                            fontWeight: 850,
                            marginTop: "14px",
                            boxShadow: "0 4px 10px rgba(255, 71, 87, 0.3)"
                          }}
                        >
                          Mesa {currentTable.number}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            fontWeight: 600,
                            marginTop: "4px"
                          }}
                        >
                          {currentTable.areaName}
                        </div>

                        {/* QR Code Canvas/Image */}
                        <div
                          style={{
                            margin: "16px auto",
                            backgroundColor: "#f8fafc",
                            padding: "12px",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            display: "inline-block",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                          }}
                        >
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt={`QR Mesa ${currentTable.number}`}
                              style={{
                                width: "200px",
                                height: "200px",
                                display: "block",
                                borderRadius: "8px"
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "200px",
                                height: "200px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#94a3b8"
                              }}
                            >
                              Generando QR...
                            </div>
                          )}
                        </div>

                        {/* Instructions */}
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.3
                          }}
                        >
                          ¡Escanea con tu cámara y ordena!
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            marginTop: "4px",
                            lineHeight: 1.4
                          }}
                        >
                          Pide directo a cocina • Llama al mesero • Solicita tu cuenta
                        </div>

                        {/* WiFi Info if configured */}
                        {wifiSsid && (
                          <div
                            style={{
                              marginTop: "14px",
                              backgroundColor: "#f1f5f9",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#334155",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px"
                            }}
                          >
                            <Wifi size={12} />
                            <span>
                              <strong>WiFi:</strong> {wifiSsid}{" "}
                              {wifiPassword ? `(${wifiPassword})` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer Badge */}
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          padding: "8px",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: "13px",
                          color: "#94a3b8",
                          fontWeight: 700,
                          letterSpacing: "0.5px"
                        }}
                      >
                        POTENCIADO POR GOEATS
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Information & Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* URL Link Card */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "14px",
                        border: "1px solid var(--border-light)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                        >
                          Enlace Codificado en el QR
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(17, 17, 17, 0.15)",
                            color: "var(--success)"
                          }}
                        >
                          Mesa {currentTable.number}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "13px",
                          color: "var(--accent-primary)",
                          wordBreak: "break-all",
                          backgroundColor: "var(--bg-primary)",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-light)",
                          fontFamily: "monospace"
                        }}
                      >
                        {currentUrl}
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="secondary-btn"
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          {copied ? (
                            <>
                              <Check size={14} className="text-success" />
                              ¡Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copiar Enlace
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenMenu}
                          className="secondary-btn"
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                          title="Abrir menú en nueva pestaña"
                        >
                          <ExternalLink size={14} />
                          Probar Menú
                        </button>
                      </div>
                    </div>

                    {/* Ready for Customers Info Card */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "rgba(17, 17, 17, 0.05)",
                        borderRadius: "14px",
                        border: "1px solid rgba(17, 17, 17, 0.2)"
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          margin: 0
                        }}
                      >
                        <Sparkles size={14} style={{ color: "var(--accent-primary)" }} />
                        Listo para tus Comensales
                      </h4>
                      <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        Al escanear este código QR con la cámara de cualquier teléfono celular (iPhone o Android), el comensal accederá de inmediato al menú de la <strong>Mesa {currentTable.number}</strong> ({currentTable.areaName}) para ordenar platillos, llamar al personal o solicitar su cuenta directo a caja.
                      </p>
                    </div>

                    {/* Main Export Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                      <button
                        type="button"
                        onClick={handleDownloadPNG}
                        className="glow-btn"
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        <Download size={18} />
                        Descargar Tarjeta (PNG HD)
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="secondary-btn"
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        <Printer size={18} />
                        Imprimir Tarjeta de Mesa
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No hay mesas disponibles en esta sección.
                </div>
              )}
            </div>
          ) : (
            /* BATCH VIEW: PRINT ALL TABLES */
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid var(--border-light)"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                    Planilla de Códigos QR para Todo el Restaurante
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                    Total: {allTablesWithArea.length} mesas configuradas. Imprime y recorta para colocar en portamenús acrílicos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={generating}
                  className="glow-btn"
                  style={{
                    padding: "10px 18px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: generating ? 0.7 : 1
                  }}
                >
                  <Printer size={16} />
                  {generating ? "Generando Códigos..." : `Imprimir Todas las Mesas (${allTablesWithArea.length})`}
                </button>
              </div>

              {/* Grid of All Cards for Batch Printing */}
              <div
                id="goeats-qr-printable-area"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                  gap: "20px"
                }}
              >
                {allTablesWithArea.map((tbl) => {
                  const qr = batchQrMap[tbl.id];
                  return (
                    <div
                      key={tbl.id}
                      className="qr-print-card"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        padding: "18px 16px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: "#0f172a"
                        }}
                      >
                        {restaurantName}
                      </div>

                      <div
                        style={{
                          display: "inline-block",
                          backgroundColor: "#ff4757",
                          color: "#ffffff",
                          padding: "4px 14px",
                          borderRadius: "14px",
                          fontSize: "14px",
                          fontWeight: 800,
                          marginTop: "8px"
                        }}
                      >
                        Mesa {tbl.number}
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px", fontWeight: 600 }}>
                        {tbl.areaName}
                      </div>

                      <div
                        style={{
                          margin: "12px 0",
                          padding: "8px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        {qr ? (
                          <img
                            src={qr}
                            alt={`Mesa ${tbl.number}`}
                            style={{ width: "150px", height: "150px", display: "block" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "150px",
                              height: "150px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              color: "#94a3b8"
                            }}
                          >
                            Cargando...
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                        Escanea para ordenar
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                        GoEats • Pedido directo a cocina
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
