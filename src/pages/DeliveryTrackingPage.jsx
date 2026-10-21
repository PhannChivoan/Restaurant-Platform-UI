import { formatMoney } from "../utils/platformSettings";
import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Empty,
  Input,
  Space,
  Statistic,
  Tag,
  Tooltip,
  message,
} from "antd";

import {
  Bike,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Crosshair,
  Ellipsis,
  ExternalLink,
  MapPin,
  MapPinned,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import dayjs from "dayjs";

import "leaflet/dist/leaflet.css";

import ModulePage from "../components/ui/ModulePage";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_CENTER = [11.5564, 104.9282];

const STATUS_META = {
  assigned: {
    label: "Assigned",
    color: "blue",
    markerColor: "#1677ff",
    background: "#eff6ff",
    icon: Truck,
  },

  picked_up: {
    label: "Picked up",
    color: "orange",
    markerColor: "#f97316",
    background: "#fff7ed",
    icon: PackageCheck,
  },

  delivered: {
    label: "Delivered",
    color: "green",
    markerColor: "#16a34a",
    background: "#f0fdf4",
    icon: CheckCircle2,
  },

  failed: {
    label: "Failed",
    color: "red",
    markerColor: "#dc2626",
    background: "#fef2f2",
    icon: XCircle,
  },
};

/* =========================================================
   HELPERS
========================================================= */

const formatStatus = (status = "") => {
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
};

const getStatusMeta = (status) => {
  return (
    STATUS_META[status] || {
      label: formatStatus(status),
      color: "default",
      markerColor: "#64748b",
      background: "#f8fafc",
      icon: CircleAlert,
    }
  );
};

const getCoordinate = (row) => {
  const latitude =
    row.latitude ??
    row.lat ??
    row.rider_latitude ??
    row.rider_lat ??
    row.delivery_latitude ??
    row.location?.latitude;

  const longitude =
    row.longitude ??
    row.lng ??
    row.lon ??
    row.rider_longitude ??
    row.rider_lng ??
    row.delivery_longitude ??
    row.location?.longitude;

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

const getPickupCoord = (row) => {
  const latitude =
    row.restaurant_latitude ?? row.pickup_latitude ?? row.branch_latitude;
  const longitude =
    row.restaurant_longitude ?? row.pickup_longitude ?? row.branch_longitude;

  if (
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
  ) {
    return [Number(latitude), Number(longitude)];
  }

  return null;
};

const getDestinationCoord = (row) => {
  const latitude =
    row.destination_latitude ?? row.customer_latitude ?? row.dest_latitude;
  const longitude =
    row.destination_longitude ?? row.customer_longitude ?? row.dest_longitude;

  if (
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
  ) {
    return [Number(latitude), Number(longitude)];
  }

  return null;
};

const getMinutesElapsed = (value) => {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return 0;

  return Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
};

const formatElapsed = (value) => {
  const minutes = getMinutesElapsed(value);

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes}m`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const getEtaMinutes = (row) => {
  const eta = row?.eta;

  if (typeof eta === "number") {
    return eta;
  }

  if (typeof eta === "string") {
    const match = eta.match(/\d+/);

    if (match) {
      return Number(match[0]);
    }
  }

  if (row?.eta_minutes !== undefined) {
    return Number(row.eta_minutes);
  }

  return null;
};

const isDelayed = (row) => {
  if (row.assignment_status === "delivered") return false;
  if (row.assignment_status === "failed") return true;

  const eta = getEtaMinutes(row);

  if (eta !== null && eta <= 0) {
    return true;
  }

  return false;
};

const getGoogleMapsUrl = (delivery) => {
  const riderLat =
    delivery.latitude ??
    delivery.lat ??
    delivery.rider_latitude ??
    delivery.rider_lat;
  const riderLng =
    delivery.longitude ??
    delivery.lng ??
    delivery.lon ??
    delivery.rider_longitude ??
    delivery.rider_lng;

  const restLat = delivery.restaurant_latitude ?? delivery.pickup_latitude;
  const restLng = delivery.restaurant_longitude ?? delivery.pickup_longitude;

  const destLat =
    delivery.customer_latitude ??
    delivery.dest_latitude ??
    delivery.destination_latitude;
  const destLng =
    delivery.customer_longitude ??
    delivery.dest_longitude ??
    delivery.destination_longitude;

  const validCoord = (v) =>
    v !== undefined && v !== null && !Number.isNaN(Number(v));

  const hasRider = validCoord(riderLat) && validCoord(riderLng);
  const hasRest = validCoord(restLat) && validCoord(restLng);
  const hasDest = validCoord(destLat) && validCoord(destLng);

  const p = (lat, lng) => `${Number(lat)},${Number(lng)}`;

  if (hasRest && hasRider && hasDest) {
    return `https://www.google.com/maps/dir/${p(restLat, restLng)}/${p(riderLat, riderLng)}/${p(destLat, destLng)}`;
  }

  if (hasRider && hasDest) {
    return `https://www.google.com/maps/dir/${p(riderLat, riderLng)}/${p(destLat, destLng)}`;
  }

  if (hasRest && hasDest) {
    return `https://www.google.com/maps/dir/${p(restLat, restLng)}/${p(destLat, destLng)}`;
  }

  if (hasDest) {
    return `https://www.google.com/maps/search/?api=1&query=${p(destLat, destLng)}`;
  }

  return null;
};

/* =========================================================
   MAP HELPERS
========================================================= */

const MapRecenter = ({ position, bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 14), {
        duration: 0.7,
      });
    }
  }, [position, bounds, map]);

  return null;
};

/* =========================================================
   DELIVERY TIMELINE
========================================================= */

const createDivIcon = (html, size = 28) =>
  L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const RestaurantIcon = createDivIcon(
  `<div style="width:28px;height:28px;border-radius:50%;background:#f97316;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>`,
  28,
);

const CustomerIcon = createDivIcon(
  `<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
  28,
);

const RiderIcon = createDivIcon(
  `<div style="width:32px;height:32px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 10px rgba(37,99,235,.5);display:flex;align-items:center;justify-content:center;animation:pulse-ring 2s infinite"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3.5-3.5 2-3 2 3 3.5-3.5"/><path d="M12 17.5V14l-3.5-3.5 2-3 2 3 3.5-3.5"/></svg></div>`,
  32,
);

const DeliveryTimeline = ({ delivery }) => {
  const status = delivery?.assignment_status;

  const steps = [
    {
      key: "assigned",
      label: "Rider assigned",
      icon: UserRound,
      time: delivery?.assigned_at,
    },
    {
      key: "picked_up",
      label: "Picked up",
      icon: PackageCheck,
      time: delivery?.picked_up_at,
    },
    {
      key: "on_the_way",
      label: "On the way",
      icon: Navigation,
      time: delivery?.on_the_way_at,
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      time: delivery?.delivered_at,
    },
  ];

  const statusIndex =
    status === "assigned"
      ? 0
      : status === "picked_up"
        ? 1
        : status === "delivered"
          ? 3
          : status === "failed"
            ? 1
            : -1;

  const progressPercent =
    status === "failed"
      ? 50
      : Math.min(((statusIndex + 1) / steps.length) * 100, 100);

  const restaurantPos = delivery?.restaurant_latitude
    ? [
        Number(delivery.restaurant_latitude),
        Number(delivery.restaurant_longitude),
      ]
    : null;
  const riderPos = getCoordinate(delivery);
  const customerPos = getDestinationCoord(delivery) || riderPos;
  const miniMapCenter = riderPos || customerPos || DEFAULT_CENTER;

  const formatTime = (ts) => (ts ? dayjs(ts).format("HH:mm") : "--:--");

  return (
    <div style={{ marginTop: 14 }}>
      {/* PROGRESS BAR */}
      <div
        style={{
          marginBottom: 14,
          background: palette.border,
          height: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: status === "failed" ? palette.danger : palette.primary,
            width: `${progressPercent}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* MINI MAP */}
      <div
        style={{
          marginBottom: 14,
          border: `1px solid ${palette.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            background: palette.bgSubtle,
            borderBottom: `1px solid ${palette.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: palette.ink }}>
            Route Overview
          </span>
          {(delivery?.distance || delivery?.distance_km) && (
            <span style={{ fontSize: 10, color: palette.faint }}>
              {delivery.distance || delivery.distance_km} km
            </span>
          )}
        </div>

        <MapContainer
          center={miniMapCenter}
          zoom={14}
          scrollWheelZoom={false}
          dragging={true}
          zoomControl={false}
          style={{ width: "100%", height: 160 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {riderPos && (
            <Marker position={riderPos} icon={RiderIcon}>
              <Tooltip permanent direction="top" offset={[0, -18]} opacity={1}>
                <span
                  style={{ fontSize: 10, fontWeight: 700, color: palette.info }}
                >
                  Rider
                </span>
              </Tooltip>
            </Marker>
          )}
          {restaurantPos && (
            <Marker position={restaurantPos} icon={RestaurantIcon}>
              <Tooltip direction="top" offset={[0, -14]}>
                <span style={{ fontSize: 10 }}>Restaurant</span>
              </Tooltip>
            </Marker>
          )}
          {customerPos && (
            <Marker position={customerPos} icon={CustomerIcon}>
              <Tooltip direction="top" offset={[0, -14]}>
                <span style={{ fontSize: 10 }}>Customer</span>
              </Tooltip>
            </Marker>
          )}
          {riderPos && customerPos && (
            <Polyline
              positions={[riderPos, customerPos]}
              pathOptions={{
                color: palette.primary,
                weight: 3,
                opacity: 0.7,
                dashArray: "6 4",
              }}
            />
          )}
          {restaurantPos && riderPos && status !== "delivered" && (
            <Polyline
              positions={[restaurantPos, riderPos]}
              pathOptions={{
                color: palette.info,
                weight: 2,
                opacity: 0.5,
                dashArray: "4 4",
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* STEPS */}
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index <= statusIndex;
        const current = index === statusIndex;
        const completed = index < statusIndex;
        const failed = status === "failed" && index === statusIndex;

        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              gap: 10,
              paddingBottom: index === steps.length - 1 ? 0 : 4,
            }}
          >
            {/* Connector */}
            {index !== steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 28,
                  width: 1,
                  height: 20,
                  background: completed ? palette.primary : palette.border,
                }}
              />
            )}

            {/* Dot */}
            <div
              style={{
                width: 24,
                height: 24,
                minWidth: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active
                  ? failed
                    ? palette.danger
                    : palette.primary
                  : palette.bgSubtle,
                border: `1.5px solid ${active ? (failed ? palette.danger : palette.primary) : palette.border}`,
                color: active ? "#fff" : palette.faint,
                zIndex: 1,
              }}
            >
              <Icon size={12} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: current ? 600 : 500,
                    color: active ? palette.ink : palette.faint,
                  }}
                >
                  {step.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: palette.faint,
                    fontFamily: "monospace",
                  }}
                >
                  {formatTime(step.time)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* STATUS ALERTS */}
      {status === "failed" && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "#FEF2F2",
            border: `1px solid ${palette.danger}`,
            color: palette.danger,
            fontSize: 12,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <CircleAlert size={14} />
          <span style={{ fontWeight: 500 }}>
            Delivery failed — requires attention
          </span>
        </div>
      )}
      {status === "delivered" && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "#F0FDF4",
            border: `1px solid ${palette.success}`,
            color: palette.success,
            fontSize: 12,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <CheckCircle2 size={14} />
          <span style={{ fontWeight: 500 }}>
            Delivered
            {delivery?.delivered_at
              ? ` at ${dayjs(delivery.delivered_at).format("HH:mm")}`
              : ""}
          </span>
          {delivery?.proof_photo_url && (
            <a
              href={delivery.proof_photo_url}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: "auto", color: palette.success, fontWeight: 600 }}
            >
              View rider photo
            </a>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   DELIVERY TRACKING PAGE
========================================================= */

const DeliveryTrackingPage = () => {
  const [rows, setRows] = useState([]);

  const [stats, setStats] = useState({
    on_the_road: 0,
    waiting_for_rider: 0,
    delivered_today: 0,
    on_time_rate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const [trackingDelivery, setTrackingDelivery] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const [orderDetail, setOrderDetail] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const [, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadTracking = async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const response = await request(`deliveries/tracking?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setTotal(response.total || 0);

        // Keep the selected delivery live after auto-refreshes so the rider
        // marker and its route move as the rider moves.
        setSelectedDelivery((current) => {
          if (!current) return current;

          const fresh = response.data.find(
            (row) => row.assignment_id === current.assignment_id,
          );

          return fresh ? { ...current, ...fresh } : current;
        });

        setStats({
          on_the_road:
            response.stats?.on_the_road ??
            response.stats?.active_deliveries ??
            response.data.filter(
              (row) =>
                row.assignment_status === "assigned" ||
                row.assignment_status === "picked_up",
            ).length,

          waiting_for_rider:
            response.stats?.waiting_for_rider ??
            response.ready_orders?.length ??
            0,

          delivered_today:
            response.stats?.delivered_today ??
            response.data.filter((row) => row.assignment_status === "delivered")
              .length,

          on_time_rate: response.stats?.on_time_rate ?? 0,
        });
      } else {
        setError(response?.message || "Unable to load live delivery tracking.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load live delivery tracking.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Deferred so state updates happen outside of the effect body
    // (avoids synchronous setState within the effect).
    const timer = setTimeout(() => {
      loadTracking();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshKey, page, statusFilter, search, dateFrom, dateTo]);

  /* =======================================================
     SEARCH
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      loadTracking(true);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  /* =======================================================
     FILTER (server-side; this is just for local re-render)
  ======================================================= */

  const filteredRows = rows;

  /* =======================================================
     LIVE ROAD ROUTE (derived)
  ======================================================= */

  // Route info only applies to the currently selected delivery.
  const activeRoute =
    routeInfo &&
    selectedDelivery &&
    routeInfo.assignmentId === selectedDelivery.assignment_id
      ? routeInfo
      : null;

  const hasRouteWaypoints = useMemo(() => {
    if (!selectedDelivery) return false;

    return (
      [
        getCoordinate(selectedDelivery),
        getDestinationCoord(selectedDelivery),
      ].filter(Boolean).length >= 2
    );
  }, [selectedDelivery]);

  /* =======================================================
     DERIVED STATS
  ======================================================= */

  const delayedCount = useMemo(() => {
    return rows.filter(isDelayed).length;
  }, [rows]);

  const activeCount = useMemo(() => {
    return rows.filter(
      (row) =>
        row.assignment_status === "assigned" ||
        row.assignment_status === "picked_up",
    ).length;
  }, [rows]);

  const pickedUpCount = useMemo(() => {
    return rows.filter((row) => row.assignment_status === "picked_up").length;
  }, [rows]);

  /* =======================================================
     SELECT DELIVERY
  ======================================================= */

  // ─── Real road route (OSRM) for the selected delivery ───
  // All setState calls happen in async fetch callbacks so the selection
  // renders immediately while the route is being calculated.
  useEffect(() => {
    if (!selectedDelivery) return undefined;

    const riderPos = getCoordinate(selectedDelivery);
    const pickupPos = getPickupCoord(selectedDelivery);
    const destPos = getDestinationCoord(selectedDelivery);

    // Before pickup: rider → restaurant → customer. After pickup the rider
    // goes straight to the customer.
    const waypoints =
      selectedDelivery.assignment_status === "assigned" && pickupPos
        ? [riderPos, pickupPos, destPos]
        : [riderPos, destPos];

    const points = waypoints.filter(Boolean);
    if (points.length < 2) return undefined;

    const assignmentId = selectedDelivery.assignment_id;
    const controller = new AbortController();

    const coordString = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("routing unavailable");
        return response.json();
      })
      .then((data) => {
        const route = data?.routes?.[0];
        if (!route?.geometry?.coordinates?.length) {
          throw new Error("no route found");
        }
        setRouteInfo({
          assignmentId,
          coordinates: route.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]),
          distance: route.distance / 1000,
          duration: route.duration / 60,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setRouteInfo({ assignmentId, error: true });
      });

    return () => controller.abort();
  }, [selectedDelivery]);

  const openDelivery = async (delivery) => {
    setSelectedDelivery(delivery);
    setTrackingDelivery(null);
    setDrawerOpen(true);
    setOrderDetail(null);

    if (delivery?.order_id) {
      setOrderLoading(true);
      try {
        const [orderData, timelineData] = await Promise.all([
          request(`orders/${delivery.order_id}`, "GET"),
          request(`orders/${delivery.order_id}/timeline`, "GET"),
        ]);
        setOrderDetail({ ...orderData, timeline: timelineData });
      } catch {
        setOrderDetail(null);
      } finally {
        setOrderLoading(false);
      }
    }
  };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const updateDeliveryStatus = async (assignmentId, newStatus) => {
    setSubmitting(true);

    try {
      const response = await request(
        `deliveries/${assignmentId}/status`,
        "PATCH",
        {
          status: newStatus,
        },
      );

      if (response?.id) {
        message.success(`Delivery marked as ${formatStatus(newStatus)}.`);

        setDrawerOpen(false);
        setSelectedDelivery(null);

        setRefreshKey((key) => key + 1);
      } else {
        message.error(response?.message || "Failed to update delivery status.");
      }
    } catch (err) {
      message.error(err?.message || "Failed to update delivery status.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     UNASSIGN
  ======================================================= */

  const unassignDelivery = async (assignmentId) => {
    setSubmitting(true);

    try {
      const response = await request(`deliveries/${assignmentId}`, "DELETE");

      if (response?.message === "Delivery assignment deleted") {
        message.success("Rider unassigned.");

        setDrawerOpen(false);
        setSelectedDelivery(null);

        setRefreshKey((key) => key + 1);
      } else {
        message.error(response?.message || "Unable to unassign rider.");
      }
    } catch (err) {
      message.error(err?.message || "Unable to unassign rider.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     STATUS ACTIONS
  ======================================================= */

  const getNextStatus = (delivery) => {
    if (!delivery) return null;

    if (delivery.assignment_status === "assigned") {
      return "picked_up";
    }

    if (delivery.assignment_status === "picked_up") {
      return "delivered";
    }

    return null;
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter(undefined);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = Boolean(search || statusFilter || dateFrom || dateTo);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: palette.primary,
          colorText: palette.ink,
          colorTextSecondary: palette.muted,
          colorTextTertiary: palette.faint,
          colorBorder: palette.border,
          colorBgContainer: palette.bg,
          colorBgLayout: palette.bgSubtle,
          borderRadius: 2,
          controlHeight: 36,
          fontSize: 13,
        },

        components: {
          Card: {
            borderRadiusLG: 2,
          },

          Button: {
            borderRadius: 2,
            controlHeight: 36,
            fontWeight: 500,
          },

          Input: {
            borderRadius: 2,
            controlHeight: 36,
          },

          Drawer: {
            paddingLG: 20,
          },

          Table: {
            headerBg: palette.primary,
            headerColor: palette.inkInverse,
            headerBorderRadius: 0,
          },
        },
      }}
    >
      <div>
        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <ModulePage
          title="Delivery Tracking"
          description="Monitor live deliveries, rider locations, ETAs, and delivery exceptions."
          icon={MapPinned}
          stats={[
            {
              label: "On the road",
              value: stats.on_the_road || activeCount,
              icon: Navigation,
              iconBackground: "#eff6ff",
              description: "Assigned or picked up",
            },

            {
              label: "Picked up",
              value: pickedUpCount,
              icon: PackageCheck,
              iconBackground: "#fff7ed",
              description: "Orders being delivered",
            },

            {
              label: "Delayed",
              value: delayedCount,
              icon: CircleAlert,
              iconBackground: "#fef2f2",
              description: "Require attention",
            },

            {
              label: "Delivered today",
              value: stats.delivered_today || 0,
              icon: CheckCircle2,
              iconBackground: "#f0fdf4",
              description: "Successfully completed",
            },

            {
              label: "On-time rate",
              value: stats.on_time_rate ? `${stats.on_time_rate}%` : "0%",
              icon: Clock3,
              iconBackground: "#ecfdf5",
              description: "Within target ETA",
            },
          ]}
          loading={loading}
          error={error}
        />

        {/* ===================================================
            LIVE OPERATIONS HEADER
        =================================================== */}

        <Card
          style={{ marginTop: 14, overflow: "hidden" }}
          styles={{ body: { padding: 0 } }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: `1px solid ${palette.border}`,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: palette.fillActive,
                  color: palette.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Navigation size={15} />
              </div>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: palette.ink }}
                >
                  Live Operations
                </div>
                <div style={{ fontSize: 11, color: palette.muted }}>
                  Real-time delivery monitoring
                </div>
              </div>
              <Tag
                color="green"
                style={{ margin: 0, borderRadius: 2, fontSize: 11 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: palette.success,
                    marginRight: 4,
                  }}
                />
                LIVE
              </Tag>
            </div>

            <Space size={6}>
              <Button
                size="small"
                icon={<Crosshair size={14} />}
                onClick={() => {
                  if (selectedDelivery) {
                    const position = getCoordinate(selectedDelivery);
                    if (position) setSelectedDelivery({ ...selectedDelivery });
                  }
                }}
              >
                Locate
              </Button>
              <Button
                size="small"
                icon={<RefreshCw size={14} />}
                loading={refreshing}
                onClick={() => loadTracking(true)}
              >
                Refresh
              </Button>
            </Space>
          </div>

          {/* =================================================
              ROUTE FLOW BAR - BUSINESS FLOW
          ================================================= */}

          {selectedDelivery && (
            <div
              style={{
                padding: "8px 16px",
                background: palette.bgSubtle,
                borderBottom: `1px solid ${palette.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  overflow: "auto",
                }}
              >
                {/* Restaurant */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 8px",
                    borderRadius: 2,
                    background: palette.primaryLight,
                    border: `1px solid ${palette.primary}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: palette.primaryDark,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: palette.primary,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedDelivery.restaurant_name ||
                      selectedDelivery.restaurant ||
                      "Restaurant"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "0 4px",
                    color: palette.faint,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  &#8594;
                </div>

                {/* Rider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 8px",
                    borderRadius: 2,
                    background:
                      selectedDelivery.assignment_status === "picked_up"
                        ? "#EFF6FF"
                        : palette.bgSubtle,
                    border: `1px solid ${selectedDelivery.assignment_status === "picked_up" ? palette.info : palette.border}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      selectedDelivery.assignment_status === "picked_up"
                        ? palette.info
                        : palette.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        selectedDelivery.assignment_status === "picked_up"
                          ? palette.info
                          : palette.faint,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedDelivery.rider || "Unassigned"}
                  </span>
                  {getEtaMinutes(selectedDelivery) !== null && (
                    <span
                      style={{
                        fontSize: 9,
                        color: palette.faint,
                        marginLeft: 2,
                      }}
                    >
                      {getEtaMinutes(selectedDelivery)}m
                    </span>
                  )}
                </div>

                <div
                  style={{
                    padding: "0 4px",
                    color: palette.faint,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  &#8594;
                </div>

                {/* Customer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 8px",
                    borderRadius: 2,
                    background:
                      selectedDelivery.assignment_status === "delivered"
                        ? "#F0FDF4"
                        : palette.bgSubtle,
                    border: `1px solid ${selectedDelivery.assignment_status === "delivered" ? palette.success : palette.border}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      selectedDelivery.assignment_status === "delivered"
                        ? palette.success
                        : palette.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        selectedDelivery.assignment_status === "delivered"
                          ? palette.success
                          : palette.faint,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedDelivery.destination?.split(",")[0] || "Customer"}
                  </span>
                </div>

                {(() => {
                  const url = getGoogleMapsUrl(selectedDelivery);
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "4px 8px",
                        borderRadius: 2,
                        border: `1px solid ${palette.info}`,
                        background: "#EFF6FF",
                        color: palette.info,
                        fontSize: 10,
                        fontWeight: 600,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <ExternalLink size={11} />
                      Route
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* =================================================
              MAP + SIDE DELIVERY LIST
          ================================================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 380px",
              minHeight: 540,
            }}
          >
            {/* =================================================
                MAP
            ================================================= */}

            <div
              style={{
                position: "relative",
                minHeight: 540,
                background: "#eef2f7",
              }}
            >
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                scrollWheelZoom
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 540,
                  zIndex: 1,
                }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredRows.map((row) => {
                  const position = getCoordinate(row);

                  if (!position) {
                    return null;
                  }

                  const meta = getStatusMeta(row.assignment_status);

                  return (
                    <CircleMarker
                      key={row.assignment_id || row.key || row.id}
                      center={position}
                      radius={
                        selectedDelivery?.assignment_id === row.assignment_id
                          ? 12
                          : 9
                      }
                      pathOptions={{
                        color: "#ffffff",
                        weight: 3,
                        fillColor: isDelayed(row)
                          ? palette.danger
                          : meta.markerColor,
                        fillOpacity: 1,
                      }}
                      eventHandlers={{ click: () => openDelivery(row) }}
                    >
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            {row.order || "Delivery"}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: palette.muted,
                              marginBottom: 6,
                            }}
                          >
                            {row.rider || "Unassigned"}
                          </div>
                          <Tag color={meta.color} style={{ margin: 0 }}>
                            {meta.label}
                          </Tag>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {selectedDelivery &&
                  (() => {
                    const riderPos = getCoordinate(selectedDelivery);
                    const restaurantPos = getPickupCoord(selectedDelivery);
                    const destPos = getDestinationCoord(selectedDelivery);

                    const allPositions = [
                      restaurantPos,
                      riderPos,
                      destPos,
                    ].filter(Boolean);
                    const hasBounds = allPositions.length >= 2;

                    return (
                      <>
                        {hasBounds ? (
                          <MapRecenter
                            bounds={[
                              ...allPositions,
                              ...(activeRoute?.coordinates ?? []).filter(
                                (_, index) => index % 12 === 0,
                              ),
                            ]}
                          />
                        ) : riderPos ? (
                          <MapRecenter position={riderPos} />
                        ) : null}

                        {restaurantPos && (
                          <Marker
                            position={restaurantPos}
                            icon={RestaurantIcon}
                          >
                            <Popup>
                              <div style={{ minWidth: 160 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    marginBottom: 2,
                                    fontSize: 12,
                                  }}
                                >
                                  {selectedDelivery.restaurant_name ||
                                    selectedDelivery.restaurant ||
                                    "Restaurant"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: palette.muted,
                                    marginBottom: 6,
                                  }}
                                >
                                  {selectedDelivery.restaurant_address ||
                                    selectedDelivery.pickup_address ||
                                    "Pickup point"}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${restaurantPos[0]},${restaurantPos[1]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 11,
                                    color: palette.info,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    textDecoration: "none",
                                  }}
                                >
                                  <ExternalLink size={11} />
                                  Google Maps
                                </a>
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {riderPos && (
                          <Marker position={riderPos} icon={RiderIcon}>
                            <Popup>
                              <div style={{ minWidth: 160 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    marginBottom: 2,
                                    fontSize: 12,
                                  }}
                                >
                                  {selectedDelivery.rider || "Rider"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: palette.muted,
                                    marginBottom: 4,
                                  }}
                                >
                                  Current location
                                </div>
                                {getEtaMinutes(selectedDelivery) !== null && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: palette.primary,
                                      fontWeight: 600,
                                      marginBottom: 6,
                                    }}
                                  >
                                    ETA: {getEtaMinutes(selectedDelivery)} min
                                  </div>
                                )}
                                {selectedDelivery.rider_phone && (
                                  <a
                                    href={`tel:${selectedDelivery.rider_phone}`}
                                    style={{
                                      fontSize: 11,
                                      color: palette.success,
                                      fontWeight: 600,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                      textDecoration: "none",
                                    }}
                                  >
                                    <Phone size={11} />
                                    Call Rider
                                  </a>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {destPos && (
                          <Marker position={destPos} icon={CustomerIcon}>
                            <Popup>
                              <div style={{ minWidth: 160 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    marginBottom: 2,
                                    fontSize: 12,
                                  }}
                                >
                                  {selectedDelivery.customer_name || "Customer"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: palette.muted,
                                    marginBottom: 6,
                                  }}
                                >
                                  {selectedDelivery.destination ||
                                    "Destination"}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${destPos[0]},${destPos[1]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 11,
                                    color: palette.info,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    textDecoration: "none",
                                  }}
                                >
                                  <ExternalLink size={11} />
                                  Google Maps
                                </a>
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {/* ROAD ROUTE (OSRM) - real driving path */}
                        {activeRoute?.coordinates?.length > 0 && (
                          <Polyline
                            positions={activeRoute.coordinates}
                            pathOptions={{
                              color:
                                selectedDelivery.assignment_status ===
                                "delivered"
                                  ? "#16a34a"
                                  : selectedDelivery.assignment_status ===
                                      "picked_up"
                                    ? "#f97316"
                                    : selectedDelivery.assignment_status ===
                                        "failed"
                                      ? "#dc2626"
                                      : "#1677ff",
                              weight: 5,
                              opacity: 0.85,
                              lineCap: "round",
                              lineJoin: "round",
                            }}
                          />
                        )}

                        {/* Straight-line fallback (routing offline) */}
                        {!activeRoute?.coordinates &&
                          restaurantPos &&
                          riderPos && (
                            <Polyline
                              positions={[restaurantPos, riderPos]}
                              pathOptions={{
                                color: "#2563eb",
                                weight: 3,
                                opacity: 0.7,
                                dashArray: "6 4",
                                lineCap: "round",
                              }}
                            />
                          )}

                        {!activeRoute?.coordinates && riderPos && destPos && (
                          <Polyline
                            positions={[riderPos, destPos]}
                            pathOptions={{
                              color: "#f97316",
                              weight: 4,
                              opacity: 0.85,
                              dashArray: "10 6",
                              lineCap: "round",
                            }}
                          />
                        )}

                        {!activeRoute?.coordinates &&
                          restaurantPos &&
                          destPos && (
                            <Polyline
                              positions={[restaurantPos, destPos]}
                              pathOptions={{
                                color: "#94a3b8",
                                weight: 4,
                                opacity: 0.5,
                                dashArray: "4 8",
                                lineCap: "round",
                              }}
                            />
                          )}
                      </>
                    );
                  })()}
              </MapContainer>

              {/* ROAD ROUTE INFO STRIP */}
              {selectedDelivery && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    zIndex: 500,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: "8px 12px",
                    borderRadius: 2,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    maxWidth: 250,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      color: palette.faint,
                    }}
                  >
                    ROAD ROUTE (LIVE)
                  </span>
                  {activeRoute?.error ? (
                    <span style={{ fontSize: 11, color: palette.warning }}>
                      Routing offline — straight line shown
                    </span>
                  ) : activeRoute ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: palette.ink,
                      }}
                    >
                      🛣 {activeRoute.distance.toFixed(1)} km · ~
                      {Math.round(activeRoute.duration)} min
                    </span>
                  ) : hasRouteWaypoints ? (
                    <span style={{ fontSize: 11, color: palette.muted }}>
                      Calculating road route…
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: palette.muted }}>
                      No GPS coordinates for this delivery
                    </span>
                  )}
                </div>
              )}

              {/* DELIVERY PROCESS OVERLAY */}

              {(selectedDelivery || trackingDelivery) &&
                (() => {
                  const d = selectedDelivery || trackingDelivery;
                  if (!d) return null;

                  const status = d.assignment_status;
                  const stepIndex =
                    status === "assigned"
                      ? 0
                      : status === "picked_up"
                        ? 1
                        : status === "delivered"
                          ? 3
                          : status === "failed"
                            ? 1
                            : -1;

                  const restName =
                    d.restaurant_name || d.restaurant || "Restaurant";
                  const riderName = d.rider || "Unassigned";
                  const custName =
                    d.customer_name ||
                    d.destination?.split(",")[0] ||
                    "Customer";
                  const orderNum = d.order || "-";

                  return (
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        zIndex: 500,
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        padding: "12px 14px",
                        minWidth: 200,
                        maxWidth: 240,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: palette.ink,
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Order {orderNum}</span>
                        <Tag
                          color={
                            status === "delivered"
                              ? "green"
                              : status === "picked_up"
                                ? "orange"
                                : status === "failed"
                                  ? "red"
                                  : "blue"
                          }
                          style={{ margin: 0, fontSize: 10 }}
                        >
                          {formatStatus(status)}
                        </Tag>
                      </div>

                      {/* Process Steps */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0,
                        }}
                      >
                        {[
                          {
                            label: restName,
                            sub: "Pickup",
                            active: true,
                            color: palette.primary,
                            done: stepIndex >= 1,
                          },
                          {
                            label: riderName,
                            sub: "Rider",
                            active: stepIndex >= 1,
                            color: palette.info,
                            done: stepIndex >= 2,
                          },
                          {
                            label: custName,
                            sub: "Deliver",
                            active: stepIndex >= 2,
                            color: palette.success,
                            done: stepIndex >= 3,
                          },
                        ].map((s, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: 18,
                              }}
                            >
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: s.done
                                    ? s.color
                                    : s.active
                                      ? palette.bg
                                      : palette.border,
                                  border: `2px solid ${s.done ? s.color : s.active ? s.color : palette.border}`,
                                  flexShrink: 0,
                                }}
                              />
                              {i < 2 && (
                                <div
                                  style={{
                                    width: 1,
                                    height: 16,
                                    background: s.done
                                      ? s.color
                                      : palette.border,
                                  }}
                                />
                              )}
                            </div>
                            <div
                              style={{
                                paddingBottom: i < 2 ? 4 : 0,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: s.done || s.active ? 600 : 500,
                                  color:
                                    s.done || s.active
                                      ? palette.ink
                                      : palette.faint,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {s.label}
                              </div>
                              <div
                                style={{ fontSize: 9, color: palette.faint }}
                              >
                                {s.sub}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Google Maps Link */}
                      {(() => {
                        const url = getGoogleMapsUrl(d);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginTop: 10,
                              padding: "6px 0",
                              borderTop: `1px solid ${palette.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              color: palette.info,
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={12} />
                            Open in Google Maps
                          </a>
                        ) : null;
                      })()}
                    </div>
                  );
                })()}

              {/* MAP LEGEND */}

              <div
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  zIndex: 500,
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: palette.muted,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Markers
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {[
                    [palette.primary, "Restaurant"],
                    [palette.info, "Rider"],
                    [palette.success, "Customer"],
                    [palette.danger, "Delayed"],
                  ].map(([color, label]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        color: palette.muted,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      {label}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 5,
                    paddingTop: 4,
                    borderTop: `1px solid ${palette.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 9,
                    color: palette.faint,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 2,
                      borderTop: `1px dashed ${palette.primary}`,
                    }}
                  />
                  Route path
                </div>
              </div>

              {/* MAP INFO */}

              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  zIndex: 500,
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  padding: "7px 10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: palette.success,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: palette.ink,
                    }}
                  >
                    {filteredRows.length} deliveries visible
                  </span>
                </div>
                <div
                  style={{ fontSize: 10, color: palette.faint, marginTop: 2 }}
                >
                  Updates every 30s
                </div>
              </div>
            </div>

            {/* =================================================
                ACTIVE DELIVERY LIST
            ================================================= */}

            <div
              style={{
                borderLeft: `1px solid ${palette.border}`,
                background: palette.bg,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              {/* LIST HEADER */}
              <div
                style={{
                  padding: "12px 14px 10px",
                  borderBottom: `1px solid ${palette.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: palette.ink,
                    }}
                  >
                    Active Deliveries
                  </div>
                  <Tag style={{ margin: 0 }}>{filteredRows.length}</Tag>
                </div>

                {/* STATUS TABS */}
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[
                    { value: undefined, label: "All", count: rows.length },
                    {
                      value: "assigned",
                      label: "Assigned",
                      count: rows.filter(
                        (r) => r.assignment_status === "assigned",
                      ).length,
                    },
                    {
                      value: "picked_up",
                      label: "On Way",
                      count: rows.filter(
                        (r) => r.assignment_status === "picked_up",
                      ).length,
                    },
                    {
                      value: "delivered",
                      label: "Delivered",
                      count: rows.filter(
                        (r) => r.assignment_status === "delivered",
                      ).length,
                    },
                    {
                      value: "failed",
                      label: "Failed",
                      count: rows.filter(
                        (r) => r.assignment_status === "failed",
                      ).length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => setStatusFilter(tab.value)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 2,
                        border: `1px solid ${statusFilter === tab.value ? palette.primary : palette.border}`,
                        background:
                          statusFilter === tab.value
                            ? palette.fillActive
                            : palette.bg,
                        color:
                          statusFilter === tab.value
                            ? palette.primary
                            : palette.muted,
                        fontSize: 10,
                        fontWeight: statusFilter === tab.value ? 600 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {tab.label}
                      <span
                        style={{
                          fontSize: 9,
                          borderRadius: 8,
                          padding: "0 4px",
                          background:
                            statusFilter === tab.value
                              ? palette.primary
                              : palette.border,
                          color:
                            statusFilter === tab.value ? "#fff" : palette.muted,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <Input
                  size="small"
                  prefix={<Search size={13} color={palette.faint} />}
                  allowClear
                  placeholder="Search delivery, rider, or address..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />

                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    style={{
                      flex: 1,
                      padding: "2px 6px",
                      fontSize: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      color: palette.ink,
                      background: palette.bg,
                      height: 26,
                    }}
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    style={{
                      flex: 1,
                      padding: "2px 6px",
                      fontSize: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      color: palette.ink,
                      background: palette.bg,
                      height: 26,
                    }}
                  />
                </div>

                {hasFilters && (
                  <Button
                    type="link"
                    size="small"
                    onClick={clearFilters}
                    style={{
                      padding: 0,
                      marginTop: 4,
                      height: "auto",
                      color: palette.primary,
                      fontSize: 11,
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {/* DELIVERY LIST */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 520 }}>
                {filteredRows.length === 0 ? (
                  <div style={{ padding: 40 }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No active deliveries"
                    />
                  </div>
                ) : (
                  filteredRows.map((row) => {
                    const meta = getStatusMeta(row.assignment_status);
                    const selected =
                      selectedDelivery?.assignment_id === row.assignment_id;
                    const delayed = isDelayed(row);
                    const stepIndex =
                      row.assignment_status === "assigned"
                        ? 0
                        : row.assignment_status === "picked_up"
                          ? 1
                          : row.assignment_status === "delivered"
                            ? 2
                            : -1;

                    return (
                      <div
                        key={row.assignment_id || row.key || row.id}
                        onClick={() => openDelivery(row)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: `1px solid ${palette.border}`,
                          cursor: "pointer",
                          background: selected
                            ? palette.fillActive
                            : palette.bg,
                          borderLeft: selected
                            ? `3px solid ${palette.primary}`
                            : "3px solid transparent",
                        }}
                      >
                        {/* TOP: Order + Status */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: palette.ink,
                                }}
                              >
                                {row.order || "-"}
                              </span>
                              {delayed && (
                                <Tooltip title="Delayed">
                                  <CircleAlert
                                    size={13}
                                    color={palette.danger}
                                  />
                                </Tooltip>
                              )}
                            </div>
                            <div
                              style={{
                                marginTop: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                color: palette.muted,
                                fontSize: 10,
                              }}
                            >
                              <UserRound size={10} />
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.rider || "Unassigned"}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 3,
                            }}
                          >
                            <Tag
                              color={meta.color}
                              style={{ margin: 0, fontSize: 10 }}
                            >
                              {meta.label}
                            </Tag>
                            <span
                              style={{
                                fontSize: 9,
                                color: delayed ? palette.danger : palette.faint,
                                fontWeight: 500,
                              }}
                            >
                              {formatElapsed(row.assigned_at)}
                            </span>
                          </div>
                        </div>

                        {/* ROUTE FLOW */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 8,
                            padding: "5px 7px",
                            background: palette.bgSubtle,
                            border: `1px solid ${palette.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: palette.primary,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              height: 1,
                              flex: 1,
                              background:
                                stepIndex >= 1
                                  ? palette.primary
                                  : palette.border,
                            }}
                          />
                          <div
                            style={{
                              width: stepIndex >= 1 ? 9 : 7,
                              height: stepIndex >= 1 ? 9 : 7,
                              borderRadius: "50%",
                              background:
                                stepIndex >= 1 ? palette.info : palette.border,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              height: 1,
                              flex: 1,
                              background:
                                stepIndex >= 2
                                  ? palette.success
                                  : palette.border,
                            }}
                          />
                          <div
                            style={{
                              width: stepIndex >= 2 ? 9 : 7,
                              height: stepIndex >= 2 ? 9 : 7,
                              borderRadius: "50%",
                              background:
                                stepIndex >= 2
                                  ? palette.success
                                  : palette.border,
                              flexShrink: 0,
                            }}
                          />
                        </div>

                        {/* BOTTOM: Destination + Actions */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              color: palette.muted,
                              fontSize: 10,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <MapPin
                              size={11}
                              color={palette.primary}
                              style={{ flexShrink: 0, marginTop: 1 }}
                            />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.destination || "Destination unavailable"}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexShrink: 0,
                              marginLeft: 5,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: delayed ? palette.danger : palette.faint,
                              }}
                            >
                              ETA{" "}
                              {getEtaMinutes(row) !== null
                                ? `${getEtaMinutes(row)}m`
                                : row.eta || "-"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDelivery(row);
                                setTrackingDelivery(row);
                                setDrawerOpen(false);
                              }}
                              style={{
                                padding: "2px 6px",
                                borderRadius: 2,
                                border: `1px solid ${palette.border}`,
                                background: palette.bg,
                                color: palette.info,
                                fontSize: 9,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Navigation size={9} />
                              Track
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ===================================================
            OPERATIONS SUMMARY
        =================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          <Card size="small">
            <Statistic
              title="Active deliveries"
              value={activeCount}
              prefix={<Navigation size={16} color={palette.primary} />}
              valueStyle={{ fontSize: 20, fontWeight: 700 }}
            />
            <div style={{ fontSize: 10, color: palette.muted, marginTop: 2 }}>
              Currently being delivered
            </div>
          </Card>

          <Card size="small">
            <Statistic
              title="Picked up"
              value={pickedUpCount}
              prefix={<PackageCheck size={16} color={palette.primary} />}
              valueStyle={{ fontSize: 20, fontWeight: 700 }}
            />
            <div style={{ fontSize: 10, color: palette.muted, marginTop: 2 }}>
              Orders on the way
            </div>
          </Card>

          <Card size="small">
            <Statistic
              title="Delayed"
              value={delayedCount}
              prefix={<CircleAlert size={16} color={palette.danger} />}
              valueStyle={{
                fontSize: 20,
                fontWeight: 700,
                color: delayedCount > 0 ? palette.danger : palette.ink,
              }}
            />
            <div style={{ fontSize: 10, color: palette.muted, marginTop: 2 }}>
              Need attention
            </div>
          </Card>

          <Card size="small">
            <Statistic
              title="Completed today"
              value={stats.delivered_today || 0}
              prefix={<CheckCircle2 size={16} color={palette.success} />}
              valueStyle={{ fontSize: 20, fontWeight: 700 }}
            />
            <div style={{ fontSize: 10, color: palette.muted, marginTop: 2 }}>
              Successfully delivered
            </div>
          </Card>
        </div>

        {/* ===================================================
            DELIVERY DETAILS DRAWER
        =================================================== */}

        <Drawer
          title={null}
          placement="right"
          size={430}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedDelivery(null);
            setOrderDetail(null);
          }}
          styles={{ body: { padding: 0 } }}
        >
          {selectedDelivery && (
            <div>
              {/* DRAWER HEADER */}
              <div
                style={{
                  padding: "16px 20px 14px",
                  borderBottom: `1px solid ${palette.border}`,
                  background: isDelayed(selectedDelivery)
                    ? "#FEF2F2"
                    : palette.bg,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: palette.ink,
                      }}
                    >
                      {selectedDelivery.order || "Delivery"}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 10,
                        color: palette.faint,
                      }}
                    >
                      Assignment #{selectedDelivery.assignment_id || "-"}
                    </div>
                  </div>
                  <Tag
                    color={
                      getStatusMeta(selectedDelivery.assignment_status).color
                    }
                    style={{ margin: 0 }}
                  >
                    {formatStatus(selectedDelivery.assignment_status)}
                  </Tag>
                </div>

                {isDelayed(selectedDelivery) && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "7px 10px",
                      background: "#FEF2F2",
                      border: `1px solid ${palette.danger}`,
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      color: palette.danger,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <CircleAlert size={14} />
                    Delivery requires attention
                  </div>
                )}
              </div>

              {/* METRICS */}
              <div
                style={{
                  padding: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 6,
                }}
              >
                {[
                  {
                    label: "ETA",
                    value:
                      getEtaMinutes(selectedDelivery) !== null
                        ? `${getEtaMinutes(selectedDelivery)} min`
                        : selectedDelivery.eta || "-",
                    danger: isDelayed(selectedDelivery),
                  },
                  {
                    label: "ELAPSED",
                    value: formatElapsed(selectedDelivery.assigned_at),
                  },
                  {
                    label: "DISTANCE",
                    value: activeRoute?.distance
                      ? `${activeRoute.distance.toFixed(1)} km (road, ~${Math.round(activeRoute.duration)} min)`
                      : selectedDelivery.distance || selectedDelivery.distance_km
                        ? `${selectedDelivery.distance || selectedDelivery.distance_km} km`
                        : "-",
                  },
                  {
                    label: "SPEED",
                    value: selectedDelivery.speed
                      ? `${selectedDelivery.speed} km/h`
                      : selectedDelivery.distance &&
                          getMinutesElapsed(selectedDelivery.assigned_at) > 0
                        ? `${((Number(selectedDelivery.distance || selectedDelivery.distance_km) / getMinutesElapsed(selectedDelivery.assigned_at)) * 60).toFixed(1)} km/h`
                        : "-",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: item.danger ? "#FEF2F2" : palette.bgSubtle,
                      padding: 9,
                      border: item.danger
                        ? `1px solid ${palette.danger}`
                        : `1px solid ${palette.border}`,
                    }}
                  >
                    <div
                      style={{
                        color: palette.faint,
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 15,
                        fontWeight: 700,
                        color: item.danger ? palette.danger : palette.ink,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIDER + ORDER + DESTINATION */}
              <div style={{ padding: "0 14px" }}>
                <div style={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                  {/* RIDER */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderBottom: `1px solid ${palette.border}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 2, background: "#EFF6FF", color: palette.info, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bike size={17} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: palette.faint, fontWeight: 600, textTransform: "uppercase" }}>Rider</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.ink, marginTop: 1 }}>{selectedDelivery.rider || "Unknown"}</div>
                      {selectedDelivery.rider_phone && (
                        <div style={{ fontSize: 10, color: palette.muted, marginTop: 1, fontFamily: "monospace" }}>{selectedDelivery.rider_phone}</div>
                      )}
                    </div>
                    <Space size={4}>
                      <Tooltip title="Call rider">
                        <Button size="small" shape="circle" icon={<Phone size={13} />} style={{ borderColor: palette.success, color: palette.success }} />
                      </Tooltip>
                    </Space>
                  </div>

                  {/* RIDER DETAILS from API */}
                  {!orderLoading && orderDetail?.deliveryAssignment?.rider && (() => {
                    const r = orderDetail.deliveryAssignment.rider;
                    return (
                      <div style={{ padding: "8px 13px", borderBottom: `1px solid ${palette.border}`, background: palette.bgSubtle, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, color: palette.muted }}>
                        {r.vehicle_type && <div><span style={{ color: palette.faint }}>Vehicle:</span> <span style={{ fontWeight: 600, color: palette.ink, textTransform: "capitalize" }}>{r.vehicle_type}</span></div>}
                        {r.license_plate && <div><span style={{ color: palette.faint }}>Plate:</span> <span style={{ fontWeight: 600, color: palette.ink, fontFamily: "monospace" }}>{r.license_plate}</span></div>}
                        {r.rating != null && <div><span style={{ color: palette.faint }}>Rating:</span> <span style={{ fontWeight: 600, color: palette.ink }}>{Number(r.rating).toFixed(1)}/5</span></div>}
                        {r.total_trips != null && <div><span style={{ color: palette.faint }}>Trips:</span> <span style={{ fontWeight: 600, color: palette.ink }}>{r.total_trips}</span></div>}
                      </div>
                    );
                  })()}

                  {/* ORDER */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderBottom: `1px solid ${palette.border}`, background: palette.bgSubtle }}>
                    <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 2, background: "#EFF6FF", color: palette.info, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PackageCheck size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: palette.faint, fontWeight: 600 }}>Order</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: palette.ink, marginTop: 1 }}>{selectedDelivery.order || "-"}</div>
                    </div>
                    {selectedDelivery.order_total && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: palette.success }}>{formatMoney(Number(selectedDelivery.order_total))}</div>
                    )}
                  </div>

                  {/* DESTINATION */}
                  <div style={{ display: "flex", gap: 10, padding: "11px 13px" }}>
                    <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 2, background: palette.fillActive, color: palette.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MapPin size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: palette.faint, fontWeight: 600 }}>Destination</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: palette.ink, marginTop: 1, lineHeight: 1.4 }}>
                        {selectedDelivery.destination || "Unavailable"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              {!orderLoading && orderDetail?.customer && (
                <div style={{ padding: "10px 14px 0" }}>
                  <div style={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "8px 13px", background: palette.bgSubtle }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase", marginBottom: 4 }}>Customer</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: palette.ink }}>{orderDetail.customer.name || "Unknown"}</div>
                      {orderDetail.customer.phone && <div style={{ fontSize: 10, color: palette.muted, marginTop: 1, fontFamily: "monospace" }}>{orderDetail.customer.phone}</div>}
                      {orderDetail.customer.email && <div style={{ fontSize: 10, color: palette.muted, marginTop: 1 }}>{orderDetail.customer.email}</div>}
                    </div>
                    {orderDetail.customer_notes && (
                      <div style={{ padding: "8px 13px", borderTop: `1px solid ${palette.border}` }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase", marginBottom: 2 }}>Customer Notes</div>
                        <div style={{ fontSize: 11, color: palette.ink, lineHeight: 1.4, fontStyle: "italic" }}>"{orderDetail.customer_notes}"</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ORDER ITEMS */}
              {!orderLoading && orderDetail?.items?.length > 0 && (
                <div style={{ padding: "10px 14px 0" }}>
                  <div style={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "7px 13px", background: palette.bgSubtle, borderBottom: `1px solid ${palette.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase" }}>Items ({orderDetail.items.length})</div>
                    </div>
                    {orderDetail.items.map((item, idx) => (
                      <div key={item.id || idx} style={{ padding: "7px 13px", borderBottom: idx < orderDetail.items.length - 1 ? `1px solid ${palette.border}` : "none", display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: palette.ink }}>
                            {item.quantity}x {item.item_name || item.menuItem?.name || "Item"}
                          </div>
                          {item.selected_modifiers && (() => {
                            try {
                              const mods = typeof item.selected_modifiers === "string" ? JSON.parse(item.selected_modifiers) : item.selected_modifiers;
                              if (Array.isArray(mods) && mods.length > 0) {
                                return <div style={{ fontSize: 9, color: palette.faint, marginTop: 1 }}>{mods.map((m) => `${m.modifier || m.name || ""}${m.price ? ` (+${formatMoney(m.price)})` : ""}`).join(", ")}</div>;
                              }
                            } catch { return null; }
                            return null;
                          })()}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: palette.ink, whiteSpace: "nowrap" }}>
                          {formatMoney(Number(item.subtotal || item.unit_price * item.quantity))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAYMENT INFO */}
              {!orderLoading && orderDetail && (
                <div style={{ padding: "10px 14px 0" }}>
                  <div style={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "7px 13px", background: palette.bgSubtle, borderBottom: `1px solid ${palette.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase" }}>Payment</div>
                    </div>
                    <div style={{ padding: "8px 13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: palette.muted }}>Subtotal</span>
                        <span style={{ fontWeight: 600, color: palette.ink }}>{formatMoney(Number(orderDetail.subtotal || 0))}</span>
                      </div>
                      {Number(orderDetail.delivery_fee || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: palette.muted }}>Delivery fee</span>
                          <span style={{ fontWeight: 600, color: palette.ink }}>{formatMoney(Number(orderDetail.delivery_fee))}</span>
                        </div>
                      )}
                      {Number(orderDetail.surge_fee || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: palette.muted }}>Surge</span>
                          <span style={{ fontWeight: 600, color: palette.warning }}>{formatMoney(Number(orderDetail.surge_fee))}</span>
                        </div>
                      )}
                      {Number(orderDetail.discount || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: palette.muted }}>Discount</span>
                          <span style={{ fontWeight: 600, color: palette.success }}>-{formatMoney(Number(orderDetail.discount))}</span>
                        </div>
                      )}
                      {Number(orderDetail.tax || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: palette.muted }}>Tax</span>
                          <span style={{ fontWeight: 600, color: palette.ink }}>{formatMoney(Number(orderDetail.tax))}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: palette.ink, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${palette.border}` }}>
                        <span>Total</span>
                        <span>{formatMoney(Number(orderDetail.total || 0))}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5, fontSize: 10 }}>
                        <span style={{ color: palette.muted }}>Method: <span style={{ fontWeight: 600, color: palette.ink, textTransform: "capitalize" }}>{orderDetail.payment_method || "-"}</span></span>
                        <Tag color={orderDetail.is_paid ? "green" : "orange"} style={{ margin: 0, fontSize: 9 }}>{orderDetail.is_paid ? "Paid" : "Unpaid"}</Tag>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDER TIMELINE */}
              {!orderLoading && orderDetail?.timeline && (
                <div style={{ padding: "10px 14px 0" }}>
                  <div style={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "7px 13px", background: palette.bgSubtle, borderBottom: `1px solid ${palette.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase" }}>Order Timeline</div>
                    </div>
                    <div style={{ padding: "8px 13px" }}>
                      {[
                        { label: "Created", time: orderDetail.timeline.created_at, color: palette.faint },
                        { label: "Accepted", time: orderDetail.timeline.accepted_at, color: palette.info },
                        { label: "Preparing", time: orderDetail.timeline.preparing_at, color: palette.primary },
                        { label: "Ready", time: orderDetail.timeline.ready_at, color: palette.warning },
                        { label: "Dispatched", time: orderDetail.timeline.dispatched_at, color: palette.info },
                        { label: "Delivered", time: orderDetail.timeline.delivered_at, color: palette.success },
                      ].filter((s) => s.time).map((step, idx, arr) => (
                        <div key={step.label} style={{ display: "flex", gap: 8, paddingBottom: idx < arr.length - 1 ? 5 : 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: step.color, flexShrink: 0 }} />
                            {idx < arr.length - 1 && <div style={{ width: 1, flex: 1, background: palette.border, marginTop: 2 }} />}
                          </div>
                          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: palette.ink }}>{step.label}</span>
                            <span style={{ fontSize: 10, color: palette.faint, fontFamily: "monospace" }}>{dayjs(step.time).format("DD MMM, HH:mm")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state for order detail */}
              {orderLoading && (
                <div style={{ padding: "10px 14px 0" }}>
                  <div style={{ padding: 10, background: palette.bgSubtle, border: `1px solid ${palette.border}`, fontSize: 11, color: palette.faint, textAlign: "center" }}>
                    Loading order details...
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              <div style={{ padding: "14px 14px 0" }}>
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: palette.ink }}
                >
                  Delivery progress
                </div>
                <DeliveryTimeline delivery={selectedDelivery} />
              </div>

              {/* ACTIONS */}
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderTop: `1px solid ${palette.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: palette.muted,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Quick Actions
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                  }}
                >
                  {getNextStatus(selectedDelivery) && (
                    <Button
                      type="primary"
                      icon={
                        selectedDelivery.assignment_status === "assigned" ? (
                          <PackageCheck size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )
                      }
                      loading={submitting}
                      onClick={() =>
                        updateDeliveryStatus(
                          selectedDelivery.assignment_id,
                          getNextStatus(selectedDelivery),
                        )
                      }
                    >
                      {selectedDelivery.assignment_status === "assigned"
                        ? "Mark picked up"
                        : "Mark delivered"}
                    </Button>
                  )}

                  {selectedDelivery.assignment_status === "picked_up" && (
                    <Button
                      danger
                      icon={<XCircle size={14} />}
                      loading={submitting}
                      onClick={() =>
                        updateDeliveryStatus(
                          selectedDelivery.assignment_id,
                          "failed",
                        )
                      }
                    >
                      Mark failed
                    </Button>
                  )}

                  <Button
                    icon={<MapPinned size={14} />}
                    onClick={() => {
                      setDrawerOpen(false);
                      setTrackingDelivery(selectedDelivery);
                      const pos = getCoordinate(selectedDelivery);
                      if (pos) setSelectedDelivery({ ...selectedDelivery });
                    }}
                  >
                    Track Process
                  </Button>

                  {(() => {
                    const url = getGoogleMapsUrl(selectedDelivery);
                    return url ? (
                      <Button
                        icon={<ExternalLink size={14} />}
                        onClick={() => window.open(url, "_blank")}
                      >
                        Open Route
                      </Button>
                    ) : null;
                  })()}

                  <Button
                    icon={<MapPinned size={14} />}
                    onClick={() => {
                      setDrawerOpen(false);
                      const pos = getCoordinate(selectedDelivery);
                      if (pos) setSelectedDelivery({ ...selectedDelivery });
                    }}
                  >
                    View on Map
                  </Button>

                  {selectedDelivery.assignment_status !== "delivered" && (
                    <Button
                      danger
                      icon={<Ellipsis size={14} />}
                      loading={submitting}
                      onClick={() =>
                        unassignDelivery(selectedDelivery.assignment_id)
                      }
                    >
                      Unassign rider
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
};

export default DeliveryTrackingPage;
