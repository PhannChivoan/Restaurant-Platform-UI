import { Children, cloneElement, Fragment, isValidElement, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { getList, overridesVersion, subscribeOverrides } from "../contentOverrides";
import { useI18n } from "../i18n";

/*
 * A group of cards that the admin can manage (Administration -> Landing Page).
 *
 *   <Repeat id="home.categories" label="Food categories">
 *     <a>...card...</a>
 *     <a>...card...</a>
 *   </Repeat>
 *
 * Nothing saved for the id: the cards are rendered exactly as written. Saved: the list from the admin is
 * rendered instead - each entry is a copy of one of the original cards ("from") with some of its texts,
 * icon names or image addresses swapped, keyed by the original value. So new cards always have the same
 * markup and look as the existing ones; only their content differs.
 *
 * A card can also carry a link (the "__url" field). It goes onto the card's own link (<a href="#">) or button;
 * a card that has neither becomes clickable as a whole. Internal addresses ("/partner/register") navigate inside
 * the site, full addresses ("https://...", "mailto:...") open as usual. No address: the card is left as built.
 */

const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const ATTRS = ["alt", "title", "placeholder", "aria-label", "src"];

const pick = (field, lang) => (lang === "km" ? field.km || field.en : field.en);

const swap = (text, fields, lang) => {
  const field = fields[norm(text)];
  const value = field && pick(field, lang);
  if (!value) return text;
  return text.match(/^\s*/)[0] + value + text.match(/\s*$/)[0];
};

const isExternal = (url) => /^(https?:|mailto:|tel:)/i.test(url);
const isPlaceholder = (href) => href === undefined || href === "" || href === "#";

const fill = (node, fields, lang, link) => {
  if (typeof node === "string") return swap(node, fields, lang);
  if (!isValidElement(node)) return node;

  const props = {};

  if (link) {
    if (node.type === "a" && isPlaceholder(node.props.href)) {
      props.href = link.url;
      props.onClick = link.go;
      if (isExternal(link.url) && /^https?:/i.test(link.url)) props.rel = "noopener noreferrer";
      link.used = true;
    } else if (node.type === "button" && !node.props.onClick && node.props.type !== "submit") {
      props.onClick = link.go;
      link.used = true;
    }
  }

  for (const attr of ATTRS) {
    if (typeof node.props[attr] === "string") {
      const next = swap(node.props[attr], fields, lang);
      if (next !== node.props[attr]) props[attr] = next;
    }
  }

  const children = node.props.children;
  if (children === undefined) return Object.keys(props).length ? cloneElement(node, props) : node;
  return cloneElement(node, props, Children.map(children, (child) => fill(child, fields, lang, link)));
};

const Repeat = ({ id, children }) => {
  useSyncExternalStore(subscribeOverrides, overridesVersion);
  const { lang } = useI18n();
  const navigate = useNavigate();

  const originals = Children.toArray(children);
  const saved = getList(id);
  if (!saved) return <>{children}</>;

  return (
    <>
      {saved.map((entry, i) => {
        const base = originals[entry?.from];
        if (!base) return null;
        const fields = {};
        for (const [key, value] of Object.entries(entry.fields || {})) fields[norm(key)] = value || {};

        const url = String(entry.fields?.__url?.en || "").trim();
        if (!url || url === "#") return <Fragment key={`${id}-${i}`}>{fill(base, fields, lang)}</Fragment>;

        const go = (e) => {
          if (isExternal(url)) return; // the browser follows the address itself
          e.preventDefault();
          navigate(url);
        };
        const link = { url, go, used: false };
        const card = fill(base, fields, lang, link);
        // no link or button of its own: the whole card becomes the link (the anchor adds no box of its own)
        const wrapped = link.used ? card : (
          <a href={url} onClick={go} style={{ display: "contents" }}>{card}</a>
        );
        return <Fragment key={`${id}-${i}`}>{wrapped}</Fragment>;
      })}
    </>
  );
};

export default Repeat;
