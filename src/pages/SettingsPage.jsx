import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
  Upload,
  InputNumber,
} from "antd";
import {
  BellRing,
  CreditCard,
  Globe2,
  ImagePlus,
  Loader2,
  Save,
  Settings2,
  ShieldAlert,
  Store,
} from "lucide-react";
import TopProgressBar from "../components/ui/TopProgressBar";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";

const { Text, Title } = Typography;

const API_ORIGIN = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");

const toMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:\/\/|blob:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

const TIMEZONE_OPTIONS = [
  { value: "Asia/Phnom_Penh", label: "Asia / Phnom Penh" },
  { value: "Asia/Bangkok", label: "Asia / Bangkok" },
  { value: "Asia/Ho_Chi_Minh", label: "Asia / Ho Chi Minh" },
  { value: "Asia/Yangon", label: "Asia / Yangon" },
  { value: "Asia/Singapore", label: "Asia / Singapore" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "KHR", label: "KHR — Cambodian Riel" },
  { value: "THB", label: "THB — Thai Baht" },
  { value: "VND", label: "VND — Vietnamese Dong" },
];

const PREP_TIME_OPTIONS = [15, 20, 30, 45, 60, 90].map((m) => ({
  value: String(m),
  label: `${m} minutes`,
}));

const PAYMENT_PROVIDER_OPTIONS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "stripe", label: "Stripe" },
  { value: "aba", label: "ABA Pay" },
  { value: "wing", label: "Wing" },
];

const SettingHeader = ({ icon: Icon, title, description }) => (
  <Space align="start" size={12}>
    <Icon size={20} color={palette.primary} strokeWidth={1.8} />
    <div>
      <Text strong>{title}</Text>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Text>
      </div>
    </div>
  </Space>
);

const SettingSwitch = ({ label, description, name, control }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: `1px solid ${palette.border}`,
    }}
  >
    <div style={{ flex: 1, marginRight: 16 }}>
      <Text style={{ fontSize: 13 }}>{label}</Text>
      {description && (
        <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 1 }}>
          {description}
        </Text>
      )}
    </div>
    <Form.Item name={name} valuePropName="checked" noStyle>
      <Switch size="small" />
    </Form.Item>
  </div>
);

const BrandUpload = ({ label, name, accept, hint, existingUrl, onRemove }) => {
  const [preview, setPreview] = useState(null);

  const handleChange = ({ fileList }) => {
    const latest = fileList[fileList.length - 1];
    if (latest?.originFileObj) {
      setPreview(URL.createObjectURL(latest.originFileObj));
    } else {
      setPreview(null);
    }
  };

  const displayUrl = preview || (existingUrl ? toMediaUrl(existingUrl) : null);

  return (
    <div style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>{label}</Text>
      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
        <Form.Item name={name} valuePropName="fileList" getValueFromEvent={normFile} noStyle>
          <Upload
            listType="picture-card"
            beforeUpload={() => false}
            maxCount={1}
            accept={accept}
            onChange={handleChange}
            onRemove={() => {
              setPreview(null);
              onRemove?.();
            }}
          >
            {!displayUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <ImagePlus size={18} color={palette.faint} />
                <span style={{ fontSize: 10, color: palette.faint }}>Upload</span>
              </div>
            )}
          </Upload>
        </Form.Item>
        {displayUrl && (
          <img
            src={displayUrl}
            alt={label}
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
              borderRadius: 4,
              border: `1px solid ${palette.border}`,
              padding: 4,
            }}
          />
        )}
      </div>
      {hint && (
        <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandLogo, setBrandLogo] = useState(null);
  const [brandFavicon, setBrandFavicon] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request("settings", "GET");
      const groups = res?.settings || {};

      const flat = {};
      for (const [, items] of Object.entries(groups)) {
        for (const [key, data] of Object.entries(items)) {
          flat[key] = data.value;
        }
      }

      setBrandLogo(groups?.general?.brand_logo?.url || null);
      setBrandFavicon(groups?.general?.brand_favicon?.url || null);

      const logoUrl = groups?.general?.brand_logo?.url || null;
      const favUrl = groups?.general?.brand_favicon?.url || null;
      form.setFieldValue("brand_logo", logoUrl
        ? [{ uid: "-1", name: "logo", status: "done", url: toMediaUrl(logoUrl) }]
        : []);
      form.setFieldValue("brand_favicon", favUrl
        ? [{ uid: "-1", name: "favicon", status: "done", url: toMediaUrl(favUrl) }]
        : []);

      form.setFieldsValue({
        platform_name: flat.platform_name || "",
        support_email: flat.support_email || "",
        timezone: flat.timezone || "Asia/Phnom_Penh",
        currency: flat.currency || "USD",
        prep_time_minutes: String(flat.prep_time_minutes ?? "30"),
        auto_accept_orders: flat.auto_accept_orders ?? true,
        order_alerts: flat.order_alerts ?? true,
        rider_alerts: flat.rider_alerts ?? true,
        refund_alerts: flat.refund_alerts ?? true,
        payment_provider: flat.payment_provider || "cod",
        commission_rate: Number(flat.commission_rate ?? 12),
        cash_on_delivery: flat.cash_on_delivery ?? true,
        auto_settlement: flat.auto_settlement ?? true,
        maintenance_mode: flat.maintenance_mode ?? false,
      });
    } catch {
      notification.error({ message: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }, [form, notification]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        if (key === "brand_logo" || key === "brand_favicon") continue;
        if (typeof value === "boolean") {
          formData.append(`settings[${key}]`, value ? "1" : "0");
        } else if (value !== null && value !== undefined) {
          formData.append(`settings[${key}]`, value);
        }
      }

      const logoFile = (values.brand_logo || []).find((f) => f.originFileObj);
      if (logoFile) formData.append("brand_logo", logoFile.originFileObj);

      const favFile = (values.brand_favicon || []).find((f) => f.originFileObj);
      if (favFile) formData.append("brand_favicon", favFile.originFileObj);

      formData.append("_method", "PUT");

      const res = await request("settings", "POST", formData);
      if (res?.settings) {
        setBrandLogo(res.settings?.general?.brand_logo?.url || null);
        setBrandFavicon(res.settings?.general?.brand_favicon?.url || null);
      }
      if (res?.message) {
        notification.success({ message: res.message });
      }
    } catch (err) {
      notification.error({
        message: err?.response?.data?.message || err?.message || "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin indicator={<Loader2 size={28} className="animate-spin" color={palette.primary} />} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: "auto", width: "100%" }}>
      <TopProgressBar active={saving} label="Saving settings" />

      <div>
        <Space align="center" size={10}>
          <Settings2 size={22} color={palette.primary} strokeWidth={1.8} />
          <Title level={3} style={{ margin: 0 }}>Platform Settings</Title>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          Configure platform identity, branding, ordering defaults, notifications, and payments.
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={[16, 16]}>
          {/* ── Brand Identity ── */}
          <Col xs={24} lg={12}>
            <Card
              title={<SettingHeader icon={Store} title="Brand identity" description="Platform brand images and basic information." />}
              variant="outlined"
              style={{ borderRadius: 2 }}
            >
              <BrandUpload
                label="Platform logo"
                name="brand_logo"
                accept="image/jpeg,image/png,image/webp"
                hint="Recommended 200x200px. PNG or SVG. Max 2MB."
                existingUrl={brandLogo}
                onRemove={() => setBrandLogo(null)}
              />
              <BrandUpload
                label="Favicon"
                name="brand_favicon"
                accept="image/jpeg,image/png,image/webp,image/x-icon"
                hint="16x16 or 32x32px. Used in browser tabs. Max 1MB."
                existingUrl={brandFavicon}
                onRemove={() => setBrandFavicon(null)}
              />
              <Form.Item label="Platform name" name="platform_name">
                <Input placeholder="FoodOrder Platform" />
              </Form.Item>
              <Form.Item label="Support email" name="support_email">
                <Input placeholder="support@foodorder.com" />
              </Form.Item>
              <Form.Item label="Default timezone" name="timezone">
                <Select options={TIMEZONE_OPTIONS} />
              </Form.Item>
            </Card>
          </Col>

          {/* ── Order Defaults ── */}
          <Col xs={24} lg={12}>
            <Card
              title={<SettingHeader icon={Globe2} title="Order defaults" description="Defaults when restaurants or customers don't specify." />}
              variant="outlined"
              style={{ borderRadius: 2 }}
            >
              <Form.Item label="Default currency" name="currency">
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>
              <Form.Item label="Preparation time" name="prep_time_minutes">
                <Select options={PREP_TIME_OPTIONS} />
              </Form.Item>
              <SettingSwitch
                label="Auto-accept orders"
                description="Automatically confirm incoming orders without manual review."
                name="auto_accept_orders"
              />
            </Card>
          </Col>

          {/* ── Notifications ── */}
          <Col xs={24} lg={12}>
            <Card
              title={<SettingHeader icon={BellRing} title="Notifications" description="Choose which events notify your team." />}
              variant="outlined"
              style={{ borderRadius: 2 }}
            >
              <SettingSwitch
                label="New order alerts"
                description="Notify when a new order is placed."
                name="order_alerts"
              />
              <SettingSwitch
                label="Rider dispatch alerts"
                description="Notify when a rider is assigned or status changes."
                name="rider_alerts"
              />
              <SettingSwitch
                label="Refund approval alerts"
                description="Notify when a refund request needs review."
                name="refund_alerts"
              />
            </Card>
          </Col>

          {/* ── Payments ── */}
          <Col xs={24} lg={12}>
            <Card
              title={<SettingHeader icon={CreditCard} title="Payments" description="Payment methods and settlement behavior." />}
              variant="outlined"
              style={{ borderRadius: 2 }}
            >
              <Form.Item
                label="Platform commission (%)"
                name="commission_rate"
                extra="No subscription: this % is deducted from the food subtotal of every customer order. New partners accept the rate shown at sign-up."
              >
                <InputNumber min={0} max={50} step={0.5} addonAfter="%" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Default payment provider" name="payment_provider">
                <Select options={PAYMENT_PROVIDER_OPTIONS} />
              </Form.Item>
              <SettingSwitch
                label="Cash on delivery"
                description="Allow customers to pay with cash upon delivery."
                name="cash_on_delivery"
              />
              <SettingSwitch
                label="Automatic settlement"
                description="Automatically settle rider earnings after delivery completion."
                name="auto_settlement"
              />
            </Card>
          </Col>
        </Row>

        {/* ── Maintenance Mode ── */}
        <Card variant="outlined" style={{ borderRadius: 2, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={18} color={palette.danger} strokeWidth={1.8} />
              <div>
                <Text strong style={{ fontSize: 13 }}>Maintenance mode</Text>
                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                  Pause new orders while keeping operations data accessible.
                </Text>
              </div>
            </div>
            <Form.Item name="maintenance_mode" valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
          </div>
        </Card>

        {/* ── Save Button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button type="primary" icon={<Save size={16} />} htmlType="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;
