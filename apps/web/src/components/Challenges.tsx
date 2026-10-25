import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { LeaderboardRanking, LeaderboardStat } from '@g7m/core';
import { Link } from 'react-router';
import { Button, SegmentedControl, cx } from '@g7m/ui';
import { Avatar } from './Avatar.js';
import { ChevronRightIcon, DuelIcon, TrophyIcon } from './icons.js';
import {
  answerChallenge,
  sendChallenge,
  withdrawChallenge,
  FriendsError,
  acknowledgeChallenge,
} from '../lib/friends/api.js';
import {
  CHALLENGE_STAT_OPTIONS,
  describeChallengeProblem,
  type ChallengeCardView,
} from '../screens/challenges-view.js';
import { RANKING_OPTIONS } from '../screens/leaderboard-view.js';

/**
 * One-to-one challenges (ADR-0110): the cards, and the form that sends one.
 *
 * Your running score is counted on this phone, before uploads finish.
 * Final results use the shared server snapshot (ADR-0156).
 */

/**
 * A challenge. Waiting for you: accept or decline. Waiting for them: take it
 * back. Running or over: both sides, and who is ahead or who won.
 */
export function ChallengeCard({
  card,
  onChanged,
  history = false,
}: {
  readonly card: ChallengeCardView;
  readonly onChanged: () => void;
  readonly history?: boolean;
}) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const act = (work: () => Promise<string | null>) => {
    setBusy(true);
    setProblem(null);
    work().then(
      (failed) => {
        if (failed === null) {
          onChanged();
        } else {
          setBusy(false);
          setProblem(failed);
        }
      },
      (cause: unknown) => {
        setBusy(false);
        setProblem(cause instanceof FriendsError ? cause.message : 'That did not go through.');
      },
    );
  };
  const answer = (accept: boolean) => {
    act(async () => describeChallengeProblem(await answerChallenge(card.id, accept), card.name));
  };

  return (
    <article
      id={`challenge-${card.id}`}
      tabIndex={-1}
      aria-labelledby={titleId}
      data-outcome={card.outcome ?? undefined}
      className="challenge-card scroll-mt-6 rounded-sheet border border-subtle bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {card.phase === 'finished' && (
        <div className="mb-4 flex items-center gap-3">
          <TrophyIcon
            aria-hidden
            className={cx(
              'size-9 shrink-0',
              card.outcome === 'win' ? 'challenge-gold' : 'text-muted',
            )}
          />
          <p
            className={cx(
              'min-w-0 text-2xl leading-tight font-bold break-words text-balance',
              card.outcome === 'win' ? 'challenge-gold' : 'text-primary',
            )}
          >
            {card.verdict}
          </p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Avatar name={card.avatarName} tint />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-base font-semibold text-primary">
            {card.title}
          </h3>
          <p className="text-sm text-secondary break-words">
            Against {card.name} · <span className="numeric">{card.when}</span>
          </p>
        </div>
      </div>

      {card.sides !== null && (
        <dl
          className={cx(
            'mt-4 border-t border-subtle/70 pt-4',
            card.phase === 'finished' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-1',
          )}
        >
          {card.sides.map((side, index) => (
            <div
              key={index}
              className={
                card.phase === 'finished' ? 'min-w-0' : 'flex items-baseline justify-between gap-3'
              }
            >
              <dt
                className={cx(
                  'truncate text-sm',
                  side.leading ? 'font-semibold text-primary' : 'text-secondary',
                )}
              >
                {side.name}
              </dt>
              <dd
                className={cx(
                  'numeric break-words font-bold',
                  card.phase === 'finished' ? 'mt-1 text-3xl leading-tight' : 'text-base',
                  side.leading
                    ? card.outcome === 'win'
                      ? 'challenge-gold'
                      : 'challenge-leading'
                    : 'text-primary',
                )}
              >
                {side.score}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {card.phase !== 'finished' && (
        <p className="mt-3 text-base font-medium text-primary">{card.verdict}</p>
      )}
      {card.phase === 'finalizing' && (
        <p className="mt-1 text-sm text-secondary">
          Allowing 24 hours for offline workouts to sync. Then the scores are final.
        </p>
      )}
      {card.phase === 'finished' && (
        <>
          <p className="mt-3 text-sm text-muted">
            {card.metric} ·{' '}
            {card.endedAt?.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          {card.recovered && (
            <p className="mt-1 text-xs text-muted">
              Recovered result · based on available training
            </p>
          )}
          {card.outcome === 'unavailable' && (
            <p className="mt-1 text-sm text-secondary">
              Training was unavailable when the scores locked. This result is excluded from your
              record.
            </p>
          )}
          {!history && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-subtle/70 pt-3">
              <Link
                to="/profile/challenges"
                className="inline-flex min-h-tap items-center text-sm text-secondary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
              >
                Challenge history
              </Link>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  act(async () => {
                    await acknowledgeChallenge(card.id);
                    return null;
                  });
                }}
              >
                Got it
              </Button>
            </div>
          )}
        </>
      )}

      {card.phase === 'incoming' && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            disabled={busy}
            aria-label={`Accept ${card.name}’s challenge`}
            onClick={() => {
              answer(true);
            }}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            aria-label={`Decline ${card.name}’s challenge`}
            onClick={() => {
              answer(false);
            }}
          >
            Decline
          </Button>
        </div>
      )}

      {card.phase === 'outgoing' && (
        <div className="mt-3">
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            aria-label={`Take back your challenge to ${card.name}`}
            onClick={() => {
              act(async () => {
                await withdrawChallenge(card.id);
                return null;
              });
            }}
          >
            Take it back
          </Button>
        </div>
      )}

      {problem !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {problem}
        </p>
      )}
    </article>
  );
}

export function ChallengeList({
  cards,
  onChanged,
}: {
  readonly cards: readonly ChallengeCardView[];
  readonly onChanged: () => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <li key={card.id}>
          <ChallengeCard card={card} onChanged={onChanged} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Challenge a friend (ADR-0133): one button, with an ember running round its
 * edge, that opens the choices in a sheet. Most visits to a friend are not to
 * challenge them, so the form stays shut until asked for, and the button is
 * the one thing on the page that looks like it wants pressing.
 */
export function SendChallenge({
  friendId,
  name,
  onSent,
}: {
  readonly friendId: string;
  readonly name: string;
  readonly onSent: () => void;
}) {
  const titleId = useId();
  const detailId = useId();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  return (
    <>
      <div className="ember rounded-sheet">
        <button
          ref={opener}
          type="button"
          aria-haspopup="dialog"
          aria-labelledby={titleId}
          aria-describedby={detailId}
          onClick={() => {
            setOpen(true);
          }}
          className="flex w-full items-center gap-4 rounded-sheet bg-surface p-4 text-left active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <DuelBadge />
          <span className="min-w-0 flex-1">
            <span id={titleId} className="block truncate text-lg font-semibold text-primary">
              Challenge {name}
            </span>
            <span id={detailId} className="mt-0.5 block text-sm text-muted">
              Seven days, from when {name} accepts.
            </span>
          </span>
          <ChevronRightIcon className="size-5 shrink-0 text-muted" />
        </button>
      </div>
      {open && (
        <ChallengeSheet
          friendId={friendId}
          name={name}
          onClose={close}
          onSent={() => {
            setOpen(false);
            onSent();
          }}
        />
      )}
    </>
  );
}

function DuelBadge() {
  return <DuelIcon className="size-14 shrink-0" />;
}

/**
 * The choices: most or most improved, workouts or weight, and send. From the
 * bottom of the screen, where a thumb already is, as Add a friend is. It
 * starts when they accept, so nothing is lost to a challenge they do not see
 * until Thursday. What went wrong is said in place, under the button.
 */
function ChallengeSheet({
  friendId,
  name,
  onClose,
  onSent,
}: {
  readonly friendId: string;
  readonly name: string;
  readonly onClose: () => void;
  readonly onSent: () => void;
}) {
  const headingId = useId();
  const [ranking, setRanking] = useState<LeaderboardRanking>('most');
  const [stat, setStat] = useState<LeaderboardStat>('workouts');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    doneRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const send = () => {
    setBusy(true);
    setProblem(null);
    sendChallenge(friendId, stat, ranking).then(
      (result) => {
        const failed = describeChallengeProblem(result.outcome, name);
        setBusy(false);
        if (failed === null) onSent();
        else setProblem(failed);
      },
      (cause: unknown) => {
        setBusy(false);
        setProblem(cause instanceof FriendsError ? cause.message : 'That did not go through.');
      },
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="popup relative flex w-full max-w-2xl flex-col gap-6 rounded-t-sheet border-t border-subtle bg-surface px-5 pt-5 pb-safe-bottom shadow-floating"
      >
        <div className="flex items-center gap-3">
          <DuelBadge />
          <h2 id={headingId} className="min-w-0 flex-1 truncate text-xl font-semibold text-primary">
            Challenge {name}
          </h2>
          <button
            ref={doneRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap shrink-0 items-center rounded-control px-3 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            Done
          </button>
        </div>
        <p className="-mt-3 text-sm text-muted">
          {ranking === 'improved'
            ? 'Seven days, each of you against your own last four weeks, so it’s fair whoever trains more.'
            : 'Seven days. Whoever does the most wins.'}
        </p>
        <div className="flex flex-col gap-4">
          <ChallengeChoice label="Rank by">
            <SegmentedControl
              variant="quiet"
              label="Rank by"
              options={RANKING_OPTIONS}
              value={ranking}
              onChange={setRanking}
            />
          </ChallengeChoice>
          <ChallengeChoice label="Stat">
            <SegmentedControl
              variant="quiet"
              label="Stat"
              options={CHALLENGE_STAT_OPTIONS}
              value={stat}
              onChange={setStat}
            />
          </ChallengeChoice>
        </div>
        <div className="flex flex-col gap-2 pb-5">
          <Button fullWidth disabled={busy} onClick={send}>
            Send challenge
          </Button>
          <p className="text-center text-xs text-muted">Starts when {name} accepts.</p>
          {problem !== null && (
            <p role="alert" className="text-sm text-danger">
              {problem}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * A choice with its name above it. The name is for the eye: the group already
 * carries the same words as its accessible name, so a screen reader skips this.
 */
function ChallengeChoice({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p aria-hidden className="text-xs font-medium text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}
