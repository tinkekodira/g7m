import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  boardSince,
  isLeaderboardPeriod,
  isLeaderboardStat,
  type LeaderboardPeriod,
  type LeaderboardStat,
} from '@g7m/core';
import { SegmentedControl, cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import { CrownIcon } from '../components/icons.js';
import { YourCode } from '../components/FriendParts.js';
import { fetchLeaderboard } from '../lib/friends/api.js';
import { useMyBoard, useRemote, type MySide } from '../lib/friends/use-friends-data.js';
import {
  PERIOD_OPTIONS,
  STAT_OPTIONS,
  leaderboard,
  type BoardRowView,
} from './leaderboard-view.js';

/**
 * Friends' leaderboard: you and every friend who shares, ranked on one stat
 * over this week or this month (ADR-0106).
 *
 * One request fetches everything either toggle can show — every friend's
 * workouts since the start of last month — so switching stat or period is
 * instant once loaded. Your own row comes from this phone, so a workout you
 * just finished is on the board before it has uploaded.
 *
 * The stat and period live in the address, like the sub-tab, so going into a
 * friend's page and back lands on the same board.
 */
export function FriendsLeaderboard({
  mine,
  code,
}: {
  readonly mine: MySide;
  readonly code: string | null;
}) {
  const [params, setParams] = useSearchParams();
  const askedStat = params.get('stat');
  const askedPeriod = params.get('period');
  const stat: LeaderboardStat = isLeaderboardStat(askedStat) ? askedStat : 'workouts';
  const period: LeaderboardPeriod = isLeaderboardPeriod(askedPeriod) ? askedPeriod : 'week';

  // Fixed for as long as the board is open: a board left open past midnight
  // on the 1st keeps the history it asked for rather than asking again.
  const since = useMemo(() => boardSince(new Date()), []);
  const friends = useRemote(`friends-leaderboard-${since.toISOString()}`, true, () =>
    fetchLeaderboard(since),
  );
  const myBoard = useMyBoard(since);

  const view = useMemo(() => {
    if (friends.data === null || myBoard.data === null) return null;
    return leaderboard(friends.data, myBoard.data, {
      stat,
      period,
      now: new Date(),
      weekStartsOn: mine.weekStartsOn,
      unitSystem: mine.unitSystem,
      myName: mine.displayName,
    });
  }, [friends.data, myBoard.data, stat, period, mine]);

  const choose = (key: 'stat' | 'period', value: string) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const error = friends.error ?? myBoard.error;

  return (
    <section aria-label="Leaderboard" className="flex flex-col gap-3">
      <SegmentedControl
        label="Stat"
        options={STAT_OPTIONS}
        value={stat}
        onChange={(value) => {
          choose('stat', value);
        }}
      />
      <SegmentedControl
        label="Period"
        options={PERIOD_OPTIONS}
        value={period}
        onChange={(value) => {
          choose('period', value);
        }}
      />

      {error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {error}
        </p>
      )}

      {view === null ? (
        error === null && <p className="text-sm text-muted">Loading…</p>
      ) : view.alone ? (
        <div className="rounded-card border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-primary">Nobody to race yet</h2>
          <p className="mt-1 text-sm text-secondary">
            Once a friend adds you, you’ll see who trained most this week and this month.
          </p>
          {code !== null && (
            <div className="mt-4">
              <YourCode code={code} />
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">{view.heading}</p>
          <ol className="overflow-hidden rounded-card border border-subtle bg-surface">
            {view.rows.map((row) => (
              <BoardRow key={row.key} row={row} />
            ))}
          </ol>
          {view.footnote !== null && <p className="text-xs text-muted">{view.footnote}</p>}
          {view.notSharing !== null && <p className="text-xs text-muted">{view.notSharing}</p>}
        </>
      )}
    </section>
  );
}

/**
 * One place on the board. A friend's row opens their page — the name is the
 * link, stretched over the row — and yours is marked rather than linked, with
 * the gap to the next place under your name.
 */
function BoardRow({ row }: { readonly row: BoardRowView }) {
  return (
    <li
      className={cx(
        'relative flex min-h-tap items-center gap-3 border-b border-subtle px-4 py-3 last:border-b-0',
        row.isYou && 'bg-accent-subtle',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'numeric w-6 shrink-0 text-center text-lg font-bold',
          row.rank === 1 ? 'text-accent' : row.rank === null ? 'text-muted' : 'text-primary',
        )}
      >
        {row.rankText}
      </span>
      <Avatar name={row.avatarName} />
      <span className="min-w-0 flex-1">
        {row.userId === null ? (
          <>
            <span className="sr-only">{row.description}</span>
            <span aria-hidden className="block truncate text-base font-semibold text-primary">
              {row.name}
              {row.champion && <Crown />}
            </span>
            {row.note !== null && (
              <span aria-hidden className="block truncate text-xs text-secondary">
                {row.note}
              </span>
            )}
          </>
        ) : (
          <Link
            to={`/friends/${row.userId}`}
            state={{ name: row.name }}
            aria-label={row.description}
            className="block truncate text-base font-semibold text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
          >
            {row.name}
            {row.champion && <Crown />}
          </Link>
        )}
      </span>
      <span
        aria-hidden
        className={cx(
          'numeric shrink-0 text-base font-semibold',
          row.rank === null ? 'text-muted' : 'text-primary',
        )}
      >
        {row.scoreText}
      </span>
    </li>
  );
}

/**
 * Last period's winner. Decorative: the row's description already says
 * "Won last week", and the crown is not the only sign of it.
 */
function Crown() {
  return <CrownIcon className="ml-1.5 inline size-4 align-[-2px] text-warning" />;
}
