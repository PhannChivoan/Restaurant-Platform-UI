import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input } from "antd";
import { Bike, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { request } from "../utils/request";
import { getAccessToken, setAccessToken, setProfile } from "../store/access_token";
import { DotsRing } from "../components/ui/dots-ring";
import "./login-theme.css";

// Same palette as the customer site (food ordering platform theme).
const c = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  ink: "#0B1C30",
  muted: "#584237",
  surface: "#F8F9FF",
  line: "#E0C0B1",
};

const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBX1DG3p496DhtNSC3lEZVCEyBkPQidPYwVh1kDVCECDi_n051MXbpPUQaHsPx0oKJuIF3zG1_E2pVD7AmMdVcu6qLDshqxh0rwnu_KbhNpYVxqMgLLLY-AUFGyPwlQC6Q4QReig-US2iTYPdP2WBWP50WKkh4hi2tw0N91r8fwneEHZQO9_sV2LBLiMgt2DbMCC9IGF8rxa5-oYQaTpBmUPvC94eP9Ih8AFnfuqbeI";

const FEATURES = [
  [ShoppingBag, "Live orders & kitchen queue", "Accept, prepare and hand over orders in real time."],
  [UtensilsCrossed, "Menus, categories & promotions", "Keep your menu, prices and coupons up to date."],
  [Bike, "Dispatch & delivery tracking", "Assign riders and follow every delivery on the map."],
];

export default function LoginPage() {
  // ===============================
  // All State
  // ===============================
  const [status, setStatus] = useState(() => (getAccessToken() ? "success" : "idle"));
  const [errorMessage, setErrorMessage] = useState("");
  const [needOtp, setNeedOtp] = useState(false); // the account has two-factor sign-in on
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ===============================
  // Functions Handlers (unchanged sign-in logic)
  // ===============================

  const handleSubmit = async (values) => {
    setErrorMessage("");
    setStatus("loading");

    try {
      const response = await request("auth/login", "POST", {
        email: values.email.trim(),
        password: values.password,
        remember_me: values.keepSignedIn,
        otp: values.otp ? String(values.otp).trim() : undefined,
      });

      if (!response?.token) {
        if (response?.two_factor_required) setNeedOtp(true);
        const validationErrors = response?.errors || {};
        const fieldErrors = Object.entries(validationErrors).map(([name, messages]) => ({
          name,
          errors: Array.isArray(messages) ? messages : [messages],
        }));
        if (fieldErrors.length > 0) form.setFields(fieldErrors);
        throw new Error(response?.message || "Unable to sign in. Check your credentials.");
      }

      setAccessToken(response.token);
      if (response.user) setProfile(response.user);
      // drivers work from their own module; everyone else lands on the dashboard
      navigate(response.user?.role === "rider" ? "/driver" : "/");
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
      setStatus("idle");
    }
  };

  const loading = status === "loading";

  return (
    <div className="fo-login min-h-screen w-full flex flex-col md:flex-row" style={{ background: c.surface }}>
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full" style={{ maxWidth: 420 }}>
          <div className="flex items-center gap-3 mb-10">
            <span style={{ width: 44, height: 44, borderRadius: 14, background: c.primary, display: "grid", placeItems: "center", boxShadow: "0 8px 20px rgba(249,115,22,.35)" }}>
              <UtensilsCrossed size={22} color="#fff" />
            </span>
            <div>
              <div className="fo-display" style={{ fontSize: 20, fontWeight: 800, color: c.ink, lineHeight: 1.1 }}>FoodOrder</div>
              <div style={{ fontSize: 12, color: c.muted, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>Partner &amp; admin dashboard</div>
            </div>
          </div>

          <h1 style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 800, color: c.ink, margin: 0 }}>Welcome back</h1>
          <p style={{ color: c.muted, fontSize: 15, margin: "8px 0 28px" }}>Sign in to manage orders, restaurants and deliveries.</p>

          <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 12px 40px rgba(11,28,48,.08)" }}>
            <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit} initialValues={{ keepSignedIn: false }}>
              {errorMessage && <Alert type="error" showIcon title={errorMessage} style={{ marginBottom: 18, borderRadius: 12 }} />}

              <Form.Item
                label={<span style={{ fontWeight: 600, color: c.ink }}>Email address</span>}
                name="email"
                rules={[
                  { required: true, message: "Enter your email address." },
                  { type: "email", message: "That email address doesn't look right." },
                ]}
              >
                <Input type="email" placeholder="you@restaurant.com" size="large" autoComplete="email" style={{ height: 50 }} />
              </Form.Item>

              <Form.Item
                label={
                  <div className="flex w-full items-center justify-between" style={{ width: 356 }}>
                    <span style={{ fontWeight: 600, color: c.ink }}>Password</span>
                    <a href="#forgot" style={{ color: c.primary, fontSize: 13, fontWeight: 600 }}>Forgot password?</a>
                  </div>
                }
                name="password"
                rules={[{ required: true, message: "Enter your password." }]}
              >
                <Input.Password placeholder="Your password" size="large" autoComplete="current-password" visibilityToggle style={{ height: 50 }} />
              </Form.Item>

              {needOtp && (
                <Form.Item
                  label={<span style={{ fontWeight: 600, color: c.ink }}>Authenticator code</span>}
                  name="otp"
                  rules={[{ required: true, message: "Enter the 6-digit code from your authenticator app." }]}
                >
                  <Input placeholder="123456" size="large" inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus style={{ height: 50, letterSpacing: 6 }} />
                </Form.Item>
              )}

              <Form.Item name="keepSignedIn" valuePropName="checked" style={{ marginBottom: 22 }}>
                <Checkbox style={{ color: c.muted }}>Keep me signed in on this device</Checkbox>
              </Form.Item>

              <Button
                htmlType="submit"
                block
                size="large"
                disabled={loading}
                style={{ height: 52, borderRadius: 14, background: loading ? c.primaryHover : c.primary, borderColor: "transparent", color: "#fff", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 20px rgba(249,115,22,.35)" }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <DotsRing style={{ width: 18, height: 18, color: "#fff" }} />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </Form>
          </div>

          <p style={{ marginTop: 24, fontSize: 14, color: c.muted, lineHeight: 1.9 }}>
            New driver?{" "}
            <a href="/admin/register" style={{ color: c.primary, fontWeight: 700 }}>Create a driver account</a>
            <br />
            Restaurant owner?{" "}
            <a href="/partner/register" style={{ color: c.primary, fontWeight: 700 }}>Register your business</a>
          </p>
        </div>
      </div>

      {/* Right: food imagery */}
      <div className="hidden md:flex flex-1 relative overflow-hidden" style={{ minHeight: 560 }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${HERO}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(249,115,22,.55) 0%, rgba(11,28,48,.88) 100%)" }} />
        <div className="relative flex flex-col justify-end p-12" style={{ color: "#fff" }}>
          <h2 style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 800, margin: 0, maxWidth: 440 }}>Run your restaurant business in one place.</h2>
          <p style={{ opacity: 0.85, margin: "12px 0 28px", maxWidth: 440, fontSize: 15 }}>
            From the first order to the last delivery, everything your team needs is on one dashboard.
          </p>
          <div className="flex flex-col gap-4" style={{ maxWidth: 440 }}>
            {FEATURES.map(([Icon, title, body]) => (
              <div key={title} className="flex items-start gap-3">
                <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon size={19} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}