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
  Building2,
  CheckCircle2,
  DollarSign,
  Edit3,
  Ellipsis,
  Eye,
  Map,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Zap,
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

const formatCurrency = (v) =>
  v != null ? `$${Number(v).toFixed(2)}` : "-";

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

const DeliveryZonesPage = () => {
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

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Reference data ──────────────────────────────
  const [allBranches, setAllBranches] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  // ─── Zone modal ──────────────────────────────────
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm] = Form.useForm();

  // ─── Surge modal ─────────────────────────────────
  const [surgeModalOpen, setSurgeModalOpen] = useState(false);
  const [surgeZone, setSurgeZone] = useState(null);
  const [surgeRules, setSurgeRules] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadZones = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);

      const response = await request(
        `zones?${params.toString()}`,
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
        setError(response?.message || "Unable to load zones.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load zones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBranches = async () => {
    const res = await request("branches?limit=500", "GET");
    if (Array.isArray(res?.data)) {
      setAllBranches(res.data);
      setBranchOptions(
        res.data.map((b) => ({
          value: b.id,
          label: `${b.name} — ${b.restaurant_name || ""}`,
          city: b.city,
        })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadZones();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, page, search]);

  useEffect(() => {
    loadBranches();
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

  const openDetail = (zone) => {
    setSelected(zone);
    setDetailOpen(true);
    setDetailLoading(true);

    request(`zones/${zone.id}`, "GET")
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
     ZONE CRUD
  ========================================================= */

  const openZoneModal = (zone = null) => {
    setEditingZone(zone);
    zoneForm.resetFields();

    if (zone) {
      zoneForm.setFieldsValue({
        name: zone.name,
        base_fee: zone.base_fee,
        fee_per_km: zone.fee_per_km,
        free_delivery_threshold: zone.free_delivery_threshold,
        branch_ids: (zone.branches || []).map((b) => b.id),
      });
    } else {
      zoneForm.setFieldsValue({
        base_fee: 1.5,
        fee_per_km: 0.5,
        branch_ids: [],
      });
    }

    setZoneModalOpen(true);
  };

  const saveZone = async () => {
    let values;
    try {
      values = await zoneForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name,
      base_fee: values.base_fee ?? 0,
      fee_per_km: values.fee_per_km ?? 0,
      free_delivery_threshold: values.free_delivery_threshold || null,
      branch_ids: values.branch_ids || [],
    };

    const response = editingZone
      ? await request(`zones/${editingZone.id}`, "PUT", payload)
      : await request("zones", "POST", payload);

    setSubmitting(false);

    if (!response?.id && !response?.message) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingZone ? "Zone updated." : "Zone created.");
    setZoneModalOpen(false);
    setEditingZone(null);
    zoneForm.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const deleteZone = (zone) => {
    Modal.confirm({
      title: "Delete delivery zone?",
      content: `"${zone.name}" will be permanently removed. Branches assigned to this zone will not be affected.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`zones/${zone.id}`, "DELETE");

        if (response?.message) {
          message.success("Zone deleted.");
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
     BRANCH ASSIGNMENT
  ========================================================= */

  const assignBranch = async (branchId) => {
    if (!selected) return;
    const response = await request(
      `zones/${selected.id}/assign-branch`,
      "POST",
      { branch_id: branchId },
    );

    if (response?.message) {
      message.success("Branch assigned.");
      const detail = await request(`zones/${selected.id}`, "GET");
      if (detail?.id) setSelected(detail);
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Failed to assign branch.");
    }
  };

  const removeBranch = async (branchId) => {
    if (!selected) return;
    const response = await request(
      `zones/${selected.id}/branches/${branchId}`,
      "DELETE",
    );

    if (response?.message) {
      message.success("Branch removed.");
      const detail = await request(`zones/${selected.id}`, "GET");
      if (detail?.id) setSelected(detail);
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Failed to remove branch.");
    }
  };

  /* =========================================================
     SURGE RULES
  ========================================================= */

  const openSurgeModal = (zone) => {
    setSurgeZone(zone);
    setSurgeRules(zone.surge_pricing_rules || []);
    setSurgeModalOpen(true);
  };

  const addSurgeRule = () => {
    setSurgeRules((prev) => [
      ...prev,
      { day: "monday", start: "18:00", end: "22:00", multiplier: 1.5 },
    ]);
  };

  const updateSurgeRule = (index, field, value) => {
    setSurgeRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)),
    );
  };

  const removeSurgeRule = (index) => {
    setSurgeRules((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSurge = async () => {
    if (!surgeZone) return;
    setSubmitting(true);

    const response = await request(`zones/${surgeZone.id}/surge`, "PUT", {
      rules: surgeRules,
    });

    setSubmitting(false);

    if (response?.id || response?.message) {
      message.success("Surge rules updated.");
      setSurgeModalOpen(false);
      setSurgeZone(null);
      setRefreshKey((key) => key + 1);
    } else {
      message.error(firstSaveError(response));
    }
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Zone",
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
              background: "#EFF6FF",
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <Map size={16} color={palette.info} />
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
                {row.branches_count ?? 0} branches
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Base Fee",
      dataIndex: "base_fee",
      key: "base_fee",
      width: 100,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Per km",
      dataIndex: "fee_per_km",
      key: "fee_per_km",
      width: 90,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Free Delivery",
      dataIndex: "free_delivery_threshold",
      key: "free_delivery_threshold",
      width: 120,
      align: "right",
      render: (value) =>
        value != null ? `Over ${formatCurrency(value)}` : "-",
    },
    {
      title: "Surge",
      key: "surge",
      width: 80,
      align: "center",
      render: (_, row) =>
        (row.surge_pricing_rules || []).length > 0 ? (
          <Tag color="orange" style={{ margin: 0 }}>
            <Zap
              size={11}
              style={{ marginRight: 2, verticalAlign: "-2px" }}
            />
            {row.surge_pricing_rules.length}
          </Tag>
        ) : (
          <Tag style={{ margin: 0 }}>None</Tag>
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
              { key: "edit", label: "Edit zone", icon: <Edit3 size={15} /> },
              {
                key: "surge",
                label: "Surge pricing",
                icon: <Zap size={15} />,
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
              if (key === "edit") openZoneModal(row);
              if (key === "surge") openSurgeModal(row);
              if (key === "delete") deleteZone(row);
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

  const DAY_OPTIONS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }));

  const assignedBranchIds = (selected?.branches || []).map((b) => b.id);
  const unassignedBranches = branchOptions.filter(
    (opt) => !assignedBranchIds.includes(opt.value),
  );

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
        label="Delivery zones loading"
      />

      <ModulePage
        title="Delivery Zones"
        description="Configure service boundaries, distance-based fees, surge pricing, and free delivery rules."
        icon={Map}
        stats={[
          {
            label: "Total zones",
            value: stats.total ?? 0,
            icon: Map,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Covered branches",
            value: stats.total_branches ?? 0,
            icon: Building2,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Avg. base fee",
            value: formatCurrency(stats.avg_base_fee),
            color: palette.success,
            icon: DollarSign,
            iconBackground: "#ECFDF5",
          },
          {
            label: "With surge rules",
            value: stats.surge_rules ?? 0,
            color: palette.warning,
            icon: Zap,
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
              placeholder="Search zone name…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
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
              onClick={() => openZoneModal()}
            >
              Add Zone
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
            `${range[0]}-${range[1]} of ${count} zones`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Zone Detail Drawer ───────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <Map size={18} color={palette.info} />
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
                onClick={() => {
                  setDetailOpen(false);
                  openZoneModal(selected);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteZone(selected)}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Fee info */}
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
                  Base delivery fee
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {formatCurrency(selected.base_fee)}
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
                  Fee per km
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {formatCurrency(selected.fee_per_km)}
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
                  Free delivery over
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.free_delivery_threshold != null
                    ? formatCurrency(selected.free_delivery_threshold)
                    : "Not set"}
                </Text>
              </div>
            </div>

            {/* Surge rules */}
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
                  <Zap size={15} color={palette.warning} />
                  <Text strong>
                    Surge Rules (
                    {(selected.surge_pricing_rules || []).length})
                  </Text>
                </Space>
                <Button
                  size="small"
                  icon={<Plus size={13} />}
                  onClick={() => {
                    setDetailOpen(false);
                    openSurgeModal(selected);
                  }}
                  style={{ borderRadius: 2 }}
                >
                  Configure
                </Button>
              </div>

              {(selected.surge_pricing_rules || []).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No surge rules configured"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {(selected.surge_pricing_rules || []).map((rule, idx) => (
                    <div
                      key={idx}
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
                      <Text>
                        <Text strong>{rule.day}</Text>{" "}
                        {rule.start}–{rule.end}
                      </Text>
                      <Tag color="orange" style={{ margin: 0 }}>
                        {rule.multiplier}x
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned branches */}
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
                  <Building2 size={15} color={palette.primary} />
                  <Text strong>
                    Assigned Branches ({selected.branches?.length ?? 0})
                  </Text>
                </Space>
              </div>

              {(selected.branches || []).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No branches assigned"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {(selected.branches || []).map((branch) => (
                    <Card
                      key={branch.id}
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
                              {branch.name}
                            </Text>
                            {branch.is_active ? (
                              <Tag
                                color="green"
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  lineHeight: "16px",
                                }}
                              >
                                Active
                              </Tag>
                            ) : (
                              <Tag
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  lineHeight: "16px",
                                }}
                              >
                                Inactive
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
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {branch.address}, {branch.city}
                            </Text>
                          </div>
                        </div>
                        <Button
                          size="small"
                          danger
                          onClick={() => removeBranch(branch.id)}
                          style={{ borderRadius: 2 }}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {unassignedBranches.length > 0 && (
                <Select
                  placeholder="Add a branch…"
                  style={{ width: "100%", marginTop: 8 }}
                  showSearch
                  optionFilterProp="label"
                  options={unassignedBranches}
                  onChange={(value) => assignBranch(value)}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Zone Modal ─────────────────────── */}
      <Modal
        title={editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
        open={zoneModalOpen}
        onCancel={() => setZoneModalOpen(false)}
        onOk={saveZone}
        confirmLoading={submitting}
        okText={editingZone ? "Save Changes" : "Create Zone"}
        width={500}
        forceRender
      >
        <Form form={zoneForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Zone name"
            name="name"
            rules={[{ required: true, message: "Please enter the zone name." }]}
          >
            <Input placeholder="e.g. Central Phnom Penh" allowClear />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="Base fee ($)"
              name="base_fee"
              rules={[{ required: true, message: "Required." }]}
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
              label="Fee per km ($)"
              name="fee_per_km"
              rules={[{ required: true, message: "Required." }]}
            >
              <InputNumber
                className="!w-full"
                min={0}
                step={0.1}
                prefix="$"
                placeholder="0.00"
              />
            </Form.Item>
          </div>
          <Form.Item
            label="Free delivery threshold"
            name="free_delivery_threshold"
            tooltip="Set an order total above which delivery is free"
          >
            <InputNumber
              className="!w-full"
              min={0}
              step={1}
              prefix="$"
              placeholder="Optional — e.g. 20.00"
            />
          </Form.Item>
          <Form.Item label="Assign branches" name="branch_ids">
            <Select
              mode="multiple"
              placeholder="Select branches to include"
              showSearch
              optionFilterProp="label"
              options={branchOptions}
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Surge Pricing Modal ─────────────────────── */}
      <Modal
        title={`Surge Pricing — ${surgeZone?.name || ""}`}
        open={surgeModalOpen}
        onCancel={() => setSurgeModalOpen(false)}
        onOk={saveSurge}
        confirmLoading={submitting}
        okText="Save Rules"
        width={520}
        forceRender
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {surgeRules.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No surge rules yet"
              style={{ marginBottom: 8 }}
            />
          )}
          {surgeRules.map((rule, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                border: `1px solid ${palette.border}`,
                borderRadius: 2,
              }}
            >
              <Select
                size="small"
                value={rule.day}
                onChange={(v) => updateSurgeRule(index, "day", v)}
                options={DAY_OPTIONS}
                style={{ width: 120 }}
              />
              <Input
                size="small"
                value={rule.start}
                onChange={(e) =>
                  updateSurgeRule(index, "start", e.target.value)
                }
                placeholder="18:00"
                style={{ width: 80 }}
              />
              <Text type="secondary">–</Text>
              <Input
                size="small"
                value={rule.end}
                onChange={(e) =>
                  updateSurgeRule(index, "end", e.target.value)
                }
                placeholder="22:00"
                style={{ width: 80 }}
              />
              <InputNumber
                size="small"
                value={rule.multiplier}
                onChange={(v) => updateSurgeRule(index, "multiplier", v)}
                min={1}
                max={5}
                step={0.1}
                suffix="x"
                style={{ width: 80 }}
              />
              <Button
                size="small"
                danger
                icon={<Trash2 size={13} />}
                onClick={() => removeSurgeRule(index)}
                style={{ borderRadius: 2, flexShrink: 0 }}
              />
            </div>
          ))}
          <Button
            size="small"
            icon={<Plus size={13} />}
            onClick={addSurgeRule}
            style={{ borderRadius: 2, alignSelf: "flex-start" }}
          >
            Add rule
          </Button>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Surge multipliers are applied to the delivery fee during the
            specified hours.
          </Text>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default DeliveryZonesPage;
