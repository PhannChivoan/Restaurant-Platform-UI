import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  Bike,
  CheckCircle2,
  CircleDot,
  Clock3,
  Edit3,
  Ellipsis,
  PackageCheck,
  Plus,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import ModulePage from "../components/ui/ModulePage";

import { request } from "../utils/request";
import dayjs from "dayjs";
import { DotsRing } from "@/components/ui/dots-ring";
import { palette } from "@/constants/theme";

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");

const deliveryStatusColor = {
  assigned: "blue",
  picked_up: "processing",
  delivered: "green",
  failed: "red",
};

const DispatchPage = () => {
  const [assignForm] = Form.useForm();
  const [riderForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [readyOrders, setReadyOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState();
  const [dateRange, setDateRange] = useState([null, null]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus(undefined);
    setDateRange(null);
    setPage(1);
  };

  const hasFilters = Boolean(search || status || dateRange);

  const loadAll = async () => {
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

    const [dashboardRes, ridersRes, trackingRes] = await Promise.all([
      request("dispatch/dashboard", "GET"),
      request("riders?limit=100", "GET"),
      request(`dispatch/tracking?${params.toString()}`, "GET"),
    ]);

    if (Array.isArray(dashboardRes?.data)) {
      setReadyOrders(
        dashboardRes.data.filter((row) => row.status === "Pending"),
      );
      setStats((prev) => ({ ...prev, ...(dashboardRes.stats || {}) }));
    } else {
      setError(dashboardRes?.message || "Unable to load dispatch data.");
    }

    if (Array.isArray(ridersRes?.data)) {
      setRiders(ridersRes.data);
    }

    if (Array.isArray(trackingRes?.data)) {
      setActiveDeliveries(trackingRes.data);
      setTotalDeliveries(Number(trackingRes.total ?? trackingRes.data.length));
      setStats((prev) => ({ ...prev, ...(trackingRes.stats || {}) }));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [page, pageSize, search, status, dateRange, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleAssignRider = async () => {
    try {
      const values = await assignForm.validateFields();
      const orderId =
        selectedOrder?.id || selectedOrder?.key?.replace("order-", "");
      setSubmitting(true);

      if (batchMode && selectedOrderIds.length > 0) {
        const response = await request("orders/batch-dispatch", "POST", {
          order_ids: selectedOrderIds.map((id) => Number(id)),
          rider_profile_id: values.rider_profile_id,
        });

        if (response?.assigned > 0) {
          message.success(
            response.message || `${selectedOrderIds.length} orders assigned.`,
          );
          setAssignModalOpen(false);
          setSelectedOrderIds([]);
          setBatchMode(false);
          setRefreshKey((k) => k + 1);
        } else {
          message.warning(response?.message || "No orders were assigned.");
        }
        return;
      }

      const response = await request(`orders/${orderId}/assign-rider`, "POST", {
        rider_profile_id: values.rider_profile_id,
      });

      if (response?.id) {
        message.success("Rider assigned successfully.");
        setAssignModalOpen(false);
        setSelectedOrder(null);
        setRefreshKey((k) => k + 1);
      } else {
        message.error(response?.message || "Failed to assign rider.");
      }
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err?.message || "Failed to assign rider.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateDeliveryStatus = async (assignmentId, newStatus) => {
    setSubmitting(true);
    const response = await request(
      `deliveries/${assignmentId}/status`,
      "PATCH",
      { status: newStatus },
    );

    if (response?.id) {
      message.success(`Delivery marked as ${formatStatus(newStatus)}.`);
      setRefreshKey((k) => k + 1);
    } else {
      message.error(response?.message || "Failed to update status.");
    }
    setSubmitting(false);
  };

  const unassignDelivery = async (assignmentId) => {
    setSubmitting(true);
    const response = await request(`deliveries/${assignmentId}`, "DELETE");
    if (response?.message === "Delivery assignment deleted") {
      message.success("Delivery unassigned.");
      setRefreshKey((k) => k + 1);
    } else {
      message.error(response?.message || "Failed to unassign.");
    }
    setSubmitting(false);
  };

  const saveRider = async () => {
    try {
      const values = await riderForm.validateFields();
      const payload = {
        vehicle_type: values.vehicle_type,
        license_plate: values.license_plate || null,
      };
      setSubmitting(true);
      const response = editingRider
        ? await request(`riders/${editingRider.id}`, "PATCH", payload)
        : await request("riders", "POST", {
            ...payload,
            user_id: Number(values.user_id),
          });

      if (!response?.id) {
        message.error(response?.message || "Unable to save rider.");
        return;
      }

      message.success(editingRider ? "Rider updated." : "Rider created.");
      setRiderModalOpen(false);
      setEditingRider(null);
      riderForm.resetFields();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      if (!err?.errorFields) {
        message.error(err?.message || "Unable to save rider.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRiderOnline = async (rider) => {
    setSubmitting(true);
    const response = await request(`riders/${rider.id}/online`, "PATCH");
    if (response?.is_online !== undefined) {
      message.success(
        `Rider is now ${response.is_online ? "online" : "offline"}.`,
      );
      setRefreshKey((k) => k + 1);
    } else {
      message.error(response?.message || "Unable to update rider status.");
    }
    setSubmitting(false);
  };

  const deleteRider = async (rider) => {
    setSubmitting(true);
    const response = await request(`riders/${rider.id}`, "DELETE");
    if (response?.message === "Rider profile deleted") {
      message.success("Rider deleted.");
      setRefreshKey((k) => k + 1);
    } else {
      message.error(response?.message || "Unable to delete rider.");
    }
    setSubmitting(false);
  };

  const openRiderModal = (rider = null) => {
    setEditingRider(rider);
    riderForm.resetFields();
    if (rider) {
      riderForm.setFieldsValue({
        user_id: rider.user_id,
        vehicle_type: rider.vehicle_type,
        license_plate: rider.license_plate,
      });
    }
    setRiderModalOpen(true);
  };

  const availableRiders = useMemo(
    () => riders.filter((r) => r.is_online && r.is_available),
    [riders],
  );

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const selectAllReadyOrders = () => {
    if (selectedOrderIds.length === readyOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(readyOrders.map((o) => o.key?.replace("order-", "")));
    }
  };

  /* =========================================================
     READY ORDERS TABLE
  ========================================================= */

  const readyOrderColumns = [
    ...(batchMode
      ? [
          {
            title: (
              <input
                type="checkbox"
                checked={
                  readyOrders.length > 0 &&
                  selectedOrderIds.length === readyOrders.length
                }
                onChange={selectAllReadyOrders}
                style={{ cursor: "pointer" }}
              />
            ),
            key: "select",
            width: 40,
            render: (_, row) => {
              const id = row.key?.replace("order-", "");
              return (
                <input
                  type="checkbox"
                  checked={selectedOrderIds.includes(id)}
                  onChange={() => toggleOrderSelection(id)}
                  style={{ cursor: "pointer" }}
                />
              );
            },
          },
        ]
      : []),
    {
      title: "NO",
      key: "number",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, row) => {
        const orderId = row.key?.replace("order-", "");
        const order = { id: orderId, ...row };
        return (
          <Button
            size="small"
            type="primary"
            icon={<Bike size={14} />}
            onClick={() => openAssignModal(order)}
            style={{ borderRadius: 2 }}
          >
            Assign
          </Button>
        );
      },
    },
  ];

  /* =========================================================
     LIVE DELIVERIES TABLE
  ========================================================= */

  const deliveryColumns = [
    {
      title: "#",
      key: "number",
      width: 45,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
      width: 170,
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: "Rider",
      dataIndex: "rider",
      key: "rider",
      width: 130,
    },
    {
      title: "Destination",
      dataIndex: "destination",
      key: "destination",
      ellipsis: true,
    },
    {
      title: "Elapsed",
      dataIndex: "assigned_at",
      key: "elapsed",
      width: 90,
      render: (val) => {
        if (!val) return "-";
        const mins = Math.floor((Date.now() - new Date(val).getTime()) / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
    {
      title: "ETA",
      dataIndex: "eta",
      key: "eta",
      width: 80,
      render: (val) => val || "-",
    },
    {
      title: "Status",
      dataIndex: "assignment_status",
      key: "assignment_status",
      width: 110,
      render: (val) => (
        <Tag
          color={deliveryStatusColor[val] || "default"}
          style={{ margin: 0, borderRadius: 2, fontWeight: 500 }}
        >
          {formatStatus(val)}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 45,
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              ...(row.assignment_status === "assigned"
                ? [
                    {
                      key: "picked_up",
                      label: "Mark picked up",
                      icon: <PackageCheck size={15} />,
                    },
                  ]
                : []),
              ...(row.assignment_status === "picked_up"
                ? [
                    {
                      key: "delivered",
                      label: "Mark delivered",
                      icon: <CheckCircle2 size={15} />,
                    },
                    {
                      key: "failed",
                      label: "Mark failed",
                      icon: <XCircle size={15} />,
                      danger: true,
                    },
                  ]
                : []),
              {
                key: "unassign",
                label: "Unassign rider",
                icon: <XCircle size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (
                key === "picked_up" ||
                key === "delivered" ||
                key === "failed"
              ) {
                updateDeliveryStatus(row.assignment_id, key);
              }
              if (key === "unassign") {
                unassignDelivery(row.assignment_id);
              }
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
     RIDER TABLE
  ========================================================= */

  const riderColumns = [
    {
      title: "Rider",
      key: "rider",
      render: (_, r) => r.user?.name || r.user?.email || `User #${r.user_id}`,
    },
    { title: "Vehicle", dataIndex: "vehicle_type", key: "vehicle_type" },
    {
      title: "License plate",
      dataIndex: "license_plate",
      key: "license_plate",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (val) => `${Number(val || 0).toFixed(1)} / 5`,
    },
    {
      title: "Trips",
      dataIndex: "total_trips",
      key: "total_trips",
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => (
        <Tag color={r.is_online ? "green" : "default"}>
          {r.is_online ? "Online" : "Offline"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 50,
      render: (_, r) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit rider",
                icon: <Edit3 size={15} />,
              },
              {
                key: "toggle",
                label: r.is_online ? "Set offline" : "Set online",
                icon: <CircleDot size={15} />,
              },
              {
                key: "delete",
                label: "Delete rider",
                icon: <XCircle size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "edit") openRiderModal(r);
              if (key === "toggle") toggleRiderOnline(r);
              if (key === "delete") deleteRider(r);
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

  return (
    <ConfigProvider theme={{ token: { borderRadius: 2 } }}>
      <>
        <ModulePage
          title="Rider Dispatch"
          description="Assign riders to ready orders and manage active deliveries."
          icon={Bike}
          stats={[
            {
              label: "Waiting for dispatch",
              value: stats.waiting_for_rider || 0,
              icon: Clock3,
              iconBackground: "#FFFBEB",
              description: "Ready orders without a rider",
            },
            {
              label: "Available riders",
              value: stats.available_riders || 0,
              icon: Bike,
              iconBackground: "#F5F3FF",
              description: "Online and available riders",
            },
            {
              label: "Active deliveries",
              value:
                stats.active_deliveries ||
                stats.on_the_road ||
                stats.active_trips ||
                0,
              icon: Truck,
              iconBackground: "#EFF6FF",
              description: "Assigned or picked up",
            },
            {
              label: "Delivered today",
              value: stats.delivered_today || 0,
              icon: CheckCircle2,
              iconBackground: "#F0FDF4",
              description: "Successfully delivered today",
            },
            {
              label: "On-time rate",
              value: stats.on_time_rate ? `${stats.on_time_rate}%` : "0%",
              icon: CircleDot,
              iconBackground: "#ECFDF5",
              description: "Delivered within 30 min",
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

        {/* ===================================================
            ACTIVE DELIVERIES
        =================================================== */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Truck size={18} color="#f57c00" />
              <span>Live Deliveries ({totalDeliveries})</span>
            </div>
          }
          extra={
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          }
          style={{ marginTop: 10 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              flexWrap: "nowrap",
            }}
          >
            <Input.Search
              allowClear
              placeholder="Search order, rider"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              style={{ flex: "0 0 280px", borderRadius: 2 }}
            />
            <Select
              allowClear
              placeholder="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={Object.keys(deliveryStatusColor).map((value) => ({
                value,
                label: formatStatus(value),
              }))}
              style={{ width: 130, borderRadius: 2 }}
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
              ]}
              style={{ width: 240, borderRadius: 2 }}
            />
            <Button
              icon={<RefreshCw size={15} />}
              disabled={!hasFilters}
              onClick={clearFilters}
              style={{ borderRadius: 2 }}
            >
              Clear
            </Button>
          </div>
          <ConfigProvider
            theme={{
              token: { borderRadius: 2, colorBorder: "#f0f0f0" },
              components: {
                Table: {
                  headerBg: "#f57c00",
                  headerColor: "#fff",
                  headerBorderRadius: 0,
                },
              },
            }}
          >
            <Table
              rowKey="key"
              columns={deliveryColumns}
              dataSource={activeDeliveries}
              loading={{
                spinning: loading,
                indicator: (
                  <DotsRing
                    style={{ width: 32, height: 32, color: palette.primary }}
                  />
                ),
              }}
              size="small"
              scroll={{ x: "max-content" }}
              pagination={{
                current: page,
                pageSize,
                total: totalDeliveries,
                showSizeChanger: true,
                pageSizeOptions: ["10", "15", "25", "50"],
                onChange: (newPage, newPageSize) => {
                  setPageSize(newPageSize);
                  setPage(newPage);
                },
                disabled: loading,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} deliveries`,
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
          </ConfigProvider>
        </Card>

        {/* ===================================================
            2-COLUMN: READY ORDERS + AVAILABLE RIDERS
        =================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 20,
            marginTop: 20,
          }}
        >
          {/* LEFT: Ready Orders */}
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock3 size={18} color="#f57c00" />
                <span>Ready for Dispatch ({readyOrders.length})</span>
              </div>
            }
            extra={
              <Space size={8}>
                {readyOrders.length > 0 && (
                  <Button
                    size="small"
                    type={batchMode ? "primary" : "default"}
                    onClick={() => {
                      setBatchMode(!batchMode);
                      setSelectedOrderIds([]);
                    }}
                  >
                    {batchMode ? "Cancel batch" : "Batch assign"}
                  </Button>
                )}
                {batchMode && selectedOrderIds.length > 0 && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<Bike size={14} />}
                    onClick={() => {
                      setSelectedOrder({
                        id: null,
                        order: `${selectedOrderIds.length} orders`,
                      });
                      assignForm.resetFields();
                      setAssignModalOpen(true);
                    }}
                  >
                    Assign to {selectedOrderIds.length} orders
                  </Button>
                )}
                <Button
                  icon={<RefreshCw size={14} />}
                  onClick={() => setRefreshKey((k) => k + 1)}
                  style={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="key"
              columns={readyOrderColumns}
              dataSource={readyOrders}
              loading={{
                spinning: loading,
                indicator: (
                  <DotsRing
                    style={{ width: 32, height: 32, color: palette.primary }}
                  />
                ),
              }}
              pagination={false}
              locale={{ emptyText: "No orders waiting for dispatch" }}
              scroll={{ x: "max-content" }}
              size="small"
            />
          </Card>

          {/* RIGHT: Available Riders */}
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Bike size={18} color="#f57c00" />
                <span>Available Riders ({availableRiders.length})</span>
              </div>
            }
            extra={
              <Button
                size="small"
                type="primary"
                icon={<Plus size={14} />}
                loading={submitting}
                onClick={() => openRiderModal()}
              >
                Add
              </Button>
            }
            styles={{ body: { padding: 0 } }}
          >
            {availableRiders.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No riders online
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {availableRiders.map((rider) => (
                  <div
                    key={rider.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {rider.user?.name || `Rider #${rider.id}`}
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {rider.vehicle_type}
                        {rider.license_plate ? ` · ${rider.license_plate}` : ""}
                      </div>
                    </div>
                    <Tag color="green">Online</Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ===================================================
            ALL RIDERS TABLE
        =================================================== */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Truck size={18} color="#f57c00" />
              <span>All Riders ({riders.length})</span>
            </div>
          }
          style={{ marginTop: 20 }}
          extra={
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => openRiderModal()}
            >
              Add rider
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={riderColumns}
            dataSource={riders}
            loading={{
              spinning: loading,
              indicator: (
                <DotsRing
                  style={{ width: 32, height: 32, color: palette.primary }}
                />
              ),
            }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: "max-content" }}
            size="small"
          />
        </Card>

        {/* ===================================================
            ASSIGN RIDER MODAL
        =================================================== */}
        <Modal
          title={
            batchMode && selectedOrderIds.length > 0
              ? `Assign rider to ${selectedOrderIds.length} orders`
              : "Assign rider to order"
          }
          open={assignModalOpen}
          onCancel={() => {
            setAssignModalOpen(false);
            setSelectedOrder(null);
          }}
          onOk={handleAssignRider}
          confirmLoading={submitting}
          okText="Assign rider"
          width={480}
          forceRender
          destroyOnHidden
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
          }}
        >
          {selectedOrder && (
            <div style={{ marginBottom: 16, color: "#666" }}>
              Assigning rider to <strong>{selectedOrder.order}</strong>
            </div>
          )}
          <Form form={assignForm} layout="vertical">
            <Form.Item
              label="Select rider"
              name="rider_profile_id"
              rules={[{ required: true, message: "Please select a rider." }]}
            >
              <Select
                placeholder="Choose an available rider"
                showSearch
                optionFilterProp="label"
                options={availableRiders.map((r) => ({
                  value: r.id,
                  label: `${r.user?.name || `Rider #${r.id}`} — ${r.vehicle_type}`,
                }))}
              />
            </Form.Item>
          </Form>
          {availableRiders.length === 0 && (
            <div style={{ color: "#faad14", fontSize: 13 }}>
              No available riders. All riders may be offline or busy.
            </div>
          )}
        </Modal>

        {/* ===================================================
            ADD / EDIT RIDER MODAL
        =================================================== */}
        <Modal
          title={editingRider ? "Edit rider" : "Add rider"}
          open={riderModalOpen}
          onCancel={() => {
            setRiderModalOpen(false);
            setEditingRider(null);
          }}
          onOk={saveRider}
          confirmLoading={submitting}
          okText={editingRider ? "Save changes" : "Create rider"}
          width={480}
          forceRender
          destroyOnHidden
          styles={{
            content: { borderRadius: 2 },
            header: { borderRadius: "2px 2px 0 0" },
          }}
        >
          <Form form={riderForm} layout="vertical">
            {!editingRider && (
              <Form.Item
                label="User ID"
                name="user_id"
                rules={[{ required: true, message: "Please enter user ID." }]}
              >
                <InputNumber
                  className="!w-full"
                  min={1}
                  placeholder="User ID"
                />
              </Form.Item>
            )}
            <Form.Item
              label="Vehicle type"
              name="vehicle_type"
              rules={[
                { required: true, message: "Please enter vehicle type." },
              ]}
            >
              <Select
                placeholder="Select vehicle type"
                options={[
                  { value: "motorcycle", label: "Motorcycle" },
                  { value: "car", label: "Car" },
                  { value: "bicycle", label: "Bicycle" },
                  { value: "van", label: "Van" },
                ]}
              />
            </Form.Item>
            <Form.Item label="License plate" name="license_plate">
              <Input placeholder="License plate (optional)" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    </ConfigProvider>
  );
};

export default DispatchPage;
