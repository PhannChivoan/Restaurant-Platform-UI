import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import ScrollToTop from "./ScrollToTop";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import FloatingCart from "./FloatingCart";
import { CartProvider } from "../context/CartContext";
import { AddressProvider } from "../context/AddressContext";
import { startTranslator } from "../translate";

const BODY_CLASSES = [
  "bg-surface",
  "font-body-md",
  "text-body-md",
  "text-on-surface",
];

const LandingLayout = () => {
  // The original pages set these classes on <body>; do it only while the
  // landing site is mounted so the admin dashboard is never affected.
  useEffect(() => {
    document.body.classList.add(...BODY_CLASSES);
    return () => document.body.classList.remove(...BODY_CLASSES);
  }, []);

  // Khmer: translate the page text while the storefront is open
  useEffect(() => startTranslator(), []);

  return (
    <CartProvider>
      <AddressProvider>
      <ScrollToTop />
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      {/* room for the bottom tab bar on phones */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <FloatingCart />
      </AddressProvider>
    </CartProvider>
  );
};

export default LandingLayout;
