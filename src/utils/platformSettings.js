import { request } from "./request";
import { Config } from "./config";

/*
 * Live platform settings (name, branding, currency, maintenance flag, payment
 * methods) served by GET /public/config. Loaded once per session and kept in a
 * module-level store so any screen can read it synchronously after boot.
 */

const DEFAULTS = {
  platform_name: "FoodOrder Platform",
  support_email: "",
  currency: "USD",
  exchange_rate: 4100, // riel per US dollar (prices are stored in dollars)
  timezone: "Asia/Phnom_Penh",
  brand_logo: null,
  brand_favicon: null,
  maintenance_mode: false,
  cash_on_delivery: true,
  payment_provider: "cod",
  payment_methods: ["cash"],
  commission_rate: 12,
  default_prep_time_minutes: 30,
  auto_accept_orders: true,
};

// the platform works in US dollars or Cambodian riel only (what ABA PayWay can charge)
const CURRENCY_SYMBOLS = {
  USD: "$",
  KHR: "៛",
};

let config = { ...DEFAULTS };
let loaded = false;
let pending = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn(config));

/** Applies branding that belongs to the document itself. */
const applyBranding = () => {
  if (typeof document === "undefined") return;

  if (config.platform_name) {
    document.title = `${config.platform_name} — Admin`;
  }

  if (config.brand_favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = config.brand_favicon;
  }
};

export const getPlatformConfig = () => config;

export const isPlatformLoaded = () => loaded;

export const subscribePlatform = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Fetches the settings once; later calls resolve with the cached copy. */
export const loadPlatformConfig = async ({ force = false } = {}) => {
  if (loaded && !force) return config;
  if (pending && !force) return pending;

  pending = (async () => {
    try {
      const res = await request("public/config", "GET", undefined, { fresh: force });
      if (res?.config) {
        config = { ...DEFAULTS, ...res.config };
        applyBranding();
        notify();
      }
    } catch {
      /* keep the defaults: the screens must still render */
    } finally {
      loaded = true;
      pending = null;
    }
    return config;
  })();

  return pending;
};

/** Called right after saving settings so the rest of the app sees them at once. */
export const applyPlatformConfig = (next) => {
  config = { ...config, ...next };
  applyBranding();
  notify();
};

export const platformName = () => config.platform_name || DEFAULTS.platform_name;

export const currencySymbol = () => CURRENCY_SYMBOLS[config.currency] || "$";

/**
 * A price (stored in US dollars) as shown to people: "$4.50", or in riel "៛18,500" (rate from Platform Settings,
 * rounded to the nearest 100 riel as shops do).
 */
export const formatMoney = (amount) => {
  const value = Number(amount || 0);

  if (config.currency === "KHR") {
    const rate = Number(config.exchange_rate) || DEFAULTS.exchange_rate;
    const riel = Math.round((value * rate) / 100) * 100;
    return `${currencySymbol()}${riel.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  return `${currencySymbol()}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Short label for chart axes: "$1.2k", or in riel "៛4.9M". */
export const compactMoney = (amount) => {
  const value = Number(amount || 0);

  if (config.currency === "KHR") {
    const riel = value * (Number(config.exchange_rate) || DEFAULTS.exchange_rate);
    return `${currencySymbol()}${(riel / 1_000_000).toFixed(1)}M`;
  }

  return `${currencySymbol()}${(value / 1000).toFixed(1)}k`;
};

export const isMaintenanceMode = () => Boolean(config.maintenance_mode);

/** Payment methods the platform currently allows, from the payments settings. */
export const allowedPaymentMethods = () =>
  Array.isArray(config.payment_methods) && config.payment_methods.length
    ? config.payment_methods
    : DEFAULTS.payment_methods;

export const platformAssetUrl = (path) => {
  if (!path) return path;
  if (/^(https?:\/\/|blob:|data:)/.test(path)) return path;
  const origin = Config.BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const platformLogo = () => platformAssetUrl(config.brand_logo);