/**
 * Reading training history back.
 *
 * Everything here is a read over what the logger wrote, shaped so that
 * `@g7m/core`'s progress functions can do the arithmetic. The split is
 * deliberate: SQL is good at "which rows", bad at "what do they mean", and the
 * meaning — how volume is attributed to a muscle, what counts as a record —
 * is the part that has to be tested without a database.
 *
 * So these queries fetch flat rows with the session context already joined on,
 * and hand them over. No aggregation in SQL. The catalogue is small enough
 * that a year of training is a few thousand rows, and the alternative is the
 * same rules written twice in two languages, drifting.
 */
import { isCardioKind, type HistoricalSet, type LoggedBout, type MuscleShare } from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type QueryableDatabase,
  type RepositoryContext,
  type SqlValue,
} from './database.js';
import { INSTANT_PARAMETER, instant, isoText } from './instants.js';
import {
  readBoolean,
  readDate,
  readEnum,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readString,
  type RawRow,
} from './rows.js';
import { SESSION_SOURCES, readBout, type SessionSource } from './sessions.js';

const SET_TYPE_VALUES = ['warmup', 'working', 'dropset', 'failure', 'amrap'] as const;
const LOAD_TYPE_VALUES = ['external', 'bodyweight', 'bodyweight_plus', 'assisted'] as const;

export interface HistoryWindow {
  /** Inclusive. Omit for everything ever logged. */
  readonly from?: Date;
  /** Exclusive. Omit for up to now. */
  readonly to?: Date;
  readonly exerciseId?: string;
  /**
   * The workout in progress as well as finished ones. For achievements, which
   * a set can earn while its workout is still open (ADR-0072). Everything
   * else leaves it out, for the reason on `completedSets`.
   */
  readonly includeOpen?: boolean;
}

/** For the reads that take nothing but whether to count the open workout. */
export interface OpenOption {
  readonly includeOpen?: boolean;
}

/** A finished workout, with the totals a history list shows without drilling in. */
export interface SessionSummary {
  readonly sessionId: string;
  readonly name: string | null;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly bodyweightKg: number | null;
  readonly exerciseCount: number;
  /** Every counted set, bouts included. */
  readonly setCount: number;
  /** How many of those are cardio bouts, so a list can say "1 bout", not "1 set". */
  readonly boutCount: number;
  /** `past` for a workout logged afterwards, whose clock times mean nothing. */
  readonly source: SessionSource;
  /**
   * When the first and last counted sets were ticked.
   *
   * The clock a duration should be read from. `startedAt` and `endedAt` say how
   * long the workout was *open*, which includes a phone left on a bench after
   * the last set and a workout started at the door and not touched for an
   * hour. See `trainingMinutes`.
   */
  readonly firstSetAt: Date | null;
  readonly lastSetAt: Date | null;
}

function toHistoricalSet(row: RawRow): HistoricalSet {
  return {
    sessionId: readString(row, 'session_id', ''),
    exerciseId: readString(row, 'exercise_id', ''),
    // The session's start, not the set's completion. Two sets either side of
    // midnight belong to the same workout, and bucketing them into different
    // days would split one session across two entries in the history.
    performedAt: new Date(readString(row, 'started_at', '')),
    bodyweightKg: readOptionalNumber(row, 'bodyweight_kg'),
    setType: readEnum(row, 'set_type', SET_TYPE_VALUES, 'working'),
    loadType: readEnum(row, 'load_type', LOAD_TYPE_VALUES, 'external'),
    weightKg: readNumber(row, 'weight_kg', 0),
    reps: readNumber(row, 'reps', 0),
    isCompleted: readBoolean(row, 'is_completed'),
  };
}

export class HistoryRepository {
  constructor(
    private readonly db: QueryableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * Every completed set in the window, with its session context attached.
   *
   * Only finished sessions. The workout in progress belongs on the logger, and
   * counting it in a weekly total would make the chart move under somebody
   * mid-set — the week's bar growing as they train reads as a bug even when
   * the arithmetic is right.
   */
  async completedSets(window: HistoryWindow = {}): Promise<HistoricalSet[]> {
    const { userId } = resolveContext(this.context);
    // Lifting only. A cardio bout is stored as a set with zero weight and reps,
    // and counting it here would add bouts to the Sets chart and nothing to
    // anything else; bouts have `completedBouts` (ADR-0069).
    const conditions = ['ss.user_id = ?', 'ss.is_completed = 1', 'e.cardio_kind IS NULL'];
    const parameters: SqlValue[] = [userId];
    if (window.includeOpen !== true) conditions.push('ws.ended_at IS NOT NULL');

    if (window.from !== undefined) {
      conditions.push(`${instant('ws.started_at')} >= ${INSTANT_PARAMETER}`);
      parameters.push(toTimestamp(window.from));
    }
    if (window.to !== undefined) {
      conditions.push(`${instant('ws.started_at')} < ${INSTANT_PARAMETER}`);
      parameters.push(toTimestamp(window.to));
    }
    if (window.exerciseId !== undefined) {
      conditions.push('se.exercise_id = ?');
      parameters.push(window.exerciseId);
    }

    const rows = await this.db.getAll<RawRow>(
      `SELECT ws.id AS session_id, ws.started_at, ws.bodyweight_kg,
              se.exercise_id,
              ss.set_type, ss.load_type, ss.weight_kg, ss.reps, ss.is_completed
         FROM session_sets ss
         JOIN session_exercises se ON se.id = ss.session_exercise_id
         JOIN workout_sessions ws ON ws.id = se.session_id
         -- LEFT: a set whose exercise has not synced yet is still a lift.
         LEFT JOIN exercises e ON e.id = se.exercise_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${instant('ws.started_at')} ASC, ss.order_key ASC`,
      parameters,
    );
    return rows.map(toHistoricalSet);
  }

  /**
   * The primary muscle groups of every exercise, for the training review.
   *
   * Groups rather than muscles, and *primary* rather than every role — the
   * same attribution the generator prescribes against, so the review and the
   * plan are measuring the same thing. `muscleShares` above answers the other
   * question, splitting a set across everything that helped, which is right
   * for a heat map and wrong for "has your back had enough work".
   */
  async groupsByExercise(): Promise<Map<string, string[]>> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT em.exercise_id, mg.slug
         FROM exercise_muscles em
         JOIN muscles m ON m.id = em.muscle_id
         JOIN muscle_groups mg ON mg.id = m.muscle_group_id
        WHERE em.role = 'primary'`,
    );

    const groups = new Map<string, string[]>();
    for (const row of rows) {
      const exerciseId = readString(row, 'exercise_id', '');
      const slug = readString(row, 'slug', '');
      if (exerciseId === '' || slug === '') continue;
      const own = groups.get(exerciseId) ?? [];
      // An exercise with two primary muscles in one group counts once.
      if (!own.includes(slug)) own.push(slug);
      groups.set(exerciseId, own);
    }
    return groups;
  }

  /**
   * Which muscles each exercise works, and how much, for volume attribution.
   *
   * The whole table in one query rather than per exercise. It is a few hundred
   * rows for the entire catalogue, and the alternative is a query per exercise
   * in a session — which is the shape that makes an offline app feel slower
   * than an online one.
   */
  async muscleShares(): Promise<Map<string, MuscleShare[]>> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT exercise_id, muscle_id, recruitment_weight
         FROM exercise_muscles
        ORDER BY exercise_id ASC, recruitment_weight DESC`,
    );

    const shares = new Map<string, MuscleShare[]>();
    for (const row of rows) {
      const exerciseId = readString(row, 'exercise_id', '');
      if (exerciseId === '') continue;
      shares.set(exerciseId, [
        ...(shares.get(exerciseId) ?? []),
        {
          muscleId: readString(row, 'muscle_id', ''),
          recruitmentWeight: readNumber(row, 'recruitment_weight', 0),
        },
      ]);
    }
    return shares;
  }

  /**
   * Finished workouts with their headline counts, newest first.
   *
   * The counts are aggregated in SQL, unlike everything else here, because
   * they are counts rather than meaning — and fetching every set of every
   * session to count them in JavaScript would read a year of training to
   * render one list.
   *
   * **A session with nothing ticked is not a workout, and is left out.** It is
   * one somebody opened and walked away from, or finished without logging, and
   * listing it read as "0 sets · 442 min". Worse, it counted: the Learn screen
   * waits for five sessions before offering advice, and five abandoned ones
   * met that threshold with no training behind it at all. Nothing is deleted —
   * the rows are still there — they are just not reported as training.
   *
   * `null` for every workout ever logged, which is what "all time" on the
   * progress screen has to count. A year of training is a couple of hundred of
   * these rows, and each is already one aggregated line.
   */
  async sessionSummaries(
    limit: number | null = 50,
    options: OpenOption = {},
  ): Promise<SessionSummary[]> {
    const { userId } = resolveContext(this.context);
    // A limit of -1 is SQLite for "no limit", which keeps this one statement
    // rather than two that could drift apart.
    const bound = limit === null ? -1 : Math.max(1, Math.trunc(limit));
    const rows = await this.db.getAll<RawRow>(
      `SELECT ws.id AS session_id, ws.name, ws.started_at, ws.ended_at, ws.bodyweight_kg, ws.source,
              (SELECT COUNT(*) FROM session_exercises se
                WHERE se.session_id = ws.id) AS exercise_count,
              counted.set_count, counted.bout_count, counted.first_set_at, counted.last_set_at
         FROM workout_sessions ws
         JOIN (SELECT se2.session_id,
                      COUNT(*) AS set_count,
                      SUM(CASE WHEN e2.cardio_kind IS NOT NULL THEN 1 ELSE 0 END) AS bout_count,
                      -- A bout started its time before it was ticked, so
                      -- the workout's training began then: a treadmill
                      -- session of one 30-minute bout is 30 minutes, not 0.
                      ${isoText(
                        `MIN(${instant('ss.completed_at')} - COALESCE(ss.duration_seconds, 0) / 86400.0)`,
                      )} AS first_set_at,
                      ${isoText(`MAX(${instant('ss.completed_at')})`)} AS last_set_at
                 FROM session_sets ss
                 JOIN session_exercises se2 ON se2.id = ss.session_exercise_id
                 -- LEFT: a set whose exercise has not synced yet still counts.
                 LEFT JOIN exercises e2 ON e2.id = se2.exercise_id
                WHERE ss.is_completed = 1
                  AND ss.set_type <> 'warmup'
                GROUP BY se2.session_id) counted ON counted.session_id = ws.id
        WHERE ws.user_id = ? ${options.includeOpen === true ? '' : 'AND ws.ended_at IS NOT NULL'}
        ORDER BY ${instant('ws.started_at')} DESC, ws.id DESC
        LIMIT ?`,
      [userId, bound],
    );

    return rows.map((row) => ({
      sessionId: readString(row, 'session_id', ''),
      name: readOptionalString(row, 'name'),
      startedAt: new Date(readString(row, 'started_at', '')),
      endedAt: readDate(row, 'ended_at'),
      bodyweightKg: readOptionalNumber(row, 'bodyweight_kg'),
      exerciseCount: readNumber(row, 'exercise_count', 0),
      setCount: readNumber(row, 'set_count', 0),
      boutCount: readNumber(row, 'bout_count', 0),
      source: readEnum(row, 'source', SESSION_SOURCES, 'manual'),
      firstSetAt: readDate(row, 'first_set_at'),
      lastSetAt: readDate(row, 'last_set_at'),
    }));
  }

  /**
   * The exercises a user has actually trained, most recent first.
   *
   * What the progress screen offers to chart. Listing the whole catalogue
   * there would bury the four lifts somebody cares about under fifty they have
   * never done.
   *
   * `isTimeBased` rides along for the review, which describes a plank's best
   * as "60 s" rather than "60 reps".
   */
  /**
   * Every finished cardio bout, oldest first, for Progress.
   *
   * All of them rather than a window: a bout is one small row, a year of
   * cardio is a few hundred, and the three views each need a different span
   * of it. Only ticked bouts in finished workouts count, as for sets.
   */
  async completedBouts(options: OpenOption = {}): Promise<LoggedBout[]> {
    const { userId } = resolveContext(this.context);
    const finished = options.includeOpen === true ? '' : 'AND ws.ended_at IS NOT NULL';
    const rows = await this.db.getAll<RawRow>(
      `SELECT ws.id AS session_id, ws.started_at, ws.bodyweight_kg, e.cardio_kind, ss.*
         FROM session_sets ss
         JOIN session_exercises se ON se.id = ss.session_exercise_id
         JOIN workout_sessions ws ON ws.id = se.session_id
         JOIN exercises e ON e.id = se.exercise_id
        WHERE ss.user_id = ?
          AND ss.is_completed = 1
          ${finished}
          AND e.cardio_kind IS NOT NULL
        ORDER BY ${instant('ws.started_at')} ASC, ss.order_key ASC`,
      [userId],
    );

    return rows.flatMap((row): LoggedBout[] => {
      const kind = readOptionalString(row, 'cardio_kind');
      const performedAt = readDate(row, 'started_at');
      if (!isCardioKind(kind) || performedAt === null) return [];
      return [
        {
          sessionId: readString(row, 'session_id', ''),
          performedAt,
          kind,
          bout: readBout(row),
          bodyweightKg: readOptionalNumber(row, 'bodyweight_kg'),
        },
      ];
    });
  }

  async trainedExercises(): Promise<
    { exerciseId: string; name: string; lastAt: Date; isTimeBased: boolean }[]
  > {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT se.exercise_id, e.name, e.is_time_based,
              ${isoText(`MAX(${instant('ws.started_at')})`)} AS last_at
         FROM session_exercises se
         JOIN workout_sessions ws ON ws.id = se.session_id
         JOIN exercises e ON e.id = se.exercise_id
        WHERE se.user_id = ?
          AND ws.ended_at IS NOT NULL
          -- Lifts only: a treadmill has no weight to trend and no best to stall.
          AND e.cardio_kind IS NULL
          AND EXISTS (
            SELECT 1 FROM session_sets ss
             WHERE ss.session_exercise_id = se.id AND ss.is_completed = 1
          )
        GROUP BY se.exercise_id, e.name, e.is_time_based
        ORDER BY last_at DESC, e.name ASC`,
      [userId],
    );

    return rows.map((row) => ({
      exerciseId: readString(row, 'exercise_id', ''),
      name: readString(row, 'name', ''),
      lastAt: new Date(readString(row, 'last_at', '')),
      isTimeBased: readBoolean(row, 'is_time_based'),
    }));
  }
}
