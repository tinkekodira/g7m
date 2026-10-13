/**
 * The lifter's own rest times, one for compound lifts and one for isolation
 * lifts, as chosen in Settings. Also how much the rest bar's minus and plus
 * change a rest by, and whether it makes a sound when rest is over.
 *
 * Off by default, and off means exactly what the timer did before this
 * existed: each exercise's own suggestion (`restSecondsFor`). On, the two
 * numbers here win over everything — see the precedence there.
 *
 * Kept on this device, the way the theme and the plate calculator are, rather
 * than on the synced profile. A profile column would follow somebody to a new
 * phone, but it needs a migration and a sync-rules redeploy before the app can
 * write it, and an app that ships ahead of either jams its own upload queue on
 * the first write. Two numbers are cheap to set again; a stuck queue is not.
 */
import { MAX_REST_SECONDS, REST_SECONDS_COMPOUND, REST_SECONDS_ISOLATION } from '@g7m/core';

export const REST_SETTINGS_STORAGE_KEY = 'g7m.rest';

/** The steppers' range and step. Fifteen seconds is as fine as rest is ever counted. */
export const REST_STEP_SECONDS = 15;
export const REST_MIN_SECONDS = 15;
export const REST_MAX_SECONDS = Math.min(600, MAX_REST_SECONDS);

/**
 * The rest bar's minus and plus: how much one press takes off or adds.
 *
 * Five-second steps, finer than the rest times above, because the asks were
 * 15, 20, 30 and 45 and twenty is not on a fifteen-second step. Two minutes is
 * the most, since past that it is a different rest, not an adjusted one.
 */
export const REST_ADJUST_STEP_SECONDS = 5;
export const REST_ADJUST_MIN_SECONDS = 5;
export const REST_ADJUST_MAX_SECONDS = 120;

export type Mechanic = 'compound' | 'isolation';

export interface RestSettings {
  /** Whether the two times below are in use at all. */
  readonly custom: boolean;
  readonly compound: number;
  readonly isolation: number;
  /** What the rest bar's minus and plus take off and add, in seconds. */
  readonly adjust: number;
  /** Whether rest being over makes a sound as well as a buzz. */
  readonly sound: boolean;
}

export const DEFAULT_REST_SETTINGS: RestSettings = {
  custom: false,
  compound: REST_SECONDS_COMPOUND,
  isolation: REST_SECONDS_ISOLATION,
  // What the one button did before it could be changed.
  adjust: 30,
  // On: a sound is the point of having one. Settings turns it off.
  sound: true,
};

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface StoredShape {
  readonly custom?: unknown;
  readonly compound?: unknown;
  readonly isolation?: unknown;
  readonly adjust?: unknown;
  readonly sound?: unknown;
}

/** Inside the steppers' range, on their step. Anything else is not a time. */
export function tidyRestSeconds(seconds: number): number | null {
  if (!Number.isFinite(seconds)) return null;
  const stepped = Math.round(seconds / REST_STEP_SECONDS) * REST_STEP_SECONDS;
  return Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, stepped));
}

/** Inside the rest bar's range, on its step. Anything else is not a step. */
export function tidyAdjustSeconds(seconds: number): number | null {
  if (!Number.isFinite(seconds)) return null;
  const stepped = Math.round(seconds / REST_ADJUST_STEP_SECONDS) * REST_ADJUST_STEP_SECONDS;
  return Math.min(REST_ADJUST_MAX_SECONDS, Math.max(REST_ADJUST_MIN_SECONDS, stepped));
}

function storedSeconds(value: unknown, fallback: number): number {
  return typeof value === 'number' ? (tidyRestSeconds(value) ?? fallback) : fallback;
}

function storedAdjust(value: unknown): number {
  return typeof value === 'number'
    ? (tidyAdjustSeconds(value) ?? DEFAULT_REST_SETTINGS.adjust)
    : DEFAULT_REST_SETTINGS.adjust;
}

/**
 * The stored settings, or the defaults.
 *
 * A malformed field falls back on its own, and storage that throws (private
 * browsing, a WebView with it switched off) reads as the defaults.
 */
export function readRestSettings(
  storage: SettingsStorage | undefined = globalThis.localStorage,
): RestSettings {
  try {
    const raw = storage?.getItem(REST_SETTINGS_STORAGE_KEY);
    if (raw === null || raw === undefined) return DEFAULT_REST_SETTINGS;
    const parsed = JSON.parse(raw) as StoredShape;
    return {
      custom: parsed.custom === true,
      compound: storedSeconds(parsed.compound, DEFAULT_REST_SETTINGS.compound),
      isolation: storedSeconds(parsed.isolation, DEFAULT_REST_SETTINGS.isolation),
      adjust: storedAdjust(parsed.adjust),
      // Only an explicit off is off: settings saved before the switch existed
      // have no field, and they get the sound like everybody else.
      sound: parsed.sound !== false,
    };
  } catch {
    return DEFAULT_REST_SETTINGS;
  }
}

/** Remember a choice. Failing to is not worth an error: it still holds this visit. */
export function writeRestSettings(
  settings: RestSettings,
  storage: SettingsStorage | undefined = globalThis.localStorage,
): void {
  try {
    const body: Required<StoredShape> = {
      custom: settings.custom,
      compound: settings.compound,
      isolation: settings.isolation,
      adjust: settings.adjust,
      sound: settings.sound,
    };
    storage?.setItem(REST_SETTINGS_STORAGE_KEY, JSON.stringify(body));
  } catch {
    // Storage full or switched off. The choice lasts until the page does.
  }
}

/** The time to hand `restSecondsFor` as the lifter's choice, or null for none. */
export function chosenRestSeconds(settings: RestSettings, mechanic: Mechanic): number | null {
  return settings.custom ? settings[mechanic] : null;
}

/**
 * A step as the rest bar's buttons say it: "30s" under a minute, "1:30" from
 * one up, the way the timer beside them reads.
 */
export function formatAdjust(seconds: number): string {
  if (seconds < 60) return `${String(seconds)}s`;
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}
