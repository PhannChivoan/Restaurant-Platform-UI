import { useEffect, useRef, useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const HomePage = () => {
  useScrollReveal();
  const [address, setAddress] = useState(
    "No. 12, Street 51, Boeung Keng Kang 1, Phnom Penh",
  );
  const [sent, setSent] = useState(false);
  const formRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const locate = () => {
    setAddress("Detecting current GPS location...");
    timers.current.push(
      setTimeout(
        () => setAddress("Boeung Keng Kang 1, Phnom Penh (Verified)"),
        600,
      ),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    timers.current.push(
      setTimeout(() => {
        formRef.current?.reset();
        setSent(false);
      }, 3000),
    );
  };

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-surface-bright pb-space-3xl pt-space-xl">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none"></div>
          <div className="max-w-[1280px] mx-auto px-margin relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              {/* Left Hero Copy & Address Search */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                <div className="inline-flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-full shadow-sm w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Now delivering in Phnom Penh, Siem Reap & Battambang
                  </span>
                </div>
                <h1 className="font-display-hero text-display-hero text-on-surface font-extrabold tracking-tight leading-tight">
                  Craving something{" "}
                  <span className="text-primary-container">delicious?</span>{" "}
                  Order food delivered fast.
                </h1>
                <p className="font-body-lg text-body-lg text-secondary max-w-xl">
                  From local culinary gems to world-renowned flavors, satisfy
                  your cravings in minutes with seamless live order tracking.
                </p>
                {/* Search Address Bar */}
                <div className="bg-surface-container-lowest p-space-xs rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-space-xs">
                  <div className="flex items-center flex-1 w-full px-space-md py-space-sm gap-space-sm">
                    <span className="material-symbols-outlined text-primary-container text-[24px]">
                      location_on
                    </span>
                    <input
                      className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none"
                      id="delivery-address-input"
                      placeholder="Enter your street address or area..."
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button
                      className="flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md transition-colors whitespace-nowrap"
                      title="Use current location"
                      type="button"
                      onClick={locate}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        my_location
                      </span>
                      <span className="hidden sm:inline">Locate Me</span>
                    </button>
                  </div>
                  <button
                    className="w-full sm:w-auto bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-md rounded-xl shadow-md transition-all flex items-center justify-center gap-space-xs hover:shadow-lg"
                    type="button"
                  >
                    <span className="">Find Food</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
                {/* Quick Delivery Perks */}
                <div className="grid grid-cols-3 gap-space-md pt-space-xs">
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest/80 backdrop-blur-sm p-space-sm rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-[22px]">
                        bolt
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                        20-30 min
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        Lightning delivery
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest/80 backdrop-blur-sm p-space-sm rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[22px]">
                        restaurant
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                        15,000+
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        Top eateries
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest/80 backdrop-blur-sm p-space-sm rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[22px]">
                        star
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                        4.9 / 5
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        120K Reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Visual Showcase with Floating Badges */}
              <div className="lg:col-span-5 relative flex justify-center items-center">
                <div className="relative w-full max-w-[460px] aspect-square rounded-3xl overflow-hidden shadow-2xl bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="Overhead spread of Cambodian dishes: fish amok steamed in banana leaf, beef lok lak with lime-and-pepper dip, grilled pork with rice, fresh spring rolls and an iced coffee on a wooden table, warm studio lighting."
                    src="/assets/cambodia/home-hero.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuD2x8MQHhUZXc9gJM7RapRATKBKYRC-37ug8uwx_LfRDsjoT1A7mPap-6ea3EPS-Vyz7ofoJ9TtXEdvW_-bEoX08jQpeCKx9574Kdo899fMw7CF8GEYAZownkMyWwtl8JCG1EBLfrYFgydnWKDlSJzvA4KB-bhHUvutC59pccmaG3uvPWcB0awXRSTN4KYX7lh1Mz_yvCaxXeujmrtWMkbCohE4fgdLsraJ-MCAb2at"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-space-lg left-space-lg right-space-lg text-on-primary">
                    <span className="inline-block px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
                      Daily Special
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold leading-tight">
                      Fish Amok Feast
                    </h3>
                    <p className="font-body-sm text-body-sm text-surface-variant line-clamp-1">
                      Free chili-lime dipping sauce & zero delivery surcharge today.
                    </p>
                  </div>
                </div>
                {/* Floating Order Status Card (Reference Admin Look) */}
                <div
                  className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-space-md rounded-2xl shadow-xl flex items-center gap-space-md max-w-[280px] animate-bounce"
                  style={{ animationDuration: "4s" }}
                >
                  <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[28px]">
                      moped
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface">
                        Order #FD-8941
                      </span>
                      <span className="px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                        En Route
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Driver arriving in 6 mins
                    </span>
                  </div>
                </div>
                {/* Floating Rating Badge */}
                <div className="absolute -top-4 -right-4 bg-surface-container-lowest p-space-sm px-space-md rounded-full shadow-lg flex items-center gap-space-xs">
                  <span
                    className="material-symbols-outlined text-primary-container text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    4.9 Star Average
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* STATS BAR (Style from Branch Operations Reference) */}
        <section className="w-full bg-surface-container-low py-space-lg">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
              {/* Stat 1 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label-md text-label-md">
                    Total Cities Active
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[22px]">
                    location_city
                  </span>
                </div>
                <div className="mt-space-md">
                  <span className="font-display-hero text-display-hero-mobile lg:text-display-hero text-on-surface font-extrabold tracking-tight">
                    9
                  </span>
                  <div className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm mt-space-xs">
                    <span className="material-symbols-outlined text-[14px]">
                      trending_up
                    </span>
                    <span className="">+6 new this month</span>
                  </div>
                </div>
              </div>
              {/* Stat 2 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label-md text-label-md">
                    Active Restaurants
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[22px]">
                    storefront
                  </span>
                </div>
                <div className="mt-space-md">
                  <span className="font-display-hero text-display-hero-mobile lg:text-display-hero text-on-surface font-extrabold tracking-tight">
                    1,280
                  </span>
                  <div className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm mt-space-xs">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    <span className="">Verified culinary partners</span>
                  </div>
                </div>
              </div>
              {/* Stat 3 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">
                    verified
                  </span>
                </div>
                <div className="mt-space-md">
                  <span className="font-display-hero text-display-hero-mobile lg:text-display-hero text-on-surface font-extrabold tracking-tight">
                    99.8%
                  </span>
                  <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-space-xs">
                    <span className="">On-time delivery index</span>
                  </div>
                </div>
              </div>
              {/* Stat 4 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label-md text-label-md">
                    Courier Fleet
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[22px]">
                    sports_motorsports
                  </span>
                </div>
                <div className="mt-space-md">
                  <span className="font-display-hero text-display-hero-mobile lg:text-display-hero text-on-surface font-extrabold tracking-tight">
                    1,200
                  </span>
                  <div className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm mt-space-xs">
                    <span className="material-symbols-outlined text-[14px]">
                      electric_bolt
                    </span>
                    <span className="">70% motorbikes & tuk-tuks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* EXPLORE BY CATEGORIES */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin flex flex-col gap-space-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider font-bold">
                  Curated Selections
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">
                  Explore by Cuisines &amp; Categories
                </h2>
                <p className="font-body-md text-body-md text-secondary mt-1">
                  Whatever you crave, our network delivers it hot, fresh, and
                  lightning-fast.
                </p>
              </div>
              <div className="flex items-center gap-space-sm">
                <button
                  className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  id="cat-prev-btn"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  id="cat-next-btn"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-space-md">
              {/* Item 1 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed/60 group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-primary-container group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    lunch_dining
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Khmer BBQ
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  120+ places
                </span>
              </a>
              {/* Item 2 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed/60 group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-primary-container group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    local_pizza
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Fish Amok
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  95+ places
                </span>
              </a>
              {/* Item 3 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-secondary-fixed group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-secondary group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    ramen_dining
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Kuy Teav & Noodles
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  80+ places
                </span>
              </a>
              {/* Item 4 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-tertiary group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    eco
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Fresh Rolls & Salads
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  65+ places
                </span>
              </a>
              {/* Item 5 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed/60 group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-primary-container group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    cake
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Num Pang & Bakery
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  45+ places
                </span>
              </a>
              {/* Item 6 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-on-surface group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    coffee
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Iced Coffee & Tea
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  50+ places
                </span>
              </a>
              {/* Item 7 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed/60 group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-primary-container group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    soup_kitchen
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Khmer Curry & Soups
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  70+ places
                </span>
              </a>
              {/* Item 8 */}
              <a
                className="group bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                href="#"
              >
                <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed group-hover:bg-primary-container flex items-center justify-center transition-colors mb-space-sm text-tertiary group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    shopping_basket
                  </span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">
                  Mart &amp; Grocery
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  15 min drop
                </span>
              </a>
            </div>
          </div>
        </section>
        {/* SERVICES & VALUE PROPOSITIONS */}
        <section className="w-full py-space-3xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin flex flex-col gap-space-2xl">
            <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
              <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider font-bold">
                Comprehensive Convenience
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">
                What We Bring to Your Table
              </h2>
              <p className="font-body-md text-body-md text-secondary mt-2">
                More than food delivery. We power seamless convenience, grocery
                essentials, and corporate solutions designed for busy schedules.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Service 1 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[30px]">
                      local_shipping
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Superfast Express Delivery
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Enjoy piping-hot meals at your doorstep in under 30 minutes
                    with live GPS tracking from kitchen to hand.
                  </p>
                </div>
                <div className="pt-space-lg flex items-center text-primary-container font-label-md text-label-md gap-1">
                  <span className="">Learn about express fleet</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </div>
              {/* Service 2 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary transition-colors">
                    <span className="material-symbols-outlined text-[30px]">
                      store
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    FoodOrder Mart
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Fresh tropical fruit, fresh milk, num pang bread, and pantry essentials delivered in as fast as 15 minutes without minimum order fees.
                  </p>
                </div>
                <div className="pt-space-lg flex items-center text-tertiary font-label-md text-label-md gap-1">
                  <span className="">Shop daily essentials</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </div>
              {/* Service 3 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-fixed transition-colors">
                    <span className="material-symbols-outlined text-[30px]">
                      takeout_dining
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Preorder &amp; Pickup
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Order ahead to skip lines at lunch hours, claim self-pickup
                    discounts, and pick up your bag fresh from the counter.
                  </p>
                </div>
                <div className="pt-space-lg flex items-center text-secondary font-label-md text-label-md gap-1">
                  <span className="">Discover pickup deals</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </div>
              {/* Service 4 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-on-background group-hover:text-surface-bright transition-colors">
                    <span className="material-symbols-outlined text-[30px]">
                      corporate_fare
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Corporate &amp; Catering
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Keep teams energized with customized monthly meal
                    allowances, large group office trays, and unified corporate
                    billing.
                  </p>
                </div>
                <div className="pt-space-lg flex items-center text-on-surface font-label-md text-label-md gap-1">
                  <span className="">FoodOrder for Teams</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ABOUT US / BRAND STORY SECTION */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
              {/* Visual Story Mosaic */}
              <div className="lg:col-span-6 relative">
                <div className="grid grid-cols-2 gap-space-md">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg">
                    <img
                      className="w-full h-full object-cover"
                      data-alt="A Khmer chef garnishing a bowl of samlor and a plate of fish amok in a bright, modern Phnom Penh restaurant kitchen with warm ambient glow."
                      src="/assets/cambodia/home-chef.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDDFGoVOExY-z1eJk2yBmK7CB3UkM5aOSc9AJV7TBTlUhFmO-aQS4T5EX6Q-C3BWUgsB_HVbNNL0Xv-ax1_kpvsV2dHrmIyd_nvIxAFZd4BvIYnB8_gam5ngQefiE1ADEBmoRxnql1GMaiswvi4sFDVFQdY6gQ-Uj0jm37g5P_yRXPbnurladXVyuIOfFkKlqbSKE-g3JuHcfsqspr5KUTnjc0eiY6Q4r4YiDi35K71"; }}
                    />
                  </div>
                  <div className="flex flex-col gap-space-md -mt-space-md">
                    <div className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                      <img
                        className="w-full h-full object-cover"
                        data-alt="A smiling courier on a motorbike with an orange insulated FoodOrder delivery bag on a leafy Phnom Penh street."
                        src="/assets/cambodia/home-courier.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCUpz9T68k7mxhkw83vbx3_DW3vmJUswcSLnLgMC2h1jxfIbFZusiZO1lb1lYUFz-MQOypOeNM4aicqsekbqo-qoW-5I4bEz-_jgewEIyNZzCKGsuQUNQrpEWWkQEGes1Cx2v0fnweqtTkH3K5_koR_HJ1YzO62joHeSRrKxzJyvZ_lUPHAliDO2QBbL3O8iyK_GNZaXnB2-M0IZfgItVlBsmnP6Z1HCKQjOG2Khowz"; }}
                      />
                    </div>
                    <div className="p-space-lg bg-inverse-surface text-inverse-on-surface rounded-3xl shadow-xl flex flex-col justify-center">
                      <span className="font-display-hero text-display-hero-mobile font-extrabold text-primary-fixed">
                        250,000+
                      </span>
                      <span className="font-body-md text-body-md text-secondary-fixed-dim">
                        Happy customers served with care across the nation.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Copy Content */}
              <div className="lg:col-span-6 flex flex-col gap-space-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider font-bold">
                    Our Heritage &amp; Promise
                  </span>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">
                    Connecting Local Passion with Every Hungry Appetite
                  </h2>
                </div>
                <p className="font-body-lg text-body-lg text-secondary">
                  Born out of a simple belief that great food should never be
                  out of reach, FoodOrder bridges the gap between beloved
                  neighborhood kitchens and people who appreciate good taste.
                </p>
                <p className="font-body-md text-body-md text-secondary">
                  From family-run noodle stalls and market kitchens to beloved riverside restaurants, we empower independent Khmer food entrepreneurs with sustainable delivery tech, fair economics, and real-time operational insights.
                </p>
                {/* Key Credibility Badges */}
                <div className="grid grid-cols-2 gap-space-md pt-space-xs">
                  <div className="flex items-start gap-space-sm">
                    <div className="p-space-xs rounded-lg bg-primary-fixed text-primary-container">
                      <span className="material-symbols-outlined text-[20px]">
                        eco
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Zero-Carbon Mission
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        Over 40% of orders fulfilled on e-bikes and electric tuk-tuks.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-space-sm">
                    <div className="p-space-xs rounded-lg bg-tertiary-fixed text-tertiary">
                      <span className="material-symbols-outlined text-[20px]">
                        thumb_up
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Fresh Food Guarantee
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        100% meal temperature satisfaction or instant credit
                        refund.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-space-sm">
                  <a
                    className="inline-flex items-center gap-space-sm bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-label-lg text-label-lg px-space-xl py-space-md rounded-xl transition-all shadow-md"
                    href="#"
                  >
                    <span className="">Read Our Full Story</span>
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* GET THE APP PROMO BANNER (Prominent High-Conversion Highlight) */}
        <section className="w-full py-space-3xl bg-surface-container-high relative overflow-hidden">
          <div className="absolute -right-20 top-0 bottom-0 w-1/3 bg-primary-container/10 skew-x-12 pointer-events-none"></div>
          <div className="max-w-[1280px] mx-auto px-margin relative z-10">
            <div className="bg-gradient-to-r from-inverse-surface via-on-background to-inverse-surface text-inverse-on-surface rounded-3xl p-space-xl lg:p-space-2xl shadow-2xl overflow-hidden relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                {/* Text and Action Column */}
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-space-xs bg-primary-container text-on-primary px-space-md py-space-xs rounded-full w-fit">
                    <span className="material-symbols-outlined text-[18px]">
                      verified_user
                    </span>
                    <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      Fastest Mobile Experience
                    </span>
                  </div>
                  <h2 className="font-display-hero text-display-hero-mobile lg:text-display-hero font-extrabold tracking-tight leading-tight text-surface-bright">
                    It’s all at your fingertips – Get the FoodOrder App
                  </h2>
                  <p className="font-body-lg text-body-lg text-secondary-fixed-dim max-w-xl">
                    Unlock exclusive app-only promo codes ($5 off your first 3 orders with HUNGRY5), watch your courier progress on live GPS maps, and re-order your favorites in one tap.
                  </p>
                  {/* Store Action Buttons & QR Code */}
                  <div className="flex flex-wrap items-center gap-space-md pt-space-md">
                    <a
                      className="inline-flex items-center gap-space-sm bg-surface-container-lowest text-on-surface px-space-lg py-space-sm rounded-2xl shadow-md hover:bg-surface-container transition-all"
                      href="#"
                    >
                      <span className="material-symbols-outlined text-[32px] text-on-surface">
                        phone_iphone
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                          Download on the
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          App Store
                        </span>
                      </div>
                    </a>
                    <a
                      className="inline-flex items-center gap-space-sm bg-surface-container-lowest text-on-surface px-space-lg py-space-sm rounded-2xl shadow-md hover:bg-surface-container transition-all"
                      href="#"
                    >
                      <span className="material-symbols-outlined text-[32px] text-primary-container">
                        play_circle
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                          GET IT ON
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          Google Play
                        </span>
                      </div>
                    </a>
                    {/* QR Code Card */}
                    <div className="hidden sm:flex items-center gap-space-sm bg-surface-container-lowest/10 backdrop-blur-md px-space-md py-space-xs rounded-2xl">
                      <div className="w-12 h-12 bg-surface-container-lowest rounded-lg p-1 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[36px] text-on-surface">
                          qr_code_2
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-inverse-on-surface">
                          Scan with Camera
                        </span>
                        <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
                          Instant download
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* App Mockup Image Column */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
                  <div className="relative w-[300px] h-[520px] rounded-[40px] bg-on-background shadow-2xl p-3 border-4 border-surface-container-high/20">
                    <div className="w-full h-full rounded-[32px] overflow-hidden relative bg-surface-container-lowest">
                      <img
                        className="w-full h-full object-cover"
                        data-alt="Modern smartphone screen mockup displaying the FoodOrder mobile application with Cambodian restaurant listings, order status bar and menu cards in clean orange and charcoal UI styling."
                        src="/assets/cambodia/home-app.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCoqOXwETSVF6qwIis7IAWPmE1famZkDU4wmp63HaW4EWq1QKqStxESKAc6qQn2S_-Pi5PPRQjlsiVwjR46HGcGV8hubVq7OIxjOrzM6DLeU5FDmVTJWwnc1lafaXAXqXyLTrtNJTbkPhsdXv00plrJhp9VkxqgJi3Gjc9afJ-V2EO9ZTFd1Rs9YXuJqxHBeSmU2Ktc2WrM0c8_dwVpvyN1z_Oqw5rdOGfakp7a979X"; }}
                      />
                      {/* Overlay Card inside Phone */}
                      <div className="absolute top-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold">
                            12 mins remaining
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary">
                          On time
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* CONTACT & SUPPORT / PARTNER ONBOARDING */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin flex flex-col gap-space-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider font-bold">
                  Always Here For You
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">
                  Need Help or Want to Partner?
                </h2>
                <p className="font-body-md text-body-md text-secondary mt-1">
                  Whether you manage a kitchen, ride the streets, or simply have
                  an order question.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              {/* Card 1: Restaurant Partner */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                <div className="flex flex-col gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[26px]">
                      restaurant_menu
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Partner Your Restaurant
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Expand your customer reach and grow revenue up to 40% with
                    zero setup fee for the first 90 days. We provide
                    point-of-sale tablets and driver network.
                  </p>
                </div>
                <div className="pt-space-lg">
                  <button
                    className="w-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md py-space-sm px-space-md rounded-xl transition-colors"
                    type="button"
                  >
                    List Your Restaurant
                  </button>
                </div>
              </div>
              {/* Card 2: Courier Signup */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                <div className="flex flex-col gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[26px]">
                      two_wheeler
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Ride With FoodOrder
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Flexible hours, competitive weekly payouts, 100% rider tips
                    retained, and complimentary safety gear. Work whenever you
                    desire on your own schedule.
                  </p>
                </div>
                <div className="pt-space-lg">
                  <button
                    className="w-full bg-on-background hover:bg-inverse-surface text-inverse-on-surface font-label-md text-label-md py-space-sm px-space-md rounded-xl transition-colors"
                    type="button"
                  >
                    Sign Up to Deliver
                  </button>
                </div>
              </div>
              {/* Card 3: 24/7 Support */}
              <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                <div className="flex flex-col gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[26px]">
                      support_agent
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Customer Care &amp; FAQ
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Have an issue with a recent delivery or payment? Our
                    real-human support specialists are available round-the-clock
                    via instant live in-app chat.
                  </p>
                </div>
                <div className="pt-space-lg">
                  <button
                    className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md py-space-sm px-space-md rounded-xl transition-colors"
                    type="button"
                  >
                    Launch Live Chat
                  </button>
                </div>
              </div>
            </div>
            {/* Quick Contact Message Form */}
            <div className="bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-3xl shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-5 flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm text-primary-container font-bold uppercase tracking-wider">
                    Quick Inquiry
                  </span>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Have a custom question?
                  </h3>
                  <p className="font-body-md text-body-md text-secondary">
                    Leave your details and our team will get in touch in less
                    than 30 minutes.
                  </p>
                </div>
                <div className="lg:col-span-7">
                  <form
                    className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm"
                    id="quick-inquiry-form"
                    ref={formRef}
                    onSubmit={handleSubmit}
                  >
                    <input
                      className="bg-surface-container-low px-space-md py-space-sm rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
                      placeholder="Your name"
                      required
                      type="text"
                    />
                    <input
                      className="bg-surface-container-low px-space-md py-space-sm rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"
                      placeholder="Email address"
                      required
                      type="email"
                    />
                    <button
                      type="submit"
                      className={
                        sent
                          ? "bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md py-space-sm px-space-lg rounded-xl transition-colors bg-tertiary"
                          : "bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md py-space-sm px-space-lg rounded-xl transition-colors"
                      }
                    >
                      {sent ? "Sent successfully!" : "Send Request"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Interactive Search / Category Filter Micro-script */}
      </div>
    </main>
  );
};

export default HomePage;
