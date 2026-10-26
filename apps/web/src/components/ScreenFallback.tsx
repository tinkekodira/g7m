import { LoadingRegion } from './LoadingRegion.js';

/** Secondary screens retain their text fallback and the same anti-flash delay. */
export function ScreenFallback() {
  return (
    <LoadingRegion label="Loading…">
      <p className="flex min-h-[50vh] items-center justify-center text-sm text-muted">Loading…</p>
    </LoadingRegion>
  );
}
