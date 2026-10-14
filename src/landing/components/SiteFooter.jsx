import { Link } from "react-router-dom";

import { getPlatformConfig, platformLogo, platformName } from "../../utils/platformSettings";

const LINK =
  "font-body-md text-body-md text-secondary-fixed-dim hover:text-primary-fixed transition-colors";

const SiteFooter = () => {
  const supportEmail = getPlatformConfig().support_email;

  return (
    <footer className="w-full bg-inverse-surface text-inverse-on-surface pt-space-3xl pb-space-2xl">
      <div className="max-w-[1280px] mx-auto px-margin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl pb-space-2xl">
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="p-space-xs bg-surface-container-lowest rounded-lg">
                <img
                  alt={`${platformName()} logo`}
                  className="h-7 w-auto object-contain"
                  src={
                    platformLogo() ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAc0svmMLOnM5DwPaZ31H6ZhB5YIhlaIbwDYQmcWGZatdBoMPiczItKnnwYP4Kc0q0OBhQtguUmM2axWG_eZgXlX5x68Uq_cmPy3cLSYNrx8DbLgYoYA5V42IZNweIOwNO-9NrUl_wco0wTGdvMFdOjhf7Xj914jFBT1g-E3BcHymQPosIpjeT4lEL0GgY-3AquMLZK-z9l_CymYpgWyQDifZn5DdRtg0IpTYxgs_wW"
                  }
                />
              </div>
              <span className="font-headline-sm text-headline-sm text-inverse-on-surface tracking-tight">
                {platformName()}
              </span>
            </div>
          <p className="font-body-md text-body-md text-secondary-fixed-dim max-w-sm">
            Delivering fresh cravings and local culinary favorites directly to
            your doorstep in minutes with real-time live tracking.
          </p>
          <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
            <a
              className="inline-flex items-center gap-space-sm bg-on-background px-space-md py-space-xs rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-inverse-surface transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-inverse-on-surface text-[26px]">
                phone_iphone
              </span>
              <div className="flex flex-col text-left">
                <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider">
                  Download on the
                </span>
                <span className="font-label-lg text-label-lg text-inverse-on-surface">
                  App Store
                </span>
              </div>
            </a>
            <a
              className="inline-flex items-center gap-space-sm bg-on-background px-space-md py-space-xs rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-inverse-surface transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-inverse-on-surface text-[26px]">
                play_arrow
              </span>
              <div className="flex flex-col text-left">
                <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider">
                  GET IT ON
                </span>
                <span className="font-label-lg text-label-lg text-inverse-on-surface">
                  Google Play
                </span>
              </div>
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-space-md">
          <h4 className="font-headline-sm text-headline-sm text-inverse-on-surface">
            Popular Cuisines
          </h4>
          <ul className="flex flex-col gap-space-sm">
            <li><Link to="/order" className={LINK}>Italian &amp; Pizza</Link></li>
            <li><Link to="/order" className={LINK}>Burgers &amp; Grills</Link></li>
            <li><Link to="/order" className={LINK}>Japanese &amp; Sushi</Link></li>
            <li><Link to="/order" className={LINK}>Healthy Bowls &amp; Salad</Link></li>
            <li><Link to="/order" className={LINK}>Desserts &amp; Bakery</Link></li>
          </ul>
        </div>
        <div className="flex flex-col gap-space-md">
          <h4 className="font-headline-sm text-headline-sm text-inverse-on-surface">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-space-sm">
            <li><Link to="/about-us" className={LINK}>About Us</Link></li>
            <li><Link to="/services" className={LINK}>Our Services</Link></li>
            <li><Link to="/partner" className={LINK}>Partner Restaurants</Link></li>
            <li><a className={LINK} href="/rider/register">Courier Careers</a></li>
            <li><Link to="/contact" className={LINK}>Help Center</Link></li>
            {/* the support address comes from Platform Settings */}
            {supportEmail && (
              <li>
                <a className={LINK} href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className="flex flex-col gap-space-md">
          <h4 className="font-headline-sm text-headline-sm text-inverse-on-surface">
            Stay Hungry
          </h4>
          <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
            Subscribe for delicious offers, discount codes, and local culinary
            drops.
          </p>
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center bg-surface-container-lowest rounded-lg p-space-xs">
              <input
                className="w-full bg-transparent px-space-sm font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none"
                placeholder="Your email address"
                type="email"
              />
              <button
                className="bg-primary-container hover:bg-primary text-on-primary px-space-md py-space-xs rounded-md transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
            <span className="font-label-sm text-label-sm text-secondary-fixed-dim">
              No spam, ever. Unsubscribe at any time.
            </span>
          </div>
        </div>
      </div>
      <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
            © {new Date().getFullYear()} {platformName()}. All rights reserved.
          </p>
        <div className="flex items-center gap-space-lg">
          <a
            className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-inverse-on-surface transition-colors"
            href="/privacy"
          >
            Privacy Policy
          </a>
          <a
            className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-inverse-on-surface transition-colors"
            href="/privacy#partner-fees"
          >
            Terms of Service
          </a>
          <a
            className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-inverse-on-surface transition-colors"
            href="#"
          >
            Cookie Preferences
          </a>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default SiteFooter;
