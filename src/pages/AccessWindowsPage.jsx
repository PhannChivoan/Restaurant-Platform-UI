import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
} from "antd";

import {
  CalendarClock,
  Clock,
  Edit3,
  Ellipsis,
  Eye,
  Info,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import dayjs from "dayjs";

import ModulePage from "../components/ui/ModulePage";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { palette } from "../constants/theme";
import useAccessWindow from "../hooks/useAccessWindow";

const { Text } = Typography;
const { TextArea } = Input;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "applies_to" values are matched against the user roles by AccessWindowService,
// so the labels here have to stay in sync with that map.
const APPLIES_TO_OPTIONS = [
  { value: "Kitchen Staff", label: "Kitchen Staff" },
  { value: "Delivery Rider", label: "Delivery Rider" },
  { value: "Restaurant Owner", label: "Restaurant Owner" },
  { value: "All Staff", label: "All Staff (every non-customer role)" },
  { value: "Platform Admin", label: "Platform Admin" },
];

const ROLE_LABELS = {
  kitchen_staff: "Kitchen Staff",
  rider: "Delivery Rider",
  restaurant_owner: "Restaurant Owner",
  admin: "Platform Admin",
  super_admin: "Platform Admin",
};

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save.";
};

const AccessWindowsPage = () => {
  const { notification } = App.useApp();
  const { status: myStatus, isBlocked, refresh: recheckAccess } = useAccessWindow();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [windows, setWindows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadData = useCallback(async () => {
    if (refreshing) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await request("access-windows", "GET");
      if (Array.isArray(res)) {
        setWindows(res);
      } else {
        setError(res?.message || "Unable to load access windows.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshKey, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  /* =========================================================
     FILTERED DATA
  ========================================================= */

  const filteredWindows = windows.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      w.label?.toLowerCase().includes(q) ||
      w.applies_to?.toLowerCase().includes(q) ||
      w.description?.toLowerCase().includes(q);
    const matchActive = filterActive === null || w.is_active === filterActive;
    return matchSearch && matchActive;
  });

  const total = filteredWindows.length;
  const paginatedRows = filteredWindows.slice((page - 1) * limit, page * limit);

  /* =========================================================
     CRUD
  ========================================================= */

  const openDetail = (win) => {
    setSelected(win);
    setDetailOpen(true);
  };

  const openModal = (win = null) => {
    setEditingWindow(win);
    form.resetFields();
    if (win) {
      form.setFieldsValue({
        label: win.label,
        start_time: win.start_time ? dayjs(win.start_time.substring(0, 5), "HH:mm") : null,
        end_time: win.end_time ? dayjs(win.end_time.substring(0, 5), "HH:mm") : null,
        days: win.days || [],
        applies_to: win.applies_to,
        description: win.description,
        is_active: win.is_active,
      });
    } else {
      form.setFieldsValue({
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const saveWindow = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        label: values.label,
        start_time: values.start_time ? values.start_time.format("HH:mm") : null,
        end_time: values.end_time ? values.end_time.format("HH:mm") : null,
        days: values.days || [],
        applies_to: values.applies_to || null,
        description: values.description || null,
        is_active: values.is_active ?? true,
      };

      let response;
      if (editingWindow) {
        response = await request(`access-windows/${editingWindow.id}`, "PUT", payload);
      } else {
        response = await request("access-windows", "POST", payload);
      }

      if (response?.id) {
        notification.success({
          title: editingWindow ? "Access window updated." : "Access window created.",
        });
        setModalOpen(false);
        setEditingWindow(null);
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

  const deleteWindow = (win) => {
    Modal.confirm({
      title: "Delete access window?",
      content: `"${win.label}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`access-windows/${win.id}`, "DELETE");
        if (response?.message) {
          notification.success({ title: "Access window deleted." });
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          notification.error({ title: response?.message || "Delete failed." });
        }
      },
    });
  };

  const toggleActive = async (win) => {
    const response = await request(`access-windows/${win.id}/toggle`, "PATCH");
    if (response?.id) {
      setWindows((prev) =>
        prev.map((w) => (w.id === win.id ? { ...w, is_active: response.is_active } : w)),
      );
      setSelected((prev) => (prev?.id === win.id ? { ...prev, is_active: response.is_active } : prev));
    }
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Label",
      key: "label",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: row.is_active ? palette.primaryLight : palette.bgSubtle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={16} color={row.is_active ? palette.primary : palette.faint} strokeWidth={1.8} />
          </div>
          <Tooltip title="Click to view details">
            <Typography.Link
              strong
              onClick={(e) => {
                e.stopPropagation();
                openDetail(row);
              }}
              style={{ color: palette.ink, fontWeight: 600 }}
            >
              {row.label}
            </Typography.Link>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Applies to",
      key: "applies_to",
      width: 150,
      render: (_, row) =>
        row.applies_to ? (
          <Tag style={{ margin: 0, borderRadius: 2, fontSize: 12 }}>{row.applies_to}</Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: "Window",
      key: "window",
      width: 130,
      render: (_, row) => (
        <Text strong style={{ fontSize: 13, fontFamily: "monospace" }}>
          {row.start_time?.substring(0, 5)} — {row.end_time?.substring(0, 5)}
        </Text>
      ),
    },
    {
      title: "Days",
      key: "days",
      width: 220,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {DAYS.map((day) => {
            const sel = Array.isArray(row.days) && row.days.includes(day);
            return (
              <span
                key={day}
                style={{
                  padding: "2px 6px",
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 500,
                  background: sel ? palette.ink : palette.bgSubtle,
                  color: sel ? palette.bg : palette.faint,
                  border: `1px solid ${sel ? palette.ink : palette.border}`,
                }}
              >
                {day}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      title: "Status",
      key: "is_active",
      width: 150,
      align: "center",
      render: (_, row) => (
        <Space size={4}>
          <Tag
            color={row.is_active ? "success" : "default"}
            style={{ margin: 0, borderRadius: 2, fontSize: 11, fontWeight: 500 }}
          >
            {row.is_active ? "Active" : "Inactive"}
          </Tag>
          {row.is_active && (
            <Tag
              color={row.is_open ? "green" : "orange"}
              style={{ margin: 0, borderRadius: 2, fontSize: 11, fontWeight: 500 }}
            >
              {row.is_open ? "Open now" : "Closed now"}
            </Tag>
          )}
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
              { key: "view", label: "View details", icon: <Eye size={15} /> },
              { key: "edit", label: "Edit window", icon: <Edit3 size={15} /> },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete window",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openModal(row);
              if (key === "delete") deleteWindow(row);
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
      <TopProgressBar active={loading || refreshing} label="Access windows loading" />

      {/* the state of the signed-in role: inside its window, or locked out by it */}
      {myStatus?.is_restricted && (
        <Alert
          type={isBlocked ? "warning" : "success"}
          showIcon
          style={{ marginBottom: 16, borderRadius: 2 }}
          message={
            <Space align="center" size={8} wrap>
              <Text strong style={{ fontSize: 13 }}>
                {ROLE_LABELS[myStatus.role] || myStatus.role}:{" "}
                {isBlocked ? "outside its access window" : "inside its access window"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isBlocked
                  ? "Operational modules are blocked until the window opens."
                  : "You can work normally until the window closes."}
              </Text>
              <Button size="small" icon={<RefreshCw size={13} />} onClick={recheckAccess}>
                Re-check
              </Button>
            </Space>
          }
          description={
            <Space size={6} wrap>
              {myStatus.windows?.map((w) => (
                <Tag
                  key={w.id}
                  color={w.is_open ? "success" : "default"}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {w.label}: {w.days?.join(", ")} {w.start_time}–{w.end_time}
                  {w.is_open ? " (open now)" : ""}
                </Tag>
              ))}
              <Text type="secondary" style={{ fontSize: 11 }}>
                Times are in {myStatus.timezone}.
              </Text>
            </Space>
          }
        />
      )}

      <ModulePage
        title="Access Time Windows"
        description="A window defines WHEN a role may work. A role with at least one active window is locked out of the operational modules outside every one of its windows; a role with no window is never restricted."
        icon={Clock}
        stats={[
          {
            label: "Active",
            value: windows.filter((w) => w.is_active).length,
            icon: Clock,
            iconBackground: palette.success + "18",
            color: palette.success,
          },
          {
            label: "Total",
            value: windows.length,
            icon: CalendarClock,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Roles covered",
            value: new Set(windows.map((w) => w.applies_to).filter(Boolean)).size,
            icon: Eye,
            iconBackground: "#EFF6FF",
            color: palette.info,
          },
          {
            label: "Inactive",
            value: windows.filter((w) => !w.is_active).length,
            icon: Info,
            iconBackground: "#FEF3C7",
            color: palette.warning,
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
              prefix={<Clock size={14} color={palette.faint} />}
              placeholder="Search windows..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="Status"
              value={filterActive}
              onChange={(v) => {
                setFilterActive(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
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
              type="primary"
              icon={<Plus size={16} />}
              style={{ borderRadius: 2, marginLeft: "auto" }}
              onClick={() => openModal()}
            >
              Add Window
            </Button>
          </div>
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} windows`,
        }}
        columns={columns}
        rows={paginatedRows.map((w) => ({ ...w, key: `aw-${w.id}` }))}
      />

      {/* ─── Detail Drawer ──────────────────────────── */}
      <Drawer
        title={
          selected && (
            <Space align="center" size={10}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  background: selected.is_active ? palette.primaryLight : palette.bgSubtle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={14} color={selected.is_active ? palette.primary : palette.faint} />
              </div>
              <span style={{ fontWeight: 600 }}>{selected.label}</span>
              <Tag color={selected.is_active ? "success" : "default"}>
                {selected.is_active ? "Active" : "Inactive"}
              </Tag>
            </Space>
          )
        }
        placement="right"
        size={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          selected && (
            <Space>
              <Switch
                checked={selected.is_active}
                onChange={() => toggleActive(selected)}
                checkedChildren="Active"
                unCheckedChildren="Off"
                size="small"
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
            {/* Window Header Card */}
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
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: selected.is_active ? palette.primaryLight : palette.fillHover,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Clock size={22} color={selected.is_active ? palette.primary : palette.faint} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: palette.ink }}>
                {selected.label}
              </div>
              {selected.description && (
                <div style={{ marginTop: 6, fontSize: 13, color: palette.muted }}>
                  {selected.description}
                </div>
              )}
            </div>

            {/* Time Window */}
            <div
              style={{
                padding: 14,
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
                  marginBottom: 10,
                }}
              >
                Time Window
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "Start", value: selected.start_time?.substring(0, 5) },
                  { label: "End", value: selected.end_time?.substring(0, 5) },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.label}
                    </Text>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: palette.ink }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Days */}
            <div
              style={{
                padding: 14,
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
                  marginBottom: 10,
                }}
              >
                Active Days
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {DAYS.map((day) => {
                  const sel = Array.isArray(selected.days) && selected.days.includes(day);
                  return (
                    <span
                      key={day}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 2,
                        fontSize: 12,
                        fontWeight: 500,
                        background: sel ? palette.ink : palette.bg,
                        color: sel ? palette.bg : palette.faint,
                        border: `1px solid ${sel ? palette.ink : palette.border}`,
                      }}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Applies To */}
            {selected.applies_to && (
              <div
                style={{
                  padding: 14,
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
                    marginBottom: 10,
                  }}
                >
                  Applies To
                </div>
                <Tag style={{ fontSize: 12, padding: "2px 10px", borderRadius: 2 }}>
                  {selected.applies_to}
                </Tag>
              </div>
            )}

            {/* Delete Button */}
            <div style={{ display: "flex", paddingTop: 8 }}>
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteWindow(selected)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete Window
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Create/Edit Modal ──────────────────── */}
      <Modal
        title={editingWindow ? "Edit Access Window" : "Create Access Window"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveWindow}
        confirmLoading={submitting}
        okText={editingWindow ? "Save Changes" : "Create Window"}
        width={520}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Label"
            name="label"
            rules={[{ required: true, message: "Please enter a label." }]}
          >
            <Input placeholder="e.g. Morning service window" allowClear />
          </Form.Item>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              label="Start Time"
              name="start_time"
              rules={[{ required: true, message: "Required." }]}
              style={{ flex: 1 }}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                placeholder="Select start"
              />
            </Form.Item>
            <Form.Item
              label="End Time"
              name="end_time"
              rules={[{ required: true, message: "Required." }]}
              style={{ flex: 1 }}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                placeholder="Select end"
              />
            </Form.Item>
          </div>

          <Form.Item label="Active Days" name="days">
            <Select
              mode="multiple"
              placeholder="Select days"
              options={DAYS.map((d) => ({ value: d, label: d }))}
              maxTagCount="responsive"
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea
              rows={2}
              placeholder="Brief description of this access window..."
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Applies To"
            name="applies_to"
            extra="The role locked to this window. Outside it, that role cannot use the operational modules. Leave empty to only document the window."
          >
            <Select
              placeholder="Select role"
              allowClear
              options={APPLIES_TO_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
            extra="An inactive window never blocks anyone."
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default AccessWindowsPage;
