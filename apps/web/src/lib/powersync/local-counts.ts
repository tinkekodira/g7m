/**
 * How much of the catalogue is actually on this device.
 *
 * The point of these numbers is not the numbers. It is that they come from
 * SQLite on the phone rather than from Postgres over the network, so seeing
 * them fill in — and stay filled in with the network off — is the difference
 * between believing sync works and knowing it does.
 */
import { getDatabase } from './database.js';

export interface LocalCounts {
  readonly exercises: number;
  readonly muscles: number;
  readonly equipment: number;
  /** The signed-in user's own rows. Should be at least the profile. */
  readonly profiles: number;
  readonly sessions: number;
  readonly sets: number;
}

const EMPTY: LocalCounts = {
  exercises: 0,
  muscles: 0,
  equipment: 0,
  profiles: 0,
  sessions: 0,
  sets: 0,
};

interface CountRow {
  readonly n: number | null;
}

/**
 * One statement rather than six.
 *
 * Six round trips through the worker for six integers is measurable on a phone,
 * and this runs on every render of the home screen.
 */
const COUNT_SQL = `
  SELECT
    (SELECT count(*) FROM exercises)        AS exercises,
    (SELECT count(*) FROM muscles)          AS muscles,
    (SELECT count(*) FROM equipment)        AS equipment,
    (SELECT count(*) FROM profiles)         AS profiles,
    (SELECT count(*) FROM workout_sessions) AS sessions,
    (SELECT count(*) FROM session_sets)     AS sets
`;

function toCount(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

/**
 * Read the local row counts.
 *
 * Returns zeroes rather than throwing when the database is not open yet: this
 * feeds a status panel, and a panel that crashes the screen it is reporting on
 * is worse than one that briefly reads zero.
 */
export async function readLocalCounts(): Promise<LocalCounts> {
  try {
    const row = await getDatabase().get<Record<string, unknown> & CountRow>(COUNT_SQL);
    return {
      exercises: toCount(row['exercises']),
      muscles: toCount(row['muscles']),
      equipment: toCount(row['equipment']),
      profiles: toCount(row['profiles']),
      sessions: toCount(row['sessions']),
      sets: toCount(row['sets']),
    };
  } catch {
    return EMPTY;
  }
}
