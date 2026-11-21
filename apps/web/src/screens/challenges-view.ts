/**
 * What a challenge card says (ADR-0110): who against whom, on what, how long
 * is left, and who is ahead — in words a lifter reads between sets.
 *
 * The counting is in core (`challenges.ts`), by the leaderboard's rules; this
 * is the phrasing, kept out of the component so the edges can be tested.
 */
import { t } from '@g7m/i18n';
import {
  challengeScore,
  challengeSpan,
  challengeStanding,
  describeWhen,
  type BoardWorkout,
  type ChallengeScore,
  type LeaderboardRanking,
  type LeaderboardStat,
  type UnitSystem,
  kgToLb,
} from '@g7m/core';
import type {
  Challenge,
  ChallengeAnswerOutcome,
  ChallengeSendOutcome,
} from '../lib/friends/api.js';
import { friendName } from './friends-view.js';
import { amountText, scoreText } from './leaderboard-view.js';

/**
 * Sent to you and waiting for your answer; sent by you and waiting for
 * theirs; running; or over, with a result.
 */
export type ChallengePhase = 'incoming' | 'outgoing' | 'running' | 'finalizing' | 'finished';

export interface ChallengeSideView {
  readonly name: string;
  readonly score: string;
  /** Ahead, or the winner once it is over. */
  readonly leading: boolean;
}

export interface ChallengeCardView {
  readonly outcome: 'win' | 'loss' | 'draw' | 'unavailable' | null;
  readonly recovered: boolean;
  readonly metric: string;
  readonly endedAt: Date | null;
  readonly id: string;
  readonly friendId: string;
  readonly name: string;
  readonly avatarName: string | null;
  readonly phase: ChallengePhase;
  /** "Most sets", "Most improved: workouts". */
  readonly title: string;
  /** "Sent today", "4 days left", "Ended yesterday". */
  readonly when: string;
  /** You, then them. Null before it starts, or when it cannot be scored. */
  readonly sides: readonly [ChallengeSideView, ChallengeSideView] | null;
  /** "2 sets ahead of Alex", "You won", "Waiting for Alex to accept". */
  readonly verdict: string;
  /** The whole card in words. */
  readonly description: string;
}

export interface ChallengeContext {
  readonly now: Date;
  readonly unitSystem: UnitSystem;
}

/**
 * What a new challenge can be on (ADR-0133): who turned up, and who lifted
 * more. Sets and time can be padded over a week — one more junk set, a longer
 * rest — so they no longer decide one. The board still ranks all four, and a
 * challenge already made on sets or time is still counted and shown.
 */
export function challengeStatOptions(): readonly {
  readonly value: LeaderboardStat;
  readonly label: string;
}[] {
  return (['workouts', 'lifted'] as const).map((value) => ({
    value,
    label: t().friends.board.stats[value],
  }));
}

export function challengeTitle(stat: LeaderboardStat, ranking: LeaderboardRanking): string {
  return t().friends.challenge.title[ranking][stat];
}

/** "5 days left", "3 hours left", "Under an hour left". */
export function challengeTimeLeft(end: Date, now: Date): string {
  const hours = (end.getTime() - now.getTime()) / 3_600_000;
  if (hours < 1) return t().friends.challenge.underAnHour;
  if (hours <= 24) return t().friends.challenge.hoursLeft(Math.ceil(hours));
  return t().friends.challenge.daysLeft(Math.ceil(hours / 24));
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function shown(
  side: ChallengeScore,
  stat: LeaderboardStat,
  ranking: LeaderboardRanking,
  unitSystem: UnitSystem,
): string {
  if (ranking === 'most') return scoreText(side.score ?? 0, stat, unitSystem);
  return side.score === null ? t().friends.board.new : `${String(side.score)}%`;
}

export function challengeCard(
  challenge: Challenge,
  mine: readonly BoardWorkout[],
  { now, unitSystem }: ChallengeContext,
): ChallengeCardView {
  const name = friendName(challenge.name);
  const words = t().friends.challenge;
  const you = t().friends.you;
  const { stat, ranking } = challenge;
  const title = challengeTitle(stat, ranking);
  const base = {
    id: challenge.id,
    friendId: challenge.friendId,
    name,
    avatarName: challenge.name,
    title,
    outcome: null,
    recovered: challenge.recovered === true,
    metric: ranking === 'improved' ? words.ofUsual : words.metric[stat],
    endedAt: challenge.startsAt === null ? null : challengeSpan(challenge.startsAt).end,
  };
  const describe = (when: string, verdict: string, sides: ChallengeCardView['sides']) =>
    [
      words.against(title, name),
      when,
      ...(sides === null ? [] : sides.map((side) => `${side.name}: ${side.score}`)),
      verdict,
    ].join('. ');

  if (challenge.startsAt === null) {
    const when = words.sent(lowerFirst(describeWhen(challenge.sentAt, now)));
    const verdict = challenge.sentByMe ? words.waiting(name) : words.challengedYou(name);
    return {
      ...base,
      phase: challenge.sentByMe ? 'outgoing' : 'incoming',
      when,
      sides: null,
      verdict,
      description: describe(when, verdict, null),
    };
  }

  const span = challengeSpan(challenge.startsAt);
  const over = now.getTime() >= span.end.getTime();
  const phase: ChallengePhase = over ? 'finalizing' : 'running';
  const when = over
    ? words.ended(lowerFirst(describeWhen(span.end, now)))
    : challengeTimeLeft(span.end, now);

  if (challenge.result != null) {
    const { outcome, mine: yours, theirs } = challenge.result;
    const format = (side: typeof yours) =>
      ranking === 'improved'
        ? side.score === null
          ? t().friends.board.new
          : `${String(side.score)}%`
        : scoreText(
            stat === 'lifted'
              ? Math.round(unitSystem === 'imperial' ? kgToLb(side.amount) : side.amount)
              : (side.score ?? 0),
            stat,
            unitSystem,
          );
    const sides: ChallengeCardView['sides'] =
      outcome === 'unavailable'
        ? null
        : [
            { name: you, score: format(yours), leading: outcome === 'win' },
            { name, score: format(theirs), leading: outcome === 'loss' },
          ];
    const verdict =
      outcome === 'win'
        ? words.youWon
        : outcome === 'loss'
          ? words.theyWon(name)
          : outcome === 'draw'
            ? words.draw
            : words.unavailable;
    return {
      ...base,
      outcome,
      phase: 'finished',
      when,
      sides,
      verdict,
      description: describe(when, verdict, sides),
    };
  }

  if (over) {
    const verdict = words.finalizing;
    return {
      ...base,
      phase,
      when,
      sides: null,
      verdict,
      description: describe(when, verdict, null),
    };
  }

  if (challenge.workouts === null) {
    const verdict = words.sharingOff;
    return {
      ...base,
      phase,
      when,
      sides: null,
      verdict,
      description: describe(when, verdict, null),
    };
  }

  const yours = challengeScore(mine, span, stat, ranking, unitSystem);
  const theirs = challengeScore(challenge.workouts, span, stat, ranking, unitSystem);
  const standing = challengeStanding(yours, theirs, ranking);
  const sides: readonly [ChallengeSideView, ChallengeSideView] = [
    {
      name: you,
      score: shown(yours, stat, ranking, unitSystem),
      leading: standing.kind === 'ahead',
    },
    { name, score: shown(theirs, stat, ranking, unitSystem), leading: standing.kind === 'behind' },
  ];

  const verdict =
    standing.kind === 'ahead'
      ? t().friends.board.ahead(amountText(standing.by, stat, unitSystem), name)
      : standing.kind === 'behind'
        ? t().friends.board.behind(amountText(standing.by, stat, unitSystem), name)
        : t().friends.board.levelWith(name);

  return { ...base, phase, when, sides, verdict, description: describe(when, verdict, sides) };
}

const ORDER: Record<ChallengePhase, number> = {
  running: 0,
  outgoing: 1,
  finalizing: 2,
  finished: 3,
  incoming: 4,
};

/**
 * Every card, split: the ones waiting for your answer, which belong with
 * friend requests, and the rest — running first, then waiting on a friend,
 * then finished — each kept in the server's order, newest first.
 */
export function challengeCards(
  challenges: readonly Challenge[],
  mine: readonly BoardWorkout[],
  context: ChallengeContext,
): { readonly incoming: ChallengeCardView[]; readonly others: ChallengeCardView[] } {
  const cards = challenges.map((challenge) => challengeCard(challenge, mine, context));
  return {
    incoming: cards.filter((card) => card.phase === 'incoming'),
    others: cards
      .filter((card) => card.phase !== 'incoming')
      .map((card, index) => ({ card, index }))
      .sort((a, b) => ORDER[a.card.phase] - ORDER[b.card.phase] || a.index - b.index)
      .map(({ card }) => card),
  };
}

/** Why a challenge did not go through, in words; null when it did. */
export function describeChallengeProblem(
  outcome: ChallengeSendOutcome | ChallengeAnswerOutcome,
  name: string,
): string | null {
  switch (outcome) {
    case 'sent':
    case 'started':
    case 'declined':
      return null;
    default:
      return t().friends.challenge.problems[outcome](name);
  }
}
