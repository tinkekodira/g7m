/**
 * The muscle taxonomy, read from the device.
 *
 * Read-only for the same reason the exercise catalogue is: Postgres has no
 * write policy on these tables, so a local write would sync up and be refused
 * permanently.
 *
 * Two consumers with different needs. The exercise library filters by *group*,
 * because "Chest" is a filter a person can hold in their head and "Pectoralis
 * major, sternal head" is not. The 3D model in Phase 5 needs individual
 * muscles, their mesh node names, and which of them are worth tapping.
 */
import type { QueryableDatabase } from './database.js';
import {
  readBoolean,
  readEnum,
  readNumber,
  readString,
  readStringArray,
  type RawRow,
} from './rows.js';

export const MUSCLE_REGIONS = ['anterior', 'posterior', 'both'] as const;
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number];

export interface MuscleGroup {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly displayOrder: number;
}

export interface Muscle {
  readonly id: string;
  readonly slug: string;
  /** What a lifter calls it. The label in every list. */
  readonly commonName: string;
  /** What an anatomy textbook calls it. Shown as a subtitle in Learn. */
  readonly latinName: string;
  readonly muscleGroupId: string;
  /**
   * The GLB nodes this muscle is drawn by — one for a midline muscle, two for
   * a paired one. Phase 5 raycasts into these to turn a tap into a selection.
   */
  readonly meshNodeNames: readonly string[];
  readonly region: MuscleRegion;
  /**
   * Whether tapping it on the model does anything.
   *
   * Some rows exist to complete the anatomy rather than to be trained — deep
   * stabilisers nobody programs for. They render; they do not respond.
   */
  readonly isSelectable: boolean;
  readonly displayOrder: number;
}

function toGroup(row: RawRow): MuscleGroup {
  return {
    id: readString(row, 'id', ''),
    slug: readString(row, 'slug', ''),
    name: readString(row, 'name', ''),
    // Last rather than first, so a row that lost its order does not silently
    // become the top filter chip.
    displayOrder: readNumber(row, 'display_order', 1000),
  };
}

function toMuscle(row: RawRow): Muscle {
  return {
    id: readString(row, 'id', ''),
    slug: readString(row, 'slug', ''),
    commonName: readString(row, 'common_name', ''),
    latinName: readString(row, 'latin_name', ''),
    muscleGroupId: readString(row, 'muscle_group_id', ''),
    meshNodeNames: readStringArray(row, 'mesh_node_names'),
    region: readEnum(row, 'region', MUSCLE_REGIONS, 'both'),
    // Defaults to selectable: a muscle that lost the flag should still respond
    // to a tap, because an unresponsive model reads as broken rather than as
    // deliberate.
    isSelectable: readBoolean(row, 'is_selectable', true),
    displayOrder: readNumber(row, 'display_order', 1000),
  };
}

/**
 * Anatomical order, then name.
 *
 * The name tiebreak is the same insurance as in the exercise repository:
 * `display_order` is not unique, and SQLite is free to return tied rows in a
 * different order between two identical queries.
 */
const GROUP_ORDER = 'ORDER BY display_order ASC, name ASC';
const MUSCLE_ORDER = 'ORDER BY display_order ASC, common_name ASC';

export class MuscleRepository {
  constructor(private readonly db: QueryableDatabase) {}

  /** The filter chips at the top of the exercise library. */
  async groups(): Promise<MuscleGroup[]> {
    const rows = await this.db.getAll<RawRow>(`SELECT * FROM muscle_groups ${GROUP_ORDER}`);
    return rows.map(toGroup);
  }

  async list(): Promise<Muscle[]> {
    const rows = await this.db.getAll<RawRow>(`SELECT * FROM muscles ${MUSCLE_ORDER}`);
    return rows.map(toMuscle);
  }

  /** Only the ones a tap on the 3D model should select. */
  async selectable(): Promise<Muscle[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM muscles WHERE is_selectable = 1 ${MUSCLE_ORDER}`,
    );
    return rows.map(toMuscle);
  }

  async inGroup(muscleGroupId: string): Promise<Muscle[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM muscles WHERE muscle_group_id = ? ${MUSCLE_ORDER}`,
      [muscleGroupId],
    );
    return rows.map(toMuscle);
  }

  async byId(id: string): Promise<Muscle | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM muscles WHERE id = ?', [id]);
    return row === null ? null : toMuscle(row);
  }

  async bySlug(slug: string): Promise<Muscle | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM muscles WHERE slug = ?', [slug]);
    return row === null ? null : toMuscle(row);
  }
}
