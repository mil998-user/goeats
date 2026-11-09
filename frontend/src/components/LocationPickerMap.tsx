import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Compass, Loader2, Search, X } from "lucide-react";
import { systemTextWithIcons } from "../utils/systemIcons";
import { escapeHtml } from "../utils/html";


interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  restaurantName?: string;
  showRestaurantLocation?: boolean;
  onLocationSelect: (lat: number, lng: number, addressText?: string, distanceKm?: number) => void;
  height?: string;
}

// Default center: Loja, Ecuador (Centro Histórico)
const DEFAULT_LAT = -3.99313;
const DEFAULT_LNG = -79.20422;

// Clean and expand abbreviations common in Ecuador / Loja
const cleanStreetText = (raw: string): string => {
  return raw
    .replace(/\bC\.\s*|\bClle\.\s*/gi, "Calle ")
    .replace(/\bAv\.\s*|\bAvda\.\s*/gi, "Avenida ")
    .replace(/\bSta\.\s*/gi, "Santa ")
    .replace(/\bSto\.\s*/gi, "Santo ")
    .replace(/\bPje\.\s*/gi, "Pasaje ")
    .replace(/\bCdla\.\s*/gi, "Ciudadela ")
    .replace(/\bUrb\.\s*/gi, "Urbanización ")
    .replace(/\bB\.\s*|\bBo\.\s*/gi, "Barrio ")
    .replace(/[#°º]/g, " ")
    .trim();
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat,
  initialLng,
  restaurantLat = -3.9965,
  restaurantLng = -79.2030,
  restaurantName = "Restaurante",
  showRestaurantLocation = true,
  onLocationSelect,
  height = "280px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const restMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || DEFAULT_LAT,
    lng: initialLng || DEFAULT_LNG,
  });
  const [locating, setLocating] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string>("");

  // Address Geocoding Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

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

  // Fetch real vehicular street route from OSRM
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
          const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
          const durationMin = Math.max(3, Math.round(route.duration / 60));
          return { coordinates: latLngs, distanceKm, durationMin };
        }
      }
    } catch (e) {
      console.warn("OSRM routing request failed, using straight-line fallback:", e);
    }

    const dist = calculateHaversine(startLat, startLng, endLat, endLng);
    return {
      coordinates: [
        [startLat, startLng],
        [endLat, endLng],
      ],
      distanceKm: dist,
      durationMin: Math.max(3, Math.round(dist * 3 + 2)),
    };
  };

  // Reverse Geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { "Accept-Language": "es" },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const fullAddress =
          data.display_name?.split(",").slice(0, 3).join(",") ||
          `Loja (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setDetectedAddress(fullAddress);
        return fullAddress;
      }
    } catch (e) {
      console.warn("Geocoding failed, using coordinates fallback:", e);
    } finally {
      setAddressLoading(false);
    }
    const fallback = `Loja (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setDetectedAddress(fallback);
    return fallback;
  };

  // Address Search with Loja Proximity Bias
  const executeAddressSearch = async (text: string) => {
    if (!text || text.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    const cleaned = cleanStreetText(text);
    const curLat = currentCoords.lat || DEFAULT_LAT;
    const curLng = currentCoords.lng || DEFAULT_LNG;

    const resultsList: any[] = [];
    const seenCoordinates = new Set<string>();

    const addResults = (items: any[]) => {
      for (const item of items) {
        const latVal = parseFloat(item.lat);
        const lonVal = parseFloat(item.lon);
        if (isNaN(latVal) || isNaN(lonVal)) continue;

        const key = `${latVal.toFixed(3)},${lonVal.toFixed(3)}`;
        if (!seenCoordinates.has(key)) {
          seenCoordinates.add(key);
          resultsList.push({
            place_id: item.place_id || Math.random(),
            lat: latVal,
            lon: lonVal,
            display_name: item.display_name,
          });
        }
      }
    };

    try {
      // 1. Photon Geocoder (Fast, proximity biased to Loja)
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          cleaned
        )}&lat=${curLat}&lon=${curLng}&lang=es&limit=6`;
        const resPhoton = await fetch(photonUrl);
        if (resPhoton.ok) {
          const data = await resPhoton.json();
          if (data.features && data.features.length > 0) {
            const photonItems = data.features.map((f: any) => {
              const p = f.properties;
              const parts = [
                p.name,
                p.street,
                p.district,
                p.city || p.county,
                p.state || "Loja",
              ].filter(Boolean);
              const label = Array.from(new Set(parts)).join(", ");
              return {
                place_id: f.properties.osm_id || Math.random(),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                display_name: label,
              };
            });
            addResults(photonItems);
          }
        }
      } catch (e) {
        console.warn("Photon search error:", e);
      }

      // 2. Nominatim with Loja Priority Viewbox
      try {
        const viewbox = `-79.28,-4.06,-79.14,-3.92`;
        const q =
          cleaned.toLowerCase().includes("loja") || cleaned.toLowerCase().includes("ecuador")
            ? cleaned
            : `${cleaned}, Loja, Ecuador`;

        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&viewbox=${viewbox}&countrycodes=ec&limit=6`;
        const resNom = await fetch(nomUrl, { headers: { "Accept-Language": "es" } });
        if (resNom.ok) {
          const nomData = await resNom.json();
          addResults(nomData || []);
        }
      } catch (e) {
        console.warn("Nominatim search error:", e);
      }

      // 3. Fallback for intersections with " y " / " con "
      if (
        resultsList.length < 2 &&
        (cleaned.includes(" y ") || cleaned.includes(" con ") || cleaned.includes(" - "))
      ) {
        const parts = cleaned.split(/\s+(?:y|con|-)\s+/i);
        if (parts[0] && parts[0].trim().length >= 3) {
          const street1 = parts[0].trim();
          try {
            const nomUrl1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              `${street1}, Loja, Ecuador`
            )}&countrycodes=ec&limit=4`;
            const res1 = await fetch(nomUrl1, { headers: { "Accept-Language": "es" } });
            if (res1.ok) {
              const nomData1 = await res1.json();
              addResults(nomData1 || []);
            }
          } catch (e) {}

          try {
            const pUrl1 = `https://photon.komoot.io/api/?q=${encodeURIComponent(
              street1
            )}&lat=${curLat}&lon=${curLng}&lang=es&limit=4`;
            const resP1 = await fetch(pUrl1);
            if (resP1.ok) {
              const dataP1 = await resP1.json();
              if (dataP1.features) {
                const pItems1 = dataP1.features.map((f: any) => {
                  const p = f.properties;
                  const streetParts = [p.name, p.street, p.district, p.city, p.state || "Loja"].filter(Boolean);
                  return {
                    place_id: f.properties.osm_id || Math.random(),
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0],
                    display_name: Array.from(new Set(streetParts)).join(", "),
                  };
                });
                addResults(pItems1);
              }
            }
          } catch (e) {}
        }
      }

      setSearchResults(resultsList.slice(0, 8));
      setShowResults(true);
    } catch (err) {
      console.warn("General address search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        executeAddressSearch(val);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name?.split(",").slice(0, 3).join(",") || result.display_name;

    setShowResults(false);
    setSearchQuery(label);
    setDetectedAddress(label);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true });
    }

    updateLocation(lat, lng);
  };

  // Update selected coordinates, calculate street route & trigger parent callback
  const updateLocation = async (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });

    let distance = 0;
    if (showRestaurantLocation && restaurantLat && restaurantLng) {
      const routeData = await fetchStreetRoute(restaurantLat, restaurantLng, lat, lng);
      distance = routeData.distanceKm;
      setEstimatedDistance(distance);
      setEstimatedDuration(routeData.durationMin);

      // Update map street-routed polyline
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(routeData.coordinates);
      }
    }

    const addr = await reverseGeocode(lat, lng);
    onLocationSelect(lat, lng, addr, distance);

    // Update map marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // Detect browser GPS with multi-stage fallback (High accuracy -> Low accuracy -> IP Geo -> smooth center)
  const handleGetCurrentLocation = async () => {
    setLocating(true);

    const tryIpGeolocation = async () => {
      try {
        const res = await fetch("https://ipwho.is/");
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          const lat = Number(data.latitude);
          const lng = Number(data.longitude);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true });
          }
          updateLocation(lat, lng);
          return true;
        }
      } catch (e) {
        console.warn("IP Geolocation fallback failed:", e);
      }
      return false;
    };

    if (!navigator.geolocation) {
      await tryIpGeolocation();
      setLocating(false);
      return;
    }

    // Attempt 1: High accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { animate: true });
        }
        updateLocation(latitude, longitude);
      },
      (err1) => {
        // Attempt 2: Low accuracy / Wi-Fi triangulation
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            setLocating(false);
            const { latitude, longitude } = pos2.coords;
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([latitude, longitude], 16, { animate: true });
            }
            updateLocation(latitude, longitude);
          },
          async (err2) => {
            console.warn("Native GPS unavailable, trying IP geolocation fallback:", err1, err2);
            // Attempt 3: IP Geolocation (works on HTTP / local network IPs)
            const ok = await tryIpGeolocation();
            setLocating(false);
            if (!ok) {
              const fallbackLat = showRestaurantLocation ? restaurantLat || initialLat || DEFAULT_LAT : initialLat || DEFAULT_LAT;
              const fallbackLng = showRestaurantLocation ? restaurantLng || initialLng || DEFAULT_LNG : initialLng || DEFAULT_LNG;
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([fallbackLat, fallbackLng], 15, { animate: true });
              }
              updateLocation(fallbackLat, fallbackLng);
            }
          },
          { enableHighAccuracy: false, timeout: 6000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const lat = initialLat || DEFAULT_LAT;
      const lng = initialLng || DEFAULT_LNG;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom User Marker Pin (Coral Badge)
      const userPinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; transform: translate(-50%, -100%);">
          <div style="background: rgba(255, 71, 87, 0.95); color: white; padding: 3px 8px; border-radius: 12px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 12px rgba(255,71,87,0.4); white-space: nowrap; margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.4);">
            Tu Entrega
          </div>
          <div style="width: 24px; height: 24px; background: #ff4757; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255,71,87,0.6);">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: "clean-user-marker",
        html: userPinHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon: userIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        updateLocation(lat, lng);
      });

      markerRef.current = marker;

      // Click on map to move marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateLocation(lat, lng);
      });

      // If restaurant coordinates provided, plot street-routed polyline
      if (showRestaurantLocation && restaurantLat && restaurantLng) {
        const restPinHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: rgba(20, 24, 33, 0.9); color: #ffd700; padding: 3px 8px; border-radius: 12px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); white-space: nowrap; margin-bottom: 2px; border: 1px solid rgba(255,215,0,0.3); backdrop-filter: blur(4px);">
              ${escapeHtml(restaurantName)}
            </div>
            <div style="width: 22px; height: 22px; background: #ff9f43; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255,159,67,0.5);">
              <div style="width: 7px; height: 7px; background: #ffffff; border-radius: 50%;"></div>
            </div>
          </div>
        `;
        const restIcon = L.divIcon({
          className: "clean-rest-marker",
          html: restPinHtml,
          iconSize: [0, 0],
        });

        const restMarker = L.marker([restaurantLat, restaurantLng], {
          icon: restIcon,
          interactive: false,
        }).addTo(map);
        restMarkerRef.current = restMarker;

        const route = L.polyline([], {
          color: "#ff4757",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        routeLineRef.current = route;

        // Fetch street route immediately
        fetchStreetRoute(restaurantLat, restaurantLng, lat, lng).then((routeData) => {
          route.setLatLngs(routeData.coordinates);
          setEstimatedDistance(routeData.distanceKm);
          setEstimatedDuration(routeData.durationMin);

          const bounds = L.latLngBounds([
            [restaurantLat, restaurantLng],
            [lat, lng],
          ]);
          map.fitBounds(bounds, { padding: [40, 40] });
        });
      }

      mapInstanceRef.current = map;
      reverseGeocode(lat, lng);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
      {/* Live Address Search Header */}
      <div style={{
        position: "relative",
        padding: "10px 14px",
        backgroundColor: "var(--bg-tertiary, #141722)",
        borderBottom: "1px solid var(--border-light, rgba(255,255,255,0.06))",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted, #718096)"
          }} />
          <input
            type="text"
            placeholder="Escribe la calle o punto de entrega en Loja..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeAddressSearch(searchQuery);
              }
            }}
            style={{
              width: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border-light, rgba(255,255,255,0.12))",
              borderRadius: "20px",
              padding: "7px 36px 7px 34px",
              fontSize: "13px",
              color: "#ffffff",
              outline: "none"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
              }}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <X size={14} />
            </button>
          )}

          {/* Autocomplete Results Dropdown */}
          {showResults && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 2000,
              backgroundColor: "rgba(18, 22, 31, 0.98)",
              backdropFilter: "blur(12px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 71, 87, 0.35)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              maxHeight: "240px",
              overflowY: "auto"
            }}>
              {searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={res.place_id || i}
                    onClick={() => handleSelectSearchResult(res)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#ffffff",
                      borderBottom: i < searchResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 71, 87, 0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <MapPin size={15} color="#ff4757" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {res.display_name}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "12px 14px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                  No se encontraron resultados exactos. Intenta con el nombre de la calle o mueve el pin en el mapa.
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => executeAddressSearch(searchQuery)}
          disabled={searching}
          style={{
            backgroundColor: "#ff4757",
            color: "#ffffff",
            border: "none",
            borderRadius: "20px",
            padding: "7px 14px",
            fontSize: "13px",
            fontWeight: "800",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            flexShrink: 0
          }}
        >
          {searching ? <Loader2 size={13} className="spin" /> : <Search size={13} />}
          <span>{searching ? "Buscando..." : "Buscar"}</span>
        </button>
      </div>

      {/* Map Element */}
      <div style={{ position: "relative", width: "100%", height }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Floating GPS Button (Top-Right) */}
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1000 }}>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(18, 22, 31, 0.92)",
              backdropFilter: "blur(8px)",
              color: "#ffffff",
              padding: "7px 14px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 71, 87, 0.4)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {locating ? (
              <Loader2 size={14} className="spin" color="#ff4757" />
            ) : (
              <Navigation size={13} fill="#ff4757" color="#ff4757" />
            )}
            <span>{locating ? "Detectando..." : systemTextWithIcons("📍 Mi GPS actual")}</span>
          </button>
        </div>
      </div>

      {/* Sleek Bottom Info Strip */}
      <div style={{
        padding: "10px 14px",
        backgroundColor: "var(--bg-tertiary, #141722)",
        borderTop: "1px solid var(--border-light, rgba(255,255,255,0.06))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        fontSize: "13px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 180px", overflow: "hidden" }}>
          <MapPin size={15} color="#ff4757" style={{ flexShrink: 0 }} />
          <span style={{ color: "var(--text-primary, #ffffff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {addressLoading ? "Detectando calle..." : detectedAddress || "Mueve el pin por las calles"}
          </span>
        </div>

        {estimatedDistance !== null && (
          <div style={{
            backgroundColor: "rgba(255, 71, 87, 0.12)",
            color: "#ff4757",
            padding: "3px 10px",
            borderRadius: "16px",
            fontWeight: "800",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            border: "1px solid rgba(255, 71, 87, 0.25)"
          }}>
            <Compass size={12} />
            <span>~{estimatedDistance.toFixed(1)} km ({estimatedDuration || 5} min)</span>
          </div>
        )}
      </div>
    </div>
  );
};
