import { useCallback, useEffect, useState } from "react";

import {
  App,
  Avatar,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  Upload,
  Card,
} from "antd";

import {
  CheckCircle2,
  Camera,
  Edit3,
  Ellipsis,
  Eye,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  Crown,
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

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

const ROLE_OPTIONS = [
  { value: "Platform Admin", label: "Platform Admin", group: "admin" },
  { value: "Restaurant Owner", label: "Restaurant Owner", group: "staff" },
  { value: "Kitchen Staff", label: "Kitchen Staff", group: "staff" },
  { value: "Delivery Rider", label: "Delivery Rider", group: "staff" },
  { value: "Customer", label: "Customer", group: "customer" },
];

const ROLE_HIERARCHY = {
  "Platform Admin": { level: 1, permissions: "Full system access", color: palette.danger, icon: Crown },
  "Restaurant Owner": { level: 2, permissions: "Manage restaurant, menu, staff", color: palette.primary, icon: UserCog },
  "Kitchen Staff": { level: 3, permissions: "View orders, update status", color: palette.info, icon: null },
  "Delivery Rider": { level: 3, permissions: "View deliveries, update status", color: palette.success, icon: null },
  "Customer": { level: 4, permissions: "Place orders, view history", color: palette.muted, icon: null },
};

const ADMIN_ROLES = ["Platform Admin"];
const isSystemAdmin = (role) => ADMIN_ROLES.includes(role);

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
];

const USER_TYPE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customers" },
];

const ROLE_COLORS = {
  "Platform Admin": palette.danger,
  "Restaurant Owner": palette.primary,
  "Kitchen Staff": palette.info,
  "Delivery Rider": palette.success,
  Customer: palette.muted,
};

const STATUS_CONFIG = {
  active: { color: "success", label: "Active" },
  invited: { color: "warning", label: "Invited" },
  suspended: { color: "error", label: "Suspended" },
};

/* =========================================================
   HELPERS
========================================================= */

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save user.";
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const UsersRolesPage = () => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 15;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadUsers = useCallback(async () => {
    if (refreshing) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (userTypeFilter) params.set("type", userTypeFilter);

      const response = await request(`users?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data.map((u) => ({ ...u, key: `user-${u.id}` })));
        setTotal(response.total || 0);
        setStats(response.stats || {});
      } else {
        setError(response?.message || "Unable to load users.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshKey, search, roleFilter, statusFilter, userTypeFilter, page, limit, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 0);
    return () => clearTimeout(timer);
  }, [refreshKey, loadUsers]);

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

  const openDetail = (user) => {
    setSelected(user);
    setDetailOpen(true);
  };

  /* =========================================================
     CRUD
  ========================================================= */

  const openModal = (user = null) => {
    setEditingUser(user);
    form.resetFields();

    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        scope: user.scope,
        is_active: user.status === "active",
        avatar: (user.avatar_url || user.avatar)
          ? [{ uid: "-1", name: "avatar", status: "done", url: toMediaUrl(user.avatar_url || user.avatar) }]
          : [],
      });
      setSelectedRole(user.role);
    } else {
      form.setFieldsValue({ is_active: true, avatar: [] });
      setSelectedRole(null);
    }

    setModalOpen(true);
  };

  const saveUser = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      if (values.phone) formData.append("phone", values.phone);
      formData.append("role", values.role);
      formData.append("is_active", values.is_active ? "1" : "0");

      const avatarFile = (values.avatar || []).find((f) => f.originFileObj);
      if (avatarFile) {
        formData.append("avatar", avatarFile.originFileObj);
      }

      let response;
      if (editingUser) {
        formData.append("_method", "PATCH");
        response = await request(`users/${editingUser.id}`, "POST", formData);
      } else {
        response = await request("users", "POST", formData);
      }

      if (response?.id) {
        setModalOpen(false);
        setEditingUser(null);
        form.resetFields();
        setRefreshKey((k) => k + 1);

        if (!editingUser && response.password) {
          Modal.success({
            title: "User Created Successfully",
            width: 480,
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ marginBottom: 0 }}>
                  <strong>{response.name}</strong> has been invited as <Tag color={response.user_type === "customer" ? palette.info : palette.success}>{response.user_type === "customer" ? "Customer" : "Staff"}</Tag>
                </p>
                <Card size="small" style={{ background: "#F9FAFB" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><Text type="secondary">Email:</Text> <Text strong copyable>{response.email}</Text></div>
                    <div><Text type="secondary">Password:</Text> <Text strong copyable style={{ fontFamily: "monospace" }}>{response.password}</Text></div>
                    <div><Text type="secondary">Role:</Text> <Text strong>{response.role}</Text></div>
                  </div>
                </Card>
                {response.email_sent ? (
                  <p style={{ margin: 0, color: palette.success }}>
                    Invitation email has been sent to <strong>{response.email}</strong>.
                  </p>
                ) : (
                  <p style={{ margin: 0, color: palette.warning }}>
                    Email could not be sent. Please share the credentials manually.
                  </p>
                )}
              </div>
            ),
          });
        } else {
          notification.success({ title: "User updated." });
        }
      } else {
        notification.error({ title: response?.message || "Something went wrong." });
      }
    } catch {
      notification.error({ title: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = (user) => {
    if (isSystemAdmin(user.role)) {
      notification.warning({ title: "System admin accounts cannot be deleted." });
      return;
    }
    Modal.confirm({
      title: "Delete user?",
      content: `"${user.name}" (${user.email}) will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`users/${user.id}`, "DELETE");
        if (response?.message) {
          notification.success({ title: "User deleted." });
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          notification.error({ title: response?.message || "Delete failed." });
        }
      },
    });
  };

  const toggleActive = async (user) => {
    if (isSystemAdmin(user.role)) {
      notification.warning({ title: "System admin accounts cannot be suspended." });
      return;
    }
    const response = await request(`users/${user.id}`, "PATCH", {
      is_active: user.status === "active" ? 0 : 1,
    });

    if (response?.id) {
      notification.success({
        title: user.status === "active" ? "User suspended." : "User activated.",
      });
      setRefreshKey((k) => k + 1);
    } else {
      notification.error({ title: response?.message || "Unable to update status." });
    }
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "User",
      key: "name",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.avatar_url || row.avatar ? (
            <Avatar
              size={38}
              src={toMediaUrl(row.avatar_url || row.avatar)}
              style={{ flexShrink: 0 }}
            />
          ) : (
            <Avatar
              size={38}
              style={{
                background: ROLE_COLORS[row.role] || palette.muted,
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {getInitials(row.name)}
            </Avatar>
          )}
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
              {isSystemAdmin(row.role) && (
                <Tooltip title="System Administrator">
                  <ShieldCheck
                    size={14}
                    color={palette.danger}
                    style={{ marginLeft: 4, verticalAlign: "middle" }}
                  />
                </Tooltip>
              )}
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
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 160,
      render: (role) => (
        <Tag
          color={ROLE_COLORS[role] || "default"}
          style={{ margin: 0, borderRadius: 2 }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "user_type",
      key: "user_type",
      width: 100,
      render: (type) => (
        <Tag
          color={type === "customer" ? palette.info : palette.success}
          style={{ margin: 0, borderRadius: 2 }}
        >
          {type === "customer" ? "Customer" : "Staff"}
        </Tag>
      ),
    },
    {
      title: "Scope",
      dataIndex: "scope",
      key: "scope",
      width: 160,
      render: (scope) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {scope || "-"}
        </Text>
      ),
    },
    {
      title: "Last active",
      dataIndex: "last_active",
      key: "last_active",
      width: 130,
      sorter: (a, b) =>
        (a.last_active || "").localeCompare(b.last_active || ""),
      render: (value) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatRelativeTime(value)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
        return <Tag color={config.color} style={{ margin: 0 }}>{config.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, row) => {
        const isAdmin = isSystemAdmin(row.role);
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "view", label: "View details", icon: <Eye size={15} /> },
                ...(!isAdmin ? [
                  { key: "edit", label: "Edit user", icon: <Edit3 size={15} /> },
                  {
                    key: "toggle",
                    label: row.status === "active" ? "Suspend" : "Activate",
                    icon: <CheckCircle2 size={15} />,
                  },
                  { type: "divider" },
                  {
                    key: "delete",
                    label: "Delete user",
                    icon: <Trash2 size={15} />,
                    danger: true,
                  },
                ] : [
                  { key: "edit", label: "Edit admin", icon: <Edit3 size={15} /> },
                ]),
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === "view") openDetail(row);
                if (key === "edit") openModal(row);
                if (key === "toggle") toggleActive(row);
                if (key === "delete") deleteUser(row);
              },
            }}
          >
            <Tooltip title={isAdmin ? "Admin actions" : "Actions"}>
              <Button
                size="small"
                icon={isAdmin ? <Shield size={14} /> : <Ellipsis size={16} />}
                style={{ borderRadius: 2 }}
              />
            </Tooltip>
          </Dropdown>
        );
      },
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
      <TopProgressBar active={loading || refreshing} label="Users loading" />

      <ModulePage
        title="Users & Roles"
        description="Manage staff accounts, assign operational roles, and control restaurant scope."
        icon={UserCog}
        stats={[
          {
            label: "Total users",
            value: stats.total ?? 0,
            icon: UsersRound,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Admins",
            value: stats.total_admins ?? rows.filter((u) => isSystemAdmin(u.role)).length,
            color: palette.danger,
            icon: ShieldCheck,
            iconBackground: "#FEF2F2",
          },
          {
            label: "Staff",
            value: stats.total_staff ?? 0,
            color: palette.primary,
            icon: UserCog,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Customers",
            value: stats.total_customers ?? 0,
            color: palette.info,
            icon: UsersRound,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Active users",
            value: stats.active ?? 0,
            color: palette.success,
            icon: CheckCircle2,
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
              placeholder="Search name or email..."
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="Role"
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); setPage(1); }}
              allowClear
              style={{ width: 160 }}
              options={ROLE_OPTIONS}
            />
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              allowClear
              style={{ width: 130 }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="User Type"
              value={userTypeFilter}
              onChange={(v) => { setUserTypeFilter(v); setPage(1); }}
              allowClear
              style={{ width: 130 }}
              options={USER_TYPE_OPTIONS}
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
              Invite User
            </Button>
          </div>
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} users`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Detail Drawer ──────────────────────────── */}
      <Drawer
        title={
          selected && (
            <Space align="center" size={10}>
              {selected.avatar_url || selected.avatar ? (
                <Avatar size={28} src={toMediaUrl(selected.avatar_url || selected.avatar)} />
              ) : (
                <Avatar
                  size={28}
                  style={{
                    background: ROLE_COLORS[selected.role] || palette.muted,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(selected.name)}
                </Avatar>
              )}
              <span>{selected.name}</span>
              {isSystemAdmin(selected.role) && (
                <Tooltip title="System Administrator">
                  <ShieldCheck size={16} color={palette.danger} />
                </Tooltip>
              )}
              <Tag color={STATUS_CONFIG[selected.status]?.color}>
                {STATUS_CONFIG[selected.status]?.label}
              </Tag>
            </Space>
          )
        }
        placement="right"
        size={520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          selected && (
            <Space>
              <Switch
                checked={selected.status === "active"}
                onChange={() => toggleActive(selected)}
                checkedChildren="Active"
                unCheckedChildren="Off"
                size="small"
                disabled={isSystemAdmin(selected.role)}
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
            {/* User Header Card */}
            <div
              style={{
                padding: 20,
                border: `1px solid ${palette.border}`,
                borderRadius: 2,
                background: palette.bgSubtle,
                textAlign: "center",
              }}
            >
              {selected.avatar_url || selected.avatar ? (
                <Image
                  src={toMediaUrl(selected.avatar_url || selected.avatar)}
                  width={64}
                  height={64}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 12,
                  }}
                  preview={{ mask: <Camera size={16} /> }}
                />
              ) : (
                <Avatar
                  size={64}
                  style={{
                    background: ROLE_COLORS[selected.role] || palette.muted,
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {getInitials(selected.name)}
                </Avatar>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: palette.ink }}>
                {selected.name}
              </div>
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={ROLE_COLORS[selected.role]}
                  style={{ fontSize: 12, padding: "1px 8px", borderRadius: 2 }}
                >
                  {selected.role}
                </Tag>
              </div>
            </div>

            {/* Contact Info */}
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
                  fontSize: 11,
                  fontWeight: 600,
                  color: palette.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Contact Information
              </div>
              {[
                { icon: <Mail size={13} color={palette.muted} />, label: "Email", value: selected.email },
                { icon: <Phone size={13} color={palette.muted} />, label: "Phone", value: selected.phone || "-" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Space size={6}>
                    {item.icon}
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                  </Space>
                  <Text strong style={{ fontSize: 12 }}>{item.value}</Text>
                </div>
              ))}
            </div>

            {/* Assignment Details */}
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
                  fontSize: 11,
                  fontWeight: 600,
                  color: palette.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Assignment
              </div>
              {[
                { label: "Role", value: selected.role },
                { label: "Type", value: selected.user_type === "customer" ? "Customer" : "Staff" },
                { label: "Scope", value: selected.scope || "-" },
                {
                  label: "Status",
                  value: (
                    <Tag color={STATUS_CONFIG[selected.status]?.color} style={{ margin: 0, fontSize: 11 }}>
                      {STATUS_CONFIG[selected.status]?.label}
                    </Tag>
                  ),
                },
                { label: "Last active", value: formatRelativeTime(selected.last_active) },
                {
                  label: "Joined",
                  value: selected.created_at
                    ? new Date(selected.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-",
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
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                  <div style={{ fontSize: 12, textAlign: "right" }}>
                    {typeof item.value === "string" ? (
                      <Text strong style={{ fontSize: 12 }}>{item.value}</Text>
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Role & Permissions */}
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
                  fontSize: 11,
                  fontWeight: 600,
                  color: palette.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Role & Permissions
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Tag
                  color={ROLE_HIERARCHY[selected.role]?.color || palette.muted}
                  style={{ margin: 0, borderRadius: 2, fontSize: 12, fontWeight: 600 }}
                >
                  {selected.role}
                </Tag>
                {isSystemAdmin(selected.role) && (
                  <Tag color="red" style={{ margin: 0, borderRadius: 2, fontSize: 11, fontWeight: 600 }}>
                    LEVEL {ROLE_HIERARCHY[selected.role]?.level}
                  </Tag>
                )}
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Permissions:</Text>
                <div style={{ fontSize: 12, fontWeight: 500, color: palette.ink }}>
                  {ROLE_HIERARCHY[selected.role]?.permissions || "No permissions defined"}
                </div>
              </div>
              {isSystemAdmin(selected.role) && (
                <div
                  style={{
                    marginTop: 4,
                    padding: "6px 10px",
                    borderRadius: 2,
                    background: "#FEF2F2",
                    border: `1px solid #FECACA`,
                    fontSize: 11,
                    color: palette.danger,
                    fontWeight: 500,
                  }}
                >
                  System administrators have full access to all features and cannot be suspended or deleted by non-admin users.
                </div>
              )}
            </div>

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
                onClick={() => deleteUser(selected)}
                disabled={isSystemAdmin(selected.role)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Create/Edit Modal ──────────────────────── */}
      <Modal
        title={editingUser ? "Edit User" : "Invite User"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveUser}
        confirmLoading={submitting}
        okText={editingUser ? "Save Changes" : "Send Invite"}
        width={560}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {/* Avatar Upload */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Form.Item name="avatar" valuePropName="fileList" getValueFromEvent={normFile} noStyle>
              <Upload
                listType="picture-circle"
                accept="image/jpeg,image/png,image/webp"
                beforeUpload={() => false}
                maxCount={1}
                showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Camera size={18} color={palette.faint} />
                  <span style={{ fontSize: 11, color: palette.faint }}>Upload</span>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter the user's name." }]}
          >
            <Input placeholder="e.g. John Roberts" allowClear />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required." },
                { type: "email", message: "Please enter a valid email." },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="+855 12 345 678" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: "Please select a role." }]}
            >
              <Select
                options={ROLE_OPTIONS}
                placeholder="Select role"
                onChange={(v) => setSelectedRole(v)}
              />
            </Form.Item>
            <Form.Item label="Restaurant scope" name="scope">
              <Input placeholder="e.g. Rice & Roll" />
            </Form.Item>
          </div>

          {selectedRole && ROLE_HIERARCHY[selectedRole] && (() => {
            const RoleIcon = ROLE_HIERARCHY[selectedRole].icon;
            return (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 2,
                  background: isSystemAdmin(selectedRole) ? "#FEF2F2" : "#F0F9FF",
                  border: `1px solid ${isSystemAdmin(selectedRole) ? "#FECACA" : "#BAE6FD"}`,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {RoleIcon ? (
                  <RoleIcon size={14} color={ROLE_HIERARCHY[selectedRole].color} />
                ) : (
                  <Shield size={14} color={ROLE_HIERARCHY[selectedRole].color} />
                )}
                <div>
                  <Text strong style={{ fontSize: 12, color: ROLE_HIERARCHY[selectedRole].color }}>
                    {selectedRole}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                    {ROLE_HIERARCHY[selectedRole].permissions}
                  </Text>
                </div>
              </div>
            );
          })()}

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default UsersRolesPage;
