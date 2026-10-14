import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  Download,
  Ellipsis,
  ExternalLink,
  FileText,
  Filter,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Tag as TagIcon,
  Timer,
  Truck,
  User,
  Wallet,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import dayjs from "dayjs";
import ModulePage from "../components/ui/ModulePage";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "-";

const formatTime = (date) => (date ? dayjs(date).format("HH:mm") : "--:--");

const formatStatus = (status = "") =>
  status
    ? status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ")
    : "-";

const minutesSince = (date) =>
  date ? Math.max(0, Math.floor((Date.now() - new Date(date)) / 60000)) : 0;

const statusColor = {
  pending: "gold",
  accepted: "blue",
  preparing: "processing",
  ready: "green",
  dispatched: "purple",
  delivered: "green",
  cancelled: "red",
  rejected: "red",
};

/* =========================================================
   EXPORT CSV
========================================================= */

const exportCSV = (orders) => {
  const headers = [
    "Order", "Restaurant", "Branch", "Customer", "Items",
    "Subtotal", "Total", "Payment", "Paid", "Status", "Received", "Age (min)",
  ];
  const rows = orders.map((o) => [
    o.order_number || `#${o.id}`,
    o.restaurant?.name || "",
    o.branch?.name || "",
    o.customer?.name || o.customer?.email || "",
    o.items?.reduce((t, i) => t + i.quantity, 0) || 0,
    o.subtotal ?? "",
    o.total ?? "",
    o.payment_method || "",
    o.is_paid ? "Yes" : "No",
    o.status || "",
    o.created_at ? dayjs(o.created_at).format("YYYY-MM-DD HH:mm") : "",
    minutesSince(o.created_at),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitchen-orders-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("CSV exported successfully");
};

/* =========================================================
   DRAWER LOADING SKELETON
========================================================= */

const DrawerSkeleton = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} size="small" style={{ borderRadius: 2 }}>
        <Skeleton active paragraph={{ rows: i === 1 ? 2 : 3 }} title={i <= 2} />
      </Card>
    ))}
  </div>
);

/* =========================================================
   ORDER DETAIL DRAWER
========================================================= */

const OrderDetailDrawer = ({ order, open, onClose, loading, onAction, actionLoading }) => {
  if (!open) return null;

  const timelineItems = order
    ? [
        { color: "green", children: <><Text strong>Created</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.created_at)}</Text></> },
        order.accepted_at && { color: "blue", children: <><Text strong>Accepted</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.accepted_at)}</Text></> },
        order.preparing_at && { color: "orange", children: <><Text strong>Preparing</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.preparing_at)}</Text></> },
        order.ready_at && { color: "purple", children: <><Text strong>Ready</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.ready_at)}</Text></> },
        order.cancelled_at && { color: "red", children: <><Text strong>Cancelled</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.cancelled_at)}</Text></> },
      ].filter(Boolean)
    : [];

  const age = minutesSince(order?.created_at);

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 2,
            background: statusColor[order?.status] === "pending" ? "#FFFBEB"
              : statusColor[order?.status] === "accepted" ? "#EFF6FF"
              : statusColor[order?.status] === "preparing" ? "#F5F3FF"
              : "#F0FDF4",
            color: palette[statusColor[order?.status]] || palette.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Clock3 size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{order?.order_number || `#${order?.id}`}</div>
            <div style={{ fontSize: 11, color: palette.muted }}>{order?.restaurant?.name || "Unknown restaurant"}</div>
          </div>
        </div>
      }
      placement="right"
      size={440}
      open={open}
      onClose={onClose}
      extra={
        <Tag color={statusColor[order?.status]} style={{ margin: 0, borderRadius: 2, fontWeight: 600 }}>
          {formatStatus(order?.status)}
        </Tag>
      }
    >
      {loading && <DrawerSkeleton />}

      {!loading && order && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* STATUS GRID */}
          <Card size="small" style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
            <Row gutter={[8, 8]}>
              {[
                { label: "STATUS", value: formatStatus(order.status) },
                { label: "AGE", value: `${age} min`, color: age >= 15 ? palette.error : age >= 5 ? palette.warning : palette.success },
                { label: "ITEMS", value: order.items?.length || 0 },
                { label: "TOTAL", value: formatCurrency(order.total) },
              ].map((item) => (
                <Col span={6} key={item.label}>
                  <div style={{ background: palette.bgSubtle, padding: 8, border: `1px solid ${palette.border}`, borderRadius: 2 }}>
                    <div style={{ color: palette.faint, fontSize: 9, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ marginTop: 2, fontSize: 14, fontWeight: 700, color: item.color || palette.ink }}>{item.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* RESTAURANT */}
          {order.restaurant && (
            <Card size="small" title={<><Building2 size={14} /> Restaurant</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div><Text strong>Name:</Text> <Text>{order.restaurant.name}</Text></div>
                {order.restaurant.phone && <div><Text strong>Phone:</Text> <Text copyable>{order.restaurant.phone}</Text></div>}
                {order.restaurant.address && <div><Text strong>Address:</Text> <Text>{order.restaurant.address}</Text></div>}
                {order.branch && <div><Text strong>Branch:</Text> <Text>{order.branch.name}</Text></div>}
              </div>
            </Card>
          )}

          {/* CUSTOMER */}
          {order.customer && (
            <Card size="small" title={<><User size={14} /> Customer</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div><Text strong>Name:</Text> <Text>{order.customer.name || "Unknown"}</Text></div>
                {order.customer.phone && <div><Text strong>Phone:</Text> <Text copyable>{order.customer.phone}</Text></div>}
                {order.customer.email && <div><Text strong>Email:</Text> <Text copyable>{order.customer.email}</Text></div>}
                {order.delivery_address && (
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Delivery Address:</Text>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 4 }}>
                      <MapPin size={13} color={palette.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                      <Text style={{ fontSize: 12 }}>
                        {order.delivery_address.address_line_1 || order.delivery_address.address}
                        {order.delivery_address.city ? `, ${order.delivery_address.city}` : ""}
                        {order.delivery_address.postal_code ? ` ${order.delivery_address.postal_code}` : ""}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ITEMS */}
          {order.items?.length > 0 && (
            <Card size="small" title={<><PackageCheck size={14} /> Items ({order.items.length})</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 0 } }}>
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    padding: "10px 12px",
                    borderBottom: idx < order.items.length - 1 ? `1px solid ${palette.border}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 12 }}>
                      {item.quantity}x {item.item_name || item.menuItem?.name || "Item"}
                    </Text>
                    {item.selected_modifiers && (() => {
                      try {
                        const mods = typeof item.selected_modifiers === "string" ? JSON.parse(item.selected_modifiers) : item.selected_modifiers;
                        if (Array.isArray(mods) && mods.length > 0) {
                          return (
                            <div style={{ fontSize: 10, color: palette.faint, marginTop: 2 }}>
                              {mods.map((m) => `${m.modifier || m.name || ""}${m.price ? ` (+$${Number(m.price).toFixed(2)})` : ""}`).join(", ")}
                            </div>
                          );
                        }
                      } catch { return null; }
                      return null;
                    })()}
                  </div>
                  <Text strong style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
                  </Text>
                </div>
              ))}
            </Card>
          )}

          {/* PAYMENT */}
          <Card size="small" title={<><CreditCard size={14} /> Payment</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Subtotal</Text>
                <Text strong>{formatCurrency(order.subtotal)}</Text>
              </div>
              {Number(order.delivery_fee || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text type="secondary">Delivery Fee</Text>
                  <Text strong>{formatCurrency(order.delivery_fee)}</Text>
                </div>
              )}
              {Number(order.surge_fee || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text type="secondary">Surge Fee</Text>
                  <Text strong style={{ color: palette.warning }}>{formatCurrency(order.surge_fee)}</Text>
                </div>
              )}
              {Number(order.discount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text type="secondary">Discount</Text>
                  <Text strong style={{ color: palette.success }}>-{formatCurrency(order.discount)}</Text>
                </div>
              )}
              {Number(order.tax || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text type="secondary">Tax</Text>
                  <Text strong>{formatCurrency(order.tax)}</Text>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: `1px solid ${palette.border}` }}>
                <Text strong>Total</Text>
                <Text strong style={{ fontSize: 16, color: palette.primary }}>{formatCurrency(order.total)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Space size={4}>
                  <Wallet size={12} color={palette.faint} />
                  <Text type="secondary" style={{ fontSize: 12 }}>Method:</Text>
                  <Tag color={order.payment_method === "cash" ? "green" : order.payment_method === "card" ? "blue" : "default"} style={{ margin: 0, borderRadius: 2 }}>
                    {order.payment_method || "-"}
                  </Tag>
                </Space>
                <Tag color={order.is_paid ? "green" : "orange"} style={{ margin: 0, borderRadius: 2, fontWeight: 600 }}>
                  {order.is_paid ? "Paid" : "Unpaid"}
                </Tag>
              </div>
            </div>
          </Card>

          {/* NOTES */}
          {order.customer_notes && (
            <Card size="small" title={<><FileText size={14} /> Customer Notes</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
              <Text italic style={{ fontSize: 12 }}>"{order.customer_notes}"</Text>
            </Card>
          )}

          {/* TIMELINE */}
          {timelineItems.length > 0 && (
            <Card size="small" title={<><Clock3 size={14} /> Order Timeline</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
              <Timeline items={timelineItems} />
            </Card>
          )}

          {/* ACTIONS */}
          <Card size="small" title={<><TagIcon size={14} /> Actions</>} style={{ borderRadius: 2 }} styles={{ body: { padding: 12 } }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase", marginBottom: 6 }}>Kitchen</div>
                <Space wrap size={6}>
                  {order.status === "pending" && (
                    <>
                      <Button size="small" type="primary" icon={<Check size={13} />} loading={actionLoading === "accept"} onClick={() => onAction("accept", order.id)} style={{ borderRadius: 2, background: palette.success, borderColor: palette.success }}>
                        Accept
                      </Button>
                      <Button size="small" danger icon={<XCircle size={13} />} loading={actionLoading === "reject"} onClick={() => onAction("reject", order.id)} style={{ borderRadius: 2 }}>
                        Reject
                      </Button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <Button size="small" type="primary" icon={<ChefHat size={13} />} loading={actionLoading === "startPreparing"} onClick={() => onAction("startPreparing", order.id)} style={{ borderRadius: 2 }}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button size="small" type="primary" icon={<CheckCircle2 size={13} />} loading={actionLoading === "markReady"} onClick={() => onAction("markReady", order.id)} style={{ borderRadius: 2, background: palette.success, borderColor: palette.success }}>
                      Mark Ready
                    </Button>
                  )}
                  {!["delivered", "cancelled", "rejected"].includes(order.status) && (
                    <Button size="small" danger icon={<XCircle size={13} />} loading={actionLoading === "cancel"} onClick={() => onAction("cancel", order.id)} style={{ borderRadius: 2 }}>
                      Cancel
                    </Button>
                  )}
                </Space>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase", marginBottom: 6 }}>Contact</div>
                <Space wrap size={6}>
                  {order.customer?.phone && (
                    <a href={`tel:${order.customer.phone}`}>
                      <Button size="small" icon={<Phone size={13} />} style={{ borderColor: palette.info, color: palette.info, borderRadius: 2 }}>
                        Call Customer
                      </Button>
                    </a>
                  )}
                </Space>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: palette.faint, textTransform: "uppercase", marginBottom: 6 }}>Navigate</div>
                <Space wrap size={6}>
                  {order.delivery_address?.latitude && order.delivery_address?.longitude && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_address.latitude},${order.delivery_address.longitude}`} target="_blank" rel="noopener noreferrer">
                      <Button size="small" icon={<MapPin size={13} />} style={{ borderRadius: 2 }}>View on Map</Button>
                    </a>
                  )}
                </Space>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Drawer>
  );
};

/* =========================================================
   REJECT MODAL
========================================================= */

const RejectModal = ({ open, onCancel, onOk, loading }) => {
  const [reason, setReason] = useState("");

  const handleOk = () => {
    onOk(reason.trim());
    setReason("");
  };

  return (
    <Modal
      title="Reject Order"
      open={open}
      onCancel={() => { onCancel(); setReason(""); }}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Reject"
      okButtonProps={{ danger: true, disabled: !reason.trim() }}
      styles={{
        content: { borderRadius: 2 },
        header: { borderRadius: "2px 2px 0 0" },
        footer: { borderRadius: "0 0 2px 2px" },
      }}
    >
      <Input.TextArea
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Enter the reason for rejecting this order"
      />
    </Modal>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const PendingOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [kitchenMetrics, setKitchenMetrics] = useState({
    pending: 0,
    in_progress: 0,
    ready: 0,
    average_prep_time_minutes: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [restaurantFilter, setRestaurantFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortBy, setSortBy] = useState("created_desc");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const tickRef = useRef(null);

  /* =======================================================
     TICK — live-update age column every 30s
  ======================================================= */

  const [tick, setTick] = useState(0);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(tickRef.current);
  }, []);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (dateRange?.[0]) params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
    if (dateRange?.[1]) params.set("date_to", dateRange[1].format("YYYY-MM-DD"));

    const [queueRes, metricsRes] = await Promise.all([
      request(`orders/queue?${params.toString()}`, "GET"),
      request("kitchen/metrics", "GET"),
    ]);

    if (Array.isArray(queueRes?.data)) {
      setOrders(queueRes.data);
      setTotalOrders(queueRes.total || queueRes.data.length);
    } else {
      setError(queueRes?.message || "Unable to load kitchen orders.");
    }

    if (metricsRes && metricsRes.pending !== undefined) {
      setKitchenMetrics(metricsRes);
    }

    setLoading(false);
  }, [page, pageSize, search, statusFilter, dateRange, refreshKey]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =======================================================
     RESTAURANT OPTIONS (derived from loaded data)
  ======================================================= */

  const restaurantOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o.restaurant?.id && o.restaurant?.name) {
        map.set(o.restaurant.id, o.restaurant.name);
      }
    });
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ label: name, value: id }));
  }, [orders]);

  /* =======================================================
     SORTED + FILTERED ROWS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (restaurantFilter) {
      result = result.filter((o) => String(o.restaurant?.id) === String(restaurantFilter));
    }

    if (sortBy === "created_desc") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "created_asc") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "age_desc") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "total_desc") {
      result.sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (sortBy === "total_asc") {
      result.sort((a, b) => (a.total || 0) - (b.total || 0));
    }

    return result;
  }, [orders, restaurantFilter, sortBy]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleAction = useCallback(async (action, orderId) => {
    if (action === "reject") {
      setRejectTargetId(orderId);
      setRejectModalOpen(true);
      return;
    }

    const endpoints = {
      accept: `orders/${orderId}/accept`,
      startPreparing: `orders/${orderId}/prepare`,
      markReady: `orders/${orderId}/ready`,
      cancel: `orders/${orderId}/cancel`,
    };

    setActionLoading(action);
    const res = await request(endpoints[action], "PATCH", {});
    setActionLoading(null);

    if (res && !res.message) {
      const labels = { accept: "accepted", startPreparing: "preparing", markReady: "marked ready", cancel: "cancelled" };
      message.success(`Order ${labels[action]}`);
      setRefreshKey((k) => k + 1);
      if (drawerOpen && selectedOrder?.id === orderId) {
        setDrawerOpen(false);
        setSelectedOrder(null);
      }
    } else {
      message.error(res?.message || `Failed to ${action} order`);
    }
  }, [drawerOpen, selectedOrder]);

  const handleReject = useCallback(async (reason) => {
    if (!rejectTargetId) return;

    setActionLoading("reject");
    const res = await request(`orders/${rejectTargetId}/reject`, "PATCH", { reason });
    setActionLoading(null);

    if (res && !res.message) {
      message.success("Order rejected");
      setRefreshKey((k) => k + 1);
      if (drawerOpen && selectedOrder?.id === rejectTargetId) {
        setDrawerOpen(false);
        setSelectedOrder(null);
      }
    } else {
      message.error(res?.message || "Failed to reject order");
    }

    setRejectModalOpen(false);
    setRejectTargetId(null);
  }, [rejectTargetId, drawerOpen, selectedOrder]);

  /* =======================================================
     BATCH ACCEPT
  ======================================================= */

  const handleBatchAccept = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;

    const pendingIds = filteredOrders
      .filter((o) => selectedRowKeys.includes(o.key) && o.status === "pending")
      .map((o) => o.id);

    if (pendingIds.length === 0) {
      message.warning("No pending orders selected");
      return;
    }

    let successCount = 0;
    for (const id of pendingIds) {
      const res = await request(`orders/${id}/accept`, "PATCH", {});
      if (res && !res.message) successCount++;
    }

    message.success(`${successCount} order${successCount > 1 ? "s" : ""} accepted`);
    setSelectedRowKeys([]);
    setRefreshKey((k) => k + 1);
  }, [selectedRowKeys, filteredOrders]);

  /* =======================================================
     OPEN ORDER DETAIL
  ======================================================= */

  const openOrder = async (order) => {
    setSelectedOrder(null);
    setDrawerOpen(true);
    setDetailLoading(true);

    try {
      const detail = await request(`orders/${order.id}`, "GET");
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const activeFilterCount = [search, statusFilter, restaurantFilter, dateRange].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter(null);
    setRestaurantFilter(null);
    setDateRange(null);
    setSortBy("created_desc");
    setPage(1);
  };

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const columns = [
    {
      title: "Order",
      key: "order",
      width: 150,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{record.order_number || `#${record.id}`}</Text>
          {record.customer_notes && (
            <div style={{ fontSize: 9, color: palette.faint, marginTop: 1, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              "{record.customer_notes}"
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Restaurant",
      key: "restaurant",
      width: 130,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Building2 size={12} color={palette.faint} />
          <Text style={{ fontSize: 12 }}>{record.restaurant?.name || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Branch",
      key: "branch",
      width: 110,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{record.branch?.name || "-"}</Text>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      width: 120,
      render: (_, record) => (
        <Text style={{ fontSize: 12 }}>{record.customer?.name || record.customer?.email || "-"}</Text>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 12 }}>
          {record.items?.reduce((t, i) => t + i.quantity, 0) || 0}
        </Text>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 90,
      align: "right",
      render: (val) => (
        <Text strong style={{ fontSize: 12 }}>{formatCurrency(val)}</Text>
      ),
    },
    {
      title: "Received",
      dataIndex: "created_at",
      key: "received",
      width: 130,
      render: (val) => (
        <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
          {formatDate(val)}
        </Text>
      ),
    },
    {
      title: "Age",
      key: "age",
      width: 80,
      render: (_, record) => {
        const age = minutesSince(record.created_at);
        return (
          <Tag color={age >= 15 ? "red" : age >= 5 ? "gold" : "green"} style={{ margin: 0, borderRadius: 2 }}>
            {age} min
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={statusColor[status]} style={{ margin: 0, borderRadius: 2 }}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: "",
      key: "action",
      width: 40,
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              ...(record.status === "pending" ? [
                { key: "accept", label: "Accept", icon: <Check size={13} /> },
                { key: "reject", label: "Reject", icon: <XCircle size={13} />, danger: true },
              ] : []),
              ...(record.status === "accepted" ? [
                { key: "prepare", label: "Start Preparing", icon: <ChefHat size={13} /> },
              ] : []),
              ...(record.status === "preparing" ? [
                { key: "ready", label: "Mark Ready", icon: <CheckCircle2 size={13} /> },
              ] : []),
              ...(!["delivered", "cancelled", "rejected"].includes(record.status) ? [
                { key: "cancel", label: "Cancel", icon: <XCircle size={13} />, danger: true },
              ] : []),
              { type: "divider" },
              { key: "view", label: "View Details", icon: <ExternalLink size={13} /> },
            ],
            onClick: ({ key }) => {
              if (key === "accept") handleAction("accept", record.id);
              else if (key === "reject") handleAction("reject", record.id);
              else if (key === "prepare") handleAction("startPreparing", record.id);
              else if (key === "ready") handleAction("markReady", record.id);
              else if (key === "cancel") handleAction("cancel", record.id);
              else if (key === "view") openOrder(record);
            },
          }}
        >
          <Tooltip title="More actions">
            <Button type="text" size="small" icon={<Ellipsis size={15} />} style={{ color: palette.muted }} />
          </Tooltip>
        </Dropdown>
      ),
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: palette.primary,
          colorBgContainer: palette.bg,
          colorText: palette.ink,
          colorTextSecondary: palette.muted,
          colorBorder: palette.border,
          borderRadius: 2,
          fontSize: 13,
        },
        components: {
          Table: { headerBg: palette.primary, headerColor: palette.inkInverse, headerBorderRadius: 0 },
          Button: { borderRadius: 2 },
          Input: { borderRadius: 2 },
          Select: { borderRadius: 2 },
          Card: { borderRadius: 2 },
          Drawer: { paddingLG: 20 },
        },
      }}
    >
      <div>
        {/* STATS */}
        <ModulePage
          title="Kitchen Queue"
          description="Manage pending orders, track preparation status, and process kitchen workflow."
          icon={Clock3}
          stats={[
            {
              label: "Awaiting acceptance",
              value: kitchenMetrics.pending ?? 0,
              icon: Clock3,
              iconBackground: "#FFFBEB",
              color: palette.warning,
              description: "Orders waiting for kitchen review",
            },
            {
              label: "In progress",
              value: kitchenMetrics.in_progress ?? 0,
              icon: ChefHat,
              iconBackground: "#F5F3FF",
              color: palette.info,
              description: "Accepted or being prepared",
            },
            {
              label: "Ready for dispatch",
              value: kitchenMetrics.ready ?? 0,
              icon: PackageCheck,
              iconBackground: "#F0FDF4",
              color: palette.success,
              description: "Orders ready for rider pickup",
            },
            {
              label: "Avg prep time",
              value: kitchenMetrics.average_prep_time_minutes ? Math.round(kitchenMetrics.average_prep_time_minutes) : 0,
              suffix: "min",
              icon: Timer,
              iconBackground: "#EFF6FF",
              color: palette.muted,
              description: "Accepted to ready duration",
            },
          ]}
          loading={loading}
          error={error}
        />

        {/* TABLE CARD */}
        <Card
          style={{ marginTop: 14 }}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 2, background: "#FFFBEB", color: palette.warning, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock3 size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Kitchen Orders</div>
                <div style={{ fontSize: 11, color: palette.muted }}>
                  {totalOrders} orders
                  {activeFilterCount > 0 && <span style={{ color: palette.primary }}> ({activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active)</span>}
                </div>
              </div>
            </div>
          }
          extra={
            <Space size={6}>
              {selectedRowKeys.length > 0 && (
                <Button size="small" type="primary" icon={<Zap size={13} />} onClick={handleBatchAccept} style={{ borderRadius: 2 }}>
                  Accept {selectedRowKeys.length} selected
                </Button>
              )}
              <Button size="small" icon={<Download size={13} />} onClick={() => exportCSV(filteredOrders)} style={{ borderRadius: 2 }}>
                Export CSV
              </Button>
            </Space>
          }
        >
          {/* FILTERS */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Input
                size="small"
                prefix={<Search size={13} color={palette.faint} />}
                suffix={searchInput ? <X size={13} style={{ cursor: "pointer" }} onClick={() => { setSearchInput(""); setSearch(""); }} /> : null}
                placeholder="Search order, restaurant..."
                allowClear={false}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: 220, borderRadius: 2 }}
              />

              <Select
                size="small"
                allowClear
                showSearch
                placeholder="Restaurant"
                value={restaurantFilter}
                onChange={(v) => { setRestaurantFilter(v); setPage(1); }}
                options={restaurantOptions}
                style={{ width: 160, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <Select
                size="small"
                allowClear
                placeholder="Status"
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Accepted", value: "accepted" },
                  { label: "Preparing", value: "preparing" },
                  { label: "Ready", value: "ready" },
                ]}
                style={{ width: 130, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <RangePicker
                size="small"
                value={dateRange}
                onChange={(val) => { setDateRange(val); setPage(1); }}
                allowEmpty={[true, true]}
                format="DD MMM YYYY"
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  { label: "Yesterday", value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")] },
                  { label: "Last 7 days", value: [dayjs().subtract(7, "day"), dayjs()] },
                  { label: "Last 30 days", value: [dayjs().subtract(30, "day"), dayjs()] },
                ]}
                style={{ width: 260, borderRadius: 2 }}
              />

              <Select
                size="small"
                value={sortBy}
                onChange={(v) => setSortBy(v)}
                style={{ width: 160, borderRadius: 2 }}
                popupMatchSelectWidth={false}
                options={[
                  { label: "Newest first", value: "created_desc" },
                  { label: "Oldest first", value: "created_asc" },
                  { label: "Oldest age first", value: "age_desc" },
                  { label: "Highest total", value: "total_desc" },
                  { label: "Lowest total", value: "total_asc" },
                ]}
              />

              <Select
                size="small"
                value={pageSize}
                onChange={(v) => { setPageSize(v); setPage(1); }}
                style={{ width: 115, borderRadius: 2 }}
                popupMatchSelectWidth={false}
                options={[10, 15, 30, 50].map((v) => ({ value: v, label: `${v} per page` }))}
              />

              {activeFilterCount > 0 && (
                <Button size="small" type="link" icon={<X size={12} />} onClick={clearAllFilters} style={{ padding: 0, color: palette.danger, fontSize: 11 }}>
                  Clear all
                </Button>
              )}
            </div>

            {/* ACTIVE FILTER TAGS */}
            {activeFilterCount > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {search && (
                  <Tag closable onClose={() => { setSearchInput(""); setSearch(""); }} style={{ margin: 0, fontSize: 10, borderRadius: 2 }}>
                    Search: {search}
                  </Tag>
                )}
                {restaurantFilter && (
                  <Tag closable onClose={() => setRestaurantFilter(null)} style={{ margin: 0, fontSize: 10, borderRadius: 2 }}>
                    Restaurant: {restaurantOptions.find((o) => o.value === restaurantFilter)?.label}
                  </Tag>
                )}
                {statusFilter && (
                  <Tag closable onClose={() => setStatusFilter(null)} style={{ margin: 0, fontSize: 10, borderRadius: 2 }}>
                    Status: {formatStatus(statusFilter)}
                  </Tag>
                )}
                {dateRange && (
                  <Tag closable onClose={() => setDateRange(null)} style={{ margin: 0, fontSize: 10, borderRadius: 2 }}>
                    {dayjs(dateRange[0]).format("DD MMM")} – {dayjs(dateRange[1]).format("DD MMM")}
                  </Tag>
                )}
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ padding: "10px 16px", background: "#FEF2F2", borderBottom: `1px solid ${palette.danger}`, color: palette.danger, fontSize: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* TABLE */}
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredOrders}
            size="small"
            scroll={{ x: "max-content" }}
            loading={loading}
            onRow={(record) => ({
              onClick: () => openOrder(record),
              style: { cursor: "pointer" },
            })}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled: record.status !== "pending",
              }),
            }}
            pagination={{
              current: page,
              pageSize,
              total: totalOrders,
              showSizeChanger: false,
              onChange: setPage,
              disabled: loading,
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
            }}
          />
        </Card>

        {/* DETAIL DRAWER */}
        <OrderDetailDrawer
          order={selectedOrder}
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
          loading={detailLoading}
          onAction={handleAction}
          actionLoading={actionLoading}
        />

        {/* REJECT MODAL */}
        <RejectModal
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectTargetId(null); }}
          onOk={handleReject}
          loading={actionLoading === "reject"}
        />
      </div>
    </ConfigProvider>
  );
};

export default PendingOrdersPage;
