import { useNavigate } from "react-router-dom";

import useFavorites from "../hooks/useFavorites";
import { getCustomerToken } from "../api/publicApi";

// Heart toggle. Guests are sent to the login page first.
const FavoriteButton = ({ restaurantId, className = "" }) => {
  const navigate = useNavigate();
  const { has, toggle } = useFavorites();
  const on = has(restaurantId);

  const click = (e) => {
    e.preventDefault(); // the card around it is a link
    e.stopPropagation();
    if (!getCustomerToken()) return navigate("/login", { state: { from: window.location.pathname + window.location.search } });
    toggle(restaurantId);
  };

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={on}
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      className={`w-9 h-9 rounded-full bg-surface-container-lowest/95 shadow-sm flex items-center justify-center ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${on ? "text-error" : "text-on-surface-variant"}`}
        style={{ fontVariationSettings: `'FILL' ${on ? 1 : 0}` }}
      >
        favorite
      </span>
    </button>
  );
};

export default FavoriteButton;
