/**
 * The leaderboard's words and arrangement: who is where, what each row says,
 * and the lines around the list.
 *
 * The counting is in core (`leaderboard.ts`); this is the phrasing, kept out
 * of the component so the edges can be tested — the friend with no name, the
 * friend not sharing, the week where nobody has trained yet.
 */
import {
  boardGap,
  boardScore,
  boardSpans,
  boardTotals,
  daysBetween,
  formatMinutes,
  improvementScore,
  pointsToAmount,
  rankBoard,
  rankMoves,
  startOfDay,
  usualScore,
  type BoardGap,
  type BoardWorkout,
  type LeaderboardPeriod,
  type LeaderboardRanking,
  type LeaderboardStat,
  type Span,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import type { BoardFriend } from '../lib/friends/api.js';
import { NAMELESS, friendName } from './friends-view.js';

export const STAT_OPTIONS: readonly { readonly value: LeaderboardStat; readonly label: string }[] =
  [
    { value: 'workouts', label: 'Workouts' },
    { value: 'lifted', label: 'Weight' },
    { value: 'sets', label: 'Sets' },
    { value: 'minutes', label: 'Time' },
  ];

export const RANKING_OPTIONS: readonly {
  readonly value: LeaderboardRanking;
  readonly label: string;
}[] = [
  { value: 'most', label: 'Most' },
  { value: 'improved', label: 'Most improved' },
];

export const PERIOD_OPTIONS: readonly {
  readonly value: LeaderboardPeriod;
  readonly label: string;
}[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

/** The score as the row shows it: `5`, `12,450 kg`, `3h 5m`. */
export function scoreText(score: number, stat: LeaderboardStat, unitSystem: UnitSystem): string {
  switch (stat) {
    case 'workouts':
    case 'sets':
      return score.toLocaleString('en');
    case 'minutes':
      return formatMinutes(score);
    case 'lifted':
      return `${score.toLocaleString('en')} ${unitSystem === 'imperial' ? 'lb' : 'kg'}`;
  }
}

/** The score in words, for a screen reader: `5 workouts`, `12,450 kg lifted`. */
export function scoreWords(score: number, stat: LeaderboardStat, unitSystem: UnitSystem): string {
  switch (stat) {
    case 'workouts':
      return score === 1 ? '1 workout' : `${score.toLocaleString('en')} workouts`;
    case 'sets':
      return score === 1 ? '1 set' : `${score.toLocaleString('en')} sets`;
    case 'minutes':
      return `${formatMinutes(score)} of training`;
    case 'lifted':
      return `${scoreText(score, stat, unitSystem)} lifted`;
  }
}

/** An amount to make up: `2 workouts`, `1,200 kg`, `25m`. */
export function amountText(by: number, stat: LeaderboardStat, unitSystem: UnitSystem): string {
  switch (stat) {
    case 'workouts':
    case 'sets':
      return scoreWords(by, stat, unitSystem);
    case 'minutes':
      return formatMinutes(by);
    case 'lifted':
      return scoreText(by, stat, unitSystem);
  }
}

/** "2 sets behind Alex", "Level with Sam", "3 workouts ahead of Jordan". */
export function describeGap(
  gap: BoardGap<string>,
  nameOf: (id: string) => string,
  stat: LeaderboardStat,
  unitSystem: UnitSystem,
): string {
  const who = nameOf(gap.id);
  switch (gap.kind) {
    case 'behind':
      return `${amountText(gap.by, stat, unitSystem)} behind ${who}`;
    case 'level':
      return `Level with ${who}`;
    case 'ahead':
      return `${amountText(gap.by, stat, unitSystem)} ahead of ${who}`;
  }
}

function ordinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return `${String(rank)}th`;
  switch (rank % 10) {
    case 1:
      return `${String(rank)}st`;
    case 2:
      return `${String(rank)}nd`;
    case 3:
      return `${String(rank)}rd`;
    default:
      return `${String(rank)}th`;
  }
}

/** How long the period has to run: "Last day", "5 days left". Today counts. */
export function timeLeft(end: Date, now: Date): string {
  const days = daysBetween(now, end);
  return days <= 1 ? 'Last day' : `${String(days)} days left`;
}

export interface BoardRowView {
  /** The friend's id, or `you`. */
  readonly key: string;
  /** Null for your own row, which does not open a friend's page. */
  readonly userId: string | null;
  readonly name: string;
  readonly avatarName: string | null;
  readonly isYou: boolean;
  readonly rank: number | null;
  /** `1`, or a dash for nothing yet. */
  readonly rankText: string;
  readonly score: number;
  readonly scoreText: string;
  /**
   * First last week (or last month, on the month's board). Shared on a tie,
   * and nobody's for a period in which nobody did anything.
   */
  readonly champion: boolean;
  /** Places moved since yesterday: positive up, negative down. */
  readonly move: number;
  /** "▲2", "▼1", or null for no move. */
  readonly moveText: string | null;
  /** Under your own name: how far the next place is. Null on everybody else's. */
  readonly note: string | null;
  /** The whole row in words. */
  readonly description: string;
}

export interface BoardView {
  readonly rows: readonly BoardRowView[];
  /** "This week · 5 days left". */
  readonly heading: string;
  /** Friends not sharing, who are not on the board. Null when there are none. */
  readonly notSharing: string | null;
  /** What the weight counts, said once under the list. Null for the other stats. */
  readonly footnote: string | null;
  /** True when you have no friends to be on a board with. */
  readonly alone: boolean;
}

export interface BoardContext {
  readonly ranking: LeaderboardRanking;
  readonly stat: LeaderboardStat;
  readonly period: LeaderboardPeriod;
  readonly now: Date;
  readonly weekStartsOn: WeekStart;
  readonly unitSystem: UnitSystem;
  /** Your name, for your avatar. The row itself says "You". */
  readonly myName: string | null;
}

interface Contender {
  readonly key: string;
  readonly userId: string | null;
  readonly name: string;
  readonly avatarName: string | null;
  readonly workouts: readonly BoardWorkout[];
}

export function leaderboard(
  friends: readonly BoardFriend[],
  mine: readonly BoardWorkout[],
  context: BoardContext,
): BoardView {
  const { ranking, stat, period, now, unitSystem } = context;
  const improved = ranking === 'improved';
  const spans = boardSpans(period, now, context.weekStartsOn);
  const periodWord = period === 'week' ? 'week' : 'month';

  // In name order going in, so a tie reads alphabetically and does not
  // shuffle between renders; rankBoard keeps that order within a tie.
  const contenders: Contender[] = [
    { key: 'you', userId: null, name: 'You', avatarName: context.myName, workouts: mine },
    ...friends
      .filter((friend) => friend.sharing)
      .map((friend) => ({
        key: friend.userId,
        userId: friend.userId,
        name: friendName(friend.name),
        avatarName: friend.name,
        workouts: friend.workouts,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const byKey = new Map(contenders.map((contender) => [contender.key, contender]));
  const usualOf = (key: string, whole: Span): number =>
    usualScore(byKey.get(key)?.workouts ?? [], whole, stat, unitSystem);

  // One board: what each contender did in `counted`, which is all or part of
  // the period `whole`. Ranked by improvement, that is a percentage of their
  // usual for `whole`, and somebody with no usual is left off.
  const board = (counted: Span, whole: Span) =>
    rankBoard(
      contenders.flatMap((contender) => {
        const done = boardScore(boardTotals(contender.workouts, counted), stat, unitSystem);
        const score = improved ? improvementScore(done, usualOf(contender.key, whole)) : done;
        return score === null ? [] : [{ id: contender.key, score }];
      }),
    );

  const ranked = board(spans.current, spans.current);
  const placed = new Set(ranked.map((entry) => entry.id));
  // Ranked by improvement, the people with nothing to measure against.
  const unmeasured = contenders.filter((contender) => !placed.has(contender.key));

  // The same board as it stood at the end of yesterday, for the arrows.
  const today = startOfDay(now);
  const moves = rankMoves(
    ranked,
    board(
      {
        start: spans.current.start,
        end: today < spans.current.start ? spans.current.start : today,
      },
      spans.current,
    ),
  );

  // Last period, ranked by the same rule, for its winner's crown. The friends
  // are today's: a friend added since is in the running, one who has stopped
  // sharing is not.
  const champions = new Set(
    board(spans.previous, spans.previous)
      .filter((entry) => entry.rank === 1)
      .map((entry) => entry.id),
  );
  const crowned = `${improved ? 'Most improved' : 'Won'} last ${periodWord}`;

  // Ranked by improvement the gap is in percentage points, which nobody can
  // train towards; it is said instead as what the one behind has to do to
  // draw level, in their own usual's terms: "1 workout behind Sam".
  const gap = boardGap(ranked, 'you');
  const inUnits = (found: BoardGap<string>): BoardGap<string> =>
    !improved || found.kind === 'level'
      ? found
      : {
          ...found,
          by: pointsToAmount(
            found.by,
            usualOf(found.kind === 'behind' ? 'you' : found.id, spans.current),
          ),
        };
  const note =
    gap !== null
      ? describeGap(inUnits(gap), (id) => byKey.get(id)?.name ?? NAMELESS, stat, unitSystem)
      : placed.has('you')
        ? null
        : 'Nothing to measure against yet';

  const shown = (score: number) =>
    improved ? `${String(score)}%` : scoreText(score, stat, unitSystem);
  const said = (score: number) =>
    improved ? `${String(score)}% of usual` : scoreWords(score, stat, unitSystem);

  const row = (
    key: string,
    rank: number | null,
    score: number,
    move: number,
    measured: boolean,
  ): BoardRowView => {
    const contender = byKey.get(key);
    const name = contender?.name ?? 'You';
    const isYou = key === 'you';
    const champion = champions.has(key);
    // Your own row says why under your name, so its description does not say it twice.
    const where = !measured
      ? isYou
        ? `${name}: new`
        : `${name}: new, nothing in the four weeks before this ${periodWord} to measure against`
      : rank === null
        ? `${name}: nothing yet`
        : `${ordinal(rank)}, ${name}: ${said(score)}`;
    const moved =
      move === 0 ? null : `${move > 0 ? 'Up' : 'Down'} ${String(Math.abs(move))} since yesterday`;
    const words = [where, moved, champion ? crowned : null]
      .filter((part) => part !== null)
      .join('. ');
    const mine = isYou ? note : null;
    return {
      key,
      userId: contender?.userId ?? null,
      name,
      avatarName: contender?.avatarName ?? null,
      isYou,
      rank,
      rankText: rank === null ? '–' : String(rank),
      score,
      scoreText: measured ? shown(score) : 'New',
      champion,
      move,
      moveText: move === 0 ? null : `${move > 0 ? '▲' : '▼'}${String(Math.abs(move))}`,
      note: mine,
      description: mine !== null ? `${words}. ${mine}` : words,
    };
  };

  const rows = [
    ...ranked.map((entry) =>
      row(entry.id, entry.rank, entry.score, moves.get(entry.id) ?? 0, true),
    ),
    ...unmeasured.map((contender) => row(contender.key, null, 0, 0, false)),
  ];

  const footnotes = [
    improved
      ? period === 'week'
        ? '100% is a usual week: a quarter of what each person did in the four weeks before it.'
        : '100% is a usual month: what each person did in the four weeks before it, stretched to the month’s length.'
      : null,
    stat === 'lifted'
      ? 'Weight × reps on working sets. Bodyweight moves like pull-ups and dips count only the weight added to them.'
      : null,
  ].filter((line) => line !== null);

  const hidden = friends.filter((friend) => !friend.sharing);
  const notSharing =
    hidden.length === 0
      ? null
      : hidden.length === 1
        ? `${friendName(hidden[0]?.name ?? null)} isn’t sharing their training, so isn’t on the board.`
        : `${String(hidden.length)} friends aren’t sharing their training, so aren’t on the board.`;

  return {
    rows,
    heading: `${period === 'week' ? 'This week' : 'This month'} · ${timeLeft(spans.current.end, now)}`,
    notSharing,
    footnote: footnotes.length === 0 ? null : footnotes.join(' '),
    alone: friends.length === 0,
  };
}
