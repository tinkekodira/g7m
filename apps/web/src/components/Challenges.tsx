import { useId, useState, type ReactNode } from 'react';
import type { LeaderboardRanking, LeaderboardStat } from '@g7m/core';
import { Button, SegmentedControl, cx } from '@g7m/ui';
import { Avatar } from './Avatar.js';
import {
  answerChallenge,
  sendChallenge,
  withdrawChallenge,
  FriendsError,
} from '../lib/friends/api.js';
import { describeChallengeProblem, type ChallengeCardView } from '../screens/challenges-view.js';
import { RANKING_OPTIONS, STAT_OPTIONS } from '../screens/leaderboard-view.js';

/**
 * One-to-one challenges (ADR-0110): the cards, and the form that sends one.
 *
 * Your side of every challenge is counted from this phone, as your row on the
 * leaderboard is, so a workout you have just finished counts before it has
 * uploaded.
 */

/**
 * A challenge. Waiting for you: accept or decline. Waiting for them: take it
 * back. Running or over: both sides, and who is ahead or who won.
 */
export function ChallengeCard({
  card,
  onChanged,
}: {
  readonly card: ChallengeCardView;
  readonly onChanged: () => void;
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
    <article aria-labelledby={titleId} className="rounded-card border border-subtle bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={card.avatarName} tint />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-base font-semibold text-primary">
            {card.title}
          </h3>
          <p className="truncate text-sm text-secondary">
            Against {card.name} · <span className="numeric">{card.when}</span>
          </p>
        </div>
      </div>

      {card.sides !== null && (
        <dl className="mt-3 flex flex-col gap-1 border-t border-subtle pt-3">
          {card.sides.map((side) => (
            <div key={side.name} className="flex items-baseline justify-between gap-3">
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
                  'numeric text-base font-semibold',
                  side.leading ? 'text-accent' : 'text-primary',
                )}
              >
                {side.score}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-3 text-base font-medium text-primary">{card.verdict}</p>

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
 * Challenge a friend: a stat, most or most improved, and send. It starts when
 * they accept, so nothing is lost to a challenge they do not see until
 * Thursday.
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
  const headingId = useId();
  const [ranking, setRanking] = useState<LeaderboardRanking>('most');
  const [stat, setStat] = useState<LeaderboardStat>('workouts');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

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

  // Lighter than the friend's card above it: this is something you might do,
  // not who they are. The send button wears the same tint as the choices above
  // it, so the card reads as one form rather than a form and a slab.
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-6 rounded-card border border-subtle/60 bg-surface/50 p-5"
    >
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-primary">
          Challenge {name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {ranking === 'improved'
            ? 'Seven days, each of you against your own last four weeks, so it’s fair whoever trains more.'
            : 'Seven days. Whoever does the most wins.'}
        </p>
      </div>
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
            options={STAT_OPTIONS}
            value={stat}
            onChange={setStat}
          />
        </ChallengeChoice>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="quiet" fullWidth disabled={busy} onClick={send}>
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
