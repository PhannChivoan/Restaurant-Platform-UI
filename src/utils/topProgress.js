import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  minimum: 0.3,
  easing: "ease-out",
  speed: 150,
  trickleSpeed: 250,
});

let activeCount = 0;
let startTimer = null;

const beginVisual = () => {
  clearTimeout(startTimer);
  startTimer = null;
  NProgress.start();
};

export const topProgress = {
  /**
   * Begin tracking one unit of work (ref-counted — the bar stays up
   * until every tracked unit finishes). Returns a disposer function.
   */
  start() {
    activeCount += 1;

    if (activeCount === 1) {
      // Only show the bar for requests that really take a while (fast ones never flash it).
      startTimer = setTimeout(beginVisual, 450);
    }

    return () => this.finish();
  },

  /**
   * Determinate mode — like <LinearProgress variant="determinate" />.
   * @param {number} percent progress in percent (0-100)
   */
  set(percent) {
    const clamped = Math.min(99.5, Math.max(4, Number(percent) || 0));

    if (activeCount === 0) {
      activeCount += 1;
    }

    beginVisual();
    NProgress.set(clamped / 100);
  },

  /** Mark one tracked unit of work as complete. */
  finish() {
    activeCount = Math.max(0, activeCount - 1);

    if (activeCount === 0) {
      clearTimeout(startTimer);
      startTimer = null;
      NProgress.done();
    }
  },

  /** Force-remove the bar immediately (e.g. route change aborts). */
  remove() {
    activeCount = 0;
    clearTimeout(startTimer);
    startTimer = null;
    NProgress.remove();
  },
};
