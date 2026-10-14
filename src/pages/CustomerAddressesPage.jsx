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
  List,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  App,
} from "antd";

import {
  Building2,
  CheckCircle2,
  Edit3,
  Ellipsis,
  Eye,
  Filter,
  History,
  MapPin,
  MapPinHouse,
  Package,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User,
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

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

const CustomerAddressesPage = () => {
  // ─── List state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [cities, setCities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  // ─── Filters ─────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState(null);
  const [defaultFilter, setDefaultFilter] = useState(null);

  // ─── Detail drawer ───────────────────────────────
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Address modal ───────────────────────────────
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressModalMode, setAddressModalMode] = useState("add");
  const [addressForm] = Form.useForm();

  // ─── Reference: customer options ──────────────────
  const [customerOptions, setCustomerOptions] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     DATA LOADING
  ========================================================= */

  const loadAddresses = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (cityFilter) params.set("city", cityFilter);
      if (defaultFilter) params.set("default_only", "1");

      const response = await request(
        `customer-addresses?${params.toString()}`,
        "GET",
      );

      if (response?.data) {
        setRows(response.data);
        setTotal(response.total || 0);
        setStats(response.stats || {});
        setCities(response.cities || []);

        setSelected((current) => {
          if (!current) return current;
          const fresh = response.data.find((r) => r.id === current.id);
          return fresh ? { ...current, ...fresh } : current;
        });
      } else {
        setError(response?.message || "Unable to load addresses.");
      }
    } catch (err) {
      setError(err?.message || "Unable to load addresses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCustomers = async () => {
    const res = await request("customers?limit=500", "GET");
    if (Array.isArray(res?.data)) {
      setCustomerOptions(
        res.data.map((c) => ({
          value: c.id,
          label: `${c.name} — ${c.email}`,
        })),
      );
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [refreshKey, page, search, cityFilter, defaultFilter]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     DETAIL DRAWER
  ========================================================= */

  const openDetail = (address) => {
    setSelected(address);
    setDetailOpen(true);
    setDetailLoading(true);

    request(`customer-addresses/${address.id}`, "GET")
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
     ADDRESS CRUD
  ========================================================= */

  const openAddModal = (userId = null) => {
    setEditingAddress(null);
    setAddressModalMode("add");
    addressForm.resetFields();
    addressForm.setFieldsValue({
      is_default: false,
      user_id: userId,
    });
    setAddressModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setAddressModalMode("edit");
    addressForm.resetFields();
    addressForm.setFieldsValue({
      user_id: address.user_id,
      label: address.label,
      address: address.address,
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setAddressModalOpen(true);
  };

  const saveAddress = async () => {
    let values;
    try {
      values = await addressForm.validateFields();
    } catch {
      return;
    }

    const userId = values.user_id;
    if (!userId) {
      message.error("Please select a customer.");
      return;
    }

    setSubmitting(true);

    let response;
    if (addressModalMode === "edit" && editingAddress) {
      response = await request(
        `customers/${editingAddress.user_id}/addresses/${editingAddress.id}`,
        "PUT",
        values,
      );
    } else {
      response = await request(
        `customers/${userId}/addresses`,
        "POST",
        values,
      );
    }

    setSubmitting(false);

    if (response?.id || response?.message) {
      message.success(
        addressModalMode === "edit"
          ? "Address updated."
          : "Address created.",
      );
      setAddressModalOpen(false);
      setEditingAddress(null);
      addressForm.resetFields();
      setRefreshKey((k) => k + 1);
    } else {
      message.error(firstSaveError(response));
    }
  };

  const deleteAddress = (address) => {
    Modal.confirm({
      title: "Delete address?",
      content: (
        <span>
          Remove <strong>{address.address}</strong> from{" "}
          <strong>{address.customer_name}</strong>'s saved addresses?
        </span>
      ),
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        const response = await request(
          `customers/${address.user_id}/addresses/${address.id}`,
          "DELETE",
        );

        if (response?.message) {
          message.success("Address deleted.");
          setDetailOpen(false);
          setSelected(null);
          setRefreshKey((k) => k + 1);
        } else {
          message.error(response?.message || "Delete failed.");
        }
      },
    });
  };

  const toggleDefault = async (address) => {
    const response = await request(
      `customers/${address.user_id}/addresses/${address.id}/default`,
      "POST",
    );

    if (response?.message) {
      message.success("Default address updated.");
      setRefreshKey((k) => k + 1);
      if (selected?.id === address.id) {
        setSelected({ ...selected, is_default: true });
      }
    } else {
      message.error(response?.message || "Failed to update default.");
    }
  };

  /* =========================================================
     TABLE COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#EFF6FF",
              flexShrink: 0,
            }}
          >
            <User size={14} color={palette.info} />
          </div>
          <div style={{ minWidth: 0 }}>
            <Tooltip title="Click to view address details">
              <Typography.Link
                strong
                onClick={(event) => {
                  event.stopPropagation();
                  openDetail(row);
                }}
                style={{ color: palette.ink, fontWeight: 600 }}
              >
                {row.customer_name}
              </Typography.Link>
            </Tooltip>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {row.customer_email}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      width: 100,
      render: (value) =>
        value ? (
          <Tag color="blue" style={{ margin: 0 }}>
            {value}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={13} color={palette.muted} style={{ flexShrink: 0 }} />
          <Text ellipsis>{value}</Text>
        </div>
      ),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      width: 120,
    },
    {
      title: "Default",
      dataIndex: "is_default",
      key: "is_default",
      width: 80,
      align: "center",
      render: (isDefault) =>
        isDefault ? (
          <Tag
            color="green"
            icon={<Star size={10} />}
            style={{ margin: 0 }}
          >
            Default
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
          </Text>
        ),
    },
    {
      title: "Orders",
      dataIndex: "orders_used",
      key: "orders_used",
      width: 70,
      align: "center",
      render: (value) => (
        <Tag
          color={value > 0 ? palette.primary : "default"}
          style={{ margin: 0 }}
        >
          {value ?? 0}
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
              {
                key: "view",
                label: "View details",
                icon: <Eye size={15} />,
              },
              {
                key: "edit",
                label: "Edit address",
                icon: <Edit3 size={15} />,
              },
              {
                key: "default",
                label: row.is_default
                  ? "Already default"
                  : "Set as default",
                icon: <Star size={15} />,
                disabled: row.is_default,
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
              if (key === "edit") openEditModal(row);
              if (key === "default") toggleDefault(row);
              if (key === "delete") deleteAddress(row);
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
        label="Addresses loading"
      />

      <ModulePage
        title="Delivery Addresses"
        description="Review and manage saved customer delivery addresses across all accounts."
        icon={MapPinHouse}
        stats={[
          {
            label: "Total addresses",
            value: stats.total ?? 0,
            icon: MapPinHouse,
            iconBackground: "#EFF6FF",
          },
          {
            label: "Default addresses",
            value: stats.default ?? 0,
            color: palette.success,
            icon: Star,
            iconBackground: "#ECFDF5",
          },
          {
            label: "Cities covered",
            value: stats.cities ?? 0,
            color: palette.info,
            icon: Building2,
            iconBackground: "#EFF6FF",
          },
          {
            label: "New this week",
            value: stats.new_this_week ?? 0,
            color: palette.primary,
            icon: Plus,
            iconBackground: palette.primaryLight,
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
              placeholder="Search address, customer…"
              prefix={<Search size={14} color={palette.muted} />}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder="City"
              value={cityFilter}
              onChange={(v) => {
                setCityFilter(v);
                setPage(1);
              }}
              allowClear
              showSearch
              style={{ width: 150 }}
              options={(cities || []).map((c) => ({
                value: c,
                label: c,
              }))}
            />
            <Tooltip title={defaultFilter ? "Show all" : "Default only"}>
              <Button
                icon={<Star size={15} />}
                onClick={() => {
                  setDefaultFilter((v) => (v ? null : "1"));
                  setPage(1);
                }}
                type={defaultFilter ? "primary" : "default"}
                style={{ borderRadius: 2 }}
              />
            </Tooltip>
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
              onClick={() => openAddModal()}
            >
              Add Address
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
            `${range[0]}-${range[1]} of ${count} addresses`,
        }}
        columns={columns}
        rows={rows}
      />

      {/* ─── Address Detail Drawer ───────────────────── */}
      <Drawer
        title={
          <Space align="center" size={10}>
            <MapPinHouse size={18} color={palette.info} />
            <span>Address Detail</span>
          </Space>
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
                  openEditModal(selected);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => deleteAddress(selected)}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {detailLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <DotsRing style={{ width: 36, height: 36, color: palette.info }} />
              </div>
            ) : (
              <>
                {/* Customer info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 2,
                    background: palette.bgSubtle,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#EFF6FF",
                    }}
                  >
                    <User size={16} color={palette.info} />
                  </div>
                  <div>
                    <Text strong>{selected.customer_name}</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selected.customer_email}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Address info */}
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
                      label: "Label",
                      value: selected.label || "-",
                    },
                    {
                      label: "Address",
                      value: selected.address,
                    },
                    {
                      label: "City",
                      value: selected.city,
                    },
                    {
                      label: "Postal code",
                      value: selected.postal_code || "-",
                    },
                    {
                      label: "Default",
                      value: selected.is_default ? "Yes" : "No",
                    },
                    {
                      label: "Orders using this",
                      value: selected.orders_count ?? selected.orders_used ?? 0,
                    },
                    {
                      label: "Created",
                      value: formatDate(selected.created_at),
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

                {/* Default status */}
                {!selected.is_default && (
                  <Button
                    icon={<Star size={14} />}
                    onClick={() => {
                      toggleDefault(selected);
                      setSelected({ ...selected, is_default: true });
                    }}
                    style={{ borderRadius: 2, alignSelf: "flex-start" }}
                  >
                    Set as Default
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* ─── Add/Edit Address Modal ──────────────────── */}
      <Modal
        title={
          addressModalMode === "edit" ? "Edit Address" : "Add Address"
        }
        open={addressModalOpen}
        onCancel={() => setAddressModalOpen(false)}
        onOk={saveAddress}
        confirmLoading={submitting}
        okText={
          addressModalMode === "edit" ? "Save Changes" : "Create Address"
        }
        width={480}
        forceRender
      >
        <Form form={addressForm} layout="vertical" requiredMark={false}>
          {addressModalMode === "add" && (
            <Form.Item
              label="Customer"
              name="user_id"
              rules={[{ required: true, message: "Please select a customer." }]}
            >
              <Select
                showSearch
                placeholder="Select a customer"
                optionFilterProp="label"
                options={customerOptions}
              />
            </Form.Item>
          )}
          <Form.Item label="Label" name="label">
            <Select
              allowClear
              placeholder="Optional — e.g. Home, Office"
              options={[
                { value: "Home", label: "Home" },
                { value: "Office", label: "Office" },
                { value: "Other", label: "Other" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Street address"
            name="address"
            rules={[{ required: true, message: "Please enter the address." }]}
          >
            <Input
              prefix={<MapPin size={14} color={palette.muted} />}
              allowClear
              placeholder="Full street address"
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: "Required." }]}
            >
              <Input allowClear />
            </Form.Item>
            <Form.Item label="Postal code" name="postal_code">
              <Input allowClear placeholder="Optional" />
            </Form.Item>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Form.Item
              label="Latitude"
              name="lat"
              rules={[{ required: true, message: "Required." }]}
            >
              <InputNumber
                className="!w-full"
                min={-90}
                max={90}
                step={0.0001}
                placeholder="11.5564"
              />
            </Form.Item>
            <Form.Item
              label="Longitude"
              name="lng"
              rules={[{ required: true, message: "Required." }]}
            >
              <InputNumber
                className="!w-full"
                min={-180}
                max={180}
                step={0.0001}
                placeholder="104.9282"
              />
            </Form.Item>
          </div>
          <Form.Item
            label="Set as default"
            name="is_default"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default CustomerAddressesPage;
