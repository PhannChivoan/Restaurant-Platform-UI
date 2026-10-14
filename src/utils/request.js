import axios from "axios";
import { Config } from "./config";
import { getAccessToken, removeAccessToken } from "../store/access_token";
import { topProgress } from "./topProgress";
import { getBranchId } from "./branchStore";

/*
 * API helper with a small cache so unchanged data is not requested again:
 *   - GET answers are kept in memory for a few seconds (longer for data that rarely changes, none for live data);
 *   - identical GETs that are already in flight share one request;
 *   - any write (POST / PUT / PATCH / DELETE) clears the cache, so lists are fresh after a save;
 *   - when the cache has expired the server is asked with the ETag, and answers "304 Not Modified" without a body
 *     if nothing changed (the browser does that automatically).
 * Pass { fresh: true } to skip the cache for one call, or { keepCache: true } on a write that must not clear it.
 */
const SHORT = 30 * 1000;
const LONG = 5 * 60 * 1000;
const LONG_PATHS = /^(navigation-items|auth\/me|restaurant-categories|public\/categories|settings|permissions|roles|access-windows)/;
const LIVE_PATHS = /^(dispatch|deliveries|orders\/queue|kitchen|rider\/|admin\/notifications|analytics\/live)/;

const ttlFor = (url) => {
  if (LIVE_PATHS.test(url)) return 0;
  if (/^dashboard\/overview/.test(url)) return 15 * 1000;
  if (LONG_PATHS.test(url)) return LONG;
  return SHORT;
};

// data that belongs to one branch: the selected branch (header dropdown) filters these calls
const BRANCH_GET = /^(orders|kitchen\/metrics|menu-items|menu-categories|dashboard\/overview)(\?|$|\/(queue|completed)(\?|$))/;
const BRANCH_POST = /^restaurants\/\d+\/(items|categories)$/;

const withBranch = (url) => {
  const branch = getBranchId();
  if (!branch || !BRANCH_GET.test(url) || /[?&]branch_id=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}branch_id=${branch}`;
};

const cache = new Map(); // "token|url" -> { data, at }
const inflight = new Map();
const copy = (v) => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export const clearApiCache = () => {
  cache.clear();
  inflight.clear();
};

export const request = (url = "", method = "", data = {}, options = {}) => {
  const accessToken = getAccessToken();
  const verb = (method || "GET").toUpperCase();
  const isGet = verb === "GET";
  if (isGet) url = withBranch(url);
  else if (verb === "POST" && getBranchId() && BRANCH_POST.test(url)) {
    // new dishes / categories go to the branch being managed
    if (data instanceof FormData) {
      if (!data.has("branch_id")) data.append("branch_id", getBranchId());
    } else if (data && typeof data === "object" && !data.branch_id) {
      data = { ...data, branch_id: getBranchId() };
    }
  }
  const key = isGet ? `${accessToken ?? ""}|${url}` : null;

  if (isGet && !options.fresh) {
    const ttl = ttlFor(url);
    const hit = cache.get(key);
    if (ttl > 0 && hit && Date.now() - hit.at < ttl) return Promise.resolve(copy(hit.data));
    const pending = inflight.get(key);
    if (pending) return pending.then(copy);
  }

  const finishProgress = topProgress.start();

  var headers = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (data instanceof FormData) {
    headers = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let ok = false;
  const promise = axios({
    url: Config.BASE_URL + url,
    method: method,
    data: isGet ? undefined : data,
    headers: {
      ...headers,
    },
  })
    .then((response) => {
      ok = true;
      return response.data;
    })
    .catch((error) => {
      if (error.response) {
        const isAdmin = window.location.pathname.startsWith("/admin");
        const loginPath = isAdmin ? "/admin/login" : "/login";
        // Only an expired/invalid admin session should bounce to the admin login;
        // public storefront calls never carry a token and must not redirect.
        if (
          error.response.status === 401 &&
          accessToken &&
          window.location.pathname !== loginPath
        ) {
          clearApiCache();
          removeAccessToken();
          localStorage.removeItem("profile");
          window.location.href = loginPath;
        }
        return error.response.data;
      } else {
        return { message: "Network Error" };
      }
    })
    .then((result) => {
      if (isGet) {
        inflight.delete(key);
        if (ok && ttlFor(url) > 0) cache.set(key, { data: copy(result), at: Date.now() });
      } else if (ok && !options.keepCache) {
        clearApiCache(); // something changed: never serve stale lists after a save
      }
      return result;
    })
    .finally(() => {
      finishProgress();
    });

  if (isGet) inflight.set(key, promise);
  return promise;
};

export default request;