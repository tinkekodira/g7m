/**
 * One-to-one challenges: you against one friend, on one stat, for seven days
 * from the moment they accept (ADR-0110).
 *
 * Counted by the leaderboard's rules (`leaderboard.ts`), from the same
 * tallies, so a challenge and the board never disagree about the same
 * training. Ranked by improvement, each side is measured against their own
 * four weeks before the challenge began, as Most improved is (ADR-0109).
 */
import {
  boardScore,
  boardTotals,
  improvementScore,
  pointsToAmount,
  usualScore,
  type BoardWorkout,
  type LeaderboardRanking,
  type LeaderboardStat,
} from './leaderboard.js';
import type { Span } from './periods.js';
import type { UnitSystem } from './units.js';

export const CHALLENGE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Seven days of elapsed time from the moment it was accepted. Unlike the
 * board's calendar periods this is not local time: it is the same instant for
 * both people, whatever their timezones or week starts, so they agree on when
 * it ends. A workout belongs to it if it started inside it, so one already
 * under way when the challenge was accepted does not count.
 */
export function challengeSpan(startsAt: Date): Span {
  return { start: startsAt, end: new Date(startsAt.getTime() + CHALLENGE_DAYS * DAY_MS) };
}

export interface ChallengeScore {
  /**
   * The stat in its own units, or ranked by improvement a whole percentage of
   * usual. Null when ranked by improvement with no usual to measure against.
   */
  readonly score: number | null;
  /** Usual for seven days in the stat's units; zero when ranked by the most. */
  readonly usual: number;
}

/** One side of a challenge: what they did inside it, up to now or to its end. */
export function challengeScore(
  workouts: readonly BoardWorkout[],
  span: Span,
  stat: LeaderboardStat,
  ranking: LeaderboardRanking,
  unitSystem: UnitSystem,
): ChallengeScore {
  const done = boardScore(boardTotals(workouts, span), stat, unitSystem);
  if (ranking === 'most') return { score: done, usual: 0 };
  const usual = usualScore(workouts, span, stat, unitSystem);
  return { score: improvementScore(done, usual), usual };
}

/**
 * Where you stand. `by` is in the stat's own units: ranked by improvement, it
 * is what the one behind would have to do, on their own usual, to draw level
 * ("2 sets behind Alex"), as the board says it.
 *
 * Somebody with no usual counts as nothing done, so a challenge can always be
 * decided; the server refuses to start one that would be like that.
 */
export type ChallengeStanding =
  | { readonly kind: 'ahead'; readonly by: number }
  | { readonly kind: 'behind'; readonly by: number }
  | { readonly kind: 'level' };

export function challengeStanding(
  mine: ChallengeScore,
  theirs: ChallengeScore,
  ranking: LeaderboardRanking,
): ChallengeStanding {
  const a = mine.score ?? 0;
  const b = theirs.score ?? 0;
  if (a === b) return { kind: 'level' };
  if (a > b) {
    return { kind: 'ahead', by: ranking === 'most' ? a - b : pointsToAmount(a - b, theirs.usual) };
  }
  return { kind: 'behind', by: ranking === 'most' ? b - a : pointsToAmount(b - a, mine.usual) };
}
