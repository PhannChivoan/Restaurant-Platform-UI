import { formatMoney } from "../utils/platformSettings";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Card, Col, Empty, Progress, Row, Segmented, Skeleton, Space, Tag, Typography } from "antd";
import { LayoutDashboard, Bike, ChefHat, CircleDollarSign, ShoppingBag, Store, TimerReset, TrendingUp, ArrowRight, Sparkles, Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { getProfile } from "../store/access_token";

import { palette, isDark } from "../constants/theme";
import { request } from "../utils/request";

const { Text, Title } = Typography;

const money = (n) => formatMoney(n);
const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;
const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString([], { weekday: "short" });

const STATUS = {
  pending: ["Pending", "gold"],
  accepted: ["Accepted", "blue"],
  preparing: ["Preparing", "orange"],
  ready: ["Ready", "cyan"],
  dispatched: ["On the way", "geekblue"],
  delivered: ["Delivered", "green"],
  cancelled: ["Cancelled", "red"],
  rejected: ["Rejected", "red"],
};

const change = (pct) => {
  if (pct === null || pct === undefined) return { text: "vs yesterday: no data", color: palette.faint };
  return { text: `${pct > 0 ? "+" : ""}${pct}% vs yesterday`, color: pct >= 0 ? palette.success : palette.danger };
};

const HealthMetric = ({ icon: Icon, label, value, detail, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 8, background: `${color}18`, color, flexShrink: 0 }}>
      <Icon size={18} strokeWidth={1.8} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Text strong>{value}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{detail}</Text>
      </div>
    </div>
  </div>
);

const AreaTrend = ({ items, valueOf, labelOf, color = palette.primary, format = (v) => v, id }) => {
  const rows = items.map((item) => ({ label: labelOf(item), value: Number(valueOf(item)) || 0 }));
  return (
    <div style={{ position: "relative", flex: 1, minHeight: 260 }}>
      <div style={{ position: "absolute", inset: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={palette.border} strokeDasharray="3 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: palette.muted }} />
          <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} tick={{ fontSize: 12, fill: palette.muted }} tickFormatter={format} />
          <RTooltip
            formatter={(v) => [format(v), ""]}
            separator=""
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(15, 23, 42,.16)", fontSize: 13, background: palette.bg, color: palette.ink }}
            labelStyle={{ color: palette.muted }}
            itemStyle={{ color: palette.ink }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#${id})`} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: palette.bg }} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

const initials = (name) => String(name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const AVATAR_COLORS = [palette.primary, "#7C3AED", "#16A34A", "#F59E0B", "#EF4444", "#0EA5E9"];

const RANK_COLORS = ["#F59E0B", "#94A3B8", "#F97316"];

// Operations overview: every number comes from the server (scoped to what this role may see) and refreshes every 30 s.
const DashboardPage = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState("day");
  const [now, setNow] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () =>
      request("dashboard/overview", "GET").then((res) => {
        if (!alive) return;
        if (res?.kpis) {
          setData(res);
          setNow(Date.now());
          setError("");
        } else setError(res?.message || "Unable to load the dashboard.");
      });
    load();
    const poll = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Operations overview</Title>
        {error ? <Alert type="error" showIcon title={error} /> : <Skeleton active paragraph={{ rows: 8 }} />}
      </div>
    );
  }

  const { kpis, health, hourly, daily, status_today: statusToday, top_restaurants: top, recent_orders: recent } = data;

  // hours shown: from the first busy hour (or 8am) to now
  const nowHour = new Date().getHours();
  const firstBusy = hourly.find((h) => h.value > 0)?.hour ?? 8;
  const hours = hourly.filter((h) => h.hour >= Math.min(firstBusy, 8) && h.hour <= Math.max(nowHour, 12));

  const orders = change(kpis.orders_change);
  const revenue = change(kpis.revenue_change);

  const metrics = [
    { label: "Orders today", value: kpis.orders_today, note: orders, icon: ShoppingBag, color: palette.primary },
    { label: "Gross revenue", value: money(kpis.revenue_today), note: revenue, icon: CircleDollarSign, color: palette.success },
    { label: "Active deliveries", value: kpis.active_deliveries, note: { text: kpis.late_deliveries ? `${kpis.late_deliveries} running late` : "All on time", color: kpis.late_deliveries ? palette.danger : palette.success }, icon: Bike, color: palette.info },
    { label: "Avg. delivery", value: kpis.avg_delivery_minutes ?? "–", suffix: kpis.avg_delivery_minutes ? "min" : undefined, note: { text: "last 7 days", color: palette.faint }, icon: TimerReset, color: palette.warning },
  ];

  const statusEntries = Object.entries(statusToday ?? {});
  const statusTotal = statusEntries.reduce((s, [, n]) => s + n, 0);
  const ago = (t) => {
    const m = Math.max(0, Math.floor((now - new Date(t).getTime()) / 60000));
    return m < 1 ? "just now" : m < 60 ? `${m} mins ago` : m < 1440 ? `${Math.floor(m / 60)} hrs ago` : `${Math.floor(m / 1440)} days ago`;
  };
  const cardStyle = { height: "100%", borderRadius: 12 };
  const headTitle = (icon, text, color = palette.primary) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 700 }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", background: `${color}18`, color }}>{icon}</span>
      {text}
    </div>
  );
  const link = (text, to) => (
    <button type="button" className="view-all-btn" onClick={() => navigate(to)}>
      {text} <ArrowRight size={14} />
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back, ${getProfile()?.name || "Admin"}! 👋`}
        description="Here's what's happening with your food ordering platform today. Live data, refreshed every 30 seconds."
      />

      {error && <Alert type="warning" showIcon title={`${error} Showing the last data we received.`} />}

      {/* KPI */}
      <Row gutter={[16, 16]}>
        {metrics.map((m) => (
          <Col key={m.label} xs={24} sm={12} xl={6}>
            <StatCard icon={m.icon} label={m.label} value={m.value} suffix={m.suffix} description={m.note.text} descriptionColor={m.note.color} color={m.color} />
          </Col>
        ))}
      </Row>

      {/* sales + recent */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card variant="outlined" style={{ ...cardStyle, display: "flex", flexDirection: "column" }} styles={{ body: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 } }} title={headTitle(<TrendingUp size={18} />, "Sales Overview")}
            extra={<Segmented value={range} onChange={setRange} options={[{ label: "Today", value: "day" }, { label: "7 Days", value: "week" }]} />}>
            {range === "day" ? (
              <AreaTrend id="gHours" items={hours} valueOf={(h) => h.value} labelOf={(h) => hourLabel(h.hour)} />
            ) : (
              <AreaTrend id="gDays" items={daily} valueOf={(d) => d.revenue} labelOf={(d) => dayLabel(d.date)} format={(v) => formatMoney(Math.round(v))} />
            )}
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>{range === "day" ? "Orders per hour today" : "Revenue per day, last 7 days"}</Text>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card variant="outlined" style={cardStyle} title={headTitle(<ShoppingBag size={18} />, "Recent Orders", "#7C3AED")} extra={link("View All", "/orders")}>
            {recent.length === 0 ? <Empty description="No orders yet" /> : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recent.slice(0, 6).map((o, i) => {
                  const [label, color] = STATUS[o.status] ?? [o.status, "default"];
                  return (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${palette.border}` : "none" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${AVATAR_COLORS[i % 6]}1A`, color: AVATAR_COLORS[i % 6], display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 700, fontSize: 14 }}>{initials(o.restaurant)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: "block" }}>{o.order}</Text>
                        <Text type="secondary" ellipsis style={{ fontSize: 12, display: "block" }}>{o.restaurant}</Text>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Text strong style={{ display: "block" }}>{money(o.amount)}</Text>
                        <Tag color={color} style={{ margin: 0 }}>{label}</Tag>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>{ago(o.at)}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* top restaurants + health */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card variant="outlined" style={cardStyle} title={headTitle(<Store size={18} />, "Top Restaurants")} extra={link("View All", "/restaurants")}>
            {top.length === 0 ? <Empty description="No orders yet" /> : (
              <Row gutter={[16, 16]}>
                {top.slice(0, 3).map((r, i) => (
                  <Col key={r.id} xs={24} md={8}>
                    <div style={{ textAlign: "center", padding: 16, borderRadius: 12, background: palette.bgSubtle, border: `1px solid ${palette.border}` }}>
                      <span style={{ float: "left", width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", background: RANK_COLORS[i], color: "#fff", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                      <div style={{ width: 64, height: 64, margin: "0 auto 10px", borderRadius: "50%", display: "grid", placeItems: "center", background: palette.bg, boxShadow: "0 6px 16px rgba(15, 23, 42,.15)", fontSize: 22, fontWeight: 800, color: AVATAR_COLORS[i % 6] }}>{initials(r.name)}</div>
                      <Text strong ellipsis style={{ display: "block" }}>{r.name}</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>{r.orders} order{r.orders === 1 ? "" : "s"} · {money(r.revenue)}</Text>
                      <Progress percent={Math.round((Number(r.revenue) / Number(top[0].revenue)) * 100)} showInfo={false} size="small" strokeColor={[palette.warning, palette.primary, "#7C3AED"][i]} railColor={palette.border} />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card variant="outlined" style={cardStyle} title={headTitle(<Sparkles size={18} />, "Live Health", palette.success)}>
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <HealthMetric icon={ChefHat} label="Kitchen queue" value={`${health.kitchen_queue} order${health.kitchen_queue === 1 ? "" : "s"}`} detail={`${health.urgent_orders} urgent`} color={palette.primary} />
              <HealthMetric icon={Bike} label="Rider availability" value={`${health.riders_online} online`} detail={`${health.riders_active} on a delivery`} color={palette.info} />
              <HealthMetric icon={Store} label="Restaurant partners" value={`${health.restaurants_active} active`} detail={`${health.restaurants_pending} pending`} color={palette.success} />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Delivered within 45 min (7 days)</Text>
                  <Text strong>{health.on_time_rate === null ? "–" : `${health.on_time_rate}%`}</Text>
                </div>
                <Progress percent={health.on_time_rate ?? 0} showInfo={false} strokeColor={palette.success} railColor={palette.fillHover} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* status + promo */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card variant="outlined" style={cardStyle} title={headTitle(<Activity size={18} />, "Orders Today by Status", palette.warning)}>
            {statusTotal === 0 ? <Empty description="No orders today" /> : (
              <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                {statusEntries.map(([st, n]) => (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Tag color={(STATUS[st] ?? [st, "default"])[1]} style={{ minWidth: 84, textAlign: "center", margin: 0 }}>{(STATUS[st] ?? [st])[0]}</Tag>
                    <Progress percent={Math.round((n / statusTotal) * 100)} size="small" format={() => n} style={{ flex: 1, margin: 0 }} strokeColor={palette.primary} railColor={palette.fillHover} />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: "100%",
              minHeight: 190,
              borderRadius: 12,
              padding: "28px 32px",
              color: "#fff",
              background: isDark
                ? "linear-gradient(120deg, #1E3A8A 0%, #2563EB 100%)"
                : `linear-gradient(120deg, ${palette.primaryDark} 0%, ${palette.primary} 100%)`,
              boxShadow: `0 12px 28px ${palette.primary}40`,
            }}
          >
            {/* soft background shapes */}
            <div aria-hidden style={{ position: "absolute", right: -70, top: -90, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
            <div aria-hidden style={{ position: "absolute", right: 150, bottom: -110, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />

            {/* growth chart illustration */}
            <svg aria-hidden viewBox="0 0 220 150" style={{ position: "absolute", right: 24, bottom: 0, width: 230, maxWidth: "42%", height: "auto" }}>
              <rect x="14" y="98" width="30" height="52" rx="7" fill="#fff" fillOpacity=".28" />
              <rect x="58" y="76" width="30" height="74" rx="7" fill="#fff" fillOpacity=".4" />
              <rect x="102" y="52" width="30" height="98" rx="7" fill="#fff" fillOpacity=".55" />
              <rect x="146" y="24" width="30" height="126" rx="7" fill="#fff" fillOpacity=".9" />
              <path d="M18 82 L70 58 L112 38 L186 8" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M166 6 L190 6 L186 30" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div style={{ position: "relative", maxWidth: "56%", minWidth: 220 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,.18)", fontSize: 12, fontWeight: 600 }}>
                <TrendingUp size={14} /> Platform tools
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "12px 0 6px", lineHeight: 1.2 }}>Grow Your Business</div>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 18 }}>Manage your restaurants, orders and customers all in one place.</div>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                style={{ border: 0, cursor: "pointer", padding: "10px 20px", borderRadius: 999, background: "#fff", color: isDark ? "#1E3A8A" : palette.primaryDark, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 16px rgba(0,0,0,.15)" }}
              >
                Go to Settings <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
