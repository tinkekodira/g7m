/**
 * The leaderboard's words and arrangement: who is where, what each row says,
 * and the lines around the list.
 *
 * The counting is in core (`leaderboard.ts`); this is the phrasing, kept out
 * of the component so the edges can be tested — the friend with no name, the
 * friend not sharing, the week where nobody has trained yet.
 */
import {
  boardScore,
  boardSpans,
  boardTotals,
  daysBetween,
  formatMinutes,
  rankBoard,
  type BoardWorkout,
  type LeaderboardPeriod,
  type LeaderboardStat,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import type { BoardFriend } from '../lib/friends/api.js';
import { friendName } from './friends-view.js';

export const STAT_OPTIONS: readonly { readonly value: LeaderboardStat; readonly label: string }[] =
  [
    { value: 'workouts', label: 'Workouts' },
    { value: 'lifted', label: 'Weight' },
    { value: 'sets', label: 'Sets' },
    { value: 'minutes', label: 'Time' },
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
  const { stat, period, now, unitSystem } = context;
  const spans = boardSpans(period, now, context.weekStartsOn);

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
  const ranked = rankBoard(
    contenders.map((contender) => ({
      id: contender.key,
      score: boardScore(boardTotals(contender.workouts, spans.current), stat, unitSystem),
    })),
  );

  const rows = ranked.map((entry): BoardRowView => {
    const contender = byKey.get(entry.id);
    const name = contender?.name ?? 'You';
    const words = scoreWords(entry.score, stat, unitSystem);
    return {
      key: entry.id,
      userId: contender?.userId ?? null,
      name,
      avatarName: contender?.avatarName ?? null,
      isYou: entry.id === 'you',
      rank: entry.rank,
      rankText: entry.rank === null ? '–' : String(entry.rank),
      score: entry.score,
      scoreText: scoreText(entry.score, stat, unitSystem),
      description:
        entry.rank === null ? `${name}: nothing yet` : `${ordinal(entry.rank)}, ${name}: ${words}`,
    };
  });

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
    footnote:
      stat === 'lifted'
        ? 'Weight × reps on working sets. Bodyweight moves like pull-ups and dips count only the weight added to them.'
        : null,
    alone: friends.length === 0,
  };
}
