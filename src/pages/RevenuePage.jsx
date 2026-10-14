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
  Banknote,
  CircleDollarSign,
  Coins,
  Crown,
  Download,
  Percent,
  RefreshCw,
  RotateCcw,
  Store,
  TrendingUp,
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

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const axisStyle = { fontSize: 11, fill: palette.muted };
const noAxis = { axisLine: false, tickLine: false };

const buildRestaurantCols = (totalRevenue) => [
  {
    title: "#",
    key: "index",
    width: 50,
    render: (_, __, index) => index + 1,
  },
  { title: "Restaurant", dataIndex: "restaurant", key: "restaurant" },
  {
    title: "Gross Revenue",
    dataIndex: "gross_revenue",
    key: "gross_revenue",
    align: "right",
    render: (v) => <Text strong>{formatCurrency(v)}</Text>,
  },
  {
    title: "Commission (10%)",
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
  const headers = ["Restaurant", "Gross Revenue", "Commission (10%)", "Net Payout", "Share"];
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
  a.download = `revenue-split-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("Revenue report exported successfully");
};

const RevenuePage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [revenueData, setRevenueData] = useState([]);
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [restaurantFilter, setRestaurantFilter] = useState(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
    }
    if (restaurantFilter) params.set("restaurant_id", String(restaurantFilter));
    return params.toString();
  }, [dateRange, restaurantFilter]);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const qs = buildParams();
      const res = await request(`analytics/revenue-split?${qs}`, "GET");

      if (Array.isArray(res)) {
        setRevenueData(res);
      } else {
        setError(res?.message || "Unable to load revenue data.");
      }
    } catch {
      setError("Unable to load revenue data.");
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
  }, [dateRange, restaurantFilter]);

  const clearFilters = () => {
    setDateRange(null);
    setRestaurantFilter(null);
  };

  const activeFilterCount = [dateRange, restaurantFilter].filter(Boolean).length;

  const totalRevenue = revenueData.reduce((s, r) => s + (r.gross_revenue || 0), 0);
  const totalCommission = revenueData.reduce((s, r) => s + (r.commission || 0), 0);
  const totalNet = revenueData.reduce((s, r) => s + (r.net_revenue || 0), 0);

  const pieData = [
    { name: "Restaurant Payouts", value: totalNet },
    { name: "Platform Commission", value: totalCommission },
  ];

  const topRestaurant = revenueData.reduce(
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
      <TopProgressBar active={loading || refreshing} label="Revenue data loading" />

      <ModulePage
        title="Revenue Reports"
        description="Review restaurant revenue splits, commission totals, payouts, and financial trends."
        icon={Banknote}
        stats={[
          {
            label: "Gross revenue",
            value: formatCurrency(totalRevenue),
            icon: Coins,
            iconBackground: "#DCFCE7",
          },
          {
            label: "Platform commission",
            value: formatCurrency(totalCommission),
            icon: CircleDollarSign,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Restaurant payouts",
            value: formatCurrency(totalNet),
            icon: Banknote,
            iconBackground: "#DBEAFE",
          },
          {
            label: "Active restaurants",
            value: revenueData.length,
            icon: Store,
            iconBackground: "#FEF3C7",
          },
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
              style={{ width: 200, borderRadius: 2 }}
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

        {/* ─── Charts Row ───────────────────────────────── */}
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={14}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <TrendingUp size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Revenue by restaurant</Text>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {revenueData.length} restaurant{revenueData.length !== 1 ? "s" : ""}
                </Text>
              }
            >
              {revenueData.length === 0 ? (
                <Empty description="No revenue data yet" style={{ padding: "24px 0" }} />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={revenueData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={axisStyle}
                      axisLine={{ stroke: palette.border }}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                    />
                    <YAxis
                      dataKey="restaurant"
                      type="category"
                      tick={axisStyle}
                      {...noAxis}
                      width={110}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v) => [formatCurrency(v), ""]}
                    />
                    <Bar
                      dataKey="gross_revenue"
                      name="Gross Revenue"
                      fill={palette.primary}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              variant="outlined"
              style={{ borderRadius: 2, height: "100%" }}
              title={
                <Space align="center" size={10}>
                  <Coins size={18} color={palette.primary} strokeWidth={1.8} />
                  <Text strong>Revenue distribution</Text>
                </Space>
              }
              extra={
                <Space size={6}>
                  <Percent size={13} color={palette.muted} strokeWidth={1.8} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Total: {formatCurrency(totalRevenue)}
                  </Text>
                </Space>
              }
            >
              {revenueData.length === 0 ? (
                <Empty description="No revenue data yet" style={{ padding: "24px 0" }} />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? palette.success : palette.primary} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v) => [formatCurrency(v), ""]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* ─── Revenue Table ─────────────────────────────── */}
        <Card
          variant="outlined"
          style={{ borderRadius: 2 }}
          title={
            <Space align="center" size={10}>
              <Store size={18} color={palette.primary} strokeWidth={1.8} />
              <Text strong>Restaurant revenue breakdown</Text>
            </Space>
          }
          extra={
            <Space size={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total: {formatCurrency(totalRevenue)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Commission: {formatCurrency(totalCommission)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Net: {formatCurrency(totalNet)}
              </Text>
              <Button
                size="small"
                icon={<Download size={13} />}
                disabled={revenueData.length === 0 || loading}
                onClick={() => exportRevenueCSV(revenueData)}
                style={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Space>
          }
        >
          <Table
            columns={buildRestaurantCols(totalRevenue)}
            dataSource={revenueData}
            loading={loading}
            pagination={false}
            size="small"
            rowKey="restaurant"
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "No revenue data recorded yet" }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default RevenuePage;
