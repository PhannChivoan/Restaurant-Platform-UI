import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { useLocation } from "react-router-dom";

import { cartRequest, clearGuestToken, getGuestToken } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";

/*
 * Multi-cart store: one cart per restaurant, each checked out on its own.
 * Every cart lives in the database (no cart data in the browser):
 *   - signed in -> the customer's carts
 *   - guest     -> carts tied to an anonymous id, merged into the account at login
 * Shape: { restaurant:{id,name,logo_url}, items:[{id,menu_item_id,name,options,modifier_ids,unit_price,quantity,line_total,image_url}], subtotal, count }
 */
const CartContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useCartStore = () => useContext(CartContext);

export function CartProvider({ children }) {
  useLocation(); // re-render on navigation so a login / logout is noticed
  const [, bump] = useReducer((n) => n + 1, 0);
  const token = getCustomerToken();

  const [carts, setCarts] = useState([]);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [lastAdded, setLastAdded] = useState(0); // changes on every add, used to flash the floating button

  useEffect(() => {
    // carts used to be kept in localStorage; drop the old copies
    try {
      localStorage.removeItem("carts_local_v1");
      localStorage.removeItem("cart_v1");
    } catch {
      /* storage unavailable */
    }
    window.addEventListener("auth-changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("auth-changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  // (Re)load from the database whenever the identity changes. After login the guest cart is merged first.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const guest = token ? getGuestToken({ create: false }) : null;
        const res = guest
          ? await cartRequest("cart/merge", "POST", { guest_token: guest })
          : await cartRequest("cart");
        if (guest) clearGuestToken();
        if (alive) setCarts(res.data);
      } catch {
        if (alive) setCarts([]);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const run = useCallback(async (fn) => {
    setError("");
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  // spec: { menuItemId, quantity, modifierIds, restaurant:{id,...} }
  const addItem = useCallback(
    (spec) =>
      run(async () => {
        if (!spec.menuItemId || !spec.restaurant?.id) throw new Error("This dish can't be added right now.");
        const res = await cartRequest("cart/items", "POST", {
          menu_item_id: spec.menuItemId,
          quantity: spec.quantity ?? 1,
          selected_modifiers: spec.modifierIds ?? [],
        });
        setCarts(res.data);
        setActiveId(spec.restaurant.id);
        setLastAdded(Date.now());
      }),
    [run],
  );

  const setQuantity = useCallback(
    (restaurantId, itemId, quantity) =>
      run(async () => {
        const res =
          quantity <= 0
            ? await cartRequest(`cart/items/${itemId}`, "DELETE")
            : await cartRequest(`cart/items/${itemId}`, "PUT", { quantity });
        setCarts(res.data);
      }),
    [run],
  );

  const clearCart = useCallback(
    (restaurantId) =>
      run(async () => {
        const res = await cartRequest(`cart/${restaurantId}`, "DELETE");
        setCarts(res.data);
      }),
    [run],
  );

  // after a checkout / cancelled payment the server already returned the fresh carts
  const replaceServerCarts = useCallback((data) => setCarts(data), []);

  const totalCount = carts.reduce((s, c) => s + c.count, 0);

  const value = useMemo(
    () => ({
      carts,
      totalCount,
      activeId,
      setActiveId,
      addItem,
      setQuantity,
      clearCart,
      replaceServerCarts,
      error,
      lastAdded,
      ready,
    }),
    [carts, totalCount, activeId, addItem, setQuantity, clearCart, replaceServerCarts, error, lastAdded, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}