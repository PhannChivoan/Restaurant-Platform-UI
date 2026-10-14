import { lazy, Suspense } from "react";

const LandingApp = lazy(() => import("./landing/LandingApp"));
const AdminApp = lazy(() => import("./AdminApp"));

const isAdminPath = (pathname) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

const isRiderPath = (pathname) =>
  pathname === "/rider" || pathname.startsWith("/rider/");

// The old standalone driver app now lives inside the admin dashboard ("My Deliveries").
if (isRiderPath(window.location.pathname)) {
  window.location.replace(window.location.pathname.startsWith("/rider/register") ? "/admin/register" : "/admin/driver");
}

function App() {
  return (
    <Suspense fallback={null}>
      {isAdminPath(window.location.pathname) ? <AdminApp /> : isRiderPath(window.location.pathname) ? null : <LandingApp />}
    </Suspense>
  );
}

export default App;
