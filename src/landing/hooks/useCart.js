import { formatMoney } from "../../utils/platformSettings";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCartStore } from "../context/CartContext";
import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";
import { clearPromo, setPromo, usePromoFor } from "../promoStore";

export const fmt = (n) => `${formatMoney(n)}`;

const label = (i) => (i.options?.length ? `${i.name} (${i.options.join(", ")})` : i.name);

/**
 * Sidebar view of the multi-cart store: `items` and the totals belong to the ACTIVE cart
 * (the restaurant being browsed / last added to). All carts are in `carts`.
 * A promo code belongs to ONE cart: the server checks it, and the other carts neither show a discount
 * nor offer the promo box (see promoStore).
 */
export default function useCart() {
  const store = useCartStore();
  const { carts, activeId, setActiveId, addItem, setQuantity, clearCart } = store;

  const active = carts.find((c) => c.restaurant.id === activeId) ?? carts[0] ?? null;

  const { applied, blocked } = usePromoFor(active?.restaurant.id ?? null);
  const discount = applied?.discount ?? 0;
  const voucherVisible = Boolean(applied);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [bounce, setBounce] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const applyPromoWith = useCallback(
    async (raw) => {
      const code = (raw || "").trim().toUpperCase();
      setPromoError("");
      if (!code || !active) return;
      if (!getCustomerToken()) {
        setPromoError("Sign in to use a promo code.");
        return;
      }
      try {
        const r = await cartRequest(`cart/${active.restaurant.id}/coupon`, "POST", { code });
        setPromo({ restaurantId: active.restaurant.id, code: r.code, name: r.name, discount: r.discount });
        setPromoInput("");
      } catch (err) {
        setPromoError(err.message);
      }
    },
    [active],
  );

  const applyPromo = (code) => {
    setPromoInput(code);
    applyPromoWith(code);
  };
  const handleApply = () => applyPromoWith(promoInput);

  // add(name, price, menuItemId, { restaurantId, restaurantName, modifierIds, options, qty, imageUrl })
  const add = async (name, price, menuItemId = null, extra = {}) => {
    const ok = await addItem({
      menuItemId,
      name,
      unitPrice: price,
      options: extra.options ?? [],
      modifierIds: extra.modifierIds ?? [],
      quantity: extra.qty ?? 1,
      imageUrl: extra.imageUrl,
      restaurant: { id: extra.restaurantId, name: extra.restaurantName ?? "", logo_url: extra.logoUrl ?? null },
    });
    if (ok) {
      setBounce(true);
      timers.current.push(setTimeout(() => setBounce(false), 200));
    }
    return ok;
  };

  const items = (active?.items ?? []).map((i) => ({
    name: label(i),
    price: i.unit_price,
    qty: i.quantity,
    _id: i.id,
  }));

  const modify = (name, delta) => {
    const line = items.find((i) => i.name === name);
    if (line && active) setQuantity(active.restaurant.id, line._id, line.qty + delta);
  };

  const clear = () => active && clearCart(active.restaurant.id);

  const subtotal = active?.subtotal ?? 0;
  const total = Math.max(0, subtotal - (subtotal > 0 ? discount : 0));

  return {
    items,
    carts,
    activeId: active?.restaurant.id ?? null,
    setActiveId,
    restaurantId: active?.restaurant.id ?? null,
    restaurantName: active?.restaurant.name ?? "",
    discount,
    voucherVisible,
    promoInput,
    setPromoInput,
    promoBlocked: blocked,
    promoCode: applied?.code ?? "",
    promoError,
    removePromo: clearPromo,
    status: "idle",
    bounce,
    applyPromo,
    handleApply,
    add,
    clear,
    modify,
    subtotal,
    tax: 0,
    total,
    count: active?.count ?? 0,
    totalCount: store.totalCount,
    error: store.error,
  };
}