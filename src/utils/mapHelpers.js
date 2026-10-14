import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";

export const DEFAULT_CENTER = [11.5564, 104.9282];

export const exportToCSV = (rows, filename = "rider-earnings") => {
  if (!rows.length) {
    return false;
  }

  const headers = [
    "Rider",
    "Email",
    "Vehicle",
    "License Plate",
    "Trips",
    "Earnings",
    "Avg Per Trip",
    "Last Delivery",
    "Rating",
    "Status",
    "Latitude",
    "Longitude",
  ];

  const lines = rows.map((row) => [
    row.rider,
    row.email || "",
    row.vehicle_type || "",
    row.license_plate || "",
    row.trips,
    row.earnings,
    row.average_per_trip || 0,
    row.last_delivery_at ? new Date(row.last_delivery_at).toISOString() : "",
    row.rating || 0,
    row.is_online ? "Online" : "Offline",
    row.latitude ?? "",
    row.longitude ?? "",
  ]);

  const csv = [headers, ...lines]
    .map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  return true;
};

export const buildEarningsTrend = (rows) => {
  const days = {};
  rows.forEach((row) => {
    if (!row.last_delivery_at) return;
    const day = row.last_delivery_at.slice(0, 10);
    days[day] = (days[day] || 0) + Number(row.earnings || 0);
  });

  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, earnings]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      earnings: Math.round(earnings * 100) / 100,
    }));
};

export const getCoordinate = (row) => {
  const latitude = row.latitude ?? row.lat ?? row.current_location?.latitude;
  const longitude = row.longitude ?? row.lng ?? row.current_location?.longitude;

  if (
    latitude !== undefined &&
    longitude !== undefined &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
  ) {
    return [Number(latitude), Number(longitude)];
  }

  return null;
};

export const MapRecenter = ({ position, bounds }) => {
  const map = useMap();

  // Stabilised identity keys prevent fitBounds/flyTo from re-running on
  // every render (which would lock the map against user panning).
  const boundsKey = useMemo(
    () => (bounds?.length ? JSON.stringify(bounds) : ""),
    [bounds],
  );
  const positionKey = useMemo(
    () => (position ? `${position[0]},${position[1]}` : ""),
    [position],
  );

  useEffect(() => {
    if (boundsKey) {
      map.fitBounds(JSON.parse(boundsKey), {
        padding: [40, 40],
        maxZoom: 15,
      });
    } else if (positionKey) {
      const [lat, lng] = positionKey.split(",").map(Number);
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
    }
  }, [boundsKey, positionKey, map]);

  return null;
};