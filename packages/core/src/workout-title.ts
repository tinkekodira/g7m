/**
 * What a workout is called in the history, when nobody named it.
 *
 * A list of eighteen entries all reading "Workout" says nothing a date does
 * not. The lifter scrolling it is asking "when did I last do legs?", so the
 * name is the kind of day the sets add up to — "Leg day (quad focused)",
 * "Pull day (all-round)" — worked out from what was ticked, not from what the
 * workout was meant to be.
 *
 * Primary movers only, the same attribution the generator and the training
 * review use. Counting assistants would call a heavy bench day "Upper body",
 * because the lats and biceps help with everything.
 */

/** One exercise's working sets in a workout, and one primary muscle it trains. */
export interface PrimaryWork {
  readonly exerciseId: string;
  /** The muscle's slug, `latissimus-dorsi`. */
  readonly muscle: string;
  /** Its group's slug, `back`. */
  readonly group: string;
  readonly sets: number;
}

type Region = 'push' | 'pull' | 'legs' | 'core';

const REGION_BY_GROUP: Readonly<Record<string, Region>> = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back: 'pull',
  traps: 'pull',
  biceps: 'pull',
  forearms: 'pull',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
  core: 'core',
};

const ARM_GROUPS = new Set(['biceps', 'triceps', 'forearms']);

/**
 * What a lifter calls the part of a muscle group a day leaned on.
 *
 * Mostly the group. The back is the exception: a pulldown day and a row day
 * are different days to the person who did them, so the lats, the upper back
 * and the lower back are told apart. Likewise the rear delt, which a pull day
 * trains and a push day does not.
 */
const FOCUS_BY_MUSCLE: Readonly<Record<string, string>> = {
  'latissimus-dorsi': 'lat',
  'teres-major': 'lat',
  rhomboids: 'upper back',
  infraspinatus: 'upper back',
  'middle-trapezius': 'upper back',
  'lower-trapezius': 'upper back',
  'erector-spinae': 'lower back',
  'posterior-deltoid': 'rear delt',
  'rectus-abdominis': 'ab',
  'external-obliques': 'oblique',
};

const FOCUS_BY_GROUP: Readonly<Record<string, string>> = {
  chest: 'chest',
  shoulders: 'shoulder',
  triceps: 'triceps',
  biceps: 'biceps',
  forearms: 'forearm',
  traps: 'trap',
  back: 'back',
  quads: 'quad',
  hamstrings: 'hamstring',
  glutes: 'glute',
  calves: 'calf',
  adductors: 'adductor',
  core: 'core',
};

/** A region has to carry this much of the work for the day to be named after it. */
const DOMINANT = 0.7;
/** The leading focus needs this share of the day, and a clear lead over the next. */
const FOCUSED = 0.5;
const LEAD = 1.5;

function regionOf(entry: PrimaryWork): Region | null {
  // A rear delt is shoulder by anatomy and pull by training day.
  if (entry.muscle === 'posterior-deltoid') return 'pull';
  return REGION_BY_GROUP[entry.group] ?? null;
}

function focusOf(entry: PrimaryWork): string {
  return FOCUS_BY_MUSCLE[entry.muscle] ?? FOCUS_BY_GROUP[entry.group] ?? entry.group;
}

interface Share {
  readonly entry: PrimaryWork;
  readonly sets: number;
}

/**
 * Each set split evenly across its exercise's primary movers.
 *
 * A back squat has two primary quad heads and a Romanian deadlift three
 * hamstrings; counting each set once per muscle would make three sets of RDLs
 * outweigh four of squats.
 */
function shares(work: readonly PrimaryWork[]): Share[] {
  const movers = new Map<string, number>();
  for (const entry of work) {
    movers.set(entry.exerciseId, (movers.get(entry.exerciseId) ?? 0) + 1);
  }
  return work
    .filter((entry) => entry.sets > 0 && regionOf(entry) !== null)
    .map((entry) => ({ entry, sets: entry.sets / (movers.get(entry.exerciseId) ?? 1) }));
}

function total(of: readonly Share[]): number {
  return of.reduce((sum, share) => sum + share.sets, 0);
}

/** "(quad focused)" when one thing clearly led, "(all-round)" when nothing did. */
function focusFor(of: readonly Share[], label: (share: Share) => string): string {
  const byFocus = new Map<string, number>();
  for (const share of of) {
    const key = label(share);
    byFocus.set(key, (byFocus.get(key) ?? 0) + share.sets);
  }
  const ranked = [...byFocus.entries()].sort((a, b) => b[1] - a[1]);
  const [lead, next] = ranked;
  const sum = total(of);
  if (lead === undefined || sum === 0) return '(all-round)';
  const clear = lead[1] / sum >= FOCUSED && (next === undefined || lead[1] >= next[1] * LEAD);
  return clear ? `(${lead[0]} focused)` : '(all-round)';
}

/**
 * The name for a workout nobody named.
 *
 * `bouts` is how many cardio bouts it had, so a treadmill-only session is
 * "Cardio" rather than the fallback. A workout whose sets reach no muscle we
 * can place — neck work, or exercises still syncing — is plain "Workout".
 */
export function workoutTitle(work: readonly PrimaryWork[], bouts = 0): string {
  const all = shares(work);
  if (total(all) === 0) return bouts > 0 ? 'Cardio' : 'Workout';

  const region = (name: Region): Share[] => all.filter((share) => regionOf(share.entry) === name);
  const core = region('core');
  if (total(core) / total(all) >= DOMINANT)
    return `Core day ${focusFor(core, (s) => focusOf(s.entry))}`;

  // Three sets of crunches at the end do not turn a leg day into full body.
  const lifted = all.filter((share) => regionOf(share.entry) !== 'core');
  const sum = total(lifted);
  const push = region('push');
  const pull = region('pull');
  const legs = region('legs');
  const arms = lifted.filter((share) => ARM_GROUPS.has(share.entry.group));
  const byMuscle = (share: Share): string => focusOf(share.entry);

  if (total(legs) / sum >= DOMINANT) return `Leg day ${focusFor(legs, byMuscle)}`;
  if (total(arms) / sum >= DOMINANT) return `Arm day ${focusFor(arms, byMuscle)}`;
  if (total(push) / sum >= DOMINANT) return `Push day ${focusFor(push, byMuscle)}`;
  if (total(pull) / sum >= DOMINANT) return `Pull day ${focusFor(pull, byMuscle)}`;

  const upper = [...push, ...pull];
  const byRegion = (share: Share): string => regionOf(share.entry) ?? '';
  if (total(upper) / sum >= DOMINANT) return `Upper body ${focusFor(upper, byRegion)}`;
  return `Full body ${focusFor(lifted, (share) => (byRegion(share) === 'legs' ? 'leg' : 'upper body'))}`;
}
