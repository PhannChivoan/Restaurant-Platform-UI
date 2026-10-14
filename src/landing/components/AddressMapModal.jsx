import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { cartRequest } from "../api/cartApi";
import { DEFAULT_CENTER, getCurrentPosition, reversePlace, searchPlaces } from "../api/geo";

const pin = L.divIcon({
  className: "",
  html: '<span class="material-symbols-outlined" style="font-size:40px;color:#ea580c;font-variation-settings:\'FILL\' 1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">location_on</span>',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});

const LABELS = ["Home", "Office", "Other"];

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

// Pick a delivery spot: search a place, use the current location, or tap / drag the pin.
// Saving stores it in the customer's address book (name, text, coordinates).
const AddressMapModal = ({ address = null, onClose, onSaved }) => {
  const editing = Boolean(address);
  const [pos, setPos] = useState(
    editing && address.latitude != null ? { lat: address.latitude, lng: address.longitude } : DEFAULT_CENTER,
  );
  const [pinned, setPinned] = useState(editing && address.latitude != null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    label: address?.label ?? "Home",
    address: address?.address ?? "",
    city: address?.city ?? "",
    postal_code: address?.postal_code ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lookupSeq = useRef(0);

  // fill the text fields from a map position
  const resolve = async (lat, lng) => {
    const seq = ++lookupSeq.current;
    try {
      const p = await reversePlace(lat, lng);
      if (seq !== lookupSeq.current) return;
      setForm((f) => ({ ...f, address: p.label, city: p.city, postal_code: p.postal_code }));
    } catch {
      /* user can still type the address */
    }
  };

  const pick = (lat, lng) => {
    setPos({ lat, lng });
    setPinned(true);
    setError("");
    resolve(lat, lng);
  };

  const useMyLocation = async () => {
    setError("");
    try {
      const p = await getCurrentPosition();
      pick(p.lat, p.lng);
    } catch (e) {
      setError(e.message);
    }
  };

  // Start on the customer's location when the browser allows it (new addresses only).
  useEffect(() => {
    if (editing) return;
    let alive = true;
    getCurrentPosition()
      .then((p) => {
        if (alive) {
          setPos(p);
          setPinned(true);
          resolve(p.lat, p.lng);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [editing]);

  // debounced place search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(q));
      } catch (e) {
        setError(e.message);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const choose = (r) => {
    setPos({ lat: r.lat, lng: r.lng });
    setPinned(true);
    setForm((f) => ({ ...f, address: r.label, city: r.city, postal_code: r.postal_code }));
    setResults([]);
    setQuery("");
  };

  const save = async () => {
    if (!pinned) return setError("Search for your address, use your location, or tap the map to drop the pin.");
    if (!form.address.trim()) return setError("Please enter the address text.");
    setBusy(true);
    setError("");
    try {
      const payload = {
        label: form.label,
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        latitude: pos.lat,
        longitude: pos.lng,
      };
      const res = editing
        ? await cartRequest(`my/addresses/${address.id}`, "PUT", payload)
        : await cartRequest("my/addresses", "POST", payload);
      onSaved(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full px-space-md py-space-sm bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.4)]";

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-space-md">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-space-lg pt-space-md">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{editing ? "Edit address" : "Add delivery address"}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="px-space-lg py-space-sm flex flex-col gap-space-sm relative">
          <div className="flex gap-space-xs">
            <input
              className={input}
              placeholder="Search street, building or area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="shrink-0 px-space-md bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              <span className="hidden sm:inline">Use my location</span>
            </button>
          </div>
          {(results.length > 0 || searching) && (
            <ul className="absolute z-[1000] left-space-lg right-space-lg top-[58px] bg-surface-container-lowest rounded-lg shadow-xl border border-surface-container-low max-h-56 overflow-y-auto">
              {searching && <li className="px-space-md py-2 text-on-surface-variant font-body-sm">Searching…</li>}
              {results.map((r) => (
                <li key={`${r.lat},${r.lng},${r.label}`}>
                  <button
                    type="button"
                    onClick={() => choose(r)}
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
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
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
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Tap the map or drag the pin to set the exact spot where the rider should come.
          </p>

          <div className="flex gap-space-xs">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={
                  form.label === l
                    ? "px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold"
                    : "px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container"
                }
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            className={input}
            rows={2}
            placeholder="Address (add floor, room or landmark if needed)"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-space-sm">
            <input className={input} placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <input
              className={input}
              placeholder="Postal code"
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            />
          </div>

          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="w-full min-h-[52px] bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary rounded-xl font-label-lg text-label-lg font-bold mb-space-sm"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Save address"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressMapModal;