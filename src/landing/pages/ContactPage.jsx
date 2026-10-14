import { useState } from "react";
import { Config } from "../../utils/config";

const ContactPage = () => {
  const [category, setCategory] = useState("General Inquiry");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Posts the form to the API, which emails it to the site owner
  const submitContact = async (e) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const val = (id) => form.querySelector(`#${id}`)?.value.trim() ?? "";
    setSending(true);
    setSendError("");
    setSent(false);
    // never wait forever: give up after 25 s with a readable message
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 25000);
    try {
      const res = await fetch(`${Config.BASE_URL}contact`, {
        signal: abort.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          category,
          name: val("fullName"),
          email: val("emailAddr"),
          phone: val("phoneNum") || null,
          order_id: val("orderId") || null,
          subject: val("subjectLine"),
          message: val("messageBody"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data.errors && Object.values(data.errors).flat()[0]) || data.message || "Could not send your message.",
        );
      }
      setSent(true);
      form.reset();
    } catch (err) {
      setSendError(
        err.name === "AbortError"
          ? "The server took too long to answer. Please try again in a moment."
          : err.message || "Could not send your message.",
      );
    } finally {
      clearTimeout(timer);
      setSending(false);
    }
  };
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className="w-full pt-20 bg-surface">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Element */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-primary-fixed-dim/30 via-secondary-fixed/20 to-transparent blur-3xl pointer-events-none -z-10"></div>
          {/* Top Hero Section */}
          <section className="max-w-[1280px] mx-auto px-margin pt-space-xl pb-space-2xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-full shadow-sm mb-space-md">
              <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                24/7 Support &amp; Partnerships
              </span>
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface max-w-4xl tracking-tight">
              We’re Here to Help You Feast &amp; Grow
            </h1>
            <p className="font-body-lg text-body-lg text-secondary max-w-2xl mt-space-md">
              Whether you have questions about an active order, want to partner
              your restaurant, or explore corporate catering solutions, our team
              is ready.
            </p>
            {/* Trust Micro-Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-space-xl gap-y-space-sm mt-space-lg text-secondary">
              <div className="flex items-center gap-space-xs">
                <span
                  className="material-symbols-outlined text-tertiary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  90s Live Response
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span
                  className="material-symbols-outlined text-primary-container text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Dedicated Merchant Reps
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span
                  className="material-symbols-outlined text-tertiary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  support_agent
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  365 Days Uninterrupted
                </span>
              </div>
            </div>
          </section>
          {/* 3 Direct Contact Cards */}
          <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Card 1: Customer Care */}
              <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary-container mb-space-lg group-hover:scale-105 transition-transform">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      headset_mic
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-primary">
                      Live Assistance
                    </span>
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-space-xs py-0.5 rounded-full">
                      &lt; 90s ETA
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Customer Care
                  </h3>
                  <p className="font-body-md text-body-md text-secondary mt-space-xs">
                    Real-time delivery issues, missing sauces, order
                    cancellations, and immediate dispatch adjustments.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-lg bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                      call
                    </span>
                    <span className="font-label-lg text-label-lg font-bold">
                      1-800-FOODORDER
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Toll-free, 24 hours a day, 7 days a week
                  </p>
                  <button
                    className="mt-space-xs inline-flex items-center justify-center gap-space-xs w-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md py-space-xs rounded-lg transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      forum
                    </span>{" "}
                    Launch App Chat
                  </button>
                </div>
              </div>
              {/* Card 2: Merchant Inquiries */}
              <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-space-lg group-hover:scale-105 transition-transform">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      storefront
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-secondary">
                      Restaurant Growth
                    </span>
                    <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-space-xs py-0.5 rounded-full">
                      Partner Hub
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Merchant Onboarding
                  </h3>
                  <p className="font-body-md text-body-md text-secondary mt-space-xs">
                    Expand your kitchen's delivery territory with zero-setup-fee
                    tablet integration and dynamic menu analytics.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-lg bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                      mail
                    </span>
                    <a
                      className="font-label-lg text-label-lg font-bold hover:text-primary transition-colors"
                      href="mailto:merchants@foodorder.com"
                    >
                      merchants@foodorder.com
                    </a>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Kitchen ops direct line &amp; hardware kits
                  </p>
                  <button
                    className="mt-space-xs inline-flex items-center justify-center gap-space-xs w-full bg-inverse-surface hover:bg-on-background text-inverse-on-surface font-label-md text-label-md py-space-xs rounded-lg transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      calendar_month
                    </span>{" "}
                    Book Onboarding Demo
                  </button>
                </div>
              </div>
              {/* Card 3: Corporate & Press */}
              <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-space-lg group-hover:scale-105 transition-transform">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      domain
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary">
                      B2B &amp; Media
                    </span>
                    <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-space-xs py-0.5 rounded-full">
                      HQ Operations
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Corporate &amp; Press
                  </h3>
                  <p className="font-body-md text-body-md text-secondary mt-space-xs">
                    Weekly curated team lunches, flexible cafeteria meal stipend
                    accounts, brand partnerships, and media outreach.
                  </p>
                </div>
                <div className="pt-space-lg mt-space-lg bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                      corporate_fare
                    </span>
                    <a
                      className="font-label-lg text-label-lg font-bold hover:text-primary transition-colors"
                      href="mailto:corporate@foodorder.com"
                    >
                      corporate@foodorder.com
                    </a>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Invoiced monthly with tailored team portals
                  </p>
                  <button
                    className="mt-space-xs inline-flex items-center justify-center gap-space-xs w-full bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md py-space-xs rounded-lg transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>{" "}
                    Download Press &amp; B2B Kit
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* Main Split Section: Form (Left) & Hubs/Status (Right) */}
          <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left: Interactive Contact & Inquiry Form (7 cols) */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-xl sm:p-space-2xl shadow-sm">
                <div className="flex flex-col gap-space-xs pb-space-lg">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                    Write Directly to Dispatch
                  </span>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface">
                    Send a Secure Inquiry
                  </h2>
                  <p className="font-body-md text-body-md text-secondary">
                    Select your inquiry type so we can route your ticket to the
                    specialized department instantly.
                  </p>
                </div>
                {/* Category Selector Tabs */}
                <div
                  className="flex flex-wrap gap-space-xs pb-space-lg"
                  id="categoryTabs"
                >
                  <button
                    data-cat="General Inquiry"
                    type="button"
                    className={
                      category === "General Inquiry"
                        ? "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-bold shadow-sm transition-all"
                        : "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
                    }
                    onClick={() => setCategory("General Inquiry")}
                  >
                    General Inquiry
                  </button>
                  <button
                    data-cat="Customer Support"
                    type="button"
                    className={
                      category === "Customer Support"
                        ? "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-bold shadow-sm transition-all"
                        : "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
                    }
                    onClick={() => setCategory("Customer Support")}
                  >
                    Customer Support
                  </button>
                  <button
                    data-cat="Partner With Us"
                    type="button"
                    className={
                      category === "Partner With Us"
                        ? "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-bold shadow-sm transition-all"
                        : "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
                    }
                    onClick={() => setCategory("Partner With Us")}
                  >
                    Partner With Us
                  </button>
                  <button
                    data-cat="Courier / Rider Help"
                    type="button"
                    className={
                      category === "Courier / Rider Help"
                        ? "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed font-bold shadow-sm transition-all"
                        : "category-pill font-label-md text-label-md px-space-md py-space-xs rounded-full bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
                    }
                    onClick={() => setCategory("Courier / Rider Help")}
                  >
                    Courier / Rider Help
                  </button>
                </div>
                <form
                  className="flex flex-col gap-space-md"
                  id="contactForm"
                  onSubmit={submitContact}
                >
                  <input
                    id="selectedCategory"
                    name="category"
                    type="hidden"
                    value={category}
                    readOnly={true}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-space-xs">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="fullName"
                      >
                        Full Name <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          person
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-space-md py-space-xs rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all"
                          id="fullName"
                          placeholder="Elena Rostova"
                          required
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-space-xs">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="emailAddr"
                      >
                        Email Address <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          alternate_email
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-space-md py-space-xs rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all"
                          id="emailAddr"
                          placeholder="elena@example.com"
                          required
                          type="email"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-space-xs">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="phoneNum"
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          smartphone
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-space-md py-space-xs rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all"
                          id="phoneNum"
                          placeholder="+1 (555) 019-2834"
                          type="tel"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-space-xs">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="orderId"
                      >
                        Order ID{" "}
                        <span className="font-body-sm text-body-sm text-secondary font-normal">
                          (Optional)
                        </span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          receipt_long
                        </span>
                        <input
                          className="w-full bg-surface-container-low pl-10 pr-space-md py-space-xs rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all"
                          id="orderId"
                          placeholder="#FD-948210"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label
                      className="font-label-md text-label-md text-on-surface"
                      htmlFor="subjectLine"
                    >
                      Subject <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                        chat
                      </span>
                      <input
                        className="w-full bg-surface-container-low pl-10 pr-space-md py-space-xs rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all"
                        id="subjectLine"
                        placeholder="Question about merchant commission structures..."
                        required
                        type="text"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label
                      className="font-label-md text-label-md text-on-surface"
                      htmlFor="messageBody"
                    >
                      Detailed Message <span className="text-error">*</span>
                    </label>
                    <textarea
                      className="w-full bg-surface-container-low p-space-md rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all resize-y"
                      id="messageBody"
                      placeholder="Please provide background details, restaurant name or active delivery instructions..."
                      required
                      rows="4"
                    ></textarea>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-sm">
                    <div className="flex items-center gap-space-xs text-secondary">
                      <span
                        className="material-symbols-outlined text-tertiary-container text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        timer
                      </span>
                      <span className="font-body-sm text-body-sm">
                        Typical response time:{" "}
                        <strong className="text-on-surface font-semibold">
                          &lt; 15 minutes
                        </strong>
                      </span>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-space-sm bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-sm rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
                      type="submit"
                      disabled={sending}
                    >
                      <span>{sending ? "Sending…" : "Send Message"}</span>
                      <span className={`material-symbols-outlined text-[20px] ${sending ? "animate-spin" : ""}`}>
                        {sending ? "progress_activity" : "send"}
                      </span>
                    </button>
                  </div>
                  {sendError && (
                    <p className="font-body-sm text-body-sm text-error" role="alert">
                      {sendError}
                    </p>
                  )}
                  <div
                    id="formSuccess"
                    className={
                      sent
                        ? "mt-space-sm p-space-md bg-secondary-fixed rounded-lg text-on-secondary-fixed flex items-center gap-space-sm animate-fadeIn"
                        : "hidden mt-space-sm p-space-md bg-secondary-fixed rounded-lg text-on-secondary-fixed flex items-center gap-space-sm animate-fadeIn"
                    }
                  >
                    <span className="material-symbols-outlined text-tertiary text-[24px]">
                      check_circle
                    </span>
                    <p className="font-body-md text-body-md">
                      Thank you! Your message has been sent and we will reply to
                      your email soon.
                    </p>
                  </div>
                </form>
              </div>
              {/* Right: Office Hubs, Operating Hours & Live Status (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                {/* Live Operational Status Indicator Card */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                        Live Dispatch Active
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed font-semibold px-space-xs py-0.5 rounded-full">
                      All Systems Normal
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm mt-space-md bg-surface-container-low rounded-lg p-space-sm text-center">
                    <div>
                      <p className="font-label-sm text-label-sm text-secondary uppercase">
                        Driver Courier Pool
                      </p>
                      <p className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
                        99.8% Online
                      </p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-secondary uppercase">
                        Average Delivery
                      </p>
                      <p className="font-headline-sm text-headline-sm text-primary-container font-bold mt-0.5">
                        26.4 Mins
                      </p>
                    </div>
                  </div>
                </div>
                {/* Operating Hours Card */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                  <div className="flex items-center gap-space-xs mb-space-md">
                    <span className="material-symbols-outlined text-primary-container text-[24px]">
                      schedule
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Operating Hours
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-space-sm divide-y-0">
                    <li className="flex items-center justify-between py-space-xs bg-surface-container-low px-space-md rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Customer Care &amp; Hotline
                        </span>
                        <span className="font-body-sm text-body-sm text-secondary">
                          In-app chat &amp; 1-800 phone
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-0.5 rounded font-bold">
                        24/7 / 365 Days
                      </span>
                    </li>
                    <li className="flex items-center justify-between py-space-xs bg-surface-container-low px-space-md rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Partner &amp; Merchant Support
                        </span>
                        <span className="font-body-sm text-body-sm text-secondary">
                          Kitchen tablet onboarding team
                        </span>
                      </div>
                      <span className="font-label-md text-label-md text-on-surface">
                        Mon–Sun 8AM–10PM EST
                      </span>
                    </li>
                    <li className="flex items-center justify-between py-space-xs bg-surface-container-low px-space-md rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Corporate Accounts &amp; Press
                        </span>
                        <span className="font-body-sm text-body-sm text-secondary">
                          Executive inquiries
                        </span>
                      </div>
                      <span className="font-label-md text-label-md text-on-surface">
                        Mon–Fri 9AM–6PM PST
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Office Hubs & Interactive Map Section */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary-container text-[24px]">
                        location_city
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Regional Headquarters
                      </h3>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary">
                      2 Main Hubs
                    </span>
                  </div>
                  {/* Map View Container */}
                  <div
                    className="w-full h-44 rounded-lg bg-cover bg-center relative overflow-hidden shadow-inner flex items-end p-space-md"
                    data-location="San Francisco, CA"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB86IQZX8p3nM1Xx1ANIyjVDnRGPb6qpHj5Qxdh6QifL7HFEiGb4OFzysXdb3Tacm_AHh21W0i_I1ZnBhmtrsq5ka5WayWJ0DiSLEkJG2FD00EFu_jOwloI2U5SmyzxQRrd5jroKjGdfckP6fJVuN--ZuvoADP9GfuUOUXUoLw1KhjatzHdMXrTGUQ6iJF6XFLtSCjNBdZy8I8uSBgZu0TNXEk9Ju_x95qlggOfEeWB')",
                    }}
                  >
                    <div className="bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-lg shadow-sm flex items-center justify-between w-full">
                      <div className="flex items-center gap-space-xs">
                        <span
                          className="material-symbols-outlined text-primary-container text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          pin_drop
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface font-bold">
                          Pacific Coast Hub • SF
                        </span>
                      </div>
                      <a
                        className="font-label-sm text-label-sm text-primary hover:underline"
                        href="#"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                    <div className="bg-surface-container-low p-space-md rounded-lg">
                      <p className="font-label-md text-label-md text-on-surface font-bold">
                        San Francisco, CA
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                        500 Howard Street, Suite 400
                        <br />
                        San Francisco, CA 94105
                      </p>
                      <span className="font-label-sm text-label-sm text-primary mt-space-xs inline-block">
                        Pacific Time Zone
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-lg">
                      <p className="font-label-md text-label-md text-on-surface font-bold">
                        New York, NY
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                        250 Broadway, 18th Floor
                        <br />
                        New York, NY 10007
                      </p>
                      <span className="font-label-sm text-label-sm text-primary mt-space-xs inline-block">
                        Eastern Time Zone
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Support Team & Kitchen Ops Visual Break */}
          <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl">
            <div className="bg-surface-container-low rounded-2xl overflow-hidden p-space-lg sm:p-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              <div className="lg:col-span-5 flex flex-col gap-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                  Inside Dispatch Central
                </span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">
                  Real People, Real-Time Culinary Logistics
                </h3>
                <p className="font-body-md text-body-md text-secondary">
                  Our multi-lingual dispatch team monitors kitchen backlogs,
                  weather contingencies, and courier pathways in real time so
                  your hot meals arrive pristine.
                </p>
                <div className="flex items-center gap-space-lg pt-space-xs">
                  <div>
                    <p className="font-headline-md text-headline-md text-on-surface font-bold">
                      4.9/5
                    </p>
                    <p className="font-body-sm text-body-sm text-secondary">
                      CSAT Resolution Score
                    </p>
                  </div>
                  <div>
                    <p className="font-headline-md text-headline-md text-primary-container font-bold">
                      3,400+
                    </p>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Active Partner Kitchens
                    </p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-2 gap-space-md">
                <div className="relative h-56 rounded-xl overflow-hidden shadow-sm">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="Warm modern customer support headquarters office with friendly specialist smiling into a headset with multiple delivery status monitors showing real-time dispatch routes, orange branding details and soft natural studio lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDgUOBhGjjyHGlWg68fDQeQri0t6l4Y41BWCGY2FXIaXRnckEGhNWXjIHZrkBGCK_ebG4n-KPyJnOOrf_2bmlyM2W6PxXYRlvby-UF4hltiClks3gT2tZVKVnq7Cs_zy0ukIgJpBKRR4sOCOXhGRj4GhXQEnbQjNrIIy5m3l6SXClUtd1Wvytx7vUa7n8XEJqN9aBYcxYrvA1VBdbwqCFJV_3Z-faCUfN9izZScF6u"
                  />
                  <div className="absolute bottom-2 left-2 bg-inverse-surface/80 text-inverse-on-surface px-space-xs py-0.5 rounded text-label-sm font-label-sm backdrop-blur-sm">
                    SF Operations Floor
                  </div>
                </div>
                <div className="relative h-56 rounded-xl overflow-hidden shadow-sm">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="Close up shot of fresh artisan pizza being safely packed into a FoodOrder delivery thermal insulated bag with steam rising, clean commercial kitchen in background with warm ambient dining lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY_TujrPLKq6FSTAAzJrKrAJ6n8NoSpJWVR3miqu29IerCa496pMFfMcs42oNv_V3D7t6ooKlxWDUz2e_TiP0siHyaqdboLQOFw4BpQfzjnBLeNr0jD-7YaeTovF_uf4mMJdQGAeRcOuTD8Qmc8o-RebgX9Y9QVMPjPrJ3unrD6iADOaC5zXiP9ur7EAOJdHPFhcvFMM9kkHj8sT6wt1TvHCqVVOvBNlwL224rARKq"
                  />
                  <div className="absolute bottom-2 left-2 bg-inverse-surface/80 text-inverse-on-surface px-space-xs py-0.5 rounded text-label-sm font-label-sm backdrop-blur-sm">
                    Quality Assurance Check
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Frequently Asked Questions (Accordion) */}
          <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl">
            <div className="max-w-3xl mx-auto flex flex-col items-center text-center pb-space-xl">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Quick Resolution Guide
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mt-space-xs">
                Frequently Asked Questions
              </h2>
              <p className="font-body-md text-body-md text-secondary mt-space-xs">
                Answers to immediate questions before submitting an inquiry.
              </p>
            </div>
            <div
              className="max-w-3xl mx-auto flex flex-col gap-space-sm"
              id="faqAccordion"
            >
              {/* Accordion Item 1 */}
              <div className="faq-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all">
                <button
                  className="faq-toggle w-full p-space-lg flex items-center justify-between text-left gap-space-md focus:outline-none"
                  type="button"
                  onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                >
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    How do I track my live order?
                  </span>
                  <span
                    className="material-symbols-outlined faq-icon text-secondary text-[24px] transition-transform duration-200"
                    style={{
                      transform:
                        openFaq === 0 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={
                    openFaq === 0
                      ? "faq-content px-space-lg pb-space-lg"
                      : "faq-content px-space-lg pb-space-lg hidden"
                  }
                >
                  <p className="font-body-md text-body-md text-secondary">
                    Once a restaurant confirms your meal prep, you can follow
                    your courier's GPS location live within the FoodOrder mobile
                    application or via the web tracker link sent to your SMS.
                    The tracker displays live estimated arrival time, vehicle
                    type, and direct encrypted chat with your courier.
                  </p>
                </div>
              </div>
              {/* Accordion Item 2 */}
              <div className="faq-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all">
                <button
                  className="faq-toggle w-full p-space-lg flex items-center justify-between text-left gap-space-md focus:outline-none"
                  type="button"
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                >
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    What are the fees for multi-tenant merchant onboarding?
                  </span>
                  <span
                    className="material-symbols-outlined faq-icon text-secondary text-[24px] transition-transform duration-200"
                    style={{
                      transform:
                        openFaq === 1 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={
                    openFaq === 1
                      ? "faq-content px-space-lg pb-space-lg"
                      : "faq-content px-space-lg pb-space-lg hidden"
                  }
                >
                  <p className="font-body-md text-body-md text-secondary">
                    We offer transparent, commission-tiered pricing starting
                    with a 0% setup fee and no hidden terminal charges. We
                    provide customized packages for standalone family kitchens
                    as well as national multi-tenant franchises. Contact{" "}
                    <a
                      className="text-primary font-semibold hover:underline"
                      href="mailto:merchants@foodorder.com"
                    >
                      merchants@foodorder.com
                    </a>{" "}
                    to receive an individualized tier breakdown.
                  </p>
                </div>
              </div>
              {/* Accordion Item 3 */}
              <div className="faq-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all">
                <button
                  className="faq-toggle w-full p-space-lg flex items-center justify-between text-left gap-space-md focus:outline-none"
                  type="button"
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                >
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    How do I report a missing item or allergy concern?
                  </span>
                  <span
                    className="material-symbols-outlined faq-icon text-secondary text-[24px] transition-transform duration-200"
                    style={{
                      transform:
                        openFaq === 2 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={
                    openFaq === 2
                      ? "faq-content px-space-lg pb-space-lg"
                      : "faq-content px-space-lg pb-space-lg hidden"
                  }
                >
                  <p className="font-body-md text-body-md text-secondary">
                    Navigate to "My Orders", tap your active or recent receipt,
                    and tap "Help with Order". Our automated resolution engine
                    triggers an instant refund, kitchen remake, or driver
                    redelivery within 90 seconds without requiring you to wait
                    on hold.
                  </p>
                </div>
              </div>
              {/* Accordion Item 4 */}
              <div className="faq-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all">
                <button
                  className="faq-toggle w-full p-space-lg flex items-center justify-between text-left gap-space-md focus:outline-none"
                  type="button"
                  onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                >
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Can I schedule recurring orders for my office team?
                  </span>
                  <span
                    className="material-symbols-outlined faq-icon text-secondary text-[24px] transition-transform duration-200"
                    style={{
                      transform:
                        openFaq === 3 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={
                    openFaq === 3
                      ? "faq-content px-space-lg pb-space-lg"
                      : "faq-content px-space-lg pb-space-lg hidden"
                  }
                >
                  <p className="font-body-md text-body-md text-secondary">
                    Yes! Our Corporate Catering portal lets office managers set
                    recurrent lunch calendars, group budgets, and dietary filter
                    preferences with aggregated consolidated monthly billing.
                    Contact our B2B team to launch a pilot week for your
                    company.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* Bottom Reassurance Banner */}
          <section className="max-w-[1280px] mx-auto px-margin pb-space-3xl">
            <div className="bg-gradient-to-r from-on-background via-inverse-surface to-on-background text-inverse-on-surface rounded-2xl p-space-xl sm:p-space-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-space-lg">
              <div className="flex items-center gap-space-lg">
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary shadow-md shrink-0">
                  <span
                    className="material-symbols-outlined text-[34px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    support
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="inline-flex items-center gap-space-xs text-primary-fixed mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span>
                    <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider">
                      Urgent Active Order?
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-inverse-on-surface">
                    Need immediate help with an ongoing order?
                  </h3>
                  <p className="font-body-md text-body-md text-secondary-fixed-dim mt-0.5">
                    Skip the queue: jump directly into prioritized dispatch
                    routing.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-md shrink-0 w-full sm:w-auto">
                <a
                  className="inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-inverse-on-surface font-label-lg text-label-lg px-space-lg py-space-sm rounded-xl transition-all w-full sm:w-auto"
                  href="tel:18003663673"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    phone
                  </span>{" "}
                  Call 1-800
                </a>
                <button
                  className="inline-flex items-center justify-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-xl py-space-sm rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
                  type="button"
                  onClick={() =>
                    alert("Connecting to live dispatch specialist...")
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chat
                  </span>{" "}
                  Open Live Support Chat
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
