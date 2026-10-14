import { useCallback, useEffect, useMemo, useState } from "react";

import {
  App,
  Button,
  Collapse,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  CheckCircle2,
  Edit3,
  Ellipsis,
  Info,
  KeyRound,
  LayoutList,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";

const { Text } = Typography;

const LOCKED_ROLES = ["super_admin"];
const PROTECTED_ROLES = ["super_admin", "admin"];

/* =========================================================
   PERMISSION DESCRIPTIONS / GROUPS
========================================================= */

const PERM_DESCRIPTIONS = {
  "view-restaurants": "View restaurant list and details",
  "create-restaurants": "Create new restaurant accounts",
  "edit-restaurants": "Edit restaurant information and settings",
  "delete-restaurants": "Remove restaurant accounts permanently",
  "verify-restaurants": "Verify and approve restaurant registrations",
  "view-menus": "Browse menu categories and items",
  "create-menus": "Add new menu categories and items",
  "edit-menus": "Modify menu items, prices, and availability",
  "delete-menus": "Remove menu items and categories",
  "toggle-availability": "Toggle item availability on/off",
  "view-orders": "View order list and order details",
  "create-orders": "Place new orders as a customer",
  "accept-orders": "Accept incoming order requests",
  "reject-orders": "Reject incoming order requests",
  "update-order-status": "Change order status through workflow",
  "view-riders": "View rider profiles and availability",
  "assign-riders": "Assign riders to delivery orders",
  "track-deliveries": "Track live delivery locations",
  "view-earnings": "View earnings reports and summaries",
  "view-zones": "View delivery zone configurations",
  "create-zones": "Create new delivery zones",
  "edit-zones": "Modify zone boundaries and fees",
  "delete-zones": "Remove delivery zones",
  "manage-surge": "Configure surge pricing rules",
  "view-customers": "View customer profiles and order history",
  "blacklist-customers": "Blacklist/unblacklist customers",
  "view-loyalty": "View loyalty points and transactions",
  "view-promotions": "View promotion campaigns",
  "create-promotions": "Create new promotion campaigns",
  "edit-promotions": "Modify promotion rules and values",
  "delete-promotions": "Remove promotion campaigns",
  "view-analytics": "Access analytics dashboards and reports",
  "export-reports": "Export reports as CSV or PDF",
  "view-logs": "View system activity logs",
  "export-logs": "Export activity logs",
  "manage-shifts": "Create and manage staff shift schedules",
  "manage-users": "Create, edit, and delete user accounts",
  "manage-roles": "Create, edit, and delete roles",
  "manage-permissions": "Assign and revoke permissions on roles",
};

const PERM_GROUPS = {
  Restaurants: { color: palette.primary, icon: "🏪" },
  Menu: { color: palette.info, icon: "📋" },
  Orders: { color: palette.success, icon: "📦" },
  Riders: { color: "#7C3AED", icon: "🛵" },
  "Delivery Zones": { color: "#0891B2", icon: "🗺️" },
  Customers: { color: "#DB2777", icon: "👥" },
  Promotions: { color: "#EA580C", icon: "🎯" },
  Analytics: { color: "#4F46E5", icon: "📊" },
  "Activity Log": { color: "#6B7280", icon: "📜" },
  "Users & Roles": { color: palette.danger, icon: "🔐" },
  Settings: { color: "#374151", icon: "⚙️" },
  Other: { color: "#9CA3AF", icon: "📌" },
};

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

const collectVisibleIds = (tree) => {
  const ids = [];
  tree.forEach((parent) => {
    if (parent.visible) ids.push(parent.id);
    (parent.children || []).forEach((child) => {
      if (child.visible) ids.push(child.id);
    });
  });
  return ids;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const PermissionsPage = () => {
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [tree, setTree] = useState([]);
  const [navMap, setNavMap] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- DATA LOADING ---------------- */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [rolesRes, permsRes] = await Promise.all([
        request("roles", "GET"),
        request("permissions", "GET"),
      ]);

      if (!Array.isArray(rolesRes)) {
        setError(rolesRes?.message || "Unable to load roles.");
        return;
      }

      setRoles(rolesRes);
      setAllPermissions(Array.isArray(permsRes) ? permsRes : []);

      const results = await Promise.all(
        rolesRes.map((role) => request(`roles/${role.id}/navigation`, "GET")),
      );

      const nextMap = {};
      let nextTree = [];

      results.forEach((res, index) => {
        const roleTree = Array.isArray(res?.data) ? res.data : [];
        if (roleTree.length && !nextTree.length) nextTree = roleTree;
        nextMap[rolesRes[index].id] = collectVisibleIds(roleTree);
      });

      setTree(nextTree);
      setNavMap(nextMap);
    } catch (err) {
      setError(err?.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  /* ---------------- DERIVED ---------------- */

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) || null,
    [roles, selectedId],
  );

  const allIds = useMemo(() => {
    const ids = [];
    tree.forEach((parent) => {
      ids.push(parent.id);
      (parent.children || []).forEach((child) => ids.push(child.id));
    });
    return ids;
  }, [tree]);

  const totalItems = useMemo(
    () =>
      tree.reduce(
        (sum, parent) => sum + ((parent.children || []).length || 1),
        0,
      ),
    [tree],
  );

  const groupedPermissions = useMemo(() => {
    const groups = {};
    allPermissions.forEach((perm) => {
      const group = perm.group || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(perm);
    });
    return groups;
  }, [allPermissions]);

  const openDetail = (role) => {
    setSelectedId(role.id);
    setDetailOpen(true);
  };

  const isLocked = (role) => !!role && LOCKED_ROLES.includes(role.name);

  /* ---------------- MODULE ACCESS ---------------- */

  const saveAccess = async (role, nextIds) => {
    const previous = navMap[role.id] || [];

    setNavMap((prev) => ({ ...prev, [role.id]: nextIds }));

    const response = await request(`roles/${role.id}/navigation`, "PUT", {
      navigation_item_ids: nextIds,
    });

    if (!response?.ok) {
      setNavMap((prev) => ({ ...prev, [role.id]: previous }));
      notification.error({ title: "Failed to update module access." });
    }
  };

  const toggleModule = (role, parent, checked) => {
    if (isLocked(role)) return;
    const next = new Set(navMap[role.id] || []);
    const groupIds = [parent.id, ...(parent.children || []).map((c) => c.id)];
    groupIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    saveAccess(role, Array.from(next));
  };

  const toggleItem = (role, parent, child, checked) => {
    if (isLocked(role)) return;
    const next = new Set(navMap[role.id] || []);
    if (checked) next.add(child.id);
    else next.delete(child.id);

    const anyChild = (parent.children || []).some((c) => next.has(c.id));
    if (anyChild) next.add(parent.id);
    else next.delete(parent.id);

    saveAccess(role, Array.from(next));
  };

  const toggleAll = (role, checked) => {
    if (isLocked(role)) return;
    saveAccess(role, checked ? allIds : []);
  };

  /* ---------------- PERMISSIONS ---------------- */

  const savePermissions = async (role, newPerms) => {
    const previous = role.permissions || [];

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: newPerms } : r)),
    );

    const response = await request(`roles/${role.id}/permissions/sync`, "POST", {
      permissions: newPerms,
    });

    if (!response?.message) {
      // Revert on failure
      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id ? { ...r, permissions: previous } : r,
        ),
      );
      notification.error({ title: "Failed to update permissions." });
    }
  };

  const togglePerm = (role, permName) => {
    if (isLocked(role)) return;
    const current = role.permissions || [];
    const next = current.includes(permName)
      ? current.filter((p) => p !== permName)
      : [...current, permName];
    savePermissions(role, next);
  };

  const togglePermGroup = (role, permissions, checked) => {
    if (isLocked(role)) return;
    const current = role.permissions || [];
    const groupNames = permissions.map((p) => p.name);
    const next = checked
      ? [...new Set([...current, ...groupNames])]
      : current.filter((p) => !groupNames.includes(p));
    savePermissions(role, next);
  };

  const toggleAllPerms = (role, checked) => {
    if (isLocked(role)) return;
    savePermissions(role, checked ? allPermissions.map((p) => p.name) : []);
  };

  /* ---------------- CRUD — ROLES ---------------- */

  const openModal = (role = null) => {
    setEditingRole(role);
    form.resetFields();
    if (role) form.setFieldsValue({ name: role.name });
    setModalOpen(true);
  };

  const saveRole = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);

    try {
      const response = editingRole
        ? await request(`roles/${editingRole.id}`, "PUT", { name: values.name })
        : await request("roles", "POST", { name: values.name });

      if (response?.id) {
        notification.success({
          title: editingRole ? "Role updated." : "Role created.",
        });
        setModalOpen(false);
        setEditingRole(null);
        form.resetFields();
        setRefreshKey((k) => k + 1);
      } else {
        notification.error({ title: firstSaveError(response) });
      }
    } catch {
      notification.error({ title: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRole = (role) => {
    if (PROTECTED_ROLES.includes(role.name)) {
      notification.warning({ title: "System roles cannot be deleted." });
      return;
    }
    Modal.confirm({
      title: "Delete role?",
      content: `"${role.name}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`roles/${role.id}`, "DELETE");
        if (response?.message) {
          notification.success({ title: "Role deleted." });
          setDetailOpen(false);
          setSelectedId(null);
          setRefreshKey((k) => k + 1);
        } else {
          notification.error({ title: response?.message || "Delete failed." });
        }
      },
    });
  };

  const allowedModules = (role) => {
    const ids = new Set(navMap[role.id] || []);
    return tree.filter((parent) => ids.has(parent.id));
  };

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    {
      title: "Role",
      key: "name",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: palette.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={16} color={palette.primary} strokeWidth={1.8} />
          </div>
          <Tooltip title="Click to configure module access and permissions">
            <Typography.Link
              strong
              onClick={(e) => {
                e.stopPropagation();
                openDetail(row);
              }}
              style={{ color: palette.ink, fontWeight: 600 }}
            >
              {row.name}
            </Typography.Link>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Users",
      key: "users_count",
      width: 80,
      align: "center",
      render: (_, row) => (
        <Text strong style={{ fontSize: 13 }}>
          {row.users_count ?? 0}
        </Text>
      ),
    },
    {
      title: "Allowed modules",
      key: "modules",
      render: (_, row) => {
        const allowed = allowedModules(row);
        const shown = allowed.slice(0, 4);
        const remaining = allowed.length - shown.length;

        if (allowed.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No access
            </Text>
          );
        }

        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {shown.map((m) => (
              <Tag key={m.id} style={{ margin: 0, borderRadius: 2, fontSize: 11 }}>
                {m.label}
              </Tag>
            ))}
            {remaining > 0 && (
              <Tag style={{ margin: 0, borderRadius: 2, fontSize: 11 }}>
                +{remaining}
              </Tag>
            )}
          </div>
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
                label: "Configure access & permissions",
                icon: <SlidersHorizontal size={15} />,
              },
              { key: "edit", label: "Edit role name", icon: <Edit3 size={15} /> },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete role",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openModal(row);
              if (key === "delete") deleteRole(row);
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

  const selectedIds = new Set(selected ? navMap[selected.id] || [] : []);
  const selectedLocked = isLocked(selected);
  const selectedPerms = selected?.permissions || [];

  /* ---------------- DRAWER SECTIONS ---------------- */

  const moduleAccessContent = selected && (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {selectedLocked && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 2,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <LockKeyhole size={14} color={palette.info} />
          <Text style={{ fontSize: 12 }}>
            Super Admin always sees every module and cannot be restricted.
          </Text>
        </div>
      )}

      <div
        style={{
          padding: "12px 16px",
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          background: palette.bgSubtle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Text strong style={{ fontSize: 14 }}>
            Allow All Modules
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {allowedModules(selected).length} of {tree.length} modules visible
              to this role
            </Text>
          </div>
        </div>
        <Switch
          disabled={selectedLocked}
          checked={allIds.length > 0 && allIds.every((id) => selectedIds.has(id))}
          checkedChildren="All"
          unCheckedChildren="None"
          onChange={(checked) => toggleAll(selected, checked)}
        />
      </div>

      {tree.map((parent) => {
        const children = parent.children || [];
        const enabledCount = children.filter((c) => selectedIds.has(c.id)).length;
        const moduleOn = selectedIds.has(parent.id);

        return (
          <div
            key={parent.id}
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              overflow: "hidden",
              opacity: moduleOn ? 1 : 0.75,
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                background: palette.bgSubtle,
                borderBottom: children.length
                  ? `1px solid ${palette.border}`
                  : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space size={8}>
                <LayoutList
                  size={14}
                  color={moduleOn ? palette.primary : palette.faint}
                />
                <Text strong style={{ fontSize: 13 }}>
                  {parent.label}
                </Text>
                {children.length > 0 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {enabledCount}/{children.length}
                  </Text>
                )}
              </Space>
              <Switch
                size="small"
                disabled={selectedLocked}
                checked={moduleOn}
                onChange={(checked) => toggleModule(selected, parent, checked)}
              />
            </div>

            {children.length > 0 && (
              <div style={{ padding: "8px 16px" }}>
                {children.map((child, index) => {
                  const isEnabled = selectedIds.has(child.id);
                  return (
                    <div
                      key={child.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom:
                          index < children.length - 1
                            ? `1px solid ${palette.border}`
                            : "none",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: isEnabled ? palette.ink : palette.muted,
                          fontWeight: isEnabled ? 500 : 400,
                        }}
                      >
                        {child.label}
                      </Text>
                      <Switch
                        size="small"
                        disabled={selectedLocked}
                        checked={isEnabled}
                        onChange={(checked) =>
                          toggleItem(selected, parent, child, checked)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const permissionsContent = selected && (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {selectedLocked && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 2,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <LockKeyhole size={14} color={palette.info} />
          <Text style={{ fontSize: 12 }}>
            Super Admin permissions cannot be changed.
          </Text>
        </div>
      )}

      {/* Select All */}
      <div
        style={{
          padding: "12px 16px",
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          background: palette.bgSubtle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Text strong style={{ fontSize: 14 }}>
            Select All Permissions
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedPerms.length} of {allPermissions.length} permissions enabled
            </Text>
          </div>
        </div>
        <Switch
          disabled={selectedLocked}
          checked={
            allPermissions.length > 0 &&
            selectedPerms.length === allPermissions.length
          }
          checkedChildren="All"
          unCheckedChildren="None"
          onChange={(checked) => toggleAllPerms(selected, checked)}
        />
      </div>

      {/* Permission Groups */}
      {Object.entries(groupedPermissions).map(([group, perms]) => {
        const groupConfig = PERM_GROUPS[group] || PERM_GROUPS.Other;
        const enabledCount = perms.filter((p) =>
          selectedPerms.includes(p.name),
        ).length;
        const allEnabled = enabledCount === perms.length;

        return (
          <div
            key={group}
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                background: palette.bgSubtle,
                borderBottom: `1px solid ${palette.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space size={8}>
                <span style={{ fontSize: 14 }}>{groupConfig.icon}</span>
                <Text strong style={{ fontSize: 13 }}>
                  {group}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {enabledCount}/{perms.length}
                </Text>
              </Space>
              <Switch
                size="small"
                disabled={selectedLocked}
                checked={allEnabled}
                onChange={(checked) =>
                  togglePermGroup(selected, perms, checked)
                }
              />
            </div>

            <div style={{ padding: "8px 16px" }}>
              {perms.map((perm, index) => {
                const isEnabled = selectedPerms.includes(perm.name);
                const desc =
                  PERM_DESCRIPTIONS[perm.name] || perm.description || "";

                return (
                  <div
                    key={perm.id || perm.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom:
                        index < perms.length - 1
                          ? `1px solid ${palette.border}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <KeyRound
                        size={12}
                        color={isEnabled ? palette.primary : palette.faint}
                      />
                      <div style={{ minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: isEnabled ? palette.ink : palette.muted,
                            fontWeight: isEnabled ? 500 : 400,
                          }}
                        >
                          {perm.name}
                        </Text>
                        {desc && (
                          <div
                            style={{
                              fontSize: 11,
                              color: palette.faint,
                              marginTop: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 400,
                            }}
                          >
                            {desc}
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      size="small"
                      disabled={selectedLocked}
                      checked={isEnabled}
                      onChange={() => togglePerm(selected, perm.name)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ---------------- RENDER ---------------- */

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
      <TopProgressBar active={loading} label="Permissions loading" />

      <ModulePage
        title="Permission Policies"
        description="Choose which sidebar modules and permissions each role is allowed to have."
        icon={ShieldCheck}
        stats={[
          {
            label: "Roles",
            value: roles.length,
            icon: ShieldCheck,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Modules",
            value: tree.length,
            color: palette.info,
            icon: LayoutList,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Menu items",
            value: totalItems,
            color: palette.success,
            icon: LockKeyhole,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Total assignments",
            value: roles.reduce(
              (sum, r) => sum + allowedModules(r).length,
              0,
            ),
            color: palette.warning,
            icon: CheckCircle2,
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
            <Button
              icon={<RefreshCw size={15} />}
              loading={loading}
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
              Add Role
            </Button>
          </div>
        }
        columns={columns}
        rows={roles.map((r) => ({ ...r, key: `role-${r.id}` }))}
      />

      <Drawer
        title={
          selected && (
            <Space align="center" size={10}>
              <ShieldCheck size={18} color={palette.primary} />
              <span style={{ fontWeight: 600 }}>{selected.name}</span>
              <Tag color="orange">
                {allowedModules(selected).length} / {tree.length}
              </Tag>
            </Space>
          )
        }
        placement="right"
        size={640}
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
                  openModal(selected);
                }}
              >
                Rename
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Collapse
              defaultActiveKey={["modules"]}
              style={{ borderRadius: 2 }}
              items={[
                {
                  key: "modules",
                  label: (
                    <Space size={8}>
                      <LayoutList size={14} color={palette.primary} />
                      <Text strong>Module access</Text>
                      <Tag style={{ margin: 0, borderRadius: 2 }}>
                        {allowedModules(selected).length} / {tree.length}
                      </Tag>
                    </Space>
                  ),
                  children: moduleAccessContent,
                },
                {
                  key: "permissions",
                  label: (
                    <Space size={8}>
                      <KeyRound size={14} color={palette.primary} />
                      <Text strong>Permissions</Text>
                      <Tag style={{ margin: 0, borderRadius: 2 }}>
                        {selectedPerms.length} / {allPermissions.length}
                      </Tag>
                    </Space>
                  ),
                  children: permissionsContent,
                },
              ]}
            />

            <div style={{ display: "flex", paddingTop: 8 }}>
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteRole(selected)}
                disabled={PROTECTED_ROLES.includes(selected.name)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete Role
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={editingRole ? "Edit Role" : "Create Role"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveRole}
        confirmLoading={submitting}
        okText={editingRole ? "Save Changes" : "Create Role"}
        width={420}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Role Name"
            name="name"
            rules={[{ required: true, message: "Please enter a role name." }]}
          >
            <Input placeholder="e.g. Kitchen Manager" allowClear />
          </Form.Item>
          <div
            style={{
              padding: "8px 12px",
              background: palette.bgSubtle,
              borderRadius: 2,
              border: `1px solid ${palette.border}`,
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
            }}
          >
            <Info size={14} color={palette.info} style={{ marginTop: 2, flexShrink: 0 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              After creating the role, click on it in the table to choose which
              modules it can see and which permissions it has.
            </Text>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default PermissionsPage;