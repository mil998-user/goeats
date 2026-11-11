import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Utensils } from "lucide-react";
import { LocationPickerMap } from "../components/LocationPickerMap";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export const CustomerLocationSetup: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  // ?new=1 adds one more saved address (work, family...) instead of the first one
  const [searchParams] = useSearchParams();
  const isExtraAddress = searchParams.get("new") === "1";
  // Only a restaurant page is accepted as the place to go back to
  const returnParam = searchParams.get("returnTo");
  const restaurantReturnTo = returnParam && /^\/r\/[a-z0-9-]+(\/mesa\/\d+)?$/.test(returnParam) ? returnParam : null;
  const [label, setLabel] = useState(isExtraAddress ? "" : "Casa");
  const [step, setStep] = useState<1 | 2>(1);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [floorApartment, setFloorApartment] = useState("");
  const [secondaryStreet, setSecondaryStreet] = useState("");
  const [references, setReferences] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectLocation = (latitude: number, longitude: number, address?: string) => {
    setLocation({
      latitude,
      longitude,
      address: address?.trim() || `Loja (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    });
    setError(null);
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!location) {
      setError("Selecciona tu domicilio en el mapa para continuar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isExtraAddress) {
        const saved = await apiRequest("/orders/customer/addresses", {
          method: "POST",
          body: JSON.stringify({
            label,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            floorApartment,
            secondaryStreet,
            references,
          }),
        });
        if (saved?.profile) updateUser(saved.profile);
        navigate("/customer/profile", { replace: true });
        return;
      }

      const response = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          deliveryAddress: location.address,
          deliveryLatitude: location.latitude,
          deliveryLongitude: location.longitude,
          deliveryFloorApartment: floorApartment,
          deliverySecondaryStreet: secondaryStreet,
          deliveryReferences: references,
        }),
      });
      if (!response?.success) {
        throw new Error(response?.message || "No se pudo guardar tu dirección.");
      }

      updateUser({
        deliveryAddress: location.address,
        deliveryLatitude: location.latitude,
        deliveryLongitude: location.longitude,
        deliveryFloorApartment: floorApartment,
        deliverySecondaryStreet: secondaryStreet,
        deliveryReferences: references,
      });
      navigate(restaurantReturnTo || "/restaurants?setup_preferences=true", { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar tu dirección.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="customer-location-setup">
      <header className="location-setup-header">
        <div className="location-setup-brand"><Utensils size={19} /> GoEats</div>
        <span>{isExtraAddress ? "Agrega otra dirección" : "Configura tu domicilio"}</span>
      </header>

      <section className="location-setup-card">
        <div className="location-setup-progress" aria-label={`Paso ${step} de 2`}>
          <span className={step === 1 ? "active" : "complete"}>1</span>
          <i className={step === 2 ? "complete" : ""} />
          <span className={step === 2 ? "active" : ""}>2</span>
        </div>

        {step === 1 ? (
          <>
            <span className="landing-eyebrow landing-eyebrow-dark">Paso 1 de 2</span>
            <h1>{isExtraAddress ? "¿Dónde queda la nueva dirección?" : "¿Dónde queda tu domicilio?"}</h1>
            <p className="location-setup-description">
              Busca tu dirección o mueve el pin del mapa. La usaremos como punto de entrega.
            </p>
            <LocationPickerMap
              showRestaurantLocation={false}
              onLocationSelect={selectLocation}
              height="330px"
            />
            {location && (
              <div className="location-selected-address">
                <MapPin size={17} />
                <span><strong>Ubicación seleccionada</strong>{location.address}</span>
              </div>
            )}
            {error && <p className="location-setup-error" role="alert">{error}</p>}
            <button
              className="landing-primary-button location-setup-next"
              disabled={!location}
              onClick={() => setStep(2)}
            >
              Continuar con esta dirección <ArrowRight size={17} />
            </button>
          </>
        ) : (
          <form onSubmit={saveAddress}>
            <button type="button" className="location-setup-back" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Cambiar ubicación
            </button>
            <span className="landing-eyebrow landing-eyebrow-dark">Paso 2 de 2</span>
            <h1>Detalles para la entrega</h1>
            <p className="location-setup-description">
              Confirma el punto en el mapa y agrega información para que el repartidor te encuentre.
            </p>

            <div className="location-setup-map-summary">
              <MapPin size={17} />
              <span>{location?.address}</span>
            </div>
            {location && (
              <LocationPickerMap
                key={`${location.latitude}:${location.longitude}`}
                initialLat={location.latitude}
                initialLng={location.longitude}
                showRestaurantLocation={false}
                onLocationSelect={selectLocation}
                height="250px"
              />
            )}

            {isExtraAddress && (
              <label className="location-setup-field">
                Nombre de esta dirección
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Ej. Trabajo, Casa de mi mamá"
                  maxLength={40}
                  required
                />
              </label>
            )}
            <label className="location-setup-field">
              Piso / apartamento
              <input
                value={floorApartment}
                onChange={(event) => setFloorApartment(event.target.value)}
                placeholder="Ej. Piso 2, departamento 3B"
                autoComplete="address-line2"
              />
            </label>
            <label className="location-setup-field">
              Calle secundaria
              <input
                value={secondaryStreet}
                onChange={(event) => setSecondaryStreet(event.target.value)}
                placeholder="Ej. Calle que cruza con tu domicilio"
                autoComplete="address-line1"
              />
            </label>
            <label className="location-setup-field">
              Referencias
              <textarea
                value={references}
                onChange={(event) => setReferences(event.target.value)}
                placeholder="Ej. Casa blanca frente al parque"
                rows={3}
              />
            </label>

            {error && <p className="location-setup-error" role="alert">{error}</p>}
            <button className="landing-primary-button location-setup-next" disabled={saving || !location}>
              {saving ? <><Loader2 className="spin" size={17} /> Guardando dirección...</> : <>{isExtraAddress ? "Guardar dirección" : "Guardar y continuar"} <ArrowRight size={17} /></>}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
