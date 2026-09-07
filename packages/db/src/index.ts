/**
 * @g7m/db — the only place in the codebase that talks to a database.
 *
 * Brief §0.5: every database write goes through a repository layer. No
 * component touches the DB directly. That rule is what makes the offline story
 * testable and the sync story swappable.
 *
 * What is here now:
 *
 *   `schema/app-schema.ts`   the device's SQLite schema, and the record of
 *                            which Postgres columns are deliberately not on it
 *   `schema/sync-rules.ts`   renders powersync/sync-rules.yaml from that schema
 *   `sync/`                  what a queued local change means as a write, and
 *                            whether a failed upload is worth retrying
 *   `repositories/`          the only code that reads or writes rows
 *   `testing/`               the PGlite harness that runs the real migrations
 *
 * The repositories here are the catalogue: exercises, muscles and equipment.
 * They are read-only, and not by omission — Postgres has no write policy on
 * any of those tables, so a local write would sync up and be refused for good.
 *
 * Still to come: profile, session, set and routine repositories. They land in
 * Phase 4 beside the logger, next to their first real call sites, because
 * writing them now would be guessing at an interface.
 *
 * The Phase 1 note here said this package would hold a Drizzle schema. It does
 * not, and ADR-0028 records why — briefly, PowerSync needs its own schema
 * object either way, so Drizzle would have been a second definition of the same
 * thing behind a pre-1.0 driver.
 */
export {
  AppSchema,
  isReferenceTable,
  REFERENCE_TABLE_NAMES,
  UNSYNCED_COLUMNS,
  UNSYNCED_TABLES,
  type LocalDatabase,
  type ReferenceTableName,
} from './schema/app-schema.js';
export { renderSyncRules } from './schema/sync-rules.js';
export {
  isMissingOwner,
  planWrite,
  type CrudOperation,
  type DeleteWrite,
  type PlannedWrite,
  type QueuedChange,
  type UpdateWrite,
  type UpsertWrite,
} from './sync/apply-crud.js';
export {
  classifyUploadError,
  isAlreadyApplied,
  isPermissionDenied,
  type UploadError,
  type UploadOutcome,
} from './sync/upload-outcome.js';
export {
  describeUploadReport,
  RetryableUploadError,
  uploadBatch,
  type DiscardedWrite,
  type UploadBatchOptions,
  type UploadReport,
  type WriteExecutor,
} from './sync/upload-batch.js';
export {
  newId,
  resolveContext,
  toTimestamp,
  type QueryableDatabase,
  type RepositoryContext,
  type TransactionalDatabase,
  type ResolvedContext,
  type SqlValue,
  type WritableDatabase,
} from './repositories/database.js';
export {
  EXPERIENCE_LEVELS,
  MAX_BIRTH_YEAR,
  MAX_REST_DEFAULT_SECONDS,
  MIN_BIRTH_YEAR,
  MIN_REST_DEFAULT_SECONDS,
  ProfileRepository,
  UNIT_SYSTEMS,
  type ExperienceLevel,
  type Profile,
  type ProfileChanges,
} from './repositories/profiles.js';
export { PlannerRepository } from './repositories/planner.js';
export {
  GoalRepository,
  TRAINING_GOALS,
  type Goal,
  type GoalInput,
  type TrainingGoal,
} from './repositories/goals.js';
export {
  ACTIVITY_LEVELS,
  BodyMetricsRepository,
  type ActivityLevel,
  type BodyMetric,
  type CurrentMetrics,
  type MetricInput,
} from './repositories/body-metrics.js';
export {
  HistoryRepository,
  type HistoryWindow,
  type SessionSummary,
} from './repositories/history.js';
export {
  SESSION_SOURCES,
  SessionRepository,
  type SessionExercise,
  type SessionSet,
  type SessionSource,
  type SetChanges,
  type StartSessionInput,
  type WorkoutSession,
} from './repositories/sessions.js';
export {
  EQUIPMENT_CATEGORIES,
  EquipmentRepository,
  type Equipment,
  type EquipmentCategory,
} from './repositories/equipment.js';
export {
  MUSCLE_REGIONS,
  MuscleRepository,
  type Muscle,
  type MuscleGroup,
  type MuscleRegion,
} from './repositories/muscles.js';
export {
  DIFFICULTIES,
  ExerciseRepository,
  FORCES,
  MECHANICS,
  MUSCLE_ROLES,
  VIDEO_PROVIDERS,
  type Difficulty,
  type Exercise,
  type ExerciseEquipment,
  EQUIPMENT_KITS,
  type EquipmentKit,
  type ExerciseFilter,
  type Force,
  type Mechanic,
  type MuscleInvolvement,
  type MuscleRole,
  type VideoProvider,
} from './repositories/exercises.js';
export {
  readBoolean,
  readDate,
  readEnum,
  readJson,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readRequiredDate,
  readString,
  readStringArray,
  writeBoolean,
  writeStringArray,
  type RawRow,
} from './repositories/rows.js';
