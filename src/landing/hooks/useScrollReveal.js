import { useLayoutEffect } from "react";

/*
 * Scroll-reveal: every element marked with `data-reveal` starts slightly lower and transparent,
 * and slides up into place the first time it scrolls into view. Children of an element marked
 * `data-reveal-stagger` follow one after another. Does nothing for visitors who prefer reduced motion.
 */
export default function useScrollReveal() {
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const els = [...document.querySelectorAll("[data-reveal]")];
    const hide = (el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(36px)";
      el.style.transition = `opacity 700ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)`;
      el.style.willChange = "opacity, transform";
    };
    const show = (el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      // release the compositing hint once the animation is over
      setTimeout(() => (el.style.willChange = "auto"), 1000);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    els.forEach((el) => {
      hide(el);
      io.observe(el);
    });

    return () => {
      io.disconnect();
      els.forEach((el) => {
        el.style.opacity = el.style.transform = el.style.transition = el.style.willChange = "";
      });
    };
  }, []);
}