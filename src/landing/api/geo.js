// Free OpenStreetMap services (no key): place search and reverse lookup.
// Fine for development and light use; swap for a paid geocoder before heavy traffic.
export const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };

const NOMINATIM = "https://nominatim.openstreetmap.org";

const pickCity = (a = {}) => a.city || a.town || a.village || a.municipality || a.county || a.state || "";

export const searchPlaces = async (q) => {
  const res = await fetch(`${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Search is unavailable right now.");
  const rows = await res.json();
  return rows.map((r) => ({
    label: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    city: pickCity(r.address),
    postal_code: r.address?.postcode ?? "",
  }));
};

export const reversePlace = async (lat, lng) => {
  const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Couldn't look up this spot.");
  const r = await res.json();
  return {
    label: r.display_name ?? "",
    city: pickCity(r.address),
    postal_code: r.address?.postcode ?? "",
  };
};

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser can't share your location."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("Location permission was denied. Search for your address or tap the map instead.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });