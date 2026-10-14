import { useEffect } from "react";

import { topProgress } from "../../utils/topProgress";

const TopProgressBar = ({ active = false, value, label = "Loading" }) => {
  useEffect(() => {
    if (typeof value === "number") {
      if (value >= 100) {
        topProgress.finish();
        return undefined;
      }

      topProgress.set(value);
      return undefined;
    }

    if (!active) return undefined;

    return topProgress.start();
  }, [active, value]);

  return (
    <span role="progressbar" aria-label={label} style={{ display: "none" }} />
  );
};

export default TopProgressBar;
