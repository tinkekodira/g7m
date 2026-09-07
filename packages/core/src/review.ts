/**
 * How the training is actually going.
 *
 * The last piece of ADR-0032, and the one the brief asked for in the plainest
 * terms: *if the user thinks he knows what he's doing, let him build his own
 * workouts, but give him a heads-up after a couple of sessions on how he's
 * doing based on our logic.*
 *
 * So this is a **read over the log**, not a mode. It does not care whether a
 * session came from the generator or was typed in by somebody following their
 * own program — it reads what was done and measures it against the goal that
 * was chosen. That is what makes it work for the lifter who ignores the plan,
 * which is the whole point of building it.
 *
 * ## What it is allowed to say
 *
 * ADR-0035 refused any verdict on a body, and ADR-0036 refused any judgement on
 * the direction of a weight trend *until a goal existed to judge it against*.
 * A goal exists now, so the second of those unlocks: "you are losing 0.9 kg a
 * week and you asked to lose fat" is a comparison against something the user
 * chose, not an opinion about them. The first does not unlock, ever.
 *
 * Nothing here reads a height, computes a BMI, or comments on how much somebody
 * weighs. It compares what happened against what was asked for.
 *
 * ## Why it is ranked rather than exhaustive
 *
 * Eight true observations is a report nobody reads. `observations` comes back
 * ordered by how much it matters, so a screen can show two and be showing the
 * two that count.
 */
import { daysBetween } from './week.js';
import { paceTarget, type ExperienceLevel, type TrainingGoal } from './goals.js';
import { prescriptionFor } from './programming.js';
import { exerciseTrend, type HistoricalSet } from './progress.js';
import { weightTrend, type Sex, type WeighIn } from './body.js';
import { countsTowardVolume } from './load.js';

/**
 * Sessions before there is anything worth saying.
 *
 * "A couple of workouts" from the brief, read as four — two is one good day and
 * one bad one, and an app that draws conclusions from that will tell somebody
 * their squat has stalled because they trained tired once.
 */
export const MIN_SESSIONS = 4;

/** And enough time for a weekly rate to mean anything. */
export const MIN_DAYS = 12;

/** How far back a review looks, when the goal is older than that. */
export const REVIEW_WEEKS = 6;

/** Below this share of its weekly target, a muscle group is being neglected. */
const SHORT_OF_TARGET = 0.55;

/** Above this, it is getting more than it can use. */
const OVER_TARGET = 1.6;

/** Sessions on one lift before "no heavier than the first" means anything. */
const SESSIONS_BEFORE_STALLED = 3;

/** And days, so three sessions in one week is not a plateau. */
const DAYS_BEFORE_STALLED = 20;

/** Weekly change below this is noise, not a direction. */
const MEANINGFUL_KG = 0.1;

export type Observation =
  /** Not enough logged yet to say anything honest. */
  | { readonly kind: 'too_soon'; readonly sessions: number; readonly needed: number }
  | {
      readonly kind: 'consistency';
      readonly perWeek: number;
      readonly target: number;
      readonly weeks: number;
    }
  | {
      readonly kind: 'group_short';
      readonly group: string;
      readonly perWeek: number;
      readonly target: number;
    }
  | {
      readonly kind: 'group_over';
      readonly group: string;
      readonly perWeek: number;
      readonly target: number;
    }
  | {
      readonly kind: 'lift_climbing';
      readonly exerciseId: string;
      readonly name: string;
      readonly fromKg: number;
      readonly toKg: number;
      readonly sessions: number;
    }
  | {
      readonly kind: 'lift_stalled';
      readonly exerciseId: string;
      readonly name: string;
      readonly kg: number;
      readonly sessions: number;
    }
  | {
      readonly kind: 'pace';
      readonly verdict: 'on_track' | 'slow' | 'fast' | 'wrong_way';
      readonly perWeekKg: number;
      readonly goal: TrainingGoal;
    };

export type ObservationKind = Observation['kind'];
export type Tone = 'good' | 'neutral' | 'warning';

export interface Review {
  readonly sessions: number;
  readonly spanDays: number;
  /** Most important first. A screen with room for two shows the first two. */
  readonly observations: readonly Observation[];
}

export interface ReviewInput {
  readonly goal: TrainingGoal;
  readonly daysPerWeek: number;
  readonly experienceLevel: ExperienceLevel | null;
  readonly sex: Sex | null;
  /** Completed sets from finished sessions, whatever wrote them. */
  readonly sets: readonly HistoricalSet[];
  /** Primary muscle groups per exercise. From the catalogue. */
  readonly groupsByExercise: ReadonlyMap<string, readonly string[]>;
  readonly exerciseNames: ReadonlyMap<string, string>;
  readonly weighIns: readonly WeighIn[];
  readonly now: Date;
}

/**
 * Read the log and say what is worth saying.
 *
 * Returns `too_soon` rather than an empty list when there is not enough to go
 * on, because "nothing to report" and "I have not looked yet" are different
 * things and a screen should be able to say which.
 */
export function reviewTraining(input: ReviewInput): Review {
  const counted = input.sets.filter((set) => countsTowardVolume(set));
  const sessionIds = new Set(counted.map((set) => set.sessionId));
  const sessions = sessionIds.size;

  const earliest = counted.reduce<Date | null>(
    (first, set) => (first === null || set.performedAt < first ? set.performedAt : first),
    null,
  );
  const spanDays = earliest === null ? 0 : daysBetween(earliest, input.now);

  if (sessions < MIN_SESSIONS || spanDays < MIN_DAYS) {
    return {
      sessions,
      spanDays,
      observations: [{ kind: 'too_soon', sessions, needed: MIN_SESSIONS }],
    };
  }

  // Never less than one, or a fortnight of training divides into a rate that
  // says somebody trained eleven times a week.
  const weeks = Math.max(1, spanDays / 7);
  const prescription = prescriptionFor(input.goal, input.experienceLevel);

  const found: Observation[] = [
    ...consistency(sessions, weeks, input.daysPerWeek),
    ...groupBalance(counted, input.groupsByExercise, weeks, prescription.weeklySetsPerGroup),
    ...lifts(counted, input.exerciseNames),
    ...pace(input),
  ];

  return { sessions, spanDays, observations: rank(found) };
}

/** Are they training as often as they said they could? */
function consistency(sessions: number, weeks: number, target: number): Observation[] {
  const perWeek = sessions / weeks;
  // A margin, because somebody on four days a week who manages three and a half
  // is doing fine and does not need telling otherwise.
  if (perWeek >= target - 0.75) return [];
  return [{ kind: 'consistency', perWeek: round1(perWeek), target, weeks: Math.round(weeks) }];
}

/**
 * Which muscle group is furthest from its weekly target, in each direction.
 *
 * One of each at most. Six true observations about six muscle groups is a
 * spreadsheet, and the one that is furthest behind is the one worth acting on.
 *
 * A set counts once per *primary* group of its exercise — the same attribution
 * the generator prescribes against, so the review and the plan are measuring
 * the same thing. The heat map on the progress screen splits by recruitment
 * weight instead, which is the right answer to a different question.
 */
function groupBalance(
  sets: readonly HistoricalSet[],
  groupsByExercise: ReadonlyMap<string, readonly string[]>,
  weeks: number,
  target: number,
): Observation[] {
  const perGroup = new Map<string, number>();
  for (const group of TRACKED_GROUPS) perGroup.set(group, 0);

  for (const set of sets) {
    for (const group of groupsByExercise.get(set.exerciseId) ?? []) {
      // Only groups a plan would ever prescribe. Nobody needs telling their
      // neck is undertrained.
      if (perGroup.has(group)) perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
    }
  }

  // Nothing to compare against if the catalogue never told us what anything
  // trains — better silent than confidently wrong about every group at once.
  if ([...perGroup.values()].every((count) => count === 0)) return [];

  const rates = [...perGroup].map(([group, count]) => ({ group, perWeek: count / weeks }));
  const worst = rates.reduce((low, entry) => (entry.perWeek < low.perWeek ? entry : low));
  const most = rates.reduce((high, entry) => (entry.perWeek > high.perWeek ? entry : high));

  const observations: Observation[] = [];
  if (worst.perWeek < target * SHORT_OF_TARGET) {
    observations.push({
      kind: 'group_short',
      group: worst.group,
      perWeek: round1(worst.perWeek),
      target,
    });
  }
  if (most.perWeek > target * OVER_TARGET) {
    observations.push({
      kind: 'group_over',
      group: most.group,
      perWeek: round1(most.perWeek),
      target,
    });
  }
  return observations;
}

/**
 * The lift that has moved most, and the one that has not moved at all.
 *
 * Both, when both exist. A review that only ever reports problems is one people
 * stop opening, and "your bench has gone from 80 to 90" is not a consolation
 * prize — it is the thing they are actually doing this for.
 */
function lifts(sets: readonly HistoricalSet[], names: ReadonlyMap<string, string>): Observation[] {
  const byExercise = new Map<string, HistoricalSet[]>();
  for (const set of sets) {
    byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);
  }

  const found: Observation[] = [];
  let climber: Observation | undefined;
  let climbed = 0;
  let staller: Observation | undefined;
  let stalledFor = 0;

  for (const [exerciseId, own] of byExercise) {
    const trend = exerciseTrend(own);
    const first = trend[0];
    const last = trend[trend.length - 1];
    if (first === undefined || last === undefined || trend.length < SESSIONS_BEFORE_STALLED) {
      continue;
    }

    const days = daysBetween(first.performedAt, last.performedAt);
    const gain = last.topSetKg - first.topSetKg;
    const name = names.get(exerciseId) ?? 'that lift';

    if (gain > 0 && gain > climbed) {
      climbed = gain;
      climber = {
        kind: 'lift_climbing',
        exerciseId,
        name,
        fromKg: first.topSetKg,
        toKg: last.topSetKg,
        sessions: trend.length,
      };
    }

    // Not heavier than the first session, over enough sessions and enough time
    // that it is a plateau rather than a fortnight.
    if (gain <= 0 && days >= DAYS_BEFORE_STALLED && days > stalledFor) {
      stalledFor = days;
      staller = {
        kind: 'lift_stalled',
        exerciseId,
        name,
        kg: last.topSetKg,
        sessions: trend.length,
      };
    }
  }

  if (climber !== undefined) found.push(climber);
  if (staller !== undefined) found.push(staller);
  return found;
}

/**
 * The scale against the goal that was chosen.
 *
 * This is the judgement ADR-0036 deferred. It is allowed now for one reason
 * only: there is a goal to measure against, so it is a comparison with
 * something the user asked for rather than an opinion about their body.
 *
 * Silent when the goal makes no promise about the scale — getting stronger is
 * the case, and weighing that goal by bodyweight would be judging the wrong
 * thing. Silent too when `weightTrend` refuses a rate, which it does below a
 * fortnight, and when there are no weigh-ins at all.
 */
function pace(input: ReviewInput): Observation[] {
  const trend = weightTrend(input.weighIns);
  // Pulled out so the guard is an optional chain rather than two conditions
  // that read like one — and so `rate` is a number below without a cast.
  const rate = trend?.perWeekKg ?? null;
  if (trend === null || rate === null) return [];

  const target = paceTarget(input.goal, input.sex, trend.latestKg);
  if (target === null) return [];
  const wants = (target.low + target.high) / 2;

  const verdict = ((): 'on_track' | 'slow' | 'fast' | 'wrong_way' => {
    if (rate >= target.low && rate <= target.high) return 'on_track';
    // Going the opposite way to the goal, by enough to be more than water.
    if (Math.abs(wants) > MEANINGFUL_KG && Math.sign(rate) !== Math.sign(wants)) {
      return Math.abs(rate) >= MEANINGFUL_KG ? 'wrong_way' : 'slow';
    }
    // Same direction, wrong magnitude. Past the far end is fast; short of the
    // near end is slow. For a goal that straddles zero there is no near end,
    // so any drift is "faster than a recomp usually looks".
    return Math.abs(rate) > Math.abs(wants) ? 'fast' : 'slow';
  })();

  return [{ kind: 'pace', verdict, perWeekKg: round2(rate), goal: input.goal }];
}

/**
 * The muscle groups a plan would ever prescribe for.
 *
 * The union of `FOCUS_GROUPS`, written out rather than derived, because this
 * list answers a different question — "what is worth reporting on" — and
 * quietly gaining an entry because a split changed is not what anybody meant.
 */
const TRACKED_GROUPS: readonly string[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
];

/** How much each kind of observation matters, highest first. */
const PRIORITY: Record<ObservationKind, number> = {
  too_soon: 100,
  // Going the opposite way to your own stated goal outranks everything, since
  // every other number is measured against a goal that is not happening.
  pace: 80,
  // Then showing up. If somebody is not training, nothing below this matters.
  consistency: 70,
  group_short: 60,
  lift_stalled: 50,
  group_over: 30,
  lift_climbing: 20,
};

export function toneOf(observation: Observation): Tone {
  switch (observation.kind) {
    case 'lift_climbing':
      return 'good';
    case 'pace':
      return observation.verdict === 'on_track' ? 'good' : 'warning';
    case 'group_over':
    case 'too_soon':
      return 'neutral';
    case 'consistency':
    case 'group_short':
    case 'lift_stalled':
      return 'warning';
  }
}

/**
 * Order by what matters, then make sure some good news survives.
 *
 * The second half is a deliberate thumb on the scale. A review that is three
 * warnings every time is one somebody stops opening after a fortnight, and
 * they stop opening it precisely when the training is hard — which is when it
 * had something worth saying. So if there is any good news at all, it is
 * promoted into the top three rather than being ranked off the end.
 */
function rank(observations: readonly Observation[]): Observation[] {
  const sorted = [...observations].sort(
    (a, b) => scoreOf(b) - scoreOf(a) || PRIORITY[b.kind] - PRIORITY[a.kind],
  );

  const good = sorted.find((entry) => toneOf(entry) === 'good');
  if (good === undefined) return sorted;

  const top = sorted.slice(0, 3);
  if (top.includes(good)) return sorted;

  return [
    ...top.slice(0, 2),
    good,
    ...sorted.filter((entry) => !top.includes(entry) && entry !== good),
  ];
}

/** Priority, nudged by how far off the thing actually is. */
function scoreOf(observation: Observation): number {
  const base = PRIORITY[observation.kind];
  switch (observation.kind) {
    case 'pace':
      // An on-track pace is good news, not a headline.
      return observation.verdict === 'on_track'
        ? 25
        : observation.verdict === 'wrong_way'
          ? 90
          : base;
    case 'group_short':
      // Furthest behind matters most; nothing at all matters more than half.
      return base + (1 - observation.perWeek / Math.max(observation.target, 1)) * 10;
    default:
      return base;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
