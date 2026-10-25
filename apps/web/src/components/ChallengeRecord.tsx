import { useEffect, useId } from 'react';
import { fetchChallengeRecord } from '../lib/friends/api.js';
import { useRemote } from '../lib/friends/use-friends-data.js';
import { useOnline } from '../lib/use-online.js';

/** A quiet lifetime record. No drill-down, trophy or interaction affordance. */
export function ChallengeRecord() {
  const heading = useId();
  const online = useOnline();
  const { data, error, loading, reload } = useRemote(
    'challenge-record',
    online,
    fetchChallengeRecord,
  );

  useEffect(() => {
    if (!online) return;
    const refresh = () => {
      if (document.visibilityState !== 'hidden') reload();
    };
    globalThis.addEventListener('focus', refresh);
    globalThis.addEventListener('challenge-results-changed', refresh);
    document.addEventListener('visibilitychange', refresh);
    const retry = error === null ? null : globalThis.setInterval(refresh, 30_000);
    return () => {
      globalThis.removeEventListener('focus', refresh);
      globalThis.removeEventListener('challenge-results-changed', refresh);
      document.removeEventListener('visibilitychange', refresh);
      if (retry !== null) clearInterval(retry);
    };
  }, [online, error, reload]);

  return (
    <section
      aria-labelledby={heading}
      className="rounded-card border border-subtle bg-surface px-4 py-3"
    >
      <h2 id={heading} className="text-sm font-medium text-secondary">
        Challenge record
      </h2>
      <div
        role="status"
        aria-busy={online && loading}
        className="numeric mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-base font-semibold"
      >
        <p className="text-success">{data?.wins.toLocaleString() ?? '—'} Wins</p>
        <p className="text-destructive">{data?.losses.toLocaleString() ?? '—'} Loses</p>
        <p className="text-muted">{data?.draws.toLocaleString() ?? '—'} Draws</p>
        {data === null && (
          <span className="sr-only">
            {!online
              ? 'Connect to load your challenge record.'
              : error !== null
                ? 'Challenge record unavailable. Retrying automatically.'
                : 'Loading challenge record…'}
          </span>
        )}
      </div>
    </section>
  );
}
