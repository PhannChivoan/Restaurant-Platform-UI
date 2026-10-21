import { formatMoney } from "../utils/platformSettings";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Empty, Image, Row, Space, Statistic, Switch, Tabs, Tag, Typography, message } from "antd";
import { Bike, CheckCircle2, ClipboardList, MapPin, Navigation, Phone, Store, Wallet } from "lucide-react";

import { palette } from "../constants/theme";
import { request } from "../utils/request";
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

// "My Deliveries": the driver's page inside the admin dashboard. Which roles can see it is decided
// by the super admin in Roles & Permissions (module access), like every other module.
const DriverPage = () => {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("active");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notDriver, setNotDriver] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [camFor, setCamFor] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [gpsError, setGpsError] = useState("");

  const load = useCallback(async () => {
    const [m, d] = await Promise.all([request("rider/me", "GET"), request(`rider/deliveries?scope=${tab}`, "GET")]);
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
            <Title level={3} style={{ margin: 0 }}>My Deliveries</Title>
          </Space>
          <Paragraph style={{ color: palette.muted, margin: "8px 0 0" }}>
            Orders assigned to you, your live route, and your earnings. Take a photo at hand-over to complete a delivery.
          </Paragraph>
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

      <Tabs
        activeKey={tab}
        onChange={(k) => {
          setRows(null);
          setTab(k);
        }}
        items={[
          { key: "active", label: <Badge count={stats?.to_deliver ?? 0} offset={[10, 0]} color={palette.primary}>To deliver</Badge> },
          { key: "completed", label: "Completed" },
        ]}
      />

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

      {rows === null && !error && <Card loading variant="outlined" style={{ borderRadius: 2 }} />}
      {rows?.length === 0 && (
        <Card variant="outlined" style={{ borderRadius: 2 }}>
          <Empty description={tab === "active" ? "No deliveries assigned yet. New orders appear here automatically." : "No completed deliveries yet."} />
        </Card>
      )}

      {rows?.map((d) => {
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