import { useEffect, useState } from 'react';

/**
 * What fills the gap while a screen's own file is being loaded.
 *
 * Which is, for a quarter of a second, nothing at all.
 *
 * The chunk is almost always in the service worker's cache and the gap is a
 * frame or two, so a spinner would be a flash — and a flash between tapping a
 * tab and arriving at it reads as the app stumbling, which is worse than the
 * wait it was trying to explain. Waiting to say anything means the fast case,
 * which is nearly every case, looks like a plain instant navigation.
 *
 * It still says something eventually, because the slow case is real: the very
 * first visit on gym wifi, before the worker has installed.
 */
const QUIET_MS = 250;

export function ScreenFallback() {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaiting(true);
    }, QUIET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!waiting) return null;

  return (
    <p role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
      Loading…
    </p>
  );
}
