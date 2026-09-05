/**
 * The local database.
 *
 * PowerSync keeps a SQLite database on the device and syncs it against
 * Postgres. This file is the SQLite half: what the app can read with the plane
 * in aeroplane mode and the phone in a basement, which is the state this app is
 * designed around rather than a degraded mode of it.
 *
 * ## What SQLite can and cannot hold
 *
 * SQLite has three types worth caring about — TEXT, INTEGER and REAL — and
 * Postgres has hundreds. The mapping is therefore lossy in specific, knowable
 * ways, and every one of them has to be undone on the way out (see `rows.ts`):
 *
 * | Postgres        | Local        | Read back as                        |
 * | --------------- | ------------ | ----------------------------------- |
 * | `uuid`          | TEXT         | string                              |
 * | `timestamptz`   | TEXT         | ISO 8601 string, always UTC         |
 * | `boolean`       | INTEGER      | 0 or 1                              |
 * | `numeric(p,s)`  | REAL         | number — see the warning below      |
 * | `text[]`        | TEXT         | JSON array                          |
 * | `jsonb`         | TEXT         | JSON                                |
 *
 * **`numeric` becoming REAL is the one that can bite.** Postgres `numeric` is
 * exact; a REAL is a double. For weights this is harmless — 2.5 kg increments
 * are exactly representable and nobody logs a lift to fifteen decimal places —
 * but it does mean the local copy of a weight is not bit-identical to the
 * server's, so nothing may compare them for equality. `packages/core` rounds to
 * an increment before display for exactly this reason.
 *
 * ## What is not here
 *
 * `id` is deliberately absent from every table: PowerSync creates it on every
 * table itself, as `TEXT PRIMARY KEY`, and declaring it is an error. That is
 * also why every Postgres table in this app has a single-column `id` primary
 * key even where a composite would have been more natural (ADR-0020).
 *
 * Columns that exist in Postgres but are not synced are listed in
 * `UNSYNCED_COLUMNS` below, with the reason. That list is not documentation —
 * `app-schema.test.ts` checks it against the real migrations, so a column added
 * to Postgres later fails the build until somebody decides whether the client
 * needs it. Silently not syncing a new column is the kind of bug that surfaces
 * as "why is this field always blank on my phone" three weeks later.
 */
import { column, Schema, Table } from '@powersync/web';

/**
 * Reference data: the exercise catalogue and the anatomy taxonomy.
 *
 * Synced to every user, read-only on the device — there is no write policy on
 * these tables in Postgres at all, so an attempted local write would sync up
 * and be rejected. Repositories expose no mutations for them.
 *
 * The whole catalogue is a few hundred kilobytes, so it syncs in full rather
 * than on demand. That is what lets the exercise picker and the 3D model's
 * muscle panel work with no network, which is most of the point of the app.
 */

const muscleGroups = new Table({
  slug: column.text,
  name: column.text,
  display_order: column.integer,
});

const muscles = new Table(
  {
    slug: column.text,
    common_name: column.text,
    latin_name: column.text,
    muscle_group_id: column.text,
    /** JSON array. One row maps to one or two GLB nodes — left and right. */
    mesh_node_names: column.text,
    region: column.text,
    is_selectable: column.integer,
    display_order: column.integer,
  },
  { indexes: { by_group: ['muscle_group_id', 'display_order'] } },
);

const equipment = new Table({
  slug: column.text,
  name: column.text,
  category: column.text,
});

const exercises = new Table(
  {
    slug: column.text,
    name: column.text,
    /** JSON array of strings. */
    aliases: column.text,
    mechanic: column.text,
    force: column.text,
    joint_count: column.integer,
    difficulty: column.text,
    is_unilateral: column.integer,
    /** JSON array of strings. */
    instructions: column.text,
    /** JSON array of strings. The offline answer to "how do I do this lift". */
    cues: column.text,
    /** JSON array of strings. */
    common_mistakes: column.text,
    default_rep_low: column.integer,
    default_rep_high: column.integer,
    /**
     * When true, the rep columns and `session_sets.reps` hold SECONDS.
     *
     * Not optional to sync: the logger picks a timer or a rep stepper off this
     * one flag, and 1RM estimation is skipped for holds. A plank that reached
     * the device without it would render a rep stepper and earn a personal
     * record of "60 reps of plank".
     */
    is_time_based: column.integer,
    /** Null means "derive from mechanic" — the derivation lives in core. */
    default_rest_seconds: column.integer,
    video_provider: column.text,
    video_ref: column.text,
    thumbnail_url: column.text,
    popularity_rank: column.integer,
    is_active: column.integer,
  },
  { indexes: { by_rank: ['popularity_rank'] } },
);

const exerciseEquipment = new Table(
  {
    exercise_id: column.text,
    equipment_id: column.text,
    is_primary: column.integer,
  },
  {
    indexes: {
      by_exercise: ['exercise_id'],
      by_equipment: ['equipment_id'],
    },
  },
);

const exerciseMuscles = new Table(
  {
    exercise_id: column.text,
    muscle_id: column.text,
    role: column.text,
    recruitment_weight: column.real,
  },
  {
    indexes: {
      by_exercise: ['exercise_id'],
      /** Tapping a muscle on the 3D model runs this lookup. */
      by_muscle: ['muscle_id', 'role'],
    },
  },
);

/**
 * User-owned data.
 *
 * `user_id` is on every one of these even though the sync rules already bucket
 * by user, and every local row therefore belongs to the signed-in user. It is
 * carried anyway because the row travels back up: PostgREST evaluates the RLS
 * `with check` against the row as written, and a row arriving without
 * `user_id` is rejected. It also feeds the composite foreign keys that stop a
 * child row belonging to a different user than its parent (ADR-0021).
 */

const profiles = new Table({
  user_id: column.text,
  display_name: column.text,
  unit_system: column.text,
  experience_level: column.text,
  birth_year: column.integer,
  bodyweight_kg: column.real,
  rest_seconds_default: column.integer,
  week_starts_on: column.integer,
  onboarded_at: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const userEquipment = new Table(
  {
    user_id: column.text,
    equipment_id: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_equipment: ['equipment_id'] } },
);

const routines = new Table(
  {
    user_id: column.text,
    name: column.text,
    notes: column.text,
    last_performed_at: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_recent: ['last_performed_at'] } },
);

const routineExercises = new Table(
  {
    user_id: column.text,
    routine_id: column.text,
    exercise_id: column.text,
    order_key: column.text,
    target_sets: column.integer,
    target_rep_low: column.integer,
    target_rep_high: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_routine: ['routine_id', 'order_key'] } },
);

const workoutSessions = new Table(
  {
    user_id: column.text,
    name: column.text,
    started_at: column.text,
    ended_at: column.text,
    notes: column.text,
    source: column.text,
    routine_id: column.text,
    /** JSON. What the generator was asked for and what it decided. */
    generation_metadata: column.text,
    /** Snapshot, so a pull-up logged at 80 kg stays an 80 kg pull-up. */
    bodyweight_kg: column.real,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      by_start: ['started_at'],
      by_routine: ['routine_id'],
    },
  },
);

const sessionExercises = new Table(
  {
    user_id: column.text,
    session_id: column.text,
    exercise_id: column.text,
    order_key: column.text,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      by_session: ['session_id', 'order_key'],
      /**
       * "Prefill every set from the last time you did this exercise" is the
       * single most-used query in the logger — it runs every time an exercise
       * is opened, on a device with no server to fall back on.
       */
      history: ['exercise_id', 'created_at'],
    },
  },
);

const sessionSets = new Table(
  {
    user_id: column.text,
    session_exercise_id: column.text,
    order_key: column.text,
    set_type: column.text,
    /**
     * How to read `weight_kg`. Without this a pull-up is logged as zero volume.
     * See the migration for the four cases.
     */
    load_type: column.text,
    weight_kg: column.real,
    reps: column.integer,
    rpe: column.real,
    is_completed: column.integer,
    completed_at: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      by_exercise: ['session_exercise_id', 'order_key'],
      /** Personal-record detection and the volume heat map both scan this. */
      completed: ['completed_at'],
    },
  },
);

const personalRecords = new Table(
  {
    user_id: column.text,
    exercise_id: column.text,
    record_type: column.text,
    value: column.real,
    /** Which formula produced `value`, so old estimates stay interpretable. */
    formula: column.text,
    achieved_at: column.text,
    session_set_id: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_exercise: ['exercise_id', 'record_type', 'achieved_at'] } },
);

export const AppSchema = new Schema({
  muscle_groups: muscleGroups,
  muscles,
  equipment,
  exercises,
  exercise_equipment: exerciseEquipment,
  exercise_muscles: exerciseMuscles,
  profiles,
  user_equipment: userEquipment,
  routines,
  routine_exercises: routineExercises,
  workout_sessions: workoutSessions,
  session_exercises: sessionExercises,
  session_sets: sessionSets,
  personal_records: personalRecords,
});

/**
 * Tables that are the same for every user.
 *
 * The distinction is not cosmetic — it is what decides the sync bucket a table
 * lands in, and therefore whether a row is shared with everyone or with one
 * person. Getting a user table into the shared bucket would publish training
 * histories to the whole user base, so the split is declared once, here, and
 * both the sync rules and the drift tests read it rather than restating it.
 */
export const REFERENCE_TABLE_NAMES = [
  'muscle_groups',
  'muscles',
  'equipment',
  'exercises',
  'exercise_equipment',
  'exercise_muscles',
] as const;

export type ReferenceTableName = (typeof REFERENCE_TABLE_NAMES)[number];

export function isReferenceTable(name: string): name is ReferenceTableName {
  return (REFERENCE_TABLE_NAMES as readonly string[]).includes(name);
}

/**
 * The shape of a row as it comes out of the local database.
 *
 * Every column is nullable here and that is not a mistake to be tidied away:
 * SQLite enforces none of Postgres' NOT NULLs, and a row can arrive mid-sync
 * or from a future schema version. The decoders in `rows.ts` are where a
 * nullable local row becomes a domain object with the guarantees the rest of
 * the app relies on.
 */
export type LocalDatabase = (typeof AppSchema)['types'];

/**
 * Tables that exist in Postgres and are not synced at all.
 *
 * Empty, and worth keeping as a declaration rather than an assumption: the
 * drift test uses it, so adding a table to Postgres without deciding whether
 * the client needs it fails the build.
 */
export const UNSYNCED_TABLES: Readonly<Record<string, string>> = {};

/**
 * Columns that exist in Postgres but are deliberately not on the device, and
 * why.
 *
 * Checked against the real migrations by `app-schema.test.ts`. A column added
 * to Postgres that is neither synced nor listed here fails that test — which is
 * the point. The alternative is a field that is silently always blank offline,
 * discovered by a user rather than by CI.
 */
export const UNSYNCED_COLUMNS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  muscle_groups: {
    created_at: 'Reference data. Nothing in the app shows when a muscle group was added.',
    updated_at: 'Reference data, replaced wholesale by sync rather than merged.',
  },
  muscles: {
    created_at: 'Reference data.',
    updated_at: 'Reference data.',
  },
  equipment: {
    created_at: 'Reference data.',
    updated_at: 'Reference data.',
  },
  exercises: {
    created_at: 'Reference data.',
    updated_at: 'Reference data.',
    /**
     * The one entry here that is a decision rather than a saving.
     *
     * `search_text` is `GENERATED ALWAYS`, and Postgres logical replication —
     * which is how PowerSync reads the database — does not carry generated
     * columns before Postgres 18. Syncing it would very likely deliver a
     * column of nulls, and the failure would look like "offline search finds
     * nothing" rather than like a replication setting.
     *
     * It is also unnecessary. The column is `lower(name || ' ' || aliases)`,
     * and both of those are already on the device, so `exerciseSearchText()`
     * in @g7m/core rebuilds the identical string locally from data we have.
     * That removes the dependency on replication behaviour entirely, and makes
     * the matching testable without a database.
     */
    search_text: 'Generated column; @g7m/core rebuilds it locally from name and aliases.',
  },
  exercise_equipment: {
    created_at: 'Reference data.',
    updated_at: 'Reference data.',
  },
  exercise_muscles: {
    created_at: 'Reference data.',
    updated_at: 'Reference data.',
  },
};
