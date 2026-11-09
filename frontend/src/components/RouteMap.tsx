import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, ExternalLink, Compass, RefreshCw, Radio } from "lucide-react";
import { systemIconForEmoji } from "../utils/systemIcons";
import { escapeHtml } from "../utils/html";


interface RouteMapProps {
  orderId?: number;
  restaurantName: string;
  restaurantAddress?: string | null;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  restaurantLogo?: string | null;
  deliveryAddress: string;
  customerName?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string | null;
  status?: string;
  isDriverView?: boolean;
  onDriverLocationUpdate?: (lat: number, lng: number) => void;
  height?: string;
}

// Default center: Loja, Ecuador
const DEFAULT_LAT = -3.99313;
const DEFAULT_LNG = -79.20422;

export const RouteMap: React.FC<RouteMapProps> = ({
  orderId: _orderId,
  restaurantName,
  restaurantAddress,
  restaurantLat = -3.992677,
  restaurantLng = -79.202349,
  restaurantLogo: _restaurantLogo,
  deliveryAddress,
  customerName,
  deliveryLat = -3.968596,
  deliveryLng = -79.215325,
  driverLat,
  driverLng,
  driverName,
  status: _status = "DELIVERING",
  isDriverView = false,
  onDriverLocationUpdate,
  height = "380px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const mainRouteLineRef = useRef<L.Polyline | null>(null);

  const restL = restaurantLat || DEFAULT_LAT;
  const restG = restaurantLng || DEFAULT_LNG;
  const delivL = deliveryLat || DEFAULT_LAT + 0.006;
  const delivG = deliveryLng || DEFAULT_LNG + 0.006;

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [etaMinutes, setEtaMinutes] = useState<number>(10);
  const [gpsStatus, setGpsStatus] = useState<"IDLE" | "ACTIVE" | "UPDATING" | "ERROR">("IDLE");
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(
    driverLat && driverLng ? { lat: driverLat, lng: driverLng } : null
  );

  // Haversine fallback calculation
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  // Helper to create driver HTML pin with animated radar pulse
  const createDriverMarkerHtml = (name?: string | null, isSelf: boolean = false) => {
    const label = isSelf ? "Tú (Repartidor)" : (name || "Repartidor");
    return `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: rgba(18, 24, 38, 0.95); color: #2ed573; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 4px; border: 1.5px solid #2ed573; display: flex; align-items: center; gap: 5px;">
          <span style="display: inline-block; width: 7px; height: 7px; background: #2ed573; border-radius: 50%; box-shadow: 0 0 6px #2ed573;"></span>
          <span>${escapeHtml(label)}</span>
        </div>
        <div style="position: relative; width: 34px; height: 34px; background: #2ed573; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(46,213,115,0.7);">
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="6" r="1"/><path d="M12 17.5 14 8l-3-3-2 3h4"/><path d="M6 17.5 10 12l2 2h3"/><path d="m18.5 17.5-3.5-6h-3"/></svg>
          <div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #2ed573; opacity: 0.7; animation: leaflet-radar-pulse 1.8s ease-out infinite;"></div>
        </div>
      </div>
    `;
  };

  // Fetch vehicular street route through Loja streets from OSRM
  const fetchStreetRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number }> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const latLngs: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          const distKm = parseFloat((route.distance / 1000).toFixed(2));
          const durMin = Math.max(3, Math.round(route.duration / 60));
          return { coordinates: latLngs, distanceKm: distKm, durationMin: durMin };
        }
      }
    } catch (e) {
      console.warn("OSRM Street route failed, using straight polyline fallback:", e);
    }

    // Fallback
    const coords: [number, number][] = [
      [startLat, startLng],
      [endLat, endLng],
    ];
    const dist = calculateHaversine(startLat, startLng, endLat, endLng);
    return {
      coordinates: coords,
      distanceKm: dist,
      durationMin: Math.max(3, Math.round(dist * 3.5 + 2)),
    };
  };

  // Manual GPS refresh for Driver view
  const handleManualGpsRefresh = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización GPS.");
      return;
    }
    setGpsStatus("UPDATING");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentGps({ lat: latitude, lng: longitude });
        setGpsStatus("ACTIVE");

        // Move marker
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([latitude, longitude]);
          driverMarkerRef.current.setOpacity(1);
        } else if (mapInstanceRef.current) {
          const driverIcon = L.divIcon({
            className: "clean-driver-marker",
            html: createDriverMarkerHtml(driverName, true),
            iconSize: [0, 0],
          });
          const marker = L.marker([latitude, longitude], { icon: driverIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
          marker.bindPopup(`<b>Tu ubicación en vivo</b>`);
          driverMarkerRef.current = marker;
        }

        const remDist = calculateHaversine(latitude, longitude, delivL, delivG);
        setDistanceKm(remDist);
        setEtaMinutes(Math.max(1, Math.round(remDist * 3.2 + 1)));

        if (onDriverLocationUpdate) {
          onDriverLocationUpdate(latitude, longitude);
        }
      },
      (err) => {
        console.warn("Error manual GPS:", err);
        setGpsStatus("ERROR");
        alert("No se pudo obtener tu ubicación GPS. Asegúrate de otorgar permisos de ubicación en el navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [delivL, delivG, driverName, onDriverLocationUpdate]);

  // Simulation step helper (useful for testing or demo without moving in real vehicle)
  const handleSimulateAdvance = useCallback(() => {
    const originLat = currentGps?.lat ?? restL;
    const originLng = currentGps?.lng ?? restG;

    // Advance 15% towards customer delivery destination
    const nextLat = originLat + (delivL - originLat) * 0.2;
    const nextLng = originLng + (delivG - originLng) * 0.2;

    setCurrentGps({ lat: nextLat, lng: nextLng });
    setGpsStatus("ACTIVE");

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([nextLat, nextLng]);
      driverMarkerRef.current.setOpacity(1);
    } else if (mapInstanceRef.current) {
      const driverIcon = L.divIcon({
        className: "clean-driver-marker",
        html: createDriverMarkerHtml(driverName, isDriverView),
        iconSize: [0, 0],
      });
      const marker = L.marker([nextLat, nextLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      driverMarkerRef.current = marker;
    }

    const remDist = calculateHaversine(nextLat, nextLng, delivL, delivG);
    setDistanceKm(remDist);
    setEtaMinutes(Math.max(1, Math.round(remDist * 3.2 + 1)));

    if (onDriverLocationUpdate) {
      onDriverLocationUpdate(nextLat, nextLng);
    }
  }, [currentGps, restL, restG, delivL, delivG, driverName, isDriverView, onDriverLocationUpdate]);

  // Reactive Effect: Update Driver Marker whenever driverLat/driverLng props change (e.g. for customer)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverLat != null && driverLng != null && !isNaN(driverLat) && !isNaN(driverLng)) {
      setCurrentGps({ lat: driverLat, lng: driverLng });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLat, driverLng]);
        driverMarkerRef.current.setOpacity(1);
      } else {
        const driverIcon = L.divIcon({
          className: "clean-driver-marker",
          html: createDriverMarkerHtml(driverName, isDriverView),
          iconSize: [0, 0],
        });
        const marker = L.marker([driverLat, driverLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
        marker.bindPopup(`<b>${isDriverView ? "Tu ubicación actual" : escapeHtml(driverName || "Repartidor en camino")}</b>`);
        driverMarkerRef.current = marker;
      }

      // Dynamically calculate remaining distance and ETA to customer destination
      const remDist = calculateHaversine(driverLat, driverLng, delivL, delivG);
      setDistanceKm(remDist);
      setEtaMinutes(Math.max(1, Math.round(remDist * 3.2 + 1)));
    }
  }, [driverLat, driverLng, driverName, isDriverView, delivL, delivG]);

  // Setup live GPS watcher if in Driver view
  useEffect(() => {
    if (isDriverView && navigator.geolocation) {
      let isMounted = true;
      setGpsStatus("UPDATING");

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMounted) return;
          const { latitude, longitude } = pos.coords;
          setGpsStatus("ACTIVE");
          setCurrentGps({ lat: latitude, lng: longitude });

          if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([latitude, longitude]);
            driverMarkerRef.current.setOpacity(1);
          } else if (mapInstanceRef.current) {
            const driverIcon = L.divIcon({
              className: "clean-driver-marker",
              html: createDriverMarkerHtml(driverName, true),
              iconSize: [0, 0],
            });
            const marker = L.marker([latitude, longitude], { icon: driverIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
            marker.bindPopup(`<b>Tu ubicación en vivo</b>`);
            driverMarkerRef.current = marker;
          }

          const remDist = calculateHaversine(latitude, longitude, delivL, delivG);
          setDistanceKm(remDist);
          setEtaMinutes(Math.max(1, Math.round(remDist * 3.2 + 1)));

          if (onDriverLocationUpdate) {
            onDriverLocationUpdate(latitude, longitude);
          }
        },
        (err) => {
          console.warn("GPS tracking watch error:", err);
          if (isMounted) setGpsStatus("ERROR");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      return () => {
        isMounted = false;
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isDriverView, onDriverLocationUpdate, driverName, delivL, delivG]);

  // Center on Full Route
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const points: [number, number][] = [
        [restL, restG],
        [delivL, delivG],
      ];
      if (currentGps?.lat && currentGps?.lng) {
        points.push([currentGps.lat, currentGps.lng]);
      } else if (driverLat && driverLng) {
        points.push([driverLat, driverLng]);
      }
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Google Maps Navigation
  const openGoogleMapsNavigation = (target: "CUSTOMER" | "RESTAURANT" = "CUSTOMER") => {
    const originCoords = currentGps
      ? `${currentGps.lat},${currentGps.lng}`
      : `${restL},${restG}`;
    const destCoords = target === "CUSTOMER"
      ? `${delivL},${delivG}`
      : `${restL},${restG}`;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originCoords}&destination=${destCoords}&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Waze Navigation
  const openWazeNavigation = (target: "CUSTOMER" | "RESTAURANT" = "CUSTOMER") => {
    const destCoords = target === "CUSTOMER"
      ? `${delivL},${delivG}`
      : `${restL},${restG}`;
    const url = `https://waze.com/ul?ll=${destCoords}&navigate=yes`;
    window.open(url, "_blank");
  };

  // Initialize Route Map with Street Network from Restaurant to Customer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(restL + delivL) / 2, (restG + delivG) / 2],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // 1. Shadow casing polyline
      L.polyline([], {
        color: "#057a55",
        weight: 8,
        opacity: 0.45,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // 2. Main street route polyline
      const mainRoute = L.polyline([], {
        color: "#2ed573",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      mainRouteLineRef.current = mainRoute;

      // Turn-by-turn route between Restaurant and Customer
      fetchStreetRoute(restL, restG, delivL, delivG).then((routeData) => {
        // The screen may have closed while the route was loading
        if (mapInstanceRef.current !== map) return;

        mainRoute.setLatLngs(routeData.coordinates);
        setDistanceKm(routeData.distanceKm);
        setEtaMinutes(routeData.durationMin);

        const bounds = L.latLngBounds([
          [restL, restG],
          [delivL, delivG],
          ...routeData.coordinates,
        ]);
        // No animation: the zoom animation keeps running if the map closes and Leaflet fails
        map.fitBounds(bounds, { padding: [45, 45], animate: false });
      });

      // 3. Restaurant Origin Marker (Gold Badge)
      const restIconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: rgba(20, 24, 33, 0.94); color: #ffd700; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 3px; border: 1px solid rgba(255,215,0,0.4); backdrop-filter: blur(4px);">
            ${escapeHtml(restaurantName)}
          </div>
          <div style="width: 26px; height: 26px; background: #ff9f43; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255,159,67,0.6);">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>
      `;
      const restIcon = L.divIcon({
        className: "clean-rest-marker",
        html: restIconHtml,
        iconSize: [0, 0],
      });
      L.marker([restL, restG], { icon: restIcon })
        .addTo(map)
        .bindPopup(`<b>Retiro en:</b><br/>${escapeHtml(restaurantName)}<br/>${escapeHtml(restaurantAddress || "Local")}`);

      // 4. Customer Destination Marker (Coral Red Badge)
      const delivIconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: rgba(255, 71, 87, 0.95); color: #ffffff; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 12px rgba(255,71,87,0.5); white-space: nowrap; margin-bottom: 3px; border: 1px solid rgba(255,255,255,0.4);">
            ${escapeHtml(customerName || "Cliente")}
          </div>
          <div style="width: 26px; height: 26px; background: #ff4757; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255,71,87,0.6);">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>
      `;
      const delivIcon = L.divIcon({
        className: "clean-deliv-marker",
        html: delivIconHtml,
        iconSize: [0, 0],
      });
      L.marker([delivL, delivG], { icon: delivIcon })
        .addTo(map)
        .bindPopup(`<b>Entrega a:</b><br/>${escapeHtml(customerName || "Cliente")}<br/>${escapeHtml(deliveryAddress)}`);

      // 5. Driver Marker if coordinates already available
      const initDriverLat = driverLat ?? currentGps?.lat;
      const initDriverLng = driverLng ?? currentGps?.lng;

      if (initDriverLat != null && initDriverLng != null && !isNaN(initDriverLat) && !isNaN(initDriverLng)) {
        const driverIcon = L.divIcon({
          className: "clean-driver-marker",
          html: createDriverMarkerHtml(driverName, isDriverView),
          iconSize: [0, 0],
        });
        const driverMarker = L.marker([initDriverLat, initDriverLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
        driverMarker.bindPopup(`<b>${isDriverView ? "Tu ubicación actual" : escapeHtml(driverName || "Repartidor en camino")}</b>`);
        driverMarkerRef.current = driverMarker;
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        driverMarkerRef.current = null;
      }
    };
  }, [restL, restG, delivL, delivG]);

  const hasLiveDriverLocation = !!(currentGps?.lat || (driverLat && driverLng));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      backgroundColor: "var(--bg-secondary, #1a1e29)",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)"
    }}>
      {/* CSS Pulse Style for Driver Radar */}
      <style>{`
        @keyframes leaflet-radar-pulse {
          0% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1.85); opacity: 0; }
        }
      `}</style>

      {/* Map Window Container */}
      <div style={{ position: "relative", width: "100%", height }}>
        {/* Leaflet Canvas */}
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Minimal Floating Status Badge (Top-Left) */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(18, 22, 31, 0.92)",
          backdropFilter: "blur(8px)",
          color: "#ffffff",
          padding: "6px 12px",
          borderRadius: "30px",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          fontSize: "13px",
          fontWeight: "700",
          pointerEvents: "none"
        }}>
          <span>{systemIconForEmoji("🛵")}</span>
          <span style={{ color: "#2ed573" }}>
            {distanceKm > 0 ? `${distanceKm} km` : "En ruta"}
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>~{etaMinutes} min</span>

          {hasLiveDriverLocation ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "#2ed573",
              background: "rgba(46, 213, 115, 0.15)",
              padding: "2px 6px",
              borderRadius: "10px",
              border: "1px solid rgba(46, 213, 115, 0.3)"
            }}>
              <Radio size={10} className="animate-pulse" /> GPS en vivo
            </span>
          ) : (
            <span style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.8 }}>
              Ruta estimada
            </span>
          )}
        </div>

        {/* Floating Top-Right Controls */}
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1000, display: "flex", gap: "6px" }}>
          {isDriverView && (
            <button
              type="button"
              onClick={handleManualGpsRefresh}
              title="Actualizar mi señal GPS"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: gpsStatus === "ACTIVE" ? "rgba(46, 213, 115, 0.2)" : "rgba(18, 22, 31, 0.9)",
                backdropFilter: "blur(8px)",
                color: gpsStatus === "ACTIVE" ? "#2ed573" : "#ffffff",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <RefreshCw size={16} className={gpsStatus === "UPDATING" ? "animate-spin" : ""} />
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            title="Centrar ruta completa"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(18, 22, 31, 0.9)",
              backdropFilter: "blur(8px)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              transition: "transform 0.2s ease",
            }}
          >
            <Compass size={18} color="#2ed573" />
          </button>
        </div>
      </div>

      {/* Driver GPS Testing Bar (Only shown in driver view to test GPS advancement if on desktop) */}
      {isDriverView && (
        <div style={{
          padding: "6px 14px",
          backgroundColor: "rgba(46, 213, 115, 0.08)",
          borderTop: "1px solid rgba(46, 213, 115, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "var(--text-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: gpsStatus === "ACTIVE" ? "#2ed573" : gpsStatus === "ERROR" ? "#ff4757" : "#ffa502"
            }}></span>
            <span>
              {gpsStatus === "ACTIVE"
                ? `GPS Activo (${currentGps?.lat.toFixed(4)}, ${currentGps?.lng.toFixed(4)})`
                : gpsStatus === "UPDATING"
                ? "Buscando satélites GPS..."
                : "Esperando permisos GPS del dispositivo"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSimulateAdvance}
            title="Simular avance hacia el cliente"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              padding: "3px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            {systemIconForEmoji("🧪")} Probar Avance GPS (+20%)
          </button>
        </div>
      )}

      {/* Clean Bottom Action Strip with Google Maps & Waze Navigation */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: "var(--bg-tertiary, #141722)",
        borderTop: "1px solid var(--border-light, rgba(255,255,255,0.06))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 180px", overflow: "hidden" }}>
          <span style={{ fontSize: "14px" }}>{systemIconForEmoji("📍")}</span>
          <span style={{
            fontSize: "13px",
            color: "var(--text-primary, #ffffff)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            <strong>Entrega:</strong> {deliveryAddress}
          </span>
        </div>

        {/* Navigation Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
          {isDriverView && (
            <button
              type="button"
              onClick={() => openGoogleMapsNavigation("RESTAURANT")}
              title="Ir al restaurante a recoger pedido"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "rgba(255, 159, 67, 0.15)",
                color: "#ff9f43",
                border: "1px solid rgba(255, 159, 67, 0.4)",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              <span>{systemIconForEmoji("🏪")} Ir al Local</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openGoogleMapsNavigation("CUSTOMER")}
            title="Abrir destino en Google Maps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#1a73e8",
              color: "#ffffff",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "background 0.2s ease",
              boxShadow: "0 2px 8px rgba(26,115,232,0.35)",
            }}
          >
            <Navigation size={13} fill="#ffffff" />
            <span>Google Maps</span>
          </button>

          <button
            type="button"
            onClick={() => openWazeNavigation("CUSTOMER")}
            title="Abrir destino en Waze"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#00d2d3",
              color: "#000000",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "background 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,210,211,0.35)",
            }}
          >
            <ExternalLink size={13} />
            <span>Waze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
