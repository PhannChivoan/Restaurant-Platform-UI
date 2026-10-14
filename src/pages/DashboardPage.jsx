import { useEffect, useState } from "react";
import { Alert, Card, Col, Empty, Progress, Row, Skeleton, Space, Statistic, Table, Tag, Typography } from "antd";
import { Activity, Bike, ChefHat, CircleDollarSign, ShoppingBag, Store, TimerReset } from "lucide-react";

import { palette } from "../constants/theme";
import { request } from "../utils/request";

const { Text, Title } = Typography;

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const Bars = ({ items, valueOf, labelOf, color = palette.primary, format = (v) => v }) => {
  const max = Math.max(...items.map(valueOf), 1);
  return (
    <div style={{ height: 190, display: "flex", alignItems: "end", gap: 8, padding: "16px 4px 4px", overflowX: "auto" }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex: 1, minWidth: 22, height: "100%", display: "flex", flexDirection: "column", justifyContent: "end", gap: 6 }}>
          <Text style={{ textAlign: "center", fontSize: 11 }}>{valueOf(item) ? format(valueOf(item)) : ""}</Text>
          <div style={{ height: `${(valueOf(item) / max) * 120}px`, minHeight: 4, background: valueOf(item) ? color : palette.border, borderRadius: "5px 5px 2px 2px", transition: "height .3s" }} />
          <Text type="secondary" style={{ textAlign: "center", fontSize: 11 }}>{labelOf(item)}</Text>
        </div>
      ))}
    </div>
  );
};

// Operations overview: every number comes from the server (scoped to what this role may see) and refreshes every 30 s.
const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () =>
      request("dashboard/overview", "GET").then((res) => {
        if (!alive) return;
        if (res?.kpis) {
          setData(res);
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

  const columns = [
    { title: "Order", dataIndex: "order", key: "order", render: (v) => <Text strong>{v}</Text> },
    { title: "Restaurant", dataIndex: "restaurant", key: "restaurant" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: money },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={(STATUS[s] ?? [s, "default"])[1]}>{(STATUS[s] ?? [s])[0]}</Tag> },
    { title: "Placed", dataIndex: "at", key: "at", render: (t) => new Date(t).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) },
  ];

  const statusEntries = Object.entries(statusToday ?? {});
  const statusTotal = statusEntries.reduce((s, [, n]) => s + n, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Space align="center" size={10}>
          <Activity size={22} color={palette.primary} strokeWidth={1.8} />
          <Title level={3} style={{ margin: 0 }}>Operations overview</Title>
        </Space>
        <br />
        <Text type="secondary">Live restaurant, kitchen and delivery activity. Refreshes every 30 seconds.</Text>
      </div>

      {error && <Alert type="warning" showIcon title={`${error} Showing the last data we received.`} />}

      <Row gutter={[16, 16]}>
        {metrics.map((m) => (
          <Col key={m.label} xs={24} sm={12} lg={6}>
            <Card variant="outlined">
              <Space align="start" size={12}>
                <m.icon size={20} color={m.color} strokeWidth={1.8} />
                <Statistic title={m.label} value={m.value} suffix={m.suffix} styles={{ content: { color: palette.ink, fontSize: 24 } }} />
              </Space>
              <div><Text style={{ color: m.note.color, fontSize: 12 }}>{m.note.text}</Text></div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="Order volume" extra={<Text type="secondary">Today, by hour</Text>} variant="outlined">
            <Bars items={hours} valueOf={(h) => h.value} labelOf={(h) => hourLabel(h.hour)} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="Live health" variant="outlined">
            <Space orientation="vertical" size={18} style={{ width: "100%" }}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Last 7 days" extra={<Text type="secondary">Revenue</Text>} variant="outlined">
            <Bars items={daily} valueOf={(d) => d.revenue} labelOf={(d) => dayLabel(d.date)} color={palette.success} format={(v) => `$${Math.round(v)}`} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top restaurants" extra={<Text type="secondary">Last 7 days</Text>} variant="outlined">
            {top.length === 0 ? (
              <Empty description="No orders yet" />
            ) : (
              <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                {top.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Text type="secondary" style={{ width: 16 }}>{i + 1}</Text>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <Text strong ellipsis>{r.name}</Text>
                        <Text strong>{money(r.revenue)}</Text>
                      </div>
                      <Progress percent={Math.round((Number(r.revenue) / Number(top[0].revenue)) * 100)} showInfo={false} size="small" strokeColor={palette.primary} railColor={palette.fillHover} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.orders} order{r.orders === 1 ? "" : "s"}</Text>
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Orders today by status" variant="outlined">
            {statusTotal === 0 ? (
              <Empty description="No orders today" />
            ) : (
              <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                {statusEntries.map(([s, n]) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Tag color={(STATUS[s] ?? [s, "default"])[1]} style={{ minWidth: 84, textAlign: "center", margin: 0 }}>{(STATUS[s] ?? [s])[0]}</Tag>
                    <Progress percent={Math.round((n / statusTotal) * 100)} size="small" format={() => n} style={{ flex: 1, margin: 0 }} strokeColor={palette.primary} railColor={palette.fillHover} />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Recent orders" extra={<Text type="secondary">Latest {recent.length}</Text>} variant="outlined">
            <Table columns={columns} dataSource={recent} pagination={false} rowKey="id" size="small" scroll={{ x: "max-content" }} locale={{ emptyText: "No orders yet" }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;