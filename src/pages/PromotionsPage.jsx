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
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";

import {
  BadgePercent,
  CheckCircle2,
  Edit3,
  Ellipsis,
  Eye,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag as TagIcon,
  Trash2,
  XCircle,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   CONSTANTS
========================================================= */

const PROMO_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount ($)" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (v) =>
  v != null ? `$${Number(v).toFixed(2)}` : "$0.00";

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

const getPromoStatus = (promo) => {
  if (!promo.is_active) return "inactive";
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return "expired";
  return "active";
};

const STATUS_CONFIG = {
  active: { color: "success", label: "Active" },
  inactive: { color: "default", label: "Inactive" },
  expired: { color: "error", label: "Expired" },
};

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save promotion.";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const PromotionsPage = () => {
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
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [restaurantFilter, setRestaurantFilter] = useState(null);

  // ─── Reference data ──────────────────────────────
  const [restaurantOptions, setRestaurantOptions] = useState([]);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Modal state ─────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadPromotions = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("is_active", statusFilter === "active" ? "1" : "0");
      if (restaurantFilter) params.set("restaurant_id", String(restaurantFilter));

      const response = await request(`promotions?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((r) => r.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load promotions.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load promotions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, page, search, typeFilter, statusFilter, restaurantFilter]);

  const loadRestaurants = async () => {
    const res = await request("restaurants?limit=100", "GET");
    if (Array.isArray(res?.data)) {
      setRestaurantOptions(
        res.data.map((r) => ({ value: r.id, label: r.name })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPromotions();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, loadPromotions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRestaurants();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const openDetail = (promo) => {
    setSelected(promo);
    setDetailOpen(true);
    setDetailLoading(true);

    request(`promotions/${promo.id}`, "GET")
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
     CRUD
  ========================================================= */

  const openModal = (promo = null) => {
    setEditingPromo(promo);
    form.resetFields();

    if (promo) {
      form.setFieldsValue({
        restaurant_id: promo.restaurant_id,
        name: promo.name,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        max_discount: promo.max_discount,
        usage_limit: promo.usage_limit,
        usage_limit_per_user: promo.usage_limit_per_user,
        stackable: promo.stackable,
        starts_at: promo.starts_at,
        expires_at: promo.expires_at,
        description: promo.description,
        is_active: promo.is_active,
      });
    } else {
      form.setFieldsValue({
        type: "percentage",
        stackable: false,
        is_active: true,
      });
    }

    setModalOpen(true);
  };

  const savePromotion = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name,
      code: values.code,
      type: values.type,
      value: values.value,
      max_discount: values.max_discount || null,
      usage_limit: values.usage_limit || null,
      usage_limit_per_user: values.usage_limit_per_user || null,
      stackable: values.stackable ? 1 : 0,
      starts_at: values.starts_at,
      expires_at: values.expires_at,
      description: values.description || null,
      restaurant_id: values.restaurant_id || null,
      is_active: values.is_active ? 1 : 0,
    };

    const response = editingPromo
      ? await request(`promotions/${editingPromo.id}`, "PUT", payload)
      : await request("promotions", "POST", payload);

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingPromo ? "Promotion updated." : "Promotion created.");
    setModalOpen(false);
    setEditingPromo(null);
    form.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const toggleActive = async (promo) => {
    const response = await request(`promotions/${promo.id}`, "PUT", {
      is_active: !promo.is_active,
    });

    if (response?.id) {
      setRows((current) =>
        current.map((row) =>
          row.id === promo.id ? { ...row, is_active: response.is_active } : row,
        ),
      );
      setSelected((current) =>
        current && current.id === promo.id
          ? { ...current, is_active: response.is_active }
          : current,
      );
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Unable to update promotion.");
    }
  };

  const deletePromo = (promo) => {
    Modal.confirm({
      title: "Delete promotion?",
      content: `"${promo.name}" (${promo.code}) will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`promotions/${promo.id}`, "DELETE");

        if (response?.message) {
          message.success("Promotion deleted.");
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
      title: "Promotion",
      key: "name",
      render: (_, row) => {
        const isPercentage = row.type === "percentage";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={38}
              style={{
                background: isPercentage ? palette.primaryLight : "#ECFDF5",
                flexShrink: 0,
              }}
              icon={
                isPercentage ? (
                  <Percent size={16} color={palette.primary} />
                ) : (
                  <TagIcon size={16} color={palette.success} />
                )
              }
            />
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
                  {row.name}
                </Typography.Link>
              </Tooltip>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.restaurant?.name || "Platform-wide"}
                </Text>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 130,
      render: (value) => (
        <Tag
          style={{
            fontFamily: "monospace",
            fontWeight: 600,
            borderRadius: 2,
            letterSpacing: 0.5,
          }}
        >
          {value}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (value, row) => {
        const isPct = value === "percentage";
        return (
          <Space size={4} align="center">
            {isPct ? (
              <Percent size={12} color={palette.primary} />
            ) : (
              <TagIcon size={12} color={palette.success} />
            )}
            <Text style={{ fontSize: 12 }}>
              {isPct ? `${row.value}%` : formatCurrency(row.value)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Value",
      key: "value_display",
      width: 100,
      align: "right",
      render: (_, row) => {
        const isPct = row.type === "percentage";
        return (
          <Text strong style={{ fontSize: 13 }}>
            {isPct ? `${row.value}%` : formatCurrency(row.value)}
          </Text>
        );
      },
    },
    {
      title: "Usage",
      key: "usage",
      width: 100,
      align: "center",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {row.usage_limit ?? "∞"}
        </Text>
      ),
    },
    {
      title: "Ends",
      dataIndex: "expires_at",
      key: "expires_at",
      width: 110,
      sorter: (a, b) =>
        (a.expires_at || "").localeCompare(b.expires_at || ""),
      render: (value) => {
        if (!value) return "-";
        const isExpired = new Date(value) < new Date();
        return (
          <Text
            type={isExpired ? "danger" : "secondary"}
            style={{ fontSize: 12 }}
          >
            {formatDate(value)}
          </Text>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, row) => {
        const status = getPromoStatus(row);
        const config = STATUS_CONFIG[status];
        return (
          <Tag color={config.color} style={{ margin: 0 }}>
            {config.label}
          </Tag>
        );
      },
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
                label: "Edit promotion",
                icon: <Edit3 size={15} />,
              },
              {
                key: "toggle",
                label: row.is_active ? "Deactivate" : "Activate",
                icon: <CheckCircle2 size={15} />,
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete promotion",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openModal(row);
              if (key === "toggle") toggleActive(row);
              if (key === "delete") deletePromo(row);
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
        label="Promotions loading"
      />

      <ModulePage
        title="Promotions"
        description="Create restaurant vouchers, platform campaigns, usage limits, and redemption rules."
        icon={BadgePercent}
        stats={[
          {
            label: "Total promotions",
            value: stats.total ?? 0,
            icon: BadgePercent,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Active",
            value: stats.active ?? 0,
            color: palette.success,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Expired",
            value: stats.expired ?? 0,
            color: palette.danger,
            icon: XCircle,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Inactive",
            value: stats.inactive ?? 0,
            color: palette.warning,
            icon: Package,
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
              placeholder="Search name or code…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 140 }}
              options={PROMO_TYPE_OPTIONS}
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
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="All restaurants"
              value={restaurantFilter}
              onChange={(v) => {
                setRestaurantFilter(v);
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={restaurantOptions}
              style={{ width: 170 }}
            />
            <Button
              icon={<RefreshCw size={15} />}
              loading={refreshing}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              style={{ borderRadius: 2, marginLeft: "auto" }}
              onClick={() => openModal()}
            >
              Add Promotion
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
            `${range[0]}-${range[1]} of ${count} promotions`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Detail Drawer ──────────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <BadgePercent size={18} color={palette.primary} />
            <span>{selected?.name}</span>
            {selected && (
              <Tag color={STATUS_CONFIG[getPromoStatus(selected)]?.color}>
                {STATUS_CONFIG[getPromoStatus(selected)]?.label}
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
              <Switch
                checked={selected.is_active}
                onChange={() => toggleActive(selected)}
                checkedChildren="Active"
                unCheckedChildren="Off"
                size="small"
              />
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => {
                  setDetailOpen(false);
                  openModal(selected);
                }}
              >
                Edit
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {detailLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ color: palette.muted }}>Loading...</div>
              </div>
            ) : (
              <>
                {/* Promo Header Card */}
                <div
                  style={{
                    padding: 16,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 2,
                    background: palette.bgSubtle,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.muted,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    Promo Code
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 22,
                      fontWeight: 700,
                      color: palette.primary,
                      letterSpacing: 2,
                    }}
                  >
                    {selected.code}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Tag
                      color={selected.type === "percentage" ? "orange" : "green"}
                      style={{ fontSize: 13, padding: "2px 10px" }}
                    >
                      {selected.type === "percentage"
                        ? `${selected.value}% off`
                        : `${formatCurrency(selected.value)} off`}
                    </Tag>
                  </div>
                </div>

                {/* Details */}
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
                    {
                      label: "Restaurant",
                      value: selected.restaurant?.name || "Platform-wide",
                    },
                    {
                      label: "Type",
                      value:
                        selected.type === "percentage" ? "Percentage" : "Fixed amount",
                    },
                    {
                      label: "Value",
                      value:
                        selected.type === "percentage"
                          ? `${selected.value}%`
                          : formatCurrency(selected.value),
                    },
                    {
                      label: "Max discount",
                      value: selected.max_discount
                        ? formatCurrency(selected.max_discount)
                        : "No limit",
                    },
                    {
                      label: "Usage limit",
                      value: selected.usage_limit ?? "Unlimited",
                    },
                    {
                      label: "Per user limit",
                      value: selected.usage_limit_per_user ?? "Unlimited",
                    },
                    {
                      label: "Stackable",
                      value: selected.stackable ? "Yes" : "No",
                    },
                    {
                      label: "Description",
                      value: selected.description || "-",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.label}
                      </Text>
                      <Text strong style={{ fontSize: 12, textAlign: "right" }}>
                        {item.value}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Date Range */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
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
                      Starts
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 12 }}>
                        {formatDateTime(selected.starts_at)}
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
                      Expires
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 12 }}>
                        {formatDateTime(selected.expires_at)}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Applicable Items */}
                {selected.applicable_items &&
                  selected.applicable_items.length > 0 && (
                    <div>
                      <Text strong style={{ marginBottom: 8, display: "block" }}>
                        Applicable Items ({selected.applicable_items.length})
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        {selected.applicable_items.map((itemId, idx) => (
                          <Tag key={idx} style={{ borderRadius: 2 }}>
                            Item #{itemId}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    icon={<Edit3 size={14} />}
                    style={{ borderRadius: 2 }}
                    onClick={() => {
                      setDetailOpen(false);
                      openModal(selected);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => deletePromo(selected)}
                    style={{ borderRadius: 2, marginLeft: "auto" }}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── Create/Edit Modal ──────────────────────── */}
      <Modal
        title={editingPromo ? "Edit Promotion" : "Create Promotion"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={savePromotion}
        confirmLoading={submitting}
        okText={editingPromo ? "Save Changes" : "Create Promotion"}
        width={560}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a promotion name." }]}
          >
            <Input placeholder="e.g. Summer Sale 20% Off" allowClear />
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="Code"
              name="code"
              rules={[{ required: true, message: "Please enter a promo code." }]}
            >
              <Input
                placeholder="e.g. SUMMER20"
                style={{ fontFamily: "monospace", textTransform: "uppercase" }}
              />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Please select a type." }]}
            >
              <Select options={PROMO_TYPE_OPTIONS} />
            </Form.Item>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="Value"
              name="value"
              rules={[{ required: true, message: "Value is required." }]}
            >
              <InputNumber
                className="!w-full"
                min={0}
                step={0.01}
                placeholder="0"
                addonAfter={form.getFieldValue("type") === "percentage" ? "%" : "$"}
              />
            </Form.Item>
            <Form.Item label="Max discount" name="max_discount">
              <InputNumber
                className="!w-full"
                min={0}
                step={0.01}
                prefix="$"
                placeholder="No limit"
              />
            </Form.Item>
          </div>

          <Form.Item label="Restaurant" name="restaurant_id">
            <Select
              placeholder="Platform-wide (all restaurants)"
              allowClear
              showSearch
              optionFilterProp="label"
              options={restaurantOptions}
            />
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item label="Usage limit" name="usage_limit">
              <InputNumber
                className="!w-full"
                min={1}
                placeholder="Unlimited"
              />
            </Form.Item>
            <Form.Item label="Per user limit" name="usage_limit_per_user">
              <InputNumber
                className="!w-full"
                min={1}
                placeholder="Unlimited"
              />
            </Form.Item>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="Starts at"
              name="starts_at"
              rules={[{ required: true, message: "Start date is required." }]}
            >
              <DatePicker
                showTime
                className="!w-full"
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item
              label="Expires at"
              name="expires_at"
              rules={[{ required: true, message: "Expiry date is required." }]}
            >
              <DatePicker
                showTime
                className="!w-full"
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Form.Item label="Stackable" name="stackable" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item label="Active" name="is_active" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={2}
              placeholder="Optional description for this promotion"
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default PromotionsPage;
