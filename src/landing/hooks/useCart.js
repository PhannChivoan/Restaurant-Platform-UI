import { useCallback, useEffect, useRef, useState } from "react";

import { useCartStore } from "../context/CartContext";

export const fmt = (n) => `$${n.toFixed(2)}`;

const label = (i) => (i.options?.length ? `${i.name} (${i.options.join(", ")})` : i.name);

/**
 * Sidebar view of the multi-cart store: `items` and the totals belong to the ACTIVE cart
 * (the restaurant being browsed / last added to). All carts are in `carts`.
 * The promo code is display-only; the server prices the order.
 */
export default function useCart() {
  const store = useCartStore();
  const { carts, activeId, setActiveId, addItem, setQuantity, clearCart } = store;

  const active = carts.find((c) => c.restaurant.id === activeId) ?? carts[0] ?? null;

  const [discount, setDiscount] = useState(0);
  const [voucherVisible, setVoucherVisible] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [bounce, setBounce] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const applyPromoWith = useCallback((raw) => {
    const val = (raw || "").trim().toUpperCase();
    if (val === "") {
      setDiscount(0);
      setVoucherVisible(false);
    } else {
      setDiscount(val === "HUNGRY5" ? 5.0 : 2.0);
      setVoucherVisible(true);
    }
  }, []);

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