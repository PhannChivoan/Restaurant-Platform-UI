import { getLang, subscribeLang } from "./i18n";
import { translateText as lookup } from "./translateText";

/*
 * Page translator. While the language is Khmer, every English text on the storefront (text nodes and the
 * placeholder / title / aria-label / alt attributes) is looked up in the Khmer phrase list and swapped;
 * switching back to English restores the originals. It follows React updates through a MutationObserver,
 * so dynamic content (cart, orders, errors) is translated as it appears. Text without an entry stays English.
 *
 * Phrases may contain {0} {1} ... placeholders for the changing parts: "Order {0} placed".
 */

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_PARENT = "script, style, textarea, code, pre, .material-symbols-outlined, [data-no-translate]";

const textState = new Map(); // text node -> { orig, set }
const attrState = new Map(); // element -> { [attr]: { orig, set } }
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
        delete states[attr];
      }
    }
  }
};

const scan = () => {
  frame = 0;
  if (getLang() !== "km") return;
  scanText(document.body);
  scanAttrs(document.body);
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(scan);
};

const restore = () => {
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

const sync = () => {
  if (getLang() === "km") {
    schedule();
  } else {
    restore();
  }
};

/** Starts the translator; returns a function that stops it. Call once from the storefront layout. */
export const startTranslator = () => {
  observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const unsubscribe = subscribeLang(sync);
  sync();

  return () => {
    unsubscribe();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    restore();
  };
};
