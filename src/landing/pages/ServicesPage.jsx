const ServicesPage = () => {
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
                  Tailored Solutions for Customers &amp; Merchants
                </span>
              </div>
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight mb-space-md">
                Our Comprehensive Food &amp; Grocery Delivery Services
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                From lightning-fast consumer doorstep delivery to enterprise
                multi-tenant merchant POS and cloud kitchen logistics.
              </p>
              {/* Dynamic Quick Action Tabs */}
              <div className="mt-space-xl flex flex-wrap justify-center gap-space-xs p-1.5 rounded-full bg-surface-container-lowest shadow-md">
                <button
                  className="px-space-lg py-space-xs rounded-full bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-sm"
                  type="button"
                >
                  Consumer Express
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                >
                  Quick Commerce Mart
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                >
                  Enterprise Merchant Suite
                </button>
                <button
                  className="px-space-lg py-space-xs rounded-full hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
                  type="button"
                >
                  Corporate Catering
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Core Service Offerings Grid */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
              <div>
                <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                  End-to-End Delivery Infrastructure
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                  Core Service Offerings
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Engineered for velocity, operational visibility, and seamless
                coordination across eaters, riders, and culinary hubs.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl">
              {/* Service 1: On-Demand Express */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A modern urban courier on a sleek electric bike delivering steaming hot gourmet takeaway packaging through sunset city streets, warm ambient lighting with orange highlights matching vibrant delivery gear"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU_PeqgTfupn3juBdZ6ykrBxPVemRUHix-AT4bMnzBvlZcLKWMQnl5bPjOs02xdaUlnwG5kvWcxT_00OIjDVJRzLBJrPAN_gmfYIFclPY9VWy-afhNmXDEV52bIaxM4HFs5TUi8LmVrJ79bdjyZLXA_a-7sfzh0DXpiuSS0HWbj4rzJROZ-EaYxH601OcaTxuHBNNGenAxtZ0Mp0_5xT3gXi4aM_Y_eMzKaPzAVvFD"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-[16px]">
                        speed
                      </span>{" "}
                      &lt; 30 MIN ETA
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm">
                      POPULAR
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed">
                      Consumer B2C
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      On-Demand Express Food Delivery
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Hyper-local delivery networks executing fresh, hot food
                      fulfillment with millisecond GPS telemetry,
                      temperature-regulated insulated bags, and contactless
                      drop-off verification.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          thermostat
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Insulated Carriers
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Hot &amp; cold separated
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          radar
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Live GPS Dispatch
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Sub-second updates
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Average Delivery Window
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-extrabold">
                        24 mins
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors shadow-sm"
                      href="#"
                    >
                      <span>Explore Restaurants</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Service 2: FoodOrder Mart */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A clean, luminous modern micro-fulfillment center dark store with organized wooden shelves stocked with organic fruits, pantry jars, and fresh milk cartons under gentle morning daylight"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl5Safq6fDdCpK2GxOzbTez0oGPm6iQtujE9XR9F7Mf2X3NU6eW94KoPdLAbMhQXOQh2jtXbm1sNu1iPpmzHS0IA7sABSJspmwHB4J214Kq27pBmMkYqfEZhR_Mwnfrb0bZatE3Z1FWpPisRWuBWA2WLEs3R8u7QiH6CI5HPxVimT5qdd-9m8zMl8zV84ARbkMdzwL91MPFp6QZOXGgvBed3PV13zJx0iUGsbz4Yj4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-tertiary-container text-[16px]">
                        timer
                      </span>{" "}
                      15 MIN FULFILLMENT
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-bold shadow-sm">
                      DARK STORE
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      Quick Commerce
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      FoodOrder Mart &amp; Grocery
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Direct-from-dark-store grocery distribution providing
                      farm-fresh produce, artisanal baked items, cold beverages,
                      and daily home essentials in 15 minutes flat.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          nutrition
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Farm-Fresh Certified
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Daily QC inspected
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          inventory_2
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            4,000+ SKUs
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Zero item substitutions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Stock Accuracy SLA
                      </span>
                      <span className="font-headline-md text-headline-md text-tertiary font-extrabold">
                        99.4%
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors shadow-sm"
                      href="#"
                    >
                      <span>Shop Mart Catalog</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Service 3: Multi-Tenant Merchant & Restaurant Suite */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="A high-end restaurant chef in an open modern commercial kitchen inspecting multi-tablet order management terminals glowing with live ticket updates and kitchen routing systems"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAPoPOqIJ68O5vu3NnHGBg3TcRATOQCO_QhaVqB6gMy8eNnkqeZXogYO4reTGnJ31Ar-FT-oJMGAgDYMf1_kWQu19k5tCgoLLGAZIB4X-0Ll6x5U3Uk_Rc9e6eS_9B4kZpwy9LX15Mwr_xw6Yqw-s5qbls6XJVnFvtLRSg8o85HH3ORv3mo4bTOoUu6u-M_7HPfxQtQ1bzFRenO4NGUjiBqsz1TePJ09cwEEDat8AY"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[16px]">
                        hub
                      </span>{" "}
                      ENTERPRISE READY
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-sm">
                      MULTI-LOCATION
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      B2B SaaS Core
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Multi-Tenant Merchant Suite
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Omnichannel store onboarding, multi-branch operations,
                      real-time inventory synchronization, dynamic menu modifier
                      engines, and commission-free promotional marketing
                      controls.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          sync_alt
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Two-Way POS Sync
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Square, Toast, Lightspeed
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          campaign
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Zero-Commission Deals
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Autonomous promo builder
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Merchant Net Revenue Gain
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-extrabold">
                        +32.4%
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-on-primary-container transition-colors shadow-sm"
                      href="#"
                    >
                      <span>View Merchant Platform</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Service 4: Corporate Catering & Office Dining */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-alt="Corporate technology team enjoying a stylish catered buffet in a sunlit modern workplace cafeteria with individual eco-friendly bento meal packaging and healthy artisan bowls"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8z-IhvS-UxG0GaFEVXXXbc8oV-nRLbK0KkhiV60anBtPSw7EPhADi47ZJBFk4kqctewYGoGgPM0ZqEb2qlr4onNxSTTRDoa0TfcbXgld82Ty5Dw6_yak3wHCdq0IaVYc9OJCecBNhraqtqXatFuplU0tvDFgFva75p-iZEWXeffLTD_4X6LLQcJ_3UKGpvTZEfoGsxvlrhaBAj51WJFNxFyAzu0szo74xap-HUimA"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
                  <div className="absolute top-space-md left-space-md flex gap-space-xs">
                    <span className="px-space-md py-space-xs rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-primary-container text-[16px]">
                        corporate_fare
                      </span>{" "}
                      B2B SUBSIDIZED
                    </span>
                    <span className="px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-sm">
                      TAX EFFICIENT
                    </span>
                  </div>
                  <div className="absolute bottom-space-md left-space-md right-space-md text-inverse-on-surface">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                      Team Operations
                    </span>
                    <h3 className="font-headline-lg text-headline-lg font-bold">
                      Corporate Catering &amp; Office Dining
                    </h3>
                  </div>
                </div>
                <div className="p-space-xl flex flex-col flex-1 justify-between bg-surface-container-lowest">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                      Subsidized corporate employee meal plans, recurring team
                      lunches, automated expense invoicing, and custom dietary
                      curation with centralized administrative controls.
                    </p>
                    <div className="grid grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low mb-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          receipt_long
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Consolidated Billing
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Monthly automated invoices
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          set_meal
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">
                            Dietary Matrix
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Halal, Vegan, GF filters
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Corporate Accounts Serviced
                      </span>
                      <span className="font-headline-md text-headline-md text-on-surface font-extrabold">
                        2,400+
                      </span>
                    </div>
                    <a
                      className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors shadow-sm"
                      href="#"
                    >
                      <span>Setup Corporate Portal</span>
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
        {/* Interactive Merchant & Partner Technology Ecosystem */}
        <section className="w-full py-space-3xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin">
            <div className="text-center max-w-2xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                Enterprise Architecture
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                Merchant &amp; Partner Technology Ecosystem
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                A composable digital operating system that unifies ordering,
                prep queues, delivery logistics, and treasury payouts into one
                coherent screen.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Tech Card 1 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    point_of_sale
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-space-xs">
                  Direct Integration
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  POS Terminal Integration
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Bidirectional webhooks connecting to Oracle Micros, Toast,
                  Square, and Revel. Auto-sync catalogs and orders with zero
                  re-punching.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Sync Latency</span>
                    <span className="font-bold text-tertiary">&lt; 140ms</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-tertiary-container rounded-full"
                      style={{ width: "95%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tech Card 2 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    tv
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs">
                  Prep Floor Automation
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Kitchen Display System (KDS)
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Touch-first prep screens organized by prep-station, cook timer
                  thresholds, and courier pickup ETA synchronization.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Ticket Resolution Speed</span>
                    <span className="font-bold text-primary-container">
                      +38% faster
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: "88%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tech Card 3 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    route
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider mb-space-xs">
                  Fleet Intelligence
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Multi-Location Dispatch
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Machine learning routing algorithms that batch nearby orders
                  and dynamically match couriers based on real-time traffic and
                  vehicle type.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Batch Efficiency</span>
                    <span className="font-bold text-tertiary">91.2%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-tertiary rounded-full"
                      style={{ width: "91%" }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Tech Card 4 */}
              <div className="group flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">
                    account_balance_wallet
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-space-xs">
                  Automated Finance
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                  Settlement &amp; Daily Payouts
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                  Instant liquidity ledger with automatic deductions, commission
                  breakdowns, tip allocations, and next-day ACH deposits.
                </p>
                <div className="mt-auto pt-space-md bg-surface-container-low/60 rounded-lg p-space-sm">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm mb-1">
                    <span>Payout Reliability</span>
                    <span className="font-bold text-primary">99.99%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: "99%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Live Dashboard Architecture Graphic Element */}
            <div className="mt-space-2xl p-space-xl rounded-xl bg-surface-container-lowest shadow-md">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-space-xl">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold mb-space-sm">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      offline_bolt
                    </span>{" "}
                    Unified Command Dashboard
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-space-sm">
                    One Interface. Total Operational Telemetry.
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                    Whether you manage 1 flagship boutique café or 120 ghost
                    kitchen nodes, our multi-tenant hierarchy lets regional
                    managers delegate menus, inspect refund spikes, and schedule
                    shifts with role-based access.
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
                      Custom OpenAPI Webhooks
                    </div>
                    <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        check_circle
                      </span>{" "}
                      Multi-Currency Ledger
                    </div>
                  </div>
                </div>
                {/* Real-Time Pulse Metric Widget */}
                <div className="w-full lg:w-96 p-space-lg rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl">
                  <div className="flex items-center justify-between pb-space-md">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed-dim">
                      Network Heartbeat
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-fixed text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>{" "}
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-space-md">
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>Active Live Deliveries</span>
                        <span className="text-inverse-on-surface font-bold">
                          4,812 units
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full"
                          style={{ width: "82%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>Merchant Dispatch Queue</span>
                        <span className="text-inverse-on-surface font-bold">
                          98.6% on-time
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-tertiary-container rounded-full"
                          style={{ width: "98%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-label-sm text-label-sm text-secondary-fixed-dim mb-1">
                        <span>Avg Rider Handoff Time</span>
                        <span className="text-inverse-on-surface font-bold">
                          1m 42s
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-inverse-surface/80 overflow-hidden">
                        <div
                          className="h-full bg-secondary-fixed rounded-full"
                          style={{ width: "74%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Customer Guarantees & SLA Metrics */}
        <section className="w-full py-space-3xl bg-surface">
          <div className="max-w-[1280px] mx-auto px-margin">
            <div className="text-center max-w-xl mx-auto mb-space-2xl">
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
                Trust, Speed &amp; Integrity
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                Customer Guarantees &amp; SLA Metrics
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
              {/* Metric 1 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    schedule
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  99.8%
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  On-Time SLA
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Guaranteed arrival within predicted window or credit
                  immediately credited to wallet.
                </p>
              </div>
              {/* Metric 2 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    storefront
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  15,800+
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Active Kitchens
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Vetted premium partners ranging from neighborhood stars to
                  Michelin-rated bistros.
                </p>
              </div>
              {/* Metric 3 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    support_agent
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  24/7
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Dedicated Live Helpdesk
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Human assistance in under 45 seconds via chat, phone, or
                  instant in-app escalations.
                </p>
              </div>
              {/* Metric 4 */}
              <div className="flex flex-col items-center text-center p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed-variant mb-space-md shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">
                    verified_user
                  </span>
                </div>
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                  100%
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-space-xs">
                  Freshness Guarantee
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Piping hot meals and chilled groceries or we replace the dish
                  at no cost instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Dual Interactive CTA Conversion Section */}
        <section className="w-full py-space-3xl bg-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-margin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
              {/* CTA Card: Merchant Partner */}
              <div className="relative overflow-hidden rounded-xl bg-inverse-surface text-inverse-on-surface p-space-2xl flex flex-col justify-between shadow-xl">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-on-background text-secondary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider font-semibold mb-space-md">
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
                      restaurant
                    </span>{" "}
                    For Restaurants &amp; Grocery Stores
                  </div>
                  <h3 className="font-headline-xl text-headline-xl font-bold mb-space-sm leading-tight text-inverse-on-surface">
                    Are you a restaurant or store owner? Partner with FoodOrder
                  </h3>
                  <p className="font-body-md text-body-md text-secondary-fixed-dim mb-space-xl max-w-md">
                    Unlock access to millions of active diners, seamless
                    multi-branch management, zero setup fees, and customized
                    logistics support.
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-space-md pt-space-md">
                  <a
                    className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.35)] transition-all"
                    href="#"
                  >
                    <span>Join as Merchant</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </a>
                  <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
                    Onboarded in under 48 hours
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
                    Browse top-rated nearby restaurants, artisanal groceries,
                    healthy bento boxes, and late-night snacks with free
                    delivery on your first order.
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-space-md pt-space-md">
                  <a
                    className="inline-flex items-center gap-space-xs bg-on-background hover:bg-inverse-surface text-inverse-on-surface font-label-lg text-label-lg px-space-xl py-space-md rounded-full shadow-md transition-all"
                    href="#"
                  >
                    <span>Order Now</span>
                    <span className="material-symbols-outlined text-[20px]">
                      shopping_bag
                    </span>
                  </a>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Over 1,200 deals available today
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
