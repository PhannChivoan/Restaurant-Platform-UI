import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { cartRequest } from "../api/cartApi";

const ago = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

// Bell in the header: order updates (placed, accepted, preparing, ready, driver, delivered...) from the server.
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, data: [] });
  const [toast, setToast] = useState(null);
  const box = useRef(null);
  const newest = useRef(null); // id of the newest event we have already shown

  const load = useCallback(async () => {
    try {
      const res = await cartRequest("my/notifications");
      setData(res);
      const top = res.data[0];
      // announce a fresh event that arrived while the page was open
      if (top && newest.current && top.id !== newest.current && top.unread) {
        setToast(top);
        setTimeout(() => setToast(null), 6000);
      }
      newest.current = top?.id ?? newest.current ?? "none";
    } catch {
      /* keep the last list */
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const poll = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && data.unread > 0) {
      try {
        await cartRequest("my/notifications/read", "POST");
        setData((d) => ({ ...d, unread: 0 }));
      } catch {
        /* retry next time */
      }
    }
  };

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${data.unread ? `, ${data.unread} new` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-[22px] text-on-surface">notifications</span>
        {data.unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-space-sm w-[min(92vw,22rem)] max-h-[70vh] overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
          <div className="px-space-md py-space-sm border-b border-black/5 flex items-center justify-between">
            <p className="font-label-lg text-label-lg font-bold text-on-surface">Notifications</p>
            <Link to="/orders" onClick={() => setOpen(false)} className="font-label-sm text-label-sm font-bold text-primary">
              My orders
            </Link>
          </div>
          {data.data.length === 0 ? (
            <div className="p-space-lg text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px]">notifications_off</span>
              <p className="font-body-sm text-body-sm mt-1">No updates yet. Order something tasty!</p>
            </div>
          ) : (
            data.data.map((n) => (
              <Link
                key={n.id}
                to={`/orders/${n.order_id}`}
                onClick={() => setOpen(false)}
                className="flex gap-space-sm px-space-md py-space-sm hover:bg-surface-container-low"
              >
                <span className="w-9 h-9 rounded-full bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-label-md text-label-md font-bold text-on-surface">{n.title}</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">{n.body}</span>
                  <span className="block font-label-sm text-[11px] text-secondary mt-0.5">{ago(n.at)}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {toast && (
        <Link
          to={`/orders/${toast.order_id}`}
          onClick={() => setToast(null)}
          className="fixed top-24 right-4 z-[80] w-[min(92vw,22rem)] flex gap-space-sm items-start p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_12px_40px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
        >
          <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">{toast.icon}</span>
          </span>
          <span>
            <span className="block font-label-md text-label-md font-bold text-on-surface">{toast.title}</span>
            <span className="block font-body-sm text-body-sm text-on-surface-variant">{toast.body}</span>
          </span>
        </Link>
      )}
    </div>
  );
};

export default NotificationBell;