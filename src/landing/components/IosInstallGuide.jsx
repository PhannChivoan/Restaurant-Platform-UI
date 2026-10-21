import { useEffect, useRef, useState } from "react";

import "../install-guide.css";

/*
 * Step-by-step "add to Home Screen" guide for iPhone / iPad, shown after the iOS button is tapped.
 * Two ways: the profile that was just downloaded (Settings), or the quick Share-button route.
 * Each step has a small drawn mock-up of the iOS screen so people can find the right button.
 */

const Pulse = ({ children, label }) => (
  <span className="ig-pulse" aria-label={label}>
    {children}
  </span>
);

/* ---------- little iOS screens (drawn with CSS, nothing to load) ---------- */

const MockAllow = () => (
  <div className="ig-mock ig-mock-center" aria-hidden="true" data-no-translate>
    <div className="ig-alert">
      <p className="ig-alert-title">This website is trying to download a configuration profile.</p>
      <p className="ig-alert-sub">Do you want to allow this?</p>
      <div className="ig-alert-actions">
        <span>Ignore</span>
        <Pulse>
          <b>Allow</b>
        </Pulse>
      </div>
    </div>
  </div>
);

const MockSettings = () => (
  <div className="ig-mock" aria-hidden="true" data-no-translate>
    <div className="ig-set-title">Settings</div>
    <div className="ig-row ig-row-hl">
      <span className="ig-row-ic ig-ic-blue">
        <span className="material-symbols-outlined">verified_user</span>
      </span>
      <Pulse>
        <b>Profile Downloaded</b>
      </Pulse>
      <span className="material-symbols-outlined ig-chev">chevron_right</span>
    </div>
    <div className="ig-row">
      <span className="ig-row-ic ig-ic-gray">
        <span className="material-symbols-outlined">settings</span>
      </span>
      <span>General</span>
      <span className="material-symbols-outlined ig-chev">chevron_right</span>
    </div>
    <div className="ig-row">
      <span className="ig-row-ic ig-ic-orange">
        <span className="material-symbols-outlined">wifi</span>
      </span>
      <span>Wi-Fi</span>
      <span className="material-symbols-outlined ig-chev">chevron_right</span>
    </div>
  </div>
);

const MockInstall = ({ icon }) => (
  <div className="ig-mock" aria-hidden="true" data-no-translate>
    <div className="ig-bar">
      <span className="ig-link">Cancel</span>
      <span className="ig-bar-title">Install Profile</span>
      <Pulse>
        <b className="ig-link">Install</b>
      </Pulse>
    </div>
    <div className="ig-profile">
      <img src={icon} alt="" width="44" height="44" />
      <div>
        <p className="ig-profile-name">FoodOrder</p>
        <p className="ig-profile-sub">Adds the FoodOrder icon to your Home Screen</p>
      </div>
    </div>
    <p className="ig-fine">Signed by: <i>Not Signed</i> - this is normal for a Home Screen shortcut.</p>
  </div>
);

const MockHome = ({ icon }) => (
  <div className="ig-mock ig-home" aria-hidden="true" data-no-translate>
    {[0, 1, 2].map((i) => (
      <span key={i} className="ig-app" />
    ))}
    <span className="ig-app ig-app-us">
      <img src={icon} alt="" width="46" height="46" />
      <em>FoodOrder</em>
    </span>
    {[4, 5, 6, 7].map((i) => (
      <span key={i} className="ig-app" />
    ))}
  </div>
);

const MockSafari = () => (
  <div className="ig-mock ig-safari" aria-hidden="true" data-no-translate>
    <div className="ig-url">foodorder.example</div>
    <div className="ig-toolbar">
      <span className="material-symbols-outlined">arrow_back_ios</span>
      <span className="material-symbols-outlined">arrow_forward_ios</span>
      <Pulse>
        <span className="material-symbols-outlined ig-share">ios_share</span>
      </Pulse>
      <span className="material-symbols-outlined">book</span>
      <span className="material-symbols-outlined">filter_none</span>
    </div>
  </div>
);

const MockShareSheet = () => (
  <div className="ig-mock" aria-hidden="true" data-no-translate>
    <div className="ig-list">
      <div className="ig-li">
        <span>Copy</span>
        <span className="material-symbols-outlined">content_copy</span>
      </div>
      <div className="ig-li">
        <span>Add to Bookmarks</span>
        <span className="material-symbols-outlined">book</span>
      </div>
      <div className="ig-li ig-li-hl">
        <Pulse>
          <b>Add to Home Screen</b>
        </Pulse>
        <span className="material-symbols-outlined">add_box</span>
      </div>
      <div className="ig-li">
        <span>Find on Page</span>
        <span className="material-symbols-outlined">search</span>
      </div>
    </div>
  </div>
);

const MockAdd = ({ icon }) => (
  <div className="ig-mock" aria-hidden="true" data-no-translate>
    <div className="ig-bar">
      <span className="ig-link">Cancel</span>
      <span className="ig-bar-title">Add to Home Screen</span>
      <Pulse>
        <b className="ig-link">Add</b>
      </Pulse>
    </div>
    <div className="ig-add">
      <img src={icon} alt="" width="52" height="52" />
      <div>
        <p className="ig-profile-name">FoodOrder</p>
        <p className="ig-profile-sub">foodorder.example</p>
      </div>
    </div>
  </div>
);

/* ---------- the guide ---------- */

const PROFILE_STEPS = [
  { title: "Tap Allow", text: "Safari asks to download a profile. Tap Allow, then Close.", mock: MockAllow },
  { title: "Open Settings", text: "Open the Settings app and tap Profile Downloaded at the top. Not there? Go to Settings → General → VPN & Device Management.", mock: MockSettings },
  { title: "Tap Install", text: "Tap Install in the top corner, type your passcode, then tap Install again and Done.", mock: MockInstall },
  { title: "Open the app", text: "The FoodOrder icon is now on your Home Screen. Tap it any time, like a normal app.", mock: MockHome },
];

const SHARE_STEPS = [
  { title: "Tap Share", text: "In Safari, tap the Share button in the bottom bar (the square with an arrow).", mock: MockSafari },
  { title: "Add to Home Screen", text: "Scroll down the list and tap Add to Home Screen.", mock: MockShareSheet },
  { title: "Tap Add", text: "Keep the name FoodOrder and tap Add in the top corner. The icon appears on your Home Screen.", mock: MockAdd },
];

const IosInstallGuide = ({ open, onClose, onDownloadAgain, startTab = "profile", notSafari = false }) => {
  const [tab, setTab] = useState(startTab);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const icon = "/apple-touch-icon.png";

  // the tab the guide opens on follows how it was opened
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => setTab(startTab), 0);
    return () => clearTimeout(t);
  }, [open, startTab]);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page behind must not scroll
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const steps = tab === "profile" ? PROFILE_STEPS : SHARE_STEPS;

  return (
    <div className={`ig-layer${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="ig-title">
      <button type="button" className="ig-backdrop" aria-label="Close" onClick={close} tabIndex={-1} />
      <div className="ig-sheet">
        <div className="ig-grip" />

        <header className="ig-head">
          <img src={icon} alt="" width="56" height="56" className="ig-appicon" />
          <div className="ig-head-text">
            <h2 id="ig-title">Add FoodOrder to your Home Screen</h2>
            <p>It takes about 30 seconds. Pick the way that suits you.</p>
          </div>
          <button type="button" ref={closeRef} className="ig-x" onClick={close} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {notSafari && (
          <p className="ig-warn">
            <span className="material-symbols-outlined">info</span>
            You are not in Safari. The Share steps below work in most iPhone browsers; for the profile, open this page in Safari.
          </p>
        )}

        <div className="ig-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? "is-on" : ""} onClick={() => setTab("profile")}>
            <span className="material-symbols-outlined">settings</span>
            Install profile
          </button>
          <button type="button" role="tab" aria-selected={tab === "share"} className={tab === "share" ? "is-on" : ""} onClick={() => setTab("share")}>
            <span className="material-symbols-outlined">ios_share</span>
            Use Share button
          </button>
        </div>

        <p className="ig-lead">
          {tab === "profile"
            ? "The profile was just downloaded. Follow these steps in order:"
            : "No profile needed. Do this in Safari, on this page:"}
        </p>

        <ol className="ig-steps">
          {steps.map(({ title, text, mock: Mock }, i) => (
            <li key={`${tab}-${title}`} className="ig-step" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="ig-num">{i + 1}</span>
              <div className="ig-step-body">
                <h3>{title}</h3>
                <p>{text}</p>
                <Mock icon={icon} />
              </div>
            </li>
          ))}
        </ol>

        <footer className="ig-foot">
          {tab === "profile" ? (
            <>
              <button type="button" className="ig-btn ig-btn-ghost" onClick={onDownloadAgain}>
                <span className="material-symbols-outlined">download</span>
                Download again
              </button>
              <button type="button" className="ig-btn ig-btn-text" onClick={() => setTab("share")}>
                Prefer no profile? Use Share
              </button>
            </>
          ) : (
            <button type="button" className="ig-btn ig-btn-text" onClick={() => setTab("profile")}>
              Use the profile instead
            </button>
          )}
          <button type="button" className="ig-btn ig-btn-primary" onClick={close}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
};

export default IosInstallGuide;
