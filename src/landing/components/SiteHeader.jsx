import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AddressSelector from "./AddressSelector";
import NotificationBell from "./NotificationBell";
import { Config } from "../../utils/config";

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
  if (pathname.startsWith("/order")) return "order";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/about-us")) return "about-us";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
};

const SiteHeader = () => {
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

  const displayName = user?.name || user?.full_name || user?.email || "Account";
  // Only compute an initial once the real user has loaded (avoids a flash of "A" from "Account")
  const initial = user ? displayName.trim().charAt(0).toUpperCase() : null;
  const avatarSrc = user?.avatar_url || user?.avatar;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[1280px] mx-auto px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-sm lg:gap-space-lg">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[26px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
          <Link to="/" className="flex items-center gap-space-sm">
            <img
              alt="FoodOrder Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc0svmMLOnM5DwPaZ31H6ZhB5YIhlaIbwDYQmcWGZatdBoMPiczItKnnwYP4Kc0q0OBhQtguUmM2axWG_eZgXlX5x68Uq_cmPy3cLSYNrx8DbLgYoYA5V42IZNweIOwNO-9NrUl_wco0wTGdvMFdOjhf7Xj914jFBT1g-E3BcHymQPosIpjeT4lEL0GgY-3AquMLZK-z9l_CymYpgWyQDifZn5DdRtg0IpTYxgs_wW"
            />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              FoodOrder
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
            Home
          </Link>
          <Link
            to="/order"
            className={active === "order" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "order" ? "page" : undefined}
          >
            Order
          </Link>
          <Link
            to="/services"
            className={active === "services" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "services" ? "page" : undefined}
          >
            Services
          </Link>
          <Link
            to="/about-us"
            className={active === "about-us" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "about-us" ? "page" : undefined}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className={active === "contact" ? ACTIVE_NAV : INACTIVE_NAV}
            aria-current={active === "contact" ? "page" : undefined}
          >
            Contact
          </Link>
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

      {/* Mobile / tablet menu */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="lg:hidden border-t border-black/5 bg-surface-container-lowest shadow-[0_12px_24px_rgba(0,0,0,0.08)] max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          <div className="max-w-[1280px] mx-auto px-margin py-space-sm flex flex-col">
            {[
              ["home", "/", "Home", "home"],
              ["order", "/order", "Order", "restaurant"],
              ["services", "/services", "Services", "room_service"],
              ["about-us", "/about-us", "About Us", "info"],
              ["contact", "/contact", "Contact", "mail"],
            ].map(([key, to, label, icon]) => (
              <Link
                key={key}
                to={to}
                onClick={() => setMobileOpen(false)}
                aria-current={active === key ? "page" : undefined}
                className={`flex items-center gap-space-sm py-space-sm font-label-lg text-label-lg border-b border-black/5 ${
                  active === key ? "text-primary-container font-bold" : "text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                {label}
              </Link>
            ))}
            <Link
              to="/partner"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-space-sm py-space-sm font-label-lg text-label-lg text-on-surface border-b border-black/5"
            >
              <span className="material-symbols-outlined text-[22px]">handshake</span>
              Partner with us
            </Link>
            {isLoggedIn && (
              <Link
                to="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-space-sm py-space-sm font-label-lg text-label-lg text-on-surface border-b border-black/5"
              >
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                My orders
              </Link>
            )}
            {/* the delivery address picker is hidden in the top bar on small screens */}
            <div className="py-space-sm xl:hidden">
              <AddressSelector compact />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default SiteHeader;