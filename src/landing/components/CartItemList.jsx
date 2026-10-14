import { fmt } from "../hooks/useCart";

export default function CartItemList({ items, onModify }) {
  if (items.length === 0) {
    return (
      <div className="py-space-xl flex flex-col items-center justify-center text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[36px] text-secondary">
          remove_shopping_cart
        </span>
        <p className="font-label-md text-label-md mt-2 font-semibold">
          Your cart is hungry!
        </p>
        <span className="font-body-sm text-body-sm">
          Add signature items from restaurants nearby.
        </span>
      </div>
    );
  }

  return items.map((item) => (
    <div
      key={item.name}
      className="cart-item flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg"
      data-name={item.name}
    >
      <div className="flex flex-col min-w-0 flex-1 pr-2">
        <span className="font-label-md text-label-md font-bold text-on-surface truncate">
          {item.name}
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {fmt(item.price)} ea
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-surface-container-lowest rounded-full px-1.5 py-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => onModify(item.name, -1)}
            className="text-on-surface-variant hover:text-primary transition-colors text-sm font-bold w-5 h-5 flex items-center justify-center"
          >
            −
          </button>
          <span className="item-qty font-label-sm text-label-sm font-bold text-on-surface px-1.5">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => onModify(item.name, 1)}
            className="text-on-surface-variant hover:text-primary transition-colors text-sm font-bold w-5 h-5 flex items-center justify-center"
          >
            +
          </button>
        </div>
        <span className="item-total font-label-md text-label-md font-bold text-on-surface w-14 text-right">
          {fmt(item.price * item.qty)}
        </span>
      </div>
    </div>
  ));
}
