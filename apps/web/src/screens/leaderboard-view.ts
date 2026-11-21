/**
 * The leaderboard's words and arrangement: who is where, what each row says,
 * and the lines around the list.
 *
 * The counting is in core (`leaderboard.ts`); this is the phrasing, kept out
 * of the component so the edges can be tested — the friend with no name, the
 * friend not sharing, the week where nobody has trained yet.
 */
import { formatNumber, intlLocale, t } from '@g7m/i18n';
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
import { friendName, nameless } from './friends-view.js';

interface Option<T> {
  readonly value: T;
  readonly label: string;
}

const STATS: readonly LeaderboardStat[] = ['workouts', 'lifted', 'sets', 'minutes'];

/** The four stats, in the language speaking now. Called at render. */
export function statOptions(): readonly Option<LeaderboardStat>[] {
  return STATS.map((value) => ({ value, label: t().friends.board.stats[value] }));
}

export function rankingOptions(): readonly Option<LeaderboardRanking>[] {
  return (['most', 'improved'] as const).map((value) => ({
    value,
    label: t().friends.board.rankings[value],
  }));
}

export function periodOptions(): readonly Option<LeaderboardPeriod>[] {
  return (['week', 'month'] as const).map((value) => ({
    value,
    label: t().friends.board.periods[value],
  }));
}

/**
 * The three choices as one line, for the filter bar while it is shut: "Most
 * workouts this week", "Most improved: sets this month". Uses the controls'
 * own words, so the bar and what opens under it agree.
 */
export function boardSummary(
  ranking: LeaderboardRanking,
  stat: LeaderboardStat,
  period: LeaderboardPeriod,
): string {
  return t().friends.board.summary[ranking][period][stat];
}

/** The score as the row shows it: `5`, `12,450 kg`, `3h 5m`. */
export function scoreText(score: number, stat: LeaderboardStat, unitSystem: UnitSystem): string {
  switch (stat) {
    case 'workouts':
    case 'sets':
      return formatNumber(score);
    case 'minutes':
      return formatMinutes(score);
    case 'lifted':
      return `${formatNumber(score)} ${unitSystem === 'imperial' ? 'lb' : 'kg'}`;
  }
}

/** The score in words, for a screen reader: `5 workouts`, `12,450 kg lifted`. */
export function scoreWords(score: number, stat: LeaderboardStat, unitSystem: UnitSystem): string {
  switch (stat) {
    case 'workouts':
      return t().friends.board.workouts(formatNumber(score), score);
    case 'sets':
      return t().friends.board.sets(formatNumber(score), score);
    case 'minutes':
      return t().friends.board.ofTraining(formatMinutes(score));
    case 'lifted':
      return t().friends.board.lifted(scoreText(score, stat, unitSystem));
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
      return t().friends.board.behind(amountText(gap.by, stat, unitSystem), who);
    case 'level':
      return t().friends.board.levelWith(who);
    case 'ahead':
      return t().friends.board.ahead(amountText(gap.by, stat, unitSystem), who);
  }
}

/** How long the period has to run: "Last day", "5 days left". Today counts. */
export function timeLeft(end: Date, now: Date): string {
  const days = daysBetween(now, end);
  return days <= 1 ? t().friends.board.lastDay : t().friends.board.daysLeft(days);
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
   * The score as a fraction of the leader's, 0 to 1, for the bar under it.
   * Null for anybody without a place, who has no bar.
   */
  readonly share: number | null;
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
  /** "5 days left", or "Last day". */
  readonly left: string;
  /**
   * Your place and the gap to the next one, for the summary pinned above the
   * tab bar: "You’re #2" and "1 workout behind Sam". The gap is your row's note.
   */
  readonly standing: { readonly place: string; readonly gap: string | null };
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
  const words = t().friends.board;

  // In name order going in, so a tie reads alphabetically and does not
  // shuffle between renders; rankBoard keeps that order within a tie.
  const contenders: Contender[] = [
    {
      key: 'you',
      userId: null,
      name: t().friends.you,
      avatarName: context.myName,
      workouts: mine,
    },
    ...friends
      .filter((friend) => friend.sharing)
      .map((friend) => ({
        key: friend.userId,
        userId: friend.userId,
        name: friendName(friend.name),
        avatarName: friend.name,
        workouts: friend.workouts,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, intlLocale(), { sensitivity: 'base' }));

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
  const crowned = words.crowned(improved, period);

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
      ? describeGap(inUnits(gap), (id) => byKey.get(id)?.name ?? nameless(), stat, unitSystem)
      : placed.has('you')
        ? null
        : words.nothingYetToMeasure;

  const top = ranked.find((entry) => entry.rank !== null)?.score ?? 0;

  const shown = (score: number) =>
    improved ? `${String(score)}%` : scoreText(score, stat, unitSystem);
  const said = (score: number) =>
    improved ? words.ofUsual(score) : scoreWords(score, stat, unitSystem);

  const row = (
    key: string,
    rank: number | null,
    score: number,
    move: number,
    measured: boolean,
  ): BoardRowView => {
    const contender = byKey.get(key);
    const name = contender?.name ?? t().friends.you;
    const isYou = key === 'you';
    const champion = champions.has(key);
    // Your own row says why under your name, so its description does not say it twice.
    const where = !measured
      ? isYou
        ? words.rowNew(name)
        : words.rowNewWhy(name, period)
      : rank === null
        ? words.rowNothing(name)
        : words.rowPlaced(words.ordinal(rank), name, said(score));
    const moved = move === 0 ? null : words.moved(move > 0, Math.abs(move));
    const spoken = [where, moved, champion ? crowned : null]
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
      scoreText: measured ? shown(score) : words.new,
      share: rank === null || top <= 0 ? null : Math.min(1, score / top),
      champion,
      move,
      moveText: move === 0 ? null : `${move > 0 ? '▲' : '▼'}${String(Math.abs(move))}`,
      note: mine,
      description: mine !== null ? `${spoken}. ${mine}` : spoken,
    };
  };

  const rows = [
    ...ranked.map((entry) =>
      row(entry.id, entry.rank, entry.score, moves.get(entry.id) ?? 0, true),
    ),
    ...unmeasured.map((contender) => row(contender.key, null, 0, 0, false)),
  ];

  const footnotes = [
    improved ? (period === 'week' ? words.usualWeek : words.usualMonth) : null,
    stat === 'lifted' ? words.weightCounts : null,
  ].filter((line) => line !== null);

  const hidden = friends.filter((friend) => !friend.sharing);
  const notSharing =
    hidden.length === 0
      ? null
      : hidden.length === 1
        ? words.oneNotSharing(friendName(hidden[0]?.name ?? null))
        : words.manyNotSharing(hidden.length);

  return {
    rows,
    left: timeLeft(spans.current.end, now),
    standing: {
      place: (() => {
        const rank = rows.find((entry) => entry.isYou)?.rank ?? null;
        return rank === null ? words.noPlace : words.yourPlace(rank);
      })(),
      gap: note,
    },
    notSharing,
    footnote: footnotes.length === 0 ? null : footnotes.join(' '),
    alone: friends.length === 0,
  };
}
