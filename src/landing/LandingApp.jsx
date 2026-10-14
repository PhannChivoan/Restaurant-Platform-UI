import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./landing.css";

import LandingLayout from "./components/LandingLayout";
import Restaurant from "./pages/Restaurant";

// Public website pages
const HomePage = lazy(() => import("./pages/HomePage"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ItemPage = lazy(() => import("./pages/ItemPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const PartnerRegisterPage = lazy(() => import("./pages/PartnerRegisterPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

// Customer auth (one page, two modes: /login and /signup)
const AuthPage = lazy(() => import("./pages/AuthPage"));

const NotFound = () => (
  <main className="w-full pt-20 bg-surface">
    <div className="min-h-[60vh] flex items-center justify-center">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">
        404 Not Found
      </h1>
    </div>
  </main>
);

function LandingApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/shop" element={<ShopPage />} />
            <Route path="/order/item/:id" element={<ItemPage />} />
            <Route path="/checkout/:restaurantId" element={<CheckoutPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/partner/register" element={<PartnerRegisterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/order/restaurant" element={<Restaurant />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default LandingApp;
