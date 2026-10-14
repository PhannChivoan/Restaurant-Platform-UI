import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../utils/request";
import { setAccessToken, setProfile } from "../store/access_token";

const palette = {
  ink: "#14181A",
  inkSoft: "#1D2225",
  paper: "#EEF0EC",
  paperLine: "#D8DAD3",
  amber: "#C98A2C",
  amberLight: "#E4B65B",
  teal: "#3F6B62",
  tealLight: "#6B9C90",
  rust: "#B5573C",
  textOnPaper: "#20241F",
  textMutedPaper: "#5B615A",
  textOnInk: "#EEF0EC",
  textMutedInk: "#9AA39B",
};

const serif =
  '"Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif';
const sans =
  'ui-sans-serif, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

function BranchingLines() {
  // Mirror of the login page's converging-lines mark, run in reverse:
  // one point branching out into many, for "starting" a workspace.
  const ends = [40, 90, 140, 195, 250, 300];
  const colors = [
    palette.tealLight,
    palette.amberLight,
    palette.tealLight,
    palette.textMutedInk,
    palette.amberLight,
    palette.tealLight,
  ];
  return (
    <svg
      viewBox="0 0 420 320"
      className="w-full h-full"
      role="img"
      aria-label="Illustration of a single point branching into several lines"
    >
      {ends.map((y, i) => (
        <path
          key={i}
          d={`M 48 168 C 200 170, 260 ${y}, 400 ${y}`}
          fill="none"
          stroke={colors[i]}
          strokeWidth={i === 4 ? 2 : 1}
          opacity={0.5 + (i % 2) * 0.15}
        />
      ))}
      {ends.map((y, i) => (
        <circle
          key={`c-${i}`}
          cx="400"
          cy={y}
          r="2.5"
          fill={colors[i]}
          opacity={0.7}
        />
      ))}
      <circle cx="48" cy="168" r="5" fill={palette.amberLight} />
      <circle
        cx="48"
        cy="168"
        r="9"
        fill="none"
        stroke={palette.amberLight}
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

function fieldBorder(hasError) {
  return hasError ? palette.rust : palette.paperLine;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("bike");
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success

  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0-4
  })();

  const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][
    passwordStrength
  ];
  const strengthColor = [
    palette.rust,
    palette.rust,
    palette.amber,
    palette.teal,
    palette.teal,
  ][passwordStrength];

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Tell us your name.";
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "That email address doesn't look right.";
    if (!phone.trim()) next.phone = "Enter your phone number so customers can reach you.";
    if (!password) next.password = "Choose a password.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords don't match.";
    if (!agreed) next.agreed = "You need to accept the terms to continue.";
    return next;
  };

  // Registers a driver (role "rider" + driver profile) and signs them in to the dashboard.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length > 0) return;
    setStatus("loading");
    const res = await request("rider/register", "POST", {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      password_confirmation: confirmPassword,
      vehicle_type: vehicle,
    });
    if (!res?.token) {
      const fe = res?.errors || {};
      setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(fe).map(([k, v]) => [k === "password_confirmation" ? "confirmPassword" : k, v[0]])) }));
      setServerError(Object.keys(fe).length ? "" : res?.message || "We couldn't create your account. Please try again.");
      setStatus("idle");
      return;
    }
    setAccessToken(res.token);
    setProfile(res.user);
    setStatus("success");
    setTimeout(() => navigate("/driver"), 900);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row"
      style={{ fontFamily: sans }}
    >
      {/* Left: illustration panel (swapped side from login, so the pair reads as a matched set) */}
      <div
        className="hidden md:flex flex-1 flex-col justify-between p-12 relative"
        style={{ backgroundColor: palette.ink }}
      >
        <div
          className="text-lg tracking-tight"
          style={{ fontFamily: serif, color: palette.textOnInk }}
        >
          Northbound
        </div>
        <div className="w-full h-72 -mx-4">
          <BranchingLines />
        </div>
        <div>
          <p
            className="text-xl leading-snug mb-4 max-w-sm"
            style={{ fontFamily: serif, color: palette.textOnInk }}
          >
            Every workspace starts from one clear number.
          </p>
          <p className="text-sm" style={{ color: palette.textMutedInk }}>
            Set yours up in under two minutes.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-16 md:py-8"
        style={{ backgroundColor: palette.paper }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-10 md:hidden">
            <div
              className="text-lg tracking-tight"
              style={{ fontFamily: serif, color: palette.textOnPaper }}
            >
              Northbound
            </div>
          </div>

          <h1
            className="text-3xl leading-tight mb-2"
            style={{ fontFamily: serif, color: palette.textOnPaper }}
          >
            Create your driver account
          </h1>
          <p className="text-sm mb-8" style={{ color: palette.textMutedPaper }}>
            Deliver orders with us. Running a restaurant instead?{" "}
            <a href="/partner/register" className="underline underline-offset-2" style={{ color: palette.teal }}>
              Register your business
            </a>
          </p>

          {status === "success" ? (
            <div
              className="rounded-sm p-4 text-sm"
              style={{
                backgroundColor: "#E4E9DE",
                color: palette.textOnPaper,
                border: `1px solid ${palette.paperLine}`,
              }}
            >
              Your account is ready. Taking you to your workspace…
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {serverError && (
                <div className="mb-5 rounded-sm p-3 text-sm" style={{ backgroundColor: "#F6E3DC", color: palette.rust }}>
                  {serverError}
                </div>
              )}
              <div className="mb-5">
                <label
                  htmlFor="name"
                  className="block text-sm mb-1.5"
                  style={{ color: palette.textOnPaper }}
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jamie Rivera"
                  className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${fieldBorder(errors.name)}`,
                    color: palette.textOnPaper,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = palette.teal)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldBorder(errors.name))
                  }
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-sm mb-1.5"
                  style={{ color: palette.textOnPaper }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${fieldBorder(errors.email)}`,
                    color: palette.textOnPaper,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = palette.teal)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldBorder(errors.email))
                  }
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="phone" className="block text-sm mb-1.5" style={{ color: palette.textOnPaper }}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 345 678"
                  className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
                  style={{ backgroundColor: "#FFFFFF", border: `1px solid ${fieldBorder(errors.phone)}`, color: palette.textOnPaper }}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label htmlFor="vehicle" className="block text-sm mb-1.5" style={{ color: palette.textOnPaper }}>
                  Your vehicle
                </label>
                <select
                  id="vehicle"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-sm outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: `1px solid ${palette.paperLine}`, color: palette.textOnPaper }}
                >
                  <option value="bike">Bicycle / bike</option>
                  <option value="scooter">Scooter / motorbike</option>
                  <option value="car">Car</option>
                </select>
              </div>
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="block text-sm mb-1.5"
                  style={{ color: palette.textOnPaper }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2.5 pr-16 text-sm rounded-sm outline-none transition-colors"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${fieldBorder(errors.password)}`,
                      color: palette.textOnPaper,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = palette.teal)}
                    onBlur={(e) =>
                      (e.target.style.borderColor = fieldBorder(
                        errors.password,
                      ))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1"
                    style={{ color: palette.textMutedPaper }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password && !errors.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div
                      className="flex-1 h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: palette.paperLine }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: strengthColor,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: palette.textMutedPaper }}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm mb-1.5"
                  style={{ color: palette.textOnPaper }}
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type your password again"
                  className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${fieldBorder(errors.confirmPassword)}`,
                    color: palette.textOnPaper,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = palette.teal)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldBorder(
                      errors.confirmPassword,
                    ))
                  }
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="mb-7">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5"
                    style={{ accentColor: palette.teal }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: palette.textMutedPaper }}
                  >
                    I agree to the{" "}
                    <a
                      href="#terms"
                      className="underline underline-offset-2"
                      style={{ color: palette.teal }}
                    >
                      terms of service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#privacy"
                      className="underline underline-offset-2"
                      style={{ color: palette.teal }}
                    >
                      privacy policy
                    </a>
                  </span>
                </label>
                {errors.agreed && (
                  <p className="mt-1.5 text-xs" style={{ color: palette.rust }}>
                    {errors.agreed}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-2.5 rounded-sm text-sm font-medium transition-opacity"
                style={{
                  backgroundColor: palette.ink,
                  color: palette.textOnInk,
                  opacity: status === "loading" ? 0.7 : 1,
                }}
              >
                {status === "loading"
                  ? "Creating your account…" : "Create driver account"}
              </button>
            </form>
          )}

          <p className="mt-8 text-sm" style={{ color: palette.textMutedPaper }}>
            Already have an account?{" "}
            <a
              href="/admin/login"
              className="underline underline-offset-2"
              style={{ color: palette.teal }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
