import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Col,
  ConfigProvider,
  DatePicker,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AlertTriangle,
  Clock4,
  Coins,
  Download,
  FileClock,
  History,
  RotateCcw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const EVENT_COLORS = {
  order: palette.info,
  dispatch: palette.primary,
  menu: palette.success,
  refund: palette.danger,
  rider: palette.warning,
};

const eventColor = (event) => {
  const key = Object.keys(EVENT_COLORS).find((k) =>
    String(event).toLowerCase().includes(k),
  );
  return key ? EVENT_COLORS[key] : palette.muted;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

const formatDateTime = (date) =>
  date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "--:--";

const relativeTime = (date) => {
  if (!date) return "--";
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const buildColumns = (totalEvents) => [
  {
    title: "#",
    key: "index",
    width: 50,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Event",
    dataIndex: "event",
    key: "event",
    render: (event) => (
      <Tag color={eventColor(event)} style={{ margin: 0 }}>
        {String(event || "Unknown").replace(/_/g, " ")}
      </Tag>
    ),
  },
  {
    title: "Actor",
    dataIndex: "actor",
    key: "actor",
    render: (actor, record) => (
      <Space size={6}>
        <Text strong>{actor || "System"}</Text>
        {record.role && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({record.role})
          </Text>
        )}
      </Space>
    ),
  },
  {
    title: "Resource",
    dataIndex: "resource",
    key: "resource",
    render: (resource) => resource || "--",
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    render: (description) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {description || "--"}
      </Text>
    ),
  },
  {
    title: "Time",
    dataIndex: "created_at",
    key: "time",
    align: "right",
    render: (date, record) => (
      <Space size={6} direction="vertical">
        <Text style={{ fontSize: 12 }}>{formatDateTime(date)}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {relativeTime(date)}
        </Text>
      </Space>
    ),
  },
];

const exportLogsCSV = (rows) => {
  const headers = ["Event", "Actor", "Role", "Resource", "Description", "Time"];
  const body = rows.map((r) => [
    r.event || "",
    r.actor || "System",
    r.role || "",
    r.resource || "",
    r.description || "",
    r.created_at ? dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss") : "",
  ]);
  const csv = [headers, ...body]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-logs-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("Activity logs exported successfully");
};

const ActivityLogPage = () => {
  // ─── List state ───
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  // ─── Filters state ───
  const [roleFilter, setRoleFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);

  const activeFilterCount = [roleFilter, eventFilter, dateRange].filter(Boolean).length;

  /* ─── DATA LOADING ─── */

  const loadLogs = async (manual = false) => {
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
      if (roleFilter) params.set("role", roleFilter);
      if (eventFilter) params.set("event", eventFilter);
      if (dateRange?.[0]) params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1]) params.set("date_to", dateRange[1].format("YYYY-MM-DD"));

      const response = await request(`activity-logs?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setLogs(response.data.map((log) => ({
          key: `log-${log.id}`,
          event: log.event,
          actor: log.user?.name || "System",
          role: log.user?.role || "",
          resource: log.loggable_type
            ? `#${String(log.loggable_type).split("\\").pop()}-${log.loggable_id}`
            : "--",
          description: log.new_value || log.old_value || "",
          created_at: log.created_at,
        })));
        setTotal(response.total || 0);
      } else {
        setError(response?.message || "Unable to load activity logs.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load activity logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFilterOptions = async () => {
    const response = await request("activity-logs/filters", "GET");
    if (response && !response.message) {
      setRoleOptions((response.roles || []).map((r) => ({
        value: r,
        label: String(r).replace(/_/g, " "),
      })));
      setEventOptions((response.events || []).map((e) => ({
        value: e,
        label: String(e).replace(/_/g, " "),
      })));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadLogs(), 0);
    return () => clearTimeout(timer);
  }, [refreshKey, page, roleFilter, eventFilter, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => loadFilterOptions(), 0);
    return () => clearTimeout(timer);
  }, []);

  const clearFilters = () => {
    setRoleFilter("");
    setEventFilter("");
    setDateRange(null);
    setPage(1);
  };

  /* ─── DERIVED ─── */

  const orderEvents = logs.filter((l) => String(l.event || "").toLowerCase().includes("order")).length;
  const dispatchEvents = logs.filter((l) => String(l.event || "").toLowerCase().includes("dispatch")).length;
  const refundEvents = logs.filter((l) => String(l.event || "").toLowerCase().includes("refund")).length;

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 2,
          colorBgContainer: palette.bg,
          colorBorder: palette.border,
        },
      }}
    >
      <TopProgressBar active={loading || refreshing} label="Activity logs loading" />

      <ModulePage
        title="Activity Log"
        description="Review order transitions, dispatch events, menu edits, and refund approvals."
        icon={History}
        stats={[
          {
            label: "Total events",
            value: formatNumber(total),
            icon: FileClock,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Order events",
            value: formatNumber(orderEvents),
            icon: ShoppingCart,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Dispatch events",
            value: formatNumber(dispatchEvents),
            icon: Clock4,
            iconBackground: "#FEF3C7",
          },
          {
            label: "Refund approvals",
            value: formatNumber(refundEvents),
            icon: Coins,
            iconBackground: "#ECFDF5",
          },
        ]}
        columns={buildColumns(total)}
        rows={logs}
        loading={loading}
        error={error}
        toolbar={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Select
              placeholder="All roles"
              value={roleFilter || undefined}
              onChange={(value) => setRoleFilter(value || "")}
              allowClear
              showSearch
              optionFilterProp="label"
              options={roleOptions}
              style={{ width: 170, borderRadius: 2 }}
            />
            <Select
              placeholder="All events"
              value={eventFilter || undefined}
              onChange={(value) => setEventFilter(value || "")}
              allowClear
              showSearch
              optionFilterProp="label"
              options={eventOptions}
              style={{ width: 170, borderRadius: 2 }}
            />
            <RangePicker
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                setPage(1);
              }}
              allowEmpty={[true, true]}
              format="YYYY-MM-DD"
              style={{ width: 260, borderRadius: 2 }}
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
              icon={<XCircle size={15} />}
              loading={refreshing}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              icon={<Download size={15} />}
              disabled={logs.length === 0 || loading}
              onClick={() => exportLogsCSV(logs)}
              style={{ borderRadius: 2, marginLeft: "auto" }}
            >
              Export CSV
            </Button>
          </div>
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} log events`,
        }}
      />
    </ConfigProvider>
  );
};

export default ActivityLogPage;
