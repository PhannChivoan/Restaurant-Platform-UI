import { useState } from "react";
import { Button, Select, Table, message } from "antd";
import { Download } from "lucide-react";

const isPrimitive = (v) => ["string", "number", "boolean"].includes(typeof v);

const getPath = (record, dataIndex) => {
  if (dataIndex === undefined || dataIndex === null) return undefined;
  if (Array.isArray(dataIndex)) return dataIndex.reduce((o, k) => (o == null ? o : o[k]), record);
  return record?.[dataIndex];
};

const textOf = (node) => {
  if (node == null || typeof node === "boolean") return "";
  if (isPrimitive(node)) return String(node);
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(" ");
  if (node?.props) return textOf(node.props.children);
  return "";
};

/** One cell as plain text: an explicit exportValue, else the raw value, else the rendered text. */
const cellValue = (col, record, index) => {
  if (typeof col.exportValue === "function") return col.exportValue(record, index);
  const raw = getPath(record, col.dataIndex);
  if (isPrimitive(raw)) return raw;
  if (typeof col.render === "function") {
    try {
      const out = col.render(raw, record, index);
      const node = out && typeof out === "object" && !out.props && "children" in out ? out.children : out;
      const text = textOf(node).trim();
      if (text) return text;
    } catch {
      /* fall through to the raw value */
    }
  }
  if (raw == null) return "";
  if (Array.isArray(raw)) return raw.map((v) => (isPrimitive(v) ? v : v?.name ?? v?.label ?? "")).filter(Boolean).join("; ");
  if (typeof raw === "object") return raw.name ?? raw.label ?? "";
  return String(raw);
};

const csvCell = (v) => {
  let s = String(v ?? "");
  // a spreadsheet would run a leading = + - @ as a formula
  if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportRowsToCsv = (columns, rows, filename) => {
  const cols = columns.filter((c) => !c.hidden && (c.exportValue || (c.dataIndex !== undefined && c.dataIndex !== null)) && c.exportable !== false);
  if (!cols.length) return false;
  const header = cols.map((c) => csvCell(typeof c.title === "string" ? c.title : textOf(c.title) || String(c.key ?? c.dataIndex)));
  const lines = rows.map((r, i) => cols.map((c) => csvCell(cellValue(c, r, i))).join(","));
  const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
};

export const PAGE_SIZES = [10, 20, 50, 100];

/** Rows-per-page select (with "All") and the Export CSV button, in the same style as the filter rows. */
export const TableTools = ({ size, onSize, showSize = true, showExport = true, columns, rows, exportName = "export", fetchAll }) => {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const data = fetchAll ? await fetchAll() : rows;
      if (!data?.length) message.info("There is nothing to export yet.");
      else if (!exportRowsToCsv(columns, data, exportName)) message.warning("This table has no exportable columns.");
      else message.success(`Exported ${data.length} records.`);
    } catch (e) {
      message.error(e?.message || "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="table-tools" style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {showSize && (
        <Select
          value={size}
          onChange={onSize}
          options={[...(size && !PAGE_SIZES.includes(size) ? [size] : []), ...PAGE_SIZES.map((v) => ({ value: v, label: `${v} per page` })), { value: 0, label: "All" }]}
          style={{ width: 170, minWidth: 170 }}
        />
      )}
      {showExport && (
        <Button icon={<Download size={16} />} loading={busy} disabled={!rows?.length && !fetchAll} onClick={run}>
          Export CSV
        </Button>
      )}
    </div>
  );
};

/** Page size state: 0 means all rows. Returns the pagination to give antd's Table. */
export const useTablePaging = (pagination, rowCount, controlled = false) => {
  const configured = pagination && typeof pagination === "object" ? pagination : null;
  const [size, setSize] = useState(() => (configured?.pageSize ? configured.pageSize : pagination === false || !pagination ? 0 : 10));
  const serverPaged = controlled || (configured?.total !== undefined && configured.total > rowCount);

  const apply = (next) => {
    setSize(next);
    configured?.onChange?.(1, next || rowCount);
  };

  const merged = size === 0
    ? false
    : { ...(configured || {}), pageSize: size, showSizeChanger: false,
        showTotal: (total, range) => `Showing ${range[0]}–${range[1]} of ${total} records` };
  return { size, apply, serverPaged, pagination: serverPaged ? pagination : merged };
};

/** Drop-in for antd's Table for tables that sit outside ModulePage: the same tools row above it. */
const ExportableTable = ({ exportName = "export", fetchAll, hideTools = false, pagination, ...tableProps }) => {
  const { columns = [], dataSource = [] } = tableProps;
  const paging = useTablePaging(pagination, dataSource.length);

  return (
    <>
      {!hideTools && (
        <div style={{ display: "flex", marginBottom: 10 }}>
          <TableTools size={paging.size} onSize={paging.apply} showSize={!paging.serverPaged} columns={columns} rows={dataSource} exportName={exportName} fetchAll={fetchAll} />
        </div>
      )}
      <Table {...tableProps} pagination={paging.pagination} />
    </>
  );
};

export default ExportableTable;
