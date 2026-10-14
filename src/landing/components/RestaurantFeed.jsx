import { Link } from "react-router-dom";

import ApiRestaurantCard from "./ApiRestaurantCard";
import MenuItemCard from "./MenuItemCard";

// Delivery-app style feed: each restaurant (logo + name) with a row of its dishes that
// scrolls left to right, then a grid of restaurants to browse.
const RestaurantFeed = ({ restaurants, all }) => (
  <div className="flex flex-col gap-space-xl">
    {restaurants.length === 0 && (
      <p className="font-body-md text-body-md text-on-surface-variant">
        No restaurants match your filters.
      </p>
    )}

    {restaurants.map((r) => (
      <section key={r.id} className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <Link to={`/order/shop?shop=${r.id}`} className="flex items-center gap-space-sm min-w-0 group">
            {r.logo_url ? (
              <img src={r.logo_url} alt={r.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <span className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-container text-[26px]">storefront</span>
              </span>
            )}
            <span className="min-w-0">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight truncate group-hover:text-primary transition-colors">
                {r.name}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {r.cuisine_type} • {r.prep_minutes}-{r.prep_minutes + 10} min • {r.menu_items_count} dishes
              </p>
            </span>
          </Link>
          <Link
            to={`/order/shop?shop=${r.id}`}
            className="font-label-md text-label-md font-bold text-primary hover:underline shrink-0"
          >
            Browse store →
          </Link>
        </div>

        {r.preview_items?.length ? (
          <div className="flex gap-space-md overflow-x-auto snap-x pb-space-sm -mx-1 px-1">
            {r.preview_items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No dishes available yet.</p>
        )}
      </section>
    ))}

    <section className="flex flex-col gap-space-sm pt-space-sm border-t border-surface-container-low">
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
        Browse all restaurants
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        {all.map((r) => (
          <ApiRestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </section>
  </div>
);

export default RestaurantFeed;
