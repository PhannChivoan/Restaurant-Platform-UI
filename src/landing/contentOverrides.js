import { Config } from "../utils/config";

/*
 * Landing page content managed in the admin (Administration -> Landing Page).
 *
 * The pages keep their own markup. The admin stores replacements keyed by the original:
 *   texts  : "<original English text>" -> { en?: "...", km?: "..." }
 *   images : "<original img src>"      -> "<replacement url>"
 *   lists  : "<list id>"               -> [ { from: <index of the original card to copy>, fields: { "<original text>": { en?, km? } } } ]
 * Texts and images are swapped into the page by translate.js, the same way it swaps in Khmer. Lists are
 * rendered by <Repeat> (components/Repeat.jsx): a list that was never saved shows the page's own cards,
 * a saved one shows exactly the cards in it (added, removed, reordered, edited). With nothing saved,
 * the storefront is exactly what the page files say.
 */

const STORE = "landing_content_v1";
const norm = (s) => String(s).replace(/\s+/g, " ").trim();

let texts = new Map(); // normalised original -> { en, km }
let images = {}; // original src -> replacement url
let lists = {}; // list id -> [{ from, fields }]
let version = 0;
const listeners = new Set();

const apply = (content) => {
  const nextTexts = content?.texts && typeof content.texts === "object" ? content.texts : {};
  texts = new Map(Object.entries(nextTexts).map(([original, value]) => [norm(original), value || {}]));
  images = content?.images && typeof content.images === "object" && !Array.isArray(content.images) ? content.images : {};
  lists = content?.lists && typeof content.lists === "object" && !Array.isArray(content.lists) ? content.lists : {};
  version += 1;
};

// start from the copy kept by the last visit, so replacements are on screen from the first frame
try {
  apply(JSON.parse(localStorage.getItem(STORE)));
} catch {
  /* nothing stored yet */
}

export const hasOverrides = () => texts.size > 0 || Object.keys(images).length > 0;

/** The saved cards of a list, or null when the list was never saved (the page shows its own cards). */
export const getList = (id) => (Array.isArray(lists[id]) ? lists[id] : null);

/** Changes whenever new content arrives (for useSyncExternalStore). */
export const overridesVersion = () => version;

/** The admin's wording for an original text in a language ("en" | "km"), or null. Outer spaces are kept. */
export const overrideText = (text, lang) => {
  if (!texts.size) return null;
  const value = texts.get(norm(text))?.[lang];
  if (!value) return null;
  return text.match(/^\s*/)[0] + value + text.match(/\s*$/)[0];
};

/** The admin's replacement for an image, or null. */
export const overrideImage = (src) => (src && images[src]) || null;

export const subscribeOverrides = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

let pending = null;

/** Reads the saved content once per page load; the storefront keeps working if the call fails. */
export const loadOverrides = () => {
  if (pending) return pending;

  pending = fetch(`${Config.BASE_URL}public/landing-content`, { headers: { Accept: "application/json" } })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (!json?.content) return;
      apply(json.content);
      try {
        localStorage.setItem(STORE, JSON.stringify(json.content));
      } catch {
        /* storage unavailable */
      }
      listeners.forEach((fn) => fn());
    })
    .catch(() => {
      /* offline or API down: keep what we have */
    });

  return pending;
};
