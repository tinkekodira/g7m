import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@g7m/ui';
import { useAuthStore } from '../auth/auth-store.js';
import { claimChallengeResults, type Challenge } from '../lib/friends/api.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { useOnline } from '../lib/use-online.js';
import { challengeCard } from '../screens/challenges-view.js';
import { TrophyIcon } from './icons.js';

/** The claim is persisted separately from acknowledgment. A popup lost to an
 * app closing never repeats on a second device; its result card still waits. */
export function ChallengeResults() {
  const user = useAuthStore((s) => s.session?.user.id);
  return <ResultWatcher key={user} />;
}

function ResultWatcher() {
  const online = useOnline();
  const { pathname } = useLocation();
  const profile = useCatalogue('challenge-result-units', (r) => r.profile.current());
  const [queue, setQueue] = useState<readonly Challenge[]>([]);
  const [index, setIndex] = useState(0);
  const [overlaysClear, setOverlaysClear] = useState(true);
  const checking = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = queue[index];
  const eligible =
    online &&
    overlaysClear &&
    pathname !== '/workout' &&
    !pathname.startsWith('/progress/session/') &&
    profile.data?.onboardedAt != null;

  useEffect(() => {
    const inspect = () =>
      setOverlaysClear(
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [data-achievement-banner], dialog[open]:not(.challenge-result-dialog)',
        ) === null,
      );
    inspect();
    const observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'role'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!eligible || queue.length > 0) return;
    let cancelled = false;
    const check = () => {
      if (
        cancelled ||
        checking.current ||
        document.visibilityState === 'hidden' ||
        document.querySelector('[role="dialog"], [role="alertdialog"], dialog[open]')
      )
        return;
      checking.current = true;
      void claimChallengeResults()
        .then((results) => {
          if (results.length > 0) {
            setIndex(0);
            setQueue(results);
          }
        })
        .catch(() => {
          /* Friends still offers retry; a popup never blocks training. */
        })
        .finally(() => {
          checking.current = false;
        });
    };
    check();
    const timer = globalThis.setInterval(check, 60_000);
    globalThis.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      globalThis.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [eligible, queue.length]);

  useEffect(() => {
    const node = dialog.current;
    if (!current || !node || !eligible) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [current, eligible]);

  if (!current || !eligible) return null;
  const card = challengeCard(current, [], {
    now: new Date(),
    unitSystem: profile.data?.unitSystem ?? 'metric',
  });
  const close = () => {
    setQueue([]);
    setIndex(0);
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="challenge-result-heading"
      aria-describedby="challenge-result-description"
      className="challenge-result-dialog m-auto w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain rounded-sheet border border-subtle bg-surface p-6 text-primary shadow-floating"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div key={current.id} className="challenge-result-reveal" data-outcome={card.outcome}>
        <TrophyIcon
          aria-hidden
          className={`mx-auto size-16 ${card.outcome === 'win' ? 'challenge-gold challenge-trophy-reveal' : 'text-muted'}`}
        />
        <h2
          id="challenge-result-heading"
          className={`mt-4 text-center text-3xl font-bold break-words text-balance ${card.outcome === 'win' ? 'challenge-gold' : 'text-primary'}`}
        >
          {card.verdict}
        </h2>
        <p
          id="challenge-result-description"
          className="mt-2 text-center text-secondary break-words"
        >
          {card.title} against {card.name}
        </p>
        {card.sides && (
          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-subtle py-5">
            {card.sides.map((side, i) => (
              <div key={i} className="min-w-0 text-center">
                <dt className="break-words text-sm text-secondary">{side.name}</dt>
                <dd
                  className={`numeric mt-1 break-words text-3xl font-bold ${side.leading && card.outcome === 'win' ? 'challenge-gold' : 'text-primary'}`}
                >
                  {side.score}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {card.outcome === 'unavailable' && (
          <p className="mt-4 text-center text-sm text-secondary">
            Training was unavailable when the scores locked. Your record is unchanged.
          </p>
        )}
        {card.recovered && (
          <p className="mt-3 text-center text-xs text-muted">
            Recovered result · based on available training
          </p>
        )}
        {queue.length > 1 && (
          <p aria-live="polite" className="mt-4 text-center text-sm text-muted">
            Result {index + 1} of {queue.length}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to={`/friends?tab=leaderboard&challenge=${encodeURIComponent(current.id)}`}
            onClick={close}
            className="inline-flex min-h-tap items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View challenge
          </Link>
          {index + 1 < queue.length && (
            <Button variant="secondary" fullWidth onClick={() => setIndex((n) => n + 1)}>
              Next result
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={close}>
            Later
          </Button>
        </div>
      </div>
    </dialog>
  );
}
