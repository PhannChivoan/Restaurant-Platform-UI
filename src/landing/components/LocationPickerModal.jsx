import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DEFAULT_CENTER, getCurrentPosition, reversePlace, searchPlaces } from "../api/geo";

const pin = L.divIcon({
  className: "",
  html: '<span class="material-symbols-outlined" style="font-size:40px;color:#ea580c;font-variation-settings:\'FILL\' 1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">location_on</span>',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});

const Recenter = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 16));
  }, [pos.lat, pos.lng, map]);
  return null;
};

const ClickToPin = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

// Generic "pick a spot on the map" dialog: search, use my location, or tap / drag the pin.
// Calls onPick({ address, city, postal_code, lat, lng }).
const LocationPickerModal = ({ title = "Pick the location", initial = null, onClose, onPick }) => {
  const [pos, setPos] = useState(initial ? { lat: initial.lat, lng: initial.lng } : DEFAULT_CENTER);
  const [pinned, setPinned] = useState(Boolean(initial));
  const [place, setPlace] = useState({ address: initial?.address ?? "", city: initial?.city ?? "", postal_code: initial?.postal_code ?? "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const choose = (lat, lng, p) => {
    setPos({ lat, lng });
    setPinned(true);
    setError("");
    if (p) setPlace({ address: p.label, city: p.city, postal_code: p.postal_code });
  };

  const pick = async (lat, lng) => {
    choose(lat, lng);
    try {
      const p = await reversePlace(lat, lng);
      setPlace({ address: p.label, city: p.city, postal_code: p.postal_code });
    } catch {
      /* the address can be typed instead */
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(async () => {
      try {
        setResults(await searchPlaces(q));
      } catch (e) {
        setError(e.message);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const myLocation = async () => {
    try {
      const p = await getCurrentPosition();
      pick(p.lat, p.lng);
    } catch (e) {
      setError(e.message);
    }
  };

  const confirm = () => {
    if (!pinned) return setError("Search for the address or tap the map to drop the pin.");
    if (!place.address.trim()) return setError("Please enter the address.");
    onPick({ ...place, address: place.address.trim(), lat: pos.lat, lng: pos.lng });
  };

  const input =
    "w-full px-space-md py-space-sm bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.4)]";

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-space-md">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="flex items-center justify-between px-space-lg pt-space-md">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="px-space-lg py-space-sm flex flex-col gap-space-sm relative">
          <div className="flex gap-space-xs">
            <input className={input} placeholder="Search street, building or area…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" onClick={myLocation} className="shrink-0 px-space-md bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              <span className="hidden sm:inline">My location</span>
            </button>
          </div>
          {results.length > 0 && (
            <ul className="absolute z-[1000] left-space-lg right-space-lg top-[58px] bg-surface-container-lowest rounded-lg shadow-xl border border-surface-container-low max-h-56 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.lat},${r.lng},${r.label}`}>
                  <button
                    type="button"
                    onClick={() => {
                      choose(r.lat, r.lng, r);
                      setResults([]);
                      setQuery("");
                    }}
                    className="w-full text-left px-space-md py-2 hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="h-64 sm:h-72 rounded-xl overflow-hidden border border-surface-container-low">
            <MapContainer center={[pos.lat, pos.lng]} zoom={pinned ? 16 : 12} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickToPin onPick={pick} />
              <Recenter pos={pos} />
              {pinned && (
                <Marker
                  position={[pos.lat, pos.lng]}
                  icon={pin}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const ll = e.target.getLatLng();
                      pick(ll.lat, ll.lng);
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>
          <textarea className={input} rows={2} placeholder="Address" value={place.address} onChange={(e) => setPlace((p) => ({ ...p, address: e.target.value }))} />
          <div className="grid grid-cols-2 gap-space-sm">
            <input className={input} placeholder="City" value={place.city} onChange={(e) => setPlace((p) => ({ ...p, city: e.target.value }))} />
            <input className={input} placeholder="Postal code" value={place.postal_code} onChange={(e) => setPlace((p) => ({ ...p, postal_code: e.target.value }))} />
          </div>
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <button type="button" onClick={confirm} className="w-full min-h-[52px] bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold mb-space-sm">
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;