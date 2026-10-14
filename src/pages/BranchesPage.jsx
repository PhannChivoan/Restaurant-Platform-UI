import { useEffect, useState } from "react";

import {
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
  message,
} from "antd";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  Ellipsis,
  Eye,
  MapPin,
  Navigation,
  Plus,
  Power,
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
import { palette } from "../constants/theme";
import dayjs from "dayjs";

const { Text } = Typography;

/* =========================================================
   CONSTANTS
========================================================= */

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

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save branch.";
};

const normalizeHours = (hours) => {
  if (!hours) return [];

  if (Array.isArray(hours)) return hours;

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

const googleMapsUrl = (branch) =>
  branch.latitude && branch.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    : null;

/* =========================================================
   MAIN COMPONENT
========================================================= */

const BranchesPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 12;

  // ─── Filters state ───────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [restaurantOptions, setRestaurantOptions] = useState([]);

  // ─── Detail drawer state ─────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const loadBranches = async (manual = false) => {
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
      if (restaurantFilter) {
        params.set("restaurant_id", String(restaurantFilter));
      }

      const response = await request(`branches?${params.toString()}`, "GET");

      if (Array.isArray(response?.data)) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((row) => row.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load branches.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load branches.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // For the "Add Branch" restaurant picker.
  const loadRestaurantOptions = async () => {
    const response = await request("restaurants?limit=100", "GET");
    if (Array.isArray(response?.data)) {
      setRestaurantOptions(
        response.data
          .filter((restaurant) => restaurant.status === "verified")
          .map((restaurant) => ({
            value: restaurant.id,
            label: restaurant.name,
          })),
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBranches();
      loadRestaurantOptions();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshKey, page, search, statusFilter, restaurantFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     BRANCH CRUD
  ========================================================= */

  const openDetail = (branch) => {
    setSelected(branch);
    setDetailOpen(true);
  };

  const openBranchModal = (branch = null) => {
    setEditingBranch(branch);
    branchForm.resetFields();

    if (branch) {
      branchForm.setFieldsValue({
        restaurant_id: branch.restaurant_id,
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

    const restaurantId = editingBranch
      ? editingBranch.restaurant_id
      : values.restaurant_id;

    const response = editingBranch
      ? await request(
          `restaurants/${restaurantId}/branches/${editingBranch.id}`,
          "PUT",
          payload,
        )
      : await request(`restaurants/${restaurantId}/branches`, "POST", payload);

    setSubmitting(false);

    if (!response?.id) {
      message.error(firstSaveError(response));
      return;
    }

    message.success(editingBranch ? "Branch updated." : "Branch added.");
    setBranchModalOpen(false);
    setEditingBranch(null);
    branchForm.resetFields();
    setRefreshKey((key) => key + 1);
  };

  const toggleBranchActive = async (branch) => {
    const response = await request(
      `restaurants/${branch.restaurant_id}/branches/${branch.id}`,
      "PUT",
      { is_active: !branch.is_active },
    );

    if (response?.id) {
      setRows((current) =>
        current.map((item) =>
          item.id === response.id
            ? { ...item, is_active: response.is_active }
            : item,
        ),
      );
      setSelected((current) =>
        current && current.id === response.id
          ? { ...current, ...response }
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
      content: `${branch.name} will be removed permanently.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `restaurants/${branch.restaurant_id}/branches/${branch.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Branch deleted.");
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
    if (!hoursBranch) return;

    setSubmitting(true);

    const payload = hours.map((entry) => ({
      day: entry.day,
      open: entry.open,
      close: entry.close,
      closed: entry.closed,
    }));

    const response = await request(
      `restaurants/${hoursBranch.restaurant_id}/branches/${hoursBranch.id}`,
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

    setRows((current) =>
      current.map((item) =>
        item.id === response.id
          ? { ...item, operating_hours: response.operating_hours }
          : item,
      ),
    );
    setSelected((current) =>
      current && current.id === response.id
        ? { ...current, ...response }
        : current,
    );
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Branch",
      dataIndex: "name",
      key: "name",
      render: (value, row) => (
        <div style={{ minWidth: 0 }}>
          <Tooltip title="Click to view details">
            <Typography.Link
              strong
              onClick={() => openDetail(row)}
              style={{ color: palette.ink, fontWeight: 600 }}
            >
              {value}
            </Typography.Link>
          </Tooltip>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} color={palette.muted} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.address}
            </Text>
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
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (value) => value || "-",
    },
    {
      title: "Hours",
      key: "hours",
      render: (_, row) => (
        <Space size={4}>
          <Clock3 size={12} color={palette.muted} />
          <Text style={{ fontSize: 12 }}>
            {hoursSummary(row.operating_hours)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, row) =>
        row.is_active ? (
          <Tag color="green" style={{ margin: 0 }}>
            Active
          </Tag>
        ) : (
          <Tag style={{ margin: 0 }}>Inactive</Tag>
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
              { key: "edit", label: "Edit branch", icon: <Edit3 size={15} /> },
              {
                key: "hours",
                label: "Operating hours",
                icon: <Clock3 size={15} />,
              },
              {
                key: "toggle",
                label: row.is_active ? "Set inactive" : "Set active",
                icon: <Power size={15} />,
              },
              googleMapsUrl(row)
                ? {
                    key: "map",
                    label: (
                      <a
                        href={googleMapsUrl(row)}
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
                  }
                : null,
              { type: "divider" },
              {
                key: "delete",
                label: "Delete branch",
                icon: <Trash2 size={15} />,
                danger: true,
              },
            ].filter(Boolean),
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "view") openDetail(row);
              if (key === "edit") openBranchModal(row);
              if (key === "hours") openHoursModal(row);
              if (key === "toggle") toggleBranchActive(row);
              if (key === "delete") deleteBranch(row);
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
      <TopProgressBar active={loading || refreshing} label="Branches loading" />

      <ModulePage
        title="Branch Operations"
        description="Manage branch hours, holiday closures, service status, and locations across all restaurant partners."
        icon={Building2}
        stats={[
          {
            label: "Total branches",
            value: stats.total ?? 0,
            icon: Building2,
            iconBackground: palette.primaryLight,
          },
          {
            label: "Active branches",
            value: stats.active ?? 0,
            color: palette.success,
            icon: CheckCircle2,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Inactive branches",
            value: stats.inactive ?? 0,
            color: palette.muted,
            icon: XCircle,
            iconBackground: "#F8FAFC",
          },
          {
            label: "Restaurants",
            value: stats.restaurants ?? 0,
            icon: Store,
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
              placeholder="Search branch, restaurant, or city…"
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
            <Select
              placeholder="All statuses"
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value || "");
                setPage(1);
              }}
              allowClear
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              style={{ width: 140 }}
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
              onClick={() => openBranchModal()}
            >
              Add Branch
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
            `${range[0]}-${range[1]} of ${count} branches`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Branch Detail Drawer ──────────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <Building2 size={18} color={palette.primary} />
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
              <Switch
                checked={selected.is_active}
                onChange={() => toggleBranchActive(selected)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                size="small"
              />
              <Button
                size="small"
                icon={<Edit3 size={14} />}
                onClick={() => openBranchModal(selected)}
              >
                Edit
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                { label: "Restaurant", value: selected.restaurant_name },
                { label: "Address", value: `${selected.address || "-"}` },
                { label: "City", value: selected.city || "-" },
                {
                  label: "Postal code",
                  value: selected.postal_code || "-",
                },
                { label: "Phone", value: selected.phone || "-" },
                {
                  label: "Operating hours",
                  value: hoursSummary(selected.operating_hours),
                },
                {
                  label: "Coordinates",
                  value:
                    selected.latitude != null && selected.longitude != null
                      ? `${Number(selected.latitude).toFixed(5)}, ${Number(
                          selected.longitude,
                        ).toFixed(5)}`
                      : "-",
                },
                {
                  label: "Status",
                  value: selected.is_active ? "Active" : "Inactive",
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
                  <Text
                    strong
                    style={{ fontSize: 12, textAlign: "right" }}
                  >
                    {item.value}
                  </Text>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                icon={<Clock3 size={14} />}
                onClick={() => openHoursModal(selected)}
                style={{ borderRadius: 2 }}
              >
                Operating Hours
              </Button>
              {googleMapsUrl(selected) && (
                <a
                  href={googleMapsUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    icon={<Navigation size={14} />}
                    style={{ borderRadius: 2 }}
                  >
                    Open in Google Maps
                  </Button>
                </a>
              )}
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteBranch(selected)}
                style={{ borderRadius: 2, marginLeft: "auto" }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Branch Modal ──────────────────────── */}
      <Modal
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        open={branchModalOpen}
        onCancel={() => setBranchModalOpen(false)}
        onOk={saveBranch}
        confirmLoading={submitting}
        okText={editingBranch ? "Save Changes" : "Add Branch"}
        width={520}
        forceRender
      >
        <Form form={branchForm} layout="vertical" requiredMark={false}>
          {!editingBranch && (
            <Form.Item
              label="Restaurant"
              name="restaurant_id"
              rules={[{ required: true, message: "Please select a restaurant." }]}
            >
              <Select
                placeholder="Select a verified restaurant"
                showSearch
                optionFilterProp="label"
                options={restaurantOptions}
              />
            </Form.Item>
          )}
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
            Toggle a day off to mark it closed. Used by kitchen and dispatch
            flows to route orders to open branches.
          </Text>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default BranchesPage;
