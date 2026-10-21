import { formatMoney } from "../utils/platformSettings";
import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Dropdown,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";

import {
  Banknote,
  Bike,
  CircleDot,
  Download,
  Edit3,
  Ellipsis,
  Plus,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import { Config } from "../utils/config";
import { request } from "../utils/request";
import { palette } from "../constants/theme";
import dayjs from "dayjs";

import EarningsChart from "./EarningsChart";
import { exportToCSV } from "../utils/mapHelpers";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* =========================================================
   CONSTANTS
========================================================= */

const VEHICLE_OPTIONS = ["motorcycle", "car", "bicycle", "van"].map(
  (value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }),
);

const DATE_PRESETS = [
  { label: "Today", value: [dayjs(), dayjs()] },
  {
    label: "Yesterday",
    value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")],
  },
  { label: "Last 7 days", value: [dayjs().subtract(7, "day"), dayjs()] },
  { label: "Last 30 days", value: [dayjs().subtract(30, "day"), dayjs()] },
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
];

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => formatMoney(value);

const formatStatus = (status = "") =>
  status
    ? status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ")
    : "-";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

// Media helper – the backend returns relative /storage/... URLs which must
// be joined with the API origin (e.g. http://localhost:8000) to be viewable.
const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Flatten a Laravel 422 validation response into one readable message.
const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save rider.";
};

// antd Upload -> Form integration helper.
const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const RiderEarningsPage = () => {
  // ─── Earnings state ──────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [totalRecords, setTotalRecords] = useState(0);

  // ─── Filters state ──────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // ─── Rider management state ──────────────────────
  const [riders, setRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [riderForm] = Form.useForm();
  const [viewingRider, setViewingRider] = useState(null);
  const [existingDocs, setExistingDocs] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ─── Initial loads & debounce ──────────────────
  useEffect(() => {
    let active = true;

    const loadEarnings = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (dateRange?.[0])
        params.set("date_from", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange?.[1])
        params.set("date_to", dateRange[1].format("YYYY-MM-DD"));

      const response = await request(
        `dispatch/earnings?${params.toString()}`,
        "GET",
      );

      if (!active) return;

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setStats(response.stats || {});
        setTotalRecords(response.total ?? response.data.length);
      } else {
        setError(response?.message || "Unable to load rider earnings.");
      }
      setLoading(false);
    };

    loadEarnings();
    return () => {
      active = false;
    };
  }, [page, pageSize, search, dateRange, refreshKey]);

  useEffect(() => {
    let active = true;

    const loadRiders = async () => {
      setLoadingRiders(true);
      const response = await request("riders?limit=100", "GET");

      if (!active) return;

      if (Array.isArray(response?.data)) {
        setRiders(response.data);
      } else {
        message.error(response?.message || "Failed to load riders.");
      }
      setLoadingRiders(false);
    };

    loadRiders();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const refreshAll = () => setRefreshKey((key) => key + 1);

  // ─── Clear filters ──────────────────────────────
  const activeFilterCount =
    (search ? 1 : 0) + (dateRange?.[0] || dateRange?.[1] ? 1 : 0);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateRange(null);
    setPage(1);
  };

  // ─── Rider CRUD handlers ────────────────────────
  // Load users that can still be attached as riders (unique key picker).
  const loadRiderCandidates = async () => {
    setLoadingUsers(true);
    const response = await request("users/rider-candidates?limit=100", "GET");
    if (Array.isArray(response?.data)) {
      setUserOptions(
        response.data.map((user) => ({
          value: user.id,
          searchText: `${user.name} ${user.email}`.toLowerCase(),
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: palette.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {user.avatar ? (
                  <img
                    src={toMediaUrl(user.avatar)}
                    alt={user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <UserRound size={12} color={palette.primary} />
                )}
              </div>
              <div>
                <div style={{ lineHeight: "16px" }}>{user.name}</div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, lineHeight: "14px" }}
                >
                  {user.email}
                </Text>
              </div>
            </div>
          ),
        })),
      );
    } else {
      setUserOptions([]);
    }
    setLoadingUsers(false);
  };

  const openRiderModal = (rider = null) => {
    setEditingRider(rider);
    riderForm.resetFields();
    if (rider) {
      riderForm.setFieldsValue({
        name: rider.name ?? rider.user?.name,
        email: rider.email ?? rider.user?.email,
        phone: rider.phone ?? rider.user?.phone ?? "",
        vehicle_type: rider.vehicle_type,
        license_plate: rider.license_plate,
        avatar: rider.avatar
          ? [{ uid: "-1", name: "avatar", status: "done", url: rider.avatar }]
          : [],
      });
      setExistingDocs(
        (rider.document_paths || []).map((path, index) => ({
          path,
          url: rider.documents?.[index] || toMediaUrl(path),
        })),
      );
    } else {
      setExistingDocs([]);
      loadRiderCandidates();
    }
    setRemovedDocs([]);
    setRiderModalOpen(true);
  };

  const openRiderProfile = (rider) => {
    setViewingRider(rider);

    // Enrich the profile with contact info, delivered stats and recent
    // deliveries from the single-rider endpoint.
    request(`riders/${rider.id}`, "GET").then((detail) => {
      if (detail?.id) {
        setViewingRider((current) =>
          current?.id === detail.id
            ? {
                ...current,
                ...detail,
                avatar: toMediaUrl(detail.user?.avatar || current.avatar),
                documents: (detail.documents || []).map((url) =>
                  toMediaUrl(url),
                ),
                document_paths: detail.document_paths || [],
                phone: detail.user?.phone ?? current.phone,
              }
            : current,
        );
      }
    });
  };

  const closeRiderModal = () => {
    setRiderModalOpen(false);
    setEditingRider(null);
    setExistingDocs([]);
    setRemovedDocs([]);
    riderForm.resetFields();
  };

  // Toggle an existing document's removal (undoable until save).
  const toggleRemoveDoc = (path) =>
    setRemovedDocs((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );

  const saveRider = async () => {
    let values;
    try {
      values = await riderForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    // Multipart-safe payload. PHP cannot parse multipart PATCH bodies, so
    // updates are spoofed as POST + _method=PATCH (Laravel method override).
    const formData = new FormData();

    // Profile photo (create + edit) – stored on the user record.
    const avatarFile = (values.avatar || []).find((f) => f.originFileObj);
    if (avatarFile) formData.append("avatar", avatarFile.originFileObj);

    if (editingRider) {
      formData.append("_method", "PATCH");
      if (values.name) formData.append("name", values.name);
      if (values.email) formData.append("email", values.email);
      formData.append("phone", values.phone || "");
      formData.append("vehicle_type", values.vehicle_type);
      formData.append("license_plate", values.license_plate || "");

      removedDocs.forEach((path) =>
        formData.append("remove_documents[]", path),
      );
    } else {
      formData.append("user_id", String(values.user_id));
      formData.append("vehicle_type", values.vehicle_type);
      if (values.license_plate) {
        formData.append("license_plate", values.license_plate);
      }
    }

    (values.documents || []).forEach((file) => {
      if (file.originFileObj) {
        formData.append("documents[]", file.originFileObj);
      }
    });

    const response = editingRider
      ? await request(`riders/${editingRider.id}`, "POST", formData)
      : await request("riders", "POST", formData);
    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingRider ? "Rider updated." : "Rider created.");
    closeRiderModal();
    refreshAll();
  };

  const toggleRiderOnline = async (rider) => {
    const response = await request(`riders/${rider.id}/online`, "PATCH");
    if (typeof response?.is_online === "boolean") {
      message.success(
        `Rider is now ${response.is_online ? "online" : "offline"}.`,
      );
      refreshAll();
    } else {
      message.error(response?.message || "Unable to update rider status.");
    }
  };

  const toggleRiderAvailability = async (rider) => {
    const response = await request(`riders/${rider.id}`, "PATCH", {
      is_available: !rider.is_available,
    });
    if (response?.id) {
      message.success(
        `Rider marked ${response.is_available ? "available" : "unavailable"}.`,
      );
      refreshAll();
    } else {
      message.error(
        response?.message || "Unable to update rider availability.",
      );
    }
  };

  const confirmDeleteRider = (rider) => {
    const name = rider.rider || rider.email || `Rider #${rider.id}`;
    Modal.confirm({
      title: "Delete rider",
      content: `Remove ${name}'s rider profile? This action cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`riders/${rider.id}`, "DELETE");
        if (response?.message) {
          message.success("Rider deleted.");
          refreshAll();
        } else {
          message.error(response?.message || "Unable to delete rider.");
        }
      },
    });
  };

  // ─── Merged rows: earnings + rider profile data ──
  // The earnings endpoint drives the table (server-side pagination and
  // filters); rider profile fields that only exist on `riders` (documents,
  // lifetime totals, avatar URL) are merged in by rider profile id.
  const mergedRows = useMemo(
    () =>
      rows.map((row) => {
        const profile = riders.find((r) => r.id === row.rider_profile_id);
        return {
          ...row,
          id: profile?.id ?? row.rider_profile_id,
          user_id: profile?.user_id ?? null,
          name: profile?.user?.name ?? row.rider,
          email: profile?.user?.email ?? row.email,
          phone: profile?.user?.phone ?? null,
          avatar: toMediaUrl(profile?.user?.avatar || row.avatar),
          documents: (profile?.documents ?? []).map((url) => toMediaUrl(url)),
          document_paths: profile?.document_paths ?? [],
          total_trips: profile?.total_trips ?? row.trips ?? 0,
          total_earnings: profile?.total_earnings ?? row.earnings ?? 0,
        };
      }),
    [rows, riders],
  );

  // ─── Combined earnings & rider table columns ─────
  const mergedColumns = [
    {
      title: "NO",
      key: "number",
      width: 60,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Rider",
      dataIndex: "rider",
      key: "rider",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              overflow: "hidden",
              background: palette.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `2px solid ${palette.border}`,
            }}
          >
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={value}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <UserRound size={16} color={palette.primary} />
            )}
          </div>
          <div>
            <Text strong>{value}</Text>
            {row.email && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {row.email}
                </Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, row) => (
        <div>
          <Text>{formatStatus(row.vehicle_type)}</Text>
          {row.license_plate && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.license_plate}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (value) => (
        <span style={{ color: palette.warning }}>
          ★ {Number(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: "Trips",
      dataIndex: "trips",
      key: "trips",
      align: "right",
      render: (value, row) => (
        <div>
          <div>{value ?? 0}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Lifetime: {row.total_trips ?? 0}
          </Text>
        </div>
      ),
    },
    {
      title: "Earnings",
      dataIndex: "earnings",
      key: "earnings",
      align: "right",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Avg / Trip",
      dataIndex: "average_per_trip",
      key: "average_per_trip",
      align: "right",
      render: (value) => <Text type="secondary">{formatCurrency(value)}</Text>,
    },
    {
      title: "Last Delivery",
      dataIndex: "last_delivery_at",
      key: "last_delivery_at",
      render: (value) => formatDate(value),
    },
    {
      title: "Documents",
      key: "documents",
      align: "center",
      render: (_, row) => {
        const docs = row.documents || [];
        return docs.length > 0 ? (
          <Tooltip title="View documents">
            <Tag
              color="blue"
              onClick={() => openRiderProfile(row)}
              style={{
                margin: 0,
                borderRadius: 20,
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              {docs.length} file{docs.length > 1 ? "s" : ""}
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>
            None
          </Text>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => (
        <Space size={4}>
          <Tag
            color={row.is_online ? "green" : "default"}
            style={{ margin: 0, borderRadius: 20, fontSize: 11 }}
          >
            {row.is_online ? "Online" : "Offline"}
          </Tag>
          <Tag
            color={row.is_available ? "blue" : "default"}
            style={{ margin: 0, borderRadius: 20, fontSize: 11 }}
          >
            {row.is_available ? "Available" : "Unavailable"}
          </Tag>
        </Space>
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
                label: "View Profile",
                icon: <UserRound size={15} />,
              },
              {
                key: "edit",
                label: "Edit rider",
                icon: <Edit3 size={15} />,
              },
              {
                key: "toggle",
                label: row.is_online ? "Set offline" : "Set online",
                icon: <CircleDot size={15} />,
              },
              {
                key: "availability",
                label: row.is_available
                  ? "Mark unavailable"
                  : "Mark available",
                icon: <Bike size={15} />,
              },
              {
                key: "delete",
                label: "Delete rider",
                icon: <XCircle size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "view") openRiderProfile(row);
              if (key === "edit") openRiderModal(row);
              if (key === "toggle") toggleRiderOnline(row);
              if (key === "availability") toggleRiderAvailability(row);
              if (key === "delete") confirmDeleteRider(row);
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

  // Upload slots left for documents (max 5, including existing ones).
  const docSlots = 5 - (existingDocs.length - removedDocs.length);

  const uploadTrigger = (
    <div
      style={{
        color: palette.muted,
        fontSize: 11,
        padding: 4,
        textAlign: "center",
      }}
    >
      <Plus size={16} style={{ margin: "0 auto" }} />
      <div style={{ marginTop: 4 }}>Upload</div>
    </div>
  );



  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 2,
        },
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <ModulePage
          title="Rider Earnings"
          description="Track rider earnings from delivered trips and manage rider profiles."
          icon={WalletCards}
          stats={[
            {
              label: "Trips today",
              value: stats.trips_today ?? 0,
              icon: TrendingUp,

              iconBackground: "#DBEAFE",
            },
            {
              label: "Earnings today",
              value: formatCurrency(stats.earnings_today ?? 0),
              icon: WalletCards,

              iconBackground: "#DCFCE7",
            },
            {
              label: "Gross earnings",
              value: formatCurrency(stats.gross_earnings ?? 0),
              description: dateRange
                ? "Within the selected date range"
                : "All delivered trips",
              icon: Banknote,

              iconBackground: palette.primaryLight,
            },
            {
              label: "Available riders",
              value: stats.available_riders ?? 0,
              description: "Online and ready for dispatch",
              icon: Bike,
              iconBackground: "#FEF3C7",
            },
          ]}
          loading={loading}
          error={error}
          toolbar={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <Input.Search
                allowClear
                placeholder="Search rider, email, vehicle, plate"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                style={{ flex: "0 0 280px", borderRadius: 2 }}
              />

              <RangePicker
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setPage(1);
                }}
                allowEmpty={[true, true]}
                format="YYYY-MM-DD"
                presets={DATE_PRESETS}
                style={{ width: 280, borderRadius: 2 }}
              />

              <Button
                icon={<RotateCcw size={15} />}
                disabled={activeFilterCount === 0}
                onClick={clearFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
                style={{ borderRadius: 2, width: 100 }}
              >
                Clear
              </Button>

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
                style={{ width: 140, borderRadius: 2 }}
              />

              <Button
                icon={<RefreshCw size={15} />}
                onClick={refreshAll}
                loading={loading || loadingRiders}
                style={{ borderRadius: 2 }}
              >
                Refresh
              </Button>

              <Button
                icon={<Download size={15} />}
                disabled={rows.length === 0 || loading}
                onClick={() => exportToCSV(rows)}
                style={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>

              <Button
                type="primary"
                icon={<Plus size={16} />}
                style={{ borderRadius: 2 }}
                onClick={() => openRiderModal()}
              >
                Add Rider
              </Button>
            </div>
          }
          pagination={{
            current: page,
            pageSize,
            total: totalRecords,
            showSizeChanger: false,
            onChange: setPage,
            disabled: loading,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} riders`,
          }}
          columns={mergedColumns}
          rows={mergedRows}
        />

        {/* ─── Earnings Insights ───────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 14,
          }}
        >
          <Card
            variant="outlined"
            style={{ borderRadius: 2 }}
            title={
              <Space align="center" size={10}>
                <TrendingUp
                  size={18}
                  color={palette.primary}
                  strokeWidth={1.8}
                />
                <span>Earnings Insights</span>
              </Space>
            }
            extra={
              dateRange
                ? `${dateRange[0].format("MMM D")} – ${dateRange[1].format("MMM D, YYYY")}`
                : "All time"
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 8,
              }}
            >
              {[
                {
                  label: "Total Trips",
                  value: rows.reduce((sum, r) => sum + (r.trips || 0), 0),
                  color: palette.primary,
                  bg: palette.primaryLight,
                },
                {
                  label: "Total Earnings",
                  value: formatMoney(rows.reduce((sum, r) => sum + Number(r.earnings || 0), 0)),
                  color: palette.success,
                  bg: "#DCFCE7",
                },
                {
                  label: "Avg / Trip",
                  value: formatMoney(
                    rows.reduce((sum, r) => sum + (r.trips || 0), 0) > 0
                      ? rows.reduce((sum, r) => sum + Number(r.earnings || 0), 0) / rows.reduce((sum, r) => sum + (r.trips || 0), 0)
                      : 0,
                  ),
                  color: palette.info,
                  bg: "#DBEAFE",
                },
                {
                  label: "Active Riders",
                  value: rows.filter((r) => r.is_online).length,
                  color: palette.warning,
                  bg: "#FEF3C7",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: item.bg,
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.muted,
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            variant="outlined"
            style={{ borderRadius: 2 }}
            styles={{ body: { padding: 0 } }}
          >
            <EarningsChart rows={rows} />
          </Card>
        </div>

        {/* ─── Rider Profile Modal ────────────────────── */}
        <Modal
          title="Rider Profile"
          open={Boolean(viewingRider)}
          onCancel={() => setViewingRider(null)}
          footer={null}
          width={420}
        >
          {viewingRider && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: palette.primaryLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `2px solid ${palette.border}`,
                  }}
                >
                  {viewingRider.avatar ? (
                    <img
                      src={viewingRider.avatar}
                      alt={viewingRider.rider}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <UserRound size={20} color={palette.primary} />
                  )}
                </div>
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {viewingRider.rider}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {viewingRider.email || "-"}
                    </Text>
                  </div>
                </div>
              </div>
              {[
                ...(viewingRider.phone
                  ? [{ label: "Phone", value: viewingRider.phone }]
                  : []),
                {
                  label: "Vehicle",
                  value: formatStatus(viewingRider.vehicle_type),
                },
                {
                  label: "License Plate",
                  value: viewingRider.license_plate || "-",
                },
                {
                  label: "Rating",
                  value: `★ ${Number(viewingRider.rating || 0).toFixed(1)}`,
                },
                {
                  label: "Trips (selected range)",
                  value: viewingRider.trips ?? 0,
                },
                {
                  label: "Lifetime Trips",
                  value: viewingRider.total_trips ?? 0,
                },
                {
                  label: "Lifetime Earnings",
                  value: formatCurrency(viewingRider.total_earnings),
                },
                {
                  label: "Avg / Trip",
                  value: formatCurrency(viewingRider.average_per_trip),
                },
                {
                  label: "Last Delivery",
                  value: formatDate(viewingRider.last_delivery_at),
                },
                {
                  label: "Documents",
                  value: (viewingRider.documents || []).length
                    ? `${viewingRider.documents.length} file(s)`
                    : "None",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: `1px solid ${palette.border}`,
                    paddingBottom: 6,
                  }}
                >
                  <Text type="secondary">{item.label}</Text>
                  <Text strong style={{ textAlign: "right" }}>
                    {item.value}
                  </Text>
                </div>
              ))}

              {(viewingRider.documents || []).length > 0 && (
                <div>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 6 }}
                  >
                    Document images
                  </Text>
                  <Image.PreviewGroup>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {viewingRider.documents.map((url) => (
                        <Image
                          key={url}
                          src={url}
                          alt="rider document"
                          width={72}
                          height={72}
                          style={{ objectFit: "cover", borderRadius: 4 }}
                        />
                      ))}
                    </div>
                  </Image.PreviewGroup>
                </div>
              )}

              {(viewingRider.recent_deliveries || []).length > 0 && (
                <div>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 6 }}
                  >
                    Recent deliveries
                  </Text>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {viewingRider.recent_deliveries.map((delivery) => (
                      <div
                        key={delivery.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          borderBottom: `1px solid ${palette.border}`,
                          paddingBottom: 6,
                        }}
                      >
                        <Text strong>{delivery.order_number}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDate(delivery.delivered_at)}
                        </Text>
                        <Text strong>{formatCurrency(delivery.earnings)}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ─── Add/Edit Rider Modal ───────────────────── */}
        <Modal
          title={editingRider ? "Edit Rider" : "Add Rider"}
          open={riderModalOpen}
          onCancel={closeRiderModal}
          onOk={saveRider}
          confirmLoading={submitting}
          okText={editingRider ? "Save Changes" : "Create Rider"}
          width={560}
          forceRender
        >
          <Form form={riderForm} layout="vertical" requiredMark={false}>
            {!editingRider && (
              <Form.Item
                label="User"
                name="user_id"
                rules={[{ required: true, message: "Please select a user." }]}
              >
                <Select
                  placeholder="Search and select a user to attach as a rider"
                  showSearch
                  allowClear
                  loading={loadingUsers}
                  options={userOptions}
                  filterOption={(input, option) =>
                    (option?.searchText || "").includes(input.toLowerCase())
                  }
                  notFoundContent={
                    loadingUsers
                      ? "Loading users..."
                      : "No users available — everyone is already a rider."
                  }
                />
              </Form.Item>
            )}

            {editingRider && (
              <>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter the name." },
                  ]}
                >
                  <Input placeholder="Rider name" allowClear />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      type: "email",
                      message: "Please enter a valid email address.",
                    },
                  ]}
                >
                  <Input placeholder="Rider email" allowClear />
                </Form.Item>
                <Form.Item label="Phone" name="phone">
                  <Input placeholder="Phone number (optional)" allowClear />
                </Form.Item>
              </>
            )}
            <Form.Item
              label="Vehicle Type"
              name="vehicle_type"
              rules={[
                { required: true, message: "Please select a vehicle type." },
              ]}
            >
              <Select
                placeholder="Select vehicle type"
                options={VEHICLE_OPTIONS}
              />
            </Form.Item>
            <Form.Item label="License Plate" name="license_plate">
              <Input placeholder="License plate (optional)" allowClear />
            </Form.Item>
            <Form.Item
              label="Profile Photo"
              name="avatar"
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

            {!editingRider ? (
              <Form.Item
                label="Documents (up to 5 images)"
                name="documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  listType="picture-card"
                  multiple
                  maxCount={5}
                  accept="image/jpeg,image/png,image/webp"
                  beforeUpload={() => false}
                >
                  {uploadTrigger}
                </Upload>
              </Form.Item>
            ) : (
              <Form.Item label="Documents (up to 5 images)">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  {existingDocs.map((doc) => {
                    const removed = removedDocs.includes(doc.path);
                    return (
                      <div
                        key={doc.path}
                        style={{
                          position: "relative",
                          opacity: removed ? 0.35 : 1,
                        }}
                      >
                        <Image
                          src={doc.url}
                          alt="rider document"
                          width={72}
                          height={72}
                          style={{ objectFit: "cover", borderRadius: 4 }}
                        />
                        <Button
                          size="small"
                          danger={!removed}
                          icon={removed ? <RotateCcw size={11} /> : <X size={11} />}
                          title={removed ? "Restore document" : "Remove document"}
                          onClick={() => toggleRemoveDoc(doc.path)}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            minWidth: 22,
                            width: 22,
                            height: 22,
                            padding: 0,
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                    );
                  })}

                  {docSlots > 0 && (
                    <Form.Item
                      name="documents"
                      noStyle
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                    >
                      <Upload
                        listType="picture-card"
                        multiple
                        maxCount={docSlots}
                        accept="image/jpeg,image/png,image/webp"
                        beforeUpload={() => false}
                      >
                        {uploadTrigger}
                      </Upload>
                    </Form.Item>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Click the cross on a document to mark it for removal, the
                  restore icon to undo. {docSlots} upload slot
                  {docSlots === 1 ? "" : "s"} remaining.
                </Text>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default RiderEarningsPage;
