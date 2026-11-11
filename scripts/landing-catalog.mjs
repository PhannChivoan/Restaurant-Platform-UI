/*
 * Builds src/landing/contentCatalog.json: the fixed content of every storefront page, grouped by page and section.
 * The admin "Landing Page" editor reads it, so each text / image can be replaced and each <Repeat> card group
 * can be managed (cards added, removed, reordered, edited) without touching the page code.
 *
 *   npm run landing:catalog      (run again after editing a landing page)
 *
 * The header and footer are not part of the catalog: only page content is.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "landing");

// page key, label shown in the editor, files that make the page
const PAGES = [
  ["home", "Home", ["pages/HomePage.jsx"]],
  ["services", "Services", ["pages/ServicesPage.jsx"]],
  ["about", "About us", ["pages/AboutPage.jsx"]],
  ["contact", "Contact", ["pages/ContactPage.jsx"]],
  ["partner", "Partner", ["pages/PartnerPage.jsx", "pages/PartnerRegisterPage.jsx"]],
  ["order", "Order & restaurants", ["pages/OrderPage.jsx", "pages/ShopPage.jsx", "pages/Restaurant.jsx", "pages/ItemPage.jsx"]],
  ["checkout", "Checkout & orders", ["pages/CheckoutPage.jsx", "pages/PaymentResultPage.jsx", "pages/MyOrdersPage.jsx", "pages/OrderTrackingPage.jsx"]],
  ["account", "Sign in & sign up", ["pages/AuthPage.jsx"]],
  ["privacy", "Privacy policy", ["pages/PrivacyPolicyPage.jsx"]],
];

// column names of each card group: the texts in source order, then the icons, then the images
const LIST_FIELDS = {
  "home.perks": ["Value", "Label", "Icon"],
  "home.stats": ["Label", "Number", "Note", "Icon", "Note icon"],
  "home.categories": ["Name", "Places", "Icon"],
  "home.services": ["Title", "Description", "Link text", "Icon", "Link icon"],
  "home.story": ["Title", "Description", "Icon"],
  "home.help": ["Title", "Description", "Button text", "Icon"],
  "services.tools": ["Title", "Subtitle", "Description", "Tag label", "Tag value", "Icon"],
  "services.points": ["Text", "Icon"],
  "services.features": ["Highlight", "Title", "Description", "Icon"],
  "about.numbers": ["Number", "Title", "Description", "Icon"],
  "about.pillars": ["Label", "Title", "Description", "Link text", "Icon", "Link icon"],
  "about.timeline": ["Year", "Title", "Description", "Badge", "Icon"],
  "about.impact": ["Number", "Description"],
};

// public address of each page (the "View on site" link)
const PAGE_URL = { home: "/", services: "/services", about: "/about-us", contact: "/contact", partner: "/partner" };

const TEXT_ATTRS = new Set(["placeholder", "title", "aria-label", "alt"]);
const norm = (s) => s.replace(/\s+/g, " ").trim();
// words, or a figure such as "15,000+" / "98%" (bare numbers like "4.9" are left out: they could match live data)
const isWords = (s) => /\p{L}/u.test(s) || /\d.*[+%,]|[+%,].*\d/.test(s);

// what React renders for a JSX text: lines trimmed, blank lines dropped, joined by one space
const jsxText = (raw) =>
  raw
    .split(/\r?\n/)
    .map((line, i, all) => {
      let out = line.replace(/\t/g, " ");
      if (i !== 0) out = out.replace(/^ +/, "");
      if (i !== all.length - 1) out = out.replace(/ +$/, "");
      return out;
    })
    .filter(Boolean)
    .join(" ");

const tagName = (el) => (el.openingElement.name.type === "JSXIdentifier" ? el.openingElement.name.name : "");
const attrName = (node) => (node.name.type === "JSXNamespacedName" ? `${node.name.namespace.name}:${node.name.name.name}` : node.name.name);
const attrOf = (el, name) => el.openingElement.attributes.find((a) => a.type === "JSXAttribute" && attrName(a) === name);
const classOf = (el) => {
  const attr = attrOf(el, "className");
  return attr?.value?.type === "Literal" ? String(attr.value.value) : "";
};
const literalOf = (el, name) => {
  const attr = attrOf(el, name);
  return attr?.value?.type === "Literal" ? String(attr.value.value) : "";
};

// string literals an expression can evaluate to: "a", cond ? "a" : "b", x && "a", x || "a", t("key", "a")
const stringsOf = (expr, out = []) => {
  if (!expr) return out;
  if (expr.type === "Literal" && typeof expr.value === "string") out.push(expr.value);
  else if (expr.type === "TemplateLiteral" && expr.expressions.length === 0) out.push(expr.quasis[0].value.cooked);
  else if (expr.type === "ConditionalExpression") {
    stringsOf(expr.consequent, out);
    stringsOf(expr.alternate, out);
  } else if (expr.type === "LogicalExpression") {
    stringsOf(expr.left, out);
    stringsOf(expr.right, out);
  } else if (expr.type === "CallExpression" && expr.callee.type === "Identifier" && expr.callee.name === "t" && expr.arguments[1]) {
    stringsOf(expr.arguments[1], out);
  }
  return out;
};

/**
 * Walks a JSX subtree in source order and reports what it contains:
 *   texts  - words shown to people (text nodes and the placeholder / title / aria-label / alt attributes)
 *   images - <img src="/..."> addresses
 *   icons  - Material Symbols icon names
 *   lists  - <Repeat> groups found inside (not descended into: their content belongs to the list)
 */
const collect = (root, { numbers = false } = {}) => {
  const out = { texts: [], images: [], icons: [], lists: [] };
  const addText = (value) => {
    const text = norm(value);
    // inside a card group every figure counts ("9", "1,200"): the group's own records hold them, not live data
    if (text.length >= 1 && text.length <= 600 && (isWords(text) || (numbers && /\d/.test(text)))) out.texts.push(text);
  };

  const walk = (node, inExpression) => {
    if (!node || typeof node.type !== "string") return;

    if (node.type === "JSXElement") {
      if (tagName(node) === "Repeat") {
        out.lists.push(node);
        return;
      }
      const isIcon = /material-symbols/.test(classOf(node));
      for (const attr of node.openingElement.attributes) {
        if (attr.type !== "JSXAttribute") continue;
        const name = attrName(attr);
        const values = attr.value?.type === "Literal" ? [attr.value.value] : attr.value?.type === "JSXExpressionContainer" ? stringsOf(attr.value.expression) : [];
        if (TEXT_ATTRS.has(name)) values.forEach((v) => typeof v === "string" && addText(v));
        if (name === "src" && tagName(node) === "img") values.forEach((v) => typeof v === "string" && /^(\/|https?:)/.test(v) && out.images.push(v));
        if (attr.value?.type === "JSXExpressionContainer") walk(attr.value.expression, false);
      }
      if (isIcon) {
        node.children.forEach((c) => {
          if (c.type === "JSXText" && jsxText(c.value)) out.icons.push(jsxText(c.value));
        });
        return;
      }
      node.children.forEach((child) => walk(child, true));
      return;
    }
    if (node.type === "JSXText") {
      addText(jsxText(node.value));
      return;
    }
    if (node.type === "JSXExpressionContainer" && inExpression) stringsOf(node.expression).forEach(addText);

    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach((child) => child && typeof child.type === "string" && walk(child, false));
      else if (value && typeof value.type === "string") walk(value, false);
    }
  };

  walk(root, false);
  return out;
};

const uniq = (list) => [...new Set(list)];

// a list's cards: every element child of <Repeat>, each with its editable fields in source order
const listOf = (node) => {
  const items = node.children
    .filter((c) => c.type === "JSXElement")
    .map((card) => {
      const c = collect(card, { numbers: true });
      return [
        ...uniq(c.texts).map((key) => ({ key, kind: "text" })),
        ...uniq(c.icons).map((key) => ({ key, kind: "icon" })),
        ...uniq(c.images).map((key) => ({ key, kind: "image" })),
        // every card can link somewhere: the address the admin enters (empty = the card behaves as built)
        { key: "__url", kind: "url" },
      ];
    });
  const id = literalOf(node, "id");
  return { id, label: literalOf(node, "label") || id, names: LIST_FIELDS[id] || [], items };
};

// "STATS BAR (Style from ...)" -> "Stats bar"
const prettyLabel = (comment) => {
  const base = comment.replace(/\(.*$/, "").replace(/[*:]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
};

const scanFile = (file) => {
  const code = readFileSync(join(ROOT, file), "utf8");
  const ast = espree.parse(code, { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, range: true });

  // outermost <section> elements, in page order
  const sections = [];
  const find = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "JSXElement" && tagName(node) === "section") {
      sections.push(node);
      return;
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(find);
      else if (value && typeof value.type === "string") find(value);
    }
  };
  find(ast);

  const out = [];
  let covered = [];
  sections.forEach((section, i) => {
    const before = code.slice(Math.max(0, section.range[0] - 240), section.range[0]);
    const comment = /\{\/\*\s*([\s\S]+?)\s*\*\/\}\s*$/.exec(before)?.[1] || "";
    const c = collect(section);
    const heading = (() => {
      let found = "";
      const w = (n) => {
        if (found || !n || typeof n.type !== "string") return;
        if (n.type === "JSXElement" && /^h[1-3]$/.test(tagName(n))) {
          const t = collect(n).texts[0];
          if (t) found = t;
          return;
        }
        for (const k of Object.keys(n)) {
          const v = n[k];
          if (Array.isArray(v)) v.forEach(w);
          else if (v && typeof v.type === "string") w(v);
        }
      };
      w(section);
      return found;
    })();
    out.push({
      label: prettyLabel(comment) || heading.slice(0, 60) || `Section ${i + 1}`,
      heading: heading.slice(0, 80),
      texts: uniq(c.texts),
      images: uniq(c.images),
      lists: c.lists.map(listOf),
    });
    covered.push(section.range);
  });

  // anything on the page outside the sections (pages built without <section>): one "Page content" block
  const strip = (node) => {
    // an AST copy without the section subtrees
    if (!node || typeof node.type !== "string") return node;
    if (covered.some(([a, b]) => node.range && node.range[0] >= a && node.range[1] <= b)) return null;
    const copy = { ...node };
    for (const key of Object.keys(copy)) {
      const value = copy[key];
      if (Array.isArray(value)) copy[key] = value.map(strip).filter(Boolean);
      else if (value && typeof value.type === "string") copy[key] = strip(value);
    }
    return copy;
  };
  const rest = collect(strip(ast));
  if (rest.texts.length || rest.images.length || rest.lists.length) {
    out.push({ label: sections.length ? "Other content on the page" : "Page content", heading: "", texts: uniq(rest.texts), images: uniq(rest.images), lists: rest.lists.map(listOf) });
  }
  return out;
};

const pages = PAGES.map(([key, label, files]) => {
  let n = 0;
  const sections = [];
  const seenTexts = new Set();
  for (const file of files) {
    for (const s of scanFile(file)) {
      // a text already listed in an earlier section of the page is not offered twice (it is replaced everywhere)
      const texts = s.texts.filter((t) => !seenTexts.has(t));
      texts.forEach((t) => seenTexts.add(t));
      if (!texts.length && !s.images.length && !s.lists.length) continue;
      n += 1;
      sections.push({ key: `${key}-${n}`, label: s.label, heading: s.heading, texts, images: s.images, lists: s.lists.map((l) => ({ ...l, page: key, pageLabel: label, pageUrl: PAGE_URL[key] || "/", section: s.label })) });
    }
  }
  return { key, label, sections };
});

const out = join(ROOT, "contentCatalog.json");
writeFileSync(out, `${JSON.stringify({ pages }, null, 1)}\n`);

for (const p of pages) {
  const t = p.sections.reduce((n, s) => n + s.texts.length, 0);
  const i = p.sections.reduce((n, s) => n + s.images.length, 0);
  const l = p.sections.reduce((n, s) => n + s.lists.length, 0);
  console.log(`${p.label}: ${p.sections.length} sections, ${t} texts, ${i} images, ${l} card lists`);
}
console.log(`-> ${out}`);
