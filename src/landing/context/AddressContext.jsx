import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { useLocation } from "react-router-dom";

import { cartRequest } from "../api/cartApi";
import { getCustomerToken } from "../api/publicApi";

// The signed-in customer's saved addresses and which one is currently selected for delivery.
const SELECTED_KEY = "delivery_address_id";

const AddressContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAddresses = () => useContext(AddressContext);

const readSelected = () => {
  try {
    return Number(localStorage.getItem(SELECTED_KEY)) || null;
  } catch {
    return null;
  }
};

export function AddressProvider({ children }) {
  useLocation(); // notice login / logout between pages
  const [, bump] = useReducer((n) => n + 1, 0);
  const token = getCustomerToken();
  const [addresses, setAddresses] = useState([]);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(readSelected);

  useEffect(() => {
    window.addEventListener("auth-changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("auth-changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    cartRequest("my/addresses")
      .then((res) => alive && setAddresses(res.data))
      .catch(() => alive && setAddresses([]))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [token]);

  const list = useMemo(() => (token ? addresses : []), [token, addresses]);
  // selected address falls back to the default, then the newest one
  const selected = list.find((a) => a.id === selectedId) ?? list.find((a) => a.is_default) ?? list[0] ?? null;

  const select = useCallback((id) => {
    setSelectedId(id);
    try {
      localStorage.setItem(SELECTED_KEY, String(id));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // after the map modal saved a new address
  const added = useCallback(
    (res) => {
      setAddresses(res.data);
      if (res.id) select(res.id);
    },
    [select],
  );

  const remove = useCallback(async (id) => {
    const res = await cartRequest(`my/addresses/${id}`, "DELETE");
    setAddresses(res.data);
  }, []);

  const value = useMemo(
    () => ({ addresses: list, selected, select, added, remove, ready: token ? ready : true, signedIn: Boolean(token) }),
    [list, selected, select, added, remove, ready, token],
  );
  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}