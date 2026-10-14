import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicRestaurants, fetchPublicCategories, peekPublicRestaurants, peekPublicCategories } from "../api/publicApi";
import { categoryClasses } from "../data/categoryStyle";

// Static mock data for the Shop page. Replace with API data when ready.

const quickFilterTags = [
  {
    "label": "All Vendors",
    "icon": "apps",
    "iconClass": "",
    "active": true
  },
  {
    "label": "Top Rated (4.8+)",
    "icon": "star",
    "iconClass": "text-amber-500",
    "filled": true
  },
  {
    "label": "Free Delivery",
    "icon": "local_shipping",
    "iconClass": "text-tertiary-container"
  },
  {
    "label": "Under 25 Mins",
    "icon": "bolt",
    "iconClass": "text-primary-container"
  },
  {
    "label": "Promos & Deals",
    "icon": "loyalty",
    "iconClass": "text-rose-500"
  },
  {
    "label": "Multi-Branch Chains",
    "icon": "hub",
    "iconClass": "text-secondary"
  },


  {
    "label": "Vegan Friendly",
    "icon": "eco",
    "iconClass": "text-emerald-500"
  }
];




const SWITCH_ACTIVE =
  "px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-all flex items-center gap-1.5";
const SWITCH_INACTIVE =
  "px-space-md py-space-xs rounded-full text-secondary hover:text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5";

function DeliveryModeSwitch({ onChange }) {
  const [mode, setMode] = useState("delivery");

  const select = (next) => {
    setMode(next);
    onChange?.(next);
  };

  return (
    <div className="flex items-center self-start md:self-auto p-1 bg-surface-container-high rounded-full shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.05)]">
      <button
        type="button"
        id="toggle-delivery"
        className={mode === "delivery" ? SWITCH_ACTIVE : SWITCH_INACTIVE}
        onClick={() => select("delivery")}
      >
        <span
          className="material-symbols-outlined text-primary-container text-[18px]"
        >
          moped
        </span>
        <span>Delivery</span>
      </button>
      <button
        type="button"
        id="toggle-pickup"
        className={mode === "pickup" ? SWITCH_ACTIVE : SWITCH_INACTIVE}
        onClick={() => select("pickup")}
      >
        <span
          className="material-symbols-outlined text-[18px]"
        >
          shopping_bag
        </span>
        <span>Self Pickup</span>
      </button>
    </div>
  );
}

const TAG_ACTIVE =
  "px-space-md py-2 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] flex items-center gap-1.5";
const TAG_INACTIVE =
  "px-space-md py-2 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]";

function QuickFilterTags({ total }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs pt-space-xs scrollbar-none text-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {quickFilterTags.map((tag, i) => (
        <button
          key={tag.label}
          type="button"
          className={active === i ? TAG_ACTIVE : TAG_INACTIVE}
          onClick={() => setActive(i)}
        >
          <span
            className={`material-symbols-outlined ${
              active === i ? "" : tag.iconClass
            } text-[18px]`}
            style={tag.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {tag.icon}
          </span>
          {tag.label}{i === 0 && total != null ? ` (${total})` : ""}
        </button>
      ))}
    </div>
  );
}

const PRICES = [
  { label: "$", title: "Inexpensive" },
  { label: "$$", title: "Moderate" },
  { label: "$$$", title: "Upscale" },
  { label: "$$$$", title: "Fine Dining" },
];

const PRICE_ACTIVE =
  "px-2.5 py-2 rounded bg-surface-container-lowest text-primary-container font-label-md text-label-md font-bold";
const PRICE_INACTIVE =
  "px-2.5 py-2 rounded font-label-md text-label-md text-secondary hover:text-on-surface transition-colors";

function SearchCommandBar({ onSearch }) {
  const [price, setPrice] = useState(1);

  return (
    <div className="mt-space-sm p-space-sm sm:p-space-md bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(11,28,48,0.06)] flex flex-col lg:flex-row items-center gap-space-sm">
      {/* Primary Input */}
      <div className="relative flex-1 w-full flex items-center">
        <span className="material-symbols-outlined absolute left-space-md text-primary-container text-[24px]">
          search
        </span>
        <input
          id="directory-search"
          type="text"
          className="w-full pl-12 pr-space-md py-3.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none transition-colors"
          placeholder="Search restaurants, marts, artisanal bakeries, dish names, or ingredients..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      {/* Secondary Filter Controls */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-xs w-full lg:w-auto">
        {/* Sort dropdown */}
        <div className="relative flex-1 sm:flex-none">
          <select
            defaultValue="popularity"
            className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-label-md text-label-md px-space-md py-3.5 pr-10 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="rating">Sort: Highest Rated (4.8+)</option>
            <option value="time">Sort: Fastest Delivery (&lt; 25m)</option>
            <option value="popularity">Sort: Most Popular</option>
            <option value="distance">Sort: Nearest Distance</option>
            <option value="minimum">Sort: Lowest Minimum Order</option>
          </select>
          <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[20px]">
            expand_more
          </span>
        </div>

        {/* Price Toggles */}
        <div className="flex items-center bg-surface-container-low rounded-lg p-1">
          {PRICES.map((p, i) => (
            <button
              key={p.label}
              type="button"
              title={p.title}
              className={price === i ? PRICE_ACTIVE : PRICE_INACTIVE}
              onClick={() => setPrice(i)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="w-full sm:w-auto px-space-lg py-3.5 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-[0_4px_12px_rgba(249,115,22,0.25)] flex items-center justify-center gap-space-xs transition-all"
        >
          <span>Filter Vendors</span>
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>
    </div>
  );
}

function ShopHeader({ total }) {
  return (
    <section className="max-w-[1280px] mx-auto px-margin pt-space-xl pb-space-lg w-full">
      <div className="flex flex-col gap-space-md">
        {/* Breadcrumb & Direct Counter */}
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-secondary">
          <Link to="/" className="hover:text-primary-container transition-colors">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-bold">All Partner Shops &amp; Restaurants</span>
          <span className="ml-space-sm px-space-sm py-0.5 rounded-full bg-secondary-container text-on-surface font-semibold text-[11px]">
            {total ?? 0} Active Vendors
          </span>
        </div>

        {/* Headline & Editorial Intro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="max-w-3xl">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Explore All Food &amp; Mart Shops
            </h1>
            <p className="font-body-lg text-body-lg text-secondary mt-space-xs">
              Browse partner restaurants and shops, and order with live courier dispatch.
            </p>
          </div>
          <DeliveryModeSwitch />
        </div>

        <SearchCommandBar />
        <QuickFilterTags total={total} />
      </div>
    </section>
  );
}

function CategoryRail({ categories, selected, onSelect }) {
  return (
    <section className="max-w-[1280px] mx-auto px-margin py-space-sm w-full">
      <div className="flex items-center justify-between mb-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
          Popular Categories &amp; Cuisines
        </h2>
        <span className="font-label-md text-label-md text-secondary">Swipe to explore</span>
      </div>

      {/* one row, scrolls left to right */}
      <div className="flex gap-space-sm overflow-x-auto pb-space-xs snap-x [scrollbar-width:thin]">
        {categories.map((cat) => {
          const [bg, text] = categoryClasses(cat.color);
          const active = selected === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(active ? null : cat.id)}
              aria-pressed={active}
              className={`group snap-start shrink-0 w-[7.5rem] flex flex-col items-center p-3 rounded-xl hover:bg-surface-container-low shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-all text-center ${
                active ? "bg-surface-container-low ring-2 ring-primary-container" : "bg-surface-container-lowest"
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${text} mb-2 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">{cat.name}</span>
              <span className="font-body-sm text-[11px] text-secondary">
                {cat.restaurants_count} {cat.restaurants_count === 1 ? "spot" : "spots"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
function FeaturedChains({ restaurants }) {
  const chains = (restaurants ?? []).filter((r) => r.branches_count > 1);
  if (chains.length === 0) return null;
  return (
    <section className="max-w-[1280px] mx-auto px-margin py-space-md w-full">
      <div className="bg-gradient-to-r from-surface-container-highest via-surface-container-low to-surface-container p-space-lg rounded-2xl shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="p-2 bg-primary-container text-on-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">domain</span>
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Featured Multi-Branch Chains
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Order seamlessly from your closest district branch with consistent citywide menus
              </p>
            </div>
          </div>
          <a
            href="#"
            className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            View All Multi-Location Partners{" "}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {chains.map((r) => (
            <Link
              key={r.id}
              to={`/order/shop?shop=${r.id}`}
              className="bg-surface-container-lowest p-space-md rounded-xl flex items-center gap-space-md hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {r.logo_url || r.cover_url ? (
                  <img className="w-full h-full object-cover" src={r.logo_url || r.cover_url} alt={r.name} />
                ) : (
                  <span className="material-symbols-outlined text-primary-container text-[28px]">storefront</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline-sm text-base text-on-surface font-bold truncate">{r.name}</h4>
                <p className="font-label-sm text-label-sm text-primary font-bold">{r.branches_count} Branches</p>
                <p className="font-body-sm text-[12px] text-secondary truncate">{r.main_branch?.city || r.cuisine_type}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckRow({ label, defaultChecked = false }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-body-sm font-body-sm text-secondary hover:text-on-surface">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="rounded accent-primary-container h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

function ToggleRow({ label, defaultChecked = false, highlighted = false }) {
  return (
    <label
      className={`flex items-center justify-between cursor-pointer text-body-sm font-body-sm ${
        highlighted ? "text-on-surface" : "text-secondary hover:text-on-surface"
      }`}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="rounded-full accent-primary-container h-4 w-4"
      />
    </label>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="py-space-sm">
      <label className="font-label-md text-label-md text-on-surface font-bold block mb-space-xs">
        {title}
      </label>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FilterSidebar({ categories, selected, onSelect }) {
  return (
    <aside className="lg:col-span-1 flex flex-col gap-space-md">
      <div className="bg-surface-container-lowest p-space-md rounded-xl">
        <div className="flex items-center justify-between pb-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Filter Stores</h3>
          <button type="button" className="font-label-sm text-label-sm text-primary hover:underline">
            Reset All
          </button>
        </div>

        {/* same categories as the rail above and the /order page (managed in the admin) */}
        <FilterGroup title="Category">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center justify-between gap-2 cursor-pointer py-0.5">
              <span className="flex items-center gap-2 font-body-md text-body-md text-on-surface">
                <input
                  type="checkbox"
                  checked={selected === cat.id}
                  onChange={() => onSelect(selected === cat.id ? null : cat.id)}
                  className="accent-primary-container w-4 h-4"
                />
                {cat.name}
              </span>
              <span className="font-body-sm text-[12px] text-secondary">{cat.restaurants_count}</span>
            </label>
          ))}
        </FilterGroup>

        <FilterGroup title="Dietary & Prep">
          <CheckRow label="100% Halal Kitchen" />
          <CheckRow label="Vegetarian Options" />
          <CheckRow label="Gluten-Friendly Menu" />
          <CheckRow label="Certified Organic Produce" />
        </FilterGroup>

        <FilterGroup title="Store Availability">
          <ToggleRow label="Open Now for Delivery" defaultChecked highlighted />
          <ToggleRow label="Accepts Pre-orders" />
          <ToggleRow label="Contactless Dropoff" defaultChecked />
        </FilterGroup>

        {/* Max Delivery Fee */}
        <div className="pt-space-sm">
          <div className="flex items-center justify-between text-label-md font-label-md mb-2">
            <span className="text-on-surface font-bold">Max Delivery Fee</span>
            <span className="text-primary-container font-bold">$3.99</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            defaultValue="4"
            className="w-full accent-primary-container cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-label-sm text-secondary mt-1">
            <span>Free ($0)</span>
            <span>$5.00</span>
            <span>$10.00+</span>
          </div>
        </div>
      </div>

      {/* Promotional Micro Card */}
      <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary p-space-md rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)]">
        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/20 flex items-center justify-center mb-space-xs">
          <span className="material-symbols-outlined text-[20px]">stars</span>
        </div>
        <h4 className="font-headline-sm text-base font-bold mb-1">FoodOrder VIP Pass</h4>
        <p className="font-body-sm text-xs opacity-90 mb-space-sm">
          Get $0 delivery fee on every order over $15 from local merchants.
        </p>
        <button
          type="button"
          className="w-full py-2 bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold rounded-lg shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] hover:bg-surface-bright transition-colors"
        >
          Try 30 Days Free
        </button>
      </div>
    </aside>
  );
}

function VendorCard({ vendor }) {
  return (
    <article className="bg-surface-container-lowest rounded-xl hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] hover:-translate-y-1 transition-all overflow-hidden flex flex-col group">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        {vendor.image ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={vendor.image}
            alt={vendor.alt}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[56px]">restaurant</span>
          </div>
        )}
        <span className="absolute top-space-xs left-space-xs bg-surface-container-lowest/95 backdrop-blur-md px-2 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-primary-container text-[14px]">schedule</span>{" "}
          {vendor.time}
        </span>
        <span
          className={`absolute top-space-xs right-space-xs ${vendor.badgeClass} px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold`}
        >
          {vendor.badgeLabel}
        </span>
        {vendor.branchLabel && (
          <div className="absolute bottom-space-xs left-space-xs">
            <span className="bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface px-2 py-0.5 rounded font-label-sm text-[11px]">
              {vendor.branchLabel}
            </span>
          </div>
        )}
      </div>

      <div className="p-space-md flex-1 flex flex-col justify-between gap-space-sm">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-lg text-on-surface font-bold truncate group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-sm text-label-sm font-bold">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>{" "}
              {vendor.rating}
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">{vendor.tagline}</p>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1 truncate">{vendor.location}</p>
        </div>

        <div className="pt-space-xs flex items-center justify-between">
          <span className="font-body-sm text-[12px] text-secondary">{vendor.feeInfo}</span>
          <Link
            to={vendor.href || "/order/shop"}
            className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-primary-container hover:text-on-primary text-on-surface font-label-md text-label-md font-bold transition-all"
          >
            {vendor.cta}
          </Link>
        </div>
      </div>
    </article>
  );
}

function apiToVendor(r) {
  const eta = r.prep_minutes ?? 20;
  const b = r.main_branch;
  return {
    id: `api-${r.id}`,
    name: r.name,
    time: `${eta}\u2013${eta + 10} min`,
    badgeLabel: "Restaurant",
    badgeClass: "bg-surface-container-lowest/90 backdrop-blur-md text-on-surface",
    branchLabel: r.branches_count > 1 ? `${r.branches_count} Branches` : null,
    rating: "New",
    tagline: `${r.cuisine_type} \u2022 ${r.menu_items_count} dishes`,
    location: b ? `${b.name}${b.city ? ` \u2022 ${b.city}` : ""}` : "",
    feeInfo: r.top_item ? `From $${r.top_item.price.toFixed(2)}` : "",
    cta: "View Menu \u2192",
    alt: r.name,
    href: `/order/shop?shop=${r.id}`,
    image: r.cover_url || r.logo_url || r.top_item?.image_url || null,
  };
}

// Shown instead of fake placeholder data while loading or when there is nothing to list.
function EmptyState({ icon, title, hint }) {
  return (
    <div className="py-space-xl flex flex-col items-center justify-center text-center text-on-surface-variant gap-1">
      <span className="material-symbols-outlined text-[48px] text-secondary">{icon}</span>
      <p className="font-label-lg text-label-lg font-semibold text-on-surface">{title}</p>
      {hint && <p className="font-body-sm text-body-sm">{hint}</p>}
    </div>
  );
}

function VendorGrid({ restaurants, status, selected }) {
  const [view, setView] = useState("grid");
  const all = restaurants ?? [];
  const shown = all.filter((r) => !selected || r.category_id === selected);

  return (
    <div className="lg:col-span-3 flex flex-col gap-space-lg">
      {/* Result Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-xs">
        <p className="font-body-md text-body-md text-secondary">
          Showing <span className="font-bold text-on-surface">{shown.length}</span> of{" "}
          <span className="font-bold text-on-surface">{all.length}</span> verified partner stores
        </p>
        <div className="flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">View:</span>
          <button
            type="button"
            title="Grid View"
            onClick={() => setView("grid")}
            className={
              view === "grid"
                ? "p-1.5 rounded bg-surface-container-lowest text-primary"
                : "p-1.5 rounded text-secondary hover:bg-surface-container-low transition-colors"
            }
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>
          <button
            type="button"
            title="List View"
            onClick={() => setView("list")}
            className={
              view === "list"
                ? "p-1.5 rounded bg-surface-container-lowest text-primary"
                : "p-1.5 rounded text-secondary hover:bg-surface-container-low transition-colors"
            }
          >
            <span className="material-symbols-outlined text-[20px]">view_list</span>
          </button>
        </div>
      </div>

      {status === "loading" && <EmptyState icon="hourglass_top" title="Loading restaurants…" />}
      {status === "error" && (
        <EmptyState icon="cloud_off" title="Couldn't load restaurants" hint="Check your connection and try again." />
      )}
      {status === "ready" && all.length === 0 && (
        <EmptyState icon="storefront" title="No restaurants yet" hint="Partner restaurants will appear here once they join." />
      )}
      {status === "ready" && all.length > 0 && shown.length === 0 && (
        <EmptyState icon="restaurant" title="No restaurants in this category yet" />
      )}

      {shown.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {shown.map((r) => (
            <VendorCard key={r.id} vendor={apiToVendor(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerCTA() {
  return (
    <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl w-full">
      <div className="relative overflow-hidden bg-inverse-surface rounded-2xl text-inverse-on-surface p-space-xl lg:p-space-2xl shadow-[0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] flex flex-col lg:flex-row items-center justify-between gap-space-xl">
        <div className="relative z-10 max-w-xl flex flex-col gap-space-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-md text-primary-fixed w-max font-label-sm text-label-sm uppercase tracking-wide">
            <span className="material-symbols-outlined text-[16px]">store</span> FoodOrder Merchant Network
          </div>
          <h2 className="font-headline-xl text-headline-xl text-inverse-on-surface tracking-tight">
            Are you a restaurant or store owner?
          </h2>
          <p className="font-body-lg text-body-lg text-secondary-fixed-dim">
            Partner with FoodOrder to reach 350,000+ local hungry consumers, optimize delivery
            dispatch with our runner network, and manage multi-branch inventory effortlessly.
          </p>
          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md text-inverse-on-surface">
                Zero setup onboarding fees
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md text-inverse-on-surface">
                Integrated live dispatch app
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto">
          <a
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-space-xl py-space-md bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all"
          >
            <span>Register Your Shop</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </a>
          <a
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-space-lg py-space-md bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-inverse-on-surface font-label-lg text-label-lg rounded-xl transition-all"
          >
            <span>Merchant Portal Log In</span>
          </a>
        </div>

        {/* Decorative background glow ring */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState(peekPublicRestaurants); // cached copy first, then refreshed
  const [status, setStatus] = useState(() => (peekPublicRestaurants() ? "ready" : "loading")); // loading | ready | error
  const [selected, setSelected] = useState(null); // selected category id
  const [categories, setCategories] = useState(() => peekPublicCategories() ?? []);

  useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    fetchPublicRestaurants()
      .then((rows) => {
        if (!alive) return;
        setRestaurants(rows);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="w-full pt-20 bg-surface font-body-md text-body-md text-on-surface">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[360px] bg-gradient-to-b from-primary-container/10 via-surface-container-high/20 to-transparent pointer-events-none blur-3xl -z-10" />

          <ShopHeader total={restaurants?.length ?? null} />
          <CategoryRail categories={categories} selected={selected} onSelect={setSelected} />
          <FeaturedChains restaurants={restaurants} />

          {/* Main Directory Section: Filter Sidebar + Merchant Grid */}
          <section className="max-w-[1280px] mx-auto px-margin pt-space-md pb-space-3xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-space-lg">
              <FilterSidebar categories={categories} selected={selected} onSelect={setSelected} />
              <VendorGrid restaurants={restaurants} status={status} selected={selected} />
            </div>
          </section>

          <PartnerCTA />
        </div>
      </div>
    </main>
  );
}