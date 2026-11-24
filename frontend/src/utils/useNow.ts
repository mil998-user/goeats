import { useEffect, useState } from "react";

// Current time, refreshed every minute: for screens left open whose state depends on the clock
export function useNow(everyMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs]);
  return now;
}
