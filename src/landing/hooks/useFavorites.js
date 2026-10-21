import { useCallback, useEffect, useSyncExternalStore } from "react";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";

// Favourite restaurants of the signed-in customer, kept in one shared store so every heart on the
// page (cards, store header, favourites tab) stays in step.
let state = { ids: [], items: [], loaded: false };
let loading = null;
const listeners = new Set();

const set = (next) => {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
};

const load = (force = false) => {
  if (!getCustomerToken()) {
    if (state.loaded || state.ids.length) set({ ids: [], items: [], loaded: false });
    return Promise.resolve();
  }
  if (state.loaded && !force) return Promise.resolve();
  if (!loading) {
    loading = cartRequest("my/favorites")
      .then((r) => set({ ids: r.ids ?? [], items: r.data ?? [], loaded: true }))
      .catch(() => {})
      .finally(() => {
        loading = null;
      });
  }
  return loading;
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const useFavorites = () => {
  const snapshot = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    load();
  }, []);

  const toggle = useCallback(async (restaurantId) => {
    if (!getCustomerToken()) return false; // the caller sends guests to the login page
    const on = state.ids.includes(restaurantId);
    set({ ids: on ? state.ids.filter((i) => i !== restaurantId) : [...state.ids, restaurantId] }); // instant
    try {
      await cartRequest(`my/favorites/${restaurantId}`, on ? "DELETE" : "POST");
      load(true);
    } catch {
      set({ ids: on ? [...state.ids, restaurantId] : state.ids.filter((i) => i !== restaurantId) }); // undo
    }
    return true;
  }, []);

  return { ids: snapshot.ids, items: snapshot.items, loaded: snapshot.loaded, toggle, has: (id) => snapshot.ids.includes(id) };
};

export default useFavorites;
