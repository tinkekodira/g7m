/**
 * The equipment catalogue, and what the user actually has.
 *
 * `equipment` is reference data, read-only like the rest of the catalogue.
 * `user_equipment` is the one thing here a device may write: it is the answer
 * to "what does your gym have", and it decides what the generator is allowed
 * to prescribe.
 *
 * The writes are not here yet. They belong with the screen that collects them,
 * which is the equipment picker in Phase 4 — writing them now would be
 * guessing at an interface.
 */
import type { QueryableDatabase } from './database.js';
import { readEnum, readString, type RawRow } from './rows.js';

export const EQUIPMENT_CATEGORIES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'bands',
  'other',
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export interface Equipment {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /**
   * How the thing provides resistance, not where it lives in a gym.
   *
   * This is what the generator filters on — "can this person load a barbell
   * movement" — so a pull-up bar is `bodyweight` rather than `other`.
   */
  readonly category: EquipmentCategory;
}

function toEquipment(row: RawRow): Equipment {
  return {
    id: readString(row, 'id', ''),
    slug: readString(row, 'slug', ''),
    name: readString(row, 'name', ''),
    category: readEnum(row, 'category', EQUIPMENT_CATEGORIES, 'other'),
  };
}

const LIST_ORDER = 'ORDER BY name ASC';

export class EquipmentRepository {
  constructor(private readonly db: QueryableDatabase) {}

  /** Everything the catalogue knows about, alphabetically. */
  async list(): Promise<Equipment[]> {
    const rows = await this.db.getAll<RawRow>(`SELECT * FROM equipment ${LIST_ORDER}`);
    return rows.map(toEquipment);
  }

  async byId(id: string): Promise<Equipment | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM equipment WHERE id = ?', [id]);
    return row === null ? null : toEquipment(row);
  }

  async bySlug(slug: string): Promise<Equipment | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM equipment WHERE slug = ?', [slug]);
    return row === null ? null : toEquipment(row);
  }

  /**
   * What this user has said they have access to.
   *
   * An empty result is a real and common state — a new account has ticked
   * nothing — and it is not the same as "everything". Anything filtering on it
   * has to decide what no answer means rather than treat it as no constraint.
   */
  async forUser(): Promise<Equipment[]> {
    const rows = await this.db.getAll<RawRow>(
      `SELECT q.* FROM equipment q
         JOIN user_equipment ue ON ue.equipment_id = q.id
        ORDER BY q.name ASC`,
    );
    return rows.map(toEquipment);
  }
}
