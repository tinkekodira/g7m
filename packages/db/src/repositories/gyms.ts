/**
 * The gyms one lifter trains at. ADR-0178.
 *
 * Somebody with two memberships logs the same machine at both, and the two
 * machines do not weigh the same. A workout that says where it happened is
 * what lets a machine lift be compared within one gym.
 *
 * Gyms are archived, never deleted: a workout done somewhere the lifter no
 * longer goes still says where it was.
 */
import { orderKeyBetween, orderKeyForIndex, sortByOrder } from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type RepositoryContext,
  type WritableDatabase,
} from './database.js';
import { instant } from './instants.js';
import { readDate, readString, readOptionalString, type RawRow } from './rows.js';

/** The column's CHECK, counted the way Postgres counts: by character. */
export const MAX_GYM_NAME_LENGTH = 40;

export interface Gym {
  readonly id: string;
  readonly name: string;
  readonly orderKey: string;
  /** Null while the lifter still goes there. */
  readonly archivedAt: Date | null;
}

function toGym(row: RawRow): Gym {
  return {
    id: readString(row, 'id', ''),
    name: readString(row, 'name', ''),
    orderKey: readString(row, 'order_key', ''),
    archivedAt: readDate(row, 'archived_at'),
  };
}

/**
 * A name the column will accept, or an error saying why not.
 *
 * Checked here because SQLite enforces no CHECK, and a gym the server refuses
 * is discarded on upload — after the workouts pointing at it were tagged.
 */
export function cleanGymName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed === '') throw new Error('A gym needs a name.');
  if ([...trimmed].length > MAX_GYM_NAME_LENGTH) {
    throw new Error(`Keep the name to ${String(MAX_GYM_NAME_LENGTH)} characters.`);
  }
  return trimmed;
}

export class GymRepository {
  constructor(
    private readonly db: WritableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /** In the lifter's order. Archived gyms only when asked for. */
  async list(options: { readonly includeArchived?: boolean } = {}): Promise<Gym[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM gyms WHERE user_id = ?${
        options.includeArchived === true ? '' : ' AND archived_at IS NULL'
      }`,
      [userId],
    );
    return sortByOrder(rows.map(toGym));
  }

  async byId(id: string): Promise<Gym | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      'SELECT * FROM gyms WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    return row === null ? null : toGym(row);
  }

  /** Add a gym at the end of the list. */
  async create(name: string): Promise<Gym> {
    const { userId, newId, now } = resolveContext(this.context);
    const clean = cleanGymName(name);
    const existing = await this.list({ includeArchived: true });
    const orderKey = orderKeyBetween(existing.at(-1)?.orderKey ?? null, null);
    const id = newId();
    const at = toTimestamp(now());
    await this.db.execute(
      `INSERT INTO gyms (id, user_id, name, order_key, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      [id, userId, clean, orderKey, at, at],
    );
    return { id, name: clean, orderKey, archivedAt: null };
  }

  async rename(id: string, name: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute('UPDATE gyms SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
      cleanGymName(name),
      toTimestamp(now()),
      id,
      userId,
    ]);
  }

  /** Stop offering it. Its workouts keep its name. */
  async archive(id: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const at = toTimestamp(now());
    await this.db.execute(
      'UPDATE gyms SET archived_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [at, at, id, userId],
    );
  }

  /** Move a gym to sit at `index` among the gyms still in use. */
  async move(id: string, index: number): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const siblings = (await this.list()).filter((gym) => gym.id !== id);
    const clamped = Math.max(0, Math.min(Math.trunc(index), siblings.length));
    await this.db.execute(
      'UPDATE gyms SET order_key = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [orderKeyForIndex(siblings, clamped), toTimestamp(now()), id, userId],
    );
  }

  /**
   * The gym a new workout most likely happens at: wherever the last one did.
   *
   * Falls back to the first gym in the list when no workout names one still in
   * use, and to null when there are no gyms at all.
   */
  async lastUsed(): Promise<string | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT ws.gym_id
         FROM workout_sessions ws
         JOIN gyms g ON g.id = ws.gym_id
        WHERE ws.user_id = ? AND g.user_id = ? AND g.archived_at IS NULL
        ORDER BY ${instant('ws.started_at')} DESC, ws.id DESC
        LIMIT 1`,
      [userId, userId],
    );
    const recent = row === null ? null : readOptionalString(row, 'gym_id');
    if (recent !== null) return recent;
    return (await this.list())[0]?.id ?? null;
  }

  /**
   * Say that every workout with no gym happened at this one.
   *
   * Run when somebody first says they train at more than one gym, so the
   * history they already have keeps counting at the gym it came from. Not
   * subject to the two-hour correction window: it names where old workouts
   * were, and changes nothing that was lifted. Returns how many it tagged.
   */
  async tagUntaggedSessions(gymId: string): Promise<number> {
    const { userId, now } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      'SELECT COUNT(*) AS n FROM workout_sessions WHERE user_id = ? AND gym_id IS NULL',
      [userId],
    );
    const count = Number(row?.n ?? 0);
    if (count === 0) return 0;
    await this.db.execute(
      'UPDATE workout_sessions SET gym_id = ?, updated_at = ? WHERE user_id = ? AND gym_id IS NULL',
      [gymId, toTimestamp(now()), userId],
    );
    return count;
  }
}
