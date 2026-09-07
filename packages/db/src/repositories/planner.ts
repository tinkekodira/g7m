/**
 * Everything the generator needs to know, fetched once.
 *
 * `@g7m/core`'s `planSession` is pure and takes its whole world as an
 * argument. This is the place that assembles that world: what the user can
 * train with, what they have already done this week, and what they lifted last
 * time they did each thing.
 *
 * Four queries rather than four hundred. A per-exercise "when did I last do
 * this" lookup is the shape that makes an offline app feel slower than an
 * online one, so each of these reads its whole answer in one pass and the
 * assembling happens in memory, where a few thousand rows cost nothing.
 */
import {
  naturalLoadType,
  rpeToRir,
  type ExerciseHistory,
  type PlannableExercise,
  type SessionPerformance,
} from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type QueryableDatabase,
  type RepositoryContext,
} from './database.js';
import {
  readNumber,
  readOptionalNumber,
  readRequiredDate,
  readString,
  type RawRow,
} from './rows.js';

/**
 * Only these count towards a group's weekly volume.
 *
 * Warm-ups do not, and neither does an incomplete set. This matches
 * `countsTowardVolume` in `@g7m/core` — the two have to agree, or the app
 * prescribes work against a total the progress screen does not show.
 */
const COUNTED_SETS = "ss.is_completed = 1 AND ss.set_type <> 'warmup'";

/**
 * Sessions kept per exercise.
 *
 * Three is what the deload rule needs — `DELOAD_AFTER_MISSES` — and one more
 * than that buys nothing but rows.
 */
const RECENT_SESSIONS = 3;

export class PlannerRepository {
  constructor(
    private readonly db: QueryableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * Every exercise the user could actually be asked to do.
   *
   * Restricted to what their equipment allows — prescribing a barbell row to
   * somebody training at home with dumbbells is the fastest way to make a
   * generated plan useless. A user who has recorded no equipment is treated as
   * having a full gym rather than as having nothing, because an empty plan is
   * a worse first impression than an aspirational one.
   *
   * The muscle groups are those of the *primary* movers only. Stabilisers
   * belong in volume attribution, where a share of a set is the right answer,
   * and not here, where "this exercise trains your back" has to mean it.
   */
  async candidates(): Promise<PlannableExercise[]> {
    const { userId } = resolveContext(this.context);

    const rows = await this.db.getAll<RawRow>(
      `SELECT e.id, e.name, e.mechanic, e.is_time_based, e.popularity_rank,
              e.default_rep_low, e.default_rep_high, e.default_rest_seconds,
              group_concat(DISTINCT mg.slug) AS group_slugs,
              group_concat(DISTINCT eq.category) AS equipment_categories
         FROM exercises e
         JOIN exercise_muscles em ON em.exercise_id = e.id AND em.role = 'primary'
         JOIN muscles m ON m.id = em.muscle_id
         JOIN muscle_groups mg ON mg.id = m.muscle_group_id
         LEFT JOIN exercise_equipment xq ON xq.exercise_id = e.id
         LEFT JOIN equipment eq ON eq.id = xq.equipment_id
        WHERE e.is_active = 1
          AND NOT EXISTS (
                SELECT 1 FROM exercise_equipment xe
                 WHERE xe.exercise_id = e.id
                   AND EXISTS (SELECT 1 FROM user_equipment WHERE user_id = ?)
                   AND xe.equipment_id NOT IN (
                         SELECT equipment_id FROM user_equipment WHERE user_id = ?)
              )
        GROUP BY e.id
        ORDER BY e.popularity_rank ASC`,
      [userId, userId],
    );

    return rows.map(toPlannable);
  }

  /**
   * How each exercise has gone lately, newest session first.
   *
   * Every working set of the top weight, not just the best one — "12, 12, 12"
   * and "12, 12, 7" are the same top set and completely different sessions,
   * and only the second is a reason to hold the weight rather than add to it.
   *
   * Bounded by `since` so this stays one small read forever rather than
   * growing with a training history. A hundred and twenty days is far past the
   * three weeks that count as a layoff and the three sessions that count as a
   * plateau, so nothing downstream can want more than it returns.
   */
  async lastPerformances(since: Date, perExercise = RECENT_SESSIONS): Promise<ExerciseHistory[]> {
    const { userId } = resolveContext(this.context);

    const rows = await this.db.getAll<RawRow>(
      `SELECT se.exercise_id, ws.id AS session_id, ws.started_at,
              ss.weight_kg, ss.reps, ss.rpe
         FROM session_sets ss
         JOIN session_exercises se ON se.id = ss.session_exercise_id
         JOIN workout_sessions ws ON ws.id = se.session_id
        WHERE ss.user_id = ? AND ${COUNTED_SETS}
          AND ws.ended_at IS NOT NULL AND ws.started_at >= ?
        ORDER BY se.exercise_id ASC, ws.started_at DESC, ss.order_key ASC`,
      [userId, toTimestamp(since)],
    );

    return groupPerformances(rows, perExercise);
  }

  /**
   * Working sets per muscle group since `from`, for the weekly deficit.
   *
   * Counted per *primary* group, so three sets of bench are three sets of
   * chest rather than three of chest plus a fraction of shoulders and triceps.
   * That is a coarser answer than the progress screen's, on purpose: the
   * progress screen reports what happened, and this decides what to prescribe.
   * Crediting a chest press against a triceps target would let somebody go a
   * month without ever being given a triceps exercise.
   */
  async setsByGroupSince(from: Date): Promise<Map<string, number>> {
    const { userId } = resolveContext(this.context);

    const rows = await this.db.getAll<RawRow>(
      `SELECT mg.slug AS slug, count(*) AS sets
         FROM session_sets ss
         JOIN session_exercises se ON se.id = ss.session_exercise_id
         JOIN workout_sessions ws ON ws.id = se.session_id
         JOIN exercise_muscles em ON em.exercise_id = se.exercise_id AND em.role = 'primary'
         JOIN muscles m ON m.id = em.muscle_id
         JOIN muscle_groups mg ON mg.id = m.muscle_group_id
        WHERE ss.user_id = ? AND ${COUNTED_SETS} AND ws.started_at >= ?
        GROUP BY mg.slug`,
      [userId, toTimestamp(from)],
    );

    const totals = new Map<string, number>();
    for (const row of rows) {
      const slug = readString(row, 'slug', '');
      if (slug !== '') totals.set(slug, readNumber(row, 'sets', 0));
    }
    return totals;
  }

  /**
   * Sessions started since `from`, which is what picks the next focus.
   *
   * Counts started sessions, not finished ones. Somebody mid-workout has
   * already used today's slot, and offering them the same focus again the
   * moment they finish would be the app losing its place.
   */
  async sessionCountSince(from: Date): Promise<number> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT count(*) AS sessions FROM workout_sessions
        WHERE user_id = ? AND started_at >= ?`,
      [userId, toTimestamp(from)],
    );
    return row === null ? 0 : readNumber(row, 'sessions', 0);
  }
}

/**
 * Flat set rows into per-exercise, per-session performances.
 *
 * Done here rather than in SQL for the reason `history.ts` gives: SQL is good
 * at "which rows" and bad at "what do they mean", and "the reps at the top
 * weight" is a meaning. The rows arrive already ordered by exercise then by
 * session, newest first, so this is one pass.
 */
function groupPerformances(rows: readonly RawRow[], perExercise: number): ExerciseHistory[] {
  const byExercise = new Map<string, Map<string, RawRow[]>>();

  for (const row of rows) {
    const exerciseId = readString(row, 'exercise_id', '');
    const sessionId = readString(row, 'session_id', '');
    if (exerciseId === '' || sessionId === '') continue;

    const sessions = byExercise.get(exerciseId) ?? new Map<string, RawRow[]>();
    // Insertion order is the row order, which is newest session first.
    if (!sessions.has(sessionId) && sessions.size >= perExercise) continue;
    sessions.set(sessionId, [...(sessions.get(sessionId) ?? []), row]);
    byExercise.set(exerciseId, sessions);
  }

  return [...byExercise].map(([exerciseId, sessions]) => ({
    exerciseId,
    sessions: [...sessions.values()].map(toPerformance),
  }));
}

function toPerformance(sets: readonly RawRow[]): SessionPerformance {
  const first = sets[0];
  const weights = sets.map((row) => readOptionalNumber(row, 'weight_kg'));
  const heaviest = weights.reduce<number | null>(
    (top, weight) => (weight !== null && (top === null || weight > top) ? weight : top),
    null,
  );

  const atTop = sets.filter((_, index) => (weights[index] ?? null) === heaviest);
  const reps = atTop
    .map((row) => readOptionalNumber(row, 'reps'))
    .filter((value): value is number => value !== null);

  // The last set of the exercise is the one the logger asks about, and the
  // only one whose answer means anything about whether to add weight.
  const lastRpe = readOptionalNumber(sets[sets.length - 1] ?? {}, 'rpe');

  return {
    at: readRequiredDate(first ?? {}, 'started_at', new Date(0)),
    topSetKg: heaviest,
    repsAtTopSet: reps,
    repsInReserve: rpeToRir(lastRpe),
  };
}

function toPlannable(row: RawRow): PlannableExercise {
  const mechanic = readString(row, 'mechanic', '');
  const slugs = readString(row, 'group_slugs', '');
  const categories = readString(row, 'equipment_categories', '');

  return {
    id: readString(row, 'id', ''),
    name: readString(row, 'name', ''),
    mechanic: mechanic === 'compound' || mechanic === 'isolation' ? mechanic : 'unknown',
    isTimeBased: readNumber(row, 'is_time_based', 0) === 1,
    // An exercise needing only bodyweight equipment is a bodyweight exercise.
    // The derivation lives in core so the logger and the planner agree.
    loadType: naturalLoadType(categories === '' ? [] : categories.split(',')),
    // `group_concat` returns one comma-joined string; SQLite has no arrays.
    groupSlugs: slugs === '' ? [] : slugs.split(','),
    popularityRank: readNumber(row, 'popularity_rank', 999),
    defaultRepLow: readNumber(row, 'default_rep_low', 8),
    defaultRepHigh: readNumber(row, 'default_rep_high', 12),
    defaultRestSeconds: readOptionalNumber(row, 'default_rest_seconds'),
  };
}
