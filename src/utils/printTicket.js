import { formatMoney } from "./platformSettings";
// Printable kitchen ticket / receipt. Opens a small window with plain, printer-friendly HTML
// (works with a normal printer and with 80 mm thermal printers) and starts the print dialog.

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const money = (v) => `${formatMoney(Number(v || 0))}`;

/**
 * @param {object} order  order with optional items[], customer, restaurant, branch
 * @param {"kitchen"|"receipt"} kind  kitchen = big dish names, no prices; receipt = prices and totals
 */
export const printTicket = (order, kind = "kitchen") => {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return false; // pop-up blocked

  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items
    .map((i) => {
      const name = i.item_name || i.name || i.menu_item?.name || "Item";
      const mods = Array.isArray(i.selected_modifiers)
        ? i.selected_modifiers.map((m) => m.modifier || m.name || m).filter(Boolean).join(", ")
        : "";
      return `<tr><td class="q">${esc(i.quantity)}×</td><td>${esc(name)}${mods ? `<div class="m">${esc(mods)}</div>` : ""}</td>${
        kind === "receipt" ? `<td class="r">${money(i.subtotal)}</td>` : ""
      }</tr>`;
    })
    .join("");

  const totals =
    kind === "receipt"
      ? `<hr/><table>
          <tr><td>Subtotal</td><td class="r">${money(order.subtotal)}</td></tr>
          ${Number(order.discount) ? `<tr><td>Discount</td><td class="r">-${money(order.discount)}</td></tr>` : ""}
          ${Number(order.delivery_fee) ? `<tr><td>Delivery</td><td class="r">${money(order.delivery_fee)}</td></tr>` : ""}
          <tr class="t"><td>Total</td><td class="r">${money(order.total)}</td></tr>
        </table>
        <p>${esc(String(order.payment_method || "").replace("_", " "))} · ${order.is_paid ? "PAID" : "UNPAID"}</p>`
      : "";

  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(order.order_number)}</title>
<style>
  *{box-sizing:border-box} body{font:13px/1.35 system-ui,sans-serif;margin:0;padding:12px;width:300px}
  h1{font-size:18px;margin:0 0 2px} h2{font-size:14px;margin:0 0 8px;font-weight:600}
  table{width:100%;border-collapse:collapse} td{padding:3px 0;vertical-align:top}
  .q{width:34px;font-weight:700;font-size:${kind === "kitchen" ? "18px" : "13px"}}
  td{font-size:${kind === "kitchen" ? "16px" : "13px"}} .m{font-size:11px;color:#555} .r{text-align:right}
  .t td{font-weight:700;border-top:1px solid #000;padding-top:5px} hr{border:0;border-top:1px dashed #000;margin:8px 0}
  .note{border:1px solid #000;padding:6px;margin-top:8px;font-weight:600}
  @media print{body{padding:0}}
</style></head><body>
  <h1>${esc(order.restaurant?.name || "Order")}</h1>
  <h2>${esc(order.order_number)} · ${esc(new Date(order.created_at || Date.now()).toLocaleString())}</h2>
  ${order.payment_method === "pickup" ? `<p class="note">PICKUP - customer collects at the counter</p>` : ""}
  <p>${esc(order.customer?.name || "")}${order.customer?.phone ? ` · ${esc(order.customer.phone)}` : ""}</p>
  <hr/><table>${lines || "<tr><td>No items</td></tr>"}</table>
  ${order.customer_notes ? `<p class="note">NOTE: ${esc(order.customer_notes)}</p>` : ""}
  ${totals}
  <script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
</body></html>`);
  win.document.close();

  return true;
};
