/**
 * The equipment catalogue: reference data, read-only like the rest of it.
 */
import { equipmentName, intlLocale } from '@g7m/i18n';
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
    name: equipmentName(readString(row, 'slug', '')) ?? readString(row, 'name', ''),
    category: readEnum(row, 'category', EQUIPMENT_CATEGORIES, 'other'),
  };
}

const LIST_ORDER = 'ORDER BY name ASC';

export class EquipmentRepository {
  constructor(private readonly db: QueryableDatabase) {}

  /** Everything the catalogue knows about, alphabetically. */
  async list(): Promise<Equipment[]> {
    const rows = await this.db.getAll<RawRow>(`SELECT * FROM equipment ${LIST_ORDER}`);
    // Sorted again by the name as shown: SQL only has the English one.
    return rows
      .map(toEquipment)
      .sort((a, b) => a.name.localeCompare(b.name, intlLocale(), { sensitivity: 'base' }));
  }

  async byId(id: string): Promise<Equipment | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM equipment WHERE id = ?', [id]);
    return row === null ? null : toEquipment(row);
  }

  async bySlug(slug: string): Promise<Equipment | null> {
    const row = await this.db.getOptional<RawRow>('SELECT * FROM equipment WHERE slug = ?', [slug]);
    return row === null ? null : toEquipment(row);
  }
}
