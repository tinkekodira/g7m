/**
 * The Friends tab's words and numbers: what each card says, what a request
 * says, and what came of sending one.
 *
 * The rules are in core (`friends.ts`) — dots, streaks, who is ahead. This is
 * the phrasing and the arranging, kept out of the components so the edges can
 * be tested: the friend with no name, the lift only one of you has done, the
 * workout logged after the fact that has no duration worth stating.
 */
import {
  BIG_THREE,
  compareLifts,
  describePresence,
  describeStreak,
  describeWorkoutDay,
  formatMinutes,
  trainingMinutes,
  weekDots,
  weeklyStreak,
  workoutTitle,
  toDisplayWeight,
  type FriendCodeCheck,
  type PrimaryWork,
  type Presence,
  type Standing,
  type UnitSystem,
  type WeekDot,
  type WeekStart,
} from '@g7m/core';
import type { Friend, FriendRequest, SendResult, WorkoutSummary } from '../lib/friends/api.js';

/** Every exercise's primary movers, from the local catalogue. */
export type Movers = ReadonlyMap<
  string,
  readonly { readonly muscle: string; readonly group: string }[]
>;

/** A friend who never set a name. Rare — the welcome questions ask for one. */
export const NAMELESS = 'Your friend';

export function friendName(name: string | null): string {
  return name ?? NAMELESS;
}

/**
 * What a workout is called: its own name, or the one the app would give it.
 *
 * The same `workoutTitle` your own history uses, fed from the catalogue on
 * this phone, so a friend's leg day is "Leg day" in the same words as yours.
 */
export function summaryTitle(summary: WorkoutSummary, movers: Movers): string {
  if (summary.name !== null) return summary.name;
  const work: PrimaryWork[] = [];
  let bouts = 0;
  for (const entry of summary.work) {
    const primary = movers.get(entry.exerciseId) ?? [];
    // Cardio has no primary movers; its "sets" are bouts.
    if (primary.length === 0) bouts += entry.sets;
    for (const mover of primary)
      work.push({ exerciseId: entry.exerciseId, ...mover, sets: entry.sets });
  }
  return workoutTitle(work, bouts);
}

/**
 * How long it took, first set ticked to last — the clock the history list
 * reads. Null for a workout logged afterwards, whose ticks are typing time.
 */
export function summaryDuration(summary: WorkoutSummary): string | null {
  if (summary.source === 'past') return null;
  const minutes = trainingMinutes([summary.firstSetAt, summary.lastSetAt]);
  return minutes === null ? null : formatMinutes(minutes);
}

export function weightText(kg: number, unitSystem: UnitSystem): string {
  const shown = toDisplayWeight(kg, unitSystem);
  return `${String(shown.value)} ${shown.unit}`;
}

export interface LiftCell {
  readonly label: string;
  /** Their best, or a dash. */
  readonly theirs: string;
  /** From your side: "+10", "−5", "Level", or null when either of you has none. */
  readonly delta: { readonly text: string; readonly standing: Standing } | null;
  /** The whole thing in words, for a screen reader. */
  readonly description: string;
}

/**
 * One of the three lifts on a card: their best, and how yours compares.
 *
 * The number shown is theirs — it is their card — and the small figure beside
 * it is the gap from your side, so "+10" means you lift ten more.
 */
export function liftCell(
  label: string,
  theirsKg: number | null,
  mineKg: number | null,
  unitSystem: UnitSystem,
  who: string,
): LiftCell {
  const theirs = theirsKg === null ? '—' : weightText(theirsKg, unitSystem);
  const comparison = compareLifts(mineKg, theirsKg, unitSystem);
  if (comparison === null) {
    return {
      label,
      theirs,
      delta: null,
      description:
        theirsKg === null
          ? `${label}: ${who} has not logged it`
          : `${label}: ${who} ${theirs}; you have not logged it`,
    };
  }
  const gap = `${String(comparison.gap.value)} ${comparison.gap.unit}`;
  const text =
    comparison.standing === 'level'
      ? 'Level'
      : `${comparison.standing === 'ahead' ? '+' : '−'}${String(comparison.gap.value)}`;
  return {
    label,
    theirs,
    delta: { text, standing: comparison.standing },
    description:
      comparison.standing === 'level'
        ? `${label}: ${who} ${theirs}, level with you`
        : `${label}: ${who} ${theirs}, you are ${gap} ${comparison.standing}`,
  };
}

export interface FriendCardView {
  readonly userId: string;
  readonly name: string;
  /** For the avatar's initial: null shows the glyph rather than "Y". */
  readonly avatarName: string | null;
  readonly sharing: boolean;
  readonly presence: Presence | null;
  readonly dots: readonly WeekDot[] | null;
  readonly streak: string | null;
  readonly lifts: readonly LiftCell[] | null;
  readonly lastWorkout: {
    readonly sessionId: string;
    readonly title: string;
    readonly when: string;
    readonly duration: string | null;
  } | null;
}

export interface CardContext {
  readonly now: Date;
  readonly weekStartsOn: WeekStart;
  readonly unitSystem: UnitSystem;
  /** Your bests on the three lifts, by slug. */
  readonly myBigThree: ReadonlyMap<string, number>;
  readonly movers: Movers;
}

export function friendCard(friend: Friend, context: CardContext): FriendCardView {
  const name = friendName(friend.name);
  const training = friend.training;
  if (training === null) {
    return {
      userId: friend.userId,
      name,
      avatarName: friend.name,
      sharing: false,
      presence: null,
      dots: null,
      streak: null,
      lifts: null,
      lastWorkout: null,
    };
  }

  const last = training.lastWorkout;
  return {
    userId: friend.userId,
    name,
    avatarName: friend.name,
    sharing: true,
    presence: describePresence(training.lastActiveAt, context.now),
    dots: weekDots(training.trainedAt, context.now, context.weekStartsOn),
    streak: describeStreak(
      weeklyStreak(training.trainedAt, training.daysPerWeek, context.now, context.weekStartsOn),
    ),
    lifts: BIG_THREE.map((lift) =>
      liftCell(
        lift.label,
        training.bigThree.get(lift.slug) ?? null,
        context.myBigThree.get(lift.slug) ?? null,
        context.unitSystem,
        name,
      ),
    ),
    lastWorkout:
      last === null
        ? null
        : {
            sessionId: last.id,
            title: summaryTitle(last, context.movers),
            when: describeWorkoutDay(last.startedAt, context.now),
            duration: summaryDuration(last),
          },
  };
}

/**
 * Friends who share first, then by name. A list that moved friends about by
 * who trained last would never be in the same order twice, and finding one
 * person in it is the commonest thing done with it.
 */
export function sortFriends(friends: readonly Friend[]): Friend[] {
  return [...friends].sort(
    (a, b) =>
      Number(b.sharing) - Number(a.sharing) ||
      friendName(a.name).localeCompare(friendName(b.name)) ||
      a.userId.localeCompare(b.userId),
  );
}

/** "Just now", "12 min ago", "3h ago", "Yesterday", "Mon 5 Oct". */
export function sentWhen(at: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${String(minutes)} min ago`;
  if (minutes < 12 * 60) return `${String(Math.floor(minutes / 60))}h ago`;
  return describeWorkoutDay(at, now);
}

export interface RequestView {
  readonly id: string;
  readonly name: string;
  readonly avatarName: string | null;
  readonly when: string;
}

export function requestRow(request: FriendRequest, now: Date): RequestView {
  return {
    id: request.id,
    name: friendName(request.name),
    avatarName: request.name,
    when: sentWhen(request.requestedAt, now),
  };
}

export type Tone = 'success' | 'info' | 'error';

export interface Message {
  readonly tone: Tone;
  readonly text: string;
}

/** What a typed code that is not even shaped like one gets, before anything is sent. */
export function describeCodeProblem(check: FriendCodeCheck): Message | null {
  if (check.ok) return null;
  switch (check.reason) {
    case 'empty':
      return { tone: 'error', text: 'Type your friend’s code first.' };
    case 'length':
      return { tone: 'error', text: 'A friend code is six letters and numbers.' };
    case 'characters':
      return {
        tone: 'error',
        text: 'Friend codes never use 0, O, 1, I or L. Check the code and try again.',
      };
  }
}

/**
 * A friend's heaviest set, as the logger shows it beside your own:
 * "Alex: 5 × 100 kg", "Alex: 12 reps", "Alex: 8 × +20 kg", "Alex: 60 s".
 * A reference, never a prefill (ADR-0105).
 */
export function describeReference(
  who: string,
  reference: { readonly reps: number; readonly weightKg: number; readonly loadType: string },
  unitSystem: UnitSystem,
  isTimeBased: boolean,
): string {
  const reps = String(reference.reps);
  if (isTimeBased) return `${who}: ${reps} s`;
  const weight = weightText(reference.weightKg, unitSystem);
  switch (reference.loadType) {
    case 'bodyweight':
      return `${who}: ${reps} reps`;
    case 'bodyweight_plus':
      return `${who}: ${reps} × +${weight}`;
    case 'assisted':
      return `${who}: ${reps} × ${weight} assisted`;
    default:
      return `${who}: ${reps} × ${weight}`;
  }
}

/** What came of sending a request, in the words shown where the button was. */
export function describeSendResult(result: SendResult): Message {
  const who = result.name;
  switch (result.outcome) {
    case 'sent':
      return { tone: 'success', text: who === null ? 'Request sent.' : `Request sent to ${who}.` };
    case 'now_friends':
      return {
        tone: 'success',
        text: `${who ?? 'They'} had already asked you, so you’re now friends.`,
      };
    case 'own_code':
      return { tone: 'info', text: 'That’s your own code.' };
    case 'unknown':
      return { tone: 'error', text: 'No one has that code. Check it and try again.' };
    case 'invalid':
      return { tone: 'error', text: 'A friend code is six letters and numbers.' };
    case 'already_friends':
      return { tone: 'info', text: `You’re already friends with ${who ?? 'them'}.` };
    case 'already_requested':
      return { tone: 'info', text: `You’ve already sent ${who ?? 'them'} a request.` };
    case 'too_many':
      return { tone: 'error', text: 'That’s a lot of requests in an hour. Try again later.' };
  }
}
