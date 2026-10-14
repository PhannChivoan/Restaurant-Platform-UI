import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Config } from "../../utils/config";

/* ───────────────────────── API ───────────────────────── */
const API = Config.BASE_URL.replace(/\/+$/, ""); // paths below start with "/"
const AFTER_AUTH_PATH = "/order/restaurant"; // <- change to your shop page route

async function authRequest(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.message || "Request failed"), {
      fieldErrors: data.errors || {},
    });
  }
  return data;
}

// same key the ShopPage reads
export const saveSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed")); // carts + header re-read the token
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const inputCls =
  "w-full pl-11 pr-space-md py-space-sm bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.4)] transition-all";

const FieldError = ({ msg }) =>
  msg ? <p className="font-body-sm text-body-sm text-error">{msg}</p> : null;

// Brand icons for the social sign-in buttons (not wired to the API yet).
const SOCIAL = [
  {
    name: "Google",
    icon: (
      <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
    ),
  },
  {
    name: "Apple",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-on-surface" aria-hidden="true">
        <path d="M16.37 1.43c0 1.14-.42 2.2-1.24 3.06-.9.94-1.98 1.49-3.15 1.4a3.3 3.3 0 0 1 1.26-2.9c.86-.74 2.05-1.28 3.13-1.56zM20.5 17.4c-.55 1.27-.81 1.84-1.52 2.96-.99 1.57-2.39 3.52-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.78-4.04-3.35C.01 16.1-.28 10.97 1.53 8.2c1.28-1.96 3.3-3.1 5.2-3.1 1.93 0 3.14 1.06 4.74 1.06 1.55 0 2.5-1.06 4.73-1.06 1.69 0 3.48.92 4.76 2.5-4.18 2.29-3.5 8.26.54 9.8z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.85v-8.38H7.08V12h3.02V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12z" />
      </svg>
    ),
  },
];
const AuthPage = () => {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const isLogin = pathname !== "/signup";

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k) => fieldErrors[k]?.[0];

  // clear messages when switching between login / signup
  useEffect(() => {
    setFormError("");
    setFieldErrors({});
  }, [isLogin]);

  const go = (mode) => navigate(mode === "login" ? "/login" : "/signup");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    setFieldErrors({});

    if (!isLogin && form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setBusy(true);
    try {
      const data = isLogin
        ? await authRequest("/auth/login", {
            email: form.email.trim(),
            password: form.password,
          })
        : await authRequest("/auth/register", {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            password: form.password,
            password_confirmation: form.password_confirmation,
            role: "customer",
          });

      saveSession(data); // stores token + user
      navigate(state?.from || AFTER_AUTH_PATH, { replace: true });
    } catch (e2) {
      setFieldErrors(e2.fieldErrors || {});
      // show the top-level message only if there is no field-level error to show
      if (!Object.keys(e2.fieldErrors || {}).length) setFormError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        <section className="relative w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-gutter-sm sm:p-gutter lg:p-space-xl overflow-hidden">
          <div className="absolute -top-32 -left-28 w-96 h-96 rounded-full bg-primary-fixed-dim/30 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-36 -right-28 w-[450px] h-[450px] rounded-full bg-surface-container-high/60 blur-3xl pointer-events-none"></div>
          <div className="relative w-full max-w-[1140px] bg-surface-container-lowest rounded-xl shadow-[0_20px_50px_rgba(11,28,48,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Visual column */}
            <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-space-xl text-on-primary overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBX1DG3p496DhtNSC3lEZVCEyBkPQidPYwVh1kDVCECDi_n051MXbpPUQaHsPx0oKJuIF3zG1_E2pVD7AmMdVcu6qLDshqxh0rwnu_KbhNpYVxqMgLLLY-AUFGyPwlQC6Q4QReig-US2iTYPdP2WBWP50WKkh4hi2tw0N91r8fwneEHZQO9_sV2LBLiMgt2DbMCC9IGF8rxa5-oYQaTpBmUPvC94eP9Ih8AFnfuqbeI')",
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-on-primary-fixed/70 to-on-primary-fixed/40"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest/20 backdrop-blur-md">
                  <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                    verified
                  </span>
                  <span className="font-label-sm text-label-sm text-surface-bright tracking-wide uppercase">
                    Trusted Delivery Hub
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary-fixed-dim font-mono">
                  v4.8 • SF BAY
                </span>
              </div>
              <div className="relative z-10 flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs text-primary-fixed">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                  <span className="font-label-md text-label-md text-inverse-on-surface ml-space-xs">
                    4.9/5 from 250k+ foodies
                  </span>
                </div>
                <h2 className="font-headline-xl text-headline-xl text-inverse-on-surface leading-tight">
                  Your next crave-worthy meal is minutes away.
                </h2>
                <p className="font-body-md text-body-md text-secondary-fixed-dim">
                  Save favorite kitchens, customize delivery instructions, and unlock instant
                  secret member flash drops.
                </p>
                <div className="pt-space-sm grid grid-cols-2 gap-space-md">
                  <div className="p-space-md rounded-lg bg-inverse-surface/60 backdrop-blur-md flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary-container text-[24px]">
                      timer
                    </span>
                    <div>
                      <p className="font-headline-sm text-headline-sm text-inverse-on-surface">
                        24 Min
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
                        Average ETA
                      </p>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-inverse-surface/60 backdrop-blur-md flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">
                      savings
                    </span>
                    <div>
                      <p className="font-headline-sm text-headline-sm text-inverse-on-surface">
                        $0 Fee
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
                        First 3 orders
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-space-sm text-secondary-fixed-dim pt-space-md">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">
                  End-to-End Encrypted Session
                </span>
              </div>
            </div>

            {/* Auth panel */}
            <div className="lg:col-span-7 p-space-md sm:p-space-xl lg:p-space-2xl flex flex-col justify-center">
              <div className="w-full max-w-[500px] mx-auto flex flex-col gap-space-lg">
                {/* Tabs */}
                <div className="bg-surface-container-low p-1.5 rounded-full flex items-center justify-between">
                  {[
                    ["login", "Log In", isLogin],
                    ["signup", "Sign Up / Register", !isLogin],
                  ].map(([mode, label, active]) => (
                    <button
                      key={mode}
                      type="button"
                      className={
                        active
                          ? "w-1/2 py-space-xs rounded-full font-label-lg text-label-lg transition-all duration-200 bg-surface-container-lowest text-primary-container shadow-[0_2px_8px_rgba(0,0,0,0.06)] font-bold"
                          : "w-1/2 py-space-xs rounded-full font-label-lg text-label-lg transition-all duration-200 text-on-surface-variant hover:text-on-surface"
                      }
                      onClick={() => go(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Headings */}
                <div className="flex flex-col gap-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    {isLogin ? "Welcome back to FoodOrder" : "Create your FoodOrder account"}
                  </h1>
                  <p className="font-body-md text-body-md text-secondary">
                    {isLogin
                      ? "Sign in to track orders, redeem coupons, and access quick checkout."
                      : "Unlock localized culinary gems, express checkout, and exclusive member vouchers."}
                  </p>
                </div>

                {/* Social (not wired to the API yet) */}
                <div className="flex items-center justify-center gap-space-md">
                  {SOCIAL.map(({ name, icon }) => (
                    <button
                      key={name}
                      type="button"
                      aria-label={`Continue with ${name}`}
                      title={`Continue with ${name}`}
                      className="w-12 h-12 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center transition-all"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-full h-px bg-surface-container-high"></div>
                  <span className="absolute px-space-md bg-surface-container-lowest font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    or enter details
                  </span>
                </div>

                {/* Form */}
                <form className="flex flex-col gap-space-md" onSubmit={handleSubmit} noValidate={false}>
                  {formError && (
                    <div className="bg-error-container text-on-error-container rounded-lg px-space-md py-space-sm font-body-sm text-body-sm">
                      {formError}
                    </div>
                  )}

                  {!isLogin && (
                    <>
                      <div className="flex flex-col gap-space-xs">
                        <label className="font-label-md text-label-md text-on-surface" htmlFor="input-name">
                          Full Name
                        </label>
                        <div className="relative flex items-center rounded-lg shadow-sm">
                          <span className="material-symbols-outlined absolute left-space-md text-secondary text-[20px]">
                            person
                          </span>
                          <input
                            className={inputCls}
                            id="input-name"
                            placeholder="Alex Morgan"
                            type="text"
                            required
                            value={form.name}
                            onChange={set("name")}
                          />
                        </div>
                        <FieldError msg={err("name")} />
                      </div>

                      <div className="flex flex-col gap-space-xs">
                        <div className="flex items-center justify-between">
                          <label className="font-label-md text-label-md text-on-surface" htmlFor="input-phone">
                            Mobile Phone
                          </label>
                          <span className="font-body-sm text-body-sm text-tertiary font-medium">
                            For delivery driver SMS updates
                          </span>
                        </div>
                        <div className="relative flex items-center rounded-lg shadow-sm">
                          <span className="material-symbols-outlined absolute left-space-md text-secondary text-[20px]">
                            smartphone
                          </span>
                          <input
                            className={inputCls}
                            id="input-phone"
                            placeholder="+1 (555) 000-8392"
                            type="tel"
                            value={form.phone}
                            onChange={set("phone")}
                          />
                        </div>
                        <FieldError msg={err("phone")} />
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="input-email">
                      Email Address
                    </label>
                    <div className="relative flex items-center rounded-lg shadow-sm">
                      <span className="material-symbols-outlined absolute left-space-md text-secondary text-[20px]">
                        alternate_email
                      </span>
                      <input
                        className={inputCls}
                        id="input-email"
                        placeholder="alex.morgan@domain.com"
                        required
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={set("email")}
                      />
                    </div>
                    <FieldError msg={err("email")} />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="input-password">
                        Password
                      </label>
                      {isLogin && (
                        <a
                          href="#"
                          className="font-label-md text-label-md text-primary-container hover:text-primary transition-colors"
                        >
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative flex items-center rounded-lg shadow-sm">
                      <span className="material-symbols-outlined absolute left-space-md text-secondary text-[20px]">
                        lock
                      </span>
                      <input
                        className={inputCls.replace("pr-space-md", "pr-12")}
                        id="input-password"
                        placeholder="••••••••••••"
                        required
                        minLength={isLogin ? undefined : 8}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-space-md text-secondary hover:text-on-surface flex items-center justify-center p-1"
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <FieldError msg={err("password")} />
                  </div>

                  {/* Confirm password (backend requires password_confirmation) */}
                  {!isLogin && (
                    <div className="flex flex-col gap-space-xs">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="input-password-confirm"
                      >
                        Confirm Password
                      </label>
                      <div className="relative flex items-center rounded-lg shadow-sm">
                        <span className="material-symbols-outlined absolute left-space-md text-secondary text-[20px]">
                          lock_reset
                        </span>
                        <input
                          className={inputCls}
                          id="input-password-confirm"
                          placeholder="••••••••••••"
                          required
                          autoComplete="new-password"
                          type={showPassword ? "text" : "password"}
                          value={form.password_confirmation}
                          onChange={set("password_confirmation")}
                        />
                      </div>
                      <FieldError msg={err("password_confirmation")} />
                    </div>
                  )}

                  {isLogin ? (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-space-xs cursor-pointer select-none">
                        <input
                          defaultChecked
                          className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-md text-body-md text-on-surface">
                          Keep me signed in on this device
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-space-xs pt-1">
                      <label className="flex items-start gap-space-xs cursor-pointer select-none">
                        <input
                          defaultChecked
                          className="w-4 h-4 mt-0.5 rounded accent-primary-container cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Receive exclusive secret coupons, local pop-up drops, and free delivery
                          perks.
                        </span>
                      </label>
                      <p className="font-body-sm text-body-sm text-secondary pl-6">
                        By creating an account, you agree to FoodOrder Terms of Service and Privacy
                        Policy.
                      </p>
                    </div>
                  )}

                  <button
                    className="w-full mt-space-sm bg-primary-container hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed text-on-primary font-label-lg text-label-lg py-space-md rounded-lg shadow-[0_6px_20px_rgba(249,115,22,0.32)] hover:shadow-[0_8px_24px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-space-sm"
                    type="submit"
                    disabled={busy}
                  >
                    <span>
                      {busy
                        ? isLogin
                          ? "Authenticating..."
                          : "Registering..."
                        : isLogin
                        ? "Log In to FoodOrder"
                        : "Create Free Account"}
                    </span>
                    <span
                      className={
                        "material-symbols-outlined text-[20px]" + (busy ? " animate-spin" : "")
                      }
                    >
                      {busy ? "sync" : "arrow_forward"}
                    </span>
                  </button>
                </form>

                {/* Trust strip */}
                <div className="pt-space-md bg-surface-container-low/70 rounded-xl p-space-md flex flex-col sm:flex-row items-center justify-around gap-space-md">
                  <div className="flex items-center gap-space-xs text-secondary">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">shield</span>
                    <span className="font-label-sm text-label-sm font-semibold">
                      256-bit Bank Grade Encryption
                    </span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-surface-container-high"></div>
                  <div className="flex items-center gap-space-xs text-secondary">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                      history
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">
                      Fast 1-Tap Re-ordering
                    </span>
                  </div>
                </div>

                {/* Switch */}
                <div className="text-center pt-space-xs">
                  <p className="font-body-md text-body-md text-secondary">
                    {isLogin ? (
                      <>
                        Don't have a FoodOrder account yet?{" "}
                        <button
                          type="button"
                          className="font-label-md text-label-md text-primary-container hover:text-primary font-bold ml-1 transition-colors"
                          onClick={() => go("signup")}
                        >
                          Create one now
                        </button>
                      </>
                    ) : (
                      <>
                        Already registered with us?{" "}
                        <button
                          type="button"
                          className="font-label-md text-label-md text-primary-container hover:text-primary font-bold ml-1 transition-colors"
                          onClick={() => go("login")}
                        >
                          Log In here
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthPage;