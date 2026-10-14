import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";

import {
  CheckCircle2,
  Clock3,
  Database,
  Ellipsis,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBag,
  ChefHat,
  Trash2,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { TextArea } = Input;
const { Text } = Typography;

/* =========================================================
   FORMATTERS
========================================================= */

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatStatus = (status = "") =>
  status
    ? status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ")
    : "-";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

/* =========================================================
   STATUS
========================================================= */

const statusColor = {
  pending: "gold",
  accepted: "blue",
  preparing: "processing",
  ready: "cyan",
  dispatched: "purple",
  delivered: "green",
  cancelled: "red",
  rejected: "red",
};

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "accepted",
    label: "Accepted",
  },
  {
    value: "preparing",
    label: "Preparing",
  },
  {
    value: "ready",
    label: "Ready",
  },
  {
    value: "dispatched",
    label: "Dispatched",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

/* =========================================================
   PAYMENT
========================================================= */

const paymentColor = {
  cash: "green",
  card: "blue",
  wallet: "purple",
  bank_transfer: "cyan",
};

const PAYMENT_OPTIONS = [
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "wallet",
    label: "Wallet",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
  },
];

/* =========================================================
   BUSINESS RULES
========================================================= */

const EDITABLE_STATUSES = ["pending", "accepted"];
const DELETABLE_STATUSES = ["pending", "rejected", "cancelled"];

const OrdersPage = () => {
  //===============================
  // All State
  //===============================
  const [form] = Form.useForm();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [status, setStatus] = useState();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [minRating, setMinRating] = useState();
  const [paymentMethod, setPaymentMethod] = useState();
  const [paidState, setPaidState] = useState();
  const [totalOrders, setTotalOrders] = useState(0);

  /* =======================================================
     MODALS
  ======================================================= */

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [saving, setSaving] = useState(false);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus(undefined);
    setDateRange(null);
    setMinRating(undefined);
    setPaymentMethod(undefined);
    setPaidState(undefined);
    setPage(1);
  };

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(Boolean(status)) +
    Number(Boolean(dateRange)) +
    Number(minRating !== undefined) +
    Number(Boolean(paymentMethod)) +
    Number(paidState !== undefined);

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (status) {
        params.set("status", status);
      }
      if (search) params.set("search", search);
      if (dateRange?.[0])
        params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.set("date_to", dateRange[1].format("YYYY-MM-DD"));
      if (minRating !== undefined) params.set("min_rating", String(minRating));
      if (paymentMethod) params.set("payment_method", paymentMethod);
      if (paidState !== undefined) params.set("is_paid", String(paidState));

      const response = await request(`orders?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setOrders(response.data);

        setTotalOrders(
          Number(
            response.total ??
              response.pagination?.total ??
              response.data.length,
          ),
        );
      } else {
        setOrders([]);
        setTotalOrders(0);

        setError(response?.message || "Unable to load orders.");
      }
    } catch (err) {
      console.error("Load orders error:", err);

      setOrders([]);
      setTotalOrders(0);

      setError(err?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;

      await loadOrders();
    };

    run();

    return () => {
      active = false;
    };
  }, [
    page,
    pageSize,
    status,
    search,
    dateRange,
    minRating,
    paymentMethod,
    paidState,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =======================================================
     TABLE ROWS
  ======================================================= */

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        key: order.id,

        raw: order,

        order: order.order_number || `#${order.id}`,

        restaurant:
          order.restaurant?.name || `Restaurant #${order.restaurant_id}`,

        branch: order.branch?.name || `Branch #${order.branch_id}`,

        customer:
          order.customer?.name ||
          order.customer?.email ||
          `Customer #${order.customer_id}`,

        total: formatCurrency(order.total),

        status: order.status,

        paymentMethod: order.payment_method || "-",

        isPaid: Boolean(order.is_paid),

        rating:
          order.average_rating == null
            ? "-"
            : Number(order.average_rating).toFixed(1),

        createdAt: formatDate(order.created_at),
      })),
    [orders],
  );

  /* =======================================================
     STATS
  ======================================================= */

  const stats = [
    {
      label: "Awaiting action",
      value: orders.filter((order) =>
        ["pending", "accepted"].includes(order.status),
      ).length,
      icon: Clock3,

      iconBackground: "#FFFBEB",
      description: "Pending or accepted orders",
    },
    {
      label: "In preparation",
      value: orders.filter((order) => order.status === "preparing").length,
      icon: ChefHat,

      iconBackground: "#F5F3FF",
      description: "Orders currently in the kitchen",
    },
    {
      label: "Completed",
      value: orders.filter((order) => order.status === "delivered").length,
      icon: CheckCircle2,

      iconBackground: "#F0FDF4",
      description: "Successfully delivered orders",
    },
    {
      label: "Total orders",
      value: totalOrders,
      icon: Database,

      iconBackground: "#EFF6FF",
      description: "All matching records",
    },
  ];

  /* =======================================================
     ADD ORDER
  ======================================================= */

  const handleAdd = () => {
    form.resetFields();

    form.setFieldsValue({
      status: "pending",
      payment_method: "cash",
      is_paid: false,
      subtotal: 0,
      delivery_fee: 0,
      surge_fee: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });

    setAddModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const response = await request("orders", "POST", {
        restaurant_id: values.restaurant_id,
        branch_id: values.branch_id,
        delivery_address_id: values.delivery_address_id,
        payment_method: values.payment_method,
        customer_notes: values.customer_notes,
        items: [
          {
            menu_item_id: values.menu_item_id,
            quantity: values.quantity,
          },
        ],
      });

      if (response?.message && response?.errors) {
        message.error(response?.message || "Failed to create order.");
        return;
      }

      message.success("Order created successfully.");

      setAddModalOpen(false);
      form.resetFields();

      await loadOrders();
    } catch (err) {
      if (err?.errorFields) {
        return;
      }

      console.error("Create order error:", err);

      message.error(err?.message || "Failed to create order.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     VIEW ORDER
  ======================================================= */

  const handleView = (order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  /* =======================================================
     EDIT ORDER
  ======================================================= */

  const handleEdit = (order) => {
    if (!EDITABLE_STATUSES.includes(order.status)) {
      message.warning("This order can no longer be edited.");

      return;
    }

    setSelectedOrder(order);

    form.setFieldsValue({
      customer_id: order.customer_id,

      restaurant_id: order.restaurant_id,

      branch_id: order.branch_id,

      delivery_address_id: order.delivery_address_id,

      customer_notes: order.customer_notes,

      payment_method: order.payment_method,

      is_paid: Boolean(order.is_paid),

      status: order.status,

      subtotal: Number(order.subtotal || 0),

      delivery_fee: Number(order.delivery_fee || 0),

      surge_fee: Number(order.surge_fee || 0),

      discount: Number(order.discount || 0),

      tax: Number(order.tax || 0),

      total: Number(order.total || 0),
    });

    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const values = await form.validateFields();

      setSaving(true);

      const response = await request(
        `orders/${selectedOrder.id}`,
        "PUT",
        values,
      );

      if (response?.message) {
        message.error(response?.message || "Failed to update order.");

        return;
      }

      message.success("Order updated successfully.");

      setEditModalOpen(false);
      setSelectedOrder(null);

      await loadOrders();
    } catch (err) {
      if (err?.errorFields) {
        return;
      }

      console.error("Update order error:", err);

      message.error(err?.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE ORDER
  ======================================================= */

  const handleDelete = async (orderId) => {
    try {
      const response = await request(`orders/${orderId}`, "DELETE");

      if (response?.message !== "Order deleted") {
        message.error(response?.message || "Failed to delete order.");

        return;
      }

      message.success("Order deleted successfully.");

      // If deleting the last row on a page,
      if (orders.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadOrders();
      }
    } catch (err) {
      console.error("Delete order error:", err);

      message.error(err?.message || "Failed to delete order.");
    }
  };

  /* =======================================================
     FORM
  ======================================================= */

  const orderForm = (
    <Form form={form} layout="vertical" style={{ borderRadius: 2 }}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addModalOpen && (
          <>
            <Form.Item
              label="Menu Item ID"
              name="menu_item_id"
              rules={[
                { required: true, message: "Please enter menu item ID." },
              ]}
            >
              <InputNumber
                className="!w-full"
                min={1}
                placeholder="Menu item ID"
              />
            </Form.Item>

            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: "Please enter quantity." }]}
            >
              <InputNumber className="!w-full" min={1} precision={0} />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Customer ID"
          name="customer_id"
          rules={[
            {
              required: true,
              message: "Please enter customer ID.",
            },
          ]}
        >
          <InputNumber className="!w-full" min={1} placeholder="Customer ID" />
        </Form.Item>

        <Form.Item
          label="Restaurant ID"
          name="restaurant_id"
          rules={[
            {
              required: true,
              message: "Please enter restaurant ID.",
            },
          ]}
        >
          <InputNumber
            className="!w-full"
            min={1}
            placeholder="Restaurant ID"
          />
        </Form.Item>

        <Form.Item
          label="Branch ID"
          name="branch_id"
          rules={[
            {
              required: true,
              message: "Please enter branch ID.",
            },
          ]}
        >
          <InputNumber className="!w-full" min={1} placeholder="Branch ID" />
        </Form.Item>

        <Form.Item label="Delivery Address ID" name="delivery_address_id">
          <InputNumber className="!w-full" min={1} placeholder="Address ID" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[
            {
              required: true,
              message: "Please select status.",
            },
          ]}
        >
          <Select options={STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Payment Method"
          name="payment_method"
          rules={[
            {
              required: true,
              message: "Please select payment method.",
            },
          ]}
        >
          <Select options={PAYMENT_OPTIONS} />
        </Form.Item>

        <Form.Item label="Subtotal" name="subtotal">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>

        <Form.Item label="Delivery Fee" name="delivery_fee">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>

        <Form.Item label="Surge Fee" name="surge_fee">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>

        <Form.Item label="Discount" name="discount">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>

        <Form.Item label="Tax" name="tax">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>

        <Form.Item label="Total" name="total">
          <InputNumber className="!w-full" min={0} precision={2} prefix="$" />
        </Form.Item>
      </div>

      <Form.Item label="Customer Notes" name="customer_notes">
        <TextArea
          rows={4}
          placeholder="Customer notes..."
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item label="Payment Status" name="is_paid">
        <Select
          options={[
            {
              value: true,
              label: "Paid",
            },
            {
              value: false,
              label: "Unpaid",
            },
          ]}
        />
      </Form.Item>
    </Form>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 2,
        },
      }}
    >
      <>
        <ModulePage
          title="Orders & Kitchen"
          description="Review incoming orders and monitor the platform order lifecycle."
          icon={ShoppingBag}
          stats={stats}
          loading={{
            spinning: loading,
            indicator: (
              <DotsRing
                style={{ width: 32, height: 32, color: palette.primary }}
              />
            ),
          }}
          error={error}
          toolbar={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                width: "100%",
                flexWrap: "nowrap",
              }}
            >
              <Input.Search
                allowClear
                placeholder="Search order, customer, restaurant"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                style={{ flex: "0 0 300px", borderRadius: 2, marginRight: 145 }}
              />

              <DatePicker.RangePicker
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setPage(1);
                }}
                allowEmpty={[true, true]}
                format="YYYY-MM-DD"
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
                  {
                    label: "This month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ],
                  },
                ]}
                style={{ width: 280, borderRadius: 2 }}
              />

              <Select
                allowClear
                placeholder="Rating"
                value={minRating}
                onChange={(value) => {
                  setMinRating(value);
                  setPage(1);
                }}
                options={[1, 2, 3, 4, 5].map((value) => ({
                  value,
                  label: `${value}+ stars`,
                }))}
                style={{ width: 120, borderRadius: 2 }}
              />

              <Select
                allowClear
                placeholder="Payment"
                value={paymentMethod}
                onChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
                options={PAYMENT_OPTIONS}
                style={{ width: 140, borderRadius: 2 }}
              />

              <Select
                allowClear
                placeholder="Paid"
                value={paidState}
                onChange={(value) => {
                  setPaidState(value);
                  setPage(1);
                }}
                options={[
                  { value: true, label: "Paid" },
                  { value: false, label: "Unpaid" },
                ]}
                style={{ width: 120, borderRadius: 2 }}
              />

              <Select
                allowClear
                placeholder="Status"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
                style={{
                  width: 130,
                  borderRadius: 2,
                }}
              />

              <Button
                icon={<RotateCcw size={15} />}
                disabled={activeFilterCount === 0}
                onClick={clearFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
                style={{ borderRadius: 2, width: 100 }}
              >
                Clear
              </Button>

              <Select
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setPage(1);
                }}
                options={[10, 15, 30, 50].map((value) => ({
                  value,
                  label: `${value} per page`,
                }))}
                style={{
                  width: 140,
                  borderRadius: 2,
                }}
              />
              <Button
                type="primary"
                icon={<Plus size={17} />}
                onClick={handleAdd}
              >
                Add Order
              </Button>
            </div>
          }
          pagination={{
            current: page,
            pageSize,
            total: totalOrders,
            showSizeChanger: false,
            onChange: setPage,
            disabled: loading,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
          }}
          columns={[
            {
              title: "NO",
              key: "number",

              width: 70,

              render: (_, __, index) => (page - 1) * pageSize + index + 1,
            },

            {
              title: "Order",
              dataIndex: "order",
              key: "order",

              render: (value) => <Text strong>{value}</Text>,
            },

            {
              title: "Restaurant",
              dataIndex: "restaurant",
              key: "restaurant",
            },

            {
              title: "Branch",
              dataIndex: "branch",
              key: "branch",
            },

            {
              title: "Customer",
              dataIndex: "customer",
              key: "customer",
            },

            {
              title: "Total",
              dataIndex: "total",
              key: "total",

              render: (value) => <Text strong>{value}</Text>,
            },

            {
              title: "Status",
              dataIndex: "status",
              key: "status",

              render: (value) => (
                <Tag color={statusColor[value] || "default"}>
                  {formatStatus(value)}
                </Tag>
              ),
            },

            {
              title: "Payment",
              dataIndex: "paymentMethod",
              key: "paymentMethod",

              render: (value) =>
                value === "-" ? (
                  "-"
                ) : (
                  <Tag color={paymentColor[value] || "default"}>
                    {formatStatus(value)}
                  </Tag>
                ),
            },

            {
              title: "Rating",
              dataIndex: "rating",
              key: "rating",

              render: (value) => (
                <span style={{ color: value === "-" ? "#94a3b8" : "#f97316" }}>
                  ★ {value === "-" ? value : `${value} / 5`}
                </span>
              ),
            },

            {
              title: "Paid",
              dataIndex: "isPaid",
              key: "isPaid",

              render: (isPaid) => (
                <Tag color={isPaid ? "green" : "red"}>
                  {isPaid ? "Paid" : "Unpaid"}
                </Tag>
              ),
            },

            {
              title: "Created",
              dataIndex: "createdAt",
              key: "createdAt",
            },

            /* =============================================
             ACTIONS
          ============================================= */

            {
              title: "Actions",
              key: "actions",
              fixed: "right",

              width: 60,

              render: (_, record) => {
                const order = record.raw;

                const canEdit = EDITABLE_STATUSES.includes(order.status);

                const canDelete = DELETABLE_STATUSES.includes(order.status);

                return (
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        {
                          key: "view",
                          label: "View order",
                          icon: <Eye size={15} />,
                        },
                        ...(canEdit
                          ? [
                              {
                                key: "edit",
                                label: "Edit order",
                                icon: <Pencil size={15} />,
                              },
                            ]
                          : []),
                        ...(canDelete
                          ? [
                              {
                                key: "delete",
                                label: "Delete order",
                                icon: <Trash2 size={15} />,
                                danger: true,
                              },
                            ]
                          : []),
                      ],
                      onClick: ({ key }) => {
                        if (key === "view") handleView(order);
                        if (key === "edit") handleEdit(order);
                        if (key === "delete") handleDelete(order.id);
                      },
                    }}
                  >
                    <Tooltip title="Actions">
                      <Button
                        size="small"
                        icon={<Ellipsis size={16} />}
                        aria-label={`Actions for ${order.order}`}
                        style={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                  </Dropdown>
                );
              },
            },
          ]}
          rows={rows}
          expandable={{
            expandedRowRender: ({ raw }) => (
              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1,
                  sm: 2,
                  lg: 3,
                }}
              >
                <Descriptions.Item label="Order ID">{raw.id}</Descriptions.Item>

                <Descriptions.Item label="Order Number">
                  {raw.order_number || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Customer ID">
                  {raw.customer_id || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Restaurant ID">
                  {raw.restaurant_id || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Branch ID">
                  {raw.branch_id || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Status">
                  <Tag color={statusColor[raw.status] || "default"}>
                    {formatStatus(raw.status)}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Subtotal">
                  {formatCurrency(raw.subtotal)}
                </Descriptions.Item>

                <Descriptions.Item label="Delivery Fee">
                  {formatCurrency(raw.delivery_fee)}
                </Descriptions.Item>

                <Descriptions.Item label="Surge Fee">
                  {formatCurrency(raw.surge_fee)}
                </Descriptions.Item>

                <Descriptions.Item label="Discount">
                  {formatCurrency(raw.discount)}
                </Descriptions.Item>

                <Descriptions.Item label="Tax">
                  {formatCurrency(raw.tax)}
                </Descriptions.Item>

                <Descriptions.Item label="Total">
                  <Text strong>{formatCurrency(raw.total)}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Payment Method">
                  {raw.payment_method ? (
                    <Tag color={paymentColor[raw.payment_method] || "default"}>
                      {formatStatus(raw.payment_method)}
                    </Tag>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Payment Status">
                  <Tag color={raw.is_paid ? "green" : "red"}>
                    {raw.is_paid ? "Paid" : "Unpaid"}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Delivery Address ID">
                  {raw.delivery_address_id || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Customer Notes">
                  {raw.customer_notes || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Created">
                  {formatDate(raw.created_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Updated">
                  {formatDate(raw.updated_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Accepted">
                  {formatDate(raw.accepted_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Preparing">
                  {formatDate(raw.preparing_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Ready">
                  {formatDate(raw.ready_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Dispatched">
                  {formatDate(raw.dispatched_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Delivered">
                  {formatDate(raw.delivered_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Cancelled">
                  {formatDate(raw.cancelled_at)}
                </Descriptions.Item>
              </Descriptions>
            ),
          }}
        />

        {/* ===================================================
          ADD ORDER MODAL
      =================================================== */}

        <Modal
          title="Add New Order"
          open={addModalOpen}
          onCancel={() => setAddModalOpen(false)}
          width={850}
          forceRender
          destroyOnHidden
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
            footer: { borderRadius: "0 0 2px 2px" },
          }}
          footer={
            <Space>
              <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>

              <Button type="primary" loading={saving} onClick={handleCreate}>
                Create Order
              </Button>
            </Space>
          }
        >
          {orderForm}
        </Modal>

        {/* ===================================================
          EDIT ORDER MODAL
      =================================================== */}

        <Modal
          title={
            selectedOrder
              ? `Edit Order ${
                  selectedOrder.order_number || `#${selectedOrder.id}`
                }`
              : "Edit Order"
          }
          open={editModalOpen}
          onCancel={() => {
            setEditModalOpen(false);
            setSelectedOrder(null);
          }}
          width={850}
          forceRender
          destroyOnHidden
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
            footer: { borderRadius: "0 0 2px 2px" },
          }}
          footer={
            <Space>
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>

              <Button type="primary" loading={saving} onClick={handleUpdate}>
                Save Changes
              </Button>
            </Space>
          }
        >
          {orderForm}
        </Modal>

        {/* ===================================================
          VIEW ORDER MODAL
      =================================================== */}

        <Modal
          title={
            selectedOrder
              ? `Order ${selectedOrder.order_number || `#${selectedOrder.id}`}`
              : "Order Details"
          }
          open={viewModalOpen}
          onCancel={() => {
            setViewModalOpen(false);
            setSelectedOrder(null);
          }}
          width={900}
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
            footer: { borderRadius: "0 0 2px 2px" },
          }}
          footer={
            <Button
              onClick={() => {
                setViewModalOpen(false);
                setSelectedOrder(null);
              }}
            >
              Close
            </Button>
          }
        >
          {selectedOrder && (
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <Text type="secondary">Order reference</Text>
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>
                    {selectedOrder.order_number || `#${selectedOrder.id}`}
                  </div>
                  <Text type="secondary">
                    Created {formatDate(selectedOrder.created_at)}
                  </Text>
                </div>
                <Space wrap>
                  <Tag color={statusColor[selectedOrder.status] || "default"}>
                    {formatStatus(selectedOrder.status)}
                  </Tag>
                  <Tag color={selectedOrder.is_paid ? "green" : "red"}>
                    {selectedOrder.is_paid ? "Paid" : "Unpaid"}
                  </Tag>
                </Space>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <Card size="small" title="Customer" style={{ borderRadius: 2 }}>
                  <Text strong>
                    {selectedOrder.customer?.name ||
                      selectedOrder.customer?.email ||
                      `Customer #${selectedOrder.customer_id}`}
                  </Text>
                  <div>
                    <Text type="secondary">
                      ID {selectedOrder.customer_id || "-"}
                    </Text>
                  </div>
                </Card>
                <Card
                  size="small"
                  title="Fulfillment"
                  style={{ borderRadius: 2 }}
                >
                  <Text strong>
                    {selectedOrder.restaurant?.name ||
                      `Restaurant #${selectedOrder.restaurant_id}`}
                  </Text>
                  <div>
                    <Text type="secondary">
                      {selectedOrder.branch?.name ||
                        `Branch #${selectedOrder.branch_id}`}
                    </Text>
                  </div>
                </Card>
                <Card size="small" title="Payment" style={{ borderRadius: 2 }}>
                  <Text strong>
                    {formatStatus(selectedOrder.payment_method)}
                  </Text>
                  <div>
                    <Text type="secondary">
                      Address ID {selectedOrder.delivery_address_id || "-"}
                    </Text>
                  </div>
                </Card>
              </div>

              <Card
                size="small"
                title="Order total"
                style={{ borderRadius: 2 }}
              >
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Subtotal">
                    {formatCurrency(selectedOrder.subtotal)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Delivery fee">
                    {formatCurrency(selectedOrder.delivery_fee)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Surge fee">
                    {formatCurrency(selectedOrder.surge_fee)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Discount">
                    -{formatCurrency(selectedOrder.discount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax">
                    {formatCurrency(selectedOrder.tax)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total">
                    <Text strong>{formatCurrency(selectedOrder.total)}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                <Card
                  size="small"
                  title="Order timeline"
                  style={{ borderRadius: 2 }}
                >
                  <Timeline
                    items={[
                      {
                        title: "Created",
                        content: formatDate(selectedOrder.created_at),
                        color: "blue",
                      },
                      {
                        title: "Accepted",
                        content: formatDate(selectedOrder.accepted_at),
                        color: selectedOrder.accepted_at ? "green" : "gray",
                      },
                      {
                        title: "Preparing",
                        content: formatDate(selectedOrder.preparing_at),
                        color: selectedOrder.preparing_at ? "green" : "gray",
                      },
                      {
                        title: "Ready",
                        content: formatDate(selectedOrder.ready_at),
                        color: selectedOrder.ready_at ? "green" : "gray",
                      },
                      {
                        title: "Dispatched",
                        content: formatDate(selectedOrder.dispatched_at),
                        color: selectedOrder.dispatched_at ? "green" : "gray",
                      },
                      {
                        title: "Delivered / cancelled",
                        content: formatDate(
                          selectedOrder.delivered_at ||
                            selectedOrder.cancelled_at,
                        ),
                        color: selectedOrder.delivered_at
                          ? "green"
                          : selectedOrder.cancelled_at
                            ? "red"
                            : "gray",
                      },
                    ]}
                  />
                </Card>
                <Card
                  size="small"
                  title="Customer notes"
                  style={{ borderRadius: 2 }}
                >
                  <Text
                    type={
                      selectedOrder.customer_notes ? undefined : "secondary"
                    }
                  >
                    {selectedOrder.customer_notes ||
                      "No notes added to this order."}
                  </Text>
                </Card>
              </div>
            </Space>
          )}
        </Modal>
      </>
    </ConfigProvider>
  );
};

export default OrdersPage;
