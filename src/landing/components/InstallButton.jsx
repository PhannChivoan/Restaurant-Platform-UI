import { useEffect, useState } from "react";

import IosInstallGuide from "./IosInstallGuide";

const BADGE =
  "inline-flex items-center gap-space-sm bg-on-background px-space-md py-space-xs rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-inverse-surface transition-colors";

const ua = () => navigator.userAgent;

const detectIOS = () =>
  /iphone|ipad|ipod/i.test(ua()) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const detectAndroid = () => /android/i.test(ua());

const detectSafariIOS = () =>
  /safari/i.test(ua()) &&
  !/crios|fxios|edgios|opios|fban|fbav|instagram|line|telegram|tiktok/i.test(
    ua()
  );

const CONFIG = {
  ios: { icon: "phone_iphone", small: "Install on", big: "iPhone (iOS)" },
  android: { icon: "play_arrow", small: "Install on", big: "Android" },
};

export default function InstallButton({ platform }) {
  const [installPrompt, setInstallPrompt] = useState(
    window.deferredInstallPrompt || null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [guide, setGuide] = useState(null); // { tab, notSafari } while the iPhone guide is open

  const downloadProfile = () => {
    window.location.href = "/FoodOrder.mobileconfig";
  };

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

  const handleClick = async () => {
    const isIOS = detectIOS();
    const isAndroid = detectAndroid();

    // ---------- iOS button ----------
    if (platform === "ios") {
      if (!isIOS) {
        alert(
          isAndroid
            ? "You are on an Android device. Please use the Android install button instead."
            : "This button is for iPhone and iPad. Open this page on your iPhone in Safari, or use the Android button on an Android phone."
        );
        return;
      }
      if (!detectSafariIOS()) {
        // the profile only installs from Safari: show the Share steps instead (they work in most iPhone browsers)
        setGuide({ tab: "share", notSafari: true });
        return;
      }
      // show the steps first, then start the download: Safari asks "Allow?" on top of the guide
      setGuide({ tab: "profile", notSafari: false });
      setTimeout(downloadProfile, 450);
      return;
    }

    // ---------- Android button ----------
    if (isIOS) {
      alert(
        "You are on an iPhone or iPad. Please use the iOS install button instead."
      );
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

  const { icon, small, big } = CONFIG[platform];

  return (
    <>
      <button type="button" onClick={handleClick} className={BADGE}>
        <span className="material-symbols-outlined text-inverse-on-surface text-[26px]">
          {icon}
        </span>
        <div className="flex flex-col text-left">
          <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider">
            {small}
          </span>
          <span className="font-label-lg text-label-lg text-inverse-on-surface">
            {big}
          </span>
        </div>
      </button>
      {platform === "ios" && (
        <IosInstallGuide
          open={guide !== null}
          startTab={guide?.tab ?? "profile"}
          notSafari={guide?.notSafari ?? false}
          onClose={() => setGuide(null)}
          onDownloadAgain={downloadProfile}
        />
      )}
    </>
  );
}