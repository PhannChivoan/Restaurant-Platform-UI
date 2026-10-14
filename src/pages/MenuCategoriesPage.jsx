import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
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
  CheckCircle2,
  Edit3,
  Ellipsis,
  Eye,
  FolderTree,
  List,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  XCircle,
  ArrowUpDown,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

/* =========================================================
   HELPERS
========================================================= */

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save category.";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const MenuCategoriesPage = () => {
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

  // ─── Filters state ───────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Reference data ──────────────────────────────
  const [restaurantOptions, setRestaurantOptions] = useState([]);

  // ─── Detail drawer state ─────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Category modal state ────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadCategories = async (manual = false) => {
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
      if (search) params.set("search", search);
      if (restaurantFilter) params.set("restaurant_id", restaurantFilter);
      if (statusFilter !== "") params.set("is_active", statusFilter);

      const response = await request(
        `menu-categories?${params.toString()}`,
        "GET",
      );

      if (response?.data) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((row) => row.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load categories.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load categories.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRestaurants = async () => {
    const res = await request("restaurants?limit=200", "GET");
    if (Array.isArray(res?.data)) {
      setRestaurantOptions(
        res.data.map((r) => ({ value: r.id, label: r.name })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, page, search, restaurantFilter, statusFilter]);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     DERIVED
  ========================================================= */

  const openDetail = (category) => {
    setSelected(category);
    setDetailOpen(true);
    setDetailLoading(true);

    request(
      `menu-categories/${category.restaurant_id}/${category.id}`,
      "GET",
    ).then((detail) => {
      if (detail?.id) {
        setSelected((current) =>
          current && current.id === detail.id ? detail : current,
        );
      }
    }).finally(() => setDetailLoading(false));
  };

  /* =========================================================
     CATEGORY CRUD
  ========================================================= */

  const openModal = (category = null) => {
    setEditingCategory(category);
    categoryForm.resetFields();

    if (category) {
      categoryForm.setFieldsValue({
        restaurant_id: category.restaurant_id,
        name: category.name,
        description: category.description,
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      categoryForm.setFieldsValue({
        is_active: true,
        display_order: 0,
      });
    }

    setModalOpen(true);
  };

  const saveCategory = async () => {
    let values;
    try {
      values = await categoryForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name,
      description: values.description || null,
      display_order: values.display_order ?? 0,
      is_active: values.is_active ? 1 : 0,
    };

    const response = editingCategory
      ? await request(
          `restaurants/${editingCategory.restaurant_id}/categories/${editingCategory.id}`,
          "PUT",
          payload,
        )
      : await request(
          `restaurants/${values.restaurant_id}/categories`,
          "POST",
          { ...payload, restaurant_id: values.restaurant_id },
        );

    setSubmitting(false);

    if (!response?.id && !response?.message) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(
      editingCategory ? "Category updated." : "Category created.",
    );
    setModalOpen(false);
    setEditingCategory(null);
    categoryForm.resetFields();

    setSelected((current) =>
      current && current.id === (response.id || editingCategory?.id)
        ? { ...current, ...response }
        : current,
    );
    setRefreshKey((key) => key + 1);
  };

  const toggleActive = async (category) => {
    const response = await request(
      `restaurants/${category.restaurant_id}/categories/${category.id}`,
      "PUT",
      { is_active: category.is_active ? 0 : 1 },
    );

    if (response?.id || response?.is_active !== undefined) {
      message.success(
        `Category ${category.is_active ? "deactivated" : "activated"}.`,
      );
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Unable to update category.");
    }
  };

  const deleteCategory = (category) => {
    Modal.confirm({
      title: "Delete category?",
      content: `"${category.name}" will be permanently removed. Menu items in this category will become uncategorized.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `restaurants/${category.restaurant_id}/categories/${category.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Category deleted.");
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
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={38}
            shape="square"
            style={{ background: palette.primaryLight, flexShrink: 0 }}
          >
            <FolderTree size={16} color={palette.primary} />
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
                {value}
              </Typography.Link>
            </Tooltip>
            {row.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.description.length > 50
                    ? `${row.description.slice(0, 50)}…`
                    : row.description}
                </Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Restaurant",
      dataIndex: "restaurant_name",
      key: "restaurant_name",
      render: (value) => value || "-",
    },
    {
      title: "Sort",
      dataIndex: "display_order",
      key: "display_order",
      width: 80,
      align: "center",
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value ?? 0}
        </Text>
      ),
    },
    {
      title: "Items",
      dataIndex: "menu_items_count",
      key: "menu_items_count",
      width: 80,
      align: "center",
      render: (value) => (
        <Tag
          color={value > 0 ? "blue" : "default"}
          style={{ margin: 0, borderRadius: 20 }}
        >
          <List
            size={11}
            style={{
              marginRight: 3,
              verticalAlign: "-2px",
            }}
          />
          {value ?? 0}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, row) => (
        <Tag
          color={row.is_active ? "green" : "default"}
          style={{ margin: 0 }}
        >
          {row.is_active ? "Active" : "Inactive"}
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
              { key: "edit", label: "Edit category", icon: <Edit3 size={15} /> },
              {
                key: "toggle",
                label: row.is_active ? "Deactivate" : "Activate",
                icon: row.is_active ? (
                  <PauseCircle size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                ),
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "view") openDetail(row);
              if (key === "edit") openModal(row);
              if (key === "toggle") toggleActive(row);
              if (key === "delete") deleteCategory(row);
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
        label="Menu categories loading"
      />

      <ModulePage
        title="Menu Categories"
        description="Organize restaurant menus into browsable categories. Reorder, activate, and manage per-restaurant selections."
        icon={Tags}
        stats={[
          {
            label: "Total categories",
            value: stats.total ?? 0,
            icon: Tags,
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
            label: "Inactive",
            value: stats.inactive ?? 0,
            color: palette.warning,
            icon: PauseCircle,
            iconBackground: "#FFF7ED",
          },
          {
            label: "Restaurants",
            value: stats.restaurants ?? 0,
            icon: FolderTree,
            iconBackground: "#EFF6FF",
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
              placeholder="Search category or restaurant…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 260 }}
            />
            <Select
              placeholder="All restaurants"
              value={restaurantFilter || undefined}
              onChange={(value) => {
                setRestaurantFilter(value || "");
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={restaurantOptions}
              style={{ width: 180 }}
            />
            <Select
              placeholder="All statuses"
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value ?? "");
                setPage(1);
              }}
              allowClear
              options={STATUS_OPTIONS}
              style={{ width: 140 }}
            />
            <Button
              icon={<RefreshCw size={15} />}
              loading={refreshing}
              onClick={() => setRefreshKey((key) => key + 1)}
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
              Add Category
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
            `${range[0]}-${range[1]} of ${count} categories`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Category Detail Drawer ───────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <FolderTree size={18} color={palette.primary} />
            <span>{selected?.name}</span>
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
                onClick={() => openModal(selected)}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteCategory(selected)}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Restaurant
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.restaurant_name || "-"}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Slug
                </Text>
                <Text code style={{ fontSize: 12 }}>
                  /{selected.slug}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Sort order
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.display_order ?? 0}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Status
                </Text>
                {selected.is_active ? (
                  <Tag color="green" style={{ margin: 0 }}>
                    Active
                  </Tag>
                ) : (
                  <Tag style={{ margin: 0 }}>Inactive</Tag>
                )}
              </div>
              {selected.description && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selected.description}
                  </Text>
                </div>
              )}
            </div>

            {/* Menu Items */}
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
                  <List size={15} color={palette.primary} />
                  <Text strong>
                    Menu Items ({selected.menu_items_count ?? 0})
                  </Text>
                </Space>
              </div>

              {detailLoading ? (
                <Card size="small" style={{ borderRadius: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <DotsRing style={{ width: 20, height: 20, color: palette.primary }} />
                    <Text type="secondary">Loading items…</Text>
                  </div>
                </Card>
              ) : (selected.menu_items || []).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No items in this category"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {(selected.menu_items || []).map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      style={{ borderRadius: 2 }}
                      styles={{ body: { padding: "8px 12px" } }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
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
                            <Text strong style={{ fontSize: 13 }}>
                              {item.name}
                            </Text>
                            {item.is_featured && (
                              <Tag
                                color="orange"
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  lineHeight: "16px",
                                }}
                              >
                                Featured
                              </Tag>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 2,
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              ${item.price?.toFixed(2)}
                              {item.discounted_price != null && (
                                <Text
                                  delete
                                  type="secondary"
                                  style={{ fontSize: 11, marginLeft: 4 }}
                                >
                                  ${item.discounted_price.toFixed(2)}
                                </Text>
                              )}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {item.prep_time_minutes}m prep
                            </Text>
                          </div>
                        </div>
                        <Tag
                          color={item.is_available ? "green" : "red"}
                          style={{ margin: 0, fontSize: 10 }}
                        >
                          {item.is_available ? "Available" : "Unavailable"}
                        </Tag>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Category Modal ──────────────────── */}
      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveCategory}
        confirmLoading={submitting}
        okText={editingCategory ? "Save Changes" : "Create Category"}
        width={480}
        forceRender
      >
        <Form form={categoryForm} layout="vertical" requiredMark={false}>
          {!editingCategory && (
            <Form.Item
              label="Restaurant"
              name="restaurant_id"
              rules={[
                { required: true, message: "Please select a restaurant." },
              ]}
            >
              <Select
                placeholder="Select a restaurant"
                showSearch
                optionFilterProp="label"
                options={restaurantOptions}
              />
            </Form.Item>
          )}
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter the category name." },
            ]}
          >
            <Input placeholder="e.g. Popular Dishes" allowClear />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={2}
              placeholder="Short description (optional)"
            />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item label="Sort order" name="display_order">
              <InputNumber
                className="!w-full"
                min={0}
                max={999}
                placeholder="0"
              />
            </Form.Item>
            <Form.Item
              label="Status"
              name="is_active"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default MenuCategoriesPage;
