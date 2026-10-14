import { getAccessToken } from "../store/access_token";
import { request } from "./request";

// The admin shell (header + sidebar) needs the profile, the menu modules and the notifications.
// One request fetches all three; the header and the sidebar share the same answer.
let shared = null; // { token, at, promise }

export const loadAdminBootstrap = () => {
  const token = getAccessToken();
  if (shared && shared.token === token && Date.now() - shared.at < 60 * 1000) return shared.promise;
  const promise = request("admin/bootstrap", "GET").then((res) => {
    if (!res?.user) shared = null; // failed: let the next caller try again
    return res;
  });
  shared = { token, at: Date.now(), promise };
  return promise;
};

export const resetAdminBootstrap = () => {
  shared = null;
};