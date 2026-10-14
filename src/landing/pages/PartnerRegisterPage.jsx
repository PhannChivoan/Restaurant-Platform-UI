import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Config } from "../../utils/config";
import { setAccessToken, setProfile } from "../../store/access_token";
import LocationPickerModal from "../components/LocationPickerModal";
import usePlatformRate from "../hooks/usePlatformRate";
import { fetchPublicCategories } from "../api/publicApi";


const STEPS = [
  { title: "Fees & privacy", short: "Policy" },
  { title: "Your account", short: "Account" },
  { title: "Your restaurant", short: "Restaurant" },
];

// big, comfortable fields and buttons
const input =
  "w-full h-14 px-space-lg bg-white border border-outline-variant rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:shadow-[0_0_0_3px_rgba(249,115,22,0.18)] transition";
const textarea = input.replace("h-14", "py-3");
const btnPrimary =
  "h-14 px-space-xl rounded-xl bg-primary-container hover:bg-primary disabled:opacity-50 disabled:hover:bg-primary-container text-on-primary font-label-lg text-label-lg text-[16px] font-bold shadow-md transition-colors flex items-center justify-center gap-2";
const btnGhost =
  "h-14 px-space-xl rounded-xl border border-outline-variant hover:bg-surface-container-low text-on-surface font-label-lg text-label-lg text-[16px] font-bold transition-colors";

// Which wizard page each server-side field belongs to (to send the owner back to the right page on an error).
const STEP_OF = { owner_name: 1, email: 1, phone: 1, password: 1, password_confirmation: 1, restaurant_name: 2, category_id: 2, description: 2, address: 2 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Business sign-up as a clean white page, one short step at a time:
//   1) fees & privacy  ->  2) owner account  ->  3) restaurant + location  ->  signed in to the dashboard
// A loading bar runs left to right along the top while a step is being processed.
const PartnerRegisterPage = () => {
  const navigate = useNavigate();
  const rate = usePlatformRate();
  const rateText = rate === null ? "…" : `${rate}%`;

  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [f, setF] = useState({
    owner_name: "", email: "", phone: "", password: "", password_confirmation: "",
    restaurant_name: "", category_id: "", description: "",
  });
  const [categories, setCategories] = useState([]); // managed by the platform admin

  useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);
  const [place, setPlace] = useState(null); // { address, city, postal_code, lat, lng }
  const [mapOpen, setMapOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false); // true = top loading bar running
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const err = (k) => (errors[k] ? <p className="font-body-md text-body-md text-error mt-1.5">{errors[k]}</p> : null);

  const next = async () => {
    if (busy) return;
    const e = {};
    if (step === 1) {
      if (!f.owner_name.trim()) e.owner_name = "Enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email address.";
      if (!f.phone.trim()) e.phone = "Enter your phone number.";
      if (f.password.length < 8) e.password = "Use at least 8 characters.";
      if (f.password !== f.password_confirmation) e.password_confirmation = "Passwords do not match.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (step === 1) {
        // real check: is the email already registered?
        const res = await fetch(`${Config.BASE_URL}partner/email-available?email=${encodeURIComponent(f.email)}`, { headers: { Accept: "application/json" } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.available === false) {
          setErrors({ email: "This email already has an account. Sign in instead." });
          return;
        }
        await wait(300);
      } else {
        await wait(550);
      }
      setStep((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    const e = {};
    if (!f.restaurant_name.trim()) e.restaurant_name = "Enter your restaurant's name.";
    if (!f.category_id) e.category_id = "Choose a category so customers can find you.";
    if (!place) e.address = "Pick your restaurant's location on the map.";
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await fetch(Config.BASE_URL + "partner/register", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, address: place.address, city: place.city || undefined, latitude: place.lat, longitude: place.lng, accept_terms: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fe = data.errors || {};
        const mapped = Object.fromEntries(Object.entries(fe).map(([k, v]) => [k === "latitude" || k === "longitude" ? "address" : k, v[0]]));
        setErrors(mapped);
        const first = Object.keys(mapped).map((k) => STEP_OF[k]).filter(Boolean);
        if (first.length) setStep(Math.min(...first));
        else setFormError(data.message || "We couldn't register your restaurant. Please try again.");
        return;
      }
      // sign the owner in to the admin dashboard (same keys the admin login uses)
      setAccessToken(data.token);
      setProfile(data.user);
      setDone(true);
      setTimeout(() => window.location.assign("/admin"), 2200);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const running = busy || done;

  return (
    <main className="w-full pt-20 bg-white">
      <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-margin py-space-2xl">
        {/* loading bar along the top of the white page */}
        <div className={`absolute top-0 left-0 right-0 h-1 overflow-hidden bg-primary-container/15 transition-opacity ${running ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
          <div className="h-full w-[30%] bg-primary-container rounded-full animate-[loadbar_1.1s_ease-in-out_infinite]" />
        </div>

        <div className="w-full max-w-[34rem]">
          {done ? (
            <div className="flex flex-col items-center text-center gap-space-md py-space-xl animate-[fadeIn_.3s_ease]">
              <span className="material-symbols-outlined text-tertiary text-[84px]">check_circle</span>
              <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface">You&apos;re all set!</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                Taking you to your partner dashboard. Set up your menu now. Customers can order as soon as our team verifies your restaurant.
              </p>
            </div>
          ) : (
            <>
              {/* step indicator */}
              <ol className="flex items-center justify-between mb-space-xl" aria-label="Progress">
                {STEPS.map((s, i) => (
                  <li key={s.short} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-label-lg text-label-lg font-bold transition-colors ${
                          i < step ? "bg-tertiary text-white" : i === step ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-secondary"
                        }`}
                      >
                        {i < step ? <span className="material-symbols-outlined text-[20px]">check</span> : i + 1}
                      </span>
                      <span className={`hidden sm:inline font-label-md text-label-md ${i === step ? "text-on-surface font-bold" : "text-secondary"}`}>{s.short}</span>
                    </div>
                    {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 mx-3 rounded ${i < step ? "bg-tertiary" : "bg-surface-container-high"}`} />}
                  </li>
                ))}
              </ol>

              <div key={step} className="flex flex-col gap-space-lg animate-[fadeIn_.3s_ease]">
                <div>
                  <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">{STEPS[step].title}</h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                    {step === 0 && "A quick read before you start. Joining is free."}
                    {step === 1 && "This is how you'll sign in to your dashboard."}
                    {step === 2 && "What customers will see, and where you are."}
                  </p>
                </div>

                {step === 0 && (
                  <>
                    <div className="rounded-2xl bg-primary-container/10 p-space-lg flex flex-col gap-1">
                      <p className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-container">payments</span> No subscription. Just a commission.
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant">
                        Joining and using the dashboard is free. For every customer order we deduct <strong className="text-on-surface">{rateText}</strong> of the food
                        subtotal. The rest is your payout.
                      </p>
                    </div>
                    <ul className="flex flex-col gap-space-md font-body-lg text-body-lg text-on-surface-variant">
                      {[
                        "The commission rate is recorded when you sign up, and each order keeps the amounts it was calculated with.",
                        "Our team verifies your restaurant before customers can order. You can set up your menu in the meantime.",
                        "We store your business, contact, menu and sales data to run the service. We never sell personal data.",
                        "Drivers and customers only see the details they need to deliver and receive an order.",
                      ].map((t) => (
                        <li key={t} className="flex gap-3">
                          <span className="material-symbols-outlined text-tertiary text-[24px] shrink-0">check_circle</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/privacy#partner-fees" target="_blank" className="font-label-lg text-label-lg font-bold text-primary hover:underline self-start">
                      Read the full fees and privacy policy →
                    </Link>
                    <label className="flex items-start gap-space-md cursor-pointer rounded-2xl border border-outline-variant p-space-lg hover:bg-surface-container-low transition-colors">
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-primary-container w-6 h-6 mt-0.5 shrink-0" />
                      <span className="font-body-lg text-body-lg text-on-surface">I have read and agree to the fees ({rateText} per order, no subscription) and the privacy policy.</span>
                    </label>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <input className={input} placeholder="Your full name" autoComplete="name" value={f.owner_name} onChange={set("owner_name")} autoFocus />
                      {err("owner_name")}
                    </div>
                    <div>
                      <input className={input} type="email" placeholder="Email address" autoComplete="email" value={f.email} onChange={set("email")} />
                      {err("email")}
                    </div>
                    <div>
                      <input className={input} type="tel" placeholder="Phone number" autoComplete="tel" value={f.phone} onChange={set("phone")} />
                      {err("phone")}
                    </div>
                    <div>
                      <input className={input} type="password" placeholder="Password (8+ characters)" autoComplete="new-password" value={f.password} onChange={set("password")} />
                      {err("password")}
                    </div>
                    <div>
                      <input className={input} type="password" placeholder="Confirm password" autoComplete="new-password" value={f.password_confirmation} onChange={set("password_confirmation")} />
                      {err("password_confirmation")}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <input className={input} placeholder="Restaurant name" value={f.restaurant_name} onChange={set("restaurant_name")} autoFocus />
                      {err("restaurant_name")}
                    </div>
                    <div>
                      <select className={input} value={f.category_id} onChange={set("category_id")}>
                        <option value="">Choose a category…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {err("category_id")}
                    </div>
                    <textarea className={textarea} rows={3} placeholder="Short description (optional)" value={f.description} onChange={set("description")} />
                    {place ? (
                      <div className="flex items-start justify-between gap-space-md rounded-xl border border-outline-variant p-space-lg">
                        <p className="font-body-lg text-body-lg text-on-surface">
                          <span className="material-symbols-outlined text-primary-container text-[22px] align-middle mr-1">location_on</span>
                          {place.address}
                        </p>
                        <button type="button" onClick={() => setMapOpen(true)} className="font-label-lg text-label-lg font-bold text-primary shrink-0">
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMapOpen(true)}
                        className="w-full h-14 rounded-xl border-2 border-dashed border-primary-container text-primary font-label-lg text-label-lg text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-primary-container/10 transition-colors"
                      >
                        <span className="material-symbols-outlined">add_location_alt</span> Pick location on map
                      </button>
                    )}
                    {err("address")}
                    {formError && <p className="font-body-md text-body-md text-error bg-error-container/40 rounded-xl px-space-md py-space-sm">{formError}</p>}
                  </>
                )}

                {/* buttons */}
                <div className="flex gap-space-md pt-space-sm">
                  {step === 0 ? (
                    <button type="button" onClick={() => navigate("/partner")} className={btnGhost}>
                      Cancel
                    </button>
                  ) : (
                    <button type="button" onClick={() => setStep((s) => s - 1)} disabled={busy} className={`${btnGhost} disabled:opacity-50`}>
                      Back
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} disabled={busy || (step === 0 && !agreed)} className={`${btnPrimary} flex-1`}>
                      Next
                    </button>
                  ) : (
                    <button type="button" onClick={submit} disabled={busy} className={`${btnPrimary} flex-1`}>
                      Register
                    </button>
                  )}
                </div>

                {step === 0 && (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center">
                    Already registered? <a href="/admin/login" className="text-primary font-bold hover:underline">Sign in to the dashboard</a>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {mapOpen && (
        <LocationPickerModal
          title="Where is your restaurant?"
          initial={place}
          onClose={() => setMapOpen(false)}
          onPick={(p) => {
            setPlace(p);
            setErrors((x) => ({ ...x, address: undefined }));
            setMapOpen(false);
          }}
        />
      )}
    </main>
  );
};

export default PartnerRegisterPage;