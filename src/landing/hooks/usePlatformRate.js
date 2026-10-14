import { useEffect, useState } from "react";

import { fetchPlatform } from "../api/publicApi";

// The platform has no subscription: it keeps a % of each customer order. The rate comes from the admin settings.
export default function usePlatformRate() {
  const [rate, setRate] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchPlatform()
      .then((p) => alive && setRate(Number(p.commission_rate)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return rate;
}