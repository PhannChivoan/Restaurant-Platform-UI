import { useCallback, useEffect, useState } from "react";

import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";

import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Edit3,
  Ellipsis,
  Eye,
  Gift,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;

/* =========================================================
   HELPERS
========================================================= */

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

const LoyaltyPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  // ─── Filters ─────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);

  // ─── Rules state ─────────────────────────────────
  const [rules, setRules] = useState({
    points_per_dollar: 10,
    redeem_ratio: 100,
    min_redeem_points: 100,
    max_redeem_percent: 50,
  });
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesForm] = Form.useForm();
  const [rulesSubmitting, setRulesSubmitting] = useState(false);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadTransactions = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);

      const response = await request(`loyalty/transactions?${params.toString()}`, "GET");

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
        setError(response?.message || "Unable to load loyalty transactions.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load loyalty transactions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, page, search, typeFilter]);

  const loadRules = async () => {
    setRulesLoading(true);
    const res = await request("loyalty/rules", "GET");
    if (res?.points_per_dollar) {
      setRules(res);
    }
    setRulesLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, loadTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRules();
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
     RULES CRUD
  ========================================================= */

  const openRulesModal = () => {
    rulesForm.resetFields();
    rulesForm.setFieldsValue({
      points_per_dollar: rules.points_per_dollar,
      redeem_ratio: rules.redeem_ratio,
      min_redeem_points: rules.min_redeem_points,
      max_redeem_percent: rules.max_redeem_percent,
    });
    setRulesModalOpen(true);
  };

  const saveRules = async () => {
    let values;
    try {
      values = await rulesForm.validateFields();
    } catch {
      return;
    }

    setRulesSubmitting(true);

    const response = await request("loyalty/rules", "PUT", {
      points_per_dollar: values.points_per_dollar,
      redeem_ratio: values.redeem_ratio,
      min_redeem_points: values.min_redeem_points || 100,
      max_redeem_percent: values.max_redeem_percent || 50,
    });

    setRulesSubmitting(false);

    if (response?.points_per_dollar) {
      setRules(response);
      message.success("Loyalty rules updated.");
      setRulesModalOpen(false);
    } else {
      message.error(firstSaveError(response));
    }
  };

  /* =========================================================
     DETAIL
  ========================================================= */

  const openDetail = (txn) => {
    setSelected(txn);
    setDetailOpen(true);
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Member",
      key: "user",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            style={{
              background: row.type === "earned" ? "#ECFDF5" : "#FEF2F2",
              flexShrink: 0,
            }}
            icon={
              row.type === "earned" ? (
                <ArrowUpRight size={16} color={palette.success} />
              ) : (
                <ArrowDownRight size={16} color={palette.danger} />
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
                {row.user?.name || "Unknown"}
              </Typography.Link>
            </Tooltip>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.user?.email || ""}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (value) => (
        <Tag
          color={value === "earned" ? "green" : "red"}
          style={{ margin: 0, textTransform: "capitalize" }}
        >
          {value === "earned" ? (
            <ArrowUpRight size={11} style={{ marginRight: 2, verticalAlign: "-2px" }} />
          ) : (
            <ArrowDownRight size={11} style={{ marginRight: 2, verticalAlign: "-2px" }} />
          )}
          {value}
        </Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      width: 100,
      align: "right",
      sorter: (a, b) => (a.points || 0) - (b.points || 0),
      render: (value, row) => (
        <Text
          strong
          style={{
            fontSize: 13,
            color: row.type === "earned" ? palette.success : palette.danger,
          }}
        >
          {row.type === "earned" ? "+" : "-"}
          {value}
        </Text>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "Order",
      key: "order",
      width: 100,
      render: (_, row) =>
        row.order ? (
          <Text style={{ fontSize: 12 }}>#{row.order.order_number || row.order_id}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 110,
      sorter: (a, b) =>
        (a.created_at || "").localeCompare(b.created_at || ""),
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(value)}
        </Text>
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
            ],
            onClick: ({ key }) => {
              if (key === "view") openDetail(row);
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
        label="Loyalty loading"
      />

      <ModulePage
        title="Loyalty Rules"
        description="Manage loyalty earning, redemption rules, member tiers, and reward balances."
        icon={Gift}
        stats={[
          {
            label: "Total transactions",
            value: stats.total_transactions ?? 0,
            icon: Coins,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Points earned",
            value: stats.total_earned ?? 0,
            color: palette.success,
            icon: ArrowUpRight,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Points redeemed",
            value: stats.total_burnt ?? 0,
            color: palette.danger,
            icon: ArrowDownRight,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Unique members",
            value: stats.unique_members ?? 0,
            color: palette.info,
            icon: User,
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
              placeholder="Search member name or email…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 260 }}
            />
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: "earned", label: "Earned" },
                { value: "burnt", label: "Redeemed" },
              ]}
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
              icon={<Settings size={15} />}
              onClick={openRulesModal}
              style={{ borderRadius: 2, marginLeft: "auto" }}
            >
              Edit Rules
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
            `${range[0]}-${range[1]} of ${count} transactions`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Rules Summary Card (above table via stats area) ─── */}
      <div style={{ margin: "0 24px 16px" }}>
        <Card
          size="small"
          style={{ borderRadius: 2, border: `1px solid ${palette.border}` }}
          title={
            <Space size={8}>
              <Settings size={15} color={palette.primary} />
              <Text strong style={{ fontSize: 13 }}>
                Current Rules
              </Text>
            </Space>
          }
          extra={
            <Button
              type="link"
              size="small"
              icon={<Edit3 size={13} />}
              onClick={openRulesModal}
              style={{ padding: 0 }}
            >
              Edit
            </Button>
          }
        >
          {rulesLoading ? (
            <Text type="secondary">Loading rules...</Text>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Earn rate",
                  value: `${rules.points_per_dollar} pts / $1`,
                  icon: TrendingUp,
                  color: palette.success,
                },
                {
                  label: "Redeem ratio",
                  value: `100 pts = $${(100 / rules.redeem_ratio).toFixed(2)}`,
                  icon: Wallet,
                  color: palette.primary,
                },
                {
                  label: "Min redeem",
                  value: `${rules.min_redeem_points} pts`,
                  icon: Coins,
                  color: palette.warning,
                },
                {
                  label: "Max discount",
                  value: `${rules.max_redeem_percent}%`,
                  icon: Gift,
                  color: palette.info,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 2,
                      background: `${item.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <item.icon size={13} color={item.color} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                      {item.label}
                    </Text>
                    <Text strong style={{ fontSize: 13 }}>
                      {item.value}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ─── Detail Drawer ──────────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <Coins size={18} color={palette.primary} />
            <span>Loyalty Transaction</span>
          </Space>
        }
        placement="right"
        size={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Points Header */}
            <div
              style={{
                padding: 20,
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
                Points {selected.type === "earned" ? "Earned" : "Redeemed"}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: selected.type === "earned" ? palette.success : palette.danger,
                }}
              >
                {selected.type === "earned" ? "+" : "-"}
                {selected.points}
              </div>
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={selected.type === "earned" ? "green" : "red"}
                  style={{ textTransform: "capitalize" }}
                >
                  {selected.type}
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
                { label: "Member", value: selected.user?.name || "Unknown" },
                { label: "Email", value: selected.user?.email || "-" },
                {
                  label: "Order",
                  value: selected.order
                    ? `#${selected.order.order_number || selected.order_id}`
                    : "-",
                },
                { label: "Description", value: selected.description || "-" },
                {
                  label: "Date",
                  value: formatDateTime(selected.created_at),
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
          </div>
        )}
      </Drawer>

      {/* ─── Rules Edit Modal ───────────────────────── */}
      <Modal
        title="Edit Loyalty Rules"
        open={rulesModalOpen}
        onCancel={() => setRulesModalOpen(false)}
        onOk={saveRules}
        confirmLoading={rulesSubmitting}
        okText="Save Rules"
        width={480}
        forceRender
      >
        <Form form={rulesForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Points per dollar"
            name="points_per_dollar"
            rules={[{ required: true, message: "Required." }]}
            tooltip="How many points a customer earns per $1 spent"
          >
            <InputNumber
              className="!w-full"
              min={1}
              step={1}
              placeholder="10"
              addonAfter="pts / $1"
            />
          </Form.Item>
          <Form.Item
            label="Redeem ratio"
            name="redeem_ratio"
            rules={[{ required: true, message: "Required." }]}
            tooltip="How many points equal $1 in discount (e.g. 100 means 100 pts = $1)"
          >
            <InputNumber
              className="!w-full"
              min={1}
              step={1}
              placeholder="100"
              addonAfter="pts = $1"
            />
          </Form.Item>
          <Form.Item
            label="Minimum redeem points"
            name="min_redeem_points"
            tooltip="Minimum points required to redeem"
          >
            <InputNumber
              className="!w-full"
              min={1}
              step={1}
              placeholder="100"
              addonAfter="pts"
            />
          </Form.Item>
          <Form.Item
            label="Max redeem discount (%)"
            name="max_redeem_percent"
            tooltip="Maximum percentage of order that can be paid with points"
          >
            <InputNumber
              className="!w-full"
              min={1}
              max={100}
              step={1}
              placeholder="50"
              addonAfter="%"
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default LoyaltyPage;
