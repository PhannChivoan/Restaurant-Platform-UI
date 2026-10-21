import axios from "axios";

import { Config } from "./config";
import { getAccessToken } from "../store/access_token";

/** Downloads a file from the API (CSV exports) with the signed-in token. Throws a readable error. */
export const downloadFile = async (path, params = {}, fallbackName = "export.csv") => {
  try {
    const res = await axios.get(Config.BASE_URL + path, {
      params,
      responseType: "blob",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });

    const disposition = res.headers["content-disposition"] || "";
    const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    // a failed blob response still carries the JSON message as text
    let message = "Export failed.";
    try {
      message = JSON.parse(await error.response.data.text()).message || message;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message, { cause: error });
  }
};

/** Prints a table of rows as a clean page (the browser's "Save as PDF" makes the PDF). */
export const printTable = (title, headers, rows) => {
  const win = window.open("", "_blank");
  if (!win) return false;
  const esc = (v) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:13px system-ui,sans-serif;margin:24px}h1{font-size:20px;margin:0 0 4px}p{color:#555;margin:0 0 16px}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5}
td.n,th.n{text-align:right}</style></head><body>
<h1>${esc(title)}</h1><p>Generated ${esc(new Date().toLocaleString())}</p>
<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i > 0 && typeof c === "number" ? "n" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`);
  win.document.close();
  return true;
};
