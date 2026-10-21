import { KM_PHRASES } from "./km";

const norm = (s) => s.replace(/\s+/g, " ").trim();

const exact = new Map();
const templates = [];
for (const [en, km] of Object.entries(KM_PHRASES)) {
  const key = norm(en);
  if (key.includes("{0}")) {
    const pattern = key
      .split(/\{\d+\}/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("(.+?)");
    templates.push({ re: new RegExp(`^${pattern}$`), km });
  } else {
    exact.set(key, km);
  }
}

/** Khmer for an English text, or null when there is no entry. Leading / trailing spaces are kept. */
export const translateText = (text) => {
  const key = norm(text);
  if (!key) return null;

  let km = exact.get(key);
  if (km === undefined) {
    for (const t of templates) {
      const m = t.re.exec(key);
      if (m) {
        km = t.km.replace(/\{(\d+)\}/g, (_, i) => m[Number(i) + 1] ?? "");
        break;
      }
    }
  }
  if (km === undefined) return null;

  return text.match(/^\s*/)[0] + km + text.match(/\s*$/)[0];
};
