import { useSyncExternalStore } from "react";

/*
 * The branch the admin is working in ("" = all branches). Kept outside React so request.js can read it;
 * pages remount (RootLayout key) and the API cache is cleared whenever it changes.
 */
const KEY = "admin_branch_id";
const read = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

let current = read();
const listeners = new Set();

export const getBranchId = () => current;

export const setBranchId = (id) => {
  const next = id ? String(id) : "";
  if (next === current) return;
  current = next;
  try {
    if (next) localStorage.setItem(KEY, next);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the choice just lasts for this tab */
  }
  listeners.forEach((fn) => fn());
};

export const subscribeBranch = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useBranchId = () => useSyncExternalStore(subscribeBranch, getBranchId, getBranchId);