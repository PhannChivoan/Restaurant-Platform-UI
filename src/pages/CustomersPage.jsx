import { formatMoney } from "../utils/platformSettings";
import { useEffect, useState } from "react";

import {
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  App,
} from "antd";

import {
  CheckCircle2,
  Download,
  Edit3,
  Ellipsis,
  Eye,
  Gift,
  History,
  Lock,
  Mail,
  MapPin,
  MapPinHouse,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Unlock,
  User,
  UserRound,
  UsersRound,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   HELPERS
========================================================= */

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
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save.";
};

const ORDER_STATUS_COLORS = {
  pending: "default",
  confirmed: "processing",
  preparing: "processing",
  ready: "success",
  delivered: "success",
  cancelled: "error",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CustomersPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 15;

  // ─── Filters ─────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [showTrashed, setShowTrashed] = useState(false);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");

  // ─── Order history ───────────────────────────────
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const [orderHistoryTotal, setOrderHistoryTotal] = useState(0);

  // ─── Loyalty ─────────────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // ─── Edit modal ──────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm] = Form.useForm();

  // ─── Address modals ──────────────────────────────
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState("add");
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadCustomers = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (showTrashed) params.set("trashed", "1");

      const response = await request(`customers?${params.toString()}`, "GET");

      if (response?.data) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((r) => r.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load customers.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [refreshKey, page, search, statusFilter, showTrashed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     DETAIL DRAWER
  ========================================================= */

  const openDetail = (customer) => {
    setSelected(customer);
    setDetailOpen(true);
    setDetailTab("overview");
    setDetailLoading(true);

    request(`customers/${customer.id}`, "GET")
      .then((detail) => {
        if (detail?.id) {
          setSelected((current) =>
            current && current.id === detail.id ? detail : current,
          );
        }
      })
      .finally(() => setDetailLoading(false));
  };

  const loadOrderHistory = async (customerId, pg = 1) => {
    setOrderHistoryLoading(true);
    try {
      const res = await request(
        `customers/${customerId}/order-history?page=${pg}&limit=10`,
        "GET",
      );
      if (res?.data) {
        setOrderHistory(res.data);
        setOrderHistoryTotal(res.total || 0);
        setOrderHistoryPage(pg);
      }
    } finally {
      setOrderHistoryLoading(false);
    }
  };

  const loadLoyalty = async (customerId) => {
    setLoyaltyLoading(true);
    try {
      const res = await request(`customers/${customerId}/loyalty`, "GET");
      if (res?.balance !== undefined) {
        setLoyaltyData(res);
      }
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const switchTab = (tab) => {
    setDetailTab(tab);
    if (!selected) return;

    if (tab === "orders") {
      loadOrderHistory(selected.id, 1);
    }
    if (tab === "loyalty" && !loyaltyData) {
      loadLoyalty(selected.id);
    }
  };

  /* =========================================================
     CUSTOMER CRUD
  ========================================================= */

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    editForm.resetFields();
    editForm.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      is_active: customer.is_active,
    });
    setEditModalOpen(true);
  };

  const saveCustomer = async () => {
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    const response = await request(
      `customers/${editingCustomer.id}`,
      "PUT",
      values,
    );
    setSubmitting(false);

    if (!response?.id && !response?.message) {
      message.error(firstSaveError(response));
      return;
    }

    message.success("Customer updated.");
    setEditModalOpen(false);
    setEditingCustomer(null);
    editForm.resetFields();
    setRefreshKey((k) => k + 1);

    if (selected?.id === editingCustomer.id) {
      const detail = await request(`customers/${editingCustomer.id}`, "GET");
      if (detail?.id) setSelected(detail);
    }
  };

  const toggleBlacklist = (customer) => {
    const action = customer.is_active ? "blacklist" : "unblacklist";
    const label = customer.is_active
      ? `Blacklist "${customer.name}"?`
      : `Restore "${customer.name}"?`;
    const content = customer.is_active
      ? "This customer will be restricted from placing orders."
      : "This customer will be reactivated and able to place orders again.";

    Modal.confirm({
      title: label,
      content,
      okText: customer.is_active ? "Blacklist" : "Restore",
      okButtonProps: { danger: customer.is_active },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `customers/${customer.id}/${action}`,
          "POST",
        );

        if (response?.message) {
          message.success(response.message);
          setRefreshKey((k) => k + 1);
          if (selected?.id === customer.id) {
            const detail = await request(`customers/${customer.id}`, "GET");
            if (detail?.id) setSelected(detail);
          }
        } else {
          message.error(response?.message || "Action failed.");
        }
      },
    });
  };

  const deleteCustomer = (customer) => {
    Modal.confirm({
      title: "Move to trash?",
      content: (
        <span>
          <strong>{customer.name}</strong> will be moved to trash and hidden
          from the main list. You can restore it later from the trashed view.
        </span>
      ),
      okText: "Move to Trash",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`customers/${customer.id}`, "DELETE");

        if (response?.message) {
          message.success("Customer moved to trash.");
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          message.error(response?.message || "Action failed.");
        }
      },
    });
  };

  const restoreCustomer = (customer) => {
    Modal.confirm({
      title: `Restore "${customer.name}"?`,
      content: "This customer will be restored to the active list.",
      okText: "Restore",
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `customers/${customer.id}/restore`,
          "POST",
        );

        if (response?.message) {
          message.success("Customer restored.");
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          message.error(response?.message || "Restore failed.");
        }
      },
    });
  };

  const forceDeleteCustomer = (customer) => {
    Modal.confirm({
      title: `Permanently delete "${customer.name}"?`,
      content:
        "This action cannot be undone. All data including addresses, orders, and loyalty history will be permanently deleted.",
      okText: "Permanently Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `customers/${customer.id}/force-delete`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Customer permanently deleted.");
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          message.error(response?.message || "Delete failed.");
        }
      },
    });
  };

  /* =========================================================
     ADDRESS CRUD
  ========================================================= */

  const openAddressAddModal = () => {
    setEditingAddress(null);
    setAddressModalMode("add");
    addressForm.resetFields();
    addressForm.setFieldsValue({ is_default: false });
    setAddressModalOpen(true);
  };

  const openAddressEditModal = (address) => {
    setEditingAddress(address);
    setAddressModalMode("edit");
    addressForm.resetFields();
    addressForm.setFieldsValue({
      label: address.label,
      address: address.address,
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setAddressModalOpen(true);
  };

  const saveAddress = async () => {
    let values;
    try {
      values = await addressForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    let response;
    if (addressModalMode === "edit" && editingAddress) {
      response = await request(
        `customers/${selected.id}/addresses/${editingAddress.id}`,
        "PUT",
        values,
      );
    } else {
      response = await request(
        `customers/${selected.id}/addresses`,
        "POST",
        values,
      );
    }

    setSubmitting(false);

    if (response?.id || response?.message) {
      message.success(
        addressModalMode === "edit" ? "Address updated." : "Address added.",
      );
      setAddressModalOpen(false);
      setEditingAddress(null);
      addressForm.resetFields();

      const detail = await request(`customers/${selected.id}`, "GET");
      if (detail?.id) setSelected(detail);
    } else {
      message.error(firstSaveError(response));
    }
  };

  const deleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete address?",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `customers/${selected.id}/addresses/${addressId}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Address deleted.");
          const detail = await request(`customers/${selected.id}`, "GET");
          if (detail?.id) setSelected(detail);
        } else {
          message.error(response?.message || "Delete failed.");
        }
      },
    });
  };

  const setDefaultAddress = async (addressId) => {
    if (!selected) return;
    const response = await request(
      `customers/${selected.id}/addresses/${addressId}/default`,
      "POST",
    );

    if (response?.message) {
      message.success("Default address updated.");
      const detail = await request(`customers/${selected.id}`, "GET");
      if (detail?.id) setSelected(detail);
    } else {
      message.error(response?.message || "Failed to set default.");
    }
  };

  /* =========================================================
     EXPORT
  ========================================================= */

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const url = `customers/export/csv?${params.toString()}`;

    const token = localStorage.getItem("token");
    fetch(`${Config.BASE_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "customers.csv";
        link.click();
        URL.revokeObjectURL(link.href);
        message.success("Export downloaded.");
      })
      .catch(() => message.error("Export failed."));
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: row.is_active ? "#EFF6FF" : "#FEF2F2",
              flexShrink: 0,
            }}
          >
            <User
              size={16}
              color={row.is_active ? palette.info : palette.danger}
            />
          </div>
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
                {value}
              </Typography.Link>
            </Tooltip>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.email}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 130,
      render: (value) => value || <Text type="secondary">-</Text>,
    },
    {
      title: "Orders",
      dataIndex: "orders_count",
      key: "orders_count",
      width: 70,
      align: "center",
      sorter: (a, b) => (a.orders_count || 0) - (b.orders_count || 0),
      render: (value) => (
        <Tag
          color={value > 0 ? palette.primary : "default"}
          style={{ margin: 0 }}
        >
          {value ?? 0}
        </Tag>
      ),
    },
    {
      title: "Total Spent",
      dataIndex: "total_spent",
      key: "total_spent",
      width: 100,
      align: "right",
      sorter: (a, b) => (a.total_spent || 0) - (b.total_spent || 0),
      render: (value) => (
        <Text strong style={{ fontSize: 13 }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Loyalty",
      dataIndex: "loyalty_balance",
      key: "loyalty_balance",
      width: 80,
      align: "right",
      sorter: (a, b) => (a.loyalty_balance || 0) - (b.loyalty_balance || 0),
      render: (value) => (
        <Space size={4} align="center">
          <Star size={12} color={palette.warning} />
          <Text strong style={{ fontSize: 13 }}>
            {(value ?? 0).toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: "Last Order",
      dataIndex: "last_order_at",
      key: "last_order_at",
      width: 110,
      sorter: (a, b) =>
        (a.last_order_at || "").localeCompare(b.last_order_at || ""),
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(value)}
        </Text>
      ),
    },
    {
      title: "Account",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      align: "center",
      render: (active) =>
        active ? (
          <Tag
            color="success"
            icon={<CheckCircle2 size={11} />}
            style={{ margin: 0 }}
          >
            Active
          </Tag>
        ) : (
          <Tag
            color="error"
            icon={<ShieldAlert size={11} />}
            style={{ margin: 0 }}
          >
            Restricted
          </Tag>
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
              { key: "view", label: "View details", icon: <Eye size={15} /> },
              {
                key: "edit",
                label: "Edit customer",
                icon: <Edit3 size={15} />,
              },
              {
                key: "blacklist",
                label: row.is_active ? "Blacklist" : "Restore access",
                icon: row.is_active ? <Lock size={15} /> : <Unlock size={15} />,
                danger: row.is_active,
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Move to trash",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "view") openDetail(row);
              if (key === "edit") openEditModal(row);
              if (key === "blacklist") toggleBlacklist(row);
              if (key === "delete") deleteCustomer(row);
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
     ORDER HISTORY TABLE
  ========================================================= */

  const orderColumns = [
    {
      title: "Order ID",
      dataIndex: "id",
      width: 80,
      render: (id) => <Text code>#{id}</Text>,
    },
    {
      title: "Restaurant",
      dataIndex: "restaurant_name",
      render: (v) => v || "-",
    },
    {
      title: "Items",
      dataIndex: "items_count",
      width: 60,
      align: "center",
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 90,
      align: "right",
      render: (v) => `${formatMoney(Number(v))}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      width: 120,
      render: (v) => formatDate(v),
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
        label="Customers loading"
      />

      <ModulePage
        title="Customers"
        description="Manage customer accounts, addresses, order history, loyalty points, and account restrictions."
        icon={UsersRound}
        stats={[
          {
            label: "Total customers",
            value: stats.total ?? 0,
            icon: UsersRound,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Active",
            value: stats.active ?? 0,
            color: palette.success,
            icon: UserRound,
            iconBackground: "#ECFDF5",
          },
          {
            label: "New this month",
            value: stats.new_this_month ?? 0,
            color: palette.info,
            icon: Plus,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Restricted",
            value: stats.restricted ?? 0,
            color: palette.danger,
            icon: ShieldAlert,
            iconBackground: "#FEF2F2",
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
              placeholder="Search name, email, phone…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
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
                { value: "active", label: "Active" },
                { value: "restricted", label: "Restricted" },
              ]}
            />
            <Tooltip title={showTrashed ? "Hide trashed" : "Show trashed"}>
              <Button
                icon={<Trash2 size={15} />}
                onClick={() => {
                  setShowTrashed((v) => !v);
                  setPage(1);
                }}
                type={showTrashed ? "primary" : "default"}
                danger={showTrashed}
                style={{ borderRadius: 2 }}
              />
            </Tooltip>
            <Button
              icon={<Download size={15} />}
              onClick={exportCsv}
              style={{ borderRadius: 2 }}
            >
              Export
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
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) =>
            `${range[0]}-${range[1]} of ${count} customers`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Customer Detail Drawer ───────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <User size={18} color={palette.primary} />
            <span>{selected?.name}</span>
            {selected && (
              <Tag
                color={selected.is_active ? "success" : "error"}
                style={{ marginLeft: 4 }}
              >
                {selected.is_active ? "Active" : "Restricted"}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        size={560}
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
                danger={selected.is_active}
                type={selected.is_active ? undefined : "primary"}
                icon={
                  selected.is_active ? <Lock size={14} /> : <Unlock size={14} />
                }
                onClick={() => toggleBlacklist(selected)}
              >
                {selected.is_active ? "Blacklist" : "Restore"}
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteCustomer(selected)}
              >
                Trash
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 4,
                borderBottom: `1px solid ${palette.border}`,
                paddingBottom: 0,
              }}
            >
              {[
                { key: "overview", label: "Overview", icon: User },
                { key: "orders", label: "Orders", icon: Package },
                { key: "loyalty", label: "Loyalty", icon: Gift },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  type="text"
                  size="small"
                  icon={<tab.icon size={14} />}
                  onClick={() => switchTab(tab.key)}
                  style={{
                    borderRadius: "2px 2px 0 0",
                    borderBottom:
                      detailTab === tab.key
                        ? `2px solid ${palette.primary}`
                        : "2px solid transparent",
                    color:
                      detailTab === tab.key ? palette.primary : palette.muted,
                    fontWeight: detailTab === tab.key ? 600 : 400,
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {detailLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 40,
                }}
              >
                <DotsRing
                  style={{ width: 36, height: 36, color: palette.primary }}
                />
              </div>
            )}

            {/* ─── Overview Tab ─────────────────────────── */}
            {!detailLoading && detailTab === "overview" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {/* Info card */}
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
                    { icon: Mail, label: "Email", value: selected.email },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: selected.phone || "Not provided",
                    },
                    {
                      icon: CheckCircle2,
                      label: "Email verified",
                      value: selected.email_verified ? "Yes" : "No",
                    },
                    {
                      icon: User,
                      label: "Last login",
                      value: formatDateTime(selected.last_login_at),
                    },
                    {
                      icon: Package,
                      label: "Last order",
                      value: formatDate(selected.last_order_at),
                    },
                    {
                      icon: History,
                      label: "Registered",
                      value: formatDate(selected.created_at),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Space size={6} align="center">
                        <item.icon size={13} color={palette.muted} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.label}
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 12, textAlign: "right" }}>
                        {item.value}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "Orders",
                      value: selected.orders_count ?? 0,
                      color: palette.primary,
                    },
                    {
                      label: "Total spent",
                      value: formatCurrency(selected.total_spent),
                      color: palette.success,
                    },
                    {
                      label: "Loyalty pts",
                      value: (selected.loyalty_balance ?? 0).toLocaleString(),
                      color: palette.warning,
                    },
                    {
                      label: "Addresses",
                      value: selected.addresses?.length ?? 0,
                      color: palette.info,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        textAlign: "center",
                        padding: 10,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 2,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.label}
                      </Text>
                      <div>
                        <Text
                          strong
                          style={{ fontSize: 18, color: item.color }}
                        >
                          {item.value}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Addresses */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Space align="center" size={6}>
                      <MapPinHouse size={15} color={palette.info} />
                      <Text strong>
                        Addresses ({selected.addresses?.length ?? 0})
                      </Text>
                    </Space>
                    <Button
                      size="small"
                      icon={<Plus size={13} />}
                      onClick={openAddressAddModal}
                      style={{ borderRadius: 2 }}
                    >
                      Add
                    </Button>
                  </div>

                  {(selected.addresses || []).length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No saved addresses"
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {selected.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            border: `1px solid ${palette.border}`,
                            borderRadius: 2,
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {addr.label && (
                                <Tag
                                  color="blue"
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    lineHeight: "16px",
                                  }}
                                >
                                  {addr.label}
                                </Tag>
                              )}
                              {addr.is_default && (
                                <Tag
                                  color="green"
                                  style={{
                                    margin: 0,
                                    fontSize: 10,
                                    lineHeight: "16px",
                                  }}
                                >
                                  Default
                                </Tag>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              <MapPin size={11} color={palette.muted} />
                              <Text
                                type="secondary"
                                style={{ fontSize: 11 }}
                                ellipsis
                              >
                                {addr.address}, {addr.city}{" "}
                                {addr.postal_code || ""}
                              </Text>
                            </div>
                          </div>
                          <Space size={4}>
                            {!addr.is_default && (
                              <Tooltip title="Set as default">
                                <Button
                                  size="small"
                                  icon={<Star size={13} />}
                                  onClick={() => setDefaultAddress(addr.id)}
                                  style={{ borderRadius: 2 }}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Edit address">
                              <Button
                                size="small"
                                icon={<Edit3 size={13} />}
                                onClick={() => openAddressEditModal(addr)}
                                style={{ borderRadius: 2 }}
                              />
                            </Tooltip>
                            <Button
                              size="small"
                              danger
                              onClick={() => deleteAddress(addr.id)}
                              style={{ borderRadius: 2 }}
                            >
                              Delete
                            </Button>
                          </Space>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Orders Tab ───────────────────────────── */}
            {!detailLoading && detailTab === "orders" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <Table
                  columns={orderColumns}
                  dataSource={orderHistory}
                  loading={orderHistoryLoading}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: "No orders found." }}
                  scroll={{ x: "max-content" }}
                />
                {orderHistoryTotal > 10 && (
                  <Pagination
                    current={orderHistoryPage}
                    pageSize={10}
                    total={orderHistoryTotal}
                    onChange={(pg) => loadOrderHistory(selected.id, pg)}
                    size="small"
                    showSizeChanger={false}
                    showTotal={(count) => `${count} orders`}
                  />
                )}
              </div>
            )}

            {/* ─── Loyalty Tab ──────────────────────────── */}
            {!detailLoading && detailTab === "loyalty" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {loyaltyLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: 40,
                    }}
                  >
                    <DotsRing
                      style={{ width: 36, height: 36, color: palette.warning }}
                    />
                  </div>
                ) : loyaltyData ? (
                  <>
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
                          padding: 12,
                          border: `1px solid ${palette.border}`,
                          borderRadius: 2,
                          background: "#FEF9C3",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Balance
                        </Text>
                        <div>
                          <Text
                            strong
                            style={{ fontSize: 22, color: "#A16207" }}
                          >
                            {loyaltyData.balance.toLocaleString()}
                          </Text>
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: "center",
                          padding: 12,
                          border: `1px solid ${palette.border}`,
                          borderRadius: 2,
                          background: "#ECFDF5",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Earned
                        </Text>
                        <div>
                          <Text
                            strong
                            style={{ fontSize: 22, color: palette.success }}
                          >
                            {loyaltyData.earned.toLocaleString()}
                          </Text>
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: "center",
                          padding: 12,
                          border: `1px solid ${palette.border}`,
                          borderRadius: 2,
                          background: "#FEF2F2",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Redeemed
                        </Text>
                        <div>
                          <Text
                            strong
                            style={{ fontSize: 22, color: palette.danger }}
                          >
                            {loyaltyData.burnt.toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Text strong>Recent Transactions</Text>
                    {(loyaltyData.transactions || []).length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No transactions yet"
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {loyaltyData.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              border: `1px solid ${palette.border}`,
                              borderRadius: 2,
                              fontSize: 12,
                            }}
                          >
                            <div>
                              <Space size={6} align="center">
                                <Tag
                                  color={
                                    tx.type === "earned" ? "green" : "orange"
                                  }
                                  style={{ margin: 0, fontSize: 10 }}
                                >
                                  {tx.type === "earned" ? "+" : "-"}
                                  {tx.points}
                                </Tag>
                                <Text>{tx.description || "Points"}</Text>
                              </Space>
                              {tx.restaurant_name && (
                                <div>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    {tx.restaurant_name}
                                  </Text>
                                </div>
                              )}
                            </div>
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, flexShrink: 0 }}
                            >
                              {formatDate(tx.created_at)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── Edit Customer Modal ──────────────────────── */}
      <Modal
        title="Edit Customer"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={saveCustomer}
        confirmLoading={submitting}
        okText="Save Changes"
        width={440}
        forceRender
      >
        <Form form={editForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Full name"
            name="name"
            rules={[{ required: true, message: "Please enter the name." }]}
          >
            <Input
              prefix={<User size={14} color={palette.muted} />}
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter the email." },
              { type: "email", message: "Invalid email format." },
            ]}
          >
            <Input
              prefix={<Mail size={14} color={palette.muted} />}
              allowClear
            />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input
              prefix={<Phone size={14} color={palette.muted} />}
              allowClear
              placeholder="Optional"
            />
          </Form.Item>
          <Form.Item
            label="Account status"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Restricted" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Add/Edit Address Modal ───────────────────── */}
      <Modal
        title={addressModalMode === "edit" ? "Edit Address" : "Add Address"}
        open={addressModalOpen}
        onCancel={() => setAddressModalOpen(false)}
        onOk={saveAddress}
        confirmLoading={submitting}
        okText={addressModalMode === "edit" ? "Save Changes" : "Add Address"}
        width={460}
        forceRender
      >
        <Form form={addressForm} layout="vertical" requiredMark={false}>
          <Form.Item label="Label" name="label">
            <Select
              allowClear
              placeholder="Optional — e.g. Home, Office"
              options={[
                { value: "Home", label: "Home" },
                { value: "Office", label: "Office" },
                { value: "Other", label: "Other" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter the address." }]}
          >
            <Input
              prefix={<MapPin size={14} color={palette.muted} />}
              allowClear
              placeholder="Street address"
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: "Required." }]}
            >
              <Input allowClear />
            </Form.Item>
            <Form.Item label="Postal code" name="postal_code">
              <Input allowClear placeholder="Optional" />
            </Form.Item>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Form.Item
              label="Latitude"
              name="lat"
              rules={[{ required: true, message: "Required." }]}
            >
              <InputNumber
                className="!w-full"
                min={-90}
                max={90}
                step={0.0001}
                placeholder="11.5564"
              />
            </Form.Item>
            <Form.Item
              label="Longitude"
              name="lng"
              rules={[{ required: true, message: "Required." }]}
            >
              <InputNumber
                className="!w-full"
                min={-180}
                max={180}
                step={0.0001}
                placeholder="104.9282"
              />
            </Form.Item>
          </div>
          <Form.Item
            label="Set as default"
            name="is_default"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default CustomersPage;
