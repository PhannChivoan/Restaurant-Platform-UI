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
  Table,
  Typography,
  message,
} from "antd";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crown,
  Download,
  MapPin,
  RefreshCw,
  RotateCcw,
  TimerReset,
  TrendingUp,
  Truck,
} from "lucide-react";
import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;
const { RangePicker } = DatePicker;

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

const HOUR_LABELS = {};
for (let h = 0; h < 24; h++) HOUR_LABELS[h] = dayjs().hour(h).format("h A");

const axisStyle = { fontSize: 11, fill: palette.muted };
const noAxis = { axisLine: false, tickLine: false };

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const buildZoneCols = (totalTrips) => [
  {
    title: "#",
    key: "index",
    width: 50,
    render: (_, __, index) => index + 1,
  },
  { title: "Zone", dataIndex: "zone", key: "zone" },
  {
    title: "Deliveries",
    dataIndex: "trips",
    key: "trips",
    align: "right",
    render: (v) => <Text strong>{formatNumber(v)}</Text>,
  },
  {
    title: "Avg. time",
    dataIndex: "average",
    key: "average",
    align: "right",
    render: (v) => <Text strong>{v ?? 0} min</Text>,
  },
  {
    title: "SLA target",
    dataIndex: "sla",
    key: "sla",
    align: "right",
    render: (v) => <Text type="secondary">{v ?? 0} min</Text>,
  },
  {
    title: "On-time",
    key: "on_time_rate",
    align: "right",
    width: 180,
    render: (_, record) => {
      const rate = record.on_time_rate ?? 0;
      return (
        <Space size={6} align="center">
          <Progress
            percent={rate}
            showInfo={false}
            strokeColor={rate >= 90 ? palette.success : rate >= 75 ? palette.warning : palette.danger}
            railColor={palette.fillHover}
            style={{ width: 84 }}
          />
          <Text type="secondary" style={{ fontSize: 12, minWidth: 40 }}>
            {rate}%
          </Text>
        </Space>
      );
    },
  },
  {
    title: "Share",
    key: "share",
    align: "right",
    width: 150,
    render: (_, record) => {
      const pct = totalTrips > 0 ? ((record.trips || 0) / totalTrips) * 100 : 0;
      return (
        <Space size={6} align="center">
          <Progress
            percent={Math.round(pct)}
            showInfo={false}
            strokeColor={palette.primary}
            railColor={palette.fillHover}
            style={{ width: 72 }}
          />
          <Text type="secondary" style={{ fontSize: 12, minWidth: 40 }}>
            {pct.toFixed(1)}%
          </Text>
        </Space>
      );
    },
  },
  {
    title: "Late",
    dataIndex: "late",
    key: "late",
    align: "right",
    render: (v) =>
      v > 0 ? (
        <Text type="danger">{v}</Text>
      ) : (
        <Text type="secondary">0</Text>
      ),
  },
];

const exportZonesCSV = (rows, totalTrips) => {
  if (!rows.length) return false;
  const headers = ["Zone", "Deliveries", "Avg. Time (min)", "SLA (min)", "On-time Rate (%)", "Late", "Share (%)"];
  const body = rows.map((r) => [
    r.zone || "",
    Number(r.trips || 0),
    r.average ?? 0,
    r.sla ?? 0,
    r.on_time_rate ?? 0,
    r.late ?? 0,
    totalTrips > 0 ? Number(((r.trips || 0) / totalTrips) * 100).toFixed(1) : 0,
  ]);
  const csv = [headers, ...body]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delivery-performance-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("Zone report exported successfully");
};

const DeliveryPerformancePage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({});
  const [zones, setZones] = useState([]);
  const [hourly, setHourly] = useState([]);

  const [zoneOptions, setZoneOptions] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [zoneFilter, setZoneFilter] = useState(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
    }
    if (zoneFilter) params.set("zone_id", String(zoneFilter));
    return params.toString();
  }, [dateRange, zoneFilter]);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const qs = buildParams();
      const res = await request(`analytics/delivery-performance?${qs}`, "GET");

      if (res && !res.message) {
        setStats(res.stats ?? {});
        setZones(Array.isArray(res.zones) ? res.zones : []);
        setHourly(Array.isArray(res.hourly) ? res.hourly : []);
      }
    } catch {
      setError("Unable to load delivery performance data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  const loadZones = async () => {
    const res = await request("zones?limit=100", "GET");
    if (Array.isArray(res?.data)) {
      setZoneOptions(res.data.map((z) => ({ value: z.id, label: z.name })));
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(), 0);
    return () => clearTimeout(t);
  }, [refreshKey, loadData]);

  useEffect(() => {
    const t = setTimeout(() => loadZones(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setRefreshKey((k) => k + 1), 0);
    return () => clearTimeout(t);
  }, [dateRange, zoneFilter]);

  const clearFilters = () => {
    setDateRange(null);
    setZoneFilter(null);
  };

  const activeFilterCount = [dateRange, zoneFilter].filter(Boolean).length;

  const slaTarget = stats.sla_target_minutes ?? 30;
  const avgDelivery = stats.average_delivery_minutes ?? 0;
  const avgPickup = stats.average_pickup_minutes ?? 0;
  const onTimeRate = stats.on_time_rate ?? 0;
  const lateOrders = stats.late_orders ?? 0;
  const totalDelivered = stats.total_delivered ?? 0;
  const activeTrips = stats.active_trips ?? 0;

  const chartData = hourly.map((h) => ({
    hour: HOUR_LABELS[h.hour] || `${h.hour}:00`,
    trips: h.trips ?? 0,
    on_time: h.on_time ?? 0,
    late: Math.max(0, (h.trips ?? 0) - (h.on_time ?? 0)),
    average: h.average ?? 0,
  }));

  const topZone = zones.reduce(
    (best, z) => (!best || z.trips > best.trips ? z : best),
    null,
  );
  const topShare = topZone && totalDelivered > 0
    ? (topZone.trips / totalDelivered) * 100
    : 0;

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 2, colorBgContainer: palette.bg, colorBorder: palette.border },
        components: { Table: { headerBg: "#f57c00", headerColor: "#fff", headerBorderRadius: 0 } },
      }}
    >
      <TopProgressBar active={loading || refreshing} label="Delivery performance loading" />

      <ModulePage
        title="Delivery Performance"
        description="Monitor delivery times against SLA targets, identify slow zones, and track on-time performance."
        icon={TimerReset}
        stats={[
          {
            label: "Average delivery",
            value: avgDelivery,
            suffix: "min",
            color: avgDelivery > 0 && avgDelivery <= slaTarget ? palette.success : palette.danger,
            icon: Clock3,
            iconBackground: "#EFF6FF",
          },
          {
            label: "On-time rate",
            value: onTimeRate,
            suffix: "%",
            color: onTimeRate >= 90 ? palette.success : onTimeRate >= 75 ? palette.warning : palette.danger,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Late orders",
            value: lateOrders,
            color: lateOrders > 0 ? palette.danger : palette.success,
            icon: AlertTriangle,
            iconBackground: lateOrders > 0 ? "#FEF2F2" : "#ECFDF5",
          },
          {
            label: "Deliveries tracked",
            value: formatNumber(totalDelivered),
            icon: Truck,
            iconBackground: "#FEF3C7",
            description: `${formatNumber(avgPickup)} min avg pickup`,
          },
          {
            label: "Top zone",
            value: topZone ? topZone.zone : "—",
            icon: Crown,
            iconBackground: "#FEF3C7",
            description: topZone ? `${topShare.toFixed(1)}% of trips` : "No deliveries recorded yet",
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
              onChange={setDateRange}
              allowEmpty={[true, true]}
              format="YYYY-MM-DD"
              presets={DATE_PRESETS}
              style={{ width: 280, borderRadius: 2 }}
            />
            <Select
              placeholder="All zones"
              value={zoneFilter}
              onChange={setZoneFilter}
              allowClear
              showSearch
              optionFilterProp="label"
              options={zoneOptions}
              style={{ width: 180, borderRadius: 2 }}
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
        {/* ─── Charts ─────────────────────────────────────── */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={12}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Clock3 size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Average delivery time by hour</Text>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  SLA {slaTarget} min reference
                </Text>
              }
            >
              {hourly.length === 0 ? (
                <Empty description="No delivery data yet" style={{ padding: "24px 0" }} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                    <XAxis dataKey="hour" tick={axisStyle} axisLine={{ stroke: palette.border }} tickLine={false} />
                    <YAxis tick={axisStyle} {...noAxis} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v} min`, "Avg. time"]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <ReferenceLine y={slaTarget} stroke={palette.warning} strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="average"
                      name="Avg. time"
                      stroke={palette.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <TrendingUp size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>On-time vs late trips by hour</Text>
                </Space>
              }
            >
              {hourly.length === 0 ? (
                <Empty description="No delivery data yet" style={{ padding: "24px 0" }} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                    <XAxis dataKey="hour" tick={axisStyle} axisLine={{ stroke: palette.border }} tickLine={false} />
                    <YAxis tick={axisStyle} {...noAxis} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar
                      dataKey="on_time"
                      name="On-time"
                      stackId="trips"
                      fill={palette.success}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="late"
                      name="Late"
                      stackId="trips"
                      fill={palette.danger}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* ─── Zone table ─────────────────────────────────── */}
        <Card
          variant="outlined"
          style={{ borderRadius: 2 }}
          title={
            <Space align="center" size={10}>
              <MapPin size={18} color={palette.primary} strokeWidth={1.8} />
              <Text strong>Zone delivery performance</Text>
            </Space>
          }
          extra={
            <Space size={12}>
              {topZone && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Top: {topZone.zone} · {topShare.toFixed(1)}% of trips
                </Text>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatNumber(activeTrips)} active trips
              </Text>
              <Button
                size="small"
                icon={<Download size={13} />}
                disabled={zones.length === 0 || loading}
                onClick={() => exportZonesCSV(zones, totalDelivered)}
                style={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Space>
          }
        >
          <Table
            columns={buildZoneCols(totalDelivered)}
            dataSource={zones}
            loading={loading}
            pagination={false}
            size="small"
            rowKey="zone"
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "No delivery performance data recorded yet" }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default DeliveryPerformancePage;
