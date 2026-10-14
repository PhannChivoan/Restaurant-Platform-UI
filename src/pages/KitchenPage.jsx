import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  ConfigProvider,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  Ban,
  Check,
  ChefHat,
  Clock3,
  ClipboardList,
  Ellipsis,
  PackageCheck,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import ModulePage from "../components/ui/ModulePage";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const statusColor = {
  pending: "gold",
  accepted: "blue",
  preparing: "processing",
  ready: "green",
};

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const KitchenPage = () => {
  // ===============================
  // All State
  // ===============================
  const [form] = Form.useForm();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState();
  const [dateRange, setDateRange] = useState([null, null]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [metrics, setMetrics] = useState({
    pending: 0,
    in_progress: 0,
    ready: 0,
    average_prep_time_minutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionOrderId, setActionOrderId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ===============================
  // Functions Handlers
  // ===============================
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus(undefined);
    setDateRange(null);
    setPage(1);
  };

  const hasFilters = Boolean(search || searchInput || status || dateRange);

  useEffect(() => {
    let active = true;

    const loadKitchenData = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (dateRange?.[0])
        params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.set("date_to", dateRange[1].format("YYYY-MM-DD"));

      const [queueResponse, metricsResponse] = await Promise.all([
        request(`orders/queue?${params.toString()}`, "GET"),
        request("kitchen/metrics", "GET"),
      ]);

      if (!active) return;

      if (Array.isArray(queueResponse?.data)) {
        setOrders(queueResponse.data);
        setTotalOrders(queueResponse.total || queueResponse.data.length);
      } else {
        setError(queueResponse?.message || "Unable to load kitchen orders.");
      }

      if (metricsResponse?.pending !== undefined) {
        setMetrics(metricsResponse);
      } else {
        setError(metricsResponse?.message || "Unable to load kitchen metrics.");
      }

      setLoading(false);
    };

    loadKitchenData();
    return () => {
      active = false;
    };
  }, [page, pageSize, refreshKey, search, status, dateRange]);

  // ===============================
  // Fectch / Update Functions
  // ===============================
  const updateOrder = async (orderId, action, data = {}) => {
    setActionOrderId(orderId);
    setError("");

    const response = await request(
      `orders/${orderId}/${action}`,
      "PATCH",
      data,
    );
    setActionOrderId(null);

    if (response?.id) {
      setRefreshKey((value) => value + 1);
    } else {
      setError(response?.message || "Unable to update this order.");
    }
  };

  const openAddModal = () => {
    form.resetFields();
    form.setFieldsValue({ quantity: 1, payment_method: "cash" });
    setAddModalOpen(true);
  };

  //===============================
  // Create Order
  //===============================
  const createOrder = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setError("");

      const response = await request("orders", "POST", {
        restaurant_id: values.restaurant_id,
        branch_id: values.branch_id,
        payment_method: values.payment_method,
        customer_notes: values.customer_notes,
        items: [
          {
            menu_item_id: values.menu_item_id,
            quantity: values.quantity,
          },
        ],
      });

      if (!response?.id) {
        setError(response?.message || "Unable to create kitchen order.");
        return;
      }

      setAddModalOpen(false);
      form.resetFields();
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (formError) {
      if (!formError?.errorFields) {
        setError(formError?.message || "Unable to create kitchen order.");
      }
    } finally {
      setSaving(false);
    }
  };

  //===============================
  // Prepare rows for table
  //===============================
  const rows = orders.map((order) => ({
    key: order.id,
    id: order.id,
    order: order.order_number || `#${order.id}`,
    restaurant: order.restaurant?.name || "-",
    branch: order.branch?.name || `Branch #${order.branch_id || "-"}`,
    items: order.items?.reduce((total, item) => total + item.quantity, 0) || 0,
    received: formatDate(order.created_at),
    prep: order.preparing_at ? formatDate(order.preparing_at) : "Not started",
    status: order.status,
  }));

  return (
    <ConfigProvider theme={{ token: { borderRadius: 2 } }}>
      <>
        <ModulePage
          title="Kitchen Workflow"
          description="Manage acceptance, preparation, and ready-for-dispatch orders."
          icon={ClipboardList}
          stats={[
            {
              label: "Awaiting acceptance",
              value: metrics.pending,
              icon: Clock3,

              iconBackground: "#FFFBEB",
              description: "Orders waiting for kitchen review",
            },
            {
              label: "In progress",
              value: metrics.in_progress,
              icon: ChefHat,

              iconBackground: "#F5F3FF",
              description: "Accepted or being prepared",
            },
            {
              label: "Ready for dispatch",
              value: metrics.ready,
              icon: PackageCheck,

              iconBackground: "#F0FDF4",
              description: "Orders ready for rider pickup",
            },
            {
              label: "Average prep time",
              value: metrics.average_prep_time_minutes,
              suffix: "min",
              icon: ClipboardList,

              iconBackground: "#EFF6FF",
              description: "Average accepted-to-ready time",
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
          toolbar={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                width: "100%",
              }}
            >
              {/* Search - Left */}
              <Input.Search
                allowClear
                placeholder="Search order or restaurant"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);

                  if (!event.target.value) {
                    setSearch("");
                    setPage(1);
                  }
                }}
                onSearch={(value) => {
                  setSearch(value.trim());
                  setPage(1);
                }}
                style={{
                  flex: "0 0 300px",
                  borderRadius: 2,
                }}
              />

              {/* Filters / Actions - Right */}
              <Space wrap size="small">
                <Select
                  allowClear
                  placeholder="Filter status"
                  value={status}
                  onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                  }}
                  options={Object.keys(statusColor).map((value) => ({
                    value,
                    label: formatStatus(value),
                  }))}
                  style={{ width: 145 }}
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
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                  options={[10, 15, 30, 50].map((value) => ({
                    value,
                    label: `${value} per page`,
                  }))}
                  style={{ width: 135 }}
                />

                <Button disabled={!hasFilters} onClick={clearFilters}>
                  Clear filters
                </Button>

                <Button
                  icon={<RefreshCw size={14} />}
                  loading={loading}
                  onClick={() => setRefreshKey((value) => value + 1)}
                >
                  Refresh
                </Button>

                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={openAddModal}
                >
                  Add order
                </Button>
              </Space>
            </div>
          }
          pagination={{
            current: page,
            pageSize,
            total: totalOrders,
            showSizeChanger: false,
            onChange: setPage,
            disabled: loading,
          }}
          columns={[
            {
              title: "Order ID",
              dataIndex: "id",
              key: "id",
              render: (_, record, index) => `${index + 1}`,
            },
            { title: "Order", dataIndex: "order", key: "order" },
            { title: "Restaurant", dataIndex: "restaurant", key: "restaurant" },
            { title: "Branch", dataIndex: "branch", key: "branch" },
            { title: "Items", dataIndex: "items", key: "items" },
            { title: "Received", dataIndex: "received", key: "received" },
            { title: "Preparing", dataIndex: "prep", key: "prep" },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => (
                <Tag color={statusColor[status] || "default"}>
                  {formatStatus(status)}
                </Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 182,
              render: (_, row) => (
                <Space size={4} wrap>
                  {row.status === "pending" && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<Check size={14} />}
                      loading={actionOrderId === row.id}
                      onClick={() => updateOrder(row.id, "accept")}
                      style={{ borderRadius: 2 }}
                    >
                      Accept
                    </Button>
                  )}
                  {row.status === "accepted" && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<ChefHat size={14} />}
                      loading={actionOrderId === row.id}
                      onClick={() => updateOrder(row.id, "prepare")}
                      style={{ borderRadius: 2 }}
                    >
                      Start preparing
                    </Button>
                  )}
                  {row.status === "preparing" && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<PackageCheck size={14} />}
                      loading={actionOrderId === row.id}
                      onClick={() => updateOrder(row.id, "ready")}
                      style={{ borderRadius: 2 }}
                    >
                      Mark ready
                    </Button>
                  )}
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        ...(row.status !== "ready"
                          ? [
                              {
                                key: "reject",
                                label: "Reject order",
                                icon: <XCircle size={15} />,
                                danger: true,
                              },
                            ]
                          : []),
                        ...(row.status !== "cancelled"
                          ? [
                              {
                                key: "cancel",
                                label: "Cancel order",
                                icon: <Ban size={15} />,
                                danger: true,
                              },
                            ]
                          : []),
                      ],
                      onClick: ({ key }) => {
                        if (key === "reject") {
                          setRejectOrderId(row.id);
                          setRejectReason("");
                        }
                        if (key === "cancel") {
                          updateOrder(row.id, "cancel");
                        }
                      },
                    }}
                  >
                    <Tooltip title="More actions">
                      <Button
                        size="small"
                        icon={<Ellipsis size={16} />}
                        aria-label={`More actions for ${row.order}`}
                        style={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                  </Dropdown>
                </Space>
              ),
            },
          ]}
          rows={rows}
        />
        <Modal
          title="Add kitchen order"
          open={addModalOpen}
          forceRender
          destroyOnHidden
          width={620}
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
            footer: { borderRadius: "0 0 2px 2px" },
          }}
          onCancel={() => setAddModalOpen(false)}
          onOk={createOrder}
          okText="Create order"
          confirmLoading={saving}
        >
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label="Restaurant ID"
                name="restaurant_id"
                rules={[{ required: true, message: "Enter restaurant ID." }]}
              >
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
              <Form.Item
                label="Branch ID"
                name="branch_id"
                rules={[{ required: true, message: "Enter branch ID." }]}
              >
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
              <Form.Item
                label="Menu item ID"
                name="menu_item_id"
                rules={[{ required: true, message: "Enter menu item ID." }]}
              >
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: "Enter quantity." }]}
              >
                <InputNumber className="!w-full" min={1} precision={0} />
              </Form.Item>
              <Form.Item
                label="Payment method"
                name="payment_method"
                rules={[{ required: true, message: "Select payment method." }]}
              >
                <Select
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "wallet", label: "Wallet" },
                    { value: "bank_transfer", label: "Bank transfer" },
                  ]}
                />
              </Form.Item>
            </div>
            <Form.Item label="Customer notes" name="customer_notes">
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Reject order"
          open={rejectOrderId !== null}
          okText="Reject order"
          okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
          onCancel={() => setRejectOrderId(null)}
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
            footer: { borderRadius: "0 0 2px 2px" },
          }}
          onOk={async () => {
            await updateOrder(rejectOrderId, "reject", {
              reason: rejectReason.trim(),
            });
            setRejectOrderId(null);
          }}
        >
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Enter the reason for rejecting this order"
          />
        </Modal>
      </>
    </ConfigProvider>
  );
};

export default KitchenPage;
