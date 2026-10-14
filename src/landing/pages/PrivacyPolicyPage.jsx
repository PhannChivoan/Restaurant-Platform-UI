import { Link } from "react-router-dom";

import { FeeExample } from "../components/PlatformFee";
import usePlatformRate from "../hooks/usePlatformRate";

const Section = ({ id, title, children }) => (
  <section id={id} className="flex flex-col gap-space-sm scroll-mt-28">
    <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h2>
    <div className="font-body-md text-body-md text-on-surface-variant flex flex-col gap-space-sm">{children}</div>
  </section>
);

// Privacy policy for customers, partners and drivers, plus how the platform earns (commission, no subscription).
const PrivacyPolicyPage = () => {
  const rate = usePlatformRate();

  return (
    <main className="w-full pt-20 bg-surface">
      <article className="max-w-[820px] mx-auto px-margin py-space-2xl flex flex-col gap-space-xl">
        <header className="flex flex-col gap-space-xs">
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">Privacy Policy &amp; Fees</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Last updated: October 2026 · Applies to customers, partner restaurants and drivers.</p>
        </header>

        <Section id="partner-fees" title="1. How the platform earns: no subscription, a commission on each order">
          <p>
            FoodOrder does <strong>not</strong> charge restaurants a subscription, a setup fee or a monthly fee. Registering and using the
            partner dashboard is free.
          </p>
          <p>
            Instead, for every customer order the platform <strong>deducts a commission of {rate === null ? "…" : `${rate}%`}</strong> from
            the food subtotal. The remainder is the restaurant&apos;s payout. The commission rate that applies to a restaurant is recorded when
            it registers, and each order stores the commission and payout that were calculated for it, so past orders never change if the rate
            is updated later.
          </p>
          <div className="py-space-sm">
            <FeeExample rate={rate} />
          </div>
          <p>
            Customer delivery fees and any taxes charged by law are shown to the customer at checkout. Drivers are paid a delivery fee per
            completed delivery, shown in their dashboard.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p><strong>Customers:</strong> name, email, phone number, saved delivery addresses and map locations, order history, and payment method type (we store only the card brand and last four digits, never the full card number or CVV).</p>
          <p><strong>Partner restaurants:</strong> owner name, contact details, restaurant name, branch address and location, menu and sales data.</p>
          <p><strong>Drivers:</strong> name, contact details, vehicle type and plate, delivery history and earnings, delivery photos, and live location while on duty.</p>
        </Section>

        <Section title="3. How we use it">
          <p>To take, prepare and deliver orders; to show customers where their order is; to calculate commissions and payouts; to prevent fraud and keep the platform safe; and to send order updates.</p>
        </Section>

        <Section title="4. Who we share it with">
          <p>A restaurant sees the order details it needs to cook and hand over the food. The assigned driver sees the customer&apos;s name, delivery address, unit details and phone number only until the order is delivered. Payment providers such as ABA PayWay process online payments. We do not sell personal data.</p>
        </Section>

        <Section title="5. Location data">
          <p>Customers choose the delivery pin themselves. Drivers share live location only while signed in to the driver dashboard. Map and route services (OpenStreetMap) receive coordinates but no names or order details.</p>
        </Section>

        <Section title="6. Retention and your rights">
          <p>We keep order records for as long as needed for accounting and dispute handling. You can ask us to correct or delete your account data, or to remove saved addresses at any time from your account. Contact us using the details below.</p>
        </Section>

        <Section title="7. Contact">
          <p>Questions about this policy or our fees? Reach us through the <Link to="/contact" className="text-primary font-bold hover:underline">contact page</Link>.</p>
        </Section>
      </article>
    </main>
  );
};

export default PrivacyPolicyPage;