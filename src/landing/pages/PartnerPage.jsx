import { Link } from "react-router-dom";

import { FeeExample } from "../components/PlatformFee";
import usePlatformRate from "../hooks/usePlatformRate";

const STEPS = [
  ["how_to_reg", "Register your restaurant", "Create your owner account and add your first branch in a few minutes. It's free."],
  ["verified", "We verify it", "Our team checks your details. Once you're verified, customers can see and order from you."],
  ["restaurant_menu", "Build your menu", "Sign in to the partner dashboard to add dishes, prices, photos and options like sizes and toppings."],
  ["payments", "Get orders and get paid", "Accept orders in your kitchen queue. Our drivers deliver them, and you receive each order's total minus our commission."],
];

const FEATURES = [
  ["receipt_long", "Orders & kitchen queue", "Accept, prepare and hand over orders in real time."],
  ["edit_note", "Menu & options", "Change prices, hide sold-out dishes and set toppings or sizes."],
  ["two_wheeler", "Delivery drivers", "Our riders collect and deliver, with live tracking for your customers."],
  ["bar_chart", "Sales insights", "See revenue, best sellers and your payout after commission."],
  ["sell", "Promotions", "Create vouchers and discounts to bring customers back."],
  ["group", "Your team", "Give kitchen staff access to just the screens they need."],
];

const FAQ = [
  ["Is there a monthly subscription or setup fee?", "No. Registering and using the dashboard is free. We only earn when you earn."],
  ["How does the commission work?", "For every customer order, we deduct a percentage of the food subtotal. The rest is your payout. The rate is shown on this page and is recorded when you sign up."],
  ["Who delivers the food?", "Independent drivers on our platform. Customers can follow their order on a live map."],
  ["When can customers order from me?", "As soon as our team verifies your restaurant. You can set up your menu before that."],
];

// "Partner with us": what the platform offers a business and how it earns (commission, no subscription).
const PartnerPage = () => {
  const rate = usePlatformRate();

  return (
    <main className="w-full pt-20 bg-surface">
      {/* hero */}
      <section className="max-w-[1100px] mx-auto px-margin py-space-3xl grid grid-cols-1 lg:grid-cols-2 gap-space-xl items-center">
        <div className="flex flex-col gap-space-md">
          <span className="self-start px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-md text-label-md font-bold">
            For restaurants &amp; food businesses
          </span>
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
            Grow your business with FoodOrder
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Reach hungry customers nearby without paying a subscription. Register for free, manage everything from one dashboard, and
            pay a small commission only when you receive an order.
          </p>
          <div className="flex flex-wrap gap-space-sm">
            <Link to="/partner/register" className="px-space-xl py-3.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md">
              Register your restaurant
            </Link>
            <a href="/admin/login" className="px-space-xl py-3.5 bg-surface-container-low hover:bg-surface-container rounded-xl font-label-lg text-label-lg font-bold text-on-surface">
              Partner sign in
            </a>
          </div>
        </div>
        <div className="flex flex-col items-center lg:items-end gap-space-md">
          <div className="text-center lg:text-right">
            <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Our only fee</p>
            <p className="font-headline-xl text-[4.5rem] leading-none font-extrabold text-primary">{rate === null ? "…" : `${rate}%`}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">per order · $0 subscription · $0 setup</p>
          </div>
          <FeeExample rate={rate} />
        </div>
      </section>

      {/* how it works */}
      <section className="bg-surface-container-low">
        <div className="max-w-[1100px] mx-auto px-margin py-space-2xl">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface text-center mb-space-xl">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {STEPS.map(([icon, title, body], i) => (
              <div key={title} className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-sm">
                <span className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{icon}</span>
                </span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {i + 1}. {title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* dashboard features */}
      <section className="max-w-[1100px] mx-auto px-margin py-space-2xl">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface text-center mb-space-xl">Everything in one partner dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {FEATURES.map(([icon, title, body]) => (
            <div key={title} className="flex gap-space-md p-space-md">
              <span className="material-symbols-outlined text-primary-container text-[32px]">{icon}</span>
              <div>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">{title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="bg-surface-container-low">
        <div className="max-w-[800px] mx-auto px-margin py-space-2xl flex flex-col gap-space-md">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface text-center mb-space-md">Questions</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md group">
              <summary className="font-label-lg text-label-lg font-bold text-on-surface cursor-pointer">{q}</summary>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">{a}</p>
            </details>
          ))}
          <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
            Read the full <Link to="/privacy#partner-fees" className="text-primary font-bold hover:underline">fees and privacy policy</Link>.
          </p>
        </div>
      </section>

      {/* final CTA */}
      <section className="max-w-[1100px] mx-auto px-margin py-space-2xl">
        <div className="rounded-3xl bg-inverse-surface text-inverse-on-surface p-space-xl flex flex-col lg:flex-row items-center justify-between gap-space-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold">Ready to start selling?</h2>
            <p className="font-body-md text-body-md opacity-80 mt-1">Free to join. We only earn when you do.</p>
          </div>
          <div className="flex flex-wrap gap-space-sm">
            <Link to="/partner/register" className="px-space-xl py-3.5 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold">
              Register your restaurant
            </Link>
            <a href="/admin/register" className="px-space-xl py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-label-lg text-label-lg font-bold">
              Become a driver
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PartnerPage;