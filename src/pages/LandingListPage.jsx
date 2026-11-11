import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { App, Button, Form, Image, Input, Modal, Popconfirm, Space, Tabs, Tooltip, Typography, Upload } from "antd";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Hash, LayoutGrid, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

import ModulePage from "../components/ui/ModulePage";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { palette } from "../constants/theme";
import { request } from "../utils/request";
import catalog from "../landing/contentCatalog.json";
import { translateText as khmerOf } from "../landing/translateText";
import "./material-symbols.css";

const { Text } = Typography;

/*
 * One page per card group of the landing page (sidebar: Landing Page > ...). The table lists the records of the
 * group; every record is a card on the site, in this order. Adding a record adds a card that looks like the
 * existing ones; editing or removing a record changes the same card.
 *
 * Stored as { from, fields } per record (see landing/components/Repeat.jsx):
 *   from   - which of the page's own cards the record is drawn like
 *   fields - the values that differ from that card, keyed by the card's original text / icon / image
 */

const LISTS = catalog.pages.flatMap((p) => p.sections.flatMap((s) => s.lists));
const slugOf = (id) => id.replace(".", "-");

const clone = (v) => JSON.parse(JSON.stringify(v));
const khmerNow = (original) => (khmerOf(original) || "").trim();
const defaultEntries = (list) => list.items.map((_, i) => ({ from: i, fields: {} }));
const errorOf = (res) => {
  const first = res?.errors && Object.values(res.errors)[0];
  return (Array.isArray(first) && first[0]) || res?.message || "Something went wrong.";
};

// the fields of one card, split by kind (the order inside a kind is the order on the card)
const split = (template = []) => ({
  texts: template.filter((f) => f.kind === "text"),
  icons: template.filter((f) => f.kind === "icon"),
  images: template.filter((f) => f.kind === "image"),
  urls: template.filter((f) => f.kind === "url"),
});

// names for the fields of a card: the group's names when the card has the same shape, else generic ones
const namesFor = (list, template) => {
  const base = split(list.items[0]);
  const mine = split(template);
  const names = list.names || [];
  const fits = mine.texts.length === base.texts.length && mine.icons.length === base.icons.length && mine.images.length === base.images.length;
  const pickNames = (kind, group, offset) =>
    group.map((_, i) => (fits && names[offset + i]) || `${kind} ${group.length > 1 ? i + 1 : ""}`.trim());
  return {
    texts: pickNames("Text", mine.texts, 0),
    icons: pickNames("Icon", mine.icons, mine.texts.length),
    images: pickNames("Image", mine.images, mine.texts.length + mine.icons.length),
  };
};

const valueOf = (entry, field) => entry.fields[field.key]?.en ?? (field.kind === "url" ? "" : field.key);

const Icon = ({ name }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: palette.primaryLight, color: palette.primary }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{name}</span>
    </span>
  </span>
);

const LandingListPage = () => {
  const { slug } = useParams();
  const list = useMemo(() => LISTS.find((l) => slugOf(l.id) === slug), [slug]);
  const { notification } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [customized, setCustomized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // { index: number | null (new), entry }
  const [uploading, setUploading] = useState(null);

  const apply = useCallback(
    (res) => {
      const saved = res?.content?.lists?.[list.id];
      if (Array.isArray(saved)) {
        setEntries(saved.map((c) => ({ from: c.from, fields: Array.isArray(c.fields) ? {} : c.fields || {} })));
        setCustomized(true);
      } else {
        setEntries(defaultEntries(list));
        setCustomized(false);
      }
    },
    [list],
  );

  useEffect(() => {
    if (!list) return undefined;
    let alive = true;
    // deferred so the state updates happen outside the effect body
    const timer = setTimeout(() => {
      setLoading(true);
      request("landing-content", "GET", undefined, { fresh: true })
        .then((res) => {
          if (!alive) return;
          if (res?.content) {
            apply(res);
            setError("");
          } else setError(res?.message || "Unable to load this module.");
        })
        .catch(() => alive && setError("Unable to load this module."))
        .finally(() => alive && setLoading(false));
    }, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [list, apply]);

  if (!list) {
    return <EmptyState icon={LayoutGrid} title="This landing page module does not exist" description="Pick one from the Landing Page menu." />;
  }

  const persist = async (next, success) => {
    setBusy(true);
    try {
      const res = await request(`landing-content/lists/${list.id}`, "PUT", { cards: next });
      if (res?.content && !res?.errors) {
        apply(res);
        notification.success({ message: success });
        return true;
      }
      notification.error({ message: errorOf(res) });
    } catch (err) {
      notification.error({ message: err?.message || "Unable to save." });
    } finally {
      setBusy(false);
    }
    return false;
  };

  const reset = async () => {
    setBusy(true);
    try {
      const res = await request(`landing-content/lists/${list.id}`, "DELETE");
      if (res?.content && !res?.errors) {
        apply(res);
        notification.success({ message: "Back to the cards the page was built with." });
      } else notification.error({ message: errorOf(res) });
    } finally {
      setBusy(false);
    }
  };

  const move = (i, step) => {
    const j = i + step;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next, "Order saved.");
  };

  const openForm = (index) => {
    const entry = index === null ? { from: 0, fields: {} } : clone(entries[index]);
    const template = list.items[entry.from] || [];
    const values = {};
    template.forEach((f, n) => {
      const edited = entry.fields[f.key] || {};
      values[`en_${n}`] = edited.en ?? (f.kind === "image" || f.kind === "url" ? "" : f.key);
      if (f.kind === "text") values[`km_${n}`] = edited.km ?? khmerNow(f.key);
    });
    form.resetFields();
    form.setFieldsValue(values);
    setEditing({ index, entry });
  };

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const { entry, index } = editing;
    const template = list.items[entry.from] || [];
    const fields = {};
    template.forEach((f, n) => {
      const en = String(values[`en_${n}`] ?? "").trim();
      const km = f.kind === "text" ? String(values[`km_${n}`] ?? "").trim() : "";
      const edited = {};
      if (f.kind === "image" || f.kind === "url" ? en : en && en !== f.key) edited.en = en;
      if (km && km !== khmerNow(f.key)) edited.km = km;
      if (Object.keys(edited).length) fields[f.key] = edited;
    });
    const record = { from: entry.from, fields };
    const next = index === null ? [...entries, record] : entries.map((e, i) => (i === index ? record : e));

    if (await persist(next, index === null ? "Record added: it is now a card on the site." : "Record saved.")) setEditing(null);
  };

  const upload = async (n, file) => {
    setUploading(n);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await request("landing-content/image", "POST", body);
      if (res?.url) form.setFieldValue(`en_${n}`, res.url);
      else notification.error({ message: errorOf(res) });
    } catch (err) {
      notification.error({ message: err?.message || "Image upload failed." });
    } finally {
      setUploading(null);
    }
  };

  // ---- table ----
  const base = split(list.items[0]);
  const baseNames = namesFor(list, list.items[0]);
  const needle = query.trim().toLowerCase();

  const rows = entries
    .map((entry, index) => {
      const g = split(list.items[entry.from]);
      return { key: index, index, entry, g };
    })
    .filter(({ entry, g }) => !needle || g.texts.some((f) => valueOf(entry, f).toLowerCase().includes(needle)));

  const columns = [
    { title: "#", key: "n", width: 56, render: (_, r) => <Text type="secondary">{r.index + 1}</Text> },
    ...(base.images.length
      ? [{
          title: baseNames.images[0],
          key: "image",
          width: 96,
          render: (_, r) => {
            const f = r.g.images[0];
            return f ? <Image src={valueOf(r.entry, f)} width={64} height={44} style={{ objectFit: "cover", borderRadius: 8 }} /> : null;
          },
        }]
      : []),
    ...(base.icons.length
      ? [{ title: baseNames.icons[0], key: "icon", width: 90, render: (_, r) => (r.g.icons[0] ? <Icon name={valueOf(r.entry, r.g.icons[0])} /> : null) }]
      : []),
    ...base.texts.map((_, j) => ({
      title: baseNames.texts[j],
      key: `t${j}`,
      render: (_cell, r) => {
        const f = r.g.texts[j];
        if (!f) return null;
        const v = valueOf(r.entry, f);
        const text = j === 0 ? <Text strong>{v}</Text> : <Text type={j === 1 && base.texts.length > 2 ? undefined : "secondary"}>{v}</Text>;
        return <div style={{ maxWidth: j >= 2 ? 360 : 260, whiteSpace: "normal", wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</div>;
      },
    })),
    ...(base.urls.length
      ? [{
          title: "Link (URL)",
          key: "url",
          width: 190,
          render: (_, r) => {
            const f = r.g.urls[0];
            const url = f ? valueOf(r.entry, f) : "";
            return url ? <Text code style={{ wordBreak: "break-all" }}>{url}</Text> : <Text type="secondary">None</Text>;
          },
        }]
      : []),
    {
      title: "Khmer",
      key: "km",
      width: 100,
      render: (_, r) => {
        const has = r.g.texts.some((f) => r.entry.fields[f.key]?.km || khmerNow(f.key));
        return <StatusBadge tone={has ? "success" : "neutral"}>{has ? "Yes" : "English only"}</StatusBadge>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      fixed: "right",
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Move up"><Button size="small" type="text" disabled={busy || r.index === 0 || Boolean(needle)} icon={<ArrowUp size={15} />} onClick={() => move(r.index, -1)} /></Tooltip>
          <Tooltip title="Move down"><Button size="small" type="text" disabled={busy || r.index === entries.length - 1 || Boolean(needle)} icon={<ArrowDown size={15} />} onClick={() => move(r.index, 1)} /></Tooltip>
          <Tooltip title="Edit"><Button size="small" icon={<Pencil size={14} />} onClick={() => openForm(r.index)} /></Tooltip>
          <Tooltip title="Duplicate"><Button size="small" icon={<Copy size={14} />} disabled={busy} onClick={() => persist([...entries.slice(0, r.index + 1), clone(r.entry), ...entries.slice(r.index + 1)], "Record duplicated.")} /></Tooltip>
          <Popconfirm
            title="Delete this record?"
            description="The card disappears from the landing page."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => persist(entries.filter((_e, i) => i !== r.index), "Record deleted.")}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} disabled={busy} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Input
        allowClear
        prefix={<Search size={15} />}
        placeholder="Search records"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button icon={<ExternalLink size={15} />} href={list.pageUrl} target="_blank" rel="noreferrer">View on site</Button>
      <Popconfirm title="Back to the original cards?" description="Every record you added or changed here is dropped." okText="Reset" okButtonProps={{ danger: true }} disabled={!customized} onConfirm={reset}>
        <Button icon={<RotateCcw size={15} />} disabled={!customized || busy}>Reset to original</Button>
      </Popconfirm>
      <Button type="primary" icon={<Plus size={16} />} onClick={() => openForm(null)} disabled={busy}>Add record</Button>
    </div>
  );

  // ---- form ----
  const template = editing ? list.items[editing.entry.from] || [] : [];
  const nm = editing ? namesFor(list, template) : { texts: [], icons: [], images: [] };
  const labelOf = (f) => {
    if (f.kind === "url") return "Link (URL)";
    const group = f.kind === "text" ? split(template).texts : f.kind === "icon" ? split(template).icons : split(template).images;
    const names = f.kind === "text" ? nm.texts : f.kind === "icon" ? nm.icons : nm.images;
    return names[group.indexOf(f)];
  };

  const fieldsFor = (lang) =>
    template.map((f, n) => {
      if (lang === "km" && f.kind !== "text") return null;
      const long = f.key.length > 70;
      if (f.kind === "url") {
        return (
          <Form.Item
            key={n}
            label={labelOf(f)}
            name={`en_${n}`}
            extra="Where the card goes when it is clicked: a page of the site such as /order or /partner/register, or a full address such as https://example.com. Leave empty to keep the card as it is."
            rules={[{ pattern: /^(\/(?!\/)\S*|https?:\/\/\S+|mailto:\S+|tel:\S+|#)$/, message: "Start with / for a page of the site, or https:// for a full address." }]}
          >
            <Input maxLength={1000} placeholder="/order" />
          </Form.Item>
        );
      }
      if (f.kind === "image") {
        return (
          <Form.Item key={n} label={labelOf(f)} extra="JPG, PNG or WebP, up to 4 MB. Use a picture with the same shape as the card's original one.">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Form.Item name={`en_${n}`} noStyle><Input placeholder={f.key} style={{ flex: 1, minWidth: 220 }} /></Form.Item>
              <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={(file) => { upload(n, file); return false; }}>
                <Button icon={<UploadCloud size={15} />} loading={uploading === n}>Upload</Button>
              </Upload>
            </div>
          </Form.Item>
        );
      }
      const required = lang === "en" && f.kind === "text" && split(template).texts[0] === f;
      return (
        <Form.Item
          key={`${lang}${n}`}
          label={labelOf(f)}
          name={`${lang}_${n}`}
          rules={required ? [{ required: true, whitespace: true, message: "This is the card's main text." }] : undefined}
          extra={f.kind === "icon" ? <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer">Browse icon names</a> : lang === "km" ? `English: ${f.key}` : undefined}
        >
          {long ? <Input.TextArea autoSize={{ minRows: 2, maxRows: 7 }} maxLength={5000} /> : <Input maxLength={f.kind === "icon" ? 60 : 5000} />}
        </Form.Item>
      );
    });

  return (
    <>
      <ModulePage
        title={list.label}
        description={`${list.pageLabel} page · ${list.section}. Every record below is a card on the site, shown in this order: add, edit or delete a record to change the page.`}
        icon={LayoutGrid}
        stats={[
          { label: "Records (cards on the site)", value: entries.length, icon: Hash, color: palette.primary },
          { label: "Status", value: customized ? "Customized" : "As built", icon: ShieldCheck, color: customized ? palette.success : palette.muted, description: customized ? "Showing the records of this table" : "Showing the cards the page was built with" },
        ]}
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        toolbar={toolbar}
        pagination={false}
      />

      <Modal
        open={Boolean(editing)}
        title={editing?.index === null ? "Add a record" : `Edit record ${editing?.index + 1}`}
        okText={editing?.index === null ? "Add record" : "Save record"}
        confirmLoading={busy}
        onOk={submit}
        onCancel={() => setEditing(null)}
        width={680}
        destroyOnHidden
      >
        {editing?.index === null && <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>The new card starts as a copy of the first one: change what you need, it keeps the same design.</Text>}
        <Form form={form} layout="vertical" requiredMark={false}>
          <Tabs
            items={[
              { key: "en", label: "English", forceRender: true, children: fieldsFor("en") },
              { key: "km", label: "Khmer (optional)", forceRender: true, children: <>{fieldsFor("km")}<Text type="secondary">Leave a Khmer field as it is to keep the site's own translation (or the English when there is none).</Text></> },
            ]}
          />
        </Form>
      </Modal>
    </>
  );
};

export default LandingListPage;
