// Chips for switching between carts in the sidebar (hidden when there is only one).
const CartSwitcher = ({ carts, activeId, onSelect }) => {
  if (carts.length < 2) return null;
  return (
    <div className="flex gap-space-xs overflow-x-auto pb-1">
      {carts.map((c) => {
        const on = c.restaurant.id === activeId;
        return (
          <button
            key={c.restaurant.id}
            type="button"
            onClick={() => onSelect(c.restaurant.id)}
            className={
              on
                ? "shrink-0 px-space-sm py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold"
                : "shrink-0 px-space-sm py-1 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container"
            }
          >
            {c.restaurant.name} ({c.count})
          </button>
        );
      })}
    </div>
  );
};

export default CartSwitcher;