import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

import { palette } from "../constants/theme";
import { request } from "../utils/request";
import "./material-symbols.css";

const { Paragraph, Text, Title } = Typography;

// Curated Material Symbols; any other symbol name can be typed too.
const ICONS = ["lunch_dining", "local_pizza", "ramen_dining", "soup_kitchen", "set_meal", "rice_bowl", "bakery_dining", "coffee", "nutrition", "storefront", "icecream", "local_cafe", "kebab_dining", "fastfood", "cake", "restaurant", "emoji_food_beverage", "egg_alt", "tapas", "brunch_dining", "local_bar", "cookie"];
const COLORS = { orange: "#FFEDD5", rose: "#FFE4E6", amber: "#FEF3C7", red: "#FEE2E2", yellow: "#FEF9C3", teal: "#CCFBF1", stone: "#E7E5E4", green: "#DCFCE7", emerald: "#D1FAE5", blue: "#DBEAFE", purple: "#F3E8FF", pink: "#FCE7F3" };

const IconBadge = ({ icon, color }) => (
  <span style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS[color] ?? COLORS.orange, display: "inline-flex", alignItems: "center", justifyContent: "center", color: palette.ink }}>
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
  </span>
);

// Platform admin: the categories customers filter by on /order and that businesses pick when they register.
const CategoriesPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, row = edit
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const res = await request("restaurant-categories", "GET");
    if (Array.isArray(res?.data)) {
      setRows(res.data);
      setError("");
    } else setError(res?.message || "Unable to load categories.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const open = (row = {}) => {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({ name: row.name, icon: row.icon ?? "restaurant", color: row.color ?? "orange", sort_order: row.sort_order ?? (rows.length + 1), is_active: row.is_active ?? true });
  };

  const save = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    const body = { ...v, is_active: Boolean(v.is_active) };
    const res = editing?.id ? await request(`restaurant-categories/${editing.id}`, "PUT", body) : await request("restaurant-categories", "POST", body);
    setSaving(false);
    if (res?.message && !res?.errors && !res?.exception) {
      message.success(res.message);
      setEditing(null);
      load();
    } else message.error(res?.errors ? Object.values(res.errors).flat()[0] : res?.message || "Couldn't save the category.");
  };

  const remove = async (row) => {
    const res = await request(`restaurant-categories/${row.id}`, "DELETE");
    if (res?.message === "Category deleted.") {
      message.success("Category deleted.");
      load();
    } else message.error(res?.message || "Couldn't delete the category.");
  };

  const toggle = async (row, checked) => {
    const res = await request(`restaurant-categories/${row.id}`, "PUT", { name: row.name, icon: row.icon, color: row.color, sort_order: row.sort_order, is_active: checked });
    if (res?.message === "Category updated.") load();
    else message.error(res?.message || "Couldn't update the category.");
  };

  const columns = [
    { title: "", dataIndex: "icon", width: 56, render: (icon, r) => <IconBadge icon={icon} color={r.color} /> },
    { title: "Category", dataIndex: "name", render: (n, r) => (<><Text strong>{n}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>/{r.slug}</Text></>) },
    { title: "Restaurants", dataIndex: "restaurants_count", width: 120, render: (n) => <Tag>{n}</Tag> },
    { title: "Order", dataIndex: "sort_order", width: 80 },
    { title: "Visible to customers", dataIndex: "is_active", width: 170, render: (v, r) => <Switch checked={Boolean(v)} onChange={(c) => toggle(r, c)} /> },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<Pencil size={13} />} onClick={() => open(r)} />
          <Popconfirm title="Delete this category?" description={r.restaurants_count > 0 ? "It still has restaurants. Move them first." : undefined} onConfirm={() => remove(r)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<Trash2 size={13} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Space align="center" size={10}>
            <Tags size={22} color={palette.primary} strokeWidth={1.8} />
            <Title level={3} style={{ margin: 0 }}>Restaurant Categories</Title>
          </Space>
          <Paragraph style={{ color: palette.muted, margin: "8px 0 0" }}>
            The categories customers filter by on the order pages, and that businesses choose when they register. Hide a category to remove it from the customer site.
          </Paragraph>
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => open()}>
          New category
        </Button>
      </div>

      {error && <Alert type="error" showIcon title={error} />}

      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={false} size="middle" bordered />

      <Modal open={Boolean(editing)} title={editing?.id ? "Edit category" : "New category"} onCancel={() => setEditing(null)} onOk={save} confirmLoading={saving} okText="Save" destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Enter a category name." }]}>
            <Input placeholder="e.g. Burgers" maxLength={100} />
          </Form.Item>
          <Form.Item label="Icon" name="icon" extra="A Material Symbols name. Pick one or type your own.">
            <Select
              showSearch
              options={ICONS.map((i) => ({ value: i, label: (<Space><span className="material-symbols-outlined" style={{ fontSize: 20 }}>{i}</span>{i}</Space>) }))}
              onSearch={(v) => v && form.setFieldValue("icon", v.trim())}
            />
          </Form.Item>
          <Form.Item label="Color" name="color">
            <Select options={Object.entries(COLORS).map(([k, hex]) => ({ value: k, label: (<Space><span style={{ width: 14, height: 14, borderRadius: "50%", background: hex, display: "inline-block", border: `1px solid ${palette.border}` }} />{k}</Space>) }))} />
          </Form.Item>
          <Space size={24}>
            <Form.Item label="Display order" name="sort_order">
              <InputNumber min={0} max={9999} />
            </Form.Item>
            <Form.Item label="Visible to customers" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;