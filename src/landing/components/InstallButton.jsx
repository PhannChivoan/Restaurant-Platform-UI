import { useEffect, useState } from "react";

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState(
    window.deferredInstallPrompt || null
  );
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const onReady = () => setInstallPrompt(window.deferredInstallPrompt);
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      window.deferredInstallPrompt = null;
    };

    window.addEventListener("pwa-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
  if (isIOS) {
    window.location.href = "/FoodOrder.mobileconfig";
    return;
  }

  // Read the latest event at click time, not from stale state
  const promptEvent = installPrompt || window.deferredInstallPrompt;

  if (promptEvent) {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setInstallPrompt(null);
    window.deferredInstallPrompt = null;
    return;
  }

  alert(
    "Installation is not available right now. Open your browser menu " +
      'and look for "Install app" or "Add to Home Screen".'
  );
};

  if (isInstalled) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 50 }}>
      <button
        onClick={handleInstall}
        style={{
          background: "linear-gradient(135deg, #ff4d4d, #dc2626)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px 28px",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(220,38,38,0.3)",
        }}
      >
        <span style={{ marginRight: 8 }}>⬇</span>
        Install App
      </button>
    </div>
  );
}