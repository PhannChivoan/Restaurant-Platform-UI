import { Config } from "../../utils/config";
import { getCustomerToken } from "./publicApi";

// Carts live in the database. A signed-in customer is identified by the login token; a guest by an
// anonymous id (only this random id is kept in the browser, never the cart itself).
const GUEST_KEY = "guest_cart_token";

const newGuestToken = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-guest-cart`).slice(0, 64);

export const getGuestToken = ({ create = true } = {}) => {
  try {
    let t = localStorage.getItem(GUEST_KEY);
    if (!t && create) {
      t = newGuestToken();
      localStorage.setItem(GUEST_KEY, t);
    }
    return t;
  } catch {
    return null;
  }
};

export const clearGuestToken = () => {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
};

export const cartRequest = async (path, method = "GET", body) => {
  const token = getCustomerToken();
  const guest = token ? null : getGuestToken();
  const res = await fetch(Config.BASE_URL + path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(guest ? { "X-Guest-Token": guest } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      data.message || (data.errors && Object.values(data.errors).flat()[0]) || "Request failed",
    );
    err.status = res.status;
    err.fieldErrors = data.errors || {};
    throw err;
  }
  return data;
};