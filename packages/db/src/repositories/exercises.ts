/**
 * The exercise catalogue, read from the device.
 *
 * Read-only, and not by omission: Postgres has no write policy on any of these
 * tables, so a local write would sync up and be refused permanently. There are
 * no mutations here because there is nothing a device may legitimately change.
 *
 * Every query runs against local SQLite. That is the point — the picker, the
 * muscle panel and the exercise detail all have to work in a basement, and an
 * app that falls back to the network for its own catalogue is one that stops
 * working exactly where it is needed.
 */
import { searchExercises, type SearchableExercise, type SearchMatch } from '@g7m/core';
import type { QueryableDatabase, SqlValue } from './database.js';
import {
  readBoolean,
  readEnum,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readString,
  readStringArray,
  type RawRow,
} from './rows.js';

export const MECHANICS = ['compound', 'isolation'] as const;
export const FORCES = ['push', 'pull', 'static'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const VIDEO_PROVIDERS = ['youtube', 'hosted', 'none'] as const;
export const MUSCLE_ROLES = ['primary', 'secondary', 'stabilizer'] as const;

export type Mechanic = (typeof MECHANICS)[number];
export type Force = (typeof FORCES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];
export type MuscleRole = (typeof MUSCLE_ROLES)[number];

export interface Exercise extends SearchableExercise {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly mechanic: Mechanic;
  readonly force: Force;
  readonly jointCount: number;
  readonly difficulty: Difficulty;
  readonly isUnilateral: boolean;
  /**
   * When true, the rep fields hold SECONDS.
   *
   * Carried all the way into the domain type rather than left in the row,
   * because everything downstream branches on it: the logger shows a timer
   * instead of a rep stepper, and 1RM estimation is skipped entirely. A plank
   * that lost this flag would earn a personal record of "60 reps".
   */
  readonly isTimeBased: boolean;
  readonly instructions: readonly string[];
  readonly cues: readonly string[];
  readonly commonMistakes: readonly string[];
  readonly defaultRepLow: number;
  readonly defaultRepHigh: number;
  /** Null means "derive from mechanic" — the derivation lives in @g7m/core. */
  readonly defaultRestSeconds: number | null;
  readonly videoProvider: VideoProvider;
  readonly videoRef: string | null;
  readonly thumbnailUrl: string | null;
  readonly popularityRank: number;
  readonly isActive: boolean;
}

export interface MuscleInvolvement {
  readonly muscleId: string;
  readonly role: MuscleRole;
  readonly recruitmentWeight: number;
}

export interface ExerciseEquipment {
  readonly equipmentId: string;
  readonly slug: string;
  readonly name: string;
  /**
   * How the thing provides resistance. Carried because it decides the set's
   * load type: everything in the `bodyweight` category means the lifter is
   * the load. See `naturalLoadType` in @g7m/core.
   */
  readonly category: string;
  /** The station you queue for. Drives the generator's scheduling. */
  readonly isPrimary: boolean;
}

function toExercise(row: RawRow): Exercise {
  return {
    id: readString(row, 'id', ''),
    slug: readString(row, 'slug', ''),
    name: readString(row, 'name', ''),
    aliases: readStringArray(row, 'aliases'),
    mechanic: readEnum(row, 'mechanic', MECHANICS, 'compound'),
    force: readEnum(row, 'force', FORCES, 'push'),
    jointCount: readNumber(row, 'joint_count', 1),
    difficulty: readEnum(row, 'difficulty', DIFFICULTIES, 'beginner'),
    isUnilateral: readBoolean(row, 'is_unilateral'),
    isTimeBased: readBoolean(row, 'is_time_based'),
    instructions: readStringArray(row, 'instructions'),
    cues: readStringArray(row, 'cues'),
    commonMistakes: readStringArray(row, 'common_mistakes'),
    defaultRepLow: readNumber(row, 'default_rep_low', 8),
    defaultRepHigh: readNumber(row, 'default_rep_high', 12),
    defaultRestSeconds: readOptionalNumber(row, 'default_rest_seconds'),
    videoProvider: readEnum(row, 'video_provider', VIDEO_PROVIDERS, 'none'),
    videoRef: readOptionalString(row, 'video_ref'),
    thumbnailUrl: readOptionalString(row, 'thumbnail_url'),
    // The default matters: a row that somehow lost its rank should sort last,
    // not first, so an unranked exercise cannot displace the common lifts.
    popularityRank: readNumber(row, 'popularity_rank', 1000),
    isActive: readBoolean(row, 'is_active', true),
  };
}

/**
 * `popularity_rank` ascending, then name.
 *
 * The name tiebreak is not decoration. Ranks are not unique in the seed data,
 * and without a second key SQLite may order tied rows differently between
 * queries — so a list would reshuffle under the user's thumb for no reason.
 */
const LIST_ORDER = 'ORDER BY popularity_rank ASC, name ASC';
/** The same order for a query that aliases the table, which most joins do. */
const LIST_ORDER_ALIASED = 'ORDER BY e.popularity_rank ASC, e.name ASC';

/**
 * What to put first when the question was about a muscle.
 *
 * Popularity alone is the wrong answer to a narrowed list. Filtering the
 * library to Biceps used to open on Pull-Up, Lat Pulldown and Barbell Row —
 * all true, all back exercises, and none of them what somebody who tapped
 * "Biceps" came for. The curl was fourth because a pull-up is a more popular
 * exercise, which is a fact about the catalogue and not about biceps.
 *
 * So rank by how the filtered muscles are actually involved: prime movers
 * before supporting muscles, then by how much of the work they do, and only
 * then by popularity. `COALESCE` puts anything the relevance join did not
 * match last rather than first, which is where SQLite would otherwise sort a
 * null.
 */
const RELEVANCE_ORDER =
  'ORDER BY COALESCE(rel.role_rank, 2) ASC, COALESCE(rel.best, 0) DESC, ' +
  'e.popularity_rank ASC, e.name ASC';

/**
 * A join carrying how strongly each exercise involves the filtered muscles.
 *
 * Null when the filter says nothing about muscles, in which case the plain
 * popularity order is the right one — there is no relevance to rank by.
 *
 * Specific muscles win over groups when both are given: it is the narrower
 * question, so it is the one the user is more likely to have meant.
 */
function relevanceJoin(criteria: ExerciseFilter): { sql: string; parameters: SqlValue[] } | null {
  const ranked =
    "MIN(CASE em.role WHEN 'primary' THEN 0 ELSE 1 END) AS role_rank, " +
    'MAX(em.recruitment_weight) AS best';

  const muscleIds = criteria.muscleIds;
  if (muscleIds !== undefined && muscleIds.length > 0) {
    return {
      sql: `LEFT JOIN (SELECT em.exercise_id AS ex, ${ranked}
                         FROM exercise_muscles em
                        WHERE em.role IN ${TRAINED_ROLES}
                          AND em.muscle_id IN (${placeholders(muscleIds.length)})
                        GROUP BY em.exercise_id) rel ON rel.ex = e.id`,
      parameters: [...muscleIds],
    };
  }

  const groupIds = criteria.muscleGroupIds;
  if (groupIds !== undefined && groupIds.length > 0) {
    return {
      sql: `LEFT JOIN (SELECT em.exercise_id AS ex, ${ranked}
                         FROM exercise_muscles em
                         JOIN muscles m ON m.id = em.muscle_id
                        WHERE em.role IN ${TRAINED_ROLES}
                          AND m.muscle_group_id IN (${placeholders(groupIds.length)})
                        GROUP BY em.exercise_id) rel ON rel.ex = e.id`,
      parameters: [...groupIds],
    };
  }

  return null;
}

/**
 * What the library screen narrows the catalogue by.
 *
 * Every field is optional, and an omitted field is not a constraint. An empty
 * array is: `equipmentIds: []` means "with no equipment at all", which is a
 * different question from "regardless of equipment" and, given the catalogue
 * models bodyweight work as the `bodyweight-only` item, usually answers none.
 */
export interface ExerciseFilter {
  /** Trains at least one muscle belonging to at least one of these groups. */
  readonly muscleGroupIds?: readonly string[];
  /** Trains at least one of these muscles. */
  readonly muscleIds?: readonly string[];
  /** Needs nothing outside this set. */
  readonly equipmentIds?: readonly string[];
  /**
   * Whether the exercise needs a gym at all.
   *
   * Coarser than `equipmentIds` on purpose, and answering a different
   * question. Somebody who trains in a park does not want to tick eight pieces
   * of equipment off a list to say "nothing"; they want one control that means
   * *nothing but me and a bar to hang off*. And somebody in a gym wants the
   * opposite, because bodyweight work is not what they came for.
   */
  readonly kit?: EquipmentKit;
  readonly mechanic?: Mechanic;
  readonly difficulty?: Difficulty;
}

/**
 * A muscle filter ignores the stabiliser role.
 *
 * "Show me chest exercises" should not return every row where the chest holds
 * an isometric position — that is most of the upper body, and a filter that
 * returns nearly everything has not filtered. Primary and secondary are what a
 * person means by "trains".
 */
const TRAINED_ROLES = "('primary', 'secondary')";

/**
 * The two ends of the equipment question.
 *
 * `bodyweight` is *needs nothing but bodyweight equipment*, not *needs
 * literally nothing* — a pull-up needs a bar and is still bodyweight training,
 * which is the distinction `equipment.category` already draws and the one a
 * street-workout lifter means.
 */
export const EQUIPMENT_KITS = ['bodyweight', 'gym'] as const;
export type EquipmentKit = (typeof EQUIPMENT_KITS)[number];

/** Everything in this category counts as needing no gym. */
const BODYWEIGHT_CATEGORY = 'bodyweight';

/** `?, ?, ?` for a list, so ids are always bound rather than interpolated. */
function placeholders(count: number): string {
  return new Array(count).fill('?').join(', ');
}

export class ExerciseRepository {
  constructor(private readonly db: QueryableDatabase) {}

  /** Every exercise a user may pick, best-known first. */
  async list(): Promise<Exercise[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM exercises WHERE is_active = 1 ${LIST_ORDER}`,
    );
    return rows.map(toExercise);
  }

  /**
   * The catalogue, narrowed. The query behind the library screen's filters.
   *
   * Built as one SQL statement rather than by loading everything and filtering
   * in memory, unlike `search`. The difference is that these are set
   * operations over three join tables — "trains any of these muscles" and
   * "needs nothing outside this equipment" — which SQL expresses exactly and
   * which array manipulation gets subtly wrong. Search is in memory because
   * its ranking has to match the server's, which is a different argument.
   */
  async filter(criteria: ExerciseFilter): Promise<Exercise[]> {
    const conditions = ['e.is_active = 1'];
    const parameters: SqlValue[] = [];

    if (criteria.muscleGroupIds !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM exercise_muscles em
                   JOIN muscles m ON m.id = em.muscle_id
                  WHERE em.exercise_id = e.id
                    AND em.role IN ${TRAINED_ROLES}
                    AND m.muscle_group_id IN (${placeholders(criteria.muscleGroupIds.length)}))`,
      );
      parameters.push(...criteria.muscleGroupIds);
    }

    if (criteria.muscleIds !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM exercise_muscles em
                  WHERE em.exercise_id = e.id
                    AND em.role IN ${TRAINED_ROLES}
                    AND em.muscle_id IN (${placeholders(criteria.muscleIds.length)}))`,
      );
      parameters.push(...criteria.muscleIds);
    }

    if (criteria.equipmentIds !== undefined) {
      // `NOT EXISTS ... NOT IN` is "every requirement is met", the same shape
      // as availableWithUserEquipment and inverted just as easily. An empty
      // set has no `NOT IN ()` to write, and means the exercise must need
      // nothing at all.
      conditions.push(
        criteria.equipmentIds.length === 0
          ? `NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)`
          : `NOT EXISTS (SELECT 1 FROM exercise_equipment ee
                          WHERE ee.exercise_id = e.id
                            AND ee.equipment_id NOT IN (${placeholders(criteria.equipmentIds.length)}))`,
      );
      parameters.push(...criteria.equipmentIds);
    }

    if (criteria.kit !== undefined) {
      // Category, not equipment id: the question is "does this need a gym",
      // and the answer lives on the equipment rather than on the exercise.
      const needsGym = `EXISTS (SELECT 1 FROM exercise_equipment ee
                                  JOIN equipment eq ON eq.id = ee.equipment_id
                                 WHERE ee.exercise_id = e.id
                                   AND eq.category <> ?)`;
      conditions.push(criteria.kit === 'gym' ? needsGym : `NOT ${needsGym}`);
      parameters.push(BODYWEIGHT_CATEGORY);
    }

    if (criteria.mechanic !== undefined) {
      conditions.push('e.mechanic = ?');
      parameters.push(criteria.mechanic);
    }

    if (criteria.difficulty !== undefined) {
      conditions.push('e.difficulty = ?');
      parameters.push(criteria.difficulty);
    }

    /**
     * Ranked by involvement when the filter named muscles, popularity when it
     * did not. See `RELEVANCE_ORDER`.
     *
     * The join's parameters go first because the join comes first in the
     * statement, and these are positional.
     */
    const relevance = relevanceJoin(criteria);
    const rows = await this.db.getAll<RawRow>(
      `SELECT e.* FROM exercises e
       ${relevance?.sql ?? ''}
       WHERE ${conditions.join(' AND ')}
       ${relevance === null ? LIST_ORDER_ALIASED : RELEVANCE_ORDER}`,
      [...(relevance?.parameters ?? []), ...parameters],
    );
    return rows.map(toExercise);
  }

  /**
   * The muscle each exercise trains hardest, by exercise id.
   *
   * One query for the whole list, because the library shows a muscle under
   * every name and fifty round trips to render one screen is how an offline
   * app ends up feeling slower than an online one.
   */
  async primaryMuscleNames(): Promise<ReadonlyMap<string, string>> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT em.exercise_id, m.common_name, em.recruitment_weight
         FROM exercise_muscles em
         JOIN muscles m ON m.id = em.muscle_id
        WHERE em.role = 'primary'
        ORDER BY em.exercise_id ASC, em.recruitment_weight DESC, m.common_name ASC`,
    );
    const names = new Map<string, string>();
    for (const row of rows) {
      const id = readString(row, 'exercise_id', '');
      // The ordering above puts the heaviest involvement first, so the first
      // row seen for an exercise is the one to keep.
      if (id !== '' && !names.has(id)) names.set(id, readString(row, 'common_name', ''));
    }
    return names;
  }

  async byId(id: string): Promise<Exercise | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM exercises WHERE id = ?', [id]);
    return row === null ? null : toExercise(row);
  }

  async bySlug(slug: string): Promise<Exercise | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM exercises WHERE slug = ?', [slug]);
    return row === null ? null : toExercise(row);
  }

  /**
   * Search, ranked identically to the server.
   *
   * Deliberately loads the catalogue and ranks in memory rather than pushing a
   * `LIKE` into SQL. The catalogue is fifty rows and a few hundred kilobytes,
   * so the query costs nothing — and the ranking is then the *same code* that
   * runs server-side, tested in @g7m/core, rather than a second implementation
   * in SQL that would drift and put Front Squat above Back Squat again.
   */
  async search(query: string): Promise<SearchMatch<Exercise>[]> {
    if (query.trim() === '') return [];
    return searchExercises(await this.list(), query);
  }

  /**
   * The library screen's one query: narrow, then rank.
   *
   * Composed here rather than in the component so that "what the library
   * shows" is one tested thing. The order matters — filtering first means the
   * ranking only ever sees exercises the user could actually do, so a search
   * for "press" while Legs is selected does not put the bench press on screen
   * and then have to explain itself.
   */
  async browse(criteria: ExerciseFilter, query = ''): Promise<Exercise[]> {
    const found = await this.filter(criteria);
    if (query.trim() === '') return found;
    return searchExercises(found, query).map((match) => match.item);
  }

  /**
   * The exercises that train a muscle, strongest involvement first.
   *
   * This is the query behind tapping a muscle on the 3D model, so it runs on
   * every interaction with the Learn pillar.
   */
  async forMuscle(muscleId: string, role?: MuscleRole): Promise<Exercise[]> {
    const roleFilter = role === undefined ? '' : 'AND em.role = ?';
    const parameters = role === undefined ? [muscleId] : [muscleId, role];
    const rows = await this.db.getAll<RawRow>(
      `SELECT e.* FROM exercises e
         JOIN exercise_muscles em ON em.exercise_id = e.id
        WHERE em.muscle_id = ? ${roleFilter} AND e.is_active = 1
        ORDER BY em.recruitment_weight DESC, e.popularity_rank ASC, e.name ASC`,
      parameters,
    );
    return rows.map(toExercise);
  }

  /** Which muscles an exercise trains, and how much. */
  async musclesFor(exerciseId: string): Promise<MuscleInvolvement[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT muscle_id, role, recruitment_weight FROM exercise_muscles
        WHERE exercise_id = ?
        ORDER BY recruitment_weight DESC`,
      [exerciseId],
    );
    return rows.map((row) => ({
      muscleId: readString(row, 'muscle_id', ''),
      role: readEnum(row, 'role', MUSCLE_ROLES, 'secondary'),
      recruitmentWeight: readNumber(row, 'recruitment_weight', 0),
    }));
  }

  /** What an exercise needs, with the primary station first. */
  async equipmentFor(exerciseId: string): Promise<ExerciseEquipment[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT q.id AS equipment_id, q.slug, q.name, q.category, ee.is_primary
         FROM exercise_equipment ee
         JOIN equipment q ON q.id = ee.equipment_id
        WHERE ee.exercise_id = ?
        ORDER BY ee.is_primary DESC, q.name ASC`,
      [exerciseId],
    );
    return rows.map((row) => ({
      equipmentId: readString(row, 'equipment_id', ''),
      slug: readString(row, 'slug', ''),
      name: readString(row, 'name', ''),
      category: readString(row, 'category', 'other'),
      isPrimary: readBoolean(row, 'is_primary'),
    }));
  }

  /**
   * Only what the user's gym can do.
   *
   * An exercise is available when every piece of equipment it needs is in
   * `user_equipment`. "Every", not "any": a barbell hip thrust needs the
   * barbell *and* the bench, and offering it to someone with only a barbell
   * wastes the one trip they made to the gym.
   */
  async availableWithUserEquipment(): Promise<Exercise[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT e.* FROM exercises e
        WHERE e.is_active = 1
          AND NOT EXISTS (
            SELECT 1 FROM exercise_equipment ee
             WHERE ee.exercise_id = e.id
               AND ee.equipment_id NOT IN (SELECT equipment_id FROM user_equipment)
          )
        ${LIST_ORDER_ALIASED}`,
    );
    return rows.map(toExercise);
  }
}
