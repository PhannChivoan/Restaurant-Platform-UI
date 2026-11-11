import { getLang, subscribeLang } from "./i18n";
import { translateText as khmer } from "./translateText";
import { hasOverrides, loadOverrides, overrideImage, overrideText, subscribeOverrides } from "./contentOverrides";

/*
 * Page translator. While the language is Khmer, every English text on the storefront (text nodes and the
 * placeholder / title / aria-label / alt attributes) is looked up in the Khmer phrase list and swapped;
 * switching back to English restores the originals. It follows React updates through a MutationObserver,
 * so dynamic content (cart, orders, errors) is translated as it appears. Text without an entry stays English.
 *
 * Phrases may contain {0} {1} ... placeholders for the changing parts: "Order {0} placed".
 *
 * The same swap applies the landing page content saved in the admin (contentOverrides.js): in English the
 * admin's wording replaces the original; in Khmer the admin's Khmer wins, then the phrase list, then the
 * admin's English. Replaced images work the same way on <img src>.
 */

const lookup = (text) => {
  if (getLang() === "km") return overrideText(text, "km") ?? khmer(text) ?? overrideText(text, "en");
  return overrideText(text, "en");
};

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_PARENT = "script, style, textarea, code, pre, .material-symbols-outlined, [data-no-translate]";

const textState = new Map(); // text node -> { orig, set }
const attrState = new Map(); // element -> { [attr]: { orig, set } }
const imageState = new Map(); // <img> -> { orig, set }
let observer = null;
let frame = 0;

const translatable = (node) => {
  const parent = node.parentElement;
  return parent && !parent.closest(SKIP_PARENT);
};

const scanText = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!translatable(node)) continue;

    const seen = textState.get(node);
    // React wrote new English over our Khmer (or the node is new): this is the original now
    const orig = seen && node.nodeValue === seen.set ? seen.orig : node.nodeValue;
    const km = lookup(orig);

    if (km !== null) {
      if (node.nodeValue !== km) node.nodeValue = km;
      textState.set(node, { orig, set: km });
    } else if (seen) {
      if (node.nodeValue === seen.set) node.nodeValue = seen.orig;
      textState.delete(node);
    }
  }
};

const scanAttrs = (root) => {
  const selector = ATTRS.map((a) => `[${a}]`).join(",");
  const elements = root.nodeType === 1 ? [root, ...root.querySelectorAll(selector)] : [...root.querySelectorAll(selector)];

  for (const el of elements) {
    if (el.closest?.("[data-no-translate]")) continue;
    for (const attr of ATTRS) {
      if (!el.hasAttribute?.(attr)) continue;
      const states = attrState.get(el) ?? {};
      const seen = states[attr];
      const value = el.getAttribute(attr);
      const orig = seen && value === seen.set ? seen.orig : value;
      const km = lookup(orig);

      if (km !== null) {
        if (value !== km) el.setAttribute(attr, km);
        states[attr] = { orig, set: km };
        attrState.set(el, states);
      } else if (seen) {
        if (value === seen.set) el.setAttribute(attr, seen.orig);
        delete states[attr];
      }
    }
  }
};

// images replaced in the admin: same idea, on the src of <img>
const scanImages = (root) => {
  for (const img of root.querySelectorAll("img[src]")) {
    const seen = imageState.get(img);
    const src = img.getAttribute("src");
    const orig = seen && src === seen.set ? seen.orig : src;
    const next = overrideImage(orig);

    if (next) {
      if (src !== next) img.setAttribute("src", next);
      imageState.set(img, { orig, set: next });
    } else if (seen) {
      if (src === seen.set) img.setAttribute("src", seen.orig);
      imageState.delete(img);
    }
  }
};

const scan = () => {
  frame = 0;
  if (getLang() !== "km" && !hasOverrides() && !imageState.size) return;
  scanText(document.body);
  scanAttrs(document.body);
  scanImages(document.body);
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(scan);
};

const restoreTexts = () => {
  for (const [node, s] of textState) {
    if (node.isConnected && node.nodeValue === s.set) node.nodeValue = s.orig;
  }
  textState.clear();
  for (const [el, states] of attrState) {
    for (const [attr, s] of Object.entries(states)) {
      if (el.isConnected && el.getAttribute(attr) === s.set) el.setAttribute(attr, s.orig);
    }
  }
  attrState.clear();
};

const restore = () => {
  restoreTexts();
  for (const [img, s] of imageState) {
    if (img.isConnected && img.getAttribute("src") === s.set) img.setAttribute("src", s.orig);
  }
  imageState.clear();
};

// language changed: back to the originals, then swap again for the new language
const sync = () => {
  restoreTexts();
  schedule();
};

/** Starts the translator; returns a function that stops it. Call once from the storefront layout. */
export const startTranslator = () => {
  observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS, "src"] });
  const unsubscribe = subscribeLang(sync);
  const unsubscribeContent = subscribeOverrides(schedule);
  sync();
  loadOverrides();

  return () => {
    unsubscribe();
    unsubscribeContent();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    restore();
  };
};
