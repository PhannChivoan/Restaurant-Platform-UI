import { useEffect } from "react";
import { App } from "antd";

/*
 * Applies the role's create / update / delete permissions to the page that is open:
 * a button, menu entry or switch that does an action the role may not do is greyed out
 * and refuses clicks. It works from what the control is (its icon or its label), so no
 * page has to be changed. The API enforces the same rules, this only makes them visible.
 */

const CONTROLS = 'button, [role="menuitem"], .ant-dropdown-menu-item, .ant-switch';
// where page actions live: the page itself plus the overlays a page opens
const SCOPE = ".admin-page, .ant-dropdown, .ant-popover, .ant-drawer";

const ICON_DELETE = /lucide-(trash|trash-2|archive|user-x|circle-x)\b/;
const ICON_CREATE = /lucide-(plus|circle-plus|square-plus|user-plus|file-plus|upload)\b/;
const ICON_UPDATE = /lucide-(pencil|pen|square-pen|edit|file-pen|settings-2|refresh-cw|power|toggle)/;

const TEXT_DELETE = /^(delete|remove|force delete|archive)\b/;
const TEXT_CREATE = /^(\+\s*)?(add|create|new|import|generate|register|invite)\b/;
const TEXT_UPDATE =
  /^(edit|update|save|toggle|enable|disable|activate|deactivate|accept|reject|refund|assign|approve|verify|suspend|mark|dispatch|restore|blacklist|unblacklist|start|confirm|set as|make default|publish|unpublish)\b/;

const classify = (el) => {
  if (el.classList.contains("ant-switch")) return "update";

  const text = (el.innerText || "").trim().toLowerCase();
  const label = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`.trim().toLowerCase();
  const icons = Array.from(el.querySelectorAll("svg"))
    .map((svg) => svg.getAttribute("class") || "")
    .join(" ");
  const words = text || label;

  if (TEXT_DELETE.test(words) || ICON_DELETE.test(icons)) return "delete";
  if (TEXT_CREATE.test(words) || (!text && ICON_CREATE.test(icons))) return "create";
  if (TEXT_UPDATE.test(words) || (!text && ICON_UPDATE.test(icons))) return "update";
  return null;
};

const eligible = (el) =>
  el.closest(SCOPE) &&
  !el.closest(".ant-modal-footer, .ant-popconfirm, .ant-pagination, .ant-tabs, .ant-select, .ant-picker");

const lock = (el, action) => {
  el.setAttribute("data-perm-locked", action);
  el.setAttribute("aria-disabled", "true");
  el.classList.add("perm-locked");
  if ("disabled" in el) el.disabled = true;
  el.dataset.permTitle = el.getAttribute("title") || "";
  el.setAttribute("title", `You do not have permission to ${action} here`);
};

const unlock = (el) => {
  el.removeAttribute("data-perm-locked");
  el.removeAttribute("aria-disabled");
  el.classList.remove("perm-locked");
  if ("disabled" in el) el.disabled = false;
  if (el.dataset.permTitle) el.setAttribute("title", el.dataset.permTitle);
  else el.removeAttribute("title");
};

const PermissionEnforcer = ({ perms, pageKey }) => {
  const { notification } = App.useApp();

  useEffect(() => {
    if (!perms || perms.includes("*") || !pageKey) return undefined;

    const can = (action) => perms.includes(`${pageKey}.${action}`);

    const apply = () => {
      document.querySelectorAll(CONTROLS).forEach((el) => {
        if (!eligible(el)) return;
        const action = classify(el);
        const locked = el.hasAttribute("data-perm-locked");

        if (action && !can(action)) {
          if (!locked) lock(el, action);
        } else if (locked) {
          unlock(el);
        }
      });
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    // disabled buttons swallow clicks, but switches and menu entries do not
    const block = (event) => {
      const locked = event.target.closest?.("[data-perm-locked]");
      if (!locked) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      notification.warning({
        message: "No permission",
        description: `Your role is not allowed to ${locked.getAttribute("data-perm-locked")} here.`,
        key: "perm-denied",
      });
    };

    apply();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", block, true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("click", block, true);
      document.querySelectorAll("[data-perm-locked]").forEach(unlock);
    };
  }, [perms, pageKey, notification]);

  return null;
};

export default PermissionEnforcer;
