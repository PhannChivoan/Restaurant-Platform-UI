import { Config } from "../../utils/config";

// Public (no login) storefront endpoints. Plain fetch on purpose: the admin
// `request` helper attaches tokens and redirects to the admin login on 401.
/*
 * Cache for the storefront data (restaurants, categories, menus, dishes):
 *   - answers are kept in memory and in sessionStorage, so a page that was opened before shows instantly,
 *     even after a reload;
 *   - inside the freshness window no request is made at all;
 *   - after it, pages still start from the stored copy (see the peek* helpers) and refresh in the background;
 *   - identical requests that are already running share one call. The browser adds ETag revalidation on top.
 */
const STORE = "pub_cache_v1:";
const mem = new Map(); // path -> { data, at }
const inflight = new Map();

const ttlFor = (path) => (/^public\/(categories|platform)/.test(path) ? 5 * 60 * 1000 : 60 * 1000);

const readStored = (path) => {
  if (mem.has(path)) return mem.get(path);
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE + path));
    if (v?.at) mem.set(path, v);
    return v?.at ? v : null;
  } catch {
    return null;
  }
};

// last known answer for a path, however old (null when never fetched in this session)
const peek = (path) => readStored(path)?.data ?? null;

const get = (path) => {
  const hit = readStored(path);
  if (hit && Date.now() - hit.at < ttlFor(path)) return Promise.resolve(hit.data);
  if (inflight.has(path)) return inflight.get(path);

  const p = fetch(Config.BASE_URL + path, { headers: { Accept: "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    })
    .then((data) => {
      const entry = { data, at: Date.now() };
      mem.set(path, entry);
      try {
        sessionStorage.setItem(STORE + path, JSON.stringify(entry));
      } catch {
        /* storage full or unavailable: memory cache still works */
      }
      return data;
    })
    .finally(() => inflight.delete(path));

  inflight.set(path, p);
  return p;
};

// Synchronous "what we already know" for first render, so lists do not start empty.
export const peekPublicRestaurants = () => peek("public/restaurants")?.data ?? null;
export const peekPublicCategories = () => peek("public/categories")?.data ?? null;
// each branch has its own menu, so the branch is part of the cache key
const shopPath = (id, branch) => `public/restaurants/${id}${branch ? `?branch=${branch}` : ""}`;
export const peekPublicRestaurant = (id, branch) => peek(shopPath(id, branch));
export const peekPublicItem = (id) => peek(`public/items/${id}`);
export const fetchPublicRestaurants = () =>
  get("public/restaurants").then((r) => r.data ?? []);

export const fetchPublicRestaurant = (id, branch) => get(shopPath(id, branch));

export const fetchPublicItem = (id) => get(`public/items/${id}`);

// Restaurant categories managed by the platform admin (Administration -> Restaurant Categories).
export const fetchPublicCategories = () => get("public/categories").then((r) => r.data ?? []);

export const fetchPlatform = () => get("public/platform");

export const fetchPublicCuisines = () =>
  get("public/cuisines").then((r) => r.data ?? []);

// Maps a restaurant's free-text cuisine_type onto the filter pills used by the
// UI (burgers, pizza, asian, halal, mexican, healthy, desserts, beverages).
const CUISINE_RULES = [
  ["burgers", /burger|american|grill|fast/i],
  ["pizza", /pizza|ital|pasta/i],
  ["asian", /asia|chin|japan|sushi|thai|korea|viet|ramen|indian|curry/i],
  ["halal", /halal|turk|kebab|middle|arab|mediterr/i],
  ["mexican", /mex|taco/i],
  ["healthy", /health|vegan|veg|salad|bowl/i],
  ["desserts", /dessert|bakery|cake|sweet|ice/i],
  ["beverages", /bever|drink|boba|tea|coffee|cafe|juice/i],
];

export const cuisineKey = (type = "") =>
  CUISINE_RULES.find(([, re]) => re.test(type))?.[0] ?? "other";

// ---- Checkout (the only step that needs a customer login) ----
// Same keys AuthPage.saveSession writes.
export const getCustomerToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

/**
 * Places the order for everything in the cart.
 * Returns { needsLogin: true } when the customer is not signed in (nothing is sent),
 * otherwise resolves with the created order. Throws Error with a readable message.
 */
export const placeCartOrder = async (cart) => {
  const token = getCustomerToken();
  if (!token) return { needsLogin: true };

  const lines = cart.items.filter((i) => Number.isInteger(Number(i.menu_item_id)));
  if (!cart.restaurantId || lines.length === 0) {
    throw new Error("Add dishes from a restaurant to your cart first.");
  }

  const shop = await fetchPublicRestaurant(cart.restaurantId);
  const branch = shop.branches?.find((b) => b.is_active);
  if (!branch) throw new Error("This restaurant has no open branch right now.");

  const res = await fetch(Config.BASE_URL + "orders", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      restaurant_id: cart.restaurantId,
      branch_id: branch.id,
      payment_method: "cash",
      items: lines.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.qty,
        selected_modifiers: i.modifier_ids ?? [],
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { needsLogin: true };
  if (!res.ok) {
    throw new Error(
      data.message || (data.errors && Object.values(data.errors).flat()[0]) || "Could not place the order.",
    );
  }
  return { order: data };
};