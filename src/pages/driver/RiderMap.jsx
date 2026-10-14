import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { hasPoint, routePoints } from "./mapUtils";

const icon = (name, color) =>
  L.divIcon({
    className: "",
    html: `<span class="material-symbols-outlined" style="font-size:34px;color:${color};font-variation-settings:'FILL' 1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">${name}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
  });
const PICKUP = icon("storefront", "#ea580c");
const DROPOFF = icon("home_pin", "#16a34a");

const Fit = ({ points }) => {
  const map = useMap();
  const key = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    // key captures the points; fitting on every identical render would fight the user's panning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
};

// Rider map: live position, pickup + drop-off markers and the driving route (OpenStreetMap + OSRM).
const RiderMap = ({ me, deliveries, focus, onRoute }) => {
  const [route, setRoute] = useState(null); // { coords:[[lat,lng]], km, min, fallback }

  const pts = useMemo(() => (focus ? routePoints(focus, me) : []), [focus, me]);
  // refetch only when the rider has moved ~100m or the target changes
  const key = pts.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join(";") + (focus?.status ?? "");

  useEffect(() => {
    if (pts.length < 2) {
      const t = setTimeout(() => {
        setRoute(null);
        onRoute?.(null);
      }, 0);
      return () => clearTimeout(t);
    }
    const ctl = new AbortController();
    const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((j) => {
        const r0 = j.routes?.[0];
        if (!r0) throw new Error("no route");
        const next = {
          coords: r0.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          km: r0.distance / 1000,
          min: Math.round(r0.duration / 60),
        };
        setRoute(next);
        onRoute?.({ km: next.km, min: next.min });
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        // no road route available: show a straight guide line
        setRoute({ coords: pts.map((p) => [p.lat, p.lng]), fallback: true });
        onRoute?.({ fallback: true });
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const all = [];
  deliveries.forEach((d) => {
    if (hasPoint(d.pickup) && d.status === "assigned") all.push([d.pickup.lat, d.pickup.lng]);
    if (hasPoint(d.dropoff)) all.push([d.dropoff.lat, d.dropoff.lng]);
  });
  if (hasPoint(me)) all.push([me.lat, me.lng]);
  const fitPoints = route?.coords?.length ? route.coords : all;

  return (
    <MapContainer center={[11.5564, 104.9282]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Fit points={fitPoints} />

      {route && (
        <Polyline
          positions={route.coords}
          pathOptions={{ color: "#ea580c", weight: 5, opacity: 0.85, dashArray: route.fallback ? "8 8" : undefined }}
        />
      )}

      {deliveries.map((d) => (
        <span key={d.id}>
          {d.status === "assigned" && hasPoint(d.pickup) && (
            <Marker position={[d.pickup.lat, d.pickup.lng]} icon={PICKUP}>
              <Popup>
                <strong>Pick up:</strong> {d.pickup.restaurant}
                <br />
                {d.pickup.address}
              </Popup>
            </Marker>
          )}
          {hasPoint(d.dropoff) && (
            <Marker position={[d.dropoff.lat, d.dropoff.lng]} icon={DROPOFF}>
              <Popup>
                <strong>Deliver to:</strong> {d.dropoff.customer}
                <br />
                {d.dropoff.address}
              </Popup>
            </Marker>
          )}
        </span>
      ))}

      {hasPoint(me) && (
        <>
          <CircleMarker center={[me.lat, me.lng]} radius={16} pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.15 }} />
          <CircleMarker center={[me.lat, me.lng]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  );
};

export default RiderMap;