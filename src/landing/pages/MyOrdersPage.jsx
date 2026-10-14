import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import { STATUS_LABEL } from "../api/orderStatus";
import { fmt } from "../hooks/useCart";


const badge = (s) =>
  s === "delivered"
    ? "bg-tertiary/15 text-tertiary"
    : s === "cancelled" || s === "rejected"
      ? "bg-error-container text-on-error-container"
      : "bg-primary-container/20 text-primary";

const when = (iso) =>
  new Date(iso).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// The customer's order history. Active orders can be tracked live on a map.
const MyOrdersPage = () => {
  const navigate = useNavigate();
  const signedIn = Boolean(getCustomerToken());
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active");

  useEffect(() => {
    if (!signedIn) navigate("/login", { replace: true, state: { from: "/orders" } });
  }, [signedIn, navigate]);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    const load = () =>
      cartRequest("my/orders")
        .then((r) => alive && (setOrders(r.data), setError("")))
        .catch((e) => alive && setError(e.message));
    load();
    const poll = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [signedIn]);

  const active = (orders ?? []).filter((o) => o.active);
  const past = (orders ?? []).filter((o) => !o.active);
  const shown = tab === "active" ? active : past;

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[900px] mx-auto px-margin py-space-xl flex flex-col gap-space-lg min-h-[70vh]">
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">My orders</h1>

        <div className="inline-flex p-1 bg-surface-container-low rounded-full self-start">
          {[["active", `Active (${active.length})`], ["past", `Past orders (${past.length})`]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                tab === k
                  ? "px-space-lg py-1.5 rounded-full bg-surface-container-lowest shadow-sm font-label-md text-label-md font-bold text-on-surface"
                  : "px-space-lg py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant"
              }
            >
              {l}
            </button>
          ))}
        </div>

        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
        {orders === null && !error && (
          <div className="py-space-xl flex justify-center">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary-container">progress_activity</span>
          </div>
        )}
        {orders && shown.length === 0 && (
          <div className="py-space-xl flex flex-col items-center text-center text-on-surface-variant gap-1">
            <span className="material-symbols-outlined text-[48px] text-secondary">{tab === "active" ? "two_wheeler" : "receipt_long"}</span>
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {tab === "active" ? "No active orders" : "No past orders yet"}
            </p>
            <Link to="/order" className="mt-2 px-space-lg py-2 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold">
              Order food
            </Link>
          </div>
        )}

        {shown.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow p-space-md flex flex-col gap-space-sm"
          >
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                {o.restaurant.logo_url ? (
                  <img src={o.restaurant.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <span className="w-11 h-11 rounded-xl bg-primary-container/15 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary-container">storefront</span>
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg font-bold text-on-surface truncate">{o.restaurant.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {o.order_number} · {when(o.created_at)}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold shrink-0 ${badge(o.status)}`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
            </p>
            <div className="flex items-center justify-between border-t border-surface-container-low pt-space-sm">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">{fmt(o.total)}</span>
              <span className="font-label-md text-label-md font-bold text-primary flex items-center gap-1">
                {o.active ? "Track order" : "View details"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default MyOrdersPage;