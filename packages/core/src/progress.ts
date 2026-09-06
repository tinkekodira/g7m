/**
 * Turning logged sets into something worth looking at.
 *
 * All of it pure: rows in, numbers out. The queries that fetch those rows live
 * in `@g7m/db`, and the screens that draw them live in the app — this is the
 * arithmetic in the middle, which is the part with decisions in it.
 */
import { countsTowardVolume, effectiveLoadKg, setVolumeKg, type LoggedSet } from './load.js';
import { estimateOneRepMax, type OneRepMaxEstimate } from './one-rep-max.js';
import { weekKey, type WeekStart } from './week.js';

/** A completed set, with the session context needed to measure it. */
export interface HistoricalSet extends LoggedSet {
  readonly sessionId: string;
  readonly exerciseId: string;
  /** When the session started, for bucketing. Not when the set was completed. */
  readonly performedAt: Date;
  /** The session's snapshot, not today's profile value. */
  readonly bodyweightKg: number | null;
}

/** How much of an exercise's work a muscle does. From `exercise_muscles`. */
export interface MuscleShare {
  readonly muscleId: string;
  readonly recruitmentWeight: number;
}

/**
 * Volume per muscle over a set of sessions.
 *
 * Each set's volume is split across the muscles that did it, in proportion to
 * `recruitment_weight`. A bench press is not 100% chest — attributing it that
 * way makes the heat map say the triceps are never trained, which would be
 * wrong in a way that changes what somebody does next.
 *
 * **Stabilisers count here, and deliberately do not count in the exercise
 * library's muscle filter.** They are different questions. "Show me chest
 * exercises" should not return everything the chest holds still for; "how much
 * work did my core do" should, because holding still under load is work. The
 * recruitment weight already says how much.
 */
export function volumeByMuscle(
  sets: readonly HistoricalSet[],
  sharesByExercise: ReadonlyMap<string, readonly MuscleShare[]>,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const set of sets) {
    const volume = setVolumeKg(set, set.bodyweightKg);
    if (volume === null || volume === 0) continue;

    for (const share of sharesByExercise.get(set.exerciseId) ?? []) {
      if (!Number.isFinite(share.recruitmentWeight) || share.recruitmentWeight <= 0) continue;
      const current = totals.get(share.muscleId) ?? 0;
      totals.set(share.muscleId, current + volume * share.recruitmentWeight);
    }
  }

  for (const [muscleId, total] of totals) totals.set(muscleId, round2(total));
  return totals;
}

/**
 * The same figures rescaled to 0–1 against the hardest-worked muscle.
 *
 * What the heat map actually needs. Absolute kilograms cannot be coloured:
 * a leg session and an arm session are an order of magnitude apart, so a fixed
 * scale would show one as uniformly hot and the other as uniformly cold, and
 * neither would say which muscles got the work.
 *
 * Relative to the maximum, so the map always answers "what did you train
 * *most*" rather than "did you train hard", which is a question a colour
 * cannot honestly answer anyway.
 */
export function relativeVolume(totals: ReadonlyMap<string, number>): Map<string, number> {
  const peak = Math.max(0, ...totals.values());
  const relative = new Map<string, number>();
  if (peak === 0) return relative;
  for (const [muscleId, total] of totals) relative.set(muscleId, total / peak);
  return relative;
}

export interface WeeklyVolume {
  /** The week's first day, as `weekKey` renders it. */
  readonly week: string;
  readonly volumeKg: number;
  readonly sessions: number;
  /** Completed working sets. The number lifters actually count. */
  readonly sets: number;
}

/**
 * Volume per week, over exactly the weeks asked for.
 *
 * The weeks come in rather than being derived from the data, because a week
 * with no training is the most informative point on the chart and deriving the
 * axis from the sets would delete it.
 */
export function weeklyVolume(
  sets: readonly HistoricalSet[],
  weeks: readonly Date[],
  weekStartsOn?: WeekStart,
): WeeklyVolume[] {
  const buckets = new Map<string, { volumeKg: number; sessions: Set<string>; sets: number }>();
  for (const week of weeks) {
    buckets.set(weekKey(week, weekStartsOn), { volumeKg: 0, sessions: new Set(), sets: 0 });
  }

  for (const set of sets) {
    const bucket = buckets.get(weekKey(set.performedAt, weekStartsOn));
    // Outside the window asked for. Not an error — the caller decides the axis.
    if (bucket === undefined) continue;
    if (!countsTowardVolume(set)) continue;

    bucket.sets += 1;
    bucket.sessions.add(set.sessionId);
    const volume = setVolumeKg(set, set.bodyweightKg);
    if (volume !== null) bucket.volumeKg += volume;
  }

  return weeks.map((week) => {
    const key = weekKey(week, weekStartsOn);
    const bucket = buckets.get(key);
    return {
      week: key,
      volumeKg: round2(bucket?.volumeKg ?? 0),
      sessions: bucket?.sessions.size ?? 0,
      sets: bucket?.sets ?? 0,
    };
  });
}

export interface TrendPoint {
  readonly sessionId: string;
  readonly performedAt: Date;
  /** Heaviest effective load moved for a completed working set. */
  readonly topSetKg: number;
  readonly reps: number;
  /** Null when no set in the session qualifies — too many reps, or no load. */
  readonly estimatedOneRepMax: OneRepMaxEstimate | null;
  readonly volumeKg: number;
}

/**
 * One point per session, for the per-exercise trend line.
 *
 * Sessions rather than sets, because a chart with a point per set is a scatter
 * of warm-ups and back-offs that hides the line through it. The top set is
 * what a lifter remembers doing.
 *
 * Sorted oldest first, which is the order a chart draws in and not the order
 * the history query returns.
 */
export function exerciseTrend(sets: readonly HistoricalSet[]): TrendPoint[] {
  const bySession = new Map<string, HistoricalSet[]>();
  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    bySession.set(set.sessionId, [...(bySession.get(set.sessionId) ?? []), set]);
  }

  const points: TrendPoint[] = [];
  for (const [sessionId, sessionSets] of bySession) {
    const first = sessionSets[0];
    if (first === undefined) continue;

    let topSetKg = 0;
    let reps = 0;
    let best: OneRepMaxEstimate | null = null;
    let volumeKg = 0;

    for (const set of sessionSets) {
      const load = effectiveLoadKg(set, set.bodyweightKg);
      if (load !== null && load > topSetKg) {
        topSetKg = load;
        reps = set.reps;
      }
      if (load !== null) {
        const estimate = estimateOneRepMax(load, set.reps);
        if (estimate !== null && (best === null || estimate.valueKg > best.valueKg))
          best = estimate;
      }
      volumeKg += setVolumeKg(set, set.bodyweightKg) ?? 0;
    }

    points.push({
      sessionId,
      performedAt: first.performedAt,
      topSetKg: round2(topSetKg),
      reps,
      estimatedOneRepMax: best,
      volumeKg: round2(volumeKg),
    });
  }

  return points.sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
}

/**
 * The record types this computes.
 *
 * `personal_records.record_type` in Postgres allows a fourth,
 * `max_reps_at_weight`, and it is deliberately not here. The table stores a
 * single `value` and has nowhere to put the weight the reps were done at — so
 * a record computed under that name would compare twenty reps at 20 kg
 * against five at 100 kg and call the first one better. Storing it properly
 * needs a column that does not exist yet; guessing at the meaning would put
 * wrong numbers in front of somebody as an achievement.
 */
export const RECORD_TYPES = ['max_weight', 'estimated_1rm', 'max_session_volume'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export interface PersonalRecord {
  readonly exerciseId: string;
  readonly recordType: RecordType;
  readonly value: number;
  readonly achievedAt: Date;
  /** Only ever set for `estimated_1rm`, matching the CHECK in Postgres. */
  readonly formula: 'epley' | null;
}

/**
 * The best of each kind, per exercise, from a run of history.
 *
 * Computed on the device rather than by a database trigger, because it has to
 * work offline — Brief §5 says so, and a personal record announced three days
 * later when the phone found signal is not a personal record, it is a
 * newsletter.
 *
 * Ties keep the **earlier** date. The record was set the first time it was hit;
 * repeating it is not a new one, and a screen that says "new PR" every time
 * somebody matches their best stops meaning anything within a fortnight.
 */
export function personalRecords(sets: readonly HistoricalSet[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();

  const offer = (record: PersonalRecord): void => {
    const key = `${record.exerciseId}:${record.recordType}`;
    const current = best.get(key);
    if (
      current === undefined ||
      record.value > current.value ||
      (record.value === current.value && record.achievedAt < current.achievedAt)
    ) {
      best.set(key, record);
    }
  };

  const sessionVolume = new Map<string, { exerciseId: string; at: Date; kg: number }>();

  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const load = effectiveLoadKg(set, set.bodyweightKg);
    if (load === null) continue;

    offer({
      exerciseId: set.exerciseId,
      recordType: 'max_weight',
      value: round2(load),
      achievedAt: set.performedAt,
      formula: null,
    });

    const estimate = estimateOneRepMax(load, set.reps);
    if (estimate !== null) {
      offer({
        exerciseId: set.exerciseId,
        recordType: 'estimated_1rm',
        value: estimate.valueKg,
        achievedAt: set.performedAt,
        formula: estimate.formula,
      });
    }

    const volumeKey = `${set.sessionId}:${set.exerciseId}`;
    const running = sessionVolume.get(volumeKey);
    const volume = setVolumeKg(set, set.bodyweightKg) ?? 0;
    sessionVolume.set(volumeKey, {
      exerciseId: set.exerciseId,
      at: set.performedAt,
      kg: (running?.kg ?? 0) + volume,
    });
  }

  for (const entry of sessionVolume.values()) {
    offer({
      exerciseId: entry.exerciseId,
      recordType: 'max_session_volume',
      value: round2(entry.kg),
      achievedAt: entry.at,
      formula: null,
    });
  }

  return [...best.values()].sort(
    (a, b) =>
      a.exerciseId.localeCompare(b.exerciseId, 'en') ||
      a.recordType.localeCompare(b.recordType, 'en') ||
      b.value - a.value,
  );
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
