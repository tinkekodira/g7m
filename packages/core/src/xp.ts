/**
 * Experience and levels: what earns XP, and what level a total is. ADR-0132.
 *
 * ## Worked out, never stored
 *
 * The same answer as achievements (ADR-0072): XP is a question about the
 * training log, and this answers it from the log every time. Past training
 * counts the day levels arrive, a deleted workout takes its XP with it, and
 * nothing can be awarded twice.
 *
 * ## What earns it
 *
 * Turning up and doing the work — not how much weight it was. A level is a
 * number friends compare, and kilograms lifted would rank the heaviest person
 * first and reward whoever types the biggest number. So:
 *
 * - **A workout** — finished, with at least three sets or ten minutes of
 *   cardio — is 100. Only two count on any one day, so one session cut into
 *   five is not five sessions.
 * - **Each set** of one is 5, up to 25 sets: a long session earns a little
 *   more, an endless one no more than that.
 * - **A personal record** is 25, up to four a workout, by the same rules as
 *   the badge on the logger (`recordsInSession`).
 * - **A week at the goal** — as many days trained as the goal in force asked
 *   for — is 150, the day it is reached.
 * - **An achievement** is 100, the secret birthday one aside, as it is aside
 *   from everything friends see.
 *
 * ## Logged afterwards
 *
 * A workout logged from the calendar counts when it was logged within a week
 * of the day it was for: the forgotten Tuesday, not last year filled in a day
 * at a time. One logged later earns nothing and counts towards no week, though
 * its sets still set the bar the next record has to beat — the lift happened.
 */
import type { Achievement, GoalSpan } from './achievements.js';
import { achievementsToPublish } from './achievements.js';
import type { LoggedBout } from './cardio.js';
import { DEFAULT_DAYS_PER_WEEK } from './goals.js';
import { countsAsSet } from './load.js';
import type { HistoricalSet } from './progress.js';
import { bestsFrom, recordsInSession, NO_HISTORY, type ExerciseBests } from './records.js';
import { dateKey, startOfWeek, type WeekStart } from './week.js';

export const XP = {
  workout: 100,
  set: 5,
  record: 25,
  week: 150,
  achievement: 100,
} as const;

/** The limits that stop a level being farmed rather than trained for. */
export const XP_CAPS = {
  workoutsPerDay: 2,
  setsPerWorkout: 25,
  recordsPerWorkout: 4,
} as const;

/** What makes a workout one: this many sets, or this much cardio. */
export const XP_MINIMUM = {
  sets: 3,
  cardioSeconds: 10 * 60,
} as const;

/** How late a workout logged afterwards can be and still count. */
export const XP_LATE_LOG_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A workout, as XP sees it. */
export interface XpSession {
  readonly sessionId: string;
  readonly startedAt: Date;
  /** When the row was written: the moment a workout logged afterwards was logged. */
  readonly loggedAt: Date;
  /** Logged afterwards from the calendar rather than tracked as it happened. */
  readonly backdated: boolean;
  /** False for the workout in progress, which earns nothing until Finish. */
  readonly finished: boolean;
}

export interface XpInput {
  readonly sessions: readonly XpSession[];
  /** Ticked lifting sets, any order. Sets of unfinished workouts are ignored. */
  readonly sets: readonly HistoricalSet[];
  readonly bouts: readonly LoggedBout[];
  /** Every goal ever chosen, any order. */
  readonly goals: readonly GoalSpan[];
  /** The whole catalogue as `achievements` returns it; the earned ones count. */
  readonly achievements: readonly Achievement[];
  readonly weekStartsOn: WeekStart;
}

export const XP_SOURCES = ['workout', 'sets', 'records', 'week', 'achievement'] as const;
export type XpSource = (typeof XP_SOURCES)[number];

/** One award, so a total can always be explained line by line. */
export interface XpEntry {
  readonly source: XpSource;
  readonly xp: number;
  readonly at: Date;
  /** The workout it came from, for the three sources that come from one. */
  readonly sessionId: string | null;
  /** The badge for an achievement, the week's first day for a week. */
  readonly key: string | null;
}

export interface XpLedger {
  readonly total: number;
  /** Oldest first. */
  readonly entries: readonly XpEntry[];
}

/** Whether a workout logged afterwards was logged too late to count. */
function loggedTooLate(session: XpSession): boolean {
  return (
    session.backdated &&
    session.loggedAt.getTime() - session.startedAt.getTime() > XP_LATE_LOG_DAYS * MS_PER_DAY
  );
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group === undefined) groups.set(k, [item]);
    else group.push(item);
  }
  return groups;
}

/** The two folds `bestsFrom` makes, merged: the larger of each, history if either has it. */
function mergeBests(a: ExerciseBests, b: ExerciseBests): ExerciseBests {
  const larger = (x: number | null, y: number | null) =>
    x === null ? y : y === null ? x : Math.max(x, y);
  return {
    maxWeightKg: larger(a.maxWeightKg, b.maxWeightKg),
    estimated1rmKg: larger(a.estimated1rmKg, b.estimated1rmKg),
    hasHistory: a.hasHistory || b.hasHistory,
  };
}

/**
 * The days a week in force for the week ending `weekEnd`.
 *
 * The rule `weekStreaks` holds a week to: the goal chosen before it ended,
 * the first goal for weeks before any was chosen, and the app's default with
 * no goal at all.
 */
function daysPerWeekFor(goals: readonly GoalSpan[], weekEnd: Date): number {
  let days = goals[0]?.daysPerWeek ?? DEFAULT_DAYS_PER_WEEK;
  for (const goal of goals) if (goal.startedAt < weekEnd) days = goal.daysPerWeek;
  return days;
}

function nextWeek(week: Date): Date {
  const next = new Date(week);
  next.setDate(next.getDate() + 7);
  return next;
}

/** Every award the log has earned, and their sum. */
export function xpLedger(input: XpInput): XpLedger {
  const entries: XpEntry[] = [];
  const award = (
    source: XpSource,
    xp: number,
    at: Date,
    sessionId: string | null = null,
    key: string | null = null,
  ) => {
    if (xp > 0) entries.push({ source, xp, at, sessionId, key });
  };

  const finished = input.sessions
    .filter((session) => session.finished)
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const finishedIds = new Set(finished.map((session) => session.sessionId));
  const setsBySession = groupBy(
    input.sets.filter((set) => finishedIds.has(set.sessionId)),
    (set) => set.sessionId,
  );
  const cardioBySession = new Map<string, number>();
  for (const bout of input.bouts) {
    const seconds = bout.bout.durationSeconds ?? 0;
    cardioBySession.set(bout.sessionId, (cardioBySession.get(bout.sessionId) ?? 0) + seconds);
  }

  // The bests every exercise had before each workout, carried forward so each
  // workout is judged against everything finished before it.
  const bests = new Map<string, ExerciseBests>();
  const perDay = new Map<string, number>();
  const trainedDays = new Map<string, Map<string, Date>>();

  for (const session of finished) {
    const sets = setsBySession.get(session.sessionId) ?? [];
    const byExercise = groupBy(sets, (set) => set.exerciseId);

    const topSets = sets.filter(countsAsSet).length;
    const qualifies =
      topSets >= XP_MINIMUM.sets ||
      (cardioBySession.get(session.sessionId) ?? 0) >= XP_MINIMUM.cardioSeconds;
    const day = dateKey(session.startedAt);
    const counts =
      qualifies && !loggedTooLate(session) && (perDay.get(day) ?? 0) < XP_CAPS.workoutsPerDay;

    if (counts) {
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
      const at = session.startedAt;
      award('workout', XP.workout, at, session.sessionId);
      award('sets', Math.min(topSets, XP_CAPS.setsPerWorkout) * XP.set, at, session.sessionId);

      let records = 0;
      for (const [exerciseId, exerciseSets] of byExercise) {
        records += recordsInSession({
          sets: exerciseSets.map((set, index) => ({ ...set, id: String(index) })),
          bodyweightKg: exerciseSets[0]?.bodyweightKg ?? null,
          bests: bests.get(exerciseId) ?? NO_HISTORY,
        }).length;
      }
      award(
        'records',
        Math.min(records, XP_CAPS.recordsPerWorkout) * XP.record,
        at,
        session.sessionId,
      );

      const week = dateKey(startOfWeek(at, input.weekStartsOn));
      const days = trainedDays.get(week) ?? new Map<string, Date>();
      if (!days.has(day)) days.set(day, at);
      trainedDays.set(week, days);
    }

    // Every finished workout raises the bar, counted or not: the lift happened.
    for (const [exerciseId, exerciseSets] of byExercise) {
      bests.set(
        exerciseId,
        mergeBests(bests.get(exerciseId) ?? NO_HISTORY, bestsFrom(exerciseSets)),
      );
    }
  }

  const goals = [...input.goals].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  for (const [weekKey, days] of trainedDays) {
    const [first] = days.values();
    if (first === undefined) continue;
    const needed = daysPerWeekFor(goals, nextWeek(startOfWeek(first, input.weekStartsOn)));
    const reached = [...days.values()][needed - 1];
    if (reached !== undefined) award('week', XP.week, reached, null, weekKey);
  }

  for (const earned of achievementsToPublish(input.achievements)) {
    award('achievement', XP.achievement, earned.earnedAt, null, earned.key);
  }

  entries.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { total: entries.reduce((sum, entry) => sum + entry.xp, 0), entries };
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

/**
 * The XP from level `n` to `n + 1`: 450 at first, 50 more each level, and
 * flat at 2,000 from level 32.
 *
 * Quick early, so the first weeks feel like progress; flat later, so that
 * anything ever given away every so many levels arrives at a steady pace
 * rather than further apart each time. About five weeks to level 10, four
 * months to 20 and seven to 30 for somebody training four days a week, then a
 * level a fortnight.
 */
export const LEVEL_CURVE = { base: 400, perLevel: 50, cap: 2000 } as const;

export function xpForLevel(level: number): number {
  return Math.min(LEVEL_CURVE.base + LEVEL_CURVE.perLevel * level, LEVEL_CURVE.cap);
}

export interface LevelProgress {
  /** From 1. */
  readonly level: number;
  /** XP earned since reaching `level`. */
  readonly xpIntoLevel: number;
  /** XP from `level` to the next. */
  readonly xpForLevel: number;
  /** `xpIntoLevel / xpForLevel`, 0 up to but not including 1. */
  readonly progress: number;
}

/** The level a total is, and how far into it. */
export function levelFor(totalXp: number): LevelProgress {
  let remaining = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  let level = 1;
  // Steps are linear until the cap, so the walk is short there; after it,
  // whole levels go at once.
  while (xpForLevel(level) < LEVEL_CURVE.cap && remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  if (xpForLevel(level) === LEVEL_CURVE.cap) {
    const whole = Math.floor(remaining / LEVEL_CURVE.cap);
    level += whole;
    remaining -= whole * LEVEL_CURVE.cap;
  }
  const step = xpForLevel(level);
  return { level, xpIntoLevel: remaining, xpForLevel: step, progress: remaining / step };
}
