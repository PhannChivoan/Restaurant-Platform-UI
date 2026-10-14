import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "antd/dist/reset.css";
import App from "./App.jsx";
import { loadPlatformConfig } from "./utils/platformSettings";

// Platform settings drive branding, currency and maintenance, so they are read
// before the first paint instead of after the shell mounts.
loadPlatformConfig();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
