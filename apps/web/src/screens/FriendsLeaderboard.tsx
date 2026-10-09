import { useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  boardSince,
  isLeaderboardPeriod,
  isLeaderboardRanking,
  isLeaderboardStat,
  type LeaderboardPeriod,
  type LeaderboardRanking,
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
  RANKING_OPTIONS,
  STAT_OPTIONS,
  boardSummary,
  leaderboard,
  type BoardRowView,
} from './leaderboard-view.js';

/**
 * Friends' leaderboard: you and every friend who shares, ranked on one stat
 * over this week or this month (ADR-0106) — by the most done, or by the most
 * improved on their own last four weeks (ADR-0109).
 *
 * One request fetches everything either toggle can show — every friend's
 * workouts since the start of last month — so switching stat or period is
 * instant once loaded. Your own row comes from this phone, so a workout you
 * just finished is on the board before it has uploaded.
 *
 * The ranking, stat and period live in the address, like the sub-tab, so going into a
 * friend's page and back lands on the same board.
 */
export function FriendsLeaderboard({
  mine,
  code,
  children,
}: {
  readonly mine: MySide;
  readonly code: string | null;
  /** Said under the board, above the room left for the pinned summary. */
  readonly children?: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const askedRanking = params.get('rank');
  const askedStat = params.get('stat');
  const askedPeriod = params.get('period');
  const ranking: LeaderboardRanking = isLeaderboardRanking(askedRanking) ? askedRanking : 'most';
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
      ranking,
      stat,
      period,
      now: new Date(),
      weekStartsOn: mine.weekStartsOn,
      unitSystem: mine.unitSystem,
      myName: mine.displayName,
    });
  }, [friends.data, myBoard.data, ranking, stat, period, mine]);

  const choose = (key: 'rank' | 'stat' | 'period', value: string) => {
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
    <section aria-label="Leaderboard" className="flex flex-col gap-4">
      <BoardFilters
        summary={boardSummary(ranking, stat, period)}
        left={view !== null && !view.alone ? view.left : null}
      >
        <SegmentedControl
          label="Rank by"
          options={RANKING_OPTIONS}
          value={ranking}
          onChange={(value) => {
            choose('rank', value);
          }}
        />
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
      </BoardFilters>

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
          <ol className="flex flex-col">
            {view.rows.map((row) => (
              <BoardRow key={row.key} row={row} />
            ))}
          </ol>
          {view.footnote !== null && <p className="text-xs text-muted">{view.footnote}</p>}
          {view.notSharing !== null && <p className="text-xs text-muted">{view.notSharing}</p>}
          {children}
          <Standing place={view.standing.place} gap={view.standing.gap} />
        </>
      )}
    </section>
  );
}

/**
 * The three choices behind one bar, shut to begin with: the board is what
 * this tab is for, and three stacked controls pushed it below the fold. Shut,
 * the bar says what the board is showing and how long it has left.
 */
function BoardFilters({
  summary,
  left,
  children,
}: {
  readonly summary: string;
  readonly left: string | null;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panel = useId();

  return (
    <div className="rounded-card bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => {
          setOpen((was) => !was);
        }}
        className="flex min-h-tap w-full items-center gap-3 rounded-card p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium text-primary">{summary}</span>
          {left !== null && <span className="mt-0.5 block text-sm text-muted">{left}</span>}
        </span>
        <span className="shrink-0 text-sm font-medium text-accent">{open ? 'Done' : 'Change'}</span>
      </button>
      {open && (
        <div id={panel} className="flex flex-col gap-2 px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

/** The edge round first, second and third, and the colour of their numbers. */
const PLACES: Readonly<Record<number, { readonly metal: string; readonly text: string }>> = {
  1: { metal: 'var(--medal-gold)', text: 'text-medal-gold' },
  2: { metal: 'var(--medal-silver)', text: 'text-medal-silver' },
  3: { metal: 'var(--medal-bronze)', text: 'text-medal-bronze' },
};

/**
 * One place on the board. A friend's row opens their page — the name is the
 * link, stretched over the row — and yours is marked rather than linked.
 *
 * First, second and third stand apart with a metal edge, first a touch
 * larger; everybody after is a plain line. The score is the loudest thing in
 * a row, with a bar under it measured against the leader's.
 */
function BoardRow({ row }: { readonly row: BoardRowView }) {
  const place = row.rank === null ? undefined : PLACES[row.rank];
  // "12,450 kg": the unit is set smaller, so the number carries the row.
  const unit = / (kg|lb)$/.exec(row.scoreText);
  const number = unit === null ? row.scoreText : row.scoreText.slice(0, unit.index);

  return (
    <li
      className={cx(
        'relative flex items-center gap-3 px-4',
        place !== undefined
          ? 'place-edge mb-2 rounded-card py-3'
          : 'border-b border-subtle/70 py-4 last:border-b-0',
        place === undefined && row.isYou && 'rounded-control bg-accent-subtle',
      )}
      style={
        place === undefined
          ? undefined
          : ({
              '--place-metal': place.metal,
              '--place-fill': row.isYou ? 'var(--accent-subtle)' : 'var(--bg-surface)',
            } as CSSProperties)
      }
    >
      <span aria-hidden className="flex w-5 shrink-0 flex-col items-center leading-none">
        <span className={cx('numeric text-sm font-semibold', place?.text ?? 'text-muted')}>
          {row.rankText}
        </span>
        {row.moveText !== null && (
          <span
            className={cx(
              'numeric mt-1 text-[11px] font-semibold',
              row.move > 0 ? 'text-success' : 'text-danger/80',
            )}
          >
            {row.moveText}
          </span>
        )}
      </span>
      <Avatar name={row.avatarName} size={row.rank === 1 ? 'lead' : 'md'} tint={!row.isYou} />
      <span className="min-w-0 flex-1">
        {row.userId === null ? (
          <>
            <span className="sr-only">{row.description}</span>
            <span
              aria-hidden
              className="line-clamp-2 text-base font-semibold break-words text-primary"
            >
              {row.name}
              {row.champion && <Crown />}
            </span>
          </>
        ) : (
          <Link
            to={`/friends/${row.userId}`}
            state={{ name: row.name }}
            aria-label={row.description}
            className="line-clamp-2 text-base font-semibold break-words text-primary after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
          >
            {row.name}
            {row.champion && <Crown />}
          </Link>
        )}
      </span>
      <span aria-hidden className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={cx(
            'numeric text-xl leading-none font-bold',
            row.rank === null ? 'text-muted' : 'text-primary',
          )}
        >
          {number}
          {unit !== null && (
            <span className="ml-1 text-sm font-medium text-secondary">{unit[1]}</span>
          )}
        </span>
        {row.share !== null && (
          <span className="block h-[3px] w-14 overflow-hidden rounded-full bg-subtle">
            <span
              className={cx('block h-full rounded-full', row.isYou ? 'bg-accent' : 'bg-muted')}
              style={{ width: `${String(Math.round(row.share * 100))}%` }}
            />
          </span>
        )}
      </span>
    </li>
  );
}

/**
 * Your place, pinned above the tab bar so it is in sight however far down the
 * board you are. Your row already says the same to a screen reader, so this
 * is hidden from one rather than read twice.
 */
function Standing({ place, gap }: { readonly place: string; readonly gap: string | null }) {
  return (
    <>
      {/* Room under the board, so the last row scrolls clear of the summary. */}
      <div aria-hidden className="h-14" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-(--tab-bar-offset) z-20"
      >
        <div className="mx-auto max-w-2xl px-4 pb-2">
          <p className="flex flex-wrap items-baseline gap-x-2 rounded-card border border-accent/30 bg-elevated px-4 py-3 text-sm shadow-floating">
            <span className="font-semibold text-primary">{place}</span>
            {gap !== null && <span className="text-secondary">{gap}</span>}
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * Last period's winner. Decorative: the row's description already says
 * "Won last week", and the crown is not the only sign of it.
 */
function Crown() {
  return <CrownIcon className="ml-1.5 inline size-4 align-[-2px] text-warning" />;
}
