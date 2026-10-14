import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const icon = (name, color, size = 36) =>
  L.divIcon({
    className: "",
    html: `<span class="material-symbols-outlined" style="font-size:${size}px;color:${color};font-variation-settings:'FILL' 1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">${name}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
  });
const STORE = icon("storefront", "#ea580c");
const HOME = icon("home_pin", "#16a34a");
const BIKE = icon("two_wheeler", "#2563eb", 40);

const ok = (p) => p && typeof p.lat === "number" && typeof p.lng === "number";

const Fit = ({ points }) => {
  const map = useMap();
  const key = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    // the key stands in for the points so panning is not undone on every poll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
};

// Customer's live tracking map: restaurant, delivery address, and the driver once assigned, with the road route.
// onRoute receives { km, min } for the part of the trip still to go (used for the ETA).
const TrackingMap = ({ branch, dropoff, rider, status, onRoute }) => {
  const [route, setRoute] = useState(null);

  // what is left to travel: driver -> home once the food is picked up, otherwise restaurant -> home
  const from = status === "dispatched" && ok(rider) ? rider : branch;
  const pts = useMemo(() => (ok(from) && ok(dropoff) ? [from, dropoff] : []), [from, dropoff]);
  const key = pts.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join(";");

  useEffect(() => {
    if (pts.length < 2) return;
    const ctl = new AbortController();
    const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((j) => {
        const r0 = j.routes?.[0];
        if (!r0) throw new Error("no route");
        setRoute({ coords: r0.geometry.coordinates.map(([lng, lat]) => [lat, lng]) });
        onRoute?.({ km: r0.distance / 1000, min: Math.max(1, Math.round(r0.duration / 60)) });
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        // no road route: straight-line distance at ~20 km/h
        const R = 6371, rad = (d) => (d * Math.PI) / 180;
        const [a, b] = pts;
        const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
        const km = 2 * R * Math.asin(Math.sqrt(h));
        setRoute({ coords: pts.map((p) => [p.lat, p.lng]), fallback: true });
        onRoute?.({ km, min: Math.max(1, Math.round((km / 20) * 60)) });
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const all = [branch, dropoff, rider].filter(ok).map((p) => [p.lat, p.lng]);

  return (
    <MapContainer center={[11.5564, 104.9282]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Fit points={all} />
      {route && pts.length === 2 && (
        <Polyline positions={route.coords} pathOptions={{ color: "#ea580c", weight: 5, opacity: 0.85, dashArray: route.fallback ? "8 8" : undefined }} />
      )}
      {ok(branch) && (
        <Marker position={[branch.lat, branch.lng]} icon={STORE}>
          <Popup>{branch.name || "Restaurant"}</Popup>
        </Marker>
      )}
      {ok(dropoff) && (
        <Marker position={[dropoff.lat, dropoff.lng]} icon={HOME}>
          <Popup>Your delivery address</Popup>
        </Marker>
      )}
      {ok(rider) && (
        <Marker position={[rider.lat, rider.lng]} icon={BIKE}>
          <Popup>{rider.name || "Your driver"}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default TrackingMap;