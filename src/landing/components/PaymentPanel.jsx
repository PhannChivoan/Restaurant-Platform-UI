import { useCallback, useEffect, useRef, useState } from "react";

import { cartRequest } from "../api/cartApi";
import CardForm from "./CardForm";

const QR_SECONDS = 60;

const Spinner = ({ className = "text-[44px]" }) => (
  <span className={`material-symbols-outlined animate-spin text-primary-container ${className}`} aria-label="Loading">
    progress_activity
  </span>
);

// Pays an already-created order.
//   aba_khqr -> ABA PayWay QR (generate-qr): big white card with the QR, a 1-minute countdown at its top-right corner,
//               and a "Return back to checkout" button
//   card     -> the card form (CardForm)
// Leaving (button or timeout) cancels the unpaid order, puts its dishes back in the cart and calls onCancel.
const PaymentPanel = ({ order, method, onPaid, onCancel }) => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState(QR_SECONDS);
  const [leavingNow, setLeavingNow] = useState(false);
  const leaving = useRef(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await cartRequest(`payments/orders/${order.id}/pay`, "POST", { method });
        if (alive) setInfo(res);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }, 0); // deferred so React StrictMode does not start two payments
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [order.id, method]);

  const leave = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    setLeavingNow(true);
    try {
      const res = await cartRequest(`payments/orders/${order.id}/cancel`, "POST");
      if (res.paid) return onPaid(order); // paid in the last second
      onCancel(res);
    } catch (e) {
      leaving.current = false;
      setLeavingNow(false);
      setError(e.message);
    }
  }, [order, onPaid, onCancel]);

  // qr: ask PayWay (through our server) every 3 s until it approves
  useEffect(() => {
    if (info?.type !== "qr") return;
    const timer = setInterval(async () => {
      try {
        const s = await cartRequest(`payments/orders/${order.id}/status`);
        if (s.paid) onPaid(order);
      } catch {
        /* keep trying */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [info, order, onPaid]);

  // qr: 1-minute countdown from a fixed deadline, then back to checkout
  useEffect(() => {
    if (info?.type !== "qr") return;
    const deadline = Date.now() + QR_SECONDS * 1000;
    const tick = setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        leave();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [info, leave]);

  if (method === "card" && info?.type === "card_form") {
    return <CardForm order={order} onPaid={onPaid} onCancel={leave} cancelling={leavingNow} />;
  }

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
  const mm = String(Math.floor(Math.max(left, 0) / 60));
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  const card = "w-[min(94vw,30rem)] bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.25)]";

  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center">
      {/* getting the QR from PayWay */}
      {loading && !error && (
        <div className={`${card} h-[26rem] flex flex-col items-center justify-center`}>
          <Spinner className="text-[56px]" />
        </div>
      )}

      {error && !info && (
        <div className={`${card} p-space-xl text-center flex flex-col gap-space-md`}>
          <p className="font-body-md text-body-md text-error">{error}</p>
          <button
            type="button"
            onClick={leave}
            disabled={leavingNow}
            className="w-full min-h-[56px] bg-surface-container-low hover:bg-surface-container rounded-xl font-label-lg text-label-lg font-bold text-on-surface flex items-center justify-center gap-2"
          >
            {leavingNow ? <Spinner className="text-[24px]" /> : "Return back to checkout"}
          </button>
        </div>
      )}

      {info?.type === "qr" && (
        <div className={`${card} px-space-xl pt-space-xl pb-space-lg flex flex-col items-center gap-space-lg`}>
          <div className="w-full max-w-[20rem] flex flex-col items-end gap-1">
            {/* countdown sits ABOVE the QR, never on top of it: anything covering a corner of the QR stops it scanning */}
            <span
              className={`font-headline-sm text-headline-sm font-bold tabular-nums ${left <= 10 ? "text-error" : "text-on-surface"}`}
              aria-label="Time left to pay"
            >
              {mm}:{ss}
            </span>
            {info.qr_image ? (
              // PayWay's own QR card (template4_color), shown as sent
              <img src={info.qr_image} alt="ABA PAY KHQR code" className="w-full h-auto block bg-white" />
            ) : (
              <p className="font-body-sm text-body-sm break-all bg-surface-container-low p-space-sm rounded-lg">{info.qr_string}</p>
            )}          </div>
          {isMobile && info.deeplink && (
            <a
              href={info.deeplink}
              className="w-full min-h-[56px] flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold"
            >
              Open ABA Mobile
            </a>
          )}
          <button
            type="button"
            onClick={leave}
            disabled={leavingNow}
            className="w-full min-h-[56px] px-space-xl bg-surface-container-low hover:bg-surface-container disabled:opacity-70 rounded-xl font-label-lg text-label-lg font-bold text-on-surface flex items-center justify-center gap-2"
          >
            {leavingNow ? <Spinner className="text-[24px]" /> : "Return back to checkout"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPanel;