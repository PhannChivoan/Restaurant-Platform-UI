import { useSyncExternalStore } from "react";

/*
 * The one promo code a customer is using across their carts. A code applied to one restaurant's cart
 * is not offered again on the other carts (the box is hidden and no discount is shown there), and the
 * rule keeps holding after that first order is placed, until every cart has been checked out.
 *
 * { restaurantId, code, name, discount } | null  - kept in sessionStorage so a reload does not lose it.
 */
const KEY = "applied_promo";
const listeners = new Set();

const read = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY));
    return raw && raw.restaurantId && raw.code ? raw : null;
  } catch {
    return null;
  }
};

let current = read();

const emit = () => listeners.forEach((fn) => fn());

export const getPromo = () => current;

export const setPromo = (promo) => {
  current = promo;
  try {
    if (promo) sessionStorage.setItem(KEY, JSON.stringify(promo));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the code still works for this page view */
  }
  emit();
};

export const clearPromo = () => {
  if (current) setPromo(null);
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** The shared promo plus what it means for one cart: applied here, or blocked because another cart has it. */
export const usePromoFor = (restaurantId) => {
  const promo = useSyncExternalStore(subscribe, () => current);

  return {
    promo,
    applied: promo && promo.restaurantId === restaurantId ? promo : null,
    blocked: Boolean(promo && promo.restaurantId !== restaurantId),
  };
};
