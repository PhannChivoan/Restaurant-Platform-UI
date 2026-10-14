import { useCallback, useEffect, useState } from "react";

import {
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
  CalendarDays,
  CheckCircle2,
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

const { Text } = Typography;
const { TextArea } = Input;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROLE_OPTIONS = [
  { value: "Kitchen Staff", label: "Kitchen Staff" },
  { value: "Delivery Rider", label: "Delivery Rider" },
  { value: "Restaurant Owner", label: "Restaurant Owner" },
  { value: "Platform Admin", label: "Platform Admin" },
];

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save.";
};

const ShiftSchedulesPage = () => {
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [shifts, setShifts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
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
      const res = await request("shift-schedules", "GET");
      const data = res?.data?.data || res?.data || res?.shifts || [];
      if (Array.isArray(data)) {
        setShifts(data);
      } else {
        setError(res?.message || "Unable to load shift schedules.");
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

  const filteredShifts = shifts.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q);
    const matchRole = !filterRole || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const total = filteredShifts.length;
  const paginatedRows = filteredShifts.slice((page - 1) * limit, page * limit);

  /* =========================================================
     CRUD
  ========================================================= */

  const openDetail = (shift) => {
    setSelected(shift);
    setDetailOpen(true);
  };

  const openModal = (shift = null) => {
    setEditingShift(shift);
    form.resetFields();
    if (shift) {
      form.setFieldsValue({
        name: shift.name,
        role: shift.role,
        start_time: shift.start_time ? dayjs(shift.start_time.substring(0, 5), "HH:mm") : null,
        end_time: shift.end_time ? dayjs(shift.end_time.substring(0, 5), "HH:mm") : null,
        days: Array.isArray(shift.days) ? shift.days : [],
        is_active: shift.is_active,
      });
    } else {
      form.setFieldsValue({
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const saveShift = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: values.name || null,
        role: values.role,
        start_time: values.start_time ? values.start_time.format("HH:mm") : null,
        end_time: values.end_time ? values.end_time.format("HH:mm") : null,
        days: values.days || [],
        is_active: values.is_active ?? true,
      };

      let response;
      if (editingShift) {
        response = await request(`shift-schedules/${editingShift.id}`, "PUT", payload);
      } else {
        response = await request("shift-schedules", "POST", payload);
      }

      if (response?.id || response?.message) {
        notification.success({
          title: editingShift ? "Shift updated." : "Shift created.",
        });
        setModalOpen(false);
        setEditingShift(null);
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

  const deleteShift = (shift) => {
    Modal.confirm({
      title: "Delete shift schedule?",
      content: `"${shift.name || shift.role}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(`shift-schedules/${shift.id}`, "DELETE");
        if (response?.message) {
          notification.success({ title: "Shift deleted." });
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          notification.error({ title: response?.message || "Delete failed." });
        }
      },
    });
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Name",
      key: "name",
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
            <CalendarDays size={16} color={row.is_active ? palette.primary : palette.faint} strokeWidth={1.8} />
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
              {row.name || row.role}
            </Typography.Link>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      width: 140,
      render: (_, row) => (
        <Tag style={{ margin: 0, borderRadius: 2, fontSize: 12 }}>
          {row.role}
        </Tag>
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
      width: 90,
      align: "center",
      render: (_, row) => (
        <Tag
          color={row.is_active !== false ? "success" : "default"}
          style={{ margin: 0, borderRadius: 2, fontSize: 11, fontWeight: 500 }}
        >
          {row.is_active !== false ? "Active" : "Inactive"}
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
              { key: "edit", label: "Edit shift", icon: <Edit3 size={15} /> },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete shift",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openModal(row);
              if (key === "delete") deleteShift(row);
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
      <TopProgressBar active={loading || refreshing} label="Shift schedules loading" />

      <ModulePage
        title="Shift Schedules"
        description="Define time-windowed operational access for kitchen staff and delivery riders."
        icon={CalendarDays}
        stats={[
          {
            label: "Active",
            value: shifts.filter((s) => s.is_active !== false).length,
            icon: CheckCircle2,
            iconBackground: palette.success + "18",
            color: palette.success,
          },
          {
            label: "Total",
            value: shifts.length,
            icon: CalendarDays,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Roles covered",
            value: new Set(shifts.map((s) => s.role).filter(Boolean)).size,
            icon: Eye,
            iconBackground: "#EFF6FF",
            color: palette.info,
          },
          {
            label: "Inactive",
            value: shifts.filter((s) => s.is_active === false).length,
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
              prefix={<CalendarDays size={14} color={palette.faint} />}
              placeholder="Search shifts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="Role"
              value={filterRole}
              onChange={(v) => {
                setFilterRole(v);
                setPage(1);
              }}
              allowClear
              style={{ width: 160 }}
              options={ROLE_OPTIONS}
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
              Add Shift
            </Button>
          </div>
        }
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (next) => setPage(next),
          showSizeChanger: false,
          showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} shifts`,
        }}
        columns={columns}
        rows={paginatedRows.map((s) => ({ ...s, key: `shift-${s.id}` }))}
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
                  background: selected.is_active !== false ? palette.primaryLight : palette.bgSubtle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarDays size={14} color={selected.is_active !== false ? palette.primary : palette.faint} />
              </div>
              <span style={{ fontWeight: 600 }}>{selected.name || selected.role}</span>
              <Tag color={selected.is_active !== false ? "success" : "default"}>
                {selected.is_active !== false ? "Active" : "Inactive"}
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
            {/* Shift Header Card */}
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
                  background: selected.is_active !== false ? palette.primaryLight : palette.fillHover,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <CalendarDays size={22} color={selected.is_active !== false ? palette.primary : palette.faint} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: palette.ink }}>
                {selected.name || selected.role}
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag style={{ fontSize: 12, padding: "1px 8px", borderRadius: 2 }}>
                  {selected.role}
                </Tag>
              </div>
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

            {/* Delete Button */}
            <div style={{ display: "flex", paddingTop: 8 }}>
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteShift(selected)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete Shift
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Create/Edit Modal ──────────────────── */}
      <Modal
        title={editingShift ? "Edit Shift Schedule" : "Create Shift Schedule"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveShift}
        confirmLoading={submitting}
        okText={editingShift ? "Save Changes" : "Create Shift"}
        width={520}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role." }]}
          >
            <Select
              placeholder="Select role"
              options={ROLE_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="Name" name="name">
            <Input placeholder="e.g. Morning kitchen shift" allowClear />
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

          <Form.Item label="Status" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default ShiftSchedulesPage;
