import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";

// Scrolls to one of the four service cards (the quick tabs under the hero)
const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const ServicesPage = () => {
  useScrollReveal();
  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* Services Hero Section */}
        <section className="relative w-full overflow-hidden bg-surface-container-low py-space-3xl">
          <div className="max-w-[1280px] mx-auto px-margin relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed shadow-sm mb-space-md">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  verified
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  Built for Customers, Restaurants &amp; Riders
                </span>
              </div>
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight mb-space-md">
                Our Food Ordering &amp; Delivery Services
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Order from local restaurants, run your restaurant&apos;s branches
                and kitchen, deliver as a rider, and manage everything from one
                admin dashboard.
              </p>
              {/* Quick Action Tabs */}
              <div className="mt-space-xl flex flex-wrap justify-center gap-space-xs p-1.5 rounded-full bg-surface-container-lowest shadow-md">
                <button
                  className="px-space-lg py-space-xs rounded-full bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-sm"
                  type="button"
                  onClick={() => goTo("service-ordering")}
                >
                  Customer Ordering
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                  onClick={() => goTo("service-riders")}
                >
                  Rider Network
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                  onClick={() => goTo("service-restaurants")}
                >
                  Restaurant Partners
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                  onClick={() => goTo("service-admin")}
                >
                  Admin Control
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Core Service Offerings Grid */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
              <div>
                <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                  From Order to Doorstep
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                  Core Service Offerings
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                One platform that connects customers, restaurants, riders, and
                administrators from the first tap to the final delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl">
              {/* Service 1: Customer ordering */}
              <div
                id="service-ordering"
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300 scroll-mt-28"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A courier on a motorbike delivering steaming Khmer takeaway through the streets of Phnom Penh at sunset, warm light with orange highlights matching the delivery gear."
                    src="/assets/cambodia/services-courier.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDU_PeqgTfupn3juBdZ6ykrBxPVemRUHix-AT4bMnzBvlZcLKWMQnl5bPjOs02xdaUlnwG5kvWcxT_00OIjDVJRzLBJrPAN_gmfYIFclPY9VWy-afhNmXDEV52bIaxM4HFs5TUi8LmVrJ79bdjyZLXA_a-7sfzh0DXpiuSS0HWbj4rzJROZ-EaYxH601OcaTxuHBNNGenAxtZ0Mp0_5xT3gXi4aM_Y_eMzKaPzAVvFD"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-[16px]">
                        location_on
                      </span>{" "}
                      LIVE TRACKING
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm">
                      FOR CUSTOMERS
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed">
                      Customer Ordering
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Food Ordering &amp; Home Delivery
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Browse local restaurants without an account, pick a branch,
                      add dishes with options to a cart, and check out to your
                      saved address. Pay with cash or card QR, then follow your
                      order on a live map.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          home_pin
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Saved Addresses
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Pin it on the map
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          radar
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Order Tracking
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Status &amp; ETA on a map
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Payment Options
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-extrabold">
                        Cash &amp; QR
                      </span>
                    </div>
                    <Link
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors shadow-sm"
                      to="/order"
                    >
                      <span>Explore Restaurants</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
              {/* Service 2: Rider network */}
              <div
                id="service-riders"
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300 scroll-mt-28"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="An office team in Phnom Penh enjoying a catered Khmer lunch buffet in a bright workplace canteen with eco-friendly meal boxes."
                    src="/assets/cambodia/services-corporate.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuB8z-IhvS-UxG0GaFEVXXXbc8oV-nRLbK0KkhiV60anBtPSw7EPhADi47ZJBFk4kqctewYGoGgPM0ZqEb2qlr4onNxSTTRDoa0TfcbXgld82Ty5Dw6_yak3wHCdq0IaVYc9OJCecBNhraqtqXatFuplU0tvDFgFva75p-iZEWXeffLTD_4X6LLQcJ_3UKGpvTZEfoGsxvlrhaBAj51WJFNxFyAzu0szo74xap-HUimA"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-tertiary-container text-[16px]">
                        two_wheeler
                      </span>{" "}
                      RIDER APP
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-bold shadow-sm">
                      EARN PER DELIVERY
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      Delivery Partners
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Rider Delivery Network
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Riders register and sign in to their own app, see the
                      orders assigned to them, follow the route on a map,
                      confirm the hand-over with a photo from the camera, and
                      track their income for every delivery.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          map
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Map &amp; Route
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Opens in Google Maps
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          photo_camera
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Photo Proof
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Taken at hand-over
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Rider Income
                      </span>
                      <span className="font-headline-md text-headline-md text-tertiary font-extrabold">
                        Per delivery
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors shadow-sm"
                      href="/rider/register"
                    >
                      <span>Become a Rider</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Service 3: Restaurant partners */}
              <div
                id="service-restaurants"
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300 scroll-mt-28"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A Khmer restaurant chef in an open kitchen checking tablets that show live order tickets and kitchen routing."
                    src="/assets/cambodia/services-kitchen.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCAPoPOqIJ68O5vu3NnHGBg3TcRATOQCO_QhaVqB6gMy8eNnkqeZXogYO4reTGnJ31Ar-FT-oJMGAgDYMf1_kWQu19k5tCgoLLGAZIB4X-0Ll6x5U3Uk_Rc9e6eS_9B4kZpwy9LX15Mwr_xw6Yqw-s5qbls6XJVnFvtLRSg8o85HH3ORv3mo4bTOoUu6u-M_7HPfxQtQ1bzFRenO4NGUjiBqsz1TePJ09cwEEDat8AY"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[16px]">
                        hub
                      </span>{" "}
                      FOR RESTAURANT OWNERS
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-sm">
                      MULTI-BRANCH
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      Restaurant Partners
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Restaurant &amp; Kitchen Management
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Register your business online and get an owner account.
                      Manage branches on a map, give each branch its own menu
                      (or copy the main branch&apos;s), accept or reject orders in
                      the kitchen queue, and run coupon promotions.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          restaurant_menu
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Branch Menus
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Load from main branch
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          campaign
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Coupon Codes
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Promotions &amp; loyalty
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Pricing Model
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-extrabold">
                        Commission only
                      </span>
                    </div>
                    <Link
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-on-primary-container transition-colors shadow-sm"
                      to="/partner"
                    >
                      <span>Partner With Us</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
              {/* Service 4: Admin control */}
              <div
                id="service-admin"
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300 scroll-mt-28"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A neat neighborhood mini-mart in Phnom Penh with shelves of tropical fruit, rice, pantry jars and fresh milk in gentle morning daylight."
                    src="/assets/cambodia/services-mart.jpg"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDl5Safq6fDdCpK2GxOzbTez0oGPm6iQtujE9XR9F7Mf2X3NU6eW94KoPdLAbMhQXOQh2jtXbm1sNu1iPpmzHS0IA7sABSJspmwHB4J214Kq27pBmMkYqfEZhR_Mwnfrb0bZatE3Z1FWpPisRWuBWA2WLEs3R8u7QiH6CI5HPxVimT5qdd-9m8zMl8zV84ARbkMdzwL91MPFp6QZOXGgvBed3PV13zJx0iUGsbz4Yj4"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-[16px]">
                        admin_panel_settings
                      </span>{" "}
                      WEB ADMIN
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-sm">
                      ROLE-BASED
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      Platform Operations
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Admin Dashboard &amp; Control Center
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      A single dashboard for owners, kitchen staff, riders, and
                      administrators. Dispatch riders, follow live deliveries,
                      review analytics and revenue, and control which modules
                      each role can open.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          lock_person
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Roles &amp; Permissions
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Modules per role
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          history
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Activity Log
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Who changed what
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Staff Roles
                      </span>
                      <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                        5
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors shadow-sm"
                      href="/admin/login"
                    >
                      <span>Open Admin Dashboard</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Restaurant & Partner Tools */}
        <section className="w-full py-space-3xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="text-center max-w-2xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                Platform Tools
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                Restaurant &amp; Partner Tools
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                Menus, the kitchen queue, rider dispatch, and payments, all in
                one place, from the moment an order is placed until it is
                delivered.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Tool Card 1 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    restaurant_menu
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-space-xs">
                  Menu Control
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Menus &amp; Branches
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Categories, dishes, and option groups for every restaurant.
                  Each branch has its own menu and orders, and can copy the main
                  branch&apos;s menu in one click.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Menu per Branch</span>
                    <span className="font-bold text-tertiary">Included</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-tertiary-container rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tool Card 2 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    tv
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs">
                  Kitchen Operations
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Kitchen Queue
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  New orders land in the queue. Accept or reject them, move them
                  from preparing to ready, and hand them to a rider.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Order Flow</span>
                    <span className="font-bold text-primary-container">
                      Accept → Ready
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tool Card 3 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    route
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider mb-space-xs">
                  Delivery Logistics
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Rider Dispatch &amp; Tracking
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Assign riders to ready orders, watch live deliveries on the
                  map, and receive a photo as proof when the order is handed
                  over.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Delivery Proof</span>
                    <span className="font-bold text-tertiary">Photo</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-tertiary rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tool Card 4 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    account_balance_wallet
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-space-xs">
                  Payments &amp; Growth
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Payments &amp; Promotions
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Customers pay with cash or an ABA PayWay QR. Restaurants run
                  coupon codes and loyalty rules, and see revenue reports.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Payment Methods</span>
                    <span className="font-bold text-primary">Cash &amp; QR</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Dashboard overview */}
            <div className="mt-space-2xl p-space-xl rounded-xl bg-surface-container-lowest shadow-md">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-space-xl">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold mb-space-sm">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      offline_bolt
                    </span>{" "}
                    Unified Admin Dashboard
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-space-sm">
                    One Dashboard for Every Role.
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                    Owners, kitchen staff, riders, and administrators all sign in
                    to the same dashboard and only see the modules their role
                    allows. Owners with several branches can switch the whole
                    dashboard to one branch with a single dropdown.
                  </p>
                  <div className="flex flex-wrap gap-space-md">
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        check_circle
                      </span>{" "}
                      Role-Based Access (RBAC)
                    </div>
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        check_circle
                      </span>{" "}
                      Branch Switcher
                    </div>
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        check_circle
                      </span>{" "}
                      Coupons &amp; Loyalty
                    </div>
                  </div>
                </div>
                {/* Order lifecycle widget */}
                <div className="w-full lg:w-96 p-space-lg rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl">
                  <div className="flex items-center justify-between pb-space-md">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed-dim">
                      Order Lifecycle
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-fixed text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>{" "}
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-space-md">
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>1. Customer places order</span>
                        <span className="text-inverse-on-surface font-bold">
                          Cash or QR
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full"
                          style={{ width: "33%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>2. Kitchen prepares</span>
                        <span className="text-inverse-on-surface font-bold">
                          Accept → Ready
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-tertiary-container rounded-full"
                          style={{ width: "66%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>3. Rider delivers</span>
                        <span className="text-inverse-on-surface font-bold">
                          Pick up → Photo
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-secondary-fixed rounded-full"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* What customers get */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="text-center max-w-xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                What Customers Get
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                Built Into Every Order
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    schedule
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  Live
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Order Tracking
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Follow your order&apos;s status and estimated arrival on a map,
                  from the kitchen to your door.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    storefront
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  Multi
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Branch Menus
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Each branch shows its own menu, so you only see dishes that
                  branch can actually prepare.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    notifications_active
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  Instant
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Notifications
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Get a notification every time your order changes status,
                  right in the app.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed-variant mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    verified_user
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  Easy
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Checkout
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Browse freely without an account. Sign in only at checkout,
                  then pay with cash or an ABA PayWay QR.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Dual Interactive CTA Conversion Section */}
        <section className="w-full py-space-3xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin" data-reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
              {/* CTA Card: Merchant Partner */}
              <div className="relative overflow-hidden rounded-xl bg-inverse-surface text-inverse-on-surface p-space-2xl flex flex-col justify-between shadow-xl">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-on-background text-secondary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider font-semibold mb-space-md">
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
                      restaurant
                    </span>{" "}
                    For Restaurant Owners
                  </div>
                  <h3 className="font-headline-xl text-headline-xl font-bold mb-space-sm leading-tight text-inverse-on-surface">
                    Do you own a restaurant? Partner with FoodOrder
                  </h3>
                  <p className="font-body-md text-body-md text-secondary-fixed-dim mb-space-xl max-w-md">
                    Reach new customers, manage every branch and its menu from
                    one dashboard, and pay only a commission per order, with no
                    subscription.
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-space-md pt-space-md">
                  <Link
                    className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.35)] transition-all"
                    to="/partner/register"
                  >
                    <span>Register Your Restaurant</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </Link>
                  <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
                    Your owner account is created when you register
                  </span>
                </div>
              </div>
              {/* CTA Card: Consumer Eater */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest text-on-surface p-space-2xl flex flex-col justify-between shadow-xl">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold mb-space-md">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      lunch_dining
                    </span>{" "}
                    Fast Doorstep Delivery
                  </div>
                  <h3 className="font-headline-xl text-headline-xl font-bold mb-space-sm leading-tight text-on-surface">
                    Hungry? Start exploring local menus
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-xl max-w-md">
                    Browse nearby restaurants by category, pick the branch you
                    want, add your favorite dishes to the cart, and have them
                    delivered to your saved address.
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-space-md pt-space-md">
                  <Link
                    className="inline-flex items-center gap-space-xs bg-on-background hover:bg-inverse-surface text-inverse-on-surface font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-md transition-all"
                    to="/order"
                  >
                    <span>Order Now</span>
                    <span className="material-symbols-outlined text-[20px]">
                      shopping_bag
                    </span>
                  </Link>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    No account needed to browse
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ServicesPage;
