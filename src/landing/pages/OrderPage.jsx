import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CartItemList from "../components/CartItemList";
import AddressSelector from "../components/AddressSelector";
import useCart, { fmt } from "../hooks/useCart";
import RestaurantFeed from "../components/RestaurantFeed";
import CartSwitcher from "../components/CartSwitcher";
import { fetchPublicRestaurants, fetchPublicCategories, peekPublicRestaurants, peekPublicCategories } from "../api/publicApi";

const OrderPage = () => {
  const cart = useCart();
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [cuisine, setCuisine] = useState("all");
  const [facets, setFacets] = useState(() => new Set());
  // Registered restaurants from the API; null until it answers.
  // start from what is already cached (instant), then refresh in the background
  const [apiRestaurants, setApiRestaurants] = useState(peekPublicRestaurants);
  const [loadState, setLoadState] = useState(() => (peekPublicRestaurants() ? "ready" : "loading")); // loading | ready | error
  const [categories, setCategories] = useState(() => peekPublicCategories() ?? []); // managed by the platform admin

  useEffect(() => {
    let alive = true;
    fetchPublicCategories()
      .then((rows) => alive && setCategories(rows))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchPublicRestaurants()
      .then((rows) => {
        if (!alive) return;
        setApiRestaurants(rows);
        setLoadState("ready");
      })
      .catch(() => alive && setLoadState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const toggleFacet = (id) =>
    setFacets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = search.toLowerCase();

  const cards = (apiRestaurants ?? []).map((r) => ({
    id: `api-${r.id}`,
    cuisine: r.category_id,
    eta: r.prep_minutes ?? 20,
    text: `${r.name} ${r.cuisine_type} ${r.description ?? ""}`.toLowerCase(),
    restaurant: r,
  }));

  const sorted = [...cards].sort((a, b) => {
    if (sort === "fastest" || sort === "distance") return a.eta - b.eta;
    return 0;
  });

  // The API has no rating / free-delivery / veg / price data, so only the filters below apply.
  const visible = sorted.filter(
    (c) =>
      (cuisine === "all" || c.cuisine === cuisine) &&
      (q === "" || c.text.includes(q)) &&
      (!facets.has("filterUnder30") || c.eta <= 30),
  );
  // Checkout is its own page (one cart per restaurant); that page asks for the login.
  const handleCheckout = () => {
    if (!cart.items.length) return setCheckoutError("Your cart is empty. Add a dish to continue.");
    setCheckoutError("");
    navigate(`/checkout/${cart.restaurantId}`);
  };
  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* Top Operational Sub-Bar & Active Voucher Notification */}
        <section className="w-full bg-surface-container-lowest shadow-sm z-30">
          <div className="max-w-[1280px] mx-auto px-margin py-space-sm flex flex-col md:flex-row items-center justify-between gap-space-sm">
            {/* Address selector */}
            <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md w-full md:w-auto">
              <AddressSelector />
            </div>
            {/* Vibrant Promo Voucher Pill */}
            <div className="flex items-center gap-space-sm bg-primary-fixed/60 px-space-md py-1.5 rounded-full text-on-primary-fixed w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  local_activity
                </span>
                <span className="font-label-md text-label-md font-bold">
                  $5 OFF your first 3 orders!
                </span>
                <span className="font-body-sm text-body-sm hidden lg:inline">
                  Use code:
                </span>
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
        {/* Main View Container: Interactive Marketplace with Dynamic Cart Drawer */}
        <div className="max-w-[1280px] mx-auto px-margin py-space-lg w-full flex flex-col xl:flex-row gap-space-xl items-start relative">
          {/* Left Column: Search, Category Reel, Advanced Filters, Restaurant Grid */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-space-lg">
            {/* Search, Sorting & Quick Filter Headline Bar */}
            <div className="flex flex-col gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-space-md">
                {/* Live Cuisine Search Input */}
                <div className="relative flex-1 w-full">
                  <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px]">
                    search
                  </span>
                  <input
                    className="w-full pl-12 pr-space-md py-2.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-all"
                    id="dishSearchInput"
                    placeholder="Search dishes, burgers, sushi, tacos, desserts..."
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {/* Sort Dropdown Pills */}
                <div className="flex items-center gap-space-xs overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0 hidden sm:inline">
                    Sort:
                  </span>
                  <button
                    data-sort="popular"
                    type="button"
                    className={
                      sort === "popular"
                        ? "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-on-surface text-surface-container-lowest shadow-sm shrink-0 transition-colors"
                        : "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0 transition-colors"
                    }
                    onClick={() => setSort("popular")}
                  >
                    Most Popular
                  </button>
                  <button
                    data-sort="rating"
                    type="button"
                    className={
                      sort === "rating"
                        ? "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-on-surface text-surface-container-lowest shadow-sm shrink-0 transition-colors"
                        : "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0 transition-colors"
                    }
                    onClick={() => setSort("rating")}
                  >
                    Top Rated
                  </button>
                  <button
                    data-sort="fastest"
                    type="button"
                    className={
                      sort === "fastest"
                        ? "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-on-surface text-surface-container-lowest shadow-sm shrink-0 transition-colors"
                        : "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0 transition-colors"
                    }
                    onClick={() => setSort("fastest")}
                  >
                    Fastest Delivery
                  </button>
                  <button
                    data-sort="distance"
                    type="button"
                    className={
                      sort === "distance"
                        ? "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-on-surface text-surface-container-lowest shadow-sm shrink-0 transition-colors"
                        : "sort-btn px-space-md py-1.5 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface-variant hover:text-on-surface shrink-0 transition-colors"
                    }
                    onClick={() => setSort("distance")}
                  >
                    Nearest
                  </button>
                </div>
              </div>
              {/* Horizontal Momentum Cuisine Category Rail */}
              <div
                className="flex items-center gap-space-sm overflow-x-auto pb-2 scrollbar-none"
                id="cuisinePillTrack"
              >
                {[{ id: "all", name: "All", icon: "restaurant" }, ...categories].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={
                      cuisine === c.id
                        ? "cuisine-pill px-space-md py-2 rounded-full font-label-md text-label-md bg-primary-container text-on-primary font-bold shadow-sm shrink-0 flex items-center gap-space-xs transition-all"
                        : "cuisine-pill px-space-md py-2 rounded-full font-label-md text-label-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-sm shrink-0 flex items-center gap-space-xs transition-all"
                    }
                    onClick={() => setCuisine(c.id)}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        cuisine === c.id ? "text-on-primary" : "text-primary-container"
                      }`}
                    >
                      {c.icon}
                    </span>
                    <span>{c.name}</span>
                  </button>
                ))}              </div>
              {/* Secondary Filter Tags Row */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <button
                    id="filterFreeDelivery"
                    type="button"
                    className={
                      facets.has("filterFreeDelivery")
                        ? "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-on-surface text-surface-container-lowest hover:text-on-surface transition-colors flex items-center gap-1"
                        : "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                    }
                    onClick={() => toggleFacet("filterFreeDelivery")}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      moped
                    </span>{" "}
                    Free Delivery
                  </button>
                  <button
                    id="filterTopRating"
                    type="button"
                    className={
                      facets.has("filterTopRating")
                        ? "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-on-surface text-surface-container-lowest hover:text-on-surface transition-colors flex items-center gap-1"
                        : "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                    }
                    onClick={() => toggleFacet("filterTopRating")}
                  >
                    <span
                      className="material-symbols-outlined text-[16px] text-tertiary-container"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>{" "}
                    4.5+ Rating
                  </button>
                  <button
                    id="filterUnder30"
                    type="button"
                    className={
                      facets.has("filterUnder30")
                        ? "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-on-surface text-surface-container-lowest hover:text-on-surface transition-colors flex items-center gap-1"
                        : "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                    }
                    onClick={() => toggleFacet("filterUnder30")}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      timer
                    </span>{" "}
                    &lt; 30 mins
                  </button>
                  <button
                    id="filterVeg"
                    type="button"
                    className={
                      facets.has("filterVeg")
                        ? "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-on-surface text-surface-container-lowest hover:text-on-surface transition-colors flex items-center gap-1"
                        : "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                    }
                    onClick={() => toggleFacet("filterVeg")}
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      spa
                    </span>{" "}
                    Vegetarian
                  </button>
                  <button
                    id="filterPriceDollar"
                    type="button"
                    className={
                      facets.has("filterPriceDollar")
                        ? "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-on-surface text-surface-container-lowest hover:text-on-surface transition-colors"
                        : "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                    }
                    onClick={() => toggleFacet("filterPriceDollar")}
                  >
                    $ (Affordable)
                  </button>
                </div>
                {/* Active Results Count */}
                <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                  Showing{" "}
                  <span
                    className="font-bold text-on-surface"
                    id="restaurantCount"
                  >
                    {visible.length}
                  </span>{" "}
                  restaurants nearby
                </div>
              </div>
            </div>
            {/* Live Restaurant Feed Grid (12 Cards with Immediate Dish Add to Cart) */}
            {loadState === "loading" && (
              <div className="py-space-xl flex flex-col items-center text-center text-on-surface-variant gap-1">
                <span className="material-symbols-outlined text-[48px] text-secondary">hourglass_top</span>
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">Loading restaurants…</p>
              </div>
            )}
            {loadState === "error" && (
              <div className="py-space-xl flex flex-col items-center text-center text-on-surface-variant gap-1">
                <span className="material-symbols-outlined text-[48px] text-secondary">cloud_off</span>
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">Couldn&apos;t load restaurants</p>
                <p className="font-body-sm text-body-sm">Check your connection and refresh the page.</p>
              </div>
            )}
            {loadState === "ready" && apiRestaurants.length === 0 && (
              <div className="py-space-xl flex flex-col items-center text-center text-on-surface-variant gap-1">
                <span className="material-symbols-outlined text-[48px] text-secondary">storefront</span>
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">No restaurants yet</p>
                <p className="font-body-sm text-body-sm">Partner restaurants will appear here once they join.</p>
              </div>
            )}
            {loadState === "ready" && apiRestaurants.length > 0 && (
              <RestaurantFeed restaurants={visible.map((c) => c.restaurant)} all={apiRestaurants} />
            )}
          </div>
          {/* Right Column: Sticky Live Cart Summary Panel */}
          <aside className="w-full xl:w-[380px] shrink-0 sticky top-24 self-start">
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-low">
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
              {/* Cart Itemized List */}
              <div
                className="flex flex-col gap-space-sm max-h-[340px] overflow-y-auto pr-1"
                id="cartItemList"
              >
                <CartSwitcher carts={cart.carts} activeId={cart.activeId} onSelect={cart.setActiveId} />
                <CartItemList items={cart.items} onModify={cart.modify} />
              </div>
              {/* Voucher Input Form in Cart (one promo code for all carts: hidden once another cart uses it) */}
              {cart.promoBlocked && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">A promo code is already used on your other order.</p>
              )}
              {!cart.promoBlocked && !cart.voucherVisible && (
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
              )}
              {cart.promoError && <p className="font-body-sm text-body-sm text-error">{cart.promoError}</p>}
              {/* Cost Breakdown Calculator */}
              <div className="flex flex-col gap-1.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex justify-between">
                  <span className="">Subtotal</span>
                  <span
                    className="font-semibold text-on-surface"
                    id="cartSubtotal"
                  >
                    {fmt(cart.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Delivery Fee{" "}
                    <span className="material-symbols-outlined text-[14px] text-tertiary">
                      check_circle
                    </span>
                  </span>
                  <span
                    className="font-semibold text-tertiary"
                    id="cartDeliveryFee"
                  >
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
                  <span className="flex items-center gap-1">
                    Promo {cart.promoCode}
                    <button type="button" onClick={cart.removePromo} className="text-on-surface-variant hover:text-error" aria-label="Remove promo code">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </span>
                  <span id="cartDiscount" className="">
                    {"-" + fmt(cart.discount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="">Service &amp; Taxes</span>
                  <span className="font-semibold text-on-surface" id="cartTax">
                    {fmt(cart.tax)}
                  </span>
                </div>
                <div className="flex justify-between pt-space-xs border-t border-surface-container-low font-headline-sm text-headline-sm font-bold text-on-surface">
                  <span className="">Total</span>
                  <span className="text-primary-container" id="cartFinalTotal">
                    {fmt(cart.total)}
                  </span>
                </div>
              </div>
              {/* Primary High-Conversion Checkout Action Button */}
              <button
                id="checkoutButton"
                type="button"
                className={
                  (cart.status === "confirmed"
                    ? "w-full py-3.5 bg-tertiary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-between px-space-md group"
                    : "w-full py-3.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-between px-space-md group") +
                  (cart.bounce ? " scale-105" : "")
                }
                onClick={handleCheckout}
              >
                {cart.status === "placing" ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      sync
                    </span>{" "}
                    Placing Order...
                  </span>
                ) : cart.status === "confirmed" ? (
                  <span className="flex items-center gap-2 mx-auto text-tertiary-fixed font-bold">
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>{" "}
                    Order Confirmed!
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="">Proceed to Checkout</span>
                    </span>
                    <span className="flex items-center gap-1 bg-surface-container-lowest/20 px-2.5 py-1 rounded-lg">
                      <span id="btnTotalLabel" className="">
                        {fmt(cart.total)}
                      </span>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </>
                )}
              </button>
              {checkoutError && (
                <p className="font-body-sm text-body-sm text-error text-center">{checkoutError}</p>
              )}
              {/* Delivery Guarantee Assurance Badge */}
              <div className="flex items-center justify-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm pt-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  verified_user
                </span>
                <span className="">
                  Contactless Delivery &amp; Real-time GPS guarantee
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrderPage;
