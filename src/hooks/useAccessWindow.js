import { useEffect, useState } from "react";

import { request } from "../utils/request";

/*
 * Access time windows (/admin/settings/access-windows) decide when a role may work.
 * The API refuses operational calls outside the window, and this hook surfaces that
 * decision so the shell can explain it. It also picks up the 403 the request helper
 * emits, which keeps the state correct when the window closes while the tab is open.
 */
const useAccessWindow = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const res = await request("access-windows/status", "GET");
    setStatus(res?.is_restricted ? res : null);
    setLoading(false);
    return res;
  };

  useEffect(() => {
    // loaded inside a microtask so the first paint is not a synchronous setState
    const kickoff = Promise.resolve().then(refresh);

    // the API pushes the reason whenever it rejects a call
    const onBlocked = (event) => setStatus(event.detail);

    // re-check when the admin comes back to the tab: a window may have opened/closed
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("platform:access-window", onBlocked);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      kickoff.catch(() => {});
      window.removeEventListener("platform:access-window", onBlocked);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return {
    loading,
    status,
    /** true only when a window exists for this role AND it is closed right now */
    isBlocked: Boolean(status && status.is_restricted && !status.is_open),
    refresh,
  };
};

export default useAccessWindow;