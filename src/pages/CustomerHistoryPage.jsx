import { formatMoney } from "../utils/platformSettings";
import { useCallback, useEffect, useState } from "react";

import {
  Avatar,
  Button,
  ConfigProvider,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  App,
} from "antd";

import {
  CheckCircle2,
  Clock,
  Edit3,
  Ellipsis,
  Eye,
  History,
  Package,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* =========================================================
   HELPERS
========================================================= */

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatCurrency = (v) => (v != null ? formatMoney(v) : formatMoney(0));

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ORDER_STATUS_COLORS = {
  pending: "default",
  accepted: "processing",
  preparing: "processing",
  ready: "success",
  dispatched: "processing",
  delivered: "success",
  cancelled: "error",
  rejected: "error",
};

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  wallet: "Wallet",
  bank_transfer: "Bank Transfer",
};

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save.";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CustomerHistoryPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  // ─── Stats ───────────────────────────────────────
  const [stats, setStats] = useState({});

  // ─── Filters ─────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Edit modal state ────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("payment_method", paymentFilter);
      if (dateRange?.[0]) params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1]) params.set("date_to", dateRange[1].format("YYYY-MM-DD"));

      const response = await request(`orders?${params.toString()}`, "GET");

      if (response?.data) {
        setRows(response.data);
        setTotal(response.total || 0);

        const allData = response.data;
        const delivered = allData.filter((o) => o.status === "delivered");
        const cancelled = allData.filter((o) => o.status === "cancelled");
        const paid = allData.filter((o) => o.is_paid);
        const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
        const rated = allData.filter((o) => o.average_rating > 0);
        const avgRating = rated.length > 0
          ? (rated.reduce((sum, o) => sum + o.average_rating, 0) / rated.length).toFixed(1)
          : 0;

        setStats({
          total_orders: response.total ?? allData.length,
          delivered: delivered.length,
          cancelled: cancelled.length,
          total_revenue: totalRevenue,
          avg_rating: avgRating,
          paid_count: paid.length,
        });

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((r) => r.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load order history.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load order history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, page, search, statusFilter, paymentFilter, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, loadOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     DETAIL
  ========================================================= */

  const openDetail = (order) => {
    setSelected(order);
    setDetailOpen(true);
    setDetailLoading(true);

    request(`orders/${order.id}`, "GET")
      .then((detail) => {
        if (detail?.id) {
          setSelected((current) =>
            current && current.id === detail.id ? detail : current,
          );
        }
      })
      .finally(() => setDetailLoading(false));
  };

  /* =========================================================
     ORDER CRUD
  ========================================================= */

  const openEditModal = (order) => {
    setEditingOrder(order);
    editForm.resetFields();
    editForm.setFieldsValue({
      status: order.status,
      payment_method: order.payment_method,
      is_paid: order.is_paid,
      customer_notes: order.customer_notes || "",
    });
    setEditModalOpen(true);
  };

  const saveOrder = async () => {
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const response = await request(`orders/${editingOrder.id}`, "PUT", {
      status: values.status,
      payment_method: values.payment_method,
      is_paid: values.is_paid ? 1 : 0,
      customer_notes: values.customer_notes || "",
    });

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success("Order updated.");
    setEditModalOpen(false);
    setEditingOrder(null);
    editForm.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const deleteOrder = (order) => {
    Modal.confirm({
      title: "Delete order?",
      content: `Order #${order.order_number || order.id} will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`orders/${order.id}`, "DELETE");

        if (response?.message) {
          message.success("Order deleted.");
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((key) => key + 1);
        } else {
          message.error(response?.message || "Delete failed.");
        }
      },
    });
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Order",
      key: "order",
      render: (_, row) => {
        const firstItemImage = row.items?.[0]?.menuItem?.image_url;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={38}
              shape="square"
              style={{ background: palette.primaryLight, flexShrink: 0 }}
              src={firstItemImage ? toMediaUrl(firstItemImage) : undefined}
            >
              <Package size={16} color={palette.primary} />
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Tooltip title="Click to view details">
                <Typography.Link
                  strong
                  onClick={(event) => {
                    event.stopPropagation();
                    openDetail(row);
                  }}
                  style={{ color: palette.ink, fontWeight: 600 }}
                >
                  #{row.order_number || row.id}
                </Typography.Link>
              </Tooltip>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.items_count ?? row.items?.length ?? 0} items
                </Text>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {row.customer?.name || "Unknown"}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.customer?.email || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Restaurant",
      key: "restaurant",
      render: (_, row) => (
        <Text style={{ fontSize: 13 }}>
          {row.restaurant?.name || "-"}
        </Text>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 90,
      align: "right",
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
      render: (value) => (
        <Text strong style={{ fontSize: 13 }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      width: 100,
      render: (_, row) => (
        <Space size={4} align="center">
          {row.is_paid ? (
            <CheckCircle2 size={12} color={palette.success} />
          ) : (
            <Clock size={12} color={palette.warning} />
          )}
          <Text style={{ fontSize: 12 }}>
            {PAYMENT_LABELS[row.payment_method] || row.payment_method || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Rating",
      dataIndex: "average_rating",
      key: "average_rating",
      width: 80,
      align: "center",
      sorter: (a, b) => (a.average_rating || 0) - (b.average_rating || 0),
      render: (value) =>
        value > 0 ? (
          <Space size={3} align="center">
            <Star size={11} color={palette.warning} fill={palette.warning} />
            <Text strong style={{ fontSize: 12 }}>
              {Number(value).toFixed(1)}
            </Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
          </Text>
        ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 110,
      sorter: (a, b) =>
        (a.created_at || "").localeCompare(b.created_at || ""),
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(value)}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "view",
                label: "View details",
                icon: <Eye size={15} />,
              },
              {
                key: "edit",
                label: "Edit order",
                icon: <Edit3 size={15} />,
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete order",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openEditModal(row);
              if (key === "delete") deleteOrder(row);
            },
          }}
        >
          <Tooltip title="Actions">
            <Button
              size="small"
              icon={<Ellipsis size={16} />}
              style={{ borderRadius: 2 }}
            />
          </Tooltip>
        </Dropdown>
      ),
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

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
      <TopProgressBar
        active={loading || refreshing}
        label="Order history loading"
      />

      <ModulePage
        title="Customer Order History"
        description="Review all customer order activity, cancellations, refunds, and satisfaction trends."
        icon={History}
        stats={[
          {
            label: "Total orders",
            value: stats.total_orders ?? 0,
            icon: Package,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Delivered",
            value: stats.delivered ?? 0,
            color: palette.success,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Cancelled",
            value: stats.cancelled ?? 0,
            color: palette.danger,
            icon: XCircle,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Avg. rating",
            value: stats.avg_rating ?? 0,
            color: palette.warning,
            icon: Star,
            iconBackground: "#FFF7ED",
          },
        ]}
        loading={loading}
        error={error}
        toolbar={
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="Search order #, customer, restaurant…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 280 }}
            />
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: "pending", label: "Pending" },
                { value: "accepted", label: "Accepted" },
                { value: "preparing", label: "Preparing" },
                { value: "ready", label: "Ready" },
                { value: "dispatched", label: "Dispatched" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
            <Select
              placeholder="Payment"
              value={paymentFilter}
              onChange={(v) => {
                setPaymentFilter(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "wallet", label: "Wallet" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setPage(1);
              }}
              style={{ width: 240 }}
              placeholder={["From date", "To date"]}
              allowClear
            />
            <Button
              icon={<RefreshCw size={15} />}
              loading={refreshing}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </div>
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) =>
            `${range[0]}-${range[1]} of ${count} orders`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Order Detail Drawer ────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <Package size={18} color={palette.info} />
            <span>Order #{selected?.order_number || selected?.id}</span>
            {selected && (
              <Tag color={ORDER_STATUS_COLORS[selected.status]}>
                {selected.status}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        size={520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          selected && (
            <Space>
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => {
                  setDetailOpen(false);
                  openEditModal(selected);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteOrder(selected)}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {detailLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <DotsRing style={{ width: 36, height: 36, color: palette.primary }} />
              </div>
            ) : (
              <>
                {/* Customer + Restaurant */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      background: palette.bgSubtle,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <User size={13} color={palette.muted} />
                      <Text type="secondary" style={{ fontSize: 11 }}>Customer</Text>
                    </div>
                    <Text strong style={{ fontSize: 13 }}>
                      {selected.customer?.name || "Unknown"}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selected.customer?.email || ""}
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 12,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      background: palette.bgSubtle,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Package size={13} color={palette.muted} />
                      <Text type="secondary" style={{ fontSize: 11 }}>Restaurant</Text>
                    </div>
                    <Text strong style={{ fontSize: 13 }}>
                      {selected.restaurant?.name || "-"}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selected.branch?.name || ""}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Order breakdown */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: 12,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 2,
                    background: palette.bgSubtle,
                  }}
                >
                  {[
                    { label: "Subtotal", value: formatCurrency(selected.subtotal) },
                    { label: "Delivery fee", value: formatCurrency(selected.delivery_fee) },
                    ...(selected.surge_fee > 0
                      ? [{ label: "Surge fee", value: formatCurrency(selected.surge_fee) }]
                      : []),
                    ...(selected.discount > 0
                      ? [{ label: "Discount", value: `-${formatCurrency(selected.discount)}` }]
                      : []),
                    { label: "Tax", value: formatCurrency(selected.tax) },
                    { label: "Total", value: formatCurrency(selected.total), bold: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        type={item.bold ? undefined : "secondary"}
                        strong={item.bold}
                        style={{ fontSize: 12 }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        strong={item.bold}
                        style={{
                          fontSize: item.bold ? 14 : 12,
                          color: item.bold ? palette.ink : undefined,
                        }}
                      >
                        {item.value}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Payment + Status */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Payment
                    </Text>
                    <div>
                      <Tag
                        color={selected.is_paid ? "green" : "orange"}
                        style={{ margin: "4px 0 0" }}
                      >
                        {selected.is_paid ? "Paid" : "Unpaid"}
                      </Tag>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Method
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 13 }}>
                        {PAYMENT_LABELS[selected.payment_method] || selected.payment_method || "-"}
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Rating
                    </Text>
                    <div>
                      {selected.average_rating > 0 ? (
                        <Space size={3} align="center">
                          <Star size={12} color={palette.warning} fill={palette.warning} />
                          <Text strong style={{ fontSize: 14 }}>
                            {Number(selected.average_rating).toFixed(1)}
                          </Text>
                        </Space>
                      ) : (
                        <Text type="secondary">No rating</Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <Text strong style={{ marginBottom: 8, display: "block" }}>
                    Timeline
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {[
                      { label: "Order placed", time: selected.created_at, icon: Package, color: palette.info },
                      { label: "Accepted", time: selected.accepted_at, icon: CheckCircle2, color: palette.success },
                      { label: "Preparing", time: selected.preparing_at, icon: Clock, color: palette.warning },
                      { label: "Ready", time: selected.ready_at, icon: Package, color: palette.primary },
                      { label: "Dispatched", time: selected.dispatched_at, icon: TrendingUp, color: palette.info },
                      { label: "Delivered", time: selected.delivered_at, icon: CheckCircle2, color: palette.success },
                      ...(selected.cancelled_at
                        ? [{ label: "Cancelled", time: selected.cancelled_at, icon: XCircle, color: palette.danger }]
                        : []),
                    ]
                      .filter((step) => step.time)
                      .map((step) => (
                        <div
                          key={step.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 0",
                          }}
                        >
                          <step.icon size={13} color={step.color} />
                          <Text style={{ fontSize: 12, flex: 1 }}>
                            {step.label}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatDateTime(step.time)}
                          </Text>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Notes */}
                {selected.customer_notes && (
                  <div
                    style={{
                      padding: 10,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      background: "#FFFBEB",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                      Customer note
                    </Text>
                    <Text style={{ fontSize: 13 }}>
                      {selected.customer_notes}
                    </Text>
                  </div>
                )}

                {/* Items */}
                {selected.items && selected.items.length > 0 && (
                  <div>
                    <Text strong style={{ marginBottom: 8, display: "block" }}>
                      Items ({selected.items.length})
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {selected.items.map((item, idx) => {
                        const imgUrl = item.menuItem?.image_url;
                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 10px",
                              border: `1px solid ${palette.border}`,
                              borderRadius: 2,
                              fontSize: 12,
                            }}
                          >
                            <Avatar
                              size={36}
                              shape="square"
                              style={{ background: palette.primaryLight, flexShrink: 0 }}
                              src={imgUrl ? toMediaUrl(imgUrl) : undefined}
                            >
                              <Package size={14} color={palette.primary} />
                            </Avatar>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{ fontSize: 12, display: "block" }}
                                ellipsis
                              >
                                {item.item_name || item.name || `Item #${item.id}`}
                              </Text>
                              {item.selected_modifiers &&
                                item.selected_modifiers.length > 0 && (
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 10, display: "block" }}
                                  >
                                    {item.selected_modifiers
                                      .map((m) => m.name || m)
                                      .join(", ")}
                                  </Text>
                                )}
                            </div>
                            <Space size={8} align="center">
                              <Text type="secondary">x{item.quantity}</Text>
                              <Text strong style={{ flexShrink: 0 }}>
                                {formatCurrency(
                                  item.subtotal ||
                                    item.unit_price * item.quantity,
                                )}
                              </Text>
                            </Space>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── Edit Order Modal ───────────────────────── */}
      <Modal
        title={`Edit Order #${editingOrder?.order_number || editingOrder?.id || ""}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={saveOrder}
        confirmLoading={submitting}
        okText="Save Changes"
        width={480}
        forceRender
      >
        <Form form={editForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select a status." }]}
          >
            <Select
              placeholder="Select status"
              options={[
                { value: "pending", label: "Pending" },
                { value: "accepted", label: "Accepted" },
                { value: "preparing", label: "Preparing" },
                { value: "ready", label: "Ready" },
                { value: "dispatched", label: "Dispatched" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Payment Method"
            name="payment_method"
            rules={[{ required: true, message: "Please select a payment method." }]}
          >
            <Select
              placeholder="Select payment method"
              options={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "wallet", label: "Wallet" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Paid" name="is_paid" valuePropName="checked">
            <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
          </Form.Item>
          <Form.Item label="Customer Notes" name="customer_notes">
            <Input.TextArea rows={3} placeholder="Notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default CustomerHistoryPage;
