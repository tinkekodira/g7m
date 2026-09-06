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
import type { QueryableDatabase } from './database.js';
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

export class ExerciseRepository {
  constructor(private readonly db: QueryableDatabase) {}

  /** Every exercise a user may pick, best-known first. */
  async list(): Promise<Exercise[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM exercises WHERE is_active = 1 ${LIST_ORDER}`,
    );
    return rows.map(toExercise);
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
      `SELECT q.id AS equipment_id, q.slug, q.name, ee.is_primary
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
        ${LIST_ORDER.replace('popularity_rank', 'e.popularity_rank').replace('name', 'e.name')}`,
    );
    return rows.map(toExercise);
  }
}
