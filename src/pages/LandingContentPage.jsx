import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Badge, Button, Card, Collapse, Input, Segmented, Switch, Tabs, Tag, Tooltip, Typography, Upload } from "antd";
import { ArrowDown, ArrowUp, Copy, ExternalLink, ImageIcon, Languages, LayoutGrid, PanelsTopLeft, Plus, RotateCcw, Save, Search, Trash2, Type, UploadCloud } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TopProgressBar from "../components/ui/TopProgressBar";
import { palette } from "../constants/theme";
import { request } from "../utils/request";
import catalog from "../landing/contentCatalog.json";
import { translateText as khmerOf } from "../landing/translateText";

const { Text } = Typography;

/*
 * Landing page editor. The storefront pages keep their own layout; this edits what is inside them.
 *
 *   Cards   - every <Repeat> group on a page (e.g. the food categories on Home) is listed as its cards. Cards can be
 *             edited, copied, moved, removed, and new ones added: a new card always has the same design as the existing
 *             ones, only its content differs. A group that was never changed shows the page's own cards.
 *   Texts   - every other fixed text of the section, replaced one by one.
 *   Images  - every fixed picture of the section.
 *
 * Saved document: { texts: { "<original>": { en?, km? } }, images: { "<original src>": url },
 *                   lists: { "<list id>": [ { from: <original card index>, fields: { "<original value>": { en?, km? } } } ] } }
 * Clearing a field brings the original back.
 */

const count = (obj) => Object.keys(obj).length;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (v) => JSON.parse(JSON.stringify(v));

const firstError = (res) => {
  const first = res?.errors && Object.values(res.errors)[0];
  return (Array.isArray(first) && first[0]) || res?.message || "Unable to save the landing page.";
};

const khmerNow = (original) => (khmerOf(original) || "").trim();

const rowStyle = (changed) => ({ borderColor: changed ? `${palette.primary}66` : palette.border, background: changed ? palette.fillActive : palette.bg });

/* ---------- single texts and images ---------- */

const TextRow = ({ original, value, lang, onChange }) => {
  const changed = Boolean(value);
  return (
    <div className="landing-row" style={rowStyle(changed)}>
      <div style={{ minWidth: 0 }}>
        <div className="landing-row-label">On the site now{lang === "km" ? " (English)" : ""}</div>
        <div style={{ color: palette.ink, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>{original}</div>
        {lang === "km" && (
          <div style={{ color: palette.muted, fontSize: 13, marginTop: 4, wordBreak: "break-word" }}>
            Khmer now: {khmerNow(original) || "not translated (shows the English)"}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="landing-row-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{lang === "km" ? "Your Khmer text" : "Your text"}</span>
          {changed && <span style={{ color: palette.primary, fontWeight: 700 }}>Replaced</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
            value={value || ""}
            maxLength={5000}
            placeholder={lang === "km" ? "Leave empty to keep the current Khmer" : "Leave empty to keep the original"}
            onChange={(e) => onChange(e.target.value)}
          />
          <Tooltip title="Back to the original">
            <Button icon={<RotateCcw size={15} />} disabled={!changed} onClick={() => onChange("")} aria-label="Back to the original" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

const ImagePicker = ({ original, value, onChange, onUpload, uploading, compact = false }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
    <img
      src={value || original}
      alt=""
      style={{ width: compact ? 96 : 132, height: compact ? 64 : 88, objectFit: "cover", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bgSubtle, flexShrink: 0 }}
    />
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Upload
          accept="image/jpeg,image/png,image/webp"
          showUploadList={false}
          beforeUpload={(file) => {
            onUpload(file);
            return false;
          }}
        >
          <Button icon={<UploadCloud size={15} />} loading={uploading}>Upload</Button>
        </Upload>
        <Input style={{ flex: 1, minWidth: 160 }} value={value || ""} maxLength={1000} placeholder="or paste an image address (https://...)" onChange={(e) => onChange(e.target.value.trim())} />
        <Tooltip title="Back to the original">
          <Button icon={<RotateCcw size={15} />} disabled={!value} onClick={() => onChange("")} aria-label="Back to the original" />
        </Tooltip>
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>JPG, PNG or WebP, up to 4 MB. Use a picture with the same shape as the original so the layout stays the same.</Text>
    </div>
  </div>
);

const ImageRow = ({ original, value, ...rest }) => (
  <div className="landing-row" style={rowStyle(Boolean(value))}>
    <div style={{ minWidth: 0 }}>
      <div className="landing-row-label">Original image{value ? " · replaced" : ""}</div>
      <div style={{ color: palette.muted, fontSize: 13, wordBreak: "break-all" }}>{original}</div>
    </div>
    <ImagePicker original={original} value={value} {...rest} />
  </div>
);

/* ---------- card groups ---------- */

const defaultEntries = (list) => list.items.map((_, i) => ({ from: i, fields: {} }));

const previewOf = (list, entry, lang) => {
  const field = list.items[entry.from]?.find((f) => f.kind === "text");
  if (!field) return `Card ${entry.from + 1}`;
  const edited = entry.fields[field.key];
  return (lang === "km" ? edited?.km || edited?.en || khmerNow(field.key) : edited?.en) || field.key;
};

const CardFields = ({ list, entry, lang, onField, onUpload, uploadingKey }) => {
  const fields = list.items[entry.from] || [];
  const shown = lang === "km" ? fields.filter((f) => f.kind === "text") : fields;

  if (!shown.length) return <Text type="secondary">Nothing to edit in this language.</Text>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
      {shown.map((f) => {
        const edited = entry.fields[f.key] || {};
        if (f.kind === "image") {
          return (
            <div key={f.key} style={{ gridColumn: "1 / -1" }}>
              <div className="landing-row-label">Image</div>
              <ImagePicker compact original={f.key} value={edited.en} onChange={(v) => onField(f, "en", v)} onUpload={(file) => onUpload(f, file)} uploading={uploadingKey === f.key} />
            </div>
          );
        }
        const isKm = lang === "km";
        const value = isKm ? edited.km ?? khmerNow(f.key) : edited.en ?? (f.kind === "url" ? "" : f.key);
        const long = f.key.length > 70;
        return (
          <div key={f.key}>
            <div className="landing-row-label">{f.kind === "icon" ? "Icon name" : f.kind === "url" ? "Link (URL)" : isKm ? "Khmer text" : "Text"}</div>
            {long ? (
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 7 }} value={value} maxLength={5000} onChange={(e) => onField(f, isKm ? "km" : "en", e.target.value)} />
            ) : (
              <Input value={value} maxLength={f.kind === "icon" ? 60 : 5000} onChange={(e) => onField(f, isKm ? "km" : "en", e.target.value)} />
            )}
            {f.kind === "icon" && (
              <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Browse icon names</a>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ListEditor = ({ list, entries, customized, lang, onChange, onReset, onUpload, uploadingKey }) => {
  const update = (i, patch) => onChange(entries.map((e, n) => (n === i ? { ...e, ...patch } : e)));

  const setField = (i, field, side, raw) => {
    const entry = entries[i];
    const current = { ...(entry.fields[field.key] || {}) };
    const original = field.kind === "text" && side === "km" ? khmerNow(field.key) : field.kind === "image" || field.kind === "url" ? "" : field.key;
    if (raw === original || raw === "") delete current[side];
    else current[side] = raw;
    const fields = { ...entry.fields };
    if (count(current)) fields[field.key] = current;
    else delete fields[field.key];
    update(i, { fields });
  };

  const move = (i, step) => {
    const next = [...entries];
    const j = i + step;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const duplicate = (i) => onChange([...entries.slice(0, i + 1), clone(entries[i]), ...entries.slice(i + 1)]);
  const remove = (i) => onChange(entries.filter((_, n) => n !== i));
  const add = () => onChange([...entries, entries.length ? clone(entries[entries.length - 1]) : { from: 0, fields: {} }]);

  return (
    <div style={{ border: `1px solid ${palette.border}`, borderRadius: 12, background: palette.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 16px", borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: `${palette.primary}1A`, color: palette.primary }}><LayoutGrid size={17} /></div>
          <div>
            <div style={{ fontWeight: 700, color: palette.ink }}>{list.label}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{entries.length} card{entries.length === 1 ? "" : "s"}{customized ? "" : " · as built, not changed yet"}</Text>
          </div>
          {customized && <Tag color="blue" style={{ margin: 0 }}>Customized</Tag>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<RotateCcw size={15} />} disabled={!customized} onClick={onReset}>Reset to original</Button>
          <Button type="primary" icon={<Plus size={15} />} onClick={add}>Add card</Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No cards" description="Every card was removed, so this part of the page shows nothing. Add a card or reset to the original." compact />
      ) : (
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((entry, i) => (
            <div key={i} style={{ border: `1px solid ${palette.border}`, borderRadius: 10, background: palette.bgSubtle }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${palette.border}` }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, display: "grid", placeItems: "center", background: palette.primary, color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: palette.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewOf(list, entry, lang)}</span>
                <Tooltip title="Move up"><Button size="small" type="text" disabled={i === 0} icon={<ArrowUp size={15} />} onClick={() => move(i, -1)} aria-label="Move up" /></Tooltip>
                <Tooltip title="Move down"><Button size="small" type="text" disabled={i === entries.length - 1} icon={<ArrowDown size={15} />} onClick={() => move(i, 1)} aria-label="Move down" /></Tooltip>
                <Tooltip title="Duplicate this card"><Button size="small" type="text" icon={<Copy size={15} />} onClick={() => duplicate(i)} aria-label="Duplicate" /></Tooltip>
                <Tooltip title="Remove this card"><Button size="small" type="text" danger icon={<Trash2 size={15} />} onClick={() => remove(i)} aria-label="Remove" /></Tooltip>
              </div>
              <div style={{ padding: 12 }}>
                <CardFields list={list} entry={entry} lang={lang} onField={(f, side, raw) => setField(i, f, side, raw)} onUpload={(f, file) => onUpload(f, file, (url) => setField(i, f, "en", url))} uploadingKey={uploadingKey} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- page ---------- */

const LandingContentPage = () => {
  const { notification, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState({ texts: {}, images: {}, lists: {} });
  const [texts, setTexts] = useState({});
  const [images, setImages] = useState({});
  const [lists, setLists] = useState({});
  const [meta, setMeta] = useState({ updated_at: null, updated_by: null });

  const [pageKey, setPageKey] = useState(catalog.pages[0].key);
  const [lang, setLang] = useState("en");
  const [query, setQuery] = useState("");
  const [changedOnly, setChangedOnly] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

  const applyResponse = useCallback((res) => {
    const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
    // the API sends a card without edits as [] (an empty PHP array): the editor works with {}
    const lists = Object.fromEntries(
      Object.entries(obj(res?.content?.lists)).map(([id, cards]) => [id, (cards || []).map((c) => ({ from: c.from, fields: Array.isArray(c.fields) ? {} : c.fields || {} }))]),
    );
    const next = { texts: obj(res?.content?.texts), images: obj(res?.content?.images), lists };
    setSaved(next);
    setTexts(next.texts);
    setImages(next.images);
    setLists(next.lists);
    setMeta({ updated_at: res?.updated_at || null, updated_by: res?.updated_by || null });
  }, []);

  useEffect(() => {
    let alive = true;
    request("landing-content", "GET", undefined, { fresh: true })
      .then((res) => {
        if (!alive) return;
        if (res?.content) applyResponse(res);
        else setLoadError(res?.message || "Unable to load the landing page content.");
      })
      .catch(() => alive && setLoadError("Unable to load the landing page content."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [applyResponse]);

  // replacements saved for a text / image that is no longer on any page: kept visible so they can be removed
  const pages = useMemo(() => {
    const knownTexts = new Set(catalog.pages.flatMap((p) => p.sections.flatMap((s) => s.texts)));
    const knownImages = new Set(catalog.pages.flatMap((p) => p.sections.flatMap((s) => s.images)));
    const otherTexts = Object.keys(texts).filter((t) => !knownTexts.has(t));
    const otherImages = Object.keys(images).filter((s) => !knownImages.has(s));
    return otherTexts.length || otherImages.length
      ? [...catalog.pages, { key: "unused", label: "No longer on the site", sections: [{ key: "unused-1", label: "Replacements for content that was removed", heading: "", texts: otherTexts, images: otherImages, lists: [] }] }]
      : catalog.pages;
  }, [texts, images]);

  const page = pages.find((p) => p.key === pageKey) || pages[0];
  const dirty = !same(saved.texts, texts) || !same(saved.images, images) || !same(saved.lists, lists);

  const entriesOf = (list) => lists[list.id] || defaultEntries(list);
  const setEntries = (list, entries) =>
    setLists((prev) => {
      const next = { ...prev };
      if (same(entries, defaultEntries(list))) delete next[list.id];
      else next[list.id] = entries;
      return next;
    });

  const setText = (original, value) =>
    setTexts((prev) => {
      const entry = { ...(prev[original] || {}) };
      if (value) entry[lang] = value;
      else delete entry[lang];
      const next = { ...prev };
      if (count(entry)) next[original] = entry;
      else delete next[original];
      return next;
    });

  const setImage = (original, value) =>
    setImages((prev) => {
      const next = { ...prev };
      if (value) next[original] = value;
      else delete next[original];
      return next;
    });

  const upload = async (key, file, done) => {
    setUploadingKey(key);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await request("landing-content/image", "POST", body);
      if (res?.url) done(res.url);
      else notification.error({ message: firstError(res) });
    } catch (err) {
      notification.error({ message: err?.message || "Image upload failed." });
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await request("landing-content", "PUT", { texts, images, lists });
      if (res?.content && !res?.errors) {
        applyResponse(res);
        notification.success({ message: res.message || "Landing page content saved.", description: "Reload the site to see it." });
      } else {
        notification.error({ message: firstError(res) });
      }
    } catch (err) {
      notification.error({ message: err?.message || "Unable to save the landing page." });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setTexts(saved.texts);
    setImages(saved.images);
    setLists(saved.lists);
  };

  const resetAll = () =>
    modal.confirm({
      title: "Put the whole landing page back to the original?",
      content: "Every replaced text and image is cleared and every card group goes back to the page's own cards. Nothing changes on the site until you press Save changes.",
      okText: "Clear all changes",
      okButtonProps: { danger: true },
      onOk: () => {
        setTexts({});
        setImages({});
        setLists({});
      },
    });

  const changedInSection = (s) => s.texts.filter((t) => texts[t]).length + s.images.filter((i) => images[i]).length + s.lists.filter((l) => lists[l.id]).length;
  const changedInPage = (p) => p.sections.reduce((n, s) => n + changedInSection(s), 0);
  const needle = query.trim().toLowerCase();

  const header = (
    <PageHeader
      icon={PanelsTopLeft}
      title="Landing Page"
      description="Manage the content of the public site: edit texts and pictures, and add or remove cards. The design stays the same."
    />
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {header}
        <Card variant="outlined"><Loader label="Loading the landing page content…" minHeight={360} /></Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {header}
        <Alert type="error" showIcon title={loadError} />
      </div>
    );
  }

  const sectionBody = (section) => {
    const visibleTexts = section.texts.filter((t) => {
      const entry = texts[t];
      if (changedOnly && !entry?.[lang]) return false;
      if (!needle) return true;
      return t.toLowerCase().includes(needle) || (entry?.en || "").toLowerCase().includes(needle) || (entry?.km || "").toLowerCase().includes(needle);
    });
    const visibleImages = section.images.filter((s) => (!changedOnly || images[s]) && (!needle || s.toLowerCase().includes(needle)));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {section.lists.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {section.lists.map((list) => (
              <ListEditor
                key={list.id}
                list={list}
                entries={entriesOf(list)}
                customized={Boolean(lists[list.id])}
                lang={lang}
                onChange={(entries) => setEntries(list, entries)}
                onReset={() => setEntries(list, defaultEntries(list))}
                onUpload={(field, file, done) => upload(field.key, file, done)}
                uploadingKey={uploadingKey}
              />
            ))}
          </div>
        )}

        {section.texts.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: palette.ink, marginBottom: 8 }}><Type size={16} /> Texts ({visibleTexts.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleTexts.length === 0 ? (
                <Text type="secondary">No texts match the search or the Replaced only filter.</Text>
              ) : (
                visibleTexts.map((t) => <TextRow key={t} original={t} lang={lang} value={texts[t]?.[lang]} onChange={(v) => setText(t, v)} />)
              )}
            </div>
          </div>
        )}

        {section.images.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: palette.ink, marginBottom: 8 }}><ImageIcon size={16} /> Images ({visibleImages.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleImages.length === 0 ? (
                <Text type="secondary">No images match the search or the Replaced only filter.</Text>
              ) : (
                visibleImages.map((s) => (
                  <ImageRow key={s} original={s} value={images[s]} onChange={(v) => setImage(s, v)} onUpload={(file) => upload(s, file, (url) => setImage(s, url))} uploading={uploadingKey === s} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const sectionsToShow = page.sections.filter((s) => {
    if (!changedOnly && !needle) return true;
    if (changedOnly && changedInSection(s) === 0) return false;
    if (needle) {
      const inTexts = s.texts.some((t) => t.toLowerCase().includes(needle));
      const inLists = s.lists.some((l) => l.label.toLowerCase().includes(needle) || l.items.some((it) => it.some((f) => f.key.toLowerCase().includes(needle))));
      return inTexts || inLists || s.label.toLowerCase().includes(needle) || s.images.some((i) => i.toLowerCase().includes(needle));
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <TopProgressBar active={saving} label="Saving the landing page" />
      {header}

      <Alert
        type="info"
        showIcon
        title="How this works"
        description="Pick a page, then open a section. Card groups (like the food categories) list their cards: edit them, add a new one, copy, move or remove. A new card always looks like the existing ones. Below the cards, every other text and picture of the section can be replaced; leave a field as it is to keep the original. Restaurants, menus, prices and promotions are live data and are managed in their own sections. The header and footer are not editable here."
      />

      <Card variant="outlined" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={page.key}
          onChange={setPageKey}
          tabBarStyle={{ padding: "0 20px", marginBottom: 0 }}
          items={pages.map((p) => ({
            key: p.key,
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {p.label}
                {changedInPage(p) > 0 && <Badge count={changedInPage(p)} color={palette.primary} />}
              </span>
            ),
          }))}
        />

        <div className="landing-toolbar">
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: <span className="landing-seg"><Languages size={15} /> English</span> },
              { value: "km", label: <span className="landing-seg"><Languages size={15} /> Khmer</span> },
            ]}
          />
          <Input
            allowClear
            prefix={<Search size={15} color={palette.muted} />}
            placeholder="Search this page"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 220, maxWidth: 380 }}
          />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: palette.ink, cursor: "pointer" }}>
            <Switch size="small" checked={changedOnly} onChange={setChangedOnly} /> Changed only
          </label>
        </div>

        <div style={{ padding: "4px 20px 20px" }}>
          {sectionsToShow.length === 0 ? (
            <EmptyState icon={Search} title="Nothing to show" description="No section of this page matches the search or the Changed only filter." compact />
          ) : (
            <Collapse
              key={page.key + (needle ? "-s" : "")}
              defaultActiveKey={needle ? sectionsToShow.map((s) => s.key) : sectionsToShow.filter((s) => s.lists.length).map((s) => s.key)}
              style={{ background: "transparent" }}
              items={sectionsToShow.map((s) => ({
                key: s.key,
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: palette.ink }}>{s.label}</span>
                    {s.lists.length > 0 && <Tag color="blue" style={{ margin: 0 }}>{s.lists.length} card group{s.lists.length === 1 ? "" : "s"}</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>{s.texts.length} text{s.texts.length === 1 ? "" : "s"}{s.images.length ? ` · ${s.images.length} image${s.images.length === 1 ? "" : "s"}` : ""}</Text>
                    {changedInSection(s) > 0 && <Badge count={`${changedInSection(s)} changed`} color={palette.primary} />}
                  </span>
                ),
                children: sectionBody(s),
              }))}
            />
          )}
        </div>
      </Card>

      {/* save bar */}
      <div className="landing-savebar" style={{ border: `1px solid ${palette.border}`, background: palette.bg }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: palette.ink }}>
            {count(texts)} text{count(texts) === 1 ? "" : "s"}, {count(images)} image{count(images) === 1 ? "" : "s"} and {count(lists)} card group{count(lists) === 1 ? "" : "s"} changed
            {dirty && <span style={{ color: palette.warning, marginLeft: 10 }}>• Unsaved changes</span>}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {meta.updated_at ? `Last saved ${new Date(meta.updated_at).toLocaleString()}${meta.updated_by ? ` by ${meta.updated_by}` : ""}` : "Nothing has been changed yet: the site shows its original content."}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button icon={<ExternalLink size={15} />} href="/" target="_blank" rel="noreferrer">View site</Button>
          <Button danger disabled={!count(texts) && !count(images) && !count(lists)} onClick={resetAll}>Reset all</Button>
          <Button disabled={!dirty || saving} onClick={discard}>Discard</Button>
          <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={!dirty} onClick={save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
};

export default LandingContentPage;
