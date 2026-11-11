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
  Info,
  Save,
  Settings2,
  ShieldAlert,
  Store,
} from "lucide-react";
import TopProgressBar from "../components/ui/TopProgressBar";
import PageHeader from "../components/ui/PageHeader";
import Loader from "../components/ui/Loader";
import { request } from "../utils/request";
import { Config } from "../utils/config";
import { palette } from "../constants/theme";
import { loadPlatformConfig } from "../utils/platformSettings";

const { Text } = Typography;

// what each option actually drives, shown under the field so it is clear the value
// is applied to the running system and not only stored
const EFFECTS = {
  platform_name: "Shown in the dashboard, the storefront header and the partner sign-up page.",
  support_email: "Contact address used on the storefront footer and support replies.",
  timezone: "Every date and time in the API, including access window checks.",
  currency: "How prices are shown across the storefront and dashboard, and the currency ABA PayWay charges. Only US dollars and Cambodian riel are supported.",
  exchange_rate: "Prices are stored in US dollars. With riel selected, every price is shown and charged at this rate (rounded to the nearest 100 riel).",
  prep_time_minutes: "Fallback preparation time when a dish has none of its own.",
  auto_accept_orders: "New customer orders arrive already accepted instead of pending.",
  order_alerts: "New-order notifications in the admin bell.",
  rider_alerts: "Dispatch alerts when an order needs a rider.",
  refund_alerts: "Alerts for cancelled orders and refund reviews.",
  commission_rate: "Percentage of the food subtotal kept by the platform on every order.",
  payment_provider: "Decides which online payment option customers are offered.",
  cash_on_delivery: "Whether customers may still choose cash on delivery.",
  auto_settlement: "Marks online orders paid and records the rider payout on delivery.",
  maintenance_mode: "Blocks new customer orders while operations data stays readable.",
};

const firstSaveError = (response) => {
  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.message || "Unable to save settings.";
};

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

// card with a coloured icon tile, a title and a one-line description
const SectionCard = ({ icon: Icon, color = palette.primary, title, description, children }) => (
  <Card variant="outlined" style={{ height: "100%" }} styles={{ body: { padding: 0 } }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: `1px solid ${palette.border}` }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0, color, background: `${color}1A` }}>
        <Icon size={21} strokeWidth={1.9} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: palette.ink, lineHeight: 1.3 }}>{title}</div>
        <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
      </div>
    </div>
    <div style={{ padding: "20px 22px 8px" }}>{children}</div>
  </Card>
);

// the small "what this drives" note under a field
const Effect = ({ children }) => (
  <span style={{ display: "inline-flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: palette.muted, marginTop: 4 }}>
    <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
    <span>{children}</span>
  </span>
);

const SettingSwitch = ({ label, description, name, effect }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "14px 16px",
      marginBottom: 12,
      borderRadius: 12,
      border: `1px solid ${palette.border}`,
      background: palette.bgSubtle,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: palette.ink }}>{label}</div>
      {description && (
        <Text type="secondary" style={{ display: "block", fontSize: 13, marginTop: 1 }}>
          {description}
        </Text>
      )}
      {effect && <Effect>{effect}</Effect>}
    </div>
    <Form.Item name={name} valuePropName="checked" noStyle>
      <Switch />
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
    <div style={{ padding: 16, borderRadius: 12, border: `1px dashed ${palette.borderStrong}`, background: palette.bgSubtle, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: palette.ink, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <ImagePlus size={20} color={palette.primary} />
                <span style={{ fontSize: 12, color: palette.muted }}>Upload</span>
              </div>
            )}
          </Upload>
        </Form.Item>
        {displayUrl && (
          <img
            src={displayUrl}
            alt={label}
            style={{
              width: 72,
              height: 72,
              objectFit: "contain",
              borderRadius: 12,
              border: `1px solid ${palette.border}`,
              background: palette.bg,
              padding: 6,
            }}
          />
        )}
      </div>
      {hint && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>{hint}</Text>
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

  // the API stores booleans as "true"/"false"; Form.Switch needs a real boolean or
// every toggle would come back switched on
const asBool = (value, fallback = false) => {
  if (value === true || value === false) return value;
  if (value === null || value === undefined || value === "") return fallback;
  return ["1", "true", "on", "yes"].includes(String(value).toLowerCase());
};

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
        currency: ["USD", "KHR"].includes(flat.currency) ? flat.currency : "USD",
        exchange_rate: Number(flat.exchange_rate ?? 4100),
        prep_time_minutes: String(flat.prep_time_minutes ?? "30"),
        auto_accept_orders: asBool(flat.auto_accept_orders, true),
        order_alerts: asBool(flat.order_alerts, true),
        rider_alerts: asBool(flat.rider_alerts, true),
        refund_alerts: asBool(flat.refund_alerts, true),
        payment_provider: flat.payment_provider || "cod",
        commission_rate: Number(flat.commission_rate ?? 12),
        cash_on_delivery: asBool(flat.cash_on_delivery, true),
        auto_settlement: asBool(flat.auto_settlement, true),
        maintenance_mode: asBool(flat.maintenance_mode, false),
      });
    } catch {
      notification.error({ message: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }, [form, notification]);

  useEffect(() => {
    // deferred so the state updates happen outside the effect body
    const timer = setTimeout(() => fetchSettings(), 0);
    return () => clearTimeout(timer);
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        if (key === "brand_logo" || key === "brand_favicon") continue;
        if (typeof value === "boolean") {
          // the API expects a real boolean, not "1"/"0"
          formData.append(`settings[${key}]`, value ? "true" : "false");
        } else if (value !== null && value !== undefined) {
          formData.append(`settings[${key}]`, value);
        }
      }

      // brand images can be cleared from the upload card
      if (values.brand_logo?.length === 0) formData.append("remove_brand_logo", "1");
      if (values.brand_favicon?.length === 0) formData.append("remove_brand_favicon", "1");

      const logoFile = (values.brand_logo || []).find((f) => f.originFileObj);
      if (logoFile) formData.append("brand_logo", logoFile.originFileObj);

      const favFile = (values.brand_favicon || []).find((f) => f.originFileObj);
      if (favFile) formData.append("brand_favicon", favFile.originFileObj);

      formData.append("_method", "PUT");

      const res = await request("settings", "POST", formData);
      // error responses (422, 403...) also carry a "message", so success is judged
      // by the saved settings coming back, not by the presence of a message
      if (res?.settings && !res?.errors) {
        notification.success({ message: res.message || "Settings updated successfully." });
        // the settings page is not enough: re-read what the API now serves so every
        // other screen (storefront, orders, branding) picks up the new values
        await loadPlatformConfig({ force: true });
        await fetchSettings();
      } else {
        notification.error({
          message: firstSaveError(res) || "Settings could not be saved.",
        });
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <PageHeader icon={Settings2} title="Platform Settings" description="Configure platform identity, branding, ordering defaults, notifications, and payments." />
        <Card variant="outlined"><Loader label="Loading settings…" minHeight={360} /></Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "auto", width: "100%" }}>
      <TopProgressBar active={saving} label="Saving settings" />

      <PageHeader
        icon={Settings2}
        title="Platform Settings"
        description="Configure platform identity, branding, ordering defaults, notifications, and payments."
      />

      <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
        <Row gutter={[16, 16]}>
          {/* ── Brand Identity ── */}
          <Col xs={24} lg={12}>
            <SectionCard icon={Store} color={palette.primary} title="Brand identity" description="Platform brand images and basic information.">
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                <Col xs={24} sm={12}>
                  <BrandUpload
                    label="Platform logo"
                    name="brand_logo"
                    accept="image/jpeg,image/png,image/webp"
                    hint="Recommended 200x200px. PNG or SVG. Max 2MB."
                    existingUrl={brandLogo}
                    onRemove={() => setBrandLogo(null)}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <BrandUpload
                    label="Favicon"
                    name="brand_favicon"
                    accept="image/jpeg,image/png,image/webp,image/x-icon"
                    hint="16x16 or 32x32px. Used in browser tabs. Max 1MB."
                    existingUrl={brandFavicon}
                    onRemove={() => setBrandFavicon(null)}
                  />
                </Col>
              </Row>
              <Form.Item label="Platform name" name="platform_name" extra={<Effect>{EFFECTS.platform_name}</Effect>}>
                <Input placeholder="FoodOrder Platform" />
              </Form.Item>
              <Form.Item label="Support email" name="support_email" extra={<Effect>{EFFECTS.support_email}</Effect>}>
                <Input placeholder="support@foodorder.com" />
              </Form.Item>
              <Form.Item label="Default timezone" name="timezone" extra={<Effect>{EFFECTS.timezone}</Effect>}>
                <Select options={TIMEZONE_OPTIONS} />
              </Form.Item>
            </SectionCard>
          </Col>

          {/* ── Order Defaults ── */}
          <Col xs={24} lg={12}>
            <SectionCard icon={Globe2} color="#7C3AED" title="Order defaults" description="Defaults when restaurants or customers don't specify.">
              <Form.Item label="Default currency" name="currency" extra={<Effect>{EFFECTS.currency}</Effect>}>
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, next) => prev.currency !== next.currency}
              >
                {({ getFieldValue }) =>
                  getFieldValue("currency") === "KHR" && (
                    <Form.Item
                      label="Exchange rate (riel per 1 US dollar)"
                      name="exchange_rate"
                      extra={<Effect>{EFFECTS.exchange_rate}</Effect>}
                      rules={[{ required: true, type: "number", min: 1000, max: 10000, message: "Enter a rate between 1,000 and 10,000." }]}
                    >
                      <InputNumber min={1000} max={10000} step={50} precision={0} addonBefore="៛" style={{ width: "100%" }} />
                    </Form.Item>
                  )
                }
              </Form.Item>
              <Form.Item label="Preparation time" name="prep_time_minutes" extra={<Effect>{EFFECTS.prep_time_minutes}</Effect>}>
                <Select options={PREP_TIME_OPTIONS} />
              </Form.Item>
              <SettingSwitch
                label="Auto-accept orders"
                description="Automatically confirm incoming orders without manual review."
                effect={EFFECTS.auto_accept_orders}
                name="auto_accept_orders"
              />
            </SectionCard>
          </Col>

          {/* ── Notifications ── */}
          <Col xs={24} lg={12}>
            <SectionCard icon={BellRing} color={palette.warning} title="Notifications" description="Choose which events notify your team.">
              <SettingSwitch
                label="New order alerts"
                description="Notify when a new order is placed."
                effect={EFFECTS.order_alerts}
                name="order_alerts"
              />
              <SettingSwitch
                label="Rider dispatch alerts"
                description="Notify when a rider is assigned or status changes."
                effect={EFFECTS.rider_alerts}
                name="rider_alerts"
              />
              <SettingSwitch
                label="Refund approval alerts"
                description="Notify when a refund request needs review."
                effect={EFFECTS.refund_alerts}
                name="refund_alerts"
              />
            </SectionCard>
          </Col>

          {/* ── Payments ── */}
          <Col xs={24} lg={12}>
            <SectionCard icon={CreditCard} color={palette.success} title="Payments" description="Payment methods and settlement behavior.">
              <Form.Item
                label="Platform commission (%)"
                name="commission_rate"
                extra={<Effect>No subscription: this % is deducted from the food subtotal of every customer order. New partners accept the rate shown at sign-up. {EFFECTS.commission_rate}</Effect>}
              >
                <InputNumber min={0} max={50} step={0.5} addonAfter="%" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Default payment provider" name="payment_provider" extra={<Effect>{EFFECTS.payment_provider}</Effect>}>
                <Select options={PAYMENT_PROVIDER_OPTIONS} />
              </Form.Item>
              <SettingSwitch
                label="Cash on delivery"
                description="Allow customers to pay with cash upon delivery."
                effect={EFFECTS.cash_on_delivery}
                name="cash_on_delivery"
              />
              <SettingSwitch
                label="Automatic settlement"
                description="Automatically settle rider earnings after delivery completion."
                effect={EFFECTS.auto_settlement}
                name="auto_settlement"
              />
            </SectionCard>
          </Col>
        </Row>

        {/* ── Maintenance Mode ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 16,
            padding: "18px 22px",
            borderRadius: 12,
            border: `1px solid ${palette.danger}55`,
            background: `${palette.danger}0F`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0, color: palette.danger, background: `${palette.danger}1F` }}>
              <ShieldAlert size={21} strokeWidth={1.9} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: palette.ink }}>Maintenance mode</div>
              <Text type="secondary" style={{ display: "block", fontSize: 13 }}>
                Pause new orders while keeping operations data accessible.
              </Text>
              <Effect>{EFFECTS.maintenance_mode}</Effect>
            </div>
          </div>
          <Form.Item name="maintenance_mode" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>

        {/* ── Save bar ── */}
        <div
          style={{
            position: "sticky",
            bottom: 16,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 16,
            padding: "14px 22px",
            borderRadius: 12,
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            Changes apply across the dashboard and storefront as soon as you save.
          </Text>
          <Button type="primary" size="large" icon={<Save size={17} />} htmlType="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;
