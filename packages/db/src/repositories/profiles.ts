/**
 * The signed-in user's profile.
 *
 * One row, created by a database trigger at signup, so this reads and updates
 * but never inserts. If it is missing, something upstream failed and inventing
 * a row here would paper over it.
 *
 * The interesting field is `bodyweightKg`. It is not body-measurement tracking
 * — that is out of scope per Brief §13 — it is the one current value that lets
 * a pull-up be attributed real volume, snapshotted onto each session so history
 * stays correct as the lifter's weight changes. ADR-0032 will turn it into an
 * append-only history when the coaching loop lands; until then it is a single
 * mutable number and this is the only place that writes it.
 */
import {
  EXPERIENCE_LEVELS,
  SEXES,
  type ExperienceLevel,
  type Sex,
  type UnitSystem,
} from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type RepositoryContext,
  type SqlValue,
  type WritableDatabase,
} from './database.js';
import {
  readDate,
  readEnum,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readString,
  type RawRow,
} from './rows.js';

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;

/**
 * Re-exported from `@g7m/core`, where the plan generator can reach it.
 *
 * How long somebody has trained changes what a plan should contain — a
 * beginner progresses on the same weight a fortnight running and an advanced
 * lifter does not — so it is domain logic before it is a column. Callers of
 * `@g7m/db` see no difference.
 */
export { EXPERIENCE_LEVELS };
export type { ExperienceLevel };

/** Postgres CHECKs. Enforced here too — see `clampProfile` for why. */
export const MIN_REST_DEFAULT_SECONDS = 15;
export const MAX_REST_DEFAULT_SECONDS = 900;
export const MIN_BIRTH_YEAR = 1900;
export const MAX_BIRTH_YEAR = 2100;

export interface Profile {
  readonly id: string;
  readonly userId: string;
  readonly displayName: string | null;
  readonly unitSystem: UnitSystem;
  readonly experienceLevel: ExperienceLevel;
  readonly birthYear: number | null;
  /** For stating realistic rates. Never an input to how much is prescribed. */
  readonly sex: Sex | null;
  readonly bodyweightKg: number | null;
  readonly restSecondsDefault: number;
  /** 1 = Monday, matching ISO 8601. */
  readonly weekStartsOn: number;
  readonly onboardedAt: Date | null;
}

/**
 * Null and a value are both meaningful; an unrecognised string is neither.
 *
 * The same shape as `readOptionalActivity` in body-metrics, and for the same
 * reason: defaulting a value the app does not recognise would put a confident
 * wrong answer into a sentence about somebody's expected rate of progress.
 */
function readOptionalSex(row: RawRow): Sex | null {
  const raw = readOptionalString(row, 'sex');
  return raw !== null && (SEXES as readonly string[]).includes(raw) ? (raw as Sex) : null;
}

/** Every field a device may change. Omitted means "leave it alone". */
export interface ProfileChanges {
  readonly displayName?: string | null;
  readonly unitSystem?: UnitSystem;
  readonly experienceLevel?: ExperienceLevel;
  readonly birthYear?: number | null;
  readonly sex?: Sex | null;
  readonly bodyweightKg?: number | null;
  readonly restSecondsDefault?: number;
  readonly weekStartsOn?: number;
  readonly onboardedAt?: Date | null;
}

function toProfile(row: RawRow): Profile {
  return {
    id: readString(row, 'id', ''),
    userId: readString(row, 'user_id', ''),
    displayName: readOptionalString(row, 'display_name'),
    unitSystem: readEnum(row, 'unit_system', UNIT_SYSTEMS, 'metric'),
    experienceLevel: readEnum(row, 'experience_level', EXPERIENCE_LEVELS, 'beginner'),
    birthYear: readOptionalNumber(row, 'birth_year'),
    sex: readOptionalSex(row),
    bodyweightKg: readOptionalNumber(row, 'bodyweight_kg'),
    restSecondsDefault: readNumber(row, 'rest_seconds_default', 120),
    weekStartsOn: readNumber(row, 'week_starts_on', 1),
    onboardedAt: readDate(row, 'onboarded_at'),
  };
}

export class ProfileRepository {
  constructor(
    private readonly db: WritableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * The one profile row for the signed-in user.
   *
   * Filtered by `user_id` even though the sync rules already mean there can
   * only be one. On a shared device, a sign-out that did not clear leaves the
   * previous user's row in place until the next sync catches up.
   */
  async current(): Promise<Profile | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>('SELECT * FROM profiles WHERE user_id = ?', [
      userId,
    ]);
    return row === null ? null : toProfile(row);
  }

  /**
   * Change some fields and leave the rest.
   *
   * Values are clamped rather than trusted, because SQLite enforces none of
   * the CHECK constraints Postgres does — and a row that violates one is not
   * rejected here, it is rejected **on upload, permanently**. The upload queue
   * classifies a 23xxx as a discard, so a bodyweight of 0 would be dropped
   * server-side and left sitting on the device with nothing explaining why.
   */
  async update(changes: ProfileChanges): Promise<Profile | null> {
    const { userId, now } = resolveContext(this.context);
    const assignments: string[] = [];
    const parameters: SqlValue[] = [];

    const set = (column: string, value: SqlValue): void => {
      assignments.push(`${column} = ?`);
      parameters.push(value);
    };

    if (changes.displayName !== undefined) {
      // An empty display name is no display name. Storing '' would make the
      // greeting render as "Welcome, " with nothing after it.
      const trimmed = changes.displayName?.trim() ?? '';
      set('display_name', trimmed === '' ? null : trimmed);
    }
    if (changes.unitSystem !== undefined) set('unit_system', changes.unitSystem);
    if (changes.experienceLevel !== undefined) set('experience_level', changes.experienceLevel);
    if (changes.birthYear !== undefined) set('birth_year', clampBirthYear(changes.birthYear));
    if (changes.sex !== undefined) {
      // Mirrors the CHECK. Anything else is stored as null rather than as
      // itself, because a row the server refuses is discarded and stranded.
      const sex = changes.sex;
      set('sex', sex !== null && (SEXES as readonly string[]).includes(sex) ? sex : null);
    }
    if (changes.bodyweightKg !== undefined) {
      set('bodyweight_kg', clampBodyweight(changes.bodyweightKg));
    }
    if (changes.restSecondsDefault !== undefined) {
      set('rest_seconds_default', clampRestDefault(changes.restSecondsDefault));
    }
    if (changes.weekStartsOn !== undefined)
      set('week_starts_on', clampWeekStart(changes.weekStartsOn));
    if (changes.onboardedAt !== undefined) {
      set('onboarded_at', changes.onboardedAt === null ? null : toTimestamp(changes.onboardedAt));
    }

    if (assignments.length === 0) return this.current();

    // `updated_at` is written here as well as by the server trigger. PowerSync
    // needs a value locally or the row reads as never touched until the write
    // round-trips, and the trigger overwrites it with the authoritative time.
    set('updated_at', toTimestamp(now()));
    parameters.push(userId);

    await this.db.execute(
      `UPDATE profiles SET ${assignments.join(', ')} WHERE user_id = ?`,
      parameters,
    );
    return this.current();
  }
}

/** Null stays null — "we do not know" is a legitimate answer here. */
function clampBodyweight(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  // numeric(5,2): three digits before the point, so 999.99 is the ceiling the
  // column can physically hold.
  return Math.min(999.99, Math.round(value * 100) / 100);
}

function clampBirthYear(value: number | null): number | null {
  if (value === null || !Number.isInteger(value)) return null;
  if (value < MIN_BIRTH_YEAR || value > MAX_BIRTH_YEAR) return null;
  return value;
}

function clampRestDefault(value: number): number {
  if (!Number.isFinite(value)) return 120;
  return Math.min(MAX_REST_DEFAULT_SECONDS, Math.max(MIN_REST_DEFAULT_SECONDS, Math.round(value)));
}

function clampWeekStart(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 6) return 1;
  return value;
}
