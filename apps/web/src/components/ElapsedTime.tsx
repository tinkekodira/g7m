import { formatElapsed } from '../screens/workout-timer.js';

/** One timestamp-based readout on both workout surfaces. No ticking live region. */
export function ElapsedTime({ startedAt, now }: { readonly startedAt: Date; readonly now: Date }) {
  const value = formatElapsed(startedAt, now);
  const hours = value.split(':').length === 3;
  return (
    <span className="numeric whitespace-nowrap">
      {hours ? value.slice(0, -3) : value}
      {hours && <span className="text-[0.8em] font-normal text-muted">{value.slice(-3)}</span>}
    </span>
  );
}
