/**
 * The friends leaderboard: who did the most this week, or this month.
 *
 * The server sends each friend's finished workouts since the start of last
 * month, one small tally per workout, and the phone tallies your own from its
 * own database. Everything after that happens here, on the viewer's phone, for
 * the reason the week's dots do (ADR-0105): "this week" begins on the viewer's
 * week start, in the viewer's timezone, and the server knows neither.
 *
 * Four things are counted, each by a rule the rest of the app already uses:
 *
 * - **Workouts**: finished, with at least one ticked working set — the ones the
 *   history list and the progress totals count.
 * - **Weight lifted**: load × reps on ticked working sets, **external load
 *   only**. A pull-up's added plate counts; the lifter's own bodyweight does
 *   not. Counting it would make a total from which anybody could work out what
 *   a friend weighs (ten pull-ups is ten bodyweights), and the friend screens
 *   never show a body metric. ADR-0106.
 * - **Sets**: ticked working sets of lifting. A treadmill bout is not a set, as
 *   on the progress screen's Sets chart.
 * - **Time training**: first ticked set to last, the clock the history list
 *   reads — never how long a workout was left open. A workout logged afterwards
 *   from the calendar has no clock, so it adds nothing here, and counts for
 *   everything else.
 *
 * A workout belongs to the period it *started* in, as everywhere else.
 */
import { kgToLb, type UnitSystem } from './units.js';
import { countsTowardVolume, type LoggedSet } from './load.js';
import { periodWindow, startOfMonth, type Span } from './periods.js';
import { trainingMinutes } from './progress.js';
import type { WeekStart } from './week.js';

export const LEADERBOARD_STATS = ['workouts', 'lifted', 'sets', 'minutes'] as const;
export type LeaderboardStat = (typeof LEADERBOARD_STATS)[number];

export const LEADERBOARD_PERIODS = ['week', 'month'] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export function isLeaderboardStat(value: unknown): value is LeaderboardStat {
  return (LEADERBOARD_STATS as readonly unknown[]).includes(value);
}

export function isLeaderboardPeriod(value: unknown): value is LeaderboardPeriod {
  return (LEADERBOARD_PERIODS as readonly unknown[]).includes(value);
}

/** One finished workout, as the board counts it. */
export interface BoardWorkout {
  readonly startedAt: Date;
  /**
   * False for a workout logged afterwards, whose ticks are the time of typing.
   * It counts as a workout, its sets and its weight; it adds no time.
   */
  readonly clockKnown: boolean;
  readonly firstSetAt: Date | null;
  readonly lastSetAt: Date | null;
  /** Ticked working sets of lifting. */
  readonly sets: number;
  /** See `liftedKg`. */
  readonly liftedKg: number;
}

/**
 * What one set adds to "weight lifted": load × reps, on external load only.
 *
 * `bodyweight_plus` stores the added plate in `weight_kg`, so a weighted
 * pull-up adds its plate and nothing for the body hanging under it. Plain
 * bodyweight and assisted sets add nothing. The server's `board_workouts`
 * is the same rule in SQL, and a schema test holds the two together.
 */
export function liftedKg(
  set: Pick<LoggedSet, 'setType' | 'isCompleted' | 'loadType' | 'weightKg' | 'reps'>,
): number {
  if (!countsTowardVolume(set)) return 0;
  if (set.loadType !== 'external' && set.loadType !== 'bodyweight_plus') return 0;
  if (!Number.isFinite(set.weightKg) || set.weightKg <= 0) return 0;
  if (!Number.isFinite(set.reps) || set.reps <= 0) return 0;
  return set.weightKg * set.reps;
}

/** One ticked set from a finished workout, with what the board needs to know of it. */
export interface BoardSet extends Pick<
  LoggedSet,
  'setType' | 'isCompleted' | 'loadType' | 'weightKg' | 'reps'
> {
  readonly sessionId: string;
  readonly startedAt: Date;
  /** False for a workout logged afterwards. */
  readonly clockKnown: boolean;
  readonly completedAt: Date | null;
  /** A bout's or a timed hold's length, which started before it was ticked. */
  readonly durationSeconds: number | null;
  /** A treadmill bout, a row: a workout's training, but not a set. */
  readonly cardio: boolean;
}

/**
 * Your own workouts as the server tallies a friend's (`board_workouts`): one
 * tally per workout with at least one ticked working set, bouts included.
 *
 * The clock starts a set's duration before its first tick, so a workout that
 * is one 30-minute bout is thirty minutes of training, as `sessionSummaries`
 * reads it.
 */
export function tallyWorkouts(sets: readonly BoardSet[]): BoardWorkout[] {
  const bySession = new Map<
    string,
    {
      startedAt: Date;
      clockKnown: boolean;
      first: number | null;
      last: number | null;
      sets: number;
      lifted: number;
    }
  >();

  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const tally = bySession.get(set.sessionId) ?? {
      startedAt: set.startedAt,
      clockKnown: set.clockKnown,
      first: null,
      last: null,
      sets: 0,
      lifted: 0,
    };
    if (!set.cardio) {
      tally.sets += 1;
      tally.lifted += liftedKg(set);
    }
    const ticked = set.completedAt?.getTime();
    if (ticked !== undefined && !Number.isNaN(ticked)) {
      const began = ticked - Math.max(0, set.durationSeconds ?? 0) * 1000;
      tally.first = tally.first === null ? began : Math.min(tally.first, began);
      tally.last = tally.last === null ? ticked : Math.max(tally.last, ticked);
    }
    bySession.set(set.sessionId, tally);
  }

  return [...bySession.values()].map((tally) => ({
    startedAt: tally.startedAt,
    clockKnown: tally.clockKnown,
    firstSetAt: tally.first === null ? null : new Date(tally.first),
    lastSetAt: tally.last === null ? null : new Date(tally.last),
    sets: tally.sets,
    liftedKg: tally.lifted,
  }));
}

export interface BoardTotals {
  readonly workouts: number;
  readonly liftedKg: number;
  readonly sets: number;
  readonly minutes: number;
}

/** Everything somebody did in a span. Start inclusive, end exclusive. */
export function boardTotals(workouts: readonly BoardWorkout[], span: Span): BoardTotals {
  const start = span.start.getTime();
  const end = span.end.getTime();
  let count = 0;
  let lifted = 0;
  let sets = 0;
  let minutes = 0;

  for (const workout of workouts) {
    const at = workout.startedAt.getTime();
    if (Number.isNaN(at) || at < start || at >= end) continue;
    count += 1;
    lifted += Number.isFinite(workout.liftedKg) ? Math.max(0, workout.liftedKg) : 0;
    sets += Number.isFinite(workout.sets) ? Math.max(0, Math.trunc(workout.sets)) : 0;
    if (workout.clockKnown) {
      minutes += trainingMinutes([workout.firstSetAt, workout.lastSetAt]) ?? 0;
    }
  }

  return { workouts: count, liftedKg: lifted, sets, minutes };
}

/**
 * The number a stat is ranked on, in what the viewer sees.
 *
 * Weight is whole kilograms or whole pounds, whichever the viewer reads — so
 * two totals that both say "12,450 kg" are level, as two best lifts that both
 * say "100 kg" are (ADR-0105). Everything else is a count already.
 */
export function boardScore(
  totals: BoardTotals,
  stat: LeaderboardStat,
  unitSystem: UnitSystem,
): number {
  switch (stat) {
    case 'workouts':
      return totals.workouts;
    case 'sets':
      return totals.sets;
    case 'minutes':
      return Math.round(totals.minutes);
    case 'lifted':
      return Math.round(unitSystem === 'imperial' ? kgToLb(totals.liftedKg) : totals.liftedKg);
  }
}

/** This period and the one before it: this week and last, or this month and last. */
export function boardSpans(
  period: LeaderboardPeriod,
  now: Date,
  weekStartsOn: WeekStart,
): { readonly current: Span; readonly previous: Span } {
  const window = periodWindow(period, now, weekStartsOn);
  // Never null for a week or a month; only all time has nothing before it.
  const previous = window.previous ?? window.current;
  return { current: window.current, previous };
}

/**
 * How far back the board needs workouts from: the start of last month.
 *
 * That covers every span either period can ask for — last week begins at
 * most thirteen days before this month does, and last month is at least
 * twenty-eight days long — so one request serves every toggle.
 */
export function boardSince(now: Date): Date {
  const thisMonth = startOfMonth(now);
  return new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
}

export interface BoardEntry<Id> {
  readonly id: Id;
  readonly score: number;
}

export interface RankedEntry<Id> extends BoardEntry<Id> {
  /**
   * 1 for the most, shared on a tie — 1, 1, 3. Null for nothing at all: a
   * board where four people did nothing has nobody in first place.
   */
  readonly rank: number | null;
}

/**
 * Most first. Ties keep the order they came in, so the caller decides how a
 * tie reads (by name), and the order does not shuffle between renders.
 */
export function rankBoard<Id>(entries: readonly BoardEntry<Id>[]): RankedEntry<Id>[] {
  const sorted = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.score - a.entry.score || a.index - b.index)
    .map(({ entry }) => entry);

  const ranked: RankedEntry<Id>[] = [];
  for (const [index, entry] of sorted.entries()) {
    const above = ranked[index - 1];
    const rank = entry.score <= 0 ? null : above?.score === entry.score ? above.rank : index + 1;
    ranked.push({ ...entry, rank });
  }
  return ranked;
}

/**
 * How far you are from the next place: the target for today.
 *
 * - `behind`: the nearest score above yours, and by how much. Doing nothing
 *   yet, that is the lowest score on the board, which is the first one in
 *   reach.
 * - `level`: nobody above you, and somebody alongside — a shared first.
 * - `ahead`: first on your own, and by how much over the next score down.
 *
 * Null when there is nothing to chase: nobody else on the board, or nobody,
 * you included, has done anything yet.
 */
export type BoardGap<Id> =
  | { readonly kind: 'behind'; readonly id: Id; readonly by: number }
  | { readonly kind: 'level'; readonly id: Id }
  | { readonly kind: 'ahead'; readonly id: Id; readonly by: number };

export function boardGap<Id>(ranked: readonly RankedEntry<Id>[], you: Id): BoardGap<Id> | null {
  const mine = ranked.find((entry) => entry.id === you);
  if (mine === undefined) return null;
  const others = ranked.filter((entry) => entry.id !== you);

  // `ranked` is most first, so the last one above is the nearest.
  const above = others.filter((entry) => entry.score > mine.score);
  const nearest = above[above.length - 1];
  if (nearest !== undefined)
    return { kind: 'behind', id: nearest.id, by: nearest.score - mine.score };

  if (mine.score <= 0) return null;
  const alongside = others.find((entry) => entry.score === mine.score);
  if (alongside !== undefined) return { kind: 'level', id: alongside.id };
  const next = others.find((entry) => entry.score < mine.score);
  return next === undefined ? null : { kind: 'ahead', id: next.id, by: mine.score - next.score };
}

/**
 * Places moved since yesterday: positive up, negative down, zero for none.
 *
 * `yesterday` is the same board counted up to the start of today. Somebody
 * with no place yesterday is taken to have been just below the last place, so
 * their first workout of the week shows as a climb past whoever they passed —
 * and only ever as a climb: nobody falls from nowhere. Nobody with no place
 * today has moved. On the first day of a period nobody had a place yesterday,
 * so nothing has moved, which is right: everybody started level this morning.
 */
export function rankMoves<Id>(
  today: readonly RankedEntry<Id>[],
  yesterday: readonly RankedEntry<Id>[],
): Map<Id, number> {
  const before = new Map(yesterday.map((entry) => [entry.id, entry.rank]));
  const placedBefore = yesterday.filter((entry) => entry.rank !== null).length;

  const moves = new Map<Id, number>();
  for (const entry of today) {
    if (entry.rank === null) {
      moves.set(entry.id, 0);
      continue;
    }
    const was = before.get(entry.id) ?? null;
    moves.set(
      entry.id,
      was === null ? Math.max(0, placedBefore + 1 - entry.rank) : was - entry.rank,
    );
  }
  return moves;
}
