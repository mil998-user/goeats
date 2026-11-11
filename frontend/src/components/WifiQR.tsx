import React from "react";
import QRCode from "qrcode";

// Los caracteres especiales del formato de QR de Wi-Fi se escapan con barra invertida
const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");

interface WifiQRProps {
  ssid: string;
  password?: string | null;
  size?: number;
}

// Código QR que conecta al Wi-Fi al escanearlo, sin escribir la clave
export const WifiQR: React.FC<WifiQRProps> = ({ ssid, password, size = 140 }) => {
  const [dataUrl, setDataUrl] = React.useState("");

  React.useEffect(() => {
    const name = ssid.trim();
    if (!name) {
      setDataUrl("");
      return;
    }
    const text = password
      ? `WIFI:T:WPA;S:${escapeWifi(name)};P:${escapeWifi(password)};;`
      : `WIFI:T:nopass;S:${escapeWifi(name)};;`;
    let cancelled = false;
    QRCode.toDataURL(text, { width: size * 2, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [ssid, password, size]);

  if (!dataUrl) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <img
        src={dataUrl}
        alt={`Código QR del Wi-Fi ${ssid}`}
        width={size}
        height={size}
        style={{ border: "1px solid var(--border-light)", borderRadius: "8px", backgroundColor: "#ffffff" }}
      />
      <span style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "220px" }}>
        Escanea este código con la cámara del celular para conectarte al Wi-Fi sin escribir la clave.
      </span>
    </div>
  );
};
