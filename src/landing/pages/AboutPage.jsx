import { useEffect, useRef } from "react";
import CountUp from "../components/CountUp";
import useScrollReveal from "../hooks/useScrollReveal";

// Team photos live in /public/assets/team (served from the site root on Vercel).
// Drop a file with the name below into that folder; until then placeholder.svg is shown.
const PLACEHOLDER = "/assets/team/placeholder.svg";
const TEAM = [
  {
    name: "Phann Chivoan",
    role: "Project Lead",
    photo: "/assets/team/phann-chivoan.jpg",
    bio: "Leads the FoodOrder project from idea to launch. Keeps the customer site, the rider app, and the admin dashboard working together as one platform, and makes sure every feature fits how real restaurants and diners order.",
  },
  {
    name: "Roeung Nak",
    role: "Backend Developer",
    photo: "/assets/team/roeung-nak.jpg",
    bio: "Builds the server side that powers every order: accounts and roles, restaurants and branches, carts, checkout, and the secure API that the website and apps rely on, backed by a MySQL database.",
  },
  {
    name: "Tha Mom",
    role: "UI/UX Designer",
    photo: "/assets/team/tha-mom.jpg",
    bio: "Shapes how FoodOrder looks and feels, from colors and typography to the steps a customer follows when ordering. Tests each screen so that ordering food takes as few taps as possible.",
  },
  {
    name: "Roeung Srey Den",
    role: "Frontend Developer",
    photo: "/assets/team/roeung-srey-den.jpg",
    bio: "Turns the design into the pages customers see: browsing restaurants, choosing dishes, the cart, and checkout. Focuses on a fast, clean experience that works on both phones and desktops.",
  },
  {
    name: "Rous Pisey",
    role: "UI/UX Designer",
    photo: "/assets/team/rous-pisey.jpg",
    bio: "Designs the screens for restaurant owners, riders, and administrators, from the dashboard and kitchen queue to the rider app, so every role finds what it needs quickly and with little training.",
  },
  {
    name: "Khun LeapHeng",
    role: "QA & Documentation",
    photo: "/assets/team/khun-leapheng.jpg",
    bio: "Tests every flow from order to delivery, reports problems early, and writes the guides and presentations that explain how restaurants, riders, and administrators use the system.",
  },
];

// a missing photo falls back to the placeholder (once, so it can never loop)
const showPlaceholder = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = "1";
  e.currentTarget.src = PLACEHOLDER;
};

const AboutPage = () => {
  useScrollReveal();
  const teamRef = useRef(null);

  // Team row: moves one card every few seconds and loops; stops while the visitor is touching or hovering it
  useEffect(() => {
    const el = teamRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    const events = ["mouseenter", "touchstart", "focusin", "pointerdown"];
    const events2 = ["mouseleave", "touchend", "focusout", "pointerup"];
    events.forEach((n) => el.addEventListener(n, pause, { passive: true }));
    events2.forEach((n) => el.addEventListener(n, resume, { passive: true }));

    const timer = setInterval(() => {
      if (paused || document.hidden) return;
      const card = el.firstElementChild;
      if (!card) return;
      const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0);
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 3000);

    return () => {
      clearInterval(timer);
      events.forEach((n) => el.removeEventListener(n, pause));
      events2.forEach((n) => el.removeEventListener(n, resume));
    };
  }, []);

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* Immersive Hero Section Bleeding Soft Background */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface via-surface-container-low to-surface py-space-3xl">
          <div className="absolute -top-32 -left-20 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] bg-secondary-container/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-[1280px] mx-auto px-margin relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
              {/* Hero Left Typography */}
              <div className="lg:col-span-7 flex flex-col items-start gap-space-md">
                <div className="inline-flex items-center gap-space-xs bg-primary-fixed/60 text-on-primary-fixed px-space-md py-space-xs rounded-full shadow-sm">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary-container"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider">
                    Our Heritage &amp; Vision
                  </span>
                </div>
                <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight leading-tight">
                  Revolutionizing Local Commerce &amp; Food Delivery
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  Connecting neighborhood culinary artisans, multi-branch
                  restaurants, and local shoppers with cutting-edge logistics
                  and community-first empowerment.
                </p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                  <a
                    className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-md hover:shadow-xl transition-all duration-300"
                    href="#mission"
                  >
                    <span>Explore Our Mission</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </a>
                  <a
                    className="inline-flex items-center gap-space-xs bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg px-space-lg py-space-md rounded-full shadow-sm transition-all"
                    href="#timeline"
                  >
                    <span className="material-symbols-outlined text-[20px] text-secondary">
                      history_edu
                    </span>
                    <span>Our Story</span>
                  </a>
                </div>
                {/* Quick Trust Proof Badges */}
                <div className="pt-space-lg flex items-center gap-space-xl">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container/15 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[22px]">
                        energy_savings_leaf
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        100% Eco Fleet
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        Net-zero delivery path
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                      <span className="material-symbols-outlined text-[22px]">
                        verified
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        Fair Tenant Model
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        Protecting culinary margins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Hero Right Mosaic Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest">
                    <img
                      className="w-full h-[460px] object-cover"
                      data-alt="The FoodOrder team with Cambodian chefs and motorbike couriers outside a neighborhood kitchen in Phnom Penh, with fresh vegetable crates and orange delivery bags in warm golden-hour light."
                      src="/assets/cambodia/about-team.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAVBX2ADyyldgogUWuOsetQR8dqRTw0wjlGlctVd-9OPqGipPjG5fyCH216arFaJl79cVJM-Ziu9yTmoeWxSRME4vyXnlFqZtNepmXuhDaqfEGvvSlGrW3ljvocTW8ECzlK4lOrgW2JKV-5FwYxLApQ5s1RYyd2158POs1n3gxTVIi1sJ9ooJKLOgFQ5-HVLTdK19zQ0Pw1lQambzzsSkWbLrt2bUO5xuiPnx_pJC_5"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 p-space-md bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[26px]">
                            moped
                          </span>
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg text-on-surface font-bold">
                            Smart Dispatch v4.2
                          </div>
                          <div className="font-body-sm text-body-sm text-tertiary font-semibold flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>{" "}
                            Real-time live routing active
                          </div>
                        </div>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">
                        99.8%
                      </span>
                    </div>
                  </div>
                  {/* Overlapping Float Card */}
                  <div className="-mt-12 -ml-6 relative z-20 max-w-[240px] bg-surface-container-lowest p-space-md rounded-xl shadow-xl flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                      <span className="material-symbols-outlined text-[22px]">
                        local_mall
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        Hyper-Local Pride
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Empowering family-run kitchens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Impact & Growth Counters */}
        <section className="w-full py-space-2xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Stat 1 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    location_city
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-space-xs">
                  <CountUp
                    target={54}
                    className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight counter-val"
                  >
                    54
                  </CountUp>
                  <span className="font-headline-xl text-headline-xl text-primary-container font-extrabold">
                    +
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Cities & Provinces Served
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  Dense micro-hubs operating with unified algorithmic logistics.
                </p>
              </div>
              {/* Stat 2 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    storefront
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-space-xs">
                  <CountUp
                    target={15820}
                    className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight counter-val"
                  >
                    15,820
                  </CountUp>
                  <span className="font-headline-xl text-headline-xl text-primary font-extrabold">
                    +
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Partner Merchants
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  From riverside restaurants to family-run noodle stalls and local bakeries.
                </p>
              </div>
              {/* Stat 3 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    restaurant
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                    250K+
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Meals Delivered
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  Consistently maintaining a 98.4% on-time threshold across Cambodia.
                </p>
              </div>
              {/* Stat 4 */}
              <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">
                    electric_bike
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-space-xs">
                  <CountUp
                    target={38500}
                    className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight counter-val"
                  >
                    1,200
                  </CountUp>
                  <span className="font-headline-xl text-headline-xl text-primary-container font-extrabold">
                    +
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  EV &amp; Eco Couriers
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  A rapidly expanding fleet committed to clean urban movement.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Company Mission & Core Values */}
        <section className="w-full py-space-3xl bg-surface" id="mission">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="flex flex-col items-center text-center gap-space-sm max-w-3xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md font-bold text-primary tracking-widest uppercase bg-primary-fixed/40 px-space-md py-space-xs rounded-full">
                Foundation &amp; Principles
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
                Our Mission &amp; Core Values
              </h2>
              <p className="font-body-lg text-body-lg text-secondary">
                We built FoodOrder to solve the systemic extractive models of
                traditional delivery aggregators. Everything we do serves
                merchant sovereignty and customer satisfaction.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl">
              {/* Pillar 1 */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-16 h-16 rounded-xl bg-primary-fixed/70 text-on-primary-fixed flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <span className="material-symbols-outlined text-[32px] text-primary">
                      diversity_3
                    </span>
                  </div>
                  <div className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                    Pillar 01
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Empowering Independent Tenants
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Building multi-tenant infrastructure so local kitchens
                    retain customer relationships, customer databases, and
                    direct brand equity rather than being masked as nameless
                    dark kitchens.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-md flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold">
                  <span>Learn how we protect data</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
              {/* Pillar 2 */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-16 h-16 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <span className="material-symbols-outlined text-[32px] text-tertiary">
                      eco
                    </span>
                  </div>
                  <div className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider">
                    Pillar 02
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Ultra-Fast &amp; Sustainable Logistics
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    100% carbon-neutral delivery target supported with
                    zero-emission electric fleet subsidies, intelligent
                    micro-fulfillment zones, and battery-swapping infrastructure
                    across our active cities.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-md flex items-center gap-space-xs text-tertiary font-label-md text-label-md font-bold">
                  <span>Read our Green Paper</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
              {/* Pillar 3 */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div className="flex flex-col gap-space-md">
                  <div className="w-16 h-16 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <span className="material-symbols-outlined text-[32px] text-secondary">
                      verified_user
                    </span>
                  </div>
                  <div className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                    Pillar 03
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Obsessive Quality &amp; Freshness
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Ensuring every meal arrives fresh, piping hot, and secure
                    with standardized tamper-evident thermal packaging and
                    algorithmic transit-window monitoring that preserves gourmet
                    texture.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-md flex items-center gap-space-xs text-secondary font-label-md text-label-md font-bold">
                  <span>Explore our FreshStandards</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Visual Milestone Journey Timeline */}
        <section
          className="w-full py-space-3xl bg-surface-container-low"
          id="timeline"
        >
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-2xl">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md font-bold text-primary-container tracking-widest uppercase">
                  From Local Roots to National Reach
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
                  Our Journey Timeline
                </h2>
              </div>
              <p className="font-body-md text-body-md text-secondary max-w-md">
                A disciplined evolution focused on sustainable unit economics,
                partner profitability, and delighting diners.
              </p>
            </div>
            {/* Timeline Rail */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-space-md relative">
              {/* 2021 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-space-sm">
                  <span className="font-headline-lg text-headline-lg font-extrabold text-primary-container">
                    2021
                  </span>
                  <div className="w-8 h-1 bg-primary-container rounded-full"></div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    The Phnom Penh Pilot
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Founded alongside 20 neighborhood restaurants in Boeung Keng Kang seeking fair delivery commissions.
                  </p>
                </div>
                <div className="pt-space-md flex items-center gap-space-xs text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">
                    pin_drop
                  </span>
                  <span>20 Initial Merchants</span>
                </div>
              </div>
              {/* 2022 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-space-sm">
                  <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                    2022
                  </span>
                  <div className="w-8 h-1 bg-on-surface rounded-full"></div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Live GPS &amp; Architecture
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Engineered a custom multi-tenant marketplace platform with
                    millisecond courier telemetry tracking.
                  </p>
                </div>
                <div className="pt-space-md flex items-center gap-space-xs text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">
                    sensors
                  </span>
                  <span>Real-time GPS Active</span>
                </div>
              </div>
              {/* 2023 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-space-sm">
                  <span className="font-headline-lg text-headline-lg font-extrabold text-tertiary">
                    2023
                  </span>
                  <div className="w-8 h-1 bg-tertiary rounded-full"></div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    FoodOrder Mart Quick-Commerce
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Launched 15-minute quick fulfillment for neighborhood
                    pantries, farm-direct produce, and craft groceries.
                  </p>
                </div>
                <div className="pt-space-md flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">
                    bolt
                  </span>
                  <span>15-Minute Fulfillment</span>
                </div>
              </div>
              {/* 2024 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
                <div className="flex flex-col gap-space-sm">
                  <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                    2024
                  </span>
                  <div className="w-8 h-1 bg-on-surface rounded-full"></div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Enterprise Multi-Branch
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Scaled to 9 cities and provinces, launching multi-branch chain controls and unified restaurant POS integrations.
                  </p>
                </div>
                <div className="pt-space-md flex items-center gap-space-xs text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">
                    domain
                  </span>
                  <span>9 Cities & Provinces</span>
                </div>
              </div>
              {/* 2025 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between transition-all hover:-translate-y-1 bg-gradient-to-b from-surface-container-lowest to-primary-fixed/20">
                <div className="flex flex-col gap-space-sm">
                  <span className="font-headline-lg text-headline-lg font-extrabold text-primary">
                    2025
                  </span>
                  <div className="w-8 h-1 bg-primary rounded-full"></div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    250K Orders & E-Bike Fleet
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Surpassed 250,000 orders, powered by our 1,200+ courier fleet of motorbikes, e-bikes and tuk-tuks across Cambodia.
                  </p>
                </div>
                <div className="pt-space-md flex items-center gap-space-xs text-primary font-label-sm text-label-sm font-bold">
                  <span className="material-symbols-outlined text-[16px]">
                    celebration
                  </span>
                  <span>250K+ Meals milestone</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Team: six members, scrolls sideways */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="flex flex-col items-center text-center gap-space-xs max-w-2xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md font-bold text-secondary uppercase tracking-widest">
                The Team
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
                Meet the People Behind FoodOrder
              </h2>
              <p className="font-body-md text-body-md text-secondary">
                Six team members who designed, built, and tested the platform
                together. Swipe or scroll to meet everyone.
              </p>
            </div>
            <div
              ref={teamRef}
              className="flex gap-space-lg overflow-x-auto snap-x snap-mandatory pb-space-md -mx-1 px-1"
            >
              {TEAM.map((m) => (
                <div
                  key={m.name}
                  className="snap-start shrink-0 w-[260px] sm:w-[280px] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="relative h-64 overflow-hidden bg-surface-container-high">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={m.name}
                      src={m.photo}
                      loading="lazy"
                      onError={showPlaceholder}
                    />
                    <div className="absolute bottom-3 left-3 bg-on-background/80 backdrop-blur-sm text-inverse-on-surface px-space-sm py-space-xs rounded-md text-label-sm font-semibold">
                      {m.role}
                    </div>
                  </div>
                  <div className="p-space-lg flex flex-col gap-space-xs">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {m.name}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {m.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>        {/* Community & Sustainability Pledge */}
        <section className="w-full py-space-2xl bg-surface-container-lowest">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="relative rounded-3xl overflow-hidden bg-surface-container-high p-space-xl sm:p-space-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-space-xs bg-tertiary-fixed text-on-tertiary-fixed px-space-md py-space-xs rounded-full w-fit">
                    <span className="material-symbols-outlined text-[18px]">
                      volunteer_activism
                    </span>
                    <span className="font-label-md text-label-md font-bold uppercase tracking-wide">
                      Community &amp; Eco Commitment
                    </span>
                  </div>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                    Giving Back: Zero Food Waste & 25,000+ Meals Donated
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    Delivery should enrich communities, not overwhelm them with waste. Through our neighborhood surplus routing protocol, unsold daily inventory is routed directly to partner charities and pagoda kitchens before end-of-shift.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                    <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md rounded-xl">
                      <span className="font-headline-lg text-headline-lg text-tertiary font-bold">
                        250,000+
                      </span>
                      <p className="font-body-sm text-body-sm text-secondary font-medium">
                        Nutritious meals diverted to pagoda kitchens and local shelters.
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-space-md rounded-xl">
                      <span className="font-headline-lg text-headline-lg text-primary font-bold">
                        100% Recyclable
                      </span>
                      <p className="font-body-sm text-body-sm text-secondary font-medium">
                        Bespoke biodegradable packaging supplied to partner
                        kitchens.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="rounded-2xl overflow-hidden shadow-xl bg-surface-container-lowest">
                    <img
                      className="w-full h-80 object-cover"
                      data-alt="Volunteer couriers and restaurant owners packing nutritious meals into recycled paper boxes at a pagoda community kitchen in Cambodia, warm documentary photography style."
                      src="/assets/cambodia/about-community.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuAoMgGJqKbgw8-9YL3u-U7s7hP7PQ6mqOLx6XSIsMj2zlMUjU7cd1GtBPYuoqDT8gGU27TzCLuzxkjvDrSLyB7PJbmqlFecD-ZkB6HpZZqwsfGK2AEqSJqCvuJZ5e_jce_4AN-q5xag3t8f1vqAk4Xvl2dIJVLnSGj5hj5PQozobX8pcFCPNe-YIbHmjHAGQpwexqntdSQshwXPZhatVVOeLnQJuvE_d4wdZ59lH-iI"; }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Interactive Dual Call to Action */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
              {/* Career Banner */}
              <div className="relative bg-inverse-surface text-inverse-on-surface rounded-3xl p-space-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col gap-space-md relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-on-background flex items-center justify-center text-primary-fixed">
                    <span className="material-symbols-outlined text-[26px]">
                      groups
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest font-bold">
                    We're Growing Fast
                  </span>
                  <h3 className="font-headline-lg text-headline-lg font-bold text-inverse-on-surface">
                    Want to join our mission? We're hiring across Cambodia.
                  </h3>
                  <p className="font-body-md text-body-md text-secondary-fixed-dim">
                    Explore open roles across logistics engineering, partner
                    success, field operations, and machine learning.
                  </p>
                </div>
                <div className="pt-space-xl relative z-10">
                  <a
                    className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-md transition-all"
                    href="#"
                  >
                    <span>View Open Careers</span>
                    <span className="material-symbols-outlined text-[18px]">
                      work
                    </span>
                  </a>
                </div>
              </div>
              {/* Culinary Partner Banner */}
              <div className="relative bg-surface-container-lowest text-on-surface rounded-3xl p-space-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-tertiary-fixed-dim/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col gap-space-md relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined text-[26px]">
                      skillet
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-widest">
                    Merchant Network
                  </span>
                  <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    Become a Culinary Partner today.
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Take control of your digital delivery business. 0% listing
                    setup fees, low fair take-rates, and direct diner ownership.
                  </p>
                </div>
                <div className="pt-space-xl relative z-10">
                  <a
                    className="inline-flex items-center gap-space-xs bg-on-surface hover:bg-inverse-surface text-surface font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-md transition-all"
                    href="#"
                  >
                    <span>Partner With FoodOrder</span>
                    <span className="material-symbols-outlined text-[18px]">
                      restaurant_menu
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Interactive Counter Script */}
      </div>
    </main>
  );
};

export default AboutPage;
