/**
 * Achievements: what counts, and when it was earned. ADR-0072.
 *
 * ## Worked out, never stored
 *
 * Whether a badge is earned is a question about the training log, and this
 * answers it from the log every time. Nothing records "earned" anywhere. So:
 *
 * - **Past work counts.** Somebody arriving with a year of workouts already
 *   has Centurion, dated the day of the hundredth one.
 * - **A mistake undoes itself.** A 1,000 kg bench typed by accident and
 *   deleted takes the badge with it, instead of leaving it on the shelf.
 * - **It cannot fire twice or miss one**, which an event on a write would
 *   get wrong sooner or later. The same reasoning as `recordsInSession`.
 *
 * What the app does store is which badges have been *celebrated*, on the
 * profile, so the banner shows once per badge on every device.
 *
 * ## The date is the workout's
 *
 * `earnedAt` is when the workout that earned it started: the day somebody
 * would name if asked when they first benched 100 kg. The workout in progress
 * counts for everything that happens inside a workout — a heavy set, a new
 * record, a 2,000 m row — so the banner can arrive while they are still at
 * the bench. Counts of workouts wait for Finish, because a workout is not one
 * until it is finished.
 *
 * ## Numbers in the lifter's own units
 *
 * Plates are 20 kg or 45 lb, and the clubs are named for plates on each side
 * of the bar, so the thresholds are the round numbers of whichever system is
 * in use: 100 kg for two plates in kilograms, 225 lb in pounds. The same goes
 * for total tonnage (tonnes or US tons) and the long distance (km or miles).
 * They are close in difficulty and not identical, and a round number on the
 * badge beats a converted one: nobody chases 102.06 kg.
 */
import {
  CARDIO_KINDS,
  METRES_PER_MILE,
  boutCalories,
  boutClimbM,
  type LoggedBout,
} from './cardio.js';
import { DEFAULT_DAYS_PER_WEEK } from './goals.js';
import { countsTowardVolume, effectiveLoadKg, setVolumeKg } from './load.js';
import { estimateOneRepMax } from './one-rep-max.js';
import type { HistoricalSet } from './progress.js';
import { KG_PER_LB, type UnitSystem } from './units.js';
import { dateKey, daysBetween, startOfDay, startOfWeek, type WeekStart } from './week.js';

export const ACHIEVEMENT_CATEGORIES = [
  'milestones',
  'strength',
  'consistency',
  'cardio',
  'secret',
] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

/** The lifts the strength clubs are about. */
export const CLUB_LIFTS = ['bench', 'squat', 'deadlift', 'overhead', 'pull_up'] as const;
export type ClubLift = (typeof CLUB_LIFTS)[number];

/**
 * Which catalogue exercises each lift is, by slug.
 *
 * The barbell lift only. A 100 kg dumbbell bench is a different and much
 * harder thing, and a machine press is not a bench at all. The squat is the
 * back squat and the deadlift the conventional one: the lifts a total is
 * made of.
 */
export const CLUB_LIFT_SLUGS: Readonly<Record<ClubLift, readonly string[]>> = {
  bench: ['barbell-bench-press'],
  squat: ['barbell-back-squat'],
  deadlift: ['conventional-deadlift'],
  overhead: ['overhead-press'],
  pull_up: ['pull-up', 'chin-up'],
};

/** What a progress bar is counting, so the screen can say it in words. */
export type ProgressUnit =
  | 'workouts'
  | 'records'
  | 'volume'
  | 'weight'
  | 'reps'
  | 'weeks'
  | 'days'
  | 'distance'
  | 'climb'
  | 'kcal'
  | 'machines'
  | 'exercises'
  | 'groups';

export interface AchievementProgress {
  /** Kilograms, metres or a count, by `unit`. Never more than `target`. */
  readonly current: number;
  readonly target: number;
  readonly unit: ProgressUnit;
}

export interface Achievement {
  readonly key: string;
  readonly category: AchievementCategory;
  /** The catchy part. */
  readonly name: string;
  /** One line on what it takes, in the lifter's units. */
  readonly description: string;
  /** Shown as a question mark until earned. Only the birthday is. */
  readonly secret: boolean;
  readonly earnedAt: Date | null;
  /** How close, while not earned. Null when there is nothing to measure. */
  readonly progress: AchievementProgress | null;
  /** For a badge only a date can give: when that date next comes round. */
  readonly nextChance: Date | null;
}

/** A workout, as the achievements see it. */
export interface AchievementSession {
  readonly sessionId: string;
  readonly startedAt: Date;
  /** When the first and last sets were ticked: the clock a time of day is read from. */
  readonly firstSetAt: Date | null;
  readonly lastSetAt: Date | null;
  /** False for the workout in progress. */
  readonly finished: boolean;
  /** False for a workout logged afterwards, whose clock times were never real. */
  readonly clockKnown: boolean;
}

/** A goal decision: the days a week in force from `startedAt` on. */
export interface GoalSpan {
  readonly startedAt: Date;
  readonly daysPerWeek: number;
}

export interface AchievementInput {
  /** Every workout with something ticked, the one in progress included. */
  readonly sessions: readonly AchievementSession[];
  /** Ticked lifting sets, the workout in progress included. */
  readonly sets: readonly HistoricalSet[];
  /** Ticked cardio bouts, the workout in progress included. */
  readonly bouts: readonly LoggedBout[];
  /** Exercise id to the lift it is, for the ones that are one. */
  readonly lifts: ReadonlyMap<string, ClubLift>;
  /** Exercise id to its primary muscle groups, for Lit Up. */
  readonly groups: ReadonlyMap<string, readonly string[]>;
  /** Every goal ever chosen, any order. */
  readonly goals: readonly GoalSpan[];
  /** A date-only value, read with the UTC getters like everywhere else. */
  readonly birthDate: Date | null;
  /** The latest bodyweight, for how far a bodyweight club still is. */
  readonly bodyweightKg: number | null;
  readonly unitSystem: UnitSystem;
  readonly weekStartsOn: WeekStart;
}

/** What one rule decides. */
interface Outcome {
  readonly earnedAt: Date | null;
  readonly progress?: AchievementProgress | null;
  readonly nextChance?: Date | null;
}

interface Definition {
  readonly key: string;
  readonly category: AchievementCategory;
  readonly name: string | ((units: UnitSystem) => string);
  readonly description: string | ((units: UnitSystem) => string);
  readonly evaluate: (facts: Facts) => Outcome;
}

// ---------------------------------------------------------------------------
// The facts every rule reads, worked out once
// ---------------------------------------------------------------------------

interface Facts {
  readonly input: AchievementInput;
  readonly now: Date;
  readonly units: UnitSystem;
  /** Finished workouts, oldest first. */
  readonly finished: readonly AchievementSession[];
  /** Every workout, the one in progress included, oldest first. */
  readonly sessions: readonly AchievementSession[];
  /** Working sets only, oldest first. Warm-ups never count for anything here. */
  readonly sets: readonly HistoricalSet[];
  readonly bouts: readonly LoggedBout[];
}

function factsFrom(input: AchievementInput, now: Date): Facts {
  const byStart = <T extends { readonly startedAt: Date }>(a: T, b: T) =>
    a.startedAt.getTime() - b.startedAt.getTime();
  const sessions = [...input.sessions].sort(byStart);
  return {
    input,
    now,
    units: input.unitSystem,
    sessions,
    finished: sessions.filter((session) => session.finished),
    // Stable sorts: sets of one workout keep the order they were logged in.
    sets: input.sets
      .filter((set) => countsTowardVolume(set))
      .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime()),
    bouts: [...input.bouts].sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime()),
  };
}

// ---------------------------------------------------------------------------
// Small tools the rules share
// ---------------------------------------------------------------------------

/** A threshold met by a running total: when, and how far the total got. */
function crossing(
  steps: readonly { readonly at: Date; readonly value: number }[],
  target: number,
): { earnedAt: Date | null; total: number } {
  let total = 0;
  let earnedAt: Date | null = null;
  for (const step of steps) {
    total += step.value;
    if (earnedAt === null && total >= target - 1e-9) earnedAt = step.at;
  }
  return { earnedAt, total };
}

/** The nth of something, oldest first. `n` counts from one. */
function nth<T>(items: readonly T[], n: number): T | null {
  return items[n - 1] ?? null;
}

function progress(current: number, target: number, unit: ProgressUnit): AchievementProgress {
  return { current: Math.min(Math.max(0, current), target), target, unit };
}

/** An outcome that is only ever progress towards a count. */
function counted(dates: readonly Date[], target: number, unit: ProgressUnit): Outcome {
  return { earnedAt: nth(dates, target), progress: progress(dates.length, target, unit) };
}

/** Kilograms, from a round number in the lifter's own unit. */
function weightIn(units: UnitSystem, kg: number, lb: number): number {
  return units === 'imperial' ? lb * KG_PER_LB : kg;
}

/** `100 kg` or `225 lb`: the number as the badge says it. */
function weightWords(units: UnitSystem, kg: number, lb: number): string {
  return units === 'imperial' ? `${lb.toLocaleString('en-GB')} lb` : `${String(kg)} kg`;
}

/**
 * Stored weights are rounded to hundredths of a kilogram, and 225 lb is
 * 102.0582 kg. Forgiving two hundredths is the difference between a
 * 225 lb bench counting and falling short by a rounding error.
 */
const WEIGHT_TOLERANCE_KG = 0.02;

function reaches(loadKg: number, targetKg: number): boolean {
  return loadKg >= targetKg - WEIGHT_TOLERANCE_KG;
}

function setsOf(facts: Facts, lift: ClubLift): HistoricalSet[] {
  return facts.sets.filter((set) => facts.input.lifts.get(set.exerciseId) === lift);
}

/** A lift's load, when it can be measured and at least one rep was done. */
function liftLoad(set: HistoricalSet): number | null {
  if (!(set.reps >= 1)) return null;
  return effectiveLoadKg(set, set.bodyweightKg);
}

/** The first set of a lift at or over a weight, and the heaviest so far. */
function plateClub(lift: ClubLift, kg: number, lb: number) {
  return (facts: Facts): Outcome => {
    const target = weightIn(facts.units, kg, lb);
    let best = 0;
    let earnedAt: Date | null = null;
    for (const set of setsOf(facts, lift)) {
      const load = liftLoad(set);
      if (load === null) continue;
      best = Math.max(best, load);
      if (earnedAt === null && reaches(load, target)) earnedAt = set.performedAt;
    }
    return { earnedAt, progress: progress(best, target, 'weight') };
  };
}

/**
 * A multiple of bodyweight, against the bodyweight *on the day*.
 *
 * The session's snapshot, as for everything else: a 100 kg bench at 100 kg
 * bodyweight stays a bodyweight bench after the lifter loses ten. A set with
 * no bodyweight recorded cannot be judged and is passed over. Progress is
 * measured against today's weight, since that is the one still to beat.
 */
function bodyweightClub(lift: ClubLift, ratio: number) {
  return (facts: Facts): Outcome => {
    let best = 0;
    let earnedAt: Date | null = null;
    for (const set of setsOf(facts, lift)) {
      const load = liftLoad(set);
      if (load === null) continue;
      best = Math.max(best, load);
      const bodyweight = set.bodyweightKg;
      if (earnedAt === null && bodyweight !== null && bodyweight > 0) {
        if (reaches(load, bodyweight * ratio)) earnedAt = set.performedAt;
      }
    }
    const today = facts.input.bodyweightKg;
    return {
      earnedAt,
      progress: today === null || today <= 0 ? null : progress(best, today * ratio, 'weight'),
    };
  };
}

/** Workouts finished, oldest first, as dates. */
function workoutDates(facts: Facts): Date[] {
  return facts.finished.map((session) => session.startedAt);
}

function workoutCount(target: number) {
  return (facts: Facts): Outcome => counted(workoutDates(facts), target, 'workouts');
}

/**
 * Every set that was a personal record when it was done, as dates.
 *
 * The same rules as the badge on the logger (`recordsInSession`): the first
 * workout on an exercise sets the bar rather than clearing it, a tie is not a
 * record, a load that cannot be measured cannot be beaten, and a set that is
 * both the heaviest and the best is one record, not two.
 */
function recordDates(facts: Facts): Date[] {
  const bests = new Map<
    string,
    { firstSession: string; weight: number | null; oneRepMax: number | null }
  >();
  const dates: Date[] = [];

  for (const set of facts.sets) {
    const load = effectiveLoadKg(set, set.bodyweightKg);
    const known = bests.get(set.exerciseId);
    const own = known ?? { firstSession: set.sessionId, weight: null, oneRepMax: null };
    if (known === undefined) bests.set(set.exerciseId, own);
    if (load === null) continue;

    const estimate = estimateOneRepMax(load, set.reps)?.valueKg ?? null;
    if (set.sessionId !== own.firstSession) {
      const heavier = own.weight !== null && load > own.weight;
      const better = own.oneRepMax !== null && estimate !== null && estimate > own.oneRepMax;
      if (heavier || better) dates.push(set.performedAt);
    }
    if (own.weight === null || load > own.weight) own.weight = load;
    if (estimate !== null && (own.oneRepMax === null || estimate > own.oneRepMax)) {
      own.oneRepMax = estimate;
    }
  }
  return dates;
}

function recordCount(target: number) {
  return (facts: Facts): Outcome => counted(recordDates(facts), target, 'records');
}

/** Tonnes in metric, US tons (2,000 lb) in imperial. */
function tonnage(tonnes: number) {
  return (facts: Facts): Outcome => {
    const target = weightIn(facts.units, tonnes * 1000, tonnes * 2000);
    const { earnedAt, total } = crossing(
      facts.sets.map((set) => ({
        at: set.performedAt,
        value: setVolumeKg(set, set.bodyweightKg) ?? 0,
      })),
      target,
    );
    return { earnedAt, progress: progress(total, target, 'volume') };
  };
}

function tonnageWords(tonnes: number, comparison: string) {
  return (units: UnitSystem): string =>
    `Lift ${tonnes.toLocaleString('en-GB')} ${units === 'imperial' ? 'tons' : 'tonnes'} in total, ${comparison}`;
}

/**
 * Weeks in a row at the goal's days a week.
 *
 * Each week is held to the goal that was in force when it ended, since goals
 * are kept as a history (ADR-0032) and a week trained for a four-day plan
 * should not be marked against a five-day one chosen later. Weeks before the
 * first goal are held to that first goal, and with no goal at all to three
 * days, the app's default.
 *
 * A week counts the moment it reaches its number, so the badge arrives with
 * the workout that earned it rather than on Monday. The week in progress
 * never breaks a streak: it has not finished failing yet.
 */
function weekStreaks(facts: Facts): { streakDates: Date[]; current: number } {
  const { weekStartsOn } = facts.input;
  const goals = [...facts.input.goals].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  const first = facts.finished[0];
  if (first === undefined) return { streakDates: [], current: 0 };

  const target = (weekEnd: Date): number => {
    let days = goals[0]?.daysPerWeek ?? DEFAULT_DAYS_PER_WEEK;
    for (const goal of goals) if (goal.startedAt < weekEnd) days = goal.daysPerWeek;
    return days;
  };

  const byWeek = new Map<string, Date[]>();
  for (const session of facts.finished) {
    const key = dateKey(startOfWeek(session.startedAt, weekStartsOn));
    byWeek.set(key, [...(byWeek.get(key) ?? []), session.startedAt]);
  }

  // Streak lengths as they were reached: `streakDates[n - 1]` is the day the
  // streak first reached n weeks.
  const streakDates: Date[] = [];
  const thisWeek = startOfWeek(facts.now, weekStartsOn);
  let streak = 0;
  for (
    let week = startOfWeek(first.startedAt, weekStartsOn);
    week <= thisWeek;
    week = nextWeek(week)
  ) {
    const workouts = byWeek.get(dateKey(week)) ?? [];
    const needed = target(nextWeek(week));
    const reached = workouts[needed - 1];
    if (reached !== undefined) {
      streak += 1;
      if (streakDates.length < streak) streakDates.push(reached);
    } else if (week.getTime() !== thisWeek.getTime()) {
      streak = 0;
    }
  }
  return { streakDates, current: streak };
}

function nextWeek(week: Date): Date {
  const next = new Date(week);
  next.setDate(next.getDate() + 7);
  return next;
}

function streak(weeks: number) {
  return (facts: Facts): Outcome => {
    const { streakDates, current } = weekStreaks(facts);
    return { earnedAt: nth(streakDates, weeks), progress: progress(current, weeks, 'weeks') };
  };
}

/** Day keys with a workout, oldest first, and the first workout of each day. */
function trainingDays(facts: Facts): Map<string, Date> {
  const days = new Map<string, Date>();
  for (const session of facts.sessions) {
    const key = dateKey(session.startedAt);
    if (!days.has(key)) days.set(key, session.startedAt);
  }
  return days;
}

function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** A workout on a given day of the year, and when it next comes round. */
function onTheDay(month: number, day: number) {
  return (facts: Facts): Outcome => {
    const hit = facts.sessions.find(
      (session) => session.startedAt.getMonth() === month && session.startedAt.getDate() === day,
    );
    return { earnedAt: hit?.startedAt ?? null, nextChance: nextDate(facts.now, month, day) };
  };
}

/** The next time a month and day comes round, today included. 29 February waits for a leap year. */
function nextDate(now: Date, month: number, day: number): Date {
  const today = startOfDay(now);
  for (let year = today.getFullYear(); year < today.getFullYear() + 8; year += 1) {
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() !== month) continue;
    if (candidate >= today) return candidate;
  }
  return new Date(today.getFullYear() + 1, month, day);
}

function hourOf(date: Date): number {
  return date.getHours();
}

/** Metres. The summit's height, as surveyed in 2020. */
const EVEREST_M = 8849;

function longestBout(kind: LoggedBout['kind'], metres: number) {
  return (facts: Facts): Outcome => {
    let best = 0;
    let earnedAt: Date | null = null;
    for (const logged of facts.bouts) {
      if (logged.kind !== kind) continue;
      const distance = logged.bout.distanceM ?? 0;
      best = Math.max(best, distance);
      if (earnedAt === null && distance >= metres) earnedAt = logged.performedAt;
    }
    return { earnedAt, progress: progress(best, metres, 'distance') };
  };
}

function totalDistance(target: (units: UnitSystem) => number) {
  return (facts: Facts): Outcome => {
    const metres = target(facts.units);
    const { earnedAt, total } = crossing(
      facts.bouts.map((logged) => ({ at: logged.performedAt, value: logged.bout.distanceM ?? 0 })),
      metres,
    );
    return { earnedAt, progress: progress(total, metres, 'distance') };
  };
}

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

const DEFINITIONS: readonly Definition[] = [
  // --- Milestones -----------------------------------------------------------
  {
    key: 'day-one',
    category: 'milestones',
    name: 'Day One',
    description: 'Finish your first workout',
    evaluate: workoutCount(1),
  },
  {
    key: 'double-digits',
    category: 'milestones',
    name: 'Double Digits',
    description: 'Finish 10 workouts',
    evaluate: workoutCount(10),
  },
  {
    key: 'quarter-century',
    category: 'milestones',
    name: 'Quarter Century',
    description: 'Finish 25 workouts',
    evaluate: workoutCount(25),
  },
  {
    key: 'fifty-strong',
    category: 'milestones',
    name: 'Fifty Strong',
    description: 'Finish 50 workouts',
    evaluate: workoutCount(50),
  },
  {
    key: 'centurion',
    category: 'milestones',
    name: 'Centurion',
    description: 'Finish 100 workouts',
    evaluate: workoutCount(100),
  },
  {
    key: 'iron-veteran',
    category: 'milestones',
    name: 'Iron Veteran',
    description: 'Finish 250 workouts',
    evaluate: workoutCount(250),
  },
  {
    key: 'lifer',
    category: 'milestones',
    name: 'Lifer',
    description: 'Finish 500 workouts',
    evaluate: workoutCount(500),
  },
  {
    key: 'record-breaker',
    category: 'milestones',
    name: 'Record Breaker',
    description: 'Set your first personal record',
    evaluate: recordCount(1),
  },
  {
    key: 'pr-machine',
    category: 'milestones',
    name: 'PR Machine',
    description: 'Set 25 personal records',
    evaluate: recordCount(25),
  },
  {
    key: 'heavy-mover',
    category: 'milestones',
    name: 'Heavy Mover',
    description: tonnageWords(10, 'about two elephants'),
    evaluate: tonnage(10),
  },
  {
    key: 'whale-of-a-time',
    category: 'milestones',
    name: 'Whale of a Time',
    description: tonnageWords(100, 'about a blue whale'),
    evaluate: tonnage(100),
  },
  {
    key: 'mountain-mover',
    category: 'milestones',
    name: 'Mountain Mover',
    description: tonnageWords(1000, 'more than two jumbo jets'),
    evaluate: tonnage(1000),
  },

  // --- Strength clubs -------------------------------------------------------
  {
    key: 'plate-club',
    category: 'strength',
    name: 'Plate Club',
    description: (units) => `Bench press ${weightWords(units, 60, 135)}`,
    evaluate: plateClub('bench', 60, 135),
  },
  {
    key: 'two-plate-bench',
    category: 'strength',
    name: 'Two-Plate Bench',
    description: (units) => `Bench press ${weightWords(units, 100, 225)}`,
    evaluate: plateClub('bench', 100, 225),
  },
  {
    key: 'three-plate-bench',
    category: 'strength',
    name: 'Three-Plate Bench',
    description: (units) => `Bench press ${weightWords(units, 140, 315)}`,
    evaluate: plateClub('bench', 140, 315),
  },
  {
    key: 'two-plate-squat',
    category: 'strength',
    name: 'Two-Plate Squat',
    description: (units) => `Back squat ${weightWords(units, 100, 225)}`,
    evaluate: plateClub('squat', 100, 225),
  },
  {
    key: 'three-plate-squat',
    category: 'strength',
    name: 'Three-Plate Squat',
    description: (units) => `Back squat ${weightWords(units, 140, 315)}`,
    evaluate: plateClub('squat', 140, 315),
  },
  {
    key: 'four-plate-squat',
    category: 'strength',
    name: 'Four-Plate Squat',
    description: (units) => `Back squat ${weightWords(units, 180, 405)}`,
    evaluate: plateClub('squat', 180, 405),
  },
  {
    key: 'three-plate-pull',
    category: 'strength',
    name: 'Three-Plate Pull',
    description: (units) => `Deadlift ${weightWords(units, 140, 315)}`,
    evaluate: plateClub('deadlift', 140, 315),
  },
  {
    key: 'four-plate-pull',
    category: 'strength',
    name: 'Four-Plate Pull',
    description: (units) => `Deadlift ${weightWords(units, 180, 405)}`,
    evaluate: plateClub('deadlift', 180, 405),
  },
  {
    key: 'five-plate-pull',
    category: 'strength',
    name: 'Five-Plate Pull',
    description: (units) => `Deadlift ${weightWords(units, 220, 495)}`,
    evaluate: plateClub('deadlift', 220, 495),
  },
  {
    key: 'plate-overhead',
    category: 'strength',
    name: 'Plate Overhead',
    description: (units) => `Overhead press ${weightWords(units, 60, 135)}`,
    evaluate: plateClub('overhead', 60, 135),
  },
  {
    key: 'total-club',
    category: 'strength',
    name: (units) => (units === 'imperial' ? 'The 1,000 lb Club' : 'The 500 Club'),
    description: (units) =>
      `Best bench, squat and deadlift add up to ${weightWords(units, 500, 1000)}`,
    evaluate: (facts) => {
      const target = weightIn(facts.units, 500, 1000);
      const best: Partial<Record<ClubLift, number>> = {};
      let total = 0;
      let earnedAt: Date | null = null;
      for (const set of facts.sets) {
        const lift = facts.input.lifts.get(set.exerciseId);
        if (lift !== 'bench' && lift !== 'squat' && lift !== 'deadlift') continue;
        const load = liftLoad(set);
        if (load === null || load <= (best[lift] ?? 0)) continue;
        best[lift] = load;
        total = (best.bench ?? 0) + (best.squat ?? 0) + (best.deadlift ?? 0);
        if (earnedAt === null && reaches(total, target)) earnedAt = set.performedAt;
      }
      return { earnedAt, progress: progress(total, target, 'weight') };
    },
  },
  {
    key: 'bench-your-body',
    category: 'strength',
    name: 'Bench Your Body',
    description: 'Bench press your own bodyweight',
    evaluate: bodyweightClub('bench', 1),
  },
  {
    key: 'squat-and-a-half',
    category: 'strength',
    name: 'Squat and a Half',
    description: 'Back squat 1.5× your bodyweight',
    evaluate: bodyweightClub('squat', 1.5),
  },
  {
    key: 'double-trouble',
    category: 'strength',
    name: 'Double Trouble',
    description: 'Deadlift twice your bodyweight',
    evaluate: bodyweightClub('deadlift', 2),
  },
  {
    key: 'ten-clean',
    category: 'strength',
    name: 'Ten Clean',
    description: '10 pull-ups or chin-ups in one set, unassisted',
    evaluate: (facts) => {
      let best = 0;
      let earnedAt: Date | null = null;
      for (const set of setsOf(facts, 'pull_up')) {
        // A band or a machine taking some of the weight is a different lift.
        if (set.loadType === 'assisted') continue;
        best = Math.max(best, set.reps);
        if (earnedAt === null && set.reps >= 10) earnedAt = set.performedAt;
      }
      return { earnedAt, progress: progress(best, 10, 'reps') };
    },
  },

  // --- Consistency ----------------------------------------------------------
  {
    key: 'gym-rat',
    category: 'consistency',
    name: 'Gym Rat',
    description: 'Finish 5 workouts in one week',
    evaluate: (facts) => {
      const { weekStartsOn } = facts.input;
      const byWeek = new Map<string, Date[]>();
      let earnedAt: Date | null = null;
      for (const session of facts.finished) {
        const key = dateKey(startOfWeek(session.startedAt, weekStartsOn));
        const week = [...(byWeek.get(key) ?? []), session.startedAt];
        byWeek.set(key, week);
        if (earnedAt === null && week.length >= 5) earnedAt = session.startedAt;
      }
      const thisWeek = byWeek.get(dateKey(startOfWeek(facts.now, weekStartsOn)))?.length ?? 0;
      return { earnedAt, progress: progress(thisWeek, 5, 'workouts') };
    },
  },
  {
    key: 'no-days-off',
    category: 'consistency',
    name: 'No Days Off',
    description: 'Train 7 days in a row',
    evaluate: (facts) => {
      const days = trainingDays(facts);
      let earnedAt: Date | null = null;
      let run = 0;
      let previous: Date | null = null;
      for (const at of days.values()) {
        run = previous !== null && daysBetween(previous, at) === 1 ? run + 1 : 1;
        previous = at;
        if (earnedAt === null && run >= 7) earnedAt = at;
      }
      // The run still alive: it ends today, or yesterday with today to come.
      const alive = previous !== null && daysBetween(previous, facts.now) <= 1 ? run : 0;
      return { earnedAt, progress: progress(alive, 7, 'days') };
    },
  },
  {
    key: 'on-a-roll',
    category: 'consistency',
    name: 'On a Roll',
    description: 'Hit your goal’s days for 4 weeks in a row',
    evaluate: streak(4),
  },
  {
    key: 'habit-formed',
    category: 'consistency',
    name: 'Habit Formed',
    description: 'Hit your goal’s days for 12 weeks in a row',
    evaluate: streak(12),
  },
  {
    key: 'half-year-hero',
    category: 'consistency',
    name: 'Half-Year Hero',
    description: 'Hit your goal’s days for 26 weeks in a row',
    evaluate: streak(26),
  },
  {
    key: 'year-rounder',
    category: 'consistency',
    name: 'Year-Rounder',
    description: 'Hit your goal’s days for 52 weeks in a row',
    evaluate: streak(52),
  },
  {
    key: 'comeback-kid',
    category: 'consistency',
    name: 'Comeback Kid',
    description: 'Come back after 30 days or more away',
    evaluate: (facts) => {
      let previous: Date | null = null;
      for (const session of facts.sessions) {
        if (previous !== null && daysBetween(previous, session.startedAt) >= 30) {
          return { earnedAt: session.startedAt };
        }
        previous = session.startedAt;
      }
      return { earnedAt: null };
    },
  },
  {
    key: 'early-bird',
    category: 'consistency',
    name: 'Early Bird',
    description: 'Start training before 6 am',
    evaluate: (facts) => {
      for (const session of facts.sessions) {
        if (!session.clockKnown) continue;
        const at = session.firstSetAt ?? session.startedAt;
        // From four: a set at half past three is a late night, not an early morning.
        if (hourOf(at) >= 4 && hourOf(at) < 6) return { earnedAt: at };
      }
      return { earnedAt: null };
    },
  },
  {
    key: 'night-owl',
    category: 'consistency',
    name: 'Night Owl',
    description: 'Train between midnight and 4 am',
    evaluate: (facts) => {
      for (const session of facts.sessions) {
        if (!session.clockKnown) continue;
        const first = session.firstSetAt ?? session.startedAt;
        const last = session.lastSetAt ?? first;
        const late = hourOf(first) < 4 || hourOf(last) < 4 || dateKey(first) !== dateKey(last);
        if (late) return { earnedAt: last };
      }
      return { earnedAt: null };
    },
  },
  {
    key: 'weekend-warrior',
    category: 'consistency',
    name: 'Weekend Warrior',
    description: 'Train on the Saturday and the Sunday of one weekend',
    evaluate: (facts) => {
      const days = trainingDays(facts);
      for (const at of days.values()) {
        if (at.getDay() !== 6) continue;
        const sunday = days.get(dateKey(addDays(at, 1)));
        if (sunday !== undefined) return { earnedAt: sunday };
      }
      // The coming Saturday: today, if it is one.
      const today = startOfDay(facts.now);
      return { earnedAt: null, nextChance: addDays(today, (6 - today.getDay() + 7) % 7) };
    },
  },
  {
    key: 'new-year-same-me',
    category: 'consistency',
    name: 'New Year, Same Me',
    description: 'Train on 1 January',
    evaluate: onTheDay(0, 1),
  },
  {
    key: 'jingle-lifts',
    category: 'consistency',
    name: 'Jingle Lifts',
    description: 'Train on Christmas Day',
    evaluate: onTheDay(11, 25),
  },
  {
    key: 'leap-lifter',
    category: 'consistency',
    name: 'Leap Lifter',
    description: 'Train on 29 February',
    evaluate: onTheDay(1, 29),
  },

  // --- Cardio and variety ---------------------------------------------------
  {
    key: 'heart-starter',
    category: 'cardio',
    name: 'Heart Starter',
    description: 'Log your first cardio',
    evaluate: (facts) => ({ earnedAt: facts.bouts[0]?.performedAt ?? null }),
  },
  {
    key: 'the-2k',
    category: 'cardio',
    name: 'The 2K',
    description: 'Row 2,000 m in one go',
    evaluate: longestBout('rower', 2000),
  },
  {
    key: 'five-k-finisher',
    category: 'cardio',
    name: '5K Finisher',
    description: 'Run or walk 5 km on the treadmill in one go',
    evaluate: longestBout('treadmill', 5000),
  },
  {
    key: 'marathoner',
    category: 'cardio',
    name: 'Marathoner',
    description: 'Cover 42.2 km of cardio in total, a marathon',
    evaluate: totalDistance(() => 42_195),
  },
  {
    key: 'road-tripper',
    category: 'cardio',
    name: 'Road Tripper',
    description: (units) =>
      `Cover ${units === 'imperial' ? '60 miles' : '100 km'} of cardio in total`,
    evaluate: totalDistance((units) => (units === 'imperial' ? 60 * METRES_PER_MILE : 100_000)),
  },
  {
    key: 'everest',
    category: 'cardio',
    name: 'Everest',
    description: 'Climb 8,849 m on the stairs and the treadmill’s incline',
    evaluate: (facts) => {
      const { earnedAt, total } = crossing(
        facts.bouts.map((logged) => ({
          at: logged.performedAt,
          value: boutClimbM(logged.kind, logged.bout),
        })),
        EVEREST_M,
      );
      return { earnedAt, progress: progress(total, EVEREST_M, 'climb') };
    },
  },
  {
    key: 'furnace',
    category: 'cardio',
    name: 'Furnace',
    description: 'Burn 500 kcal of cardio in one workout',
    evaluate: (facts) => {
      const bySession = new Map<string, number>();
      let best = 0;
      let earnedAt: Date | null = null;
      for (const logged of facts.bouts) {
        const kcal = boutCalories(logged.kind, logged.bout, logged.bodyweightKg)?.kcal ?? 0;
        const total = (bySession.get(logged.sessionId) ?? 0) + kcal;
        bySession.set(logged.sessionId, total);
        best = Math.max(best, total);
        if (earnedAt === null && total >= 500) earnedAt = logged.performedAt;
      }
      return { earnedAt, progress: progress(best, 500, 'kcal') };
    },
  },
  {
    key: 'machine-collector',
    category: 'cardio',
    name: 'Machine Collector',
    description: 'Use all five cardio machines',
    evaluate: (facts) => {
      const used = new Set<string>();
      let earnedAt: Date | null = null;
      for (const logged of facts.bouts) {
        used.add(logged.kind);
        if (earnedAt === null && used.size === CARDIO_KINDS.length) earnedAt = logged.performedAt;
      }
      return { earnedAt, progress: progress(used.size, CARDIO_KINDS.length, 'machines') };
    },
  },
  {
    key: 'hybrid-athlete',
    category: 'cardio',
    name: 'Hybrid Athlete',
    description: 'Lift and do cardio in the same workout',
    evaluate: (facts) => {
      const lifted = new Set(facts.sets.map((set) => set.sessionId));
      const hybrid = facts.bouts.find((logged) => lifted.has(logged.sessionId));
      return { earnedAt: hybrid?.performedAt ?? null };
    },
  },
  {
    key: 'explorer',
    category: 'cardio',
    name: 'Explorer',
    description: 'Log 25 different exercises',
    evaluate: (facts) => {
      const logged = [
        ...facts.sets.map((set) => ({ id: set.exerciseId, at: set.performedAt })),
        ...facts.bouts.map((bout) => ({ id: `cardio:${bout.kind}`, at: bout.performedAt })),
      ].sort((a, b) => a.at.getTime() - b.at.getTime());
      const seen = new Set<string>();
      const firsts: Date[] = [];
      for (const each of logged) {
        if (seen.has(each.id)) continue;
        seen.add(each.id);
        firsts.push(each.at);
      }
      return counted(firsts, 25, 'exercises');
    },
  },
  {
    key: 'lit-up',
    category: 'cardio',
    name: 'Lit Up',
    description: 'Train every muscle group in one week',
    evaluate: (facts) => {
      // Every group some exercise works as a primary muscle — which leaves
      // out the ones nothing in the catalogue can train on its own.
      const all = new Set([...facts.input.groups.values()].flat());
      if (all.size === 0) return { earnedAt: null };
      const { weekStartsOn } = facts.input;
      const byWeek = new Map<string, Set<string>>();
      let earnedAt: Date | null = null;
      for (const set of facts.sets) {
        const key = dateKey(startOfWeek(set.performedAt, weekStartsOn));
        const trained = byWeek.get(key) ?? new Set<string>();
        for (const group of facts.input.groups.get(set.exerciseId) ?? []) trained.add(group);
        byWeek.set(key, trained);
        if (earnedAt === null && trained.size >= all.size) earnedAt = set.performedAt;
      }
      const thisWeek = byWeek.get(dateKey(startOfWeek(facts.now, weekStartsOn)))?.size ?? 0;
      return { earnedAt, progress: progress(thisWeek, all.size, 'groups') };
    },
  },

  // --- The one secret -------------------------------------------------------
  {
    key: 'birthday-pump',
    category: 'secret',
    name: 'Birthday Pump',
    description: 'Train on your birthday',
    evaluate: (facts) => {
      const birth = facts.input.birthDate;
      if (birth === null || Number.isNaN(birth.getTime())) return { earnedAt: null };
      const month = birth.getUTCMonth();
      const day = birth.getUTCDate();
      const hit = facts.sessions.find((session) => {
        const at = session.startedAt;
        if (at.getMonth() !== month) return false;
        // Born on 29 February: the 28th, in the three years out of four
        // that have no 29th.
        const leapless =
          month === 1 && day === 29 && new Date(at.getFullYear(), 1, 29).getMonth() !== 1;
        return at.getDate() === (leapless ? 28 : day);
      });
      return { earnedAt: hit?.startedAt ?? null };
    },
  },
];

/** Every key, in the catalogue's order. */
export const ACHIEVEMENT_KEYS: readonly string[] = DEFINITIONS.map((each) => each.key);

/**
 * Every achievement, earned or not, in the catalogue's order.
 *
 * Earned ones carry no progress and no next chance: the bar is full and the
 * date has been. Unearned ones carry whichever of the two they can.
 */
export function achievements(input: AchievementInput, now: Date): Achievement[] {
  const facts = factsFrom(input, now);
  return DEFINITIONS.map((definition) => {
    const outcome = definition.evaluate(facts);
    const earned = outcome.earnedAt !== null;
    return {
      key: definition.key,
      category: definition.category,
      name:
        typeof definition.name === 'string' ? definition.name : definition.name(input.unitSystem),
      description:
        typeof definition.description === 'string'
          ? definition.description
          : definition.description(input.unitSystem),
      secret: definition.category === 'secret',
      earnedAt: outcome.earnedAt,
      progress: earned ? null : (outcome.progress ?? null),
      nextChance: earned ? null : (outcome.nextChance ?? null),
    };
  });
}
