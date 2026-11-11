import { formatMoney } from "../utils/platformSettings";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, Image, Row, Space, Statistic, Switch, Tag, Tooltip, Typography, message } from "antd";
import { Bike, CheckCircle2, ClipboardList, Crosshair, MapPin, Navigation, Phone, Store, Wallet } from "lucide-react";

import { palette } from "../constants/theme";
import { request } from "../utils/request";
import Loader from "../components/ui/Loader";
import DriverCamera from "./driver/DriverCamera";
import RiderMap from "./driver/RiderMap";
import { googleMapsUrl, hasPoint } from "./driver/mapUtils";
import "./material-symbols.css";

const { Paragraph, Text, Title } = Typography;

const money = (n) => formatMoney(n);
const time = (iso) => (iso ? new Date(iso).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

const STATUS = {
  assigned: { label: "Go to restaurant", color: "default" },
  picked_up: { label: "On the way", color: "orange" },
  delivered: { label: "Delivered", color: "green" },
};

// an open order shaped like a delivery, so the same map can draw it (restaurant, customer and the route)
const asDelivery = (o) => ({ id: o.id, status: "assigned", pickup: o.pickup, dropoff: o.dropoff, order: o.order });

const SECTIONS = {
  active: { title: "To deliver", description: "Orders assigned to you, your live route and navigation. Take a photo at hand-over to complete a delivery." },
  available: { title: "Available orders", description: "Orders the kitchens opened to drivers. Accept one to make it yours: your position, the restaurant and the customer are on the map." },
  completed: { title: "Completed", description: "Your finished deliveries, with the photo you took at hand-over and what you earned." },
};

// "My Deliveries": the driver's pages inside the admin dashboard, one page per section (To deliver, Available
// orders, Completed). Which roles can see them is decided by the super admin in Permission Policies, like every module.
const DriverPage = ({ section = "active" }) => {
  const navigate = useNavigate();
  const tab = section;
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notDriver, setNotDriver] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [camFor, setCamFor] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [avail, setAvail] = useState(null); // orders the kitchens opened to drivers
  const [availMeta, setAvailMeta] = useState(null);
  const [focusAvailId, setFocusAvailId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const load = useCallback(async () => {
    const [m, d] = await Promise.all([
      request("rider/me", "GET"),
      tab === "available" ? Promise.resolve({ data: [] }) : request(`rider/deliveries?scope=${tab}`, "GET"),
    ]);
    if (m?.stats) {
      setMe(m);
      setRows(d?.data ?? []);
      setError("");
      setNotDriver(false);
    } else if (m?.message?.toLowerCase().includes("not a rider")) {
      setNotDriver(true);
      setRows([]);
    } else {
      setError(m?.message || "Unable to load your deliveries.");
    }
  }, [tab]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const poll = setInterval(load, 20000); // new assignments appear on their own
    return () => {
      clearTimeout(first);
      clearInterval(poll);
    };
  }, [load]);

  // Orders open to drivers: refreshed often, so one taken by another driver disappears quickly. The position goes
  // along so each order shows how far it is from the driver.
  const loadAvailable = useCallback(async () => {
    const q = myPos ? `?lat=${myPos.lat}&lng=${myPos.lng}` : "";
    const res = await request(`rider/available-orders${q}`, "GET", undefined, { fresh: true });
    if (Array.isArray(res?.data)) {
      setAvail(res.data);
      setAvailMeta(res.meta ?? null);
    }
  }, [myPos]);

  useEffect(() => {
    if (notDriver || tab !== "available") return undefined;
    const first = setTimeout(loadAvailable, 0);
    const poll = setInterval(loadAvailable, 10000);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
    };
  }, [loadAvailable, notDriver, tab]);

  // Follow the GPS: drives the map and is reported to dispatch every ~15 s.
  useEffect(() => {
    if (notDriver || !navigator.geolocation) return;
    let lastSent = 0;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMyPos(pos);
        setGpsError("");
        if (Date.now() - lastSent > 15000) {
          lastSent = Date.now();
          request("rider/location", "POST", pos);
        }
      },
      () => setGpsError("Location is off. Allow location access to see your position and live route."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [notDriver]);

  const focus = tab === "active" ? (rows?.find((d) => d.id === focusId) ?? rows?.[0] ?? null) : null;
  const availFocus = tab === "available" ? (avail?.find((o) => o.id === focusAvailId) ?? avail?.[0] ?? null) : null;

  const accept = async (o) => {
    setAcceptingId(o.id);
    const res = await request(`rider/available-orders/${o.id}/accept`, "POST");
    setAcceptingId(null);
    if (res?.status === "accepted") {
      message.success(`Order ${o.order.number} is yours`);
      navigate("/driver"); // the order is now one of my deliveries
    } else {
      message.error(res?.message || "Couldn't accept this order.");
      loadAvailable();
    }
  };

  const toggleOnline = async (checked) => {
    const res = await request("rider/online", "PATCH", { online: checked });
    if (res?.is_online !== undefined) setMe((m) => ({ ...m, is_online: res.is_online }));
    else message.error(res?.message || "Couldn't change your status.");
  };

  const pickup = async (d) => {
    setBusyId(d.id);
    const res = await request(`rider/deliveries/${d.id}/pickup`, "POST");
    setBusyId(null);
    if (res?.status === "picked_up") {
      message.success("Marked as picked up");
      load();
    } else message.error(res?.message || "Couldn't update the delivery.");
  };

  const complete = async (file) => {
    const fd = new FormData();
    fd.append("photo", file);
    setBusyId(camFor.id);
    const res = await request(`rider/deliveries/${camFor.id}/complete`, "POST", fd);
    setBusyId(null);
    if (res?.status === "delivered") {
      message.success(`Order ${camFor.order.number} delivered`);
      setCamFor(null);
      load();
    } else message.error(res?.message || "Couldn't complete the delivery.");
  };

  if (notDriver) {
    return (
      <Card variant="outlined" style={{ borderRadius: 2 }}>
        <Empty
          image={<Bike size={48} color={palette.faint} />}
          description="This account has no driver profile. Driver accounts are created from the Driver registration page."
        />
      </Card>
    );
  }

  const stats = me?.stats;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Space align="center" size={10}>
            <Bike size={22} color={palette.primary} strokeWidth={1.8} />
            <Title level={3} style={{ margin: 0 }}>{SECTIONS[section].title}</Title>
          </Space>
          <Paragraph style={{ color: palette.muted, margin: "8px 0 0" }}>{SECTIONS[section].description}</Paragraph>
        </div>
        <Space>
          <Text type="secondary">{me ? `${me.name} · ${me.vehicle_type}` : ""}</Text>
          <Switch checked={Boolean(me?.is_online)} onChange={toggleOnline} checkedChildren="Online" unCheckedChildren="Offline" disabled={!me} />
        </Space>
      </div>

      {error && <Alert type="error" showIcon title={error} />}

      <Row gutter={[12, 12]}>
        {[
          ["To deliver", stats?.to_deliver, ClipboardList, null],
          ["Delivered today", stats?.delivered_today, CheckCircle2, null],
          ["Earned today", stats && money(stats.earnings_today), Wallet, null],
          [`Total income (${stats?.delivered_total ?? 0} trips)`, stats && money(stats.earnings_total), Wallet, null],
        ].map(([label, value, Icon]) => (
          <Col key={label} xs={12} md={6}>
            <Card variant="outlined" style={{ borderRadius: 2 }}>
              <Statistic title={label} value={value ?? "–"} prefix={<Icon size={16} color={palette.primary} />} />
            </Card>
          </Col>
        ))}
      </Row>


      {tab === "active" && rows?.length > 0 && (
        <Card variant="outlined" style={{ borderRadius: 2 }} styles={{ body: { padding: 0 } }}>
          <div style={{ height: 340 }}>
            <RiderMap me={myPos} deliveries={rows} focus={focus} onRoute={setRouteInfo} />
          </div>
          <div style={{ padding: "8px 14px", fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Text>
              Route for <b>{focus?.order.number}</b> {focus?.status === "assigned" ? "(restaurant → customer)" : "(to customer)"}
            </Text>
            {routeInfo && !routeInfo.fallback && <Text strong>{routeInfo.km.toFixed(1)} km · about {routeInfo.min} min</Text>}
            {routeInfo?.fallback && <Text type="secondary">Straight-line guide (no road route found)</Text>}
            {focus && !hasPoint(focus.dropoff) && <Text type="danger">Customer did not pin a map location.</Text>}
            {gpsError && <Text type="danger">{gpsError}</Text>}
          </div>
        </Card>
      )}

      {tab === "available" && (
        <>
          {avail?.length > 0 && (
            <Card variant="outlined" styles={{ body: { padding: 0 } }}>
              <div style={{ height: 340 }}>
                <RiderMap me={myPos} deliveries={avail.map(asDelivery)} focus={availFocus ? asDelivery(availFocus) : null} onRoute={setRouteInfo} />
              </div>
              <div style={{ padding: "10px 14px", fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Crosshair size={14} color="#2563eb" /> {myPos ? `You: ${myPos.lat.toFixed(4)}, ${myPos.lng.toFixed(4)}` : "Your location is not available"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={14} color="#1d4ed8" /> Restaurant</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="#16a34a" /> Customer</span>
                {availFocus && <Text>Route for <b>{availFocus.order.number}</b> (you → restaurant → customer)</Text>}
                {routeInfo && !routeInfo.fallback && <Text strong>{routeInfo.km.toFixed(1)} km · about {routeInfo.min} min</Text>}
                {routeInfo?.fallback && <Text type="secondary">Straight-line guide (no road route found)</Text>}
                {gpsError && <Text type="danger">{gpsError}</Text>}
              </div>
            </Card>
          )}

          {avail === null && !error && (
            <Card variant="outlined"><Loader label="Looking for open orders…" minHeight={260} /></Card>
          )}
          {avail?.length === 0 && (
            <Card variant="outlined">
              <Empty description="No orders are open to drivers right now. When a kitchen opens one, it appears here." />
            </Card>
          )}
          {availMeta && !availMeta.online && avail?.length > 0 && (
            <Alert type="warning" showIcon title="You are offline" description="Switch to Online (top right) to accept an order." />
          )}

          {avail?.map((o) => {
            const full = availMeta && availMeta.active >= availMeta.max_active;
            const blocked = !o.can_accept || full || (availMeta && !availMeta.online);
            const why = !o.can_accept ? "The kitchen is still preparing this order. You can accept it once it is ready." : full ? `You already carry ${availMeta.max_active} deliveries.` : !availMeta?.online ? "Go online first." : "";
            return (
              <Card
                key={o.id}
                variant="outlined"
                hoverable
                onClick={() => setFocusAvailId(o.id)}
                style={{ borderColor: availFocus?.id === o.id ? palette.primary : undefined }}
                title={<Space><Text strong>{o.order.number}</Text><Tag color={o.can_accept ? "green" : "gold"}>{o.can_accept ? "Ready for pickup" : "Being prepared"}</Tag></Space>}
                extra={<Text strong style={{ color: palette.success }}>+{money(o.earnings)}</Text>}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="start"><Store size={16} color={palette.primary} /><div><Text strong>{o.pickup.restaurant}</Text>{o.pickup.branch && <Text type="secondary"> · {o.pickup.branch}</Text>}<br /><Text type="secondary">{o.pickup.address}</Text></div></Space>
                  <Space align="start"><MapPin size={16} color={palette.primary} /><div><Text strong>Deliver to</Text><br /><Text type="secondary">{o.dropoff.label ? `${o.dropoff.label}: ` : ""}{o.dropoff.address || "No address provided"}</Text>{o.dropoff.details && <><br /><Text>Unit: {o.dropoff.details}</Text></>}</div></Space>
                  <Space size={8} wrap>
                    <Tag icon={<Crosshair size={11} style={{ marginRight: 4, verticalAlign: -1 }} />}>{o.to_pickup_km !== null ? `${o.to_pickup_km} km from you` : "Distance unknown"}</Tag>
                    <Tag>{o.trip_km !== null ? `Trip ${o.trip_km} km` : "Trip distance unknown"}</Tag>
                    <Tag>{o.order.payment_method === "cash" && !o.order.is_paid ? `Collect cash ${money(o.order.total)}` : "Already paid"}</Tag>
                  </Space>
                  <Text type="secondary">{o.order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</Text>
                  <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{o.opened_at ? `Opened ${time(o.opened_at)}` : ""}</Text>
                    <Tooltip title={why}>
                      <Button type="primary" icon={<Bike size={14} />} disabled={blocked} loading={acceptingId === o.id} onClick={() => accept(o)}>Accept order</Button>
                    </Tooltip>
                  </div>
                </Space>
              </Card>
            );
          })}
        </>
      )}

      {tab !== "available" && rows === null && !error && (
        <Card variant="outlined">
          <Loader label="Loading your deliveries…" minHeight={260} />
        </Card>
      )}
      {tab !== "available" && rows?.length === 0 && (
        <Card variant="outlined" style={{ borderRadius: 2 }}>
          <Empty description={tab === "active" ? "No deliveries assigned yet. New orders appear here automatically." : "No completed deliveries yet."} />
        </Card>
      )}

      {tab !== "available" && rows?.map((d) => {
        const st = STATUS[d.status] ?? { label: d.status, color: "default" };
        const nav = d.status !== "delivered" ? googleMapsUrl(d, myPos) : null;
        return (
          <Card
            key={d.id}
            variant="outlined"
            hoverable
            onClick={() => setFocusId(d.id)}
            style={{ borderRadius: 2, borderColor: tab === "active" && focus?.id === d.id ? palette.primary : undefined }}
            title={<Space><Text strong>{d.order.number}</Text><Tag color={st.color}>{st.label}</Tag></Space>}
            extra={d.status === "delivered" ? <Text strong style={{ color: palette.success }}>+{money(d.earnings)}</Text> : <Text strong>{money(d.order.total)}</Text>}
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space align="start"><Store size={16} color={palette.primary} /><div><Text strong>{d.pickup.restaurant}</Text><br /><Text type="secondary">{d.pickup.address}</Text></div></Space>
              <Space align="start">
                <MapPin size={16} color={palette.primary} />
                <div>
                  <Text strong>{d.dropoff.customer}</Text>
                  {d.dropoff.phone && <a href={`tel:${d.dropoff.phone}`} style={{ marginLeft: 8 }}><Phone size={12} /> {d.dropoff.phone}</a>}
                  <br />
                  <Text type="secondary">{d.dropoff.label ? `${d.dropoff.label}: ` : ""}{d.dropoff.address || "No address provided"}</Text>
                  {d.dropoff.details && <><br /><Text strong>Unit: {d.dropoff.details}</Text></>}
                  {d.order.notes && <><br /><Text italic type="secondary">“{d.order.notes}”</Text></>}
                </div>
              </Space>
              <Text type="secondary">{d.order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</Text>

              <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                {d.status === "delivered" ? (
                  <>
                    <Text type="secondary">{time(d.delivered_at)}</Text>
                    {d.proof_photo_url && <Image src={d.proof_photo_url} alt="Delivery proof" width={48} height={48} style={{ objectFit: "cover", borderRadius: 2 }} />}
                  </>
                ) : (
                  <>
                    <Space>
                      <Text strong>{d.order.payment_method === "cash" && !d.order.is_paid ? `Collect cash ${money(d.order.total)}` : "Already paid"}</Text>
                      {nav && <Button href={nav} target="_blank" rel="noreferrer" icon={<Navigation size={14} />}>Navigate</Button>}
                    </Space>
                    {d.status === "assigned" ? (
                      <Button type="primary" loading={busyId === d.id} onClick={() => pickup(d)}>Mark picked up</Button>
                    ) : (
                      <Button type="primary" icon={<Bike size={14} />} onClick={() => setCamFor(d)}>Complete delivery</Button>
                    )}
                  </>
                )}
              </div>
            </Space>
          </Card>
        );
      })}

      <DriverCamera
        open={Boolean(camFor)}
        title={camFor ? `Complete ${camFor.order.number}` : ""}
        confirming={busyId === camFor?.id}
        onClose={() => setCamFor(null)}
        onConfirm={complete}
      />
    </div>
  );
};

export default DriverPage;