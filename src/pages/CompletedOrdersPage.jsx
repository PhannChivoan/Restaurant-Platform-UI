import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Drawer,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  Bike,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  Star,
  Tag as TagIcon,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import ModulePage from "../components/ui/ModulePage";
import { request } from "../utils/request";
import { palette } from "../constants/theme";
import { DotsRing } from "@/components/ui/dots-ring";

/* =========================================================
   HELPERS
========================================================= */

const { Text } = Typography;

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "-";

const formatTime = (date) => (date ? dayjs(date).format("HH:mm") : "--:--");

const getDeliveryMinutes = (from, to) => {
  if (!from || !to) return null;
  return dayjs(to).diff(dayjs(from), "minute");
};

const paymentMethodColor = {
  cash: "green",
  card: "blue",
  wallet: "purple",
  bank_transfer: "cyan",
};

const exportCSV = (orders) => {
  const headers = [
    "Order",
    "Restaurant",
    "Rider",
    "Duration (min)",
    "Delivered",
    "Subtotal",
    "Delivery Fee",
    "Surge",
    "Discount",
    "Tax",
    "Total",
    "Payment",
    "Paid",
    "Customer",
  ];
  const rows = orders.map((o) => [
    o.order_number || `#${o.id}`,
    o.restaurant?.name || "",
    o.delivery_assignment?.rider?.user?.name || "Unassigned",
    getDeliveryMinutes(o.accepted_at, o.delivered_at) ?? "",
    o.delivered_at ? dayjs(o.delivered_at).format("YYYY-MM-DD HH:mm") : "",
    o.subtotal ?? "",
    o.delivery_fee ?? "",
    o.surge_fee ?? "",
    o.discount ?? "",
    o.tax ?? "",
    o.total ?? "",
    o.payment_method || "",
    o.is_paid ? "Yes" : "No",
    o.customer?.name || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `completed-orders-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("CSV exported successfully");
};

/* =========================================================
   DRAWER LOADING SKELETON
========================================================= */

const DrawerSkeleton = () => (
  <div
    style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}
  >
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} size="small" style={{ borderRadius: 2 }}>
        <Skeleton active paragraph={{ rows: i === 1 ? 2 : 3 }} title={i <= 2} />
      </Card>
    ))}
  </div>
);

/* =========================================================
   ORDER DETAIL DRAWER
========================================================= */

const OrderDetailDrawer = ({ order, open, onClose, loading, navigate }) => {
  if (!open) return null;

  const timelineItems = order
    ? [
        {
          color: "green",
          children: (
            <>
              <Text strong>Created</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.created_at)}
              </Text>
            </>
          ),
        },
        order.accepted_at && {
          color: "blue",
          children: (
            <>
              <Text strong>Accepted</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.accepted_at)}
              </Text>
            </>
          ),
        },
        order.preparing_at && {
          color: "orange",
          children: (
            <>
              <Text strong>Preparing</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.preparing_at)}
              </Text>
            </>
          ),
        },
        order.ready_at && {
          color: "purple",
          children: (
            <>
              <Text strong>Ready</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.ready_at)}
              </Text>
            </>
          ),
        },
        order.dispatched_at && {
          color: "blue",
          children: (
            <>
              <Text strong>Dispatched</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.dispatched_at)}
              </Text>
            </>
          ),
        },
        order.delivered_at && {
          color: "green",
          children: (
            <>
              <Text strong>Delivered</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(order.delivered_at)}
              </Text>
            </>
          ),
        },
      ].filter(Boolean)
    : [];

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: "#F0FDF4",
              color: palette.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {order?.order_number || `#${order?.id}`}
            </div>
            <div style={{ fontSize: 11, color: palette.muted }}>
              {order?.restaurant?.name || "Unknown restaurant"}
            </div>
          </div>
        </div>
      }
      placement="right"
      size={440}
      open={open}
      onClose={onClose}
      extra={
        <Tag
          color="green"
          style={{ margin: 0, borderRadius: 2, fontWeight: 600 }}
        >
          Delivered
        </Tag>
      }
    >
      {loading && <DrawerSkeleton />}

      {!loading && order && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* DELIVERY TIME GRID */}
          <Card
            size="small"
            style={{ borderRadius: 2 }}
            styles={{ body: { padding: 12 } }}
          >
            <Row gutter={[8, 8]}>
              {[
                {
                  label: "ACCEPTED",
                  value: formatTime(order.accepted_at),
                  sub: order.accepted_at
                    ? dayjs(order.accepted_at).format("DD MMM")
                    : null,
                },
                {
                  label: "PREPARING",
                  value: formatTime(order.preparing_at),
                  sub: order.preparing_at
                    ? dayjs(order.preparing_at).format("DD MMM")
                    : null,
                },
                {
                  label: "READY",
                  value: formatTime(order.ready_at),
                  sub: order.ready_at
                    ? dayjs(order.ready_at).format("DD MMM")
                    : null,
                },
                {
                  label: "DISPATCHED",
                  value: formatTime(order.dispatched_at),
                  sub: order.dispatched_at
                    ? dayjs(order.dispatched_at).format("DD MMM")
                    : null,
                },
                {
                  label: "DELIVERED",
                  value: formatTime(order.delivered_at),
                  sub: order.delivered_at
                    ? dayjs(order.delivered_at).format("DD MMM")
                    : null,
                },
                {
                  label: "DURATION",
                  value: (() => {
                    const mins = getDeliveryMinutes(
                      order.accepted_at,
                      order.delivered_at,
                    );
                    return mins !== null ? `${mins}m` : "-";
                  })(),
                  sub: null,
                },
              ].map((item) => (
                <Col span={8} key={item.label}>
                  <div
                    style={{
                      background: palette.bgSubtle,
                      padding: 8,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        color: palette.faint,
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 14,
                        fontWeight: 700,
                        color: palette.ink,
                      }}
                    >
                      {item.value}
                    </div>
                    {item.sub && (
                      <div
                        style={{
                          fontSize: 9,
                          color: palette.faint,
                          marginTop: 1,
                        }}
                      >
                        {item.sub}
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* CUSTOMER INFO */}
          {order.customer && (
            <Card
              size="small"
              title={
                <>
                  <User size={14} /> Customer
                </>
              }
              style={{ borderRadius: 2 }}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <Text strong>Name:</Text>{" "}
                  <Text>{order.customer.name || "Unknown"}</Text>
                </div>
                {order.customer.phone && (
                  <div>
                    <Text strong>Phone:</Text>{" "}
                    <Text copyable>{order.customer.phone}</Text>
                  </div>
                )}
                {order.customer.email && (
                  <div>
                    <Text strong>Email:</Text>{" "}
                    <Text copyable>{order.customer.email}</Text>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Address:</Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <MapPin
                        size={13}
                        color={palette.primary}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12 }}>
                          {order.deliveryAddress.address}
                          {order.deliveryAddress.city
                            ? `, ${order.deliveryAddress.city}`
                            : ""}
                          {order.deliveryAddress.postal_code
                            ? ` ${order.deliveryAddress.postal_code}`
                            : ""}
                        </Text>
                      </div>
                      {order.deliveryAddress.latitude &&
                        order.deliveryAddress.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={13} color={palette.info} />
                          </a>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* RIDER INFO */}
          {order.deliveryAssignment?.rider &&
            (() => {
              const r = order.deliveryAssignment.rider;
              const user = r.user;
              return (
                <Card
                  size="small"
                  title={
                    <>
                      <Truck size={14} /> Rider
                    </>
                  }
                  style={{ borderRadius: 2 }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div>
                      <Text strong>Name:</Text>{" "}
                      <Text>{user?.name || "Unknown"}</Text>
                    </div>
                    {user?.phone && (
                      <div>
                        <Text strong>Phone:</Text>{" "}
                        <Text copyable>{user.phone}</Text>
                      </div>
                    )}
                    {r.vehicle_type && (
                      <div>
                        <Text strong>Vehicle:</Text>{" "}
                        <Text style={{ textTransform: "capitalize" }}>
                          {r.vehicle_type}
                        </Text>
                      </div>
                    )}
                    {r.license_plate && (
                      <div>
                        <Text strong>License Plate:</Text>{" "}
                        <Text copyable style={{ fontFamily: "monospace" }}>
                          {r.license_plate}
                        </Text>
                      </div>
                    )}
                    {r.rating != null && (
                      <div>
                        <Text strong>Rating:</Text>{" "}
                        <Text>{Number(r.rating).toFixed(1)} / 5</Text>
                        <Star
                          size={11}
                          color={palette.warning}
                          style={{ marginLeft: 3, verticalAlign: "middle" }}
                        />
                      </div>
                    )}
                    {r.total_trips != null && (
                      <div>
                        <Text strong>Total Trips:</Text>{" "}
                        <Text>{r.total_trips}</Text>
                      </div>
                    )}
                    {r.total_earnings != null && (
                      <div>
                        <Text strong>Total Earnings:</Text>{" "}
                        <Text>{formatCurrency(r.total_earnings)}</Text>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()}

          {/* ORDER ITEMS */}
          {order.items?.length > 0 && (
            <Card
              size="small"
              title={
                <>
                  <PackageCheck size={14} /> Items ({order.items.length})
                </>
              }
              style={{ borderRadius: 2 }}
              styles={{ body: { padding: 0 } }}
            >
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    padding: "10px 12px",
                    borderBottom:
                      idx < order.items.length - 1
                        ? `1px solid ${palette.border}`
                        : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 12 }}>
                      {item.quantity}x{" "}
                      {item.item_name || item.menuItem?.name || "Item"}
                    </Text>
                    {item.selected_modifiers &&
                      (() => {
                        try {
                          const mods =
                            typeof item.selected_modifiers === "string"
                              ? JSON.parse(item.selected_modifiers)
                              : item.selected_modifiers;
                          if (Array.isArray(mods) && mods.length > 0) {
                            return (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: palette.faint,
                                  marginTop: 2,
                                }}
                              >
                                {mods
                                  .map(
                                    (m) =>
                                      `${m.modifier || m.name || ""}${m.price ? ` (+$${Number(m.price).toFixed(2)})` : ""}`,
                                  )
                                  .join(", ")}
                              </div>
                            );
                          }
                        } catch {
                          return null;
                        }
                        return null;
                      })()}
                  </div>
                  <Text strong style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatCurrency(
                      item.subtotal || item.unit_price * item.quantity,
                    )}
                  </Text>
                </div>
              ))}
            </Card>
          )}

          {/* PAYMENT BREAKDOWN */}
          <Card
            size="small"
            title={
              <>
                <CreditCard size={14} /> Payment
              </>
            }
            style={{ borderRadius: 2 }}
            styles={{ body: { padding: 12 } }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Subtotal</Text>
                <Text strong>{formatCurrency(order.subtotal)}</Text>
              </div>
              {Number(order.delivery_fee || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">Delivery Fee</Text>
                  <Text strong>{formatCurrency(order.delivery_fee)}</Text>
                </div>
              )}
              {Number(order.surge_fee || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">Surge Fee</Text>
                  <Text strong style={{ color: palette.warning }}>
                    {formatCurrency(order.surge_fee)}
                  </Text>
                </div>
              )}
              {Number(order.discount || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">Discount</Text>
                  <Text strong style={{ color: palette.success }}>
                    -{formatCurrency(order.discount)}
                  </Text>
                </div>
              )}
              {Number(order.tax || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">Tax</Text>
                  <Text strong>{formatCurrency(order.tax)}</Text>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                  paddingTop: 8,
                  borderTop: `1px solid ${palette.border}`,
                }}
              >
                <Text strong>Total</Text>
                <Text strong style={{ fontSize: 16, color: palette.primary }}>
                  {formatCurrency(order.total)}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Space size={4}>
                  <Wallet size={12} color={palette.faint} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Method:
                  </Text>
                  <Tag
                    color={
                      paymentMethodColor[order.payment_method] || "default"
                    }
                    style={{ margin: 0, borderRadius: 2 }}
                  >
                    {order.payment_method || "-"}
                  </Tag>
                </Space>
                <Tag
                  color={order.is_paid ? "green" : "orange"}
                  style={{ margin: 0, borderRadius: 2, fontWeight: 600 }}
                >
                  {order.is_paid ? "Paid" : "Unpaid"}
                </Tag>
              </div>
            </div>
          </Card>

          {/* CUSTOMER NOTES */}
          {order.customer_notes && (
            <Card
              size="small"
              title={
                <>
                  <FileText size={14} /> Customer Notes
                </>
              }
              style={{ borderRadius: 2 }}
              styles={{ body: { padding: 12 } }}
            >
              <Text italic style={{ fontSize: 12 }}>
                "{order.customer_notes}"
              </Text>
            </Card>
          )}

          {/* ORDER TIMELINE */}
          {timelineItems.length > 0 && (
            <Card
              size="small"
              title={
                <>
                  <Clock3 size={14} /> Order Timeline
                </>
              }
              style={{ borderRadius: 2 }}
              styles={{ body: { padding: 12 } }}
            >
              <Timeline items={timelineItems} />
            </Card>
          )}

          {/* ACTIONS */}
          <Card
            size="small"
            title={
              <>
                <TagIcon size={14} /> Actions
              </>
            }
            style={{ borderRadius: 2 }}
            styles={{ body: { padding: 12 } }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* CONTACT */}
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: palette.faint,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Contact
                </div>
                <Space wrap size={6}>
                  {order.deliveryAssignment?.rider?.user?.phone && (
                    <a
                      href={`tel:${order.deliveryAssignment.rider.user.phone}`}
                    >
                      <Button
                        size="small"
                        icon={<Phone size={13} />}
                        style={{
                          borderColor: palette.success,
                          color: palette.success,
                          borderRadius: 2,
                        }}
                      >
                        Call Rider
                      </Button>
                    </a>
                  )}
                  {order.customer?.phone && (
                    <a href={`tel:${order.customer.phone}`}>
                      <Button
                        size="small"
                        icon={<Phone size={13} />}
                        style={{
                          borderColor: palette.info,
                          color: palette.info,
                          borderRadius: 2,
                        }}
                      >
                        Call Customer
                      </Button>
                    </a>
                  )}
                </Space>
              </div>

              {/* NAVIGATE */}
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: palette.faint,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Navigate
                </div>
                <Space wrap size={6}>
                  {order.deliveryAddress?.latitude &&
                    order.deliveryAddress?.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="small"
                          icon={<MapPin size={13} />}
                          style={{ borderRadius: 2 }}
                        >
                          View on Map
                        </Button>
                      </a>
                    )}
                  {order.customer?.id && (
                    <Button
                      size="small"
                      icon={<User size={13} />}
                      onClick={() =>
                        navigate(`/customers/history?id=${order.customer.id}`)
                      }
                      style={{ borderRadius: 2 }}
                    >
                      Customer Orders
                    </Button>
                  )}
                  {order.deliveryAssignment?.rider?.id && (
                    <Button
                      size="small"
                      icon={<Bike size={13} />}
                      onClick={() =>
                        navigate(
                          `/dispatch/earnings?rider=${order.deliveryAssignment.rider.id}`,
                        )
                      }
                      style={{ borderRadius: 2 }}
                    >
                      Rider Earnings
                    </Button>
                  )}
                </Space>
              </div>

              {/* RECEIPT */}
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: palette.faint,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Receipt
                </div>
                <Space wrap size={6}>
                  <Button
                    size="small"
                    icon={<Download size={13} />}
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) return;
                      const items = (order.items || [])
                        .map((item) => {
                          let mods = "";
                          try {
                            const m =
                              typeof item.selected_modifiers === "string"
                                ? JSON.parse(item.selected_modifiers)
                                : item.selected_modifiers;
                            if (Array.isArray(m) && m.length > 0) {
                              mods = m
                                .map(
                                  (x) =>
                                    `  + ${x.modifier || x.name || ""}${x.price ? ` $${Number(x.price).toFixed(2)}` : ""}`,
                                )
                                .join("\n");
                            }
                          } catch {}
                          return `  ${item.quantity}x ${item.item_name || item.menuItem?.name || "Item"}  $${Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}${mods ? "\n" + mods : ""}`;
                        })
                        .join("\n\n");

                      w.document
                        .write(`<pre style="font-family:monospace;padding:20px;max-width:400px">
================================
        ORDER RECEIPT
================================

Order: ${order.order_number || `#${order.id}`}
Date: ${order.delivered_at ? dayjs(order.delivered_at).format("DD MMM YYYY HH:mm") : "-"}
Restaurant: ${order.restaurant?.name || "-"}
Rider: ${order.deliveryAssignment?.rider?.user?.name || "Unassigned"}

--------------------------------
ITEMS
--------------------------------
${items}

--------------------------------
PAYMENT
--------------------------------
Subtotal:    $${Number(order.subtotal || 0).toFixed(2)}
Delivery:    $${Number(order.delivery_fee || 0).toFixed(2)}
Surge:       $${Number(order.surge_fee || 0).toFixed(2)}
Discount:   -$${Number(order.discount || 0).toFixed(2)}
Tax:         $${Number(order.tax || 0).toFixed(2)}
--------------------------------
TOTAL:       $${Number(order.total || 0).toFixed(2)}

Method: ${order.payment_method || "-"}
Status: ${order.is_paid ? "PAID" : "UNPAID"}

================================
Thank you for your order!
================================</pre>`);
                      w.document.close();
                      w.print();
                    }}
                    style={{ borderRadius: 2 }}
                  >
                    Print Receipt
                  </Button>
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
   COMPLETED ORDERS PAGE
========================================================= */

const CompletedOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [restaurantFilter, setRestaurantFilter] = useState(null);
  const [riderFilter, setRiderFilter] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isPaid, setIsPaid] = useState(null);
  const [sortBy, setSortBy] = useState("delivered_desc");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  /* =======================================================
     LOAD DATA (server-side)
  ======================================================= */

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (search.trim()) params.set("search", search.trim());
    if (dateRange?.[0])
      params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
    if (dateRange?.[1])
      params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
    if (restaurantFilter) params.set("restaurant_id", String(restaurantFilter));
    if (riderFilter) params.set("rider_id", String(riderFilter));
    if (paymentMethod) params.set("payment_method", paymentMethod);
    if (isPaid) params.set("is_paid", isPaid);
    if (sortBy) params.set("sort_by", sortBy);

    const response = await request(
      `orders/completed?${params.toString()}`,
      "GET",
    );

    if (Array.isArray(response?.data)) {
      setOrders(response.data);
      setTotalOrders(response.total || response.data.length);
      setStats(response.stats || {});
    } else {
      setError(response?.message || "Unable to load completed orders.");
    }

    setLoading(false);
  }, [
    page,
    pageSize,
    search,
    dateRange,
    restaurantFilter,
    riderFilter,
    paymentMethod,
    isPaid,
    sortBy,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =======================================================
     SEARCH debounce
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =======================================================
     FILTER OPTIONS (derived from loaded data)
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

  const riderOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const rider = o.delivery_assignment?.rider;
      if (rider?.id && rider?.user?.name) {
        map.set(rider.id, rider.user.name);
      }
    });
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ label: name, value: id }));
  }, [orders]);

  /* =======================================================
     ACTIVE FILTER COUNT
  ======================================================= */

  const activeFilterCount = [
    search,
    dateRange,
    restaurantFilter,
    riderFilter,
    paymentMethod,
    isPaid,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateRange(null);
    setRestaurantFilter(null);
    setRiderFilter(null);
    setPaymentMethod(null);
    setIsPaid(null);
    setSortBy("delivered_desc");
    setPage(1);
  };

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
     TABLE COLUMNS
  ======================================================= */

  const columns = [
    {
      title: "Order",
      key: "order",
      width: 160,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>
            {record.order_number || `#${record.id}`}
          </Text>
          {record.customer_notes && (
            <div
              style={{
                fontSize: 9,
                color: palette.faint,
                marginTop: 1,
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              "{record.customer_notes}"
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Restaurant",
      key: "restaurant",
      width: 140,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Building2 size={12} color={palette.faint} />
          <Text style={{ fontSize: 12 }}>{record.restaurant?.name || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Rider",
      key: "rider",
      width: 130,
      render: (_, record) => {
        const name = record.delivery_assignment?.rider?.user?.name;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Bike size={12} color={palette.faint} />
            <Text
              style={{
                fontSize: 12,
                color: name ? palette.ink : palette.faint,
              }}
            >
              {name || "Unassigned"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Duration",
      key: "duration",
      width: 90,
      render: (_, record) => {
        const mins = getDeliveryMinutes(
          record.accepted_at,
          record.delivered_at,
        );
        if (mins === null)
          return (
            <Text type="secondary" style={{ fontSize: 11 }}>
              -
            </Text>
          );
        const isOnTime = mins <= 30;
        return (
          <Space size={3}>
            <Clock3
              size={11}
              color={isOnTime ? palette.success : palette.warning}
            />
            <Text
              strong
              style={{
                fontSize: 11,
                color: isOnTime ? palette.success : palette.warning,
              }}
            >
              {mins}m
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Delivered",
      dataIndex: "delivered_at",
      key: "delivered",
      width: 140,
      render: (val) => (
        <Text
          type="secondary"
          style={{ fontSize: 11, fontFamily: "monospace" }}
        >
          {formatDate(val)}
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
        <Text strong style={{ fontSize: 12 }}>
          {formatCurrency(val)}
        </Text>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      width: 120,
      render: (_, record) => (
        <Space size={4} direction="vertical" size={2}>
          <Tag
            color={paymentMethodColor[record.payment_method] || "default"}
            style={{ margin: 0, borderRadius: 2, fontSize: 10 }}
          >
            {record.payment_method || "-"}
          </Tag>
          <Tag
            color={record.is_paid ? "green" : "orange"}
            style={{ margin: 0, borderRadius: 2, fontSize: 9 }}
          >
            {record.is_paid ? "Paid" : "Unpaid"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "",
      key: "action",
      width: 40,
      render: (_, record) => (
        <Tooltip title="View details">
          <Button
            type="text"
            size="small"
            icon={<ExternalLink size={13} />}
            onClick={(e) => {
              e.stopPropagation();
              openOrder(record);
            }}
            style={{ color: palette.muted }}
          />
        </Tooltip>
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
          colorText: palette.ink,
          colorTextSecondary: palette.muted,
          colorBorder: palette.border,
          borderRadius: 2,
          fontSize: 13,
        },
        components: {
          Table: {
            headerBg: palette.primary,
            headerColor: palette.inkInverse,
            headerBorderRadius: 0,
          },
          Button: { borderRadius: 2 },
          Input: { borderRadius: 2 },
          Select: { borderRadius: 2 },
          Card: { borderRadius: 2 },
          Drawer: { paddingLG: 20 },
        },
      }}
    >
      <div>
        {/* STATS HEADER */}
        <ModulePage
          title="Completed Orders"
          description="Review fulfilled orders, delivery performance, and completed revenue."
          icon={CheckCircle2}
          stats={[
            {
              label: "Completed today",
              value: stats.completed_today || 0,
              icon: CheckCircle2,
              iconBackground: "#F0FDF4",
              color: palette.success,
              description: "Orders delivered today",
            },
            {
              label: "This week",
              value: stats.completed_this_week || 0,
              icon: PackageCheck,
              iconBackground: "#EFF6FF",
              color: palette.info,
              description: "Weekly completed",
            },
            {
              label: "On-time rate",
              value: stats.on_time_delivery || 0,
              suffix: "%",
              icon: Clock3,
              iconBackground: "#FFF7ED",
              color: palette.primary,
              description: "Within 30 min SLA",
            },
            {
              label: "Customer rating",
              value: stats.customer_rating || 0,
              suffix: "/ 5",
              icon: Star,
              iconBackground: "#FFFBEB",
              color: palette.warning,
              description: "Average rating",
            },
          ]}
          loading={{
            spinning: loading,
            indicator: (
              <DotsRing
                style={{ width: 32, height: 32, color: palette.primary }}
              />
            ),
          }}
          error={error}
        />

        {/* TABLE CARD */}
        <Card
          style={{ marginTop: 14 }}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: "#F0FDF4",
                  color: palette.success,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Completed Orders
                </div>
                <div style={{ fontSize: 11, color: palette.muted }}>
                  {totalOrders} orders
                  {activeFilterCount > 0 && (
                    <span style={{ color: palette.primary }}>
                      {" "}
                      ({activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active)
                    </span>
                  )}
                </div>
              </div>
            </div>
          }
          extra={
            <Button
              size="small"
              icon={<Download size={13} />}
              onClick={() => exportCSV(orders)}
              style={{ borderRadius: 2 }}
            >
              Export CSV
            </Button>
          }
        >
          {/* FILTERS */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Input
                size="small"
                prefix={<Search size={13} color={palette.faint} />}
                allowClear
                placeholder="Search order, restaurant, rider..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: 220, borderRadius: 2 }}
              />

              <DatePicker.RangePicker
                size="small"
                value={dateRange}
                onChange={(val) => {
                  setDateRange(val);
                  setPage(1);
                }}
                allowEmpty={[true, true]}
                format="DD MMM YYYY"
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Yesterday",
                    value: [
                      dayjs().subtract(1, "day"),
                      dayjs().subtract(1, "day"),
                    ],
                  },
                  {
                    label: "Last 7 days",
                    value: [dayjs().subtract(7, "day"), dayjs()],
                  },
                  {
                    label: "Last 30 days",
                    value: [dayjs().subtract(30, "day"), dayjs()],
                  },
                ]}
                style={{ width: 260, borderRadius: 2 }}
              />

              <Select
                size="small"
                allowClear
                showSearch
                placeholder="Restaurant"
                value={restaurantFilter}
                onChange={(v) => {
                  setRestaurantFilter(v);
                  setPage(1);
                }}
                options={restaurantOptions}
                style={{ width: 160, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <Select
                size="small"
                allowClear
                showSearch
                placeholder="Rider"
                value={riderFilter}
                onChange={(v) => {
                  setRiderFilter(v);
                  setPage(1);
                }}
                options={riderOptions}
                style={{ width: 150, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <Select
                size="small"
                allowClear
                placeholder="Payment"
                value={paymentMethod}
                onChange={(v) => {
                  setPaymentMethod(v);
                  setPage(1);
                }}
                options={[
                  { label: "Cash", value: "cash" },
                  { label: "Card", value: "card" },
                  { label: "Wallet", value: "wallet" },
                  { label: "Bank Transfer", value: "bank_transfer" },
                ]}
                style={{ width: 130, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <Select
                size="small"
                allowClear
                placeholder="Paid status"
                value={isPaid}
                onChange={(v) => {
                  setIsPaid(v);
                  setPage(1);
                }}
                options={[
                  { label: "Paid", value: "true" },
                  { label: "Unpaid", value: "false" },
                ]}
                style={{ width: 120, borderRadius: 2 }}
                popupMatchSelectWidth={false}
              />

              <Select
                size="small"
                value={sortBy}
                onChange={(v) => {
                  setSortBy(v);
                  setPage(1);
                }}
                style={{ width: 160, borderRadius: 2 }}
                popupMatchSelectWidth={false}
                options={[
                  { label: "Newest first", value: "delivered_desc" },
                  { label: "Oldest first", value: "delivered_asc" },
                  { label: "Highest total", value: "total_desc" },
                  { label: "Lowest total", value: "total_asc" },
                ]}
              />

              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  type="link"
                  icon={<X size={12} />}
                  onClick={clearAllFilters}
                  style={{ padding: 0, color: palette.danger, fontSize: 11 }}
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* ACTIVE FILTER TAGS */}
            {activeFilterCount > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                }}
              >
                {search && (
                  <Tag
                    closable
                    onClose={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    Search: {search}
                  </Tag>
                )}
                {dateRange && (
                  <Tag
                    closable
                    onClose={() => setDateRange(null)}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    {dayjs(dateRange[0]).format("DD MMM")} –{" "}
                    {dayjs(dateRange[1]).format("DD MMM")}
                  </Tag>
                )}
                {restaurantFilter && (
                  <Tag
                    closable
                    onClose={() => setRestaurantFilter(null)}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    Restaurant:{" "}
                    {
                      restaurantOptions.find(
                        (o) => o.value === restaurantFilter,
                      )?.label
                    }
                  </Tag>
                )}
                {riderFilter && (
                  <Tag
                    closable
                    onClose={() => setRiderFilter(null)}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    Rider:{" "}
                    {riderOptions.find((o) => o.value === riderFilter)?.label}
                  </Tag>
                )}
                {paymentMethod && (
                  <Tag
                    closable
                    onClose={() => setPaymentMethod(null)}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    Payment: {paymentMethod}
                  </Tag>
                )}
                {isPaid && (
                  <Tag
                    closable
                    onClose={() => setIsPaid(null)}
                    style={{ margin: 0, fontSize: 10, borderRadius: 2 }}
                  >
                    {isPaid === "true" ? "Paid" : "Unpaid"}
                  </Tag>
                )}
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div
              style={{
                padding: "10px 16px",
                background: "#FEF2F2",
                borderBottom: `1px solid ${palette.danger}`,
                color: palette.danger,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* TABLE */}
          <Table
            rowKey="id"
            columns={columns}
            dataSource={orders}
            size="small"
            scroll={{ x: "max-content" }}
            loading={
              loading && {
                indicator: (
                  <DotsRing
                    style={{ width: 32, height: 32, color: palette.primary }}
                  />
                ),
              }
            }
            locale={{ emptyText: "No completed orders found" }}
            onRow={(record) => ({
              onClick: () => openOrder(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: page,
              pageSize,
              total: totalOrders,
              showSizeChanger: true,
              pageSizeOptions: ["10", "15", "25", "50"],
              onChange: (newPage, newPageSize) => {
                setPageSize(newPageSize);
                setPage(newPage);
              },
              disabled: loading,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} orders`,
            }}
            components={{
              header: {
                cell: (props) => (
                  <th
                    {...props}
                    style={{ ...props.style, borderInlineEnd: "none" }}
                  />
                ),
              },
            }}
          />
        </Card>

        {/* DETAIL DRAWER */}
        <OrderDetailDrawer
          order={selectedOrder}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedOrder(null);
          }}
          loading={detailLoading}
          navigate={navigate}
        />
      </div>
    </ConfigProvider>
  );
};

export default CompletedOrdersPage;
