import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs`. Polling doesn't re-render when the data
 * comes back unchanged, so anything that depends on elapsed time needs its own clock.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
