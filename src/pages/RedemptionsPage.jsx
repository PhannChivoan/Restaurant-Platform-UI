import { formatMoney } from "../utils/platformSettings";
import { useCallback, useEffect, useState } from "react";

import {
  Avatar,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  BadgePercent,
  CheckCircle2,
  Clock,
  Ellipsis,
  Eye,
  Hash,
  Package,
  RefreshCw,
  Search,
  TicketCheck,
  XCircle,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
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

const STATUS_CONFIG = {
  success: { color: "success", label: "Success", icon: CheckCircle2 },
  failed: { color: "error", label: "Failed", icon: XCircle },
  expired: { color: "warning", label: "Expired", icon: Clock },
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const RedemptionsPage = () => {
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
  const [statusFilter, setStatusFilter] = useState(null);

  // ─── Reference data ──────────────────────────────
  const [promoOptions, setPromoOptions] = useState([]);
  const [promoFilter, setPromoFilter] = useState(null);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadRedemptions = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (promoFilter) params.set("promotion_id", String(promoFilter));

      const response = await request(`promotions/redemptions?${params.toString()}`, "GET");

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
        setError(response?.message || "Unable to load redemptions.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load redemptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, page, search, statusFilter, promoFilter]);

  const loadPromotions = async () => {
    const res = await request("promotions?limit=100", "GET");
    if (Array.isArray(res?.data)) {
      setPromoOptions(
        res.data.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRedemptions();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshKey, loadRedemptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPromotions();
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

  const openDetail = (redemption) => {
    setSelected(redemption);
    setDetailOpen(true);
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Promotion",
      key: "promotion",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            style={{
              background:
                row.status === "success" ? palette.primaryLight : "#FEF2F2",
              flexShrink: 0,
            }}
            icon={
              row.status === "success" ? (
                <BadgePercent size={16} color={palette.primary} />
              ) : (
                <XCircle size={16} color={palette.danger} />
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
                {row.promotion?.name || "Unknown"}
              </Typography.Link>
            </Tooltip>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Hash size={10} style={{ verticalAlign: "-1px" }} />
                {row.code_used}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "user",
      render: (_, row) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {row.user?.name || "Unknown"}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.user?.email || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Discount",
      dataIndex: "discount_amount",
      key: "discount_amount",
      width: 100,
      align: "right",
      sorter: (a, b) => (a.discount_amount || 0) - (b.discount_amount || 0),
      render: (value, row) => (
        <Text
          strong
          style={{
            fontSize: 13,
            color: row.status === "success" ? palette.success : palette.muted,
          }}
        >
          {row.status === "success" ? `-${formatCurrency(value)}` : "-"}
        </Text>
      ),
    },
    {
      title: "Order Total",
      dataIndex: "order_total",
      key: "order_total",
      width: 100,
      align: "right",
      render: (value) => (
        <Text style={{ fontSize: 12 }}>{formatCurrency(value)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.failed;
        return (
          <Tag color={config.color} style={{ margin: 0 }}>
            {config.label}
          </Tag>
        );
      },
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
        label="Redemptions loading"
      />

      <ModulePage
        title="Promotion Redemptions"
        description="Track voucher usage, customer limits, and campaign redemption performance."
        icon={TicketCheck}
        stats={[
          {
            label: "Total redemptions",
            value: stats.total ?? 0,
            icon: TicketCheck,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Successful",
            value: stats.successful ?? 0,
            color: palette.success,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Failed",
            value: stats.failed ?? 0,
            color: palette.danger,
            icon: XCircle,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Total discount",
            value: formatCurrency(stats.total_discount ?? 0),
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
              placeholder="Search code, customer, or promotion…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 280 }}
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
                { value: "success", label: "Success" },
                { value: "failed", label: "Failed" },
              ]}
            />
            <Select
              placeholder="Promotion"
              value={promoFilter}
              onChange={(v) => {
                setPromoFilter(v);
                setPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={promoOptions}
              style={{ width: 200 }}
            />
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
            `${range[0]}-${range[1]} of ${count} redemptions`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Detail Drawer ──────────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <TicketCheck size={18} color={palette.primary} />
            <span>Redemption Details</span>
          </Space>
        }
        placement="right"
        size={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status Header */}
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
                {selected.code_used}
              </div>
              <div style={{ marginTop: 8 }}>
                <Tag
                  color={
                    STATUS_CONFIG[selected.status]?.color || "default"
                  }
                  style={{ fontSize: 13, padding: "2px 10px" }}
                >
                  {STATUS_CONFIG[selected.status]?.label || selected.status}
                </Tag>
              </div>
            </div>

            {/* Redemption Info */}
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
                  label: "Promotion",
                  value: selected.promotion?.name || "-",
                },
                {
                  label: "Type",
                  value: selected.promotion?.type === "percentage"
                    ? `${selected.promotion?.value}% off`
                    : `${formatCurrency(selected.promotion?.value)} off`,
                },
                {
                  label: "Customer",
                  value: selected.user?.name || "Unknown",
                },
                {
                  label: "Email",
                  value: selected.user?.email || "-",
                },
                {
                  label: "Order total",
                  value: formatCurrency(selected.order_total),
                },
                {
                  label: "Discount applied",
                  value:
                    selected.status === "success"
                      ? `-${formatCurrency(selected.discount_amount)}`
                      : "-",
                },
                {
                  label: "Order ID",
                  value: selected.order_id
                    ? `#${selected.order_id}`
                    : "-",
                },
                {
                  label: "Failure reason",
                  value: selected.failure_reason || "-",
                },
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

            {/* Metadata */}
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <Text strong style={{ marginBottom: 8, display: "block" }}>
                  Metadata
                </Text>
                <div
                  style={{
                    padding: 10,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 2,
                    background: "#F8FAFC",
                    fontFamily: "monospace",
                    fontSize: 11,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(selected.metadata, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ConfigProvider>
  );
};

export default RedemptionsPage;
