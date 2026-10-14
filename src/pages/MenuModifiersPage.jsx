import { useEffect, useState } from "react";

import {
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
  ListPlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  DollarSign,
  ToggleLeft,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { DotsRing } from "../components/ui/dots-ring";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   HELPERS
========================================================= */

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

const MenuModifiersPage = () => {
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

  // ─── Reference data ──────────────────────────────
  const [restaurantOptions, setRestaurantOptions] = useState([]);

  // ─── Detail drawer state ─────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Group modal state ───────────────────────────
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm] = Form.useForm();

  // ─── Modifier modal state ────────────────────────
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState(null);
  const [modifierForm] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadGroups = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (restaurantFilter) params.set("restaurant_id", restaurantFilter);

      const response = await request(
        `modifier-groups?${params.toString()}`,
        "GET",
      );

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
        setError(response?.message || "Unable to load modifier groups.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load modifier groups.");
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
      loadGroups();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, page, search, restaurantFilter]);

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

  const openDetail = (group) => {
    setSelected(group);
    setDetailOpen(true);
    setDetailLoading(true);

    request(`modifier-groups/${group.id}`, "GET")
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
     GROUP CRUD
  ========================================================= */

  const openGroupModal = (group = null) => {
    setEditingGroup(group);
    groupForm.resetFields();

    if (group) {
      groupForm.setFieldsValue({
        restaurant_id: group.restaurant_id,
        name: group.name,
        selection_type: group.selection_type,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
      });
    } else {
      groupForm.setFieldsValue({
        selection_type: "single",
        min_selections: 0,
        max_selections: 10,
      });
    }

    setGroupModalOpen(true);
  };

  const saveGroup = async () => {
    let values;
    try {
      values = await groupForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const response = editingGroup
      ? await request(`modifier-groups/${editingGroup.id}`, "PUT", {
          name: values.name,
          selection_type: values.selection_type,
          min_selections: values.min_selections ?? 0,
          max_selections: values.max_selections ?? 10,
        })
      : await request(
          `restaurants/${values.restaurant_id}/modifier-groups`,
          "POST",
          {
            name: values.name,
            selection_type: values.selection_type,
            min_selections: values.min_selections ?? 0,
            max_selections: values.max_selections ?? 10,
          },
        );

    setSubmitting(false);

    if (!response?.id && !response?.message) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(
      editingGroup ? "Modifier group updated." : "Modifier group created.",
    );
    setGroupModalOpen(false);
    setEditingGroup(null);
    groupForm.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const deleteGroup = (group) => {
    Modal.confirm({
      title: "Delete modifier group?",
      content: `"${group.name}" and all its modifiers will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `modifier-groups/${group.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Modifier group deleted.");
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
     MODIFIER CRUD (inside a group)
  ========================================================= */

  const openModifierModal = (modifier = null) => {
    setEditingModifier(modifier);
    modifierForm.resetFields();

    if (modifier) {
      modifierForm.setFieldsValue({
        name: modifier.name,
        price_adjustment: modifier.price_adjustment,
        is_default: modifier.is_default,
      });
    } else {
      modifierForm.setFieldsValue({
        price_adjustment: 0,
        is_default: false,
      });
    }

    setModifierModalOpen(true);
  };

  const saveModifier = async () => {
    if (!selected) return;

    let values;
    try {
      values = await modifierForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const response = editingModifier
      ? await request(`modifiers/${editingModifier.id}`, "PUT", {
          name: values.name,
          price_adjustment: values.price_adjustment ?? 0,
          is_default: values.is_default ? 1 : 0,
        })
      : await request(`modifier-groups/${selected.id}/modifiers`, "POST", {
          name: values.name,
          price_adjustment: values.price_adjustment ?? 0,
          is_default: values.is_default ? 1 : 0,
        });

    setSubmitting(false);

    if (!response?.id && !response?.message) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(
      editingModifier ? "Modifier updated." : "Modifier added.",
    );
    setModifierModalOpen(false);
    setEditingModifier(null);
    modifierForm.resetFields();

    // Refresh detail to get updated modifiers list
    const detail = await request(`modifier-groups/${selected.id}`, "GET");
    if (detail?.id) setSelected(detail);
    setRefreshKey((key) => key + 1);
  };

  const deleteModifier = (modifier) => {
    Modal.confirm({
      title: "Delete modifier?",
      content: `"${modifier.name}" will be removed from this group.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `modifiers/${modifier.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Modifier deleted.");
          const detail = await request(
            `modifier-groups/${selected.id}`,
            "GET",
          );
          if (detail?.id) setSelected(detail);
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
      title: "Group",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: palette.primaryLight,
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <ListPlus size={16} color={palette.primary} />
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
                {row.selection_type === "single" ? "Pick one" : "Pick multiple"}
                {row.min_selections > 0
                  ? ` · min ${row.min_selections}`
                  : ""}
                {row.max_selections < 10
                  ? ` · max ${row.max_selections}`
                  : ""}
              </Text>
            </div>
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
      title: "Options",
      dataIndex: "modifiers_count",
      key: "modifiers_count",
      width: 90,
      align: "center",
      render: (value) => (
        <Tag
          color={value > 0 ? "blue" : "default"}
          style={{ margin: 0, borderRadius: 20 }}
        >
          {value ?? 0}
        </Tag>
      ),
    },
    {
      title: "Selection",
      dataIndex: "selection_type",
      key: "selection_type",
      width: 110,
      render: (value) => (
        <Tag
          color={value === "single" ? "orange" : "purple"}
          style={{ margin: 0 }}
        >
          {value === "single" ? "Single" : "Multiple"}
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
              {
                key: "view",
                label: "View details",
                icon: <Eye size={15} />,
              },
              {
                key: "edit",
                label: "Edit group",
                icon: <Edit3 size={15} />,
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
              if (key === "edit") openGroupModal(row);
              if (key === "delete") deleteGroup(row);
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
        label="Modifier groups loading"
      />

      <ModulePage
        title="Modifier Groups"
        description="Manage toppings, extras, portion sizes, and required item choices across restaurants."
        icon={ListPlus}
        stats={[
          {
            label: "Total groups",
            value: stats.total ?? 0,
            icon: ListPlus,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Single select",
            value: stats.single ?? 0,
            color: palette.warning,
            icon: ToggleLeft,
            iconBackground: "#FFF7ED",
          },
          {
            label: "Multi select",
            value: stats.multiple ?? 0,
            color: palette.info,
            icon: CheckCircle2,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Restaurants",
            value: stats.restaurants ?? 0,
            icon: DollarSign,
            iconBackground: "#ECFDF5",
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
              placeholder="Search group or restaurant…"
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
              onClick={() => openGroupModal()}
            >
              Add Group
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
            `${range[0]}-${range[1]} of ${count} modifier groups`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Modifier Group Detail Drawer ──────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <ListPlus size={18} color={palette.primary} />
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
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => openModifierModal()}
              >
                Add Modifier
              </Button>
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => {
                  setDetailOpen(false);
                  openGroupModal(selected);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteGroup(selected)}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Group info */}
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
                  Selection type
                </Text>
                <Tag
                  color={
                    selected.selection_type === "single" ? "orange" : "purple"
                  }
                  style={{ margin: 0 }}
                >
                  {selected.selection_type === "single"
                    ? "Single (pick one)"
                    : "Multiple (pick many)"}
                </Tag>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Min / Max selections
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.min_selections ?? 0} /{" "}
                  {selected.max_selections ?? 10}
                </Text>
              </div>
            </div>

            {/* Modifiers list */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text strong>
                  Modifiers ({selected.modifiers?.length ?? 0})
                </Text>
                <Button
                  size="small"
                  type="primary"
                  icon={<Plus size={13} />}
                  onClick={() => openModifierModal()}
                  style={{ borderRadius: 2 }}
                >
                  Add
                </Button>
              </div>

              {detailLoading ? (
                <Card size="small" style={{ borderRadius: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <DotsRing style={{ width: 20, height: 20, color: palette.primary }} />
                    <Text type="secondary">Loading…</Text>
                  </div>
                </Card>
              ) : (selected.modifiers || []).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No modifiers yet"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {(selected.modifiers || []).map((mod) => (
                    <Card
                      key={mod.id}
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
                              {mod.name}
                            </Text>
                            {mod.is_default && (
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
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {Number(mod.price_adjustment) > 0
                              ? `+$${Number(mod.price_adjustment).toFixed(2)}`
                              : Number(mod.price_adjustment) < 0
                                ? `-$${Math.abs(Number(mod.price_adjustment)).toFixed(2)}`
                                : "No extra cost"}
                          </Text>
                        </div>
                        <Dropdown
                          trigger={["click"]}
                          menu={{
                            items: [
                              {
                                key: "edit",
                                label: "Edit",
                                icon: <Edit3 size={14} />,
                              },
                              {
                                key: "delete",
                                label: "Delete",
                                icon: <Trash2 size={14} />,
                                danger: true,
                              },
                            ],
                            onClick: ({ key }) => {
                              if (key === "edit") openModifierModal(mod);
                              if (key === "delete") deleteModifier(mod);
                            },
                          }}
                        >
                          <Button
                            size="small"
                            icon={<Ellipsis size={14} />}
                            style={{ borderRadius: 2 }}
                          />
                        </Dropdown>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Linked menu items */}
            {(selected.menu_items || []).length > 0 && (
              <div>
                <Text strong style={{ marginBottom: 8, display: "block" }}>
                  Linked Menu Items ({selected.menu_items?.length ?? 0})
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {selected.menu_items.map((item) => (
                    <Tag key={item.id} style={{ margin: 0 }}>
                      {item.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Group Modal ─────────────────────── */}
      <Modal
        title={editingGroup ? "Edit Modifier Group" : "Add Modifier Group"}
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        onOk={saveGroup}
        confirmLoading={submitting}
        okText={editingGroup ? "Save Changes" : "Create Group"}
        width={480}
        forceRender
      >
        <Form form={groupForm} layout="vertical" requiredMark={false}>
          {!editingGroup && (
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
            label="Group name"
            name="name"
            rules={[
              { required: true, message: "Please enter the group name." },
            ]}
          >
            <Input placeholder="e.g. Extra Toppings" allowClear />
          </Form.Item>
          <Form.Item
            label="Selection type"
            name="selection_type"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                {
                  value: "single",
                  label: "Single — customer picks one option",
                },
                {
                  value: "multiple",
                  label: "Multiple — customer picks several options",
                },
              ]}
            />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item label="Min selections" name="min_selections">
              <InputNumber
                className="!w-full"
                min={0}
                max={100}
                placeholder="0"
              />
            </Form.Item>
            <Form.Item label="Max selections" name="max_selections">
              <InputNumber
                className="!w-full"
                min={1}
                max={100}
                placeholder="10"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ─── Add/Edit Modifier Modal ──────────────────── */}
      <Modal
        title={editingModifier ? "Edit Modifier" : "Add Modifier"}
        open={modifierModalOpen}
        onCancel={() => setModifierModalOpen(false)}
        onOk={saveModifier}
        confirmLoading={submitting}
        okText={editingModifier ? "Save Changes" : "Add Modifier"}
        width={420}
        forceRender
      >
        <Form form={modifierForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter the name." }]}
          >
            <Input placeholder="e.g. Extra Cheese" allowClear />
          </Form.Item>
          <Form.Item
            label="Price adjustment"
            name="price_adjustment"
            tooltip="Extra cost added to the item price when this modifier is selected"
          >
            <InputNumber
              className="!w-full"
              min={0}
              step={0.25}
              prefix="$"
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item
            label="Selected by default"
            name="is_default"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default MenuModifiersPage;
