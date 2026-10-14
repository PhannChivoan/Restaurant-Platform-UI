import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import { useCartStore } from "../context/CartContext";
import PaymentPanel from "../components/PaymentPanel";
import { fmt } from "../hooks/useCart";

// Where the customer lands after the ABA PayWay card page. The result is always confirmed with PayWay.
const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const orderId = Number(params.get("order"));
  const cancelled = params.get("cancelled") === "1";
  const navigate = useNavigate();
  const store = useCartStore();
  const signedIn = Boolean(getCustomerToken());

  const [state, setState] = useState("checking"); // checking | paid | unpaid
  const [order, setOrder] = useState(null);
  const [retry, setRetry] = useState(null); // method being retried

  useEffect(() => {
    if (!signedIn) navigate("/login", { replace: true, state: { from: `/payment/result?order=${orderId}` } });
  }, [signedIn, navigate, orderId]);

  useEffect(() => {
    if (!signedIn || !orderId) return;
    let alive = true;
    let tries = 0;
    const check = async () => {
      try {
        const s = await cartRequest(`payments/orders/${orderId}/status`);
        if (!alive) return;
        setOrder({ id: orderId, order_number: s.order_number, total: s.total });
        if (s.paid) return setState("paid");
        if (cancelled || ++tries >= 10) return setState("unpaid");
        setTimeout(check, 2500); // PayWay can take a few seconds to confirm
      } catch {
        if (alive) setState("unpaid");
      }
    };
    check();
    return () => {
      alive = false;
    };
  }, [signedIn, orderId, cancelled]);

  const done = useCallback(() => setState("paid"), []);
  const wrap = (children) => (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[1100px] mx-auto px-margin py-space-xl min-h-[60vh] flex items-center justify-center">{children}</div>
    </main>
  );

  if (!signedIn || state === "checking") {
    return wrap(<p className="text-on-surface-variant">Confirming your payment with ABA PayWay…</p>);
  }

  if (retry && order) {
    return wrap(
      <PaymentPanel
        order={order}
        method={retry}
        onPaid={done}
        onCancel={(res) => {
          if (res?.data) store.replaceServerCarts(res.data);
          navigate(`/checkout/${res.restaurant_id}`, { replace: true });
        }}
      />,
    );
  }

  if (state === "paid" || state === "cash") {
    return wrap(
      <div className="text-center flex flex-col items-center gap-space-md">
        <span className="material-symbols-outlined text-tertiary text-[64px]">check_circle</span>
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface">
          {state === "paid" ? "Payment received!" : "Order placed!"}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Order <strong>{order?.order_number}</strong> · {fmt(Number(order?.total ?? 0))}
          {state === "cash" ? " · pay cash on delivery" : ""}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">The restaurant has been notified and will confirm shortly.</p>
        <Link to={`/orders/${orderId}`} className="px-space-lg py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold">
          Track order
        </Link>
      </div>,
    );
  }

  return wrap(
    <div className="text-center flex flex-col items-center gap-space-md">
      <span className="material-symbols-outlined text-error text-[64px]">error</span>
      <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
        {cancelled ? "Payment cancelled" : "We haven't received your payment"}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Your order {order?.order_number} is saved but not paid yet. The restaurant won&apos;t start it until payment is confirmed.
      </p>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <button type="button" onClick={() => setRetry("card")} className="px-space-lg py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold">
          Pay by card
        </button>
        <button type="button" onClick={() => setRetry("aba_khqr")} className="px-space-lg py-2.5 bg-surface-container-low rounded-xl font-label-md text-label-md font-bold text-on-surface">
          Scan ABA PAY QR
        </button>
      </div>
    </div>,
  );
};

export default PaymentResultPage;