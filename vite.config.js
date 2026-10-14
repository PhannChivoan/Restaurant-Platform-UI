import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  // Dev server: pre-bundle the heavy libraries once and pre-compile the admin shell at start-up,
  // so the first visit to each admin page does not wait for the dev server to transform them.
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "antd", "dayjs", "axios", "nprogress", "lucide-react", "leaflet", "react-leaflet", "recharts"],
  },
  server: {
    warmup: {
      clientFiles: [
        "./src/main.jsx",
        "./src/App.jsx",
        "./src/AdminApp.jsx",
        "./src/components/layout/*.jsx",
        "./src/pages/DashboardPage.jsx",
        "./src/pages/OrdersPage.jsx",
        "./src/pages/PendingOrdersPage.jsx",
        "./src/pages/RestaurantsPage.jsx",
        "./src/pages/DispatchPage.jsx",
        "./src/pages/BranchesPage.jsx",
        "./src/pages/LoginPage.jsx",
      ],
    },
  },
});