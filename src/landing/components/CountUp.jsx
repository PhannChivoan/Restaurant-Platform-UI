import { useEffect, useRef, useState } from "react";

/** Animated counter: counts up to `target` the first time it scrolls into view. */
export default function CountUp({
  target,
  as: Tag = "span",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [text, setText] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || Number.isNaN(target))
      return;

    let timer;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          let start = 0;
          const duration = 1200;
          const stepTime = 20;
          const increment = target / (duration / stepTime);
          timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setText(target.toLocaleString());
              clearInterval(timer);
            } else {
              setText(Math.floor(start).toLocaleString());
            }
          }, stepTime);
          obs.unobserve(el);
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [target]);

  return (
    <Tag ref={ref} {...rest}>
      {text ?? children}
    </Tag>
  );
}
