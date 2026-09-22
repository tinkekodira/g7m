/**
 * What this device remembers about the plate calculator: which plates this
 * gym has, and what its EZ bar actually weighs.
 *
 * Kept on this device, the same way the theme is (`theme.ts`) — a gym's rack
 * is a fact about where you are training, not about the lifter, and a phone
 * carried to one gym has no reason to know about another's. There is also
 * nothing here PowerSync would gain from syncing: it is read once per visit
 * to one screen, not built into any other calculation the server needs to
 * agree with.
 */
import { ALL_PLATE_SLOTS, DEFAULT_EZ_BAR_WEIGHT, PLATE_SLOTS, type PlateSlot } from '@g7m/core';

export const PLATE_SETTINGS_STORAGE_KEY = 'g7m.plates';

export interface PlateCalculatorSettings {
  readonly availableSlots: ReadonlySet<PlateSlot>;
  readonly ezBarWeightKg: number;
  readonly ezBarWeightLb: number;
}

export const DEFAULT_PLATE_SETTINGS: PlateCalculatorSettings = {
  availableSlots: ALL_PLATE_SLOTS,
  ezBarWeightKg: DEFAULT_EZ_BAR_WEIGHT.kg,
  ezBarWeightLb: DEFAULT_EZ_BAR_WEIGHT.lb,
};

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface StoredShape {
  readonly slots?: unknown;
  readonly ezKg?: unknown;
  readonly ezLb?: unknown;
}

function isPlateSlot(value: unknown): value is PlateSlot {
  return typeof value === 'string' && (PLATE_SLOTS as readonly string[]).includes(value);
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * The stored settings, or the defaults.
 *
 * Anything malformed — a corrupted value, a slot that no longer exists, an
 * empty list — falls back to its own default field rather than failing the
 * whole read, and storage that throws (private browsing, a WebView with it
 * switched off) reads as the defaults rather than a crash.
 */
export function readPlateSettings(
  storage: SettingsStorage | undefined = globalThis.localStorage,
): PlateCalculatorSettings {
  try {
    const raw = storage?.getItem(PLATE_SETTINGS_STORAGE_KEY);
    if (raw === null || raw === undefined) return DEFAULT_PLATE_SETTINGS;

    const parsed = JSON.parse(raw) as StoredShape;
    const slots = Array.isArray(parsed.slots) ? parsed.slots.filter(isPlateSlot) : [];
    const availableSlots: ReadonlySet<PlateSlot> =
      slots.length > 0 ? new Set(slots) : DEFAULT_PLATE_SETTINGS.availableSlots;

    return {
      availableSlots,
      ezBarWeightKg: isPositiveFinite(parsed.ezKg)
        ? parsed.ezKg
        : DEFAULT_PLATE_SETTINGS.ezBarWeightKg,
      ezBarWeightLb: isPositiveFinite(parsed.ezLb)
        ? parsed.ezLb
        : DEFAULT_PLATE_SETTINGS.ezBarWeightLb,
    };
  } catch {
    return DEFAULT_PLATE_SETTINGS;
  }
}

/** Remember a choice. Failing to is not worth an error: the screen still works this visit. */
export function writePlateSettings(
  settings: PlateCalculatorSettings,
  storage: SettingsStorage | undefined = globalThis.localStorage,
): void {
  try {
    const body: Required<StoredShape> = {
      slots: [...settings.availableSlots],
      ezKg: settings.ezBarWeightKg,
      ezLb: settings.ezBarWeightLb,
    };
    storage?.setItem(PLATE_SETTINGS_STORAGE_KEY, JSON.stringify(body));
  } catch {
    // Storage full or switched off. The choice lasts until the page does.
  }
}
