// Burger, fries and drink illustration used on the page banners.
const FoodArt = ({ className, style }) => (
  <img
    aria-hidden
    alt=""
    className={className}
    src="/assets/hero-food.png"
    style={{ width: "auto", pointerEvents: "none", userSelect: "none", filter: "drop-shadow(0 14px 16px rgba(15, 23, 42,.2))", ...style }}
  />
);

export default FoodArt;
