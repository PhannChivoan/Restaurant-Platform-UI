import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import "./admin.css";
import { lazy, Suspense, useEffect } from "react";
import { App as AntdApp } from "antd";

import AuthLayout from "./components/layout/AuthLayout";
import RootLayout from "./components/layout/RootLayout";

// Main
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const OperationsAnalyticsPage = lazy(
  () => import("./pages/OperationsAnalyticsPage"),
);
const ProductPage = lazy(() => import("./pages/ProductPage"));
const DriverPage = lazy(() => import("./pages/DriverPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));

// Customers
const CustomersPage = lazy(() => import("./pages/CustomersPage"));

// Orders
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const PendingOrdersPage = lazy(() => import("./pages/PendingOrdersPage"));
const CompletedOrdersPage = lazy(() => import("./pages/CompletedOrdersPage"));
const DispatchPage = lazy(() => import("./pages/DispatchPage"));
const DeliveryTrackingPage = lazy(() => import("./pages/DeliveryTrackingPage"));
const KitchenPage = lazy(() => import("./pages/KitchenPage"));
const RiderEarningsPage = lazy(() => import("./pages/RiderEarningsPage"));

// Partners
const RestaurantsPage = lazy(() => import("./pages/RestaurantsPage"));
const DeliveryZonesPage = lazy(() => import("./pages/DeliveryZonesPage"));
const BranchesPage = lazy(() => import("./pages/BranchesPage"));
const MenuCategoriesPage = lazy(() => import("./pages/MenuCategoriesPage"));
const MenuModifiersPage = lazy(() => import("./pages/MenuModifiersPage"));

// Growth
const PromotionsPage = lazy(() => import("./pages/PromotionsPage"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const RedemptionsPage = lazy(() => import("./pages/RedemptionsPage"));

// Insights
const RevenuePage = lazy(() => import("./pages/RevenuePage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const DeliveryPerformancePage = lazy(
  () => import("./pages/DeliveryPerformancePage"),
);

// Settings
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const UsersRolesPage = lazy(() => import("./pages/UsersRolesPage"));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage"));
const AccessWindowsPage = lazy(() => import("./pages/AccessWindowsPage"));
const ShiftSchedulesPage = lazy(() => import("./pages/ShiftSchedulesPage"));

// Customers
const CustomerAddressesPage = lazy(
  () => import("./pages/CustomerAddressesPage"),
);
const CustomerHistoryPage = lazy(() => import("./pages/CustomerHistoryPage"));

// Auth
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));


function AdminApp() {
  // After the first screen is up, fetch the code of the most-used pages in the background,
  // so opening them later does not wait on a download.
  useEffect(() => {
    if (!import.meta.env.PROD) return undefined; // in dev every import is a compile; only prefetch in the production build
    const t = setTimeout(() => {
      import("./pages/OrdersPage");
      import("./pages/PendingOrdersPage");
      import("./pages/RestaurantsPage");
      import("./pages/DispatchPage");
      import("./pages/BranchesPage");
      import("./pages/PromotionsPage");
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AntdApp>
      <BrowserRouter basename="/admin">
        <Suspense fallback={null}>
          <Routes>
            <Route element={<RootLayout />}>
              {/* Main */}
              <Route path="/" element={<DashboardPage />} />
              <Route
                path="/analytics/operations"
                element={<OperationsAnalyticsPage />}
              />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/driver" element={<DriverPage />} />

              {/* Customers */}
              <Route path="/customers" element={<CustomersPage />} />

              {/* Orders */}
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/pending" element={<PendingOrdersPage />} />
              <Route path="/orders/completed" element={<CompletedOrdersPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route
                path="/dispatch/tracking"
                element={<DeliveryTrackingPage />}
              />
              <Route path="/dispatch/earnings" element={<RiderEarningsPage />} />

              {/* Partners */}
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/restaurants/branches" element={<BranchesPage />} />
              <Route
                path="/products/categories"
                element={<MenuCategoriesPage />}
              />
              <Route path="/products/modifiers" element={<MenuModifiersPage />} />
              <Route path="/delivery-zones" element={<DeliveryZonesPage />} />

              {/* Customer details */}
              <Route
                path="/customers/addresses"
                element={<CustomerAddressesPage />}
              />
              <Route
                path="/customers/history"
                element={<CustomerHistoryPage />}
              />

              {/* Growth */}
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/promotions/loyalty" element={<LoyaltyPage />} />
              <Route
                path="/promotions/redemptions"
                element={<RedemptionsPage />}
              />

              {/* Insights */}
              <Route path="/analytics/revenue" element={<RevenuePage />} />
              <Route
                path="/analytics/delivery"
                element={<DeliveryPerformancePage />}
              />
              <Route path="/activity-log" element={<ActivityLogPage />} />

              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/categories" element={<CategoriesPage />} />
              <Route path="/settings/users" element={<UsersRolesPage />} />
              <Route path="/settings/permissions" element={<PermissionsPage />} />
              <Route
                path="/settings/access-windows"
                element={<AccessWindowsPage />}
              />
              <Route
                path="/settings/shift-schedules"
                element={<ShiftSchedulesPage />}
              />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* =====================================
                404
            ====================================== */}

            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-semibold">404 Not Found</h1>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AntdApp>
  );
}

export default AdminApp;
