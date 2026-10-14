import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CartItemList from "../components/CartItemList";
import AddressSelector from "../components/AddressSelector";
import CartSwitcher from "../components/CartSwitcher";
import { Config } from "../../utils/config";
import useCart, { fmt } from "../hooks/useCart";
import {
  fetchPublicRestaurants,
  fetchPublicRestaurant,
  peekPublicRestaurants,
  peekPublicRestaurant,
} from "../api/publicApi";

// Browsing is public; only checkout needs a customer login (see placeCartOrder).
const FILE_BASE = import.meta.env?.VITE_STORAGE_URL || `${Config.BASE_URL.replace(/\/api\/v1\/?$/, "")}/storage`;
const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'><rect width='100%' height='100%' fill='%23eee'/></svg>";

const getRestaurants = fetchPublicRestaurants;
const imgUrl = (path) =>
  !path ? PLACEHOLDER : /^https?:/.test(path) ? path : `${FILE_BASE}/${path}`;

/* ───────────────────────── Page ───────────────────────── */
const ShopPage = () => {
  const cart = useCart();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // API state
  const [restaurants, setRestaurants] = useState(() => peekPublicRestaurants() ?? []);
  const [shopId, setShopId] = useState(null); // restaurant id
  const [branchId, setBranchId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [activeCat, setActiveCat] = useState("all");
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState("");

  // order state


  const shop = useMemo(
    () => restaurants.find((r) => r.id === shopId),
    [restaurants, shopId]
  );
  const branch = useMemo(
    () => shop?.branches?.find((b) => b.id === branchId),
    [shop, branchId]
  );

  /* 2) pick a shop -> load its branches + menu (public, no login) */
  const selectShop = async (r, _list, confirmClear = true) => {
    if (confirmClear && r.id === shopId) return;
    setShopId(r.id);
    cart.setActiveId(r.id); // show this store's cart in the sidebar
    setActiveCat("all");
    setError("");
    if (confirmClear) setParams({ shop: String(r.id) }, { replace: true });

    const apply = (d) => {
      setRestaurants((list) => list.map((x) => (x.id === r.id ? { ...x, branches: d.branches } : x)));
      // the server says which branch this menu belongs to (the main branch unless one was asked for)
      setBranchId(d.branch_id ?? d.branches?.find((b) => b.is_active)?.id ?? d.branches?.[0]?.id ?? null);
      setMenu(
        d.categories.map((c) => ({
          ...c,
          menu_items: c.items.map((i) => ({ ...i, image: i.image_url, is_available: true })),
        })),
      );
    };

    // a menu seen before shows immediately and is refreshed behind the scenes
    const cached = peekPublicRestaurant(r.id);
    if (cached) {
      apply(cached);
      setLoadingMenu(false);
    } else {
      setBranchId(null);
      setMenu([]);
      setLoadingMenu(true);
    }

    try {
      apply(await fetchPublicRestaurant(r.id));
    } catch (e) {
      if (!cached) setError(e.message);
    } finally {
      setLoadingMenu(false);
    }
  };
  /* 2b) another branch of the same shop -> that branch's own menu */
  const changeBranch = async (bid) => {
    if (!shopId || bid === branchId) return;
    setBranchId(bid);
    setActiveCat("all");
    setError("");
    const apply = (d) =>
      setMenu(
        d.categories.map((c) => ({
          ...c,
          menu_items: c.items.map((i) => ({ ...i, image: i.image_url, is_available: true })),
        })),
      );
    const cached = peekPublicRestaurant(shopId, bid);
    if (cached) apply(cached);
    else {
      setMenu([]);
      setLoadingMenu(true);
    }
    try {
      apply(await fetchPublicRestaurant(shopId, bid));
    } catch (e) {
      if (!cached) setError(e.message);
    } finally {
      setLoadingMenu(false);
    }
  };
  /* 1) load all shops */
  useEffect(() => {
    let alive = true;
    getRestaurants()
      .then((res) => {
        if (!alive) return;
        const list = res || [];
        setRestaurants(list);
        const want = Number(params.get("shop")) || cart.restaurantId;
        const first = list.find((r) => r.id === want) || list[0];
        if (first) selectShop(first, list, false);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoadingShops(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 3) add item to cart (items with store options open their detail page first) */
  const [addingId, setAddingId] = useState(null); // dish whose + button is waiting for the server
  const addToCart = async (item) => {
    if (item.has_options) return navigate(`/order/item/${item.id}`);
    if (addingId) return;
    const price = Number(item.discounted_price ?? item.price);
    setAddingId(item.id);
    await cart.add(item.name, price, item.id, {
      restaurantId: shopId,
      restaurantName: shop?.name ?? "",
      logoUrl: shop?.logo_url ?? null,
      imageUrl: item.image_url,
    });
    setAddingId(null);
  };

  /* 4) checkout page: one cart (restaurant) at a time; the page itself asks for a login */
  const handleCheckout = () => {
    if (!cart.items?.length) return setError("Your cart is empty.");
    navigate(`/checkout/${cart.restaurantId}`);
  };
  const visibleCats = menu.filter((c) => activeCat === "all" || c.id === activeCat);
  const otherShops = restaurants.filter((r) => r.id !== shopId).slice(0, 3);

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* Top Sub-Bar */}
        <section className="w-full bg-surface-container-lowest shadow-sm z-30">
          <div className="max-w-[1280px] mx-auto px-margin py-space-sm flex flex-col md:flex-row items-center justify-between gap-space-sm">
            <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md w-full md:w-auto">
              <AddressSelector />
            </div>
            <div className="flex items-center gap-space-sm bg-primary-fixed/60 px-space-md py-1.5 rounded-full text-on-primary-fixed w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  local_activity
                </span>
                <span className="font-label-md text-label-md font-bold">
                  $5 OFF your first 3 orders!
                </span>
                <span className="font-body-sm text-body-sm hidden lg:inline">Use code:</span>
                <code className="px-space-xs py-0.5 bg-surface-container-lowest font-label-sm text-label-sm text-primary font-bold rounded">
                  HUNGRY5
                </code>
              </div>
              <button
                className="font-label-sm text-label-sm text-primary hover:underline font-semibold ml-space-xs"
                type="button"
                onClick={() => cart.applyPromo("HUNGRY5")}
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {/* Main */}
        <div className="max-w-[1280px] mx-auto px-margin py-space-lg w-full flex flex-col xl:flex-row gap-space-xl items-start relative">
          {/* Left column */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-space-lg">
            {(error || cart.error) && (
              <div className="bg-error-container text-on-error-container rounded-xl px-space-md py-space-sm flex items-center justify-between">
                <span className="font-body-sm text-body-sm">{error || cart.error}</span>
                <button type="button" onClick={() => setError("")}>
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {loadingShops && !shop && (
              <p className="font-body-sm text-on-surface-variant">Loading store…</p>
            )}

            {/* Active shop banner */}
            {shop && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-container-low">
                <div
                  className="relative h-48 w-full bg-cover bg-center overflow-hidden bg-primary-container/30"
                  style={shop.logo_url ? { backgroundImage: `url('${shop.logo_url}')` } : undefined}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/40 to-transparent"></div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    {shop.status === "verified" && (
                      <span className="bg-tertiary text-on-tertiary font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>{" "}
                        Verified Marketplace Tenant
                      </span>
                    )}
                    {branch && (
                      <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold">
                        {branch.name}
                      </span>
                    )}
                  </div>

                  {/* Branch switcher */}
                  {shop.branches?.length > 1 && (
                    <div className="absolute top-3 right-3">
                      <select
                        value={branchId ?? ""}
                        onChange={(e) => changeBranch(Number(e.target.value))}
                        className="bg-surface-container-lowest/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-on-surface font-label-sm text-label-sm font-bold"
                      >
                        {shop.branches.map((b) => (
                          <option key={b.id} value={b.id} disabled={!b.is_active}>
                            {b.name}
                            {!b.is_active ? " (closed)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-4 right-4 flex flex-col text-white">
                    <h1 className="font-headline-xl font-bold tracking-tight text-white">
                      {shop.name}
                    </h1>
                    <p className="font-body-sm text-surface-container-high">
                      {branch
                        ? `${branch.address}, ${branch.city}${branch.phone ? " • " + branch.phone : ""}`
                        : "No branch available"}
                    </p>
                  </div>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-space-xs overflow-x-auto px-space-md py-space-sm bg-surface-container-low scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveCat("all")}
                    className={
                      activeCat === "all"
                        ? "px-space-md py-1.5 rounded-full font-label-md text-label-md bg-primary-container text-on-primary font-bold shadow-sm shrink-0"
                        : "px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-lowest hover:bg-surface text-on-surface shadow-sm shrink-0 transition-colors font-semibold"
                    }
                  >
                    All Items
                  </button>
                  {menu.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCat(c.id)}
                      className={
                        activeCat === c.id
                          ? "px-space-md py-1.5 rounded-full font-label-md text-label-md bg-primary-container text-on-primary font-bold shadow-sm shrink-0"
                          : "px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-lowest hover:bg-surface text-on-surface shadow-sm shrink-0 transition-colors font-semibold"
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu sections */}
            {loadingMenu && (
              <p className="font-body-sm text-on-surface-variant">Loading menu…</p>
            )}
            {!loadingMenu && shop && menu.length === 0 && (
              <p className="font-body-sm text-on-surface-variant">
                This shop has no menu items yet.
              </p>
            )}

            {visibleCats.map((c) => {
              const items = (c.menu_items || []).filter((i) => i.is_available);
              if (!items.length) return null;
              return (
                <div key={c.id} className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                        {c.name}
                      </h3>
                      {c.description && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                    {items.map((item) => {
                      const price = Number(item.discounted_price ?? item.price);
                      const hasDiscount =
                        item.discounted_price != null &&
                        Number(item.discounted_price) < Number(item.price);
                      return (
                        <div
                          key={item.id}
                          className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col border border-surface-container-low group"
                        >
                          <div
                            className="relative h-40 w-full overflow-hidden cursor-pointer"
                            onClick={() => navigate(`/order/item/${item.id}`)}
                          >
                            <img
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              src={imgUrl(item.image)}
                            />
                            {item.is_featured && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-primary-container text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold shadow-sm">
                                  Featured
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-space-sm flex flex-col flex-1 justify-between gap-space-xs">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4
                                  className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer"
                                  onClick={() => navigate(`/order/item/${item.id}`)}
                                >
                                  {item.name}
                                </h4>
                                <span className="font-label-md text-label-md font-bold text-primary shrink-0">
                                  {hasDiscount && (
                                    <s className="text-on-surface-variant font-normal mr-1">
                                      {fmt(Number(item.price))}
                                    </s>
                                  )}
                                  {fmt(price)}
                                </span>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-low">
                              <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1">
                                {item.prep_time_minutes ? (
                                  <>
                                    <span className="material-symbols-outlined text-[14px]">timer</span>{" "}
                                    {item.prep_time_minutes} min
                                  </>
                                ) : null}
                              </span>
                              <button
                                className="w-8 h-8 rounded-full bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center transition-all shadow-sm active:scale-95"
                                type="button"
                                onClick={() => addToCart(item)}
                                disabled={addingId === item.id}
                              >
                                <span className={`material-symbols-outlined text-[20px] ${addingId === item.id ? "animate-spin" : ""}`}>
                                  {addingId === item.id ? "progress_activity" : "add"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Other stores */}
            {otherShops.length > 0 && (
              <div className="flex flex-col gap-space-md pt-space-sm">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-[24px]">
                      store
                    </span>{" "}
                    Browse Other Stores Nearby
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Order from neighboring tenant kitchens in separate orders
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  {otherShops.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => selectShop(r)}
                      className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group border border-surface-container-low cursor-pointer"
                    >
                      <div className="relative h-36 w-full overflow-hidden bg-primary-container/15 flex items-center justify-center">
                        {r.logo_url ? (
                          <img
                            alt={r.name}
                            src={r.logo_url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-primary-container text-[40px]">
                            storefront
                          </span>
                        )}
                      </div>
                      <div className="p-space-sm flex flex-col gap-1">
                        <h4 className="font-label-md text-label-md font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {r.name}
                        </h4>
                        <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                          {r.cuisine_type} • {r.active_branches_count ?? 0} Branches
                        </p>
                        <button
                          className="mt-1 w-full py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm font-bold transition-colors"
                          type="button"
                        >
                          View Store Menu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: cart */}
          <aside className="w-full xl:w-[380px] shrink-0 sticky top-24 self-start">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-low shadow-md p-space-lg flex flex-col gap-space-md">
              <div className="flex flex-col gap-1 pb-space-sm border-b border-surface-container-low">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[24px]">
                      shopping_bag
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                      Your Order
                    </h2>
                  </div>
                  <span
                    className="bg-primary-container/15 text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold"
                    id="cartCountBadge"
                  >
                    {cart.count} item{cart.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 bg-surface-container-low px-2.5 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-primary-container text-[16px]">
                    storefront
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-[12px] font-bold text-on-surface truncate">
                      Ordering from: {shop?.name ?? "—"}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {branch?.name ?? "No branch selected"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low/70 border border-surface-container-low p-2 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[11px] leading-tight text-on-surface-variant font-medium">
                  <strong>Multi-tenant marketplace:</strong> Orders are placed per individual shop
                  for separate fulfillment and fresh courier dispatch.
                </p>
              </div>

              <div
                className="flex flex-col gap-space-sm max-h-[300px] overflow-y-auto pr-1"
                id="cartItemList"
              >
                <CartSwitcher carts={cart.carts} activeId={cart.activeId} onSelect={cart.setActiveId} />
                <CartItemList items={cart.items} onModify={cart.modify} />
              </div>

              <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                <input
                  className="w-full bg-transparent px-space-sm font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none uppercase font-semibold"
                  id="cartPromoInput"
                  placeholder="Promo code (e.g. HUNGRY5)"
                  type="text"
                  value={cart.promoInput}
                  onChange={(e) => cart.setPromoInput(e.target.value)}
                />
                <button
                  className="bg-on-surface hover:bg-inverse-surface text-surface-container-lowest px-space-md py-1.5 rounded-md font-label-sm text-label-sm font-bold transition-colors"
                  type="button"
                  onClick={cart.handleApply}
                >
                  Apply
                </button>
              </div>

              <div className="flex flex-col gap-1.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-on-surface" id="cartSubtotal">
                    {fmt(cart.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Store Delivery Fee{" "}
                    <span className="material-symbols-outlined text-[14px] text-tertiary">
                      check_circle
                    </span>
                  </span>
                  <span className="font-semibold text-tertiary" id="cartDeliveryFee">
                    FREE
                  </span>
                </div>
                <div
                  id="voucherRow"
                  className={
                    cart.voucherVisible
                      ? "flex justify-between text-tertiary font-semibold"
                      : "flex justify-between text-tertiary font-semibold hidden"
                  }
                >
                  <span>Tenant Voucher (HUNGRY5)</span>
                  <span id="cartDiscount">{"-" + fmt(cart.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service &amp; Merchant Taxes</span>
                  <span className="font-semibold text-on-surface" id="cartTax">
                    {fmt(cart.tax)}
                  </span>
                </div>
                <div className="flex justify-between pt-space-xs border-t border-surface-container-low font-headline-sm text-headline-sm font-bold text-on-surface">
                  <span>Total</span>
                  <span className="text-primary-container" id="cartFinalTotal">
                    {fmt(cart.total)}
                  </span>
                </div>
              </div>

              <button
                id="checkoutButton"
                type="button"
                disabled={!cart.items.length}
                className={
                  "w-full py-3.5 bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-between px-space-md group" +
                  (cart.bounce ? " scale-105" : "")
                }
                onClick={handleCheckout}
              >
                <span className="flex items-center gap-2">
                  <span>Proceed to Checkout</span>
                </span>
                <span className="flex items-center gap-1 bg-surface-container-lowest/20 px-2.5 py-1 rounded-lg">
                  <span id="btnTotalLabel">{fmt(cart.total)}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
              </button>

              <div className="flex items-center justify-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm pt-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  verified_user
                </span>
                <span>Contactless Delivery &amp; Real-time GPS guarantee</span>
              </div>
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
};

export default ShopPage;