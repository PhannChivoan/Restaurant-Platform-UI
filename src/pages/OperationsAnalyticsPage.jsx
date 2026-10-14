import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import {
  BarChart3,
  Bike,
  ChartNoAxesCombined,
  Clock3,
  Coins,
  Crown,
  Download,
  Percent,
  RefreshCw,
  RotateCcw,
  Star,
  Store,
} from "lucide-react";
import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = [
  palette.primary,
  palette.info,
  palette.success,
  palette.warning,
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

const tooltipStyle = {
  contentStyle: {
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 4,
    fontSize: 12,
  },
  cursor: { fill: palette.fillHover },
};

const DATE_PRESETS = [
  { label: "Today", value: [dayjs(), dayjs()] },
  { label: "Yesterday", value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")] },
  { label: "Last 7 days", value: [dayjs().subtract(7, "day"), dayjs()] },
  { label: "Last 30 days", value: [dayjs().subtract(30, "day"), dayjs()] },
  { label: "This month", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
  { label: "Last month", value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const buildRestaurantCols = (totalRevenue) => [
  { title: "Restaurant", dataIndex: "restaurant", key: "restaurant" },
  {
    title: "Revenue",
    dataIndex: "gross_revenue",
    key: "gross_revenue",
    align: "right",
    render: (v) => <Text strong>{formatCurrency(v)}</Text>,
  },
  {
    title: "Commission",
    dataIndex: "commission",
    key: "commission",
    align: "right",
    render: (v) => <Text type="secondary">{formatCurrency(v)}</Text>,
  },
  {
    title: "Net Payout",
    dataIndex: "net_revenue",
    key: "net_revenue",
    align: "right",
    render: (v) => (
      <Text strong style={{ color: palette.success }}>
        {formatCurrency(v)}
      </Text>
    ),
  },
  {
    title: "Share",
    key: "share",
    align: "right",
    width: 168,
    render: (_, record) => {
      const pct = totalRevenue > 0
        ? ((record.gross_revenue || 0) / totalRevenue) * 100
        : 0;
      return (
        <Space size={6} align="center">
          <Progress
            percent={Math.round(pct)}
            showInfo={false}
            strokeColor={palette.primary}
            railColor={palette.fillHover}
            style={{ width: 84 }}
          />
          <Text type="secondary" style={{ fontSize: 12, minWidth: 44 }}>
            {pct.toFixed(1)}%
          </Text>
        </Space>
      );
    },
  },
];

const exportRevenueCSV = (rows) => {
  const total = rows.reduce((s, r) => s + (r.gross_revenue || 0), 0);
  const headers = ["Restaurant", "Gross Revenue", "Commission", "Net Payout", "Share"];
  const body = rows.map((r) => [
    r.restaurant || "",
    Number(r.gross_revenue || 0).toFixed(2),
    Number(r.commission || 0).toFixed(2),
    Number(r.net_revenue || 0).toFixed(2),
    total > 0 ? `${((r.gross_revenue || 0) / total) * 100}%` : "0%",
  ]);
  const csv = [headers, ...body]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `operations-revenue-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("Revenue report exported successfully");
};

const RIDER_COLS = [
  { title: "Rider", dataIndex: "rider", key: "rider" },
  { title: "Trips", dataIndex: "completed_trips", key: "completed_trips", align: "right", render: (v, r) => `${v ?? 0} / ${r.total_trips ?? 0}` },
  { title: "Avg. time", dataIndex: "avg_delivery_minutes", key: "avg_delivery_minutes", align: "right", render: (v) => v ? `${v} min` : "-" },
  { title: "Rating", dataIndex: "rating", key: "rating", align: "right", render: (v) => v ? <Tag color="orange" style={{ margin: 0 }}>{v}</Tag> : "-" },
  {
    title: "Earnings",
    dataIndex: "earnings",
    key: "earnings",
    align: "right",
    render: (v) =>
      v ? (
        <Text strong style={{ color: palette.success }}>
          {formatCurrency(v)}
        </Text>
      ) : (
        "-"
      ),
  },
  { title: "Status", dataIndex: "is_online", key: "is_online", align: "center", render: (v) => <Tag color={v ? "green" : "default"} style={{ margin: 0 }}>{v ? "Online" : "Offline"}</Tag> },
];

const axisStyle = { fontSize: 11, fill: palette.muted };
const noAxis = { axisLine: false, tickLine: false };

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const OperationsAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [live, setLive] = useState({});
  const [sla, setSla] = useState({});
  const [revenueSplit, setRevenueSplit] = useState([]);
  const [riders, setRiders] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [satisfaction, setSatisfaction] = useState({});

  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [restaurantFilter, setRestaurantFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
    }
    if (restaurantFilter) params.set("restaurant_id", String(restaurantFilter));
    if (statusFilter) params.set("status", statusFilter);
    return params.toString();
  }, [dateRange, restaurantFilter, statusFilter]);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const qs = buildParams();
      const [liveRes, slaRes, revRes, riderRes, heatRes, satRes] = await Promise.all([
        request(`analytics/live?${qs}`, "GET"),
        request(`analytics/sla?${qs}`, "GET"),
        request(`analytics/revenue-split?${qs}`, "GET"),
        request(`analytics/rider-efficiency?${qs}`, "GET"),
        request(`analytics/heatmap?${qs}`, "GET"),
        request(`analytics/customer-satisfaction?${qs}`, "GET"),
      ]);

      if (liveRes && !liveRes.message) setLive(liveRes);
      if (slaRes && !slaRes.message) setSla(slaRes);
      if (Array.isArray(revRes)) setRevenueSplit(revRes);
      if (Array.isArray(riderRes)) setRiders(riderRes);
      if (Array.isArray(heatRes)) setHeatmap(heatRes);
      if (satRes && !satRes.message) setSatisfaction(satRes);
    } catch {
      setError("Unable to load analytics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  const loadRestaurants = async () => {
    const res = await request("restaurants?limit=100", "GET");
    if (Array.isArray(res?.data)) {
      setRestaurantOptions(res.data.map((r) => ({ value: r.id, label: r.name })));
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(), 0);
    return () => clearTimeout(t);
  }, [refreshKey, loadData]);

  useEffect(() => {
    const t = setTimeout(() => loadRestaurants(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setRefreshKey((k) => k + 1);
    }, 0);
    return () => clearTimeout(t);
  }, [dateRange, restaurantFilter, statusFilter]);

  const clearFilters = () => {
    setDateRange(null);
    setRestaurantFilter(null);
    setStatusFilter(null);
  };

  const activeFilterCount = [dateRange, restaurantFilter, statusFilter].filter(Boolean).length;

  const avgDelivery = sla.average_delivery_minutes ?? 0;
  const slaTarget = sla.sla_target ?? 30;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOUR_MAP = { 10: "10 AM", 12: "12 PM", 14: "2 PM", 16: "4 PM", 18: "6 PM", 20: "8 PM" };
  const hours = Object.values(HOUR_MAP);

  const heatChartData = hours.map((hour) => {
    const row = { hour };
    DAYS.forEach((day) => { row[day] = 0; });
    return row;
  });
  heatmap.forEach((item) => {
    const label = HOUR_MAP[Number(item.hour)];
    const day = item.day?.slice(0, 3);
    if (label && day) {
      const row = heatChartData.find((r) => r.hour === label);
      if (row) row[day] = item.count;
    }
  });

  const riderPieData = riders.map((r) => ({ name: r.rider, value: r.completed_trips || r.total_trips || 0 }));
  const totalRevenue = revenueSplit.reduce((s, r) => s + (r.gross_revenue || 0), 0);
  const totalCommission = revenueSplit.reduce((s, r) => s + (r.commission || 0), 0);
  const totalNet = revenueSplit.reduce((s, r) => s + (r.net_revenue || 0), 0);
  const topRestaurant = revenueSplit.reduce(
    (best, r) => (!best || (r.gross_revenue || 0) > (best.gross_revenue || 0) ? r : best),
    null,
  );
  const topShare = topRestaurant && totalRevenue > 0
    ? ((topRestaurant.gross_revenue || 0) / totalRevenue) * 100
    : 0;

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 2, colorBgContainer: palette.bg, colorBorder: palette.border },
        components: { Table: { headerBg: "#f57c00", headerColor: "#fff", headerBorderRadius: 0 } },
      }}
    >
      <TopProgressBar active={loading || refreshing} label="Analytics loading" />

      <ModulePage
        title="Operations Analytics"
        description="Monitor order volume, delivery performance, restaurant revenue, and rider efficiency."
        icon={ChartNoAxesCombined}
        stats={[
          { label: "Active riders", value: live.active_riders ?? riders.length, icon: Bike, iconBackground: palette.primaryLight },
          { label: "Avg. delivery", value: avgDelivery, suffix: "min", color: sla.within_sla ? palette.success : palette.danger, icon: Clock3, iconBackground: sla.within_sla ? "#ECFDF5" : "#FEF2F2" },
          { label: "Revenue today", value: `$${Number(live.revenue_today || 0).toLocaleString()}`, color: palette.success, icon: Coins, iconBackground: "#DCFCE7" },
          { label: "Satisfaction", value: satisfaction.average_rating ?? 0, suffix: "/ 5", color: palette.warning, icon: Star, iconBackground: "#FEF3C7" },
          {
            label: "Top restaurant",
            value: topRestaurant ? topRestaurant.restaurant : "—",
            icon: Crown,
            iconBackground: "#FEF3C7",
            description: topRestaurant
              ? `${topShare.toFixed(1)}% of gross revenue`
              : "No revenue recorded yet",
          },
        ]}
        loading={loading}
        error={error}
      />

      {/* ─── Filters ─────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <Card
          variant="outlined"
          style={{ borderRadius: 2 }}
          styles={{ body: { padding: "12px 16px" } }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <RangePicker
              value={dateRange}
              onChange={(v) => setDateRange(v)}
              allowEmpty={[true, true]}
              format="YYYY-MM-DD"
              presets={DATE_PRESETS}
              style={{ width: 280, borderRadius: 2 }}
            />
            <Select
              placeholder="All restaurants"
              value={restaurantFilter}
              onChange={(v) => setRestaurantFilter(v)}
              allowClear
              showSearch
              optionFilterProp="label"
              options={restaurantOptions}
              style={{ width: 180, borderRadius: 2 }}
            />
            <Select
              placeholder="Order status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              allowClear
              options={STATUS_OPTIONS}
              style={{ width: 150, borderRadius: 2 }}
            />
            <Button
              icon={<RotateCcw size={15} />}
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              style={{ borderRadius: 2 }}
            >
              Clear
            </Button>
            <Button
              icon={<RefreshCw size={15} />}
              loading={refreshing}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </div>
        </Card>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 0 }}>

        {/* ─── Orders Heatmap ───────────────────────────── */}
        <Card
          variant="outlined"
          style={{ borderRadius: 2 }}
          title={
            <Space align="center" size={10}>
              <BarChart3 size={18} color={palette.primary} strokeWidth={1.8} />
              <Text strong>Orders per hour</Text>
            </Space>
          }
          extra={
            <Space size={16}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {live.orders_today ?? 0} orders today
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {live.completed_today ?? 0} completed
              </Text>
            </Space>
          }
        >
          {heatmap.length === 0 ? (
            <Empty description="No heatmap data yet" style={{ padding: "24px 0" }} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={heatChartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                <XAxis dataKey="hour" tick={axisStyle} axisLine={{ stroke: palette.border }} tickLine={false} />
                <YAxis tick={axisStyle} {...noAxis} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {DAYS.map((day, i) => (
                  <Bar key={day} dataKey={day} fill={COLORS[i]} radius={[2, 2, 0, 0]} maxBarSize={16} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ─── Delivery + Riders + Satisfaction ──────────── */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={8}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Clock3 size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>SLA Performance</Text>
                </Space>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Statistic title="Target" value={slaTarget} suffix="min" valueStyle={{ fontSize: 18 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="Actual" value={avgDelivery} suffix="min" valueStyle={{ fontSize: 18, color: sla.within_sla ? palette.success : palette.danger }} />
                </Col>
              </Row>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>SLA compliance</Text>
                  <Text strong style={{ fontSize: 12 }}>{sla.sla_percentage ?? 0}%</Text>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: palette.fillHover }}>
                  <div style={{ width: `${sla.sla_percentage ?? 0}%`, height: "100%", borderRadius: 6, background: sla.within_sla ? palette.success : palette.danger, transition: "width 0.4s" }} />
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {sla.within_sla_count ?? 0} / {sla.total_delivered ?? 0} deliveries within SLA
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Bike size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Rider efficiency</Text>
                </Space>
              }
            >
              {riderPieData.length === 0 ? (
                <Empty description="No rider data yet" style={{ padding: "24px 0" }} />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riderPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {riderPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v} trips`, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Star size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Customer satisfaction</Text>
                </Space>
              }
            >
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: palette.warning, lineHeight: 1 }}>
                  {satisfaction.average_rating ?? 0}
                </div>
                <div style={{ fontSize: 12, color: palette.muted, marginTop: 4 }}>
                  out of 5 ({satisfaction.total_reviews ?? 0} reviews)
                </div>
              </div>
              {satisfaction.distribution?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const entry = satisfaction.distribution.find((d) => d.rating === star);
                    const count = entry?.count ?? 0;
                    const pct = satisfaction.total_reviews > 0 ? (count / satisfaction.total_reviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 11, width: 12, textAlign: "right" }}>{star}</Text>
                        <Star size={11} color={palette.warning} fill={palette.warning} />
                        <div style={{ flex: 1, height: 4, borderRadius: 4, background: palette.fillHover }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: palette.warning, transition: "width 0.4s" }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, width: 24, textAlign: "right" }}>{count}</Text>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* ─── Revenue Summary ──────────────────────────── */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={12}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Store size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Revenue split</Text>
                </Space>
              }
              extra={
                <Space size={12}>
                  <Space size={6}>
                    <Percent size={13} color={palette.muted} strokeWidth={1.8} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Total: {formatCurrency(totalRevenue)}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Commission: {formatCurrency(totalCommission)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Net: {formatCurrency(totalNet)}
                  </Text>
                  <Button
                    size="small"
                    icon={<Download size={13} />}
                    disabled={revenueSplit.length === 0 || loading}
                    onClick={() => exportRevenueCSV(revenueSplit)}
                    style={{ borderRadius: 2 }}
                  >
                    Export CSV
                  </Button>
                </Space>
              }
            >
              {revenueSplit.length === 0 ? (
                <Empty description="No revenue data yet" style={{ padding: "24px 0" }} />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueSplit} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={palette.border} horizontal={false} />
                      <XAxis type="number" tick={axisStyle} axisLine={{ stroke: palette.border }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="restaurant" type="category" tick={axisStyle} {...noAxis} width={100} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
                      <Bar dataKey="gross_revenue" fill={palette.primary} radius={[0, 2, 2, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table
                    columns={buildRestaurantCols(totalRevenue)}
                    dataSource={revenueSplit}
                    pagination={false}
                    size="small"
                    rowKey="restaurant"
                    style={{ marginTop: 12 }}
                    scroll={{ x: "max-content" }}
                  />
                </>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Bike size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Rider leaderboard</Text>
                </Space>
              }
            >
              {riders.length === 0 ? (
                <Empty description="No rider data yet" style={{ padding: "24px 0" }} />
              ) : (
                <Table columns={RIDER_COLS} dataSource={riders} pagination={false} size="small" rowKey="rider" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default OperationsAnalyticsPage;
