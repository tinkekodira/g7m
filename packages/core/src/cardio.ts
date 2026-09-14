/**
 * Cardio on gym machines: what a bout records, and what it cost.
 *
 * A bout is one stretch on one machine — a 25-minute treadmill walk, or one
 * of eight 30-second air-bike sprints. It is stored as a set (ADR-0069), and
 * this module is everything that has to know the difference: which numbers a
 * machine's display offers, how they read in kilometres or miles, and the
 * calorie estimate.
 *
 * ## Calories
 *
 * Estimated from the best thing the bout says, in this order, with the
 * published equation for each (ACSM, *Guidelines for Exercise Testing and
 * Prescription*): oxygen cost in ml/kg/min, times bodyweight, at 5 kcal per
 * litre of oxygen.
 *
 *   treadmill      speed and incline — the ACSM walking or running equation.
 *   bike, rower,   average watts — the ACSM leg-ergometry equation. A rower or
 *   ski erg        ski erg with no watts but a distance gets them from its
 *                  pace, by Concept2's formula (watts = 2.80 / pace³), which is
 *                  what those monitors use.
 *   stair climber  floors per minute — the ACSM stepping equation.
 *   anything else  a MET value for the machine (Compendium of Physical
 *                  Activities), marked `rough` so the screen can say so.
 *
 * Resistance level never feeds an estimate: level 8 on one brand of bike is
 * not level 8 on another. The machine's own figure, when typed in, replaces
 * the estimate entirely — that is `caloriesKcal` on the bout.
 */
import type { UnitSystem } from './units.js';

export const CARDIO_KINDS = ['treadmill', 'bike', 'rower', 'ski_erg', 'stair_climber'] as const;
export type CardioKind = (typeof CARDIO_KINDS)[number];

export function isCardioKind(value: unknown): value is CardioKind {
  return typeof value === 'string' && (CARDIO_KINDS as readonly string[]).includes(value);
}

/** The optional numbers a bout can carry, beyond its time. */
export type BoutField = 'distance' | 'speed' | 'incline' | 'level' | 'watts' | 'floors';

/**
 * What each machine's display shows, in the order the logger offers it.
 *
 * A field a machine does not have is not offered at all, rather than offered
 * and left blank: a stair climber has no distance, and a box asking for one
 * reads as a question the lifter is failing to answer.
 */
export const BOUT_FIELDS: Readonly<Record<CardioKind, readonly BoutField[]>> = {
  treadmill: ['distance', 'speed', 'incline'],
  bike: ['distance', 'level', 'watts'],
  rower: ['distance', 'watts'],
  ski_erg: ['distance', 'watts'],
  stair_climber: ['floors', 'level'],
};

export interface Bout {
  readonly durationSeconds: number | null;
  readonly distanceM: number | null;
  readonly speedKmh: number | null;
  readonly inclinePercent: number | null;
  readonly resistanceLevel: number | null;
  readonly avgWatts: number | null;
  readonly floors: number | null;
  /** The machine's own figure. When present it is the answer, not an input. */
  readonly caloriesKcal: number | null;
}

export const EMPTY_BOUT: Bout = {
  durationSeconds: null,
  distanceM: null,
  speedKmh: null,
  inclinePercent: null,
  resistanceLevel: null,
  avgWatts: null,
  floors: null,
  caloriesKcal: null,
};

/**
 * A finished bout as history reads it: which workout, when that workout
 * began, on what machine, and the bodyweight the workout was logged at.
 *
 * Placed by its session's start, like every set in the progress charts, so a
 * bout and the lifting after it land in the same day's column.
 */
export interface LoggedBout {
  readonly sessionId: string;
  readonly performedAt: Date;
  readonly kind: CardioKind;
  readonly bout: Bout;
  readonly bodyweightKg: number | null;
}

export type CalorieMethod = 'machine' | 'treadmill' | 'power' | 'pace' | 'stairs' | 'met';

export interface Calories {
  readonly kcal: number;
  /** Where the number came from, so the screen can say "from the machine". */
  readonly method: CalorieMethod;
  /** A MET table guess rather than an equation fed by the bout's own numbers. */
  readonly rough: boolean;
}

/**
 * MET values for a bout with nothing better to go on (Compendium of Physical
 * Activities, 2011): treadmill at a brisk walk, and "general" or "moderate"
 * effort for the rest.
 */
const FALLBACK_MET: Readonly<Record<CardioKind, number>> = {
  treadmill: 5.0,
  bike: 6.8,
  rower: 7.0,
  ski_erg: 6.8,
  stair_climber: 9.0,
};

/** kcal per litre of oxygen, the standard conversion. */
const KCAL_PER_LITRE_O2 = 5;

/** ACSM walking applies below this; running above. 8 km/h, in m/min. */
const RUNNING_FROM_M_PER_MIN = 134;

/** A floor on a stair climber: sixteen steps of about 20 cm. */
const STEPS_PER_FLOOR = 16;
const STEP_HEIGHT_M = 0.2;

/**
 * The calories of one bout, or null when there is not enough to say.
 *
 * Needs a time and a bodyweight. The bodyweight is the session's snapshot,
 * not the profile's current one, so a bout logged in March does not change
 * its calories when the lifter weighs less in June.
 */
export function boutCalories(
  kind: CardioKind,
  bout: Bout,
  bodyweightKg: number | null,
): Calories | null {
  if (bout.caloriesKcal !== null && bout.caloriesKcal > 0) {
    return { kcal: Math.round(bout.caloriesKcal), method: 'machine', rough: false };
  }
  const seconds = bout.durationSeconds ?? 0;
  if (seconds <= 0 || bodyweightKg === null || bodyweightKg <= 0) return null;
  const minutes = seconds / 60;

  const fromVo2 = (vo2: number, method: CalorieMethod): Calories => ({
    kcal: Math.round(((vo2 * bodyweightKg) / 1000) * KCAL_PER_LITRE_O2 * minutes),
    method,
    rough: false,
  });

  switch (kind) {
    case 'treadmill': {
      const metresPerMinute =
        bout.speedKmh !== null && bout.speedKmh > 0
          ? (bout.speedKmh * 1000) / 60
          : bout.distanceM !== null && bout.distanceM > 0
            ? bout.distanceM / minutes
            : null;
      if (metresPerMinute === null) break;
      // The equations are for level ground and uphill. A decline is scored as
      // flat: underestimating a downhill walk is the honest direction.
      const grade = Math.max(0, (bout.inclinePercent ?? 0) / 100);
      const vo2 =
        metresPerMinute < RUNNING_FROM_M_PER_MIN
          ? 0.1 * metresPerMinute + 1.8 * metresPerMinute * grade + 3.5
          : 0.2 * metresPerMinute + 0.9 * metresPerMinute * grade + 3.5;
      return fromVo2(vo2, 'treadmill');
    }

    case 'bike':
    case 'rower':
    case 'ski_erg': {
      const watts =
        bout.avgWatts !== null && bout.avgWatts > 0
          ? { value: bout.avgWatts, method: 'power' as const }
          : kind !== 'bike' && bout.distanceM !== null && bout.distanceM > 0
            ? { value: wattsFromPace(seconds / bout.distanceM), method: 'pace' as const }
            : null;
      if (watts === null) break;
      // Work rate in kg·m/min is watts × 6.12.
      const vo2 = (1.8 * watts.value * 6.12) / bodyweightKg + 7;
      return fromVo2(vo2, watts.method);
    }

    case 'stair_climber': {
      if (bout.floors === null || bout.floors <= 0) break;
      const stepsPerMinute = (bout.floors * STEPS_PER_FLOOR) / minutes;
      const vo2 = 0.2 * stepsPerMinute + 1.33 * 1.8 * STEP_HEIGHT_M * stepsPerMinute + 3.5;
      return fromVo2(vo2, 'stairs');
    }
  }

  return {
    kcal: Math.round(FALLBACK_MET[kind] * bodyweightKg * (minutes / 60)),
    method: 'met',
    rough: true,
  };
}

/**
 * How far up a bout went, in metres: a treadmill's incline over its distance,
 * or a stair climber's floors. Nothing else on the list climbs. For Everest
 * (ADR-0072).
 *
 * Distance times grade, which is the rise to within a percent at any incline
 * a treadmill goes to. A decline climbs nothing rather than subtracting.
 */
export function boutClimbM(kind: CardioKind, bout: Bout): number {
  if (kind === 'treadmill') {
    const grade = Math.max(0, (bout.inclinePercent ?? 0) / 100);
    return Math.max(0, bout.distanceM ?? 0) * grade;
  }
  if (kind === 'stair_climber') {
    return Math.max(0, bout.floors ?? 0) * STEPS_PER_FLOOR * STEP_HEIGHT_M;
  }
  return 0;
}

/** Concept2's pace-to-power formula; pace in seconds per metre. */
export function wattsFromPace(secondsPerMetre: number): number {
  if (!(secondsPerMetre > 0)) return 0;
  return 2.8 / secondsPerMetre ** 3;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export const METRES_PER_MILE = 1609.344;

/**
 * How a machine's distance is spoken.
 *
 * Rowers and ski ergs are metres everywhere — a 2,000 m test is a 2,000 m
 * test in Ohio too — so they ignore the unit setting. Everything else follows
 * it: kilometres or miles.
 */
export type DistanceUnit = 'm' | 'km' | 'mi';

export function distanceUnitFor(kind: CardioKind, unitSystem: UnitSystem): DistanceUnit {
  if (kind === 'rower' || kind === 'ski_erg') return 'm';
  return unitSystem === 'imperial' ? 'mi' : 'km';
}

export function metresToUnit(metres: number, unit: DistanceUnit): number {
  if (unit === 'm') return metres;
  return unit === 'km' ? metres / 1000 : metres / METRES_PER_MILE;
}

export function unitToMetres(value: number, unit: DistanceUnit): number {
  if (unit === 'm') return Math.round(value);
  return Math.round(unit === 'km' ? value * 1000 : value * METRES_PER_MILE);
}

/** "5.2 km", "3.1 mi", "2,000 m". Two decimals only under ten, where they matter. */
export function formatDistance(metres: number, unit: DistanceUnit): string {
  const value = metresToUnit(metres, unit);
  if (unit === 'm') return `${Math.round(value).toLocaleString('en-GB')} m`;
  const decimals = value < 10 ? 2 : 1;
  return `${trimZeros(value.toFixed(decimals))} ${unit}`;
}

export type SpeedUnit = 'km/h' | 'mph';

export function speedUnitFor(unitSystem: UnitSystem): SpeedUnit {
  return unitSystem === 'imperial' ? 'mph' : 'km/h';
}

export function kmhToUnit(kmh: number, unit: SpeedUnit): number {
  return unit === 'km/h' ? kmh : (kmh * 1000) / METRES_PER_MILE;
}

export function unitToKmh(value: number, unit: SpeedUnit): number {
  const kmh = unit === 'km/h' ? value : (value * METRES_PER_MILE) / 1000;
  return Math.round(kmh * 10) / 10;
}

/**
 * The pace worth showing for a bout, or null.
 *
 * A rower's is the 500 m split, which is what every rower's monitor shows; a
 * treadmill's is minutes per kilometre or mile. The others have none worth
 * saying — a bike's "distance" is the display's fiction, and pace per floor
 * is not a thing anybody means.
 */
export function boutPace(kind: CardioKind, bout: Bout, unitSystem: UnitSystem): string | null {
  const seconds = bout.durationSeconds ?? 0;
  const metres = bout.distanceM ?? 0;
  if (seconds <= 0 || metres <= 0) return null;
  if (kind === 'rower' || kind === 'ski_erg') {
    return `${formatDuration((seconds / metres) * 500)} /500 m`;
  }
  if (kind === 'treadmill') {
    const unit = unitSystem === 'imperial' ? 'mi' : 'km';
    return `${formatDuration(seconds / metresToUnit(metres, unit))} /${unit}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** "25:00", "1:02:30", "0:45". Whole seconds, rounded. */
export function formatDuration(totalSeconds: number): string {
  const whole = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours > 0
    ? `${String(hours)}:${String(minutes).padStart(2, '0')}:${ss}`
    : `${String(minutes)}:${ss}`;
}

/**
 * A typed time, in seconds, or null when it is not one.
 *
 * `25` is minutes — nobody types a treadmill session in seconds — and `25:30`
 * or `1:05:00` are read as a display shows them. Seconds and minutes after a
 * colon must be under sixty, or it is a typo, not a time.
 */
export function parseDuration(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const minutes = Number(trimmed);
    return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null;
  }
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3 || !parts.every((part) => /^\d+$/.test(part))) {
    return null;
  }
  const numbers = parts.map(Number);
  const [first = 0, second = 0, third] = numbers;
  if (third === undefined) {
    if (second >= 60) return null;
    const total = first * 60 + second;
    return total > 0 ? total : null;
  }
  if (second >= 60 || third >= 60) return null;
  const total = first * 3600 + second * 60 + third;
  return total > 0 ? total : null;
}

function trimZeros(fixed: string): string {
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
}
