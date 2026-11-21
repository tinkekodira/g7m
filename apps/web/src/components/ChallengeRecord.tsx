import { formatNumber, t } from '@g7m/i18n';
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
        {t().profile.challengeRecord.title}
      </h2>
      <div
        role="status"
        aria-busy={online && loading}
        className="numeric mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-base font-semibold"
      >
        <p className="text-success">
          {t().profile.challengeRecord.wins(data === null ? '—' : formatNumber(data.wins))}
        </p>
        <p className="text-destructive">
          {t().profile.challengeRecord.losses(data === null ? '—' : formatNumber(data.losses))}
        </p>
        <p className="text-muted">
          {t().profile.challengeRecord.draws(data === null ? '—' : formatNumber(data.draws))}
        </p>
        {data === null && (
          <span className="sr-only">
            {!online
              ? t().profile.challengeRecord.offline
              : error !== null
                ? t().profile.challengeRecord.unavailable
                : t().profile.challengeRecord.loading}
          </span>
        )}
      </div>
    </section>
  );
}
