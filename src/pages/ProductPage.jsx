import { useEffect, useState } from "react";

import {
  Avatar,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";

import {
  CircleCheck,
  Edit3,
  Ellipsis,
  Eye,
  ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   CONSTANTS
========================================================= */

const AVAILABILITY_OPTIONS = [
  { value: "", label: "All availability" },
  { value: "true", label: "Available" },
  { value: "false", label: "Sold out" },
];

const FEATURED_OPTIONS = [
  { value: "", label: "All items" },
  { value: "true", label: "Featured" },
  { value: "false", label: "Not featured" },
];

/* =========================================================
   HELPERS
========================================================= */

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatPrice = (price, discounted) => {
  const hasDiscount =
    discounted != null &&
    discounted !== "" &&
    Number(discounted) < Number(price);

  if (hasDiscount) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Text delete type="secondary" style={{ fontSize: 12 }}>
          ${Number(price).toFixed(2)}
        </Text>
        <Text strong style={{ color: palette.danger }}>
          ${Number(discounted).toFixed(2)}
        </Text>
      </div>
    );
  }

  return <Text strong>${Number(price || 0).toFixed(2)}</Text>;
};

const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save item.";
};

const uploadTrigger = (
  <div
    style={{
      color: palette.muted,
      fontSize: 11,
      padding: 4,
      textAlign: "center",
    }}
  >
    <ImageIcon size={18} style={{ margin: "0 auto" }} />
    <div style={{ marginTop: 4 }}>Upload</div>
  </div>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const ProductPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 12;

  // ─── Filters state ───────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  // ─── Reference data ──────────────────────────────
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  // ─── Detail drawer state ─────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ─── Item modal state ────────────────────────────
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadItems = async (manual = false) => {
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
      if (restaurantFilter)
        params.set("restaurant_id", String(restaurantFilter));
      if (categoryFilter) params.set("category_id", String(categoryFilter));
      if (availabilityFilter) params.set("is_available", availabilityFilter);
      if (featuredFilter) params.set("is_featured", featuredFilter);

      const response = await request(`menu-items?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((row) => row.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load menu items.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load menu items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReferenceData = async () => {
    const [restaurantsRes, categoriesRes] = await Promise.all([
      request("restaurants?limit=100", "GET"),
      request("menu-categories?limit=200", "GET"),
    ]);

    if (Array.isArray(restaurantsRes?.data)) {
      setRestaurantOptions(
        restaurantsRes.data.map((restaurant) => ({
          value: restaurant.id,
          label: restaurant.name,
        })),
      );
    }

    if (Array.isArray(categoriesRes?.data)) {
      setCategoryOptions(
        categoriesRes.data.map((category) => ({
          value: category.id,
          label: `${category.name} — ${category.restaurant_name || ""}`,
          restaurant_id: category.restaurant_id,
        })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    refreshKey,
    page,
    search,
    restaurantFilter,
    categoryFilter,
    availabilityFilter,
    featuredFilter,
  ]);

  useEffect(() => {
    // Deferred so state updates happen outside of the effect body.
    const timer = setTimeout(() => {
      loadReferenceData();
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
     ITEM CRUD
  ========================================================= */

  const openDetail = (item) => {
    setSelected(item);
    setDetailOpen(true);
  };

  const openItemModal = (item = null) => {
    setEditingItem(item);
    itemForm.resetFields();

    if (item) {
      itemForm.setFieldsValue({
        restaurant_id: item.restaurant_id,
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        price: item.price,
        discounted_price: item.discounted_price,
        prep_time_minutes: item.prep_time_minutes,
        is_available: item.is_available ?? true,
        is_featured: item.is_featured ?? false,
        image: item.image_url
          ? [
              {
                uid: "-1",
                name: "image",
                status: "done",
                url: toMediaUrl(item.image_url),
              },
            ]
          : [],
      });
    } else {
      itemForm.setFieldsValue({
        is_available: true,
        is_featured: false,
        prep_time_minutes: 15,
      });
    }

    setItemModalOpen(true);
  };

  const saveItem = async () => {
    let values;
    try {
      values = await itemForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const formData = new FormData();

    if (editingItem) {
      formData.append("_method", "PUT");
    }

    formData.append("category_id", String(values.category_id));
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    formData.append("price", String(values.price));
    formData.append(
      "discounted_price",
      values.discounted_price != null ? String(values.discounted_price) : "",
    );
    formData.append(
      "prep_time_minutes",
      String(values.prep_time_minutes || 15),
    );
        formData.append("is_available", values.is_available ? "1" : "0");
    formData.append("is_featured", values.is_featured ? "1" : "0");

    const imageFile = (values.image || []).find((file) => file.originFileObj);
    if (imageFile) {
      formData.append("image_file", imageFile.originFileObj);
    }
    if (editingItem && values.image && values.image.length === 0) {
      formData.append("remove_image", "clear");
    }

    const response = editingItem
      ? await request(
          `restaurants/${editingItem.restaurant_id}/items/${editingItem.id}`,
          "POST",
          formData,
        )
      : await request(
          `restaurants/${values.restaurant_id}/items`,
          "POST",
          formData,
        );

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingItem ? "Item updated." : "Item created.");
    setItemModalOpen(false);
    setEditingItem(null);
    itemForm.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const toggleAvailability = async (item) => {
    const response = await request(
      `restaurants/${item.restaurant_id}/items/${item.id}/toggle`,
      "PATCH",
    );

    if (response?.is_available !== undefined) {
      setRows((current) =>
        current.map((row) =>
          row.id === item.id
            ? { ...row, is_available: response.is_available }
            : row,
        ),
      );
      setSelected((current) =>
        current && current.id === item.id
          ? { ...current, is_available: response.is_available }
          : current,
      );
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Unable to update item.");
    }
  };

  const deleteItem = (item) => {
    Modal.confirm({
      title: "Delete item?",
      content: `${item.name} will be removed from the menu.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `restaurants/${item.restaurant_id}/items/${item.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Item deleted.");
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
      title: "Item",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={40}
            shape="square"
            style={{ background: palette.primaryLight, flexShrink: 0 }}
            src={row.image_url ? toMediaUrl(row.image_url) : undefined}
          >
            <UtensilsCrossed size={16} color={palette.primary} />
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Tooltip title="Click to view details">
              <Typography.Link
                strong
                onClick={() => openDetail(row)}
                style={{ color: palette.ink, fontWeight: 600 }}
              >
                {value}
              </Typography.Link>
            </Tooltip>
            {row.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.description.length > 60
                    ? `${row.description.slice(0, 60)}…`
                    : row.description}
                </Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category_name",
      key: "category_name",
      render: (value) => value || "-",
    },
    {
      title: "Restaurant",
      dataIndex: "restaurant_name",
      key: "restaurant_name",
      render: (value) => value || "-",
    },
    {
      title: "Price",
      key: "price",
      width: 120,
      align: "right",
      render: (_, row) => formatPrice(row.price, row.discounted_price),
    },
    {
      title: "Availability",
      key: "availability",
      width: 110,
      render: (_, row) => (
        <Tag color={row.is_available ? "green" : "red"} style={{ margin: 0 }}>
          {row.is_available ? "Available" : "Sold out"}
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
              { key: "edit", label: "Edit item", icon: <Edit3 size={15} /> },
              {
                key: "toggle",
                label: row.is_available ? "Mark sold out" : "Mark available",
                icon: <CircleCheck size={15} />,
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete item",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openItemModal(row);
              if (key === "toggle") toggleAvailability(row);
              if (key === "delete") deleteItem(row);
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
    <TopProgressBar active={loading || refreshing} label="Menu items loading" />

    <ModulePage
        title="Menu & Items"
        description="Manage menu items, pricing, images, modifiers, and real-time availability across all restaurants."
        icon={UtensilsCrossed}
        stats={[
          {
            label: "Total items",
            value: stats.total ?? 0,
            icon: Package,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Available",
            value: stats.available ?? 0,
            color: palette.success,
            icon: CircleCheck,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Sold out",
            value: stats.unavailable ?? 0,
            color: palette.danger,
            icon: UtensilsCrossed,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Missing images",
            value: stats.missing_images ?? 0,
            color: palette.warning,
            icon: ImageIcon,
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
              placeholder="Search item or restaurant…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="All restaurants"
              value={restaurantFilter || undefined}
              onChange={(value) => {
                setRestaurantFilter(value || "");
                setCategoryFilter("");
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={restaurantOptions}
              style={{ width: 170 }}
            />
            <Select
              placeholder="All categories"
              value={categoryFilter || undefined}
              onChange={(value) => {
                setCategoryFilter(value || "");
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={categoryOptions}
              style={{ width: 170 }}
            />
            <Select
              placeholder="Availability"
              value={availabilityFilter || undefined}
              onChange={(value) => {
                setAvailabilityFilter(value || "");
                setPage(1);
              }}
              allowClear
              options={AVAILABILITY_OPTIONS}
              style={{ width: 130 }}
            />
            <Select
              placeholder="Featured"
              value={featuredFilter || undefined}
              onChange={(value) => {
                setFeaturedFilter(value || "");
                setPage(1);
              }}
              allowClear
              options={FEATURED_OPTIONS}
              style={{ width: 120 }}
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
              onClick={() => openItemModal()}
            >
              Add Item
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
            `${range[0]}-${range[1]} of ${count} items`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Item Detail Drawer ──────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <UtensilsCrossed size={18} color={palette.primary} />
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
              <Switch
                checked={selected.is_available}
                onChange={() => toggleAvailability(selected)}
                checkedChildren="Available"
                unCheckedChildren="Sold out"
                size="small"
              />
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => openItemModal(selected)}
              >
                Edit
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {selected.image_url && (
              <Image
                src={toMediaUrl(selected.image_url)}
                alt={selected.name}
                width="100%"
                height={180}
                style={{ objectFit: "cover", borderRadius: 2 }}
                preview
              />
            )}

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
                { label: "Restaurant", value: selected.restaurant_name },
                { label: "Category", value: selected.category_name || "-" },
                {
                  label: "Price",
                  value:
                    selected.discounted_price != null &&
                    Number(selected.discounted_price) < Number(selected.price)
                      ? `$${Number(selected.price).toFixed(2)} → $${Number(selected.discounted_price).toFixed(2)}`
                      : `$${Number(selected.price || 0).toFixed(2)}`,
                },
                {
                  label: "Prep time",
                  value: `${selected.prep_time_minutes || 15} min`,
                },
                {
                  label: "Availability",
                  value: selected.is_available ? "Available" : "Sold out",
                },
                {
                  label: "Featured",
                  value: selected.is_featured ? "Yes" : "No",
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

            {selected.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Description
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 13 }}>{selected.description}</Text>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                icon={<Star size={14} />}
                style={{ borderRadius: 2 }}
                onClick={() =>
                  message.info("Featured toggle coming soon.")
                }
              >
                {selected.is_featured ? "Unfeature" : "Feature"}
              </Button>
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteItem(selected)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Item Modal ─────────────────────── */}
      <Modal
        title={editingItem ? "Edit Item" : "Add Item"}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={saveItem}
        confirmLoading={submitting}
        okText={editingItem ? "Save Changes" : "Create Item"}
        width={560}
        forceRender
      >
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          {!editingItem && (
            <Form.Item
              label="Restaurant"
              name="restaurant_id"
              rules={[{ required: true, message: "Please select a restaurant." }]}
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
            label="Category"
            name="category_id"
            rules={[{ required: true, message: "Please select a category." }]}
          >
            <Select
              placeholder="Select a category"
              showSearch
              optionFilterProp="label"
              options={categoryOptions.filter(
                (option) =>
                  !editingItem &&
                  option.restaurant_id === itemForm.getFieldValue("restaurant_id"),
              )}
              disabled={editingItem && !selected?.restaurant_id}
            />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter the item name." }]}
          >
            <Input placeholder="e.g. Classic Beef Lok Lak" allowClear />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Short description (optional)" />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Price is required." }]}
            >
              <InputNumber
                className="!w-full"
                min={0}
                step={0.01}
                prefix="$"
                placeholder="0.00"
              />
            </Form.Item>
            <Form.Item label="Discounted price" name="discounted_price">
              <InputNumber
                className="!w-full"
                min={0}
                step={0.01}
                prefix="$"
                placeholder="Optional"
              />
            </Form.Item>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item label="Prep time (min)" name="prep_time_minutes">
              <InputNumber className="!w-full" min={1} placeholder="15" />
            </Form.Item>
            <Form.Item
              label="Featured"
              name="is_featured"
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </div>
          <Form.Item
            label="Availability"
            name="is_available"
            valuePropName="checked"
          >
            <Switch checkedChildren="Available" unCheckedChildren="Sold out" />
          </Form.Item>
          <Form.Item
            label="Image"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/jpeg,image/png,image/webp"
              beforeUpload={() => false}
            >
              {uploadTrigger}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default ProductPage;
