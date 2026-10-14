import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useCart, { fmt } from "../hooks/useCart";
import { fetchPublicItem, peekPublicItem } from "../api/publicApi";
import MenuItemCard from "../components/MenuItemCard";

// Dish detail: store-defined options, quantity, add to cart, and more dishes from the same store.
// Viewing is public; the cart is local and only checkout asks for a login.
// the store's default option in each group
const defaultPicks = (d) => {
  const init = {};
  d?.modifier_groups.forEach((g) => {
    init[g.id] = g.modifiers.filter((m) => m.is_default).map((m) => m.id);
  });
  return init;
};

const ItemPage = ({ id }) => {
  const navigate = useNavigate();
  const cart = useCart();

  const [data, setData] = useState(() => peekPublicItem(id)); // cached dish shows instantly, then refreshes
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(() => defaultPicks(data)); // groupId -> [modifierId]
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPublicItem(id)
      .then((d) => {
        if (!alive) return;
        setData(d);
        // start from the store's default options; a background refresh keeps what the customer already chose
        setPicked((prev) => (Object.keys(prev).length ? prev : defaultPicks(d)));
      })
      .catch(() => alive && setError("We couldn't find this dish."));
    return () => {
      alive = false;
    };
  }, [id]);

  const groups = useMemo(() => data?.modifier_groups ?? [], [data]);
  const item = data?.item;

  const chosen = useMemo(
    () =>
      groups.flatMap((g) =>
        g.modifiers.filter((m) => (picked[g.id] ?? []).includes(m.id)),
      ),
    [groups, picked],
  );

  const base = item ? Number(item.discounted_price ?? item.price) : 0;
  const unit = base + chosen.reduce((s, m) => s + m.price_adjustment, 0);

  const toggle = (g, m) => {
    setAdded(false);
    setFormError("");
    setPicked((prev) => {
      const cur = prev[g.id] ?? [];
      if (g.selection_type === "single") {
        // radio: tapping the selected one clears it unless the group is required
        return { ...prev, [g.id]: cur.includes(m.id) && g.min_selections === 0 ? [] : [m.id] };
      }
      if (cur.includes(m.id)) return { ...prev, [g.id]: cur.filter((x) => x !== m.id) };
      if (g.max_selections && cur.length >= g.max_selections) return prev;
      return { ...prev, [g.id]: [...cur, m.id] };
    });
  };

  const addToCart = async () => {
    const short = groups.find((g) => (picked[g.id]?.length ?? 0) < g.min_selections);
    if (short) {
      setFormError(`Please choose at least ${short.min_selections} for "${short.name}".`);
      return;
    }
    setAdding(true);
    const ok = await cart.add(item.name, unit, item.id, {
      restaurantId: data.restaurant.id,
      restaurantName: data.restaurant.name,
      logoUrl: data.restaurant.logo_url,
      imageUrl: item.image_url,
      modifierIds: chosen.map((m) => m.id),
      options: chosen.map((m) => m.name),
      qty,
    });
    setAdding(false);
    if (ok) setAdded(true);
    else setFormError(cart.error || "Couldn't add this dish. Please try again.");
  };
  if (error) {
    return (
      <main className="w-full pt-20 bg-surface">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-space-md">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{error}</h1>
          <Link to="/order" className="text-primary font-bold hover:underline">
            Back to restaurants
          </Link>
        </div>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="w-full pt-20 bg-surface">
        <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
          Loading…
        </div>
      </main>
    );
  }

  const r = data.restaurant;
  const hasDiscount = item.discounted_price != null && item.discounted_price < item.price;

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="max-w-[1100px] mx-auto px-margin py-space-lg flex flex-col gap-space-xl">
        {/* Breadcrumb */}
        <nav className="font-body-sm text-body-sm text-on-surface-variant flex flex-wrap items-center gap-1">
          <Link to="/order" className="hover:text-primary">Restaurants</Link>
          <span>/</span>
          <Link to={`/order/shop?shop=${r.id}`} className="hover:text-primary">{r.name}</Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">{item.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
          {/* Photo */}
          <div className="rounded-xl overflow-hidden bg-primary-container/15 aspect-[4/3] flex items-center justify-center shadow-sm">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary-container text-[88px]">
                restaurant_menu
              </span>
            )}
          </div>

          {/* Details + options */}
          <div className="flex flex-col gap-space-md">
            <Link
              to={`/order/shop?shop=${r.id}`}
              className="inline-flex items-center gap-2 w-max group"
            >
              {r.logo_url ? (
                <img src={r.logo_url} alt={r.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <span className="w-8 h-8 rounded-lg bg-primary-container/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">storefront</span>
                </span>
              )}
              <span className="font-label-md text-label-md font-bold text-on-surface group-hover:text-primary">
                {r.name}
              </span>
              <span className="text-on-surface-variant font-body-sm text-body-sm">• {r.cuisine_type}</span>
            </Link>

            <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {item.name}
            </h1>
            <p className="font-headline-sm text-headline-sm font-bold text-primary">
              {hasDiscount && (
                <s className="text-on-surface-variant font-normal mr-2">{fmt(Number(item.price))}</s>
              )}
              {fmt(base)}
            </p>
            {item.description && (
              <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
            )}
            {item.prep_time_minutes && (
              <p className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                Ready in about {item.prep_time_minutes} min
              </p>
            )}

            {groups.map((g) => (
              <fieldset key={g.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
                <legend className="sr-only">{g.name}</legend>
                <div className="flex items-center justify-between">
                  <h3 className="font-label-lg text-label-lg font-bold text-on-surface">{g.name}</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {g.min_selections > 0 ? "Required • " : "Optional • "}
                    {g.selection_type === "single" ? "Choose 1" : `Up to ${g.max_selections}`}
                  </span>
                </div>
                {g.modifiers.map((m) => {
                  const on = (picked[g.id] ?? []).includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center justify-between gap-2 py-1.5 cursor-pointer border-t border-surface-container-low first:border-t-0"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={g.selection_type === "single" ? "radio" : "checkbox"}
                          name={`group-${g.id}`}
                          checked={on}
                          onChange={() => g.selection_type !== "single" && toggle(g, m)}
                          onClick={g.selection_type === "single" ? () => toggle(g, m) : undefined}
                          className="accent-primary-container w-4 h-4"
                        />
                        <span className="font-body-md text-body-md text-on-surface">{m.name}</span>
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        {m.price_adjustment > 0 ? `+${fmt(m.price_adjustment)}` : "Free"}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}

            {formError && <p className="font-body-sm text-body-sm text-error">{formError}</p>}

            <div className="flex items-center gap-space-md pt-space-xs">
              <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1">
                <button
                  type="button"
                  className="w-8 h-8 text-lg font-bold text-on-surface-variant hover:text-primary"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center font-label-lg text-label-lg font-bold">{qty}</span>
                <button
                  type="button"
                  className="w-8 h-8 text-lg font-bold text-on-surface-variant hover:text-primary"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={adding}
                className="flex-1 min-h-[60px] py-4 bg-primary-container hover:bg-primary disabled:opacity-80 text-on-primary rounded-xl text-lg font-label-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span> Adding…
                  </>
                ) : (
                  <>Add to cart • {fmt(unit * qty)}</>
                )}
              </button>
            </div>

            {added && (
              <div className="bg-tertiary-container/20 rounded-xl px-space-md py-space-sm flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                  Added to your cart ({cart.count} item{cart.count === 1 ? "" : "s"})
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/checkout/${r.id}`)}
                  className="font-label-md text-label-md font-bold text-primary hover:underline"
                >
                  View cart &amp; checkout →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* More from the same store */}
        {data.more_items.length > 0 && (
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                More from {r.name}
              </h2>
              <Link
                to={`/order/shop?shop=${r.id}`}
                className="font-label-md text-label-md font-bold text-primary hover:underline"
              >
                Browse store →
              </Link>
            </div>
            <div className="flex gap-space-md overflow-x-auto snap-x pb-space-sm -mx-1 px-1">
              {data.more_items.map((m) => (
                <MenuItemCard key={m.id} item={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

// key by id so moving between dishes starts from a clean state
const ItemRoute = () => {
  const { id } = useParams();
  return <ItemPage key={id} id={id} />;
};

export default ItemRoute;
