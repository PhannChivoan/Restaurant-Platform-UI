import { Link } from "react-router-dom";

import { fmt } from "../hooks/useCart";

// Compact dish card used in horizontal scrolling rows. The whole card opens the dish page,
// where the store's options are chosen.
const MenuItemCard = ({ item }) => {
  const price = Number(item.discounted_price ?? item.price);
  const hasDiscount = item.discounted_price != null && item.discounted_price < item.price;

  return (
    <Link
      to={`/order/item/${item.id}`}
      className="snap-start shrink-0 w-44 sm:w-52 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-surface-container-low group"
    >
      <div className="h-32 w-full bg-primary-container/15 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="material-symbols-outlined text-primary-container text-[44px]">
            restaurant_menu
          </span>
        )}
      </div>
      <div className="p-space-sm flex flex-col gap-0.5">
        <h4 className="font-label-md text-label-md font-bold text-on-surface truncate group-hover:text-primary transition-colors">
          {item.name}
        </h4>
        <span className="font-label-md text-label-md font-bold text-primary">
          {hasDiscount && <s className="text-on-surface-variant font-normal mr-1">{fmt(Number(item.price))}</s>}
          {fmt(price)}
        </span>
      </div>
    </Link>
  );
};

export default MenuItemCard;
