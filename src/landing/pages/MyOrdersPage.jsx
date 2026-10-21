import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import { STATUS_LABEL } from "../api/orderStatus";
import { fmt } from "../hooks/useCart";
import useFavorites from "../hooks/useFavorites";
import FavoriteButton from "../components/FavoriteButton";
import { useI18n } from "../i18n";


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
  const { t } = useI18n();
  const favourites = useFavorites();
  const [reordering, setReordering] = useState(null);
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

  const reorder = async (e, o) => {
    e.preventDefault(); // the card is a link to the order
    e.stopPropagation();
    setReordering(o.id);
    try {
      await cartRequest(`my/orders/${o.id}/reorder`, "POST");
      navigate(`/checkout/${o.restaurant.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setReordering(null);
    }
  };

  const active = (orders ?? []).filter((o) => o.active);
  const past = (orders ?? []).filter((o) => !o.active);
  const shown = tab === "active" ? active : past;

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[900px] mx-auto px-margin py-space-xl flex flex-col gap-space-lg min-h-[70vh]">
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">{t("orders.title", "My orders")}</h1>

        <div className="inline-flex p-1 bg-surface-container-low rounded-full self-start">
          {[["active", `${t("orders.active", "Active")} (${active.length})`], ["past", `${t("orders.past", "Past orders")} (${past.length})`], ["fav", `${t("orders.favourites", "Favourites")} (${favourites.ids.length})`]].map(([k, l]) => (
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

        {tab === "fav" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {favourites.items.length === 0 && (
              <p className="py-space-xl text-center text-on-surface-variant sm:col-span-2">{t("orders.noFavourites", "No favourite restaurants yet")}</p>
            )}
            {favourites.items.map((r) => (
              <Link
                key={r.id}
                to={`/order/shop?shop=${r.id}`}
                className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow p-space-md flex items-center gap-space-sm"
              >
                {r.logo_url ? (
                  <img src={r.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <span className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-container">storefront</span>
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-label-lg text-label-lg font-bold text-on-surface truncate">{r.name}</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">{r.cuisine_type}</span>
                </span>
                <FavoriteButton restaurantId={r.id} />
              </Link>
            ))}
          </div>
        )}

        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
        {orders === null && !error && (
          <div className="py-space-xl flex justify-center">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary-container">progress_activity</span>
          </div>
        )}
        {tab !== "fav" && orders && shown.length === 0 && (
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

        {(tab === "fav" ? [] : shown).map((o) => (
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
            {o.pickup && o.active && (
              <p className="font-label-md text-label-md text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Pickup at the restaurant
              </p>
            )}
            <div className="flex items-center justify-between gap-space-sm border-t border-surface-container-low pt-space-sm">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">{fmt(o.total)}</span>
              <span className="flex items-center gap-space-sm">
                {!o.active && (
                  <button
                    type="button"
                    onClick={(e) => reorder(e, o)}
                    disabled={reordering === o.id}
                    className="px-space-md py-1.5 rounded-xl border border-primary-container text-primary font-label-md text-label-md font-bold hover:bg-primary-container/10 disabled:opacity-60"
                  >
                    {reordering === o.id ? "…" : t("orders.again", "Order again")}
                  </button>
                )}
                <span className="font-label-md text-label-md font-bold text-primary flex items-center gap-1">
                  {o.active ? t("orders.track", "Track order") : t("orders.details", "View details")}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default MyOrdersPage;