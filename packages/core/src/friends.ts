/**
 * Friends: the rules behind the Friends tab, with no network and no screen.
 *
 * The server hands over a friend's raw facts — the moments they started a
 * finished workout, their best weight per exercise, when the app was last open
 * — and everything that turns those into words, dots and a streak happens here,
 * on the viewer's phone. That split is deliberate (ADR-0105): "which day was
 * that workout" depends on the viewer's timezone and week start, which the
 * server does not know, and the rules are the part worth testing.
 */
import { countsTowardVolume, type LoadType, type SetType } from './load.js';
import { daysBetween, startOfDay, startOfWeek, weekKey, dateKey, type WeekStart } from './week.js';
import { toDisplayWeight, type DisplayWeight, type UnitSystem } from './units.js';

// ---------------------------------------------------------------------------
// Friend codes
// ---------------------------------------------------------------------------

/**
 * The 31 characters a code is drawn from: digits and capitals without 0, O, 1,
 * I and L. Those five are the ones misread off a screen or misheard across a
 * gym floor, and leaving them out means there is no wrong way to read a code.
 * The migration's check constraint holds the same list.
 */
export const FRIEND_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const FRIEND_CODE_LENGTH = 6;

/** What somebody typed, the way the server will look it up: no case, no spaces, no dashes. */
export function normaliseFriendCode(input: string): string {
  return input.replace(/[\s-]+/g, '').toUpperCase();
}

export type FriendCodeCheck =
  | { readonly ok: true; readonly code: string }
  | { readonly ok: false; readonly reason: 'empty' | 'length' | 'characters' };

/**
 * Whether a typed code could be one, before anything is sent.
 *
 * Only the shape: whether anybody holds it is the server's question. Checked
 * here so a typo is caught where it was made rather than as "no one has that
 * code", which would send somebody looking for a person who does not exist.
 */
export function checkFriendCode(input: string): FriendCodeCheck {
  const code = normaliseFriendCode(input);
  if (code === '') return { ok: false, reason: 'empty' };
  if (code.length !== FRIEND_CODE_LENGTH) return { ok: false, reason: 'length' };
  for (const character of code) {
    if (!FRIEND_CODE_ALPHABET.includes(character)) return { ok: false, reason: 'characters' };
  }
  return { ok: true, code };
}

// ---------------------------------------------------------------------------
// The week's dots
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface WeekDot {
  readonly date: Date;
  /** `M`, `T`, … — the label under the dot. */
  readonly initial: string;
  /** `Tuesday`, for the label a screen reader reads instead of the colour. */
  readonly dayName: string;
  readonly trained: boolean;
  readonly isToday: boolean;
  readonly isFuture: boolean;
}

/**
 * This week, one dot a day, in the viewer's own week order.
 *
 * A day is trained when a finished workout *started* on it, in the viewer's
 * local time — the same rule the calendar uses, so a session at 23:50 belongs
 * to the day it began.
 */
export function weekDots(
  trainedAt: readonly Date[],
  now: Date,
  weekStartsOn: WeekStart,
): readonly WeekDot[] {
  const trainedDays = new Set(trainedAt.map((at) => dateKey(at)));
  const today = dateKey(now);
  const first = startOfWeek(now, weekStartsOn);

  const dots: WeekDot[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() + offset);
    const key = dateKey(date);
    const name = DAY_NAMES[date.getDay()] ?? '';
    dots.push({
      date,
      initial: name.charAt(0),
      dayName: name,
      trained: trainedDays.has(key),
      isToday: key === today,
      isFuture: date.getTime() > startOfDay(now).getTime(),
    });
  }
  return dots;
}

/** "Tuesday: trained", so the dot is not colour alone. */
export function describeDot(dot: WeekDot): string {
  return `${dot.dayName}: ${dot.trained ? 'trained' : 'no workout'}`;
}

// ---------------------------------------------------------------------------
// The streak
// ---------------------------------------------------------------------------

/**
 * The goal assumed for somebody who never set one: one workout a week.
 *
 * Low on purpose. A streak is encouragement, and the alternative — no streak
 * at all until a goal is chosen — would hide the one number on the card that
 * rewards simply turning up. ADR-0105.
 */
export const DEFAULT_STREAK_DAYS_PER_WEEK = 1;

/**
 * How many weeks running somebody has hit their own weekly goal.
 *
 * A week counts when the number of different days trained in it reaches the
 * goal's days per week. The week in progress counts the moment it is hit and
 * never breaks the streak before then: on a Monday morning nobody has failed
 * this week yet, and a streak that read zero every Monday would be a lie told
 * once a week.
 *
 * The goal is the current one, applied to every week. A goal raised from three
 * days to five does not retroactively break three months of threes into
 * failures — but nor is the app keeping a goal history for a number on a card.
 */
export function weeklyStreak(
  trainedAt: readonly Date[],
  daysPerWeek: number | null,
  now: Date,
  weekStartsOn: WeekStart,
): number {
  const goal = Math.min(7, Math.max(1, Math.round(daysPerWeek ?? DEFAULT_STREAK_DAYS_PER_WEEK)));

  const daysByWeek = new Map<string, Set<string>>();
  for (const at of trainedAt) {
    if (at.getTime() > now.getTime()) continue;
    const week = weekKey(at, weekStartsOn);
    const days = daysByWeek.get(week) ?? new Set<string>();
    days.add(dateKey(at));
    daysByWeek.set(week, days);
  }
  const met = (week: Date): boolean =>
    (daysByWeek.get(weekKey(week, weekStartsOn))?.size ?? 0) >= goal;

  const cursor = startOfWeek(now, weekStartsOn);
  let streak = 0;
  if (met(cursor)) streak += 1;

  // Whole weeks back from last week, stopping at the first one missed.
  for (;;) {
    cursor.setDate(cursor.getDate() - 7);
    if (!met(cursor)) break;
    streak += 1;
  }
  return streak;
}

/** "4 weeks", "1 week". Null for no streak, which the card simply leaves out. */
export function describeStreak(weeks: number): string | null {
  if (weeks <= 0) return null;
  return weeks === 1 ? '1 week' : `${String(weeks)} weeks`;
}

// ---------------------------------------------------------------------------
// Best lifts
// ---------------------------------------------------------------------------

/** The three lifts every friend card compares, by catalogue slug. */
export const BIG_THREE = [
  { slug: 'barbell-back-squat', label: 'Squat' },
  { slug: 'barbell-bench-press', label: 'Bench' },
  { slug: 'conventional-deadlift', label: 'Deadlift' },
] as const;

/** The lift head-to-head opens on, when both people have done it. */
export const HEAD_TO_HEAD_DEFAULT_SLUG = 'barbell-bench-press';

export interface BestLiftSet {
  readonly exerciseId: string;
  readonly setType: SetType;
  readonly loadType: LoadType;
  readonly weightKg: number;
  readonly isCompleted: boolean;
  /** When the workout started. */
  readonly performedAt: Date;
}

export interface BestLift {
  readonly bestKg: number;
  /** The last workout the exercise was lifted in, for "most recent" ordering. */
  readonly lastAt: Date;
}

/**
 * The heaviest weight on a completed working set, per exercise.
 *
 * External load only, and only a load above zero. On a pull-up the number in
 * the weight field is added or assisted load on top of a bodyweight this
 * feature never shows a friend — and "heaviest" on an assisted set is the
 * wrong way round. Warm-ups never count, here or anywhere.
 *
 * `best_lifts()` in the friends migration is this rule in SQL, for a friend's
 * history the phone does not hold; a schema test runs both over the same rows.
 */
export function bestLiftsByExercise(sets: readonly BestLiftSet[]): Map<string, BestLift> {
  const bests = new Map<string, BestLift>();
  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    if (set.loadType !== 'external') continue;
    if (!Number.isFinite(set.weightKg) || set.weightKg <= 0) continue;

    const known = bests.get(set.exerciseId);
    bests.set(set.exerciseId, {
      bestKg: Math.max(known?.bestKg ?? 0, set.weightKg),
      lastAt:
        known === undefined || set.performedAt.getTime() > known.lastAt.getTime()
          ? set.performedAt
          : known.lastAt,
    });
  }
  return bests;
}

// ---------------------------------------------------------------------------
// Head to head
// ---------------------------------------------------------------------------

export type Standing = 'ahead' | 'behind' | 'level';

export interface LiftComparison {
  readonly mine: DisplayWeight;
  readonly theirs: DisplayWeight;
  /** From the viewer's side: ahead means the viewer lifts more. */
  readonly standing: Standing;
  /** The gap, always positive, in the viewer's unit. Zero when level. */
  readonly gap: DisplayWeight;
}

/**
 * Two bests, from the viewer's side.
 *
 * Compared as they are shown, after rounding to the viewer's unit: two lifts
 * that both read "100 kg" are level, whatever a float says about the second
 * decimal of a weight that travelled through SQLite as a REAL.
 *
 * Null when either side has no number, which the screen shows as a dash.
 */
export function compareLifts(
  mineKg: number | null,
  theirsKg: number | null,
  unitSystem: UnitSystem,
): LiftComparison | null {
  if (mineKg === null || theirsKg === null) return null;
  const mine = toDisplayWeight(mineKg, unitSystem);
  const theirs = toDisplayWeight(theirsKg, unitSystem);
  const difference = Math.round((mine.value - theirs.value) * 100) / 100;
  return {
    mine,
    theirs,
    standing: difference > 0 ? 'ahead' : difference < 0 ? 'behind' : 'level',
    gap: { value: Math.abs(difference), unit: mine.unit },
  };
}

export interface SharedLift {
  readonly exerciseId: string;
  readonly mineKg: number;
  readonly theirsKg: number;
  readonly lastAt: Date;
}

/**
 * The exercises both people have lifted, most recently trained first, and the
 * one head-to-head should open on: the bench press when both have it, the most
 * recent shared lift otherwise, nothing when there is none.
 */
export function sharedLifts(
  mine: ReadonlyMap<string, BestLift>,
  theirs: ReadonlyMap<string, BestLift>,
  preferredExerciseId: string | null,
): { readonly lifts: readonly SharedLift[]; readonly defaultId: string | null } {
  const lifts: SharedLift[] = [];
  for (const [exerciseId, their] of theirs) {
    const my = mine.get(exerciseId);
    if (my === undefined) continue;
    lifts.push({
      exerciseId,
      mineKg: my.bestKg,
      theirsKg: their.bestKg,
      lastAt: my.lastAt.getTime() > their.lastAt.getTime() ? my.lastAt : their.lastAt,
    });
  }
  lifts.sort(
    (a, b) => b.lastAt.getTime() - a.lastAt.getTime() || a.exerciseId.localeCompare(b.exerciseId),
  );

  const preferred = lifts.find((lift) => lift.exerciseId === preferredExerciseId);
  return { lifts, defaultId: preferred?.exerciseId ?? lifts[0]?.exerciseId ?? null };
}

// ---------------------------------------------------------------------------
// Presence and dates
// ---------------------------------------------------------------------------

/** Active within this long reads as "Online now". */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export interface Presence {
  readonly online: boolean;
  readonly label: string;
}

/**
 * "Online now", "Last seen 12 min ago", "Last seen 2h ago", "Last seen
 * yesterday", "Last seen 3 days ago", or a date.
 *
 * Hours before days while it is still under twelve hours, so somebody seen at
 * 23:30 is "Last seen 1h ago" at half past midnight rather than "yesterday".
 */
export function describePresence(lastActiveAt: Date | null, now: Date): Presence {
  if (lastActiveAt === null) return { online: false, label: 'Not seen yet' };

  const elapsed = now.getTime() - lastActiveAt.getTime();
  if (elapsed < ONLINE_WINDOW_MS) return { online: true, label: 'Online now' };

  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return { online: false, label: `Last seen ${String(minutes)} min ago` };

  const hours = Math.floor(minutes / 60);
  const days = daysBetween(lastActiveAt, now);
  if (hours < 12 || days === 0) return { online: false, label: `Last seen ${String(hours)}h ago` };
  if (days === 1) return { online: false, label: 'Last seen yesterday' };
  if (days < 7) return { online: false, label: `Last seen ${String(days)} days ago` };
  return { online: false, label: `Last seen ${shortDate(lastActiveAt, now)}` };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "Mon 6 Oct", with the year only when it is not this one. */
function shortDate(date: Date, now: Date): string {
  const base = `${WEEKDAYS[date.getDay()] ?? ''} ${String(date.getDate())} ${MONTHS[date.getMonth()] ?? ''}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${String(date.getFullYear())}`;
}

/** When a workout was: "Today", "Yesterday", or "Mon 6 Oct". */
export function describeWorkoutDay(date: Date, now: Date): string {
  const days = daysBetween(date, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return shortDate(date, now);
}

// ---------------------------------------------------------------------------
// Doing a friend's workout
// ---------------------------------------------------------------------------

export interface FriendSet {
  readonly setType: SetType;
  readonly loadType: LoadType;
  readonly weightKg: number;
  readonly reps: number;
  readonly isCompleted: boolean;
}

export interface FriendExercise {
  readonly exerciseId: string;
  readonly sets: readonly FriendSet[];
}

export interface CopiedExercise {
  readonly exerciseId: string;
  /** How many working sets to write. Never fewer than one. */
  readonly workingSets: number;
  /**
   * Their heaviest completed working set, shown beside the exercise as
   * "Alex: 5 × 100 kg". Never prefilled — the weights are the viewer's own,
   * from their history, exactly as a routine's are (ADR-0079).
   */
  readonly reference: FriendSet | null;
}

/**
 * A friend's workout as something to do: their exercises, in their order,
 * with their number of working sets, and the one set worth showing as a
 * reference.
 *
 * Working sets are the completed ones that were not warm-ups. A finished
 * workout can hold sets that were planned and never done, and copying those
 * would hand the viewer more work than their friend did.
 */
export function workoutToCopy(exercises: readonly FriendExercise[]): readonly CopiedExercise[] {
  return exercises.map((exercise) => {
    const done = exercise.sets.filter((set) => countsTowardVolume(set));
    const planned = exercise.sets.filter((set) => set.setType !== 'warmup');
    const reference = done.reduce<FriendSet | null>(
      (top, set) =>
        top === null ||
        set.weightKg > top.weightKg ||
        (set.weightKg === top.weightKg && set.reps > top.reps)
          ? set
          : top,
      null,
    );
    return {
      exerciseId: exercise.exerciseId,
      workingSets: Math.max(1, done.length > 0 ? done.length : planned.length),
      reference,
    };
  });
}
