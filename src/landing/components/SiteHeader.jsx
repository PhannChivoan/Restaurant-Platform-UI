import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AddressSelector from "./AddressSelector";
import NotificationBell from "./NotificationBell";
import { Config } from "../../utils/config";
import "../mobile-nav.css";
import { LANGS, useI18n } from "../i18n";
import { platformLogo, platformName } from "../../utils/platformSettings";

const API_URL = Config.BASE_URL.replace(/\/+$/, "");

// Keys we check for the token. Add yours here if your login uses a different one.
const TOKEN_KEYS = ["token", "access_token", "auth_token"];

const readToken = () => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const clearToken = () => {
  TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const ACTIVE_NAV = "transition-colors text-primary-container font-bold";
const INACTIVE_NAV =
  "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors";

const MENU_ITEM =
  "flex w-full items-center gap-space-sm px-space-md py-space-sm font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors text-left";

const getActiveKey = (pathname) => {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/orders")) return "my-orders";
  if (pathname.startsWith("/order")) return "order";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/about-us")) return "about-us";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
};

const SiteHeader = () => {
  const { t, lang, setLang } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const active = getActiveKey(pathname);

  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // hamburger menu (phones and tablets)
  const menuRef = useRef(null);
  const isLoggedIn = !!token;

  const syncToken = useCallback(() => setToken(readToken()), []);

  // 1) Re-check on every route change (login -> navigate("/") updates instantly)
  useEffect(() => {
    syncToken();
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname, syncToken]);

  // 2) Re-check on custom event (same tab) and storage event (other tabs)
  useEffect(() => {
    window.addEventListener("auth-changed", syncToken);
    window.addEventListener("storage", syncToken);
    window.addEventListener("focus", syncToken);
    return () => {
      window.removeEventListener("auth-changed", syncToken);
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("focus", syncToken);
    };
  }, [syncToken]);

  // Load the user for the avatar initial; clear stale tokens on 401
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((res) => {
        if (res.status === 401) {
          clearToken();
          window.dispatchEvent(new Event("auth-changed"));
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (!cancelled && data) setUser(data.data || data.user || data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const currentToken = token;
    // Update the UI immediately, then tell the server
    clearToken();
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}`, Accept: "application/json" },
      });
    } catch (e) {
      // ignore network errors; the local session is already cleared
    }
  };

  // bottom tab bar (phones / tablets): four main tabs plus a "More" sheet
  const tabs = [
    ["home", "/", t("nav.home", "Home"), "home"],
    ["order", "/order", t("nav.order", "Order"), "restaurant"],
    ["services", "/services", t("nav.services", "Services"), "room_service"],
    isLoggedIn
      ? ["my-orders", "/orders", t("nav.orders", "Orders"), "receipt_long"]
      : ["contact", "/contact", t("nav.contact", "Contact"), "mail"],
  ];
  const moreLinks = [
    ["about-us", "/about-us", t("nav.about", "About Us"), "info"],
    ...(isLoggedIn ? [["contact", "/contact", t("nav.contact", "Contact"), "mail"]] : []),
    ["partner", "/partner", t("nav.partner", "Partner with us"), "handshake"],
  ];
  const [moreClosing, setMoreClosing] = useState(false);
  const closeMore = () => {
    setMoreClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setMoreClosing(false);
    }, 160);
  };
  const moreActive = moreLinks.some(([key]) => key === active);

  const displayName = user?.name || user?.full_name || user?.email || "Account";
  // Only compute an initial once the real user has loaded (avoids a flash of "A" from "Account")
  const initial = user ? displayName.trim().charAt(0).toUpperCase() : null;
  const avatarSrc = user?.avatar_url || user?.avatar;

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[1280px] mx-auto px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-sm lg:gap-space-lg">
          <Link to="/" className="flex items-center gap-space-sm">
            {/* the logo comes from Platform Settings when one is uploaded */}
            {platformLogo() ? (
              <img
                alt={`${platformName()} logo`}
                className="h-8 w-auto object-contain"
                src={platformLogo()}
              />
            ) : (
              <img
                alt="FoodOrder Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc0svmMLOnM5DwPaZ31H6ZhB5YIhlaIbwDYQmcWGZatdBoMPiczItKnnwYP4Kc0q0OBhQtguUmM2axWG_eZgXlX5x68Uq_cmPy3cLSYNrx8DbLgYoYA5V42IZNweIOwNO-9NrUl_wco0wTGdvMFdOjhf7Xj914jFBT1g-E3BcHymQPosIpjeT4lEL0GgY-3AquMLZK-z9l_CymYpgWyQDifZn5DdRtg0IpTYxgs_wW"
              />
            )}
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              {platformName()}
            </span>
          </Link>
          <div className="hidden xl:block">
            <AddressSelector compact />
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-space-lg">
          <Link
            to="/"
            className={active === "home" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "home" ? "page" : undefined}
          >
            {t("nav.home", "Home")}
          </Link>
          <Link
            to="/order"
            className={active === "order" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "order" ? "page" : undefined}
          >
            {t("nav.order", "Order")}
          </Link>
          <Link
            to="/services"
            className={active === "services" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "services" ? "page" : undefined}
          >
            {t("nav.services", "Services")}
          </Link>
          <Link
            to="/about-us"
            className={active === "about-us" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "about-us" ? "page" : undefined}
          >
            {t("nav.about", "About Us")}
          </Link>
          <Link
            to="/contact"
            className={active === "contact" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "contact" ? "page" : undefined}
          >
            {t("nav.contact", "Contact")}
          </Link>
          <span className="flex items-center gap-1 rounded-full bg-surface-container-low p-0.5" role="group" aria-label={t("lang.label", "Language")}>
            {LANGS.map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold ${lang === code ? "bg-primary-container text-on-primary" : "text-on-surface-variant"}`}
              >
                {label}
              </button>
            ))}
          </span>
        </nav>

        {isLoggedIn ? (
          <div className="flex items-center gap-space-md">
            {isHome && (
              <Link
                to="/partner"
                className="hidden sm:inline-flex items-center font-label-md text-label-md text-on-surface hover:text-primary transition-colors"
              >
                Partner with us
              </Link>
            )}

            <NotificationBell />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:bg-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : initial ? (
                  initial
                ) : (
                  <span className="material-symbols-outlined text-[22px]">person</span>
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-space-sm w-56 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                >
                  <div className="px-space-md py-space-sm border-b border-black/5">
                    <p className="font-label-lg text-label-lg text-on-surface truncate">
                      {displayName}
                    </p>
                    {user?.email && user.email !== displayName && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <Link to="/orders" role="menuitem" className={MENU_ITEM}>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      receipt_long
                    </span>
                    My orders
                  </Link>
                  <Link to="/profile" role="menuitem" className={MENU_ITEM}>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      person
                    </span>
                    Profile
                  </Link>
                  <Link to="/settings" role="menuitem" className={MENU_ITEM}>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      settings
                    </span>
                    Settings
                  </Link>

                  <div className="border-t border-black/5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={MENU_ITEM}
                    >
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                        logout
                      </span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isHome ? (
          <div className="flex items-center gap-space-md">
            <Link
              to="/partner"
              className="hidden sm:inline-flex items-center font-label-md text-label-md text-on-surface hover:text-primary transition-colors"
            >
              Partner with us
            </Link>
            <Link
              to="/login"
              className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors px-space-xs"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-lg py-space-sm rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all"
            >
              <span className="">Sign Up</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            <Link
              to="/login"
              className="font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors px-space-sm py-space-xs"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-md sm:px-space-lg py-space-xs sm:py-space-sm rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

    </header>

      {/* Phones and tablets: app-style bottom tab bar */}
      <nav
        aria-label="Main navigation"
        className="app-tabbar fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        {tabs.map(([key, to, label, icon]) => (
          <Link
            key={key}
            to={to}
            aria-current={active === key ? "page" : undefined}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              active === key ? "text-primary-container font-bold" : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={active === key ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="truncate max-w-full">{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => (mobileOpen ? closeMore() : setMobileOpen(true))}
          aria-haspopup="dialog"
          className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 text-[11px] ${
            moreActive ? "text-primary-container font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">grid_view</span>
          <span>{t("nav.more", "More")}</span>
        </button>
      </nav>

      {mobileOpen && (
        <div className={`app-more-layer${moreClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="More">
          <button type="button" aria-label="Close" className="app-more-backdrop" onClick={closeMore} />
          <div className="app-more-panel">
            <div className="grid grid-cols-3 gap-space-sm">
              {moreLinks.map(([key, to, label, icon]) => (
                <Link
                  key={key}
                  to={to}
                  onClick={closeMore}
                  className={`flex flex-col items-center gap-1 rounded-xl border border-black/5 bg-surface-container-low px-2 py-space-sm text-center text-[12px] ${
                    active === key ? "text-primary-container font-bold" : "text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[26px]">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between pt-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant">{t("lang.label", "Language")}</span>
              <span className="flex items-center gap-1 rounded-full bg-surface-container-low p-0.5">
                {LANGS.map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold ${lang === code ? "bg-primary-container text-on-primary" : "text-on-surface-variant"}`}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SiteHeader;