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
  Steps,
  Switch,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";

import {
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  Ellipsis,
  Eye,
  MapPin,
  Navigation,
  PauseCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import MapLocationField from "../components/ui/MapLocationField";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";
import dayjs from "dayjs";

const { Text } = Typography;

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_META = {
  pending: { label: "Pending", color: "orange" },
  verified: { label: "Verified", color: "green" },
  suspended: { label: "Suspended", color: "red" },
  closed: { label: "Closed", color: "default" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "suspended", label: "Suspended" },
  { value: "closed", label: "Closed" },
];



const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_HOURS = DAYS.map((day) => ({
  day,
  open: "08:00",
  close: "21:00",
  closed: false,
}));

/* =========================================================
   HELPERS
========================================================= */

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" })
    : "-";

const getStatusMeta = (status) =>
  STATUS_META[status] || { label: status || "-", color: "default" };

const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save restaurant.";
};

const normalizeHours = (hours) => {
  if (!hours) return [];

  // Already a list of { day, open, close, closed } entries.
  if (Array.isArray(hours)) return hours;

  // Object keyed by day name -> convert to a uniform list.
  if (typeof hours === "object") {
    return DAYS.map((day) => {
      const entry = hours[day] || {};
      return {
        day,
        open: entry.open || entry.from || entry.start || "08:00",
        close: entry.close || entry.to || entry.end || "21:00",
        closed: Boolean(entry.closed ?? entry.is_closed ?? false),
      };
    });
  }

  return [];
};

const hoursSummary = (hours) => {
  const list = normalizeHours(hours);
  if (list.length === 0) return "-";
  const openDays = list.filter((entry) => !entry.closed);
  if (openDays.length === 0) return "Closed daily";

  const first = openDays[0];
  const sameEveryDay = openDays.every(
    (entry) => entry.open === first.open && entry.close === first.close,
  );

  if (openDays.length === 7 && sameEveryDay) {
    return `Daily ${first.open}–${first.close}`;
  }

  return `${openDays.length} day${openDays.length > 1 ? "s" : ""} · ${first.open}–${first.close}`;
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
    <Plus size={16} style={{ margin: "0 auto" }} />
    <div style={{ marginTop: 4 }}>Upload</div>
  </div>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const RestaurantsPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  // categories customers filter by (managed in Administration -> Restaurant Categories)
  const [categoryOptions, setCategoryOptions] = useState([]);
  useEffect(() => {
    request("public/categories", "GET").then((r) => setCategoryOptions((r?.data ?? []).map((c) => ({ value: c.id, label: c.name }))));
  }, []);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 12;

  // ─── Filters state ───────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Detail drawer state ─────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ─── Restaurant modal state ──────────────────────
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [restaurantForm] = Form.useForm();

  // ─── Branch modal state ──────────────────────────
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm] = Form.useForm();

  // ─── Operating hours modal state ─────────────────
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursBranch, setHoursBranch] = useState(null);
  const [hours, setHours] = useState(DEFAULT_HOURS);

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadRestaurants = async (manual = false) => {
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
      if (statusFilter) params.set("status", statusFilter);

      const response = await request(`restaurants?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        // Keep the open drawer in sync with fresh data.
        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((row) => row.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load restaurants.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load restaurants.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Deferred so state updates happen outside of the effect body.
    const timer = setTimeout(() => {
      loadRestaurants();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshKey, page, search, statusFilter]);

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

  const isOperational = useMemo(
    () =>
      Boolean(selected) &&
      selected.status === "verified" &&
      (selected.active_branches_count ?? 0) > 0,
    [selected],
  );

  const openDetail = (restaurant) => {
    setSelected(restaurant);
    setDetailOpen(true);

    // Fetch the full detail so the drawer always has fresh data (branches,
    // operating hours, coordinates) even when opened from a filtered list.
    request(`restaurants/${restaurant.id}`, "GET").then((detail) => {
      if (detail?.id) {
        setSelected((current) =>
          current && current.id === detail.id ? detail : current,
        );
      }
    });
  };

  /* =========================================================
     RESTAURANT CRUD
  ========================================================= */

  const openRestaurantModal = (restaurant = null) => {
    setEditingRestaurant(restaurant);
    restaurantForm.resetFields();

    if (restaurant) {
      restaurantForm.setFieldsValue({
        name: restaurant.name,
        category_id: restaurant.category_id ?? undefined,
        description: restaurant.description,
        logo: restaurant.logo_url
          ? [
              {
                uid: "-1",
                name: "logo",
                status: "done",
                url: toMediaUrl(restaurant.logo_url),
              },
            ]
          : [],
      });
    }

    setRestaurantModalOpen(true);
  };

  const closeRestaurantModal = () => {
    setRestaurantModalOpen(false);
    setEditingRestaurant(null);
    restaurantForm.resetFields();
  };

  const saveRestaurant = async () => {
    let values;
    try {
      values = await restaurantForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    // Multipart-safe payload (logo upload) — updates are spoofed as
    // POST + _method=PATCH because PHP cannot parse multipart PATCH.
    const formData = new FormData();

    if (editingRestaurant) {
      formData.append("_method", "PATCH");
    }

    formData.append("name", values.name);
    if (values.category_id) formData.append("category_id", String(values.category_id)); // the category sets the cuisine label
    if (values.description) formData.append("description", values.description);
    if (!editingRestaurant && values.owner_id) {
      formData.append("owner_id", String(values.owner_id));
    }

    const logoFile = (values.logo || []).find((file) => file.originFileObj);
    if (logoFile) formData.append("logo", logoFile.originFileObj);

    const response = editingRestaurant
      ? await request(`restaurants/${editingRestaurant.id}`, "POST", formData)
      : await request("restaurants", "POST", formData);

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(
      editingRestaurant ? "Restaurant updated." : "Restaurant created.",
    );
    closeRestaurantModal();

    setSelected((current) =>
      current && current.id === response.id
        ? { ...current, ...response }
        : current,
    );
    setRefreshKey((key) => key + 1);
  };

  /* =========================================================
     LIFECYCLE (verify / suspend / close) + DELETE
  ========================================================= */

  const handleLifecycle = (restaurant, action) => {
    const name = restaurant.name;

    const configs = {
      verify: {
        title: "Verify restaurant?",
        content: `${name} will be marked verified and can start receiving orders once it has an active branch.`,
        okText: "Verify",
        request: () => request(`restaurants/${restaurant.id}/verify`, "POST"),
        success: "Restaurant verified.",
      },
      suspend: {
        title: "Suspend restaurant?",
        content: `${name} will be temporarily disabled and stopped from receiving new orders.`,
        okText: "Suspend",
        danger: true,
        request: () => request(`restaurants/${restaurant.id}/suspend`, "POST"),
        success: "Restaurant suspended.",
      },
      close: {
        title: "Close restaurant permanently?",
        content: `${name} will be marked closed. This is a terminal state — use suspend for temporary pauses.`,
        okText: "Close restaurant",
        danger: true,
        request: () => request(`restaurants/${restaurant.id}/close`, "POST"),
        success: "Restaurant closed.",
      },
    };

    const config = configs[action];
    if (!config) return;

    Modal.confirm({
      title: config.title,
      content: config.content,
      okText: config.okText,
      okButtonProps: config.danger ? { danger: true } : undefined,
      cancelText: "Cancel",
      onOk: async () => {
        const response = await config.request();

        if (response?.id) {
          message.success(config.success);
          setSelected((current) =>
            current && current.id === response.id
              ? { ...current, ...response }
              : current,
          );
          setRefreshKey((key) => key + 1);
        } else {
          message.error(response?.message || "Action failed.");
        }
      },
    });
  };

  const deleteRestaurant = (restaurant) => {
    Modal.confirm({
      title: "Delete restaurant?",
      content: `${restaurant.name} will be removed (soft delete) along with its branch listings.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `restaurants/${restaurant.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Restaurant deleted.");
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
     BRANCH CRUD
  ========================================================= */

  const openBranchModal = (branch = null) => {
    if (!selected) return;

    setEditingBranch(branch);
    branchForm.resetFields();

    if (branch) {
      branchForm.setFieldsValue({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        postal_code: branch.postal_code,
        phone: branch.phone,
        location: branch.latitude != null && branch.longitude != null ? { lat: branch.latitude, lng: branch.longitude } : undefined,
        is_active: branch.is_active ?? true,
      });
    } else {
      branchForm.setFieldsValue({
        is_active: true,
      });
    }

    setBranchModalOpen(true);
  };

  const saveBranch = async () => {
    if (!selected) return;

    let values;
    try {
      values = await branchForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name,
      address: values.address,
      city: values.city,
      postal_code: values.postal_code || null,
      phone: values.phone || null,
      lat: values.location.lat,
      lng: values.location.lng,
      is_active: Boolean(values.is_active),
    };

    const response = editingBranch
      ? await request(
          `restaurants/${selected.id}/branches/${editingBranch.id}`,
          "PUT",
          payload,
        )
      : await request(`restaurants/${selected.id}/branches`, "POST", payload);

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingBranch ? "Branch updated." : "Branch added.");
    setBranchModalOpen(false);
    setEditingBranch(null);
    branchForm.resetFields();

    // Re-sync the drawer with the authoritative detail payload.
    const detail = await request(`restaurants/${selected.id}`, "GET");
    if (detail?.id) setSelected(detail);
    setRefreshKey((key) => key + 1);
  };

  const toggleBranchActive = async (branch) => {
    const response = await request(
      `restaurants/${selected.id}/branches/${branch.id}`,
      "PUT",
      { is_active: !branch.is_active },
    );

    if (response?.id) {
      setSelected((current) =>
        current
          ? {
              ...current,
              branches: current.branches.map((item) =>
                item.id === response.id
                  ? { ...item, is_active: response.is_active }
                  : item,
              ),
              active_branches_count: Math.max(
                0,
                (current.active_branches_count ?? 0) +
                  (response.is_active ? 1 : -1),
              ),
            }
          : current,
      );
      setRefreshKey((key) => key + 1);
    } else {
      message.error(response?.message || "Unable to update branch.");
    }
  };

  const deleteBranch = (branch) => {
    Modal.confirm({
      title: "Delete branch?",
      content: `${branch.name} will be removed from ${selected.name}.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `restaurants/${selected.id}/branches/${branch.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Branch deleted.");
          setSelected((current) =>
            current
              ? {
                  ...current,
                  branches: current.branches.filter(
                    (item) => item.id !== branch.id,
                  ),
                  branches_count: Math.max(
                    0,
                    (current.branches_count ?? 1) - 1,
                  ),
                  active_branches_count: branch.is_active
                    ? Math.max(0, (current.active_branches_count ?? 1) - 1)
                    : current.active_branches_count,
                }
              : current,
          );
          setRefreshKey((key) => key + 1);
        } else {
          message.error(response?.message || "Delete failed.");
        }
      },
    });
  };

  /* =========================================================
     OPERATING HOURS
  ========================================================= */

  const openHoursModal = (branch) => {
    setHoursBranch(branch);

    const existing = normalizeHours(branch.operating_hours);

    setHours(
      DAYS.map((day) => {
        const match = existing.find((entry) => entry.day === day);
        return {
          day,
          open: match?.open || "08:00",
          close: match?.close || "21:00",
          closed: match?.closed ?? false,
        };
      }),
    );

    setHoursModalOpen(true);
  };

  const saveHours = async () => {
    if (!selected || !hoursBranch) return;

    setSubmitting(true);

    const payload = hours.map((entry) => ({
      day: entry.day,
      open: entry.open,
      close: entry.close,
      closed: entry.closed,
    }));

    const response = await request(
      `restaurants/${selected.id}/branches/${hoursBranch.id}`,
      "PUT",
      { operating_hours: payload },
    );

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success("Operating hours updated.");
    setHoursModalOpen(false);
    setHoursBranch(null);

    setSelected((current) =>
      current
        ? {
            ...current,
            branches: current.branches.map((item) =>
              item.id === response.id
                ? { ...item, operating_hours: response.operating_hours }
                : item,
            ),
          }
        : current,
    );
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const lifecycleStep = (restaurant) => {
    if (restaurant.status === "pending") return 0;
    if (restaurant.status === "suspended") return 1;
    return 2; // verified or closed
  };

  const columns = [
    {
      title: "Restaurant",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={38}
            style={{ background: palette.primaryLight, flexShrink: 0 }}
            src={row.logo_url ? toMediaUrl(row.logo_url) : undefined}
          >
            <Store size={16} color={palette.primary} />
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
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.cuisine_type || "-"} · /{row.slug}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Owner",
      dataIndex: "owner",
      key: "owner",
      render: (value, row) => (
        <div style={{ minWidth: 0 }}>
          <div>{value || "-"}</div>
          {row.owner_email && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.owner_email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Branches",
      key: "branches",
      align: "center",
      width: 110,
      render: (_, row) => (
        <Tooltip
          title={`${row.active_branches_count ?? 0} of ${row.branches_count ?? 0} active`}
        >
          <Tag
            color={(row.active_branches_count ?? 0) > 0 ? "blue" : "default"}
            style={{ margin: 0, borderRadius: 20 }}
          >
            <Building2
              size={11}
              style={{ marginRight: 4, verticalAlign: "-2px" }}
            />
            {row.active_branches_count ?? 0}/{row.branches_count ?? 0}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, row) => {
        const meta = getStatusMeta(row.status);
        return (
          <Tag color={meta.color} style={{ margin: 0 }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Verified",
      dataIndex: "verified_at",
      key: "verified_at",
      width: 120,
      render: (value) => formatDate(value),
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
                label: "Edit restaurant",
                icon: <Edit3 size={15} />,
              },
              ...(row.status !== "verified"
                ? [
                    {
                      key: "verify",
                      label: "Verify",
                      icon: <CheckCircle2 size={15} />,
                    },
                  ]
                : []),
              ...(row.status === "verified"
                ? [
                    {
                      key: "suspend",
                      label: "Suspend",
                      icon: <PauseCircle size={15} />,
                    },
                  ]
                : []),
              ...(row.status !== "closed"
                ? [
                    {
                      key: "close",
                      label: "Close permanently",
                      icon: <Ban size={15} />,
                      danger: true,
                    },
                  ]
                : []),
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
              if (key === "edit") openRestaurantModal(row);
              if (key === "verify") handleLifecycle(row, "verify");
              if (key === "suspend") handleLifecycle(row, "suspend");
              if (key === "close") handleLifecycle(row, "close");
              if (key === "delete") deleteRestaurant(row);
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
        label="Restaurants loading"
      />

      <ModulePage
        title="Restaurants & Branches"
        description="Manage restaurant partners, branch locations, operating hours, and verification."
        icon={Store}
        stats={[
          {
            label: "Total restaurants",
            value: stats.total ?? 0,
            icon: Store,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Verified",
            value: stats.verified ?? 0,
            color: palette.success,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Pending verification",
            value: stats.pending ?? 0,
            color: palette.warning,
            icon: Clock3,
            iconBackground: "#FFF7ED",
          },
          {
            label: "Suspended",
            value: stats.suspended ?? 0,
            color: palette.danger,
            icon: XCircle,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Active branches",
            value: stats.active_branches ?? 0,
            icon: Building2,
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
              placeholder="Search name, cuisine, or city…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 260 }}
            />
            <Select
              placeholder="All statuses"
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value || "");
                setPage(1);
              }}
              allowClear
              options={STATUS_OPTIONS}
              style={{ width: 160 }}
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
              onClick={() => openRestaurantModal()}
            >
              Add Restaurant
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
            `${range[0]}-${range[1]} of ${count} restaurants`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Restaurant Detail Drawer ───────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <Store size={18} color={palette.primary} />
            <span>{selected?.name}</span>
          </Space>
        }
        placement="right"
        size={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          selected && (
            <Space>
              {selected.status !== "verified" && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleLifecycle(selected, "verify")}
                >
                  Verify
                </Button>
              )}
              {selected.status === "verified" && (
                <Button
                  size="small"
                  danger
                  onClick={() => handleLifecycle(selected, "suspend")}
                >
                  Suspend
                </Button>
              )}
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => openRestaurantModal(selected)}
              >
                Edit
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Steps
              size="small"
              current={lifecycleStep(selected)}
              status={selected.status === "closed" ? "error" : "process"}
              items={[
                {
                  title: "Registered",
                  content: formatDate(selected.created_at),
                },
                {
                  title:
                    selected.status === "suspended" ? "Suspended" : "Verified",
                  content:
                    selected.status === "suspended"
                      ? "Temporarily disabled"
                      : formatDate(selected.verified_at),
                },
                {
                  title: "Operational",
                  content: isOperational
                    ? "Receiving orders"
                    : "Needs an active branch",
                },
              ]}
            />

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
                  Owner
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.owner || "-"}
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
                  Cuisine
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {selected.cuisine_type || "-"}
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
                  Verified
                </Text>
                <Text strong style={{ fontSize: 12 }}>
                  {formatDate(selected.verified_at)}
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
                  Business status
                </Text>
                {isOperational ? (
                  <Tag color="green" style={{ margin: 0 }}>
                    Receiving orders
                  </Tag>
                ) : selected.status === "verified" ? (
                  <Tag color="orange" style={{ margin: 0 }}>
                    Needs an active branch
                  </Tag>
                ) : (
                  <Tag
                    color={getStatusMeta(selected.status).color}
                    style={{ margin: 0 }}
                  >
                    {getStatusMeta(selected.status).label}
                  </Tag>
                )}
              </div>
              {selected.description && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selected.description}
                </Text>
              )}
            </div>

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
                    Branches ({selected.branches_count ?? 0})
                  </Text>
                </Space>
                <Button
                  size="small"
                  icon={<Plus size={13} />}
                  onClick={() => openBranchModal()}
                  style={{ borderRadius: 2 }}
                >
                  Add Branch
                </Button>
              </div>

              {(selected.branches || []).length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No branches yet"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {selected.branches.map((branch) => (
                    <Card
                      key={branch.id}
                      size="small"
                      style={{ borderRadius: 2 }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text strong>{branch.name}</Text>
                            {branch.is_active ? (
                              <Tag
                                color="green"
                                style={{ margin: 0, fontSize: 10 }}
                              >
                                Active
                              </Tag>
                            ) : (
                              <Tag style={{ margin: 0, fontSize: 10 }}>
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
                              {branch.postal_code
                                ? ` ${branch.postal_code}`
                                : ""}
                            </Text>
                          </div>
                          <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginTop: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          {branch.phone && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Phone size={11} color={palette.muted} />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {branch.phone}
                              </Text>
                            </span>
                          )}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock3 size={11} color={palette.muted} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {hoursSummary(branch.operating_hours)}
                            </Text>
                          </span>
                        </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 6,
                          }}
                        >
                          <Switch
                            size="small"
                            checked={branch.is_active}
                            onChange={() => toggleBranchActive(branch)}
                          />
                          <Dropdown
                            trigger={["click"]}
                            menu={{
                              items: [
                                {
                                  key: "edit",
                                  label: "Edit branch",
                                  icon: <Edit3 size={14} />,
                                },
                                {
                                  key: "hours",
                                  label: "Operating hours",
                                  icon: <Clock3 size={14} />,
                                },
                                ...(branch.latitude && branch.longitude
                                  ? [
                                      {
                                        key: "map",
                                        label: (
                                          <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 6,
                                            }}
                                          >
                                            <Navigation size={14} /> Google Maps
                                          </a>
                                        ),
                                      },
                                    ]
                                  : []),
                                { type: "divider" },
                                {
                                  key: "delete",
                                  label: "Delete branch",
                                  icon: <Trash2 size={14} />,
                                  danger: true,
                                },
                              ],
                              onClick: ({ key, domEvent }) => {
                                domEvent.stopPropagation();
                                if (key === "edit") openBranchModal(branch);
                                if (key === "hours") openHoursModal(branch);
                                if (key === "delete") deleteBranch(branch);
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
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Restaurant Modal ──────────────────── */}
      <Modal
        title={editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}
        open={restaurantModalOpen}
        onCancel={closeRestaurantModal}
        onOk={saveRestaurant}
        confirmLoading={submitting}
        okText={editingRestaurant ? "Save Changes" : "Create Restaurant"}
        width={520}
        forceRender
      >
        <Form form={restaurantForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Logo"
            name="logo"
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
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter the restaurant name." },
            ]}
          >
            <Input placeholder="Restaurant name" allowClear />
          </Form.Item>
          <Form.Item
            label="Category"
            name="category_id"
            rules={[{ required: true, message: "Please choose a category." }]}
            extra="Customers find the restaurant under this category. Categories are managed in Administration."
          >
            <Select
              placeholder="Select category"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Short description (optional)"
            />
          </Form.Item>
          {!editingRestaurant && (
            <Form.Item label="Owner user ID (optional)" name="owner_id">
              <InputNumber
                className="!w-full"
                min={1}
                placeholder="Defaults to your account"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ─── Add/Edit Branch Modal ──────────────────────── */}
      <Modal
        title={
          editingBranch
            ? `Edit Branch — ${editingBranch.name}`
            : `Add Branch — ${selected?.name || ""}`
        }
        open={branchModalOpen}
        onCancel={() => setBranchModalOpen(false)}
        onOk={saveBranch}
        confirmLoading={submitting}
        okText={editingBranch ? "Save Changes" : "Add Branch"}
        width={520}
        forceRender
      >
        <Form form={branchForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Branch name"
            name="name"
            rules={[{ required: true, message: "Please enter the branch name." }]}
          >
            <Input placeholder="e.g. Central #1" allowClear />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter the address." }]}
          >
            <Input placeholder="Street address" allowClear />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: "Please enter the city." }]}
            >
              <Input placeholder="City" allowClear />
            </Form.Item>
            <Form.Item label="Postal code" name="postal_code">
              <Input placeholder="Optional" allowClear />
            </Form.Item>
          </div>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="Phone (optional)" allowClear />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
            rules={[{ validator: (_, v) => (v?.lat != null && v?.lng != null ? Promise.resolve() : Promise.reject(new Error("Pick the branch location on the map."))) }]}
          >
            <MapLocationField
              onPlace={(p) => {
                // fill the address fields from the picked spot, without overwriting what was already typed
                const cur = branchForm.getFieldsValue(["address", "city", "postal_code"]);
                branchForm.setFieldsValue({
                  address: cur.address || p.address,
                  city: cur.city || p.city,
                  postal_code: cur.postal_code || p.postal_code,
                });
              }}
            />
          </Form.Item>
          <Form.Item
            label="Branch status"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Operating hours modal */}
      <Modal
        title={`Operating Hours — ${hoursBranch?.name || ""}`}
        open={hoursModalOpen}
        onCancel={() => setHoursModalOpen(false)}
        onOk={saveHours}
        confirmLoading={submitting}
        okText="Save Hours"
        width={460}
        forceRender
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hours.map((entry, index) => (
            <div
              key={entry.day}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                border: `1px solid ${palette.border}`,
                borderRadius: 2,
                background: entry.closed ? palette.bgSubtle : undefined,
                opacity: entry.closed ? 0.65 : 1,
              }}
            >
              <Text strong style={{ width: 84, fontSize: 12 }}>
                {entry.day}
              </Text>
              <Switch
                size="small"
                checked={!entry.closed}
                onChange={(on) =>
                  setHours((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, closed: !on } : item,
                    ),
                  )
                }
              />
              {entry.closed ? (
                <Text
                  type="secondary"
                  style={{ fontSize: 12, flex: 1, textAlign: "center" }}
                >
                  Closed
                </Text>
              ) : (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}
                >
                  <TimePicker
                    format="HH:mm"
                    needConfirm={false}
                    value={entry.open ? dayjs(entry.open, "HH:mm") : null}
                    onChange={(value) =>
                      setHours((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, open: value ? value.format("HH:mm") : item.open }
                            : item,
                        ),
                      )
                    }
                    style={{ flex: 1 }}
                  />
                  <Text type="secondary">–</Text>
                  <TimePicker
                    format="HH:mm"
                    needConfirm={false}
                    value={entry.close ? dayjs(entry.close, "HH:mm") : null}
                    onChange={(value) =>
                      setHours((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, close: value ? value.format("HH:mm") : item.close }
                            : item,
                        ),
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              )}
            </div>
          ))}
          <Text type="secondary" style={{ fontSize: 11 }}>
            Toggle a day off to mark it closed. Hours are stored per branch and
            used by the kitchen and dispatch flows.
          </Text>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default RestaurantsPage;
