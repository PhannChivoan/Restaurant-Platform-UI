// Map helpers for the rider app.
export const hasPoint = (p) => p && typeof p.lat === "number" && typeof p.lng === "number";

// Where the rider has to go next for a delivery: restaurant first, then the customer.
export const routePoints = (d, me) => {
  const pts = [];
  if (hasPoint(me)) pts.push({ ...me, kind: "me" });
  if (d.status === "assigned" && hasPoint(d.pickup)) pts.push({ lat: d.pickup.lat, lng: d.pickup.lng, kind: "pickup" });
  if (hasPoint(d.dropoff)) pts.push({ lat: d.dropoff.lat, lng: d.dropoff.lng, kind: "dropoff" });
  return pts;
};

// Opens turn-by-turn navigation in Google Maps (works on phones and desktops).
export const googleMapsUrl = (d, me) => {
  const pts = routePoints(d, me).filter((p) => p.kind !== "me");
  if (pts.length === 0) return null;
  const q = (p) => `${p.lat},${p.lng}`;
  const params = new URLSearchParams({ api: "1", travelmode: "driving", destination: q(pts[pts.length - 1]) });
  if (hasPoint(me)) params.set("origin", q(me));
  if (pts.length > 1) params.set("waypoints", pts.slice(0, -1).map(q).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
};
