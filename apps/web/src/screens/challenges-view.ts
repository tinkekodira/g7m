/**
 * What a challenge card says (ADR-0110): who against whom, on what, how long
 * is left, and who is ahead — in words a lifter reads between sets.
 *
 * The counting is in core (`challenges.ts`), by the leaderboard's rules; this
 * is the phrasing, kept out of the component so the edges can be tested.
 */
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
export type ChallengePhase = 'incoming' | 'outgoing' | 'running' | 'finished';

export interface ChallengeSideView {
  readonly name: string;
  readonly score: string;
  /** Ahead, or the winner once it is over. */
  readonly leading: boolean;
}

export interface ChallengeCardView {
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

const NOUNS: Record<LeaderboardStat, string> = {
  workouts: 'workouts',
  lifted: 'weight lifted',
  sets: 'sets',
  minutes: 'time training',
};

export function challengeTitle(stat: LeaderboardStat, ranking: LeaderboardRanking): string {
  return ranking === 'most' ? `Most ${NOUNS[stat]}` : `Most improved: ${NOUNS[stat]}`;
}

/** "5 days left", "3 hours left", "Under an hour left". */
export function challengeTimeLeft(end: Date, now: Date): string {
  const hours = (end.getTime() - now.getTime()) / 3_600_000;
  if (hours < 1) return 'Under an hour left';
  if (hours <= 24) {
    const whole = Math.ceil(hours);
    return whole === 1 ? '1 hour left' : `${String(whole)} hours left`;
  }
  return `${String(Math.ceil(hours / 24))} days left`;
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
  return side.score === null ? 'New' : `${String(side.score)}%`;
}

export function challengeCard(
  challenge: Challenge,
  mine: readonly BoardWorkout[],
  { now, unitSystem }: ChallengeContext,
): ChallengeCardView {
  const name = friendName(challenge.name);
  const { stat, ranking } = challenge;
  const title = challengeTitle(stat, ranking);
  const base = {
    id: challenge.id,
    friendId: challenge.friendId,
    name,
    avatarName: challenge.name,
    title,
  };
  const describe = (when: string, verdict: string, sides: ChallengeCardView['sides']) =>
    [
      `${title}, against ${name}`,
      when,
      ...(sides === null ? [] : sides.map((side) => `${side.name}: ${side.score}`)),
      verdict,
    ].join('. ');

  if (challenge.startsAt === null) {
    const when = `Sent ${lowerFirst(describeWhen(challenge.sentAt, now))}`;
    const verdict = challenge.sentByMe
      ? `Waiting for ${name} to accept`
      : `${name} challenged you. Seven days, from when you accept.`;
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
  const phase: ChallengePhase = over ? 'finished' : 'running';
  const when = over
    ? `Ended ${lowerFirst(describeWhen(span.end, now))}`
    : challengeTimeLeft(span.end, now);

  if (challenge.workouts === null) {
    const verdict = `${name} isn’t sharing their training now, so this can’t be scored.`;
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
      name: 'You',
      score: shown(yours, stat, ranking, unitSystem),
      leading: standing.kind === 'ahead',
    },
    { name, score: shown(theirs, stat, ranking, unitSystem), leading: standing.kind === 'behind' },
  ];

  const verdict = over
    ? standing.kind === 'ahead'
      ? 'You won'
      : standing.kind === 'behind'
        ? `${name} won`
        : 'A draw'
    : standing.kind === 'ahead'
      ? `${amountText(standing.by, stat, unitSystem)} ahead of ${name}`
      : standing.kind === 'behind'
        ? `${amountText(standing.by, stat, unitSystem)} behind ${name}`
        : `Level with ${name}`;

  return { ...base, phase, when, sides, verdict, description: describe(when, verdict, sides) };
}

const ORDER: Record<ChallengePhase, number> = { running: 0, outgoing: 1, finished: 2, incoming: 3 };

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
    case 'already_live':
      return `You already have a challenge with ${name}. One at a time.`;
    case 'not_sharing':
      return `${name} isn’t sharing their training, so a challenge can’t be scored.`;
    case 'you_not_sharing':
      return 'Turn on sharing your training in Settings to take part in challenges.';
    case 'no_usual':
      return `${name} has no workouts in the last four weeks to measure against. Try Most instead.`;
    case 'you_no_usual':
      return 'You have no workouts in the last four weeks to measure against. Try Most instead.';
    case 'not_friends':
      return `${name} is no longer on your friends list.`;
    case 'not_found':
      return 'That challenge isn’t there any more.';
    case 'too_many':
      return 'Too many challenges sent. Try again later.';
    case 'invalid':
      return 'Something was wrong with that challenge. Try again.';
  }
}
