import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import { useCartStore } from "../context/CartContext";
import { useAddresses } from "../context/AddressContext";
import AddressMapModal from "../components/AddressMapModal";
import PaymentPanel from "../components/PaymentPanel";
import { fmt } from "../hooks/useCart";

const PAYMENTS = [
  { id: "cash", icon: "payments", title: "Cash on delivery", hint: "Pay the rider when your food arrives" },
  { id: "aba_khqr", icon: "qr_code_scanner", title: "ABA PAY (KHQR)", hint: "Scan the QR with ABA Mobile or any KHQR app" },
  { id: "card", icon: "credit_card", title: "Credit / debit card", hint: "Visa or Mastercard — enter your card details" },
];

const field =
  "w-full px-space-md py-space-sm bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.4)] transition-all";

const Card = ({ icon, title, action, children }) => (
  <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
    <div className="flex items-center justify-between gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary-container text-[22px]">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const Err = ({ msg }) => (msg ? <p className="font-body-sm text-body-sm text-error mt-1">{msg}</p> : null);

// One restaurant's cart -> address, contact, payment -> order. Each cart is checked out on its own.
const CheckoutPage = () => {
  const { restaurantId } = useParams();
  const rid = Number(restaurantId);
  const navigate = useNavigate();
  const store = useCartStore();
  const cart = store.carts.find((c) => c.restaurant.id === rid);
  const signedIn = Boolean(getCustomerToken());

  const book = useAddresses();
  const [promo, setPromo] = useState({ input: "", applied: null, busy: false, error: "" }); // applied: { code, name, discount }
  const [unitEdits, setUnitEdits] = useState({}); // address id -> floor / house number typed on this page
  const [editing, setEditing] = useState(null); // null = closed, "new" = add, or the address being edited
  const [form, setForm] = useState({
    phone: "",
    payment_method: "cash",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [placed, setPlaced] = useState(null);
  const [paying, setPaying] = useState(null); // { order, method } while an online payment is in progress
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k) => fieldErrors[k]?.[0];

  // Checkout is the one step that needs an account.
  useEffect(() => {
    if (!signedIn) navigate("/login", { replace: true, state: { from: `/checkout/${rid}` } });
  }, [signedIn, navigate, rid]);

  // Prefill the phone number from the account.
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    cartRequest("auth/me")
      .then((u) => {
        if (!alive) return;
        setForm((f) => ({ ...f, phone: f.phone || u.phone || "" }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const applyPromo = async () => {
    const code = promo.input.trim();
    if (!code || promo.busy) return;
    setPromo((p) => ({ ...p, busy: true, error: "" }));
    try {
      const r = await cartRequest(`cart/${rid}/coupon`, "POST", { code });
      setPromo({ input: "", applied: { code: r.code, name: r.name, discount: r.discount }, busy: false, error: "" });
    } catch (err) {
      setPromo((p) => ({ ...p, busy: false, applied: null, error: err.message }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    setFieldErrors({});
    try {
      if (!book.selected) {
        setFormError("Please add or choose a delivery address.");
        setBusy(false);
        return;
      }
      const unit = (unitEdits[book.selected.id] ?? book.selected.details ?? "").trim();
      const body = { ...form, address_id: book.selected.id, address_details: unit, coupon_code: promo.applied?.code || undefined, notes: form.notes || undefined };
      const res = await cartRequest(`cart/${rid}/checkout`, "POST", body);
      store.replaceServerCarts(res.data);
      if (form.payment_method === "cash") setPlaced(res.order);
      else setPaying({ order: res.order, method: form.payment_method });
    } catch (e2) {
      if (e2.status === 401) {
        navigate("/login", { state: { from: `/checkout/${rid}` } });
        return;
      }
      setFieldErrors(e2.fieldErrors || {});
      if (!Object.keys(e2.fieldErrors || {}).length) setFormError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const shell = (children) => (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[1100px] mx-auto px-margin py-space-lg">{children}</div>
    </main>
  );

  if (paying && !placed) {
    return shell(
      <PaymentPanel
        order={paying.order}
        method={paying.method}
        onPaid={(o) => {
          setPlaced({ ...paying.order, ...o, payment_method: paying.method });
          setPaying(null);
        }}
        onCancel={(res) => {
          // back to the checkout form with the cart restored
          if (res?.data) store.replaceServerCarts(res.data);
          setPaying(null);
        }}
      />,
    );
  }

  if (placed) {
    return shell(
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-space-md">
        <span className="material-symbols-outlined text-tertiary text-[64px]">check_circle</span>
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface">Order placed!</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Order <strong>{placed.order_number}</strong> · {fmt(Number(placed.total))} ·{" "}
          {PAYMENTS.find((p) => p.id === placed.payment_method)?.title}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          The restaurant has been notified and will confirm shortly.
        </p>
        <div className="flex flex-wrap justify-center gap-space-sm">
          {store.carts.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/checkout/${store.carts[0].restaurant.id}`)}
              className="px-space-lg py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold"
            >
              Checkout next cart ({store.carts[0].restaurant.name})
            </button>
          )}
          <Link to={`/orders/${placed.id}`} className="px-space-lg py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold">
            Track order
          </Link>
          <Link to="/order" className="px-space-lg py-2.5 bg-surface-container-low rounded-xl font-label-lg text-label-lg font-bold text-on-surface">
            Keep browsing
          </Link>
        </div>
      </div>,
    );
  }

  if (!signedIn || !store.ready) {
    return shell(<p className="min-h-[50vh] flex items-center justify-center text-on-surface-variant">Loading…</p>);
  }

  if (!cart) {
    return shell(
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-space-md">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">This cart is empty</h1>
        <Link to="/order" className="text-primary font-bold hover:underline">
          Browse restaurants
        </Link>
      </div>,
    );
  }

  const others = store.carts.filter((c) => c.restaurant.id !== rid);

  return shell(
    <form onSubmit={submit} className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div>
          <Link to={`/order/shop?shop=${rid}`} className="font-label-md text-label-md text-primary font-bold hover:underline">
            ← Back to {cart.restaurant.name}
          </Link>
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">Checkout</h1>
        </div>
        {others.length > 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            You have {others.length} other cart{others.length === 1 ? "" : "s"} (
            {others.map((c, i) => (
              <span key={c.restaurant.id}>
                {i > 0 && ", "}
                <Link className="text-primary font-semibold hover:underline" to={`/checkout/${c.restaurant.id}`}>
                  {c.restaurant.name}
                </Link>
              </span>
            ))}
            ). Each is checked out separately.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg items-start">
        <div className="lg:col-span-3 flex flex-col gap-space-lg">
          <Card
            icon="location_on"
            title="Delivery address"
            action={
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="px-space-md py-1.5 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add_location_alt</span> Add address
              </button>
            }
          >
            {book.addresses.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                You have no saved addresses yet. Add one on the map and it will be saved for next time.
              </p>
            )}
            <div className="flex flex-col gap-space-xs">
              {book.addresses.map((a) => {
                const on = book.selected?.id === a.id;
                return (
                  <label
                    key={a.id}
                    className={`flex items-start gap-space-md p-space-md rounded-xl cursor-pointer border-2 transition-colors ${
                      on ? "border-primary-container bg-primary-container/10" : "border-transparent bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <input type="radio" name="address" checked={on} onChange={() => book.select(a.id)} className="accent-primary-container w-4 h-4 mt-1" />
                    <span className="material-symbols-outlined text-primary-container">
                      {a.label === "Home" ? "home" : a.label === "Office" ? "work" : "location_on"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-label-lg text-label-lg font-bold text-on-surface">{a.label}</span>
                      <span className="block font-body-sm text-body-sm text-on-surface-variant">{a.address}</span>
                      {a.details && (
                        <span className="block font-body-sm text-body-sm text-on-surface">{a.details}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${a.label} address`}
                      onClick={(e) => {
                        e.preventDefault();
                        setEditing(a);
                      }}
                      className="text-on-surface-variant hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${a.label} address`}
                      onClick={(e) => {
                        e.preventDefault();
                        book.remove(a.id);
                      }}
                      className="text-on-surface-variant hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </label>
                );
              })}
            </div>
            {book.selected && (
              <div>
                <label className="block font-label-md text-label-md font-semibold text-on-surface mb-1">
                  Floor / house number <span className="font-normal text-on-surface-variant">(optional)</span>
                </label>
                <input
                  className={field}
                  placeholder="e.g. Floor 3, Room 12 · House 45B · gate code 1234"
                  value={unitEdits[book.selected.id] ?? book.selected.details ?? ""}
                  onChange={(e) => setUnitEdits((u) => ({ ...u, [book.selected.id]: e.target.value }))}
                />
              </div>
            )}
            <textarea
              className={field}
              rows={2}
              placeholder="Note to the restaurant or rider (optional)"
              value={form.notes}
              onChange={set("notes")}
            />
          </Card>
          <Card icon="call" title="Contact number">
            <div>
              <input className={field} type="tel" placeholder="e.g. 012 345 678" value={form.phone} onChange={set("phone")} />
              <Err msg={err("phone")} />
            </div>
          </Card>

          <Card icon="payments" title="Payment method">
            <div className="flex flex-col gap-space-xs">
              {PAYMENTS.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-space-md p-space-md rounded-xl cursor-pointer border-2 transition-colors ${
                    form.payment_method === p.id
                      ? "border-primary-container bg-primary-container/10"
                      : "border-transparent bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={form.payment_method === p.id}
                    onChange={() => setForm((f) => ({ ...f, payment_method: p.id }))}
                    className="accent-primary-container w-4 h-4"
                  />
                  <span className="material-symbols-outlined text-primary-container">{p.icon}</span>
                  <span>
                    <span className="block font-label-lg text-label-lg font-bold text-on-surface">{p.title}</span>
                    <span className="block font-body-sm text-body-sm text-on-surface-variant">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <Err msg={err("payment_method")} />
          </Card>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2 lg:sticky lg:top-24 bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Your order from {cart.restaurant.name}</h2>
          <div className="flex flex-col gap-space-sm">
            {cart.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    {i.quantity} × {i.name}
                  </p>
                  {i.options?.length > 0 && (
                    <p className="font-body-sm text-[12px] text-on-surface-variant">{i.options.join(", ")}</p>
                  )}
                  {!i.available && <p className="font-body-sm text-[12px] text-error">No longer available</p>}
                </div>
                <span className="font-label-md text-label-md font-bold shrink-0">{fmt(i.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-container-low pt-space-sm flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-on-surface">{fmt(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span className="font-semibold text-tertiary">FREE</span>
            </div>
            {promo.applied && (
              <div className="flex justify-between text-tertiary font-semibold">
                <span className="flex items-center gap-1">
                  Promo {promo.applied.code}
                  <button type="button" onClick={() => setPromo((p) => ({ ...p, applied: null }))} className="text-on-surface-variant hover:text-error" aria-label="Remove promo code">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </span>
                <span>−{fmt(promo.applied.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-space-xs border-t border-surface-container-low font-headline-sm text-headline-sm font-bold text-on-surface">
              <span>Total</span>
              <span className="text-primary-container">{fmt(Math.max(0, cart.subtotal - (promo.applied?.discount ?? 0)))}</span>
            </div>
          </div>
          {!promo.applied && (
            <div className="flex flex-col gap-1">
              <div className="flex gap-space-xs">
                <input
                  className={field}
                  placeholder="Promo code"
                  value={promo.input}
                  onChange={(e) => setPromo((p) => ({ ...p, input: e.target.value.toUpperCase(), error: "" }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promo.busy || !promo.input.trim()}
                  className="shrink-0 px-space-lg rounded-lg bg-on-surface text-surface-container-lowest font-label-md text-label-md font-bold disabled:opacity-50 flex items-center justify-center min-w-[5rem]"
                >
                  {promo.busy ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : "Apply"}
                </button>
              </div>
              {promo.error && <p className="font-body-sm text-body-sm text-error">{promo.error}</p>}
            </div>
          )}
          {formError && <p className="font-body-sm text-body-sm text-error">{formError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[56px] bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md transition-all"
          >
            {busy ? "Placing order…" : `Place order • ${fmt(Math.max(0, cart.subtotal - (promo.applied?.discount ?? 0)))}`}
          </button>
        </aside>
      </div>
      {editing && (
        <AddressMapModal
          address={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(res) => {
            book.added(res);
            setEditing(null);
          }}
        />
      )}
    </form>,
  );
};

export default CheckoutPage;