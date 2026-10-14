import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCartStore } from "../context/CartContext";
import { fmt } from "../hooks/useCart";

// Bottom-right cart button + panel listing every cart (one per restaurant).
// It only appears once something has been added.
const FloatingCart = () => {
  const { carts, totalCount, setQuantity, clearCart, lastAdded, error } = useCartStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  // flash the button when a dish is added
  useEffect(() => {
    if (!lastAdded) return;
    const on = setTimeout(() => setPulse(true), 0);
    const off = setTimeout(() => setPulse(false), 700);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [lastAdded]);

  if (totalCount === 0 || pathname.startsWith("/checkout") || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const go = (id) => {
    setOpen(false);
    navigate(`/checkout/${id}`);
  };

  return (
    <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 flex flex-col items-end gap-space-sm">
      {open && (
        <div className="w-[min(92vw,380px)] max-h-[70vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-low p-space-md flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Your carts ({carts.length})
            </h3>
            <button type="button" aria-label="Close cart" onClick={() => setOpen(false)}>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          {carts.map((c) => (
            <section key={c.restaurant.id} className="bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/order/shop?shop=${c.restaurant.id}`}
                  onClick={() => setOpen(false)}
                  className="font-label-lg text-label-lg font-bold text-on-surface hover:text-primary truncate"
                >
                  {c.restaurant.name}
                </Link>
                <button
                  type="button"
                  onClick={() => clearCart(c.restaurant.id)}
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-error shrink-0"
                >
                  Clear
                </button>
              </div>
              {c.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{i.name}</p>
                    {i.options?.length > 0 && (
                      <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{i.options.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-surface-container-lowest rounded-full px-1.5 py-0.5">
                      <button
                        type="button"
                        className="w-5 h-5 font-bold text-on-surface-variant hover:text-primary"
                        onClick={() => setQuantity(c.restaurant.id, i.id, i.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="px-1.5 font-label-sm text-label-sm font-bold">{i.quantity}</span>
                      <button
                        type="button"
                        className="w-5 h-5 font-bold text-on-surface-variant hover:text-primary"
                        onClick={() => setQuantity(c.restaurant.id, i.id, i.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="w-14 text-right font-label-md text-label-md font-bold">{fmt(i.line_total)}</span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => go(c.restaurant.id)}
                className="mt-1 w-full py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold flex items-center justify-between px-space-md transition-colors"
              >
                <span>Checkout</span>
                <span>{fmt(c.subtotal)}</span>
              </button>
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-label={`Open cart, ${totalCount} item${totalCount === 1 ? "" : "s"}`}
        onClick={() => setOpen((o) => !o)}
        className={`relative w-16 h-16 rounded-full bg-primary-container hover:bg-primary text-on-primary shadow-xl flex items-center justify-center transition-transform ${
          pulse ? "scale-125" : "scale-100"
        }`}
      >
        <span className="material-symbols-outlined text-[30px]">shopping_bag</span>
        <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-on-surface text-surface-container-lowest font-label-sm text-label-sm font-bold flex items-center justify-center">
          {totalCount}
        </span>
      </button>
    </div>
  );
};

export default FloatingCart;