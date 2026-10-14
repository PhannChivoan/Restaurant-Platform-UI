import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import TrackingMap from "../components/TrackingMap";
import { fmt } from "../hooks/useCart";
import { STATUS_LABEL } from "../api/orderStatus";

const STEPS = [
  ["placed", "Order placed", "receipt_long"],
  ["accepted", "Restaurant accepted", "storefront"],
  ["preparing", "Preparing your food", "skillet"],
  ["ready", "Ready — driver heading to restaurant", "takeout_dining"],
  ["picked_up", "Driver is on the way", "delivery_dining"],
  ["delivered", "Delivered", "task_alt"],
];

const stepIndex = (o) => {
  if (o.status === "delivered") return 5;
  if (o.status === "dispatched") return o.timeline.picked_up ? 4 : 3;
  return { pending: 0, accepted: 1, preparing: 2, ready: 3 }[o.status] ?? 0;
};

const clock = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

// Foodpanda-style order tracking: status steps, estimated arrival, driver and a live map.
const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const signedIn = Boolean(getCustomerToken());
  const [o, setO] = useState(null);
  const [error, setError] = useState("");
  const [route, setRoute] = useState(null); // { km, min } still to travel
  const [now, setNow] = useState(() => Date.now()); // ticks so the arrival clock stays right

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!signedIn) navigate("/login", { replace: true, state: { from: `/orders/${id}` } });
  }, [signedIn, navigate, id]);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    const load = () =>
      cartRequest(`my/orders/${id}`)
        .then((r) => alive && (setO(r), setError("")))
        .catch((e) => alive && setError(e.status === 404 ? "We couldn't find this order." : e.message));
    load();
    const poll = setInterval(load, 10000); // keeps the status and the driver's position fresh
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [signedIn, id]);

  const wrap = (children) => (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[1100px] mx-auto px-margin py-space-lg flex flex-col gap-space-lg min-h-[70vh]">{children}</div>
    </main>
  );

  if (error) {
    return wrap(
      <div className="py-space-xl flex flex-col items-center gap-space-md">
        <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{error}</p>
        <Link to="/orders" className="text-primary font-bold hover:underline">Back to my orders</Link>
      </div>,
    );
  }
  if (!o) {
    return wrap(
      <div className="py-space-xl flex justify-center">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary-container">progress_activity</span>
      </div>,
    );
  }

  const idx = stepIndex(o);
  const closed = o.status === "cancelled" || o.status === "rejected";
  const done = o.status === "delivered";
  const onTheWay = o.status === "dispatched" && o.timeline.picked_up;

  // minutes until the food arrives: cooking left + travel (+ a few minutes for pickup if not collected yet)
  const travel = route?.min ?? null;
  const eta = closed || done || travel === null ? null : o.eta.prep_remaining_minutes + travel + (onTheWay ? 0 : 4);
  const arrival = eta ? new Date(now + eta * 60000).toISOString() : null;

  const headline = closed
    ? o.status === "rejected" ? "The restaurant couldn't accept your order" : "Order cancelled"
    : done ? "Delivered — enjoy your meal!"
    : onTheWay ? "Your driver is on the way"
    : o.status === "dispatched" ? "A driver is heading to the restaurant"
    : o.status === "ready" ? "Your order is ready"
    : o.status === "preparing" ? "The restaurant is preparing your food"
    : o.status === "accepted" ? "The restaurant accepted your order"
    : "Waiting for the restaurant to accept";

  return wrap(
    <>
      <div className="flex items-center justify-between gap-space-sm flex-wrap">
        <Link to="/orders" className="font-label-md text-label-md text-primary font-bold hover:underline">← My orders</Link>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {o.order_number} · {o.restaurant.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg items-start">
        {/* map + status */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex items-center justify-between gap-space-md">
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{headline}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{STATUS_LABEL[o.status]}</p>
              {o.reject_reason && <p className="font-body-sm text-body-sm text-error mt-1">{o.reject_reason}</p>}
            </div>
            {eta !== null && (
              <div className="text-right shrink-0">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Estimated arrival</p>
                <p className="font-headline-lg text-headline-lg font-bold text-primary tabular-nums">{clock(arrival)}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">in about {eta} min</p>
              </div>
            )}
          </div>

          {!closed && (
            <div className="h-[22rem] sm:h-[28rem] rounded-2xl overflow-hidden shadow-sm border border-surface-container-low">
              <TrackingMap branch={o.branch} dropoff={o.dropoff} rider={o.rider} status={o.status} onRoute={setRoute} />
            </div>
          )}

          {!closed && o.branch && o.dropoff && (!o.branch.lat || !o.dropoff.lat) && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Map positions aren&apos;t available for this order.</p>
          )}
        </div>

        {/* steps, driver, receipt */}
        <div className="lg:col-span-2 flex flex-col gap-space-md">
          {!closed && (
            <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg">
              <ol className="flex flex-col">
                {STEPS.map(([key, label, ic], i) => {
                  const reached = i <= idx;
                  const t = o.timeline[key];
                  return (
                    <li key={key} className="flex gap-space-md">
                      <div className="flex flex-col items-center">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            reached ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-secondary"
                          } ${i === idx && !done ? "ring-4 ring-primary-container/30" : ""}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{reached && i < idx ? "check" : ic}</span>
                        </span>
                        {i < STEPS.length - 1 && <span className={`w-0.5 flex-1 min-h-6 ${i < idx ? "bg-primary-container" : "bg-surface-container-high"}`} />}
                      </div>
                      <div className="pb-space-md">
                        <p className={`font-label-md text-label-md ${reached ? "font-bold text-on-surface" : "text-secondary"}`}>{label}</p>
                        {t && <p className="font-body-sm text-[12px] text-on-surface-variant">{clock(t)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {o.rider && !closed && (
            <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md flex items-center gap-space-md">
              <span className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container text-[26px]">two_wheeler</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-lg text-label-lg font-bold text-on-surface">{o.rider.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">
                  {o.rider.vehicle_type}
                  {o.rider.license_plate ? ` · ${o.rider.license_plate}` : ""}
                  {o.rider.rating ? ` · ★ ${o.rider.rating.toFixed(1)}` : ""}
                </p>
              </div>
              {o.rider.phone && (
                <a href={`tel:${o.rider.phone}`} className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center" aria-label="Call driver">
                  <span className="material-symbols-outlined">call</span>
                </a>
              )}
            </section>
          )}

          <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Order details</h2>
            {o.items.map((i, k) => (
              <div key={k} className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">{i.quantity} × {i.name}</p>
                  {i.options.length > 0 && <p className="font-body-sm text-[12px] text-on-surface-variant">{i.options.join(", ")}</p>}
                </div>
                <span className="font-label-md text-label-md font-bold shrink-0">{fmt(i.line_total)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-surface-container-low pt-space-sm font-headline-sm text-headline-sm font-bold text-on-surface">
              <span>Total</span>
              <span>{fmt(o.total)}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {o.payment_method === "cash" ? "Cash on delivery" : o.payment_method === "aba_khqr" ? "ABA PAY (KHQR)" : "Card"}
              {o.is_paid ? " · paid" : ""}
            </p>
            {o.dropoff && (
              <p className="font-body-sm text-body-sm text-on-surface-variant flex gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary-container">location_on</span>
                <span>
                  {o.dropoff.address}
                  {o.dropoff.details ? ` · ${o.dropoff.details}` : ""}
                </span>
              </p>
            )}
          </section>
        </div>
      </div>
    </>,
  );
};

export default OrderTrackingPage;