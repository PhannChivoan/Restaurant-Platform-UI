import { Link } from "react-router-dom";

import FavoriteButton from "./FavoriteButton";

// Store card (same look as the static cards in data/restaurantCards.jsx).
// Opens the store page, which is public; only checkout needs a login.
const ApiRestaurantCard = ({ restaurant: r }) => {
  const img = r.cover_url || r.logo_url || r.top_item?.image_url;
  const eta = r.prep_minutes ?? 20;
  const branch = r.main_branch;
  const where = branch?.city || branch?.name;

  return (
    <Link
      to={`/order/shop?shop=${r.id}`}
      className="restaurant-card bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
    >
      <div className="relative h-44 w-full overflow-hidden">
        {img ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt={r.name}
            src={img}
          />
        ) : (
          <div className="w-full h-full bg-surface-container-low flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[56px]">restaurant</span>
          </div>
        )}
        <FavoriteButton restaurantId={r.id} className="absolute top-2 right-2" />
        <div className="absolute bottom-2 right-2 bg-surface-container-lowest/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-primary-container text-[16px]">schedule</span>
          <span className="font-label-sm text-label-sm font-bold text-on-surface">
            {eta}-{eta + 10} min
          </span>
        </div>
      </div>
      <div className="p-space-md flex flex-col flex-1 justify-between gap-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight group-hover:text-primary transition-colors">
            {r.name}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {r.cuisine_type}
            {where ? ` • ${where}` : ""}
            {` • ${r.menu_items_count} dishes`}
          </p>
        </div>
        <span className="font-label-md text-label-md font-bold text-primary">View store →</span>
      </div>
    </Link>
  );
};

export default ApiRestaurantCard;
