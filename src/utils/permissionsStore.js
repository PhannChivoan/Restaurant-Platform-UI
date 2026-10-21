import { useSyncExternalStore } from "react";

/*
 * The signed-in role's "<page>.<action>" permissions (from admin/bootstrap) and the page that is
 * open, shared with any component:
 *
 *   const { can } = usePermissions();      can("delete")  ->  true / false for the current page
 *   <Can action="update"> ...buttons... </Can>
 *
 * The API enforces the same rules; this only decides what to show.
 */
let state = { perms: null, page: null };
const listeners = new Set();

export const setPermissionState = (perms, page) => {
  if (state.perms === perms && state.page === page) return;
  state = { perms, page };
  listeners.forEach((fn) => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const usePermissions = () => {
  const { perms, page } = useSyncExternalStore(subscribe, () => state);

  // perms === null: not loaded yet (or an old API): show everything, the API still refuses
  const can = (action, pageKey = page) =>
    perms === null || perms.includes("*") || perms.includes(`${pageKey}.${action}`);

  return { can, perms, page };
};
