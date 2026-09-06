/**
 * What a set actually weighed, and whether it counts.
 *
 * A logged set stores one number in `weight_kg`, and that number means four
 * different things depending on `load_type`. Reading it as kilograms on the bar
 * every time is the single mistake that matters most here: it attributes **zero
 * volume to every pull-up, dip and press-up ever logged**, which is most of a
 * beginner's training and all of a calisthenics user's. ADR-0017 §12.5.2 is
 * where the column came from; this is the code that honours it.
 *
 * The other half of the problem is not knowing the lifter's bodyweight. Three
 * of the four load types are meaningless without it, and the honest answer is
 * `null` rather than nought — a total that silently omits half a session is
 * worse than one that says which sets it could not count.
 */

/** How to read the number in the weight field. Mirrors the CHECK in Postgres. */
export const LOAD_TYPES = ['external', 'bodyweight', 'bodyweight_plus', 'assisted'] as const;
export type LoadType = (typeof LOAD_TYPES)[number];

export const SET_TYPES = ['warmup', 'working', 'dropset', 'failure', 'amrap'] as const;
export type SetType = (typeof SET_TYPES)[number];

/**
 * What the weight field means to the person typing in it.
 *
 * Kept beside `effectiveLoadKg` on purpose. These two are the same fact stated
 * twice — once for arithmetic, once for a label — and a screen that asks for
 * "Weight" and then subtracts the answer from bodyweight is a bug nobody
 * reports, they just stop trusting the numbers.
 */
export const WEIGHT_FIELD_MEANING: Record<LoadType, string | null> = {
  external: 'Weight',
  /** No field at all: the load is the lifter, and there is nothing to type. */
  bodyweight: null,
  bodyweight_plus: 'Added',
  assisted: 'Assistance',
};

export interface LoggedSet {
  readonly setType: SetType;
  readonly loadType: LoadType;
  /** The number in the weight field. What it means depends on `loadType`. */
  readonly weightKg: number;
  readonly reps: number;
  readonly isCompleted: boolean;
}

/**
 * The load the lifter actually moved, in kilograms.
 *
 * `null` when it cannot be known — which is every bodyweight-derived type with
 * no bodyweight recorded. Callers must handle it; that is the point.
 *
 * `bodyweightKg` should come from the session's snapshot rather than the
 * profile's current value. A pull-up logged at 80 kg stays an 80 kg pull-up
 * after the lifter drops to 75, and re-deriving history from today's weight
 * would rewrite every past total each time somebody weighed themselves.
 */
export function effectiveLoadKg(
  set: Pick<LoggedSet, 'loadType' | 'weightKg'>,
  bodyweightKg: number | null,
): number | null {
  if (!Number.isFinite(set.weightKg) || set.weightKg < 0) return null;

  if (set.loadType === 'external') return set.weightKg;

  if (bodyweightKg === null || !Number.isFinite(bodyweightKg) || bodyweightKg <= 0) return null;

  switch (set.loadType) {
    case 'bodyweight':
      return bodyweightKg;
    case 'bodyweight_plus':
      return bodyweightKg + set.weightKg;
    case 'assisted':
      // Assistance greater than bodyweight is a data error rather than
      // negative weight. Clamping beats letting a mistyped 100 kg of band
      // assistance subtract volume from the rest of the session.
      return Math.max(0, bodyweightKg - set.weightKg);
  }
}

/**
 * Whether a set counts toward training volume.
 *
 * Completed, and not a warm-up. This is deliberately the same predicate as the
 * partial index in Postgres — `where is_completed and set_type <> 'warmup'` —
 * because a screen that counts sets the server's index does not is a screen
 * that disagrees with the progress charts built on top of it.
 *
 * Drop sets, failure sets and AMRAPs all count. They are working sets done
 * differently, not preparation.
 */
export function countsTowardVolume(set: Pick<LoggedSet, 'setType' | 'isCompleted'>): boolean {
  return set.isCompleted && set.setType !== 'warmup';
}

/** Load × reps for one set, or `null` when the load is unknown. */
export function setVolumeKg(set: LoggedSet, bodyweightKg: number | null): number | null {
  if (!countsTowardVolume(set)) return 0;
  if (!Number.isInteger(set.reps) || set.reps < 0) return null;

  const load = effectiveLoadKg(set, bodyweightKg);
  return load === null ? null : round2(load * set.reps);
}

export interface VolumeTotal {
  readonly volumeKg: number;
  /** Completed working sets that could be measured. */
  readonly countedSets: number;
  /**
   * Completed working sets whose load could not be worked out.
   *
   * Almost always "we do not know what you weigh". Surfaced rather than
   * swallowed so the screen can say so, because an unexplained total that is
   * lower than last week reads as lost progress.
   */
  readonly unknownSets: number;
}

export function totalVolumeKg(
  sets: readonly LoggedSet[],
  bodyweightKg: number | null,
): VolumeTotal {
  let volumeKg = 0;
  let countedSets = 0;
  let unknownSets = 0;

  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const volume = setVolumeKg(set, bodyweightKg);
    if (volume === null) {
      unknownSets += 1;
      continue;
    }
    volumeKg += volume;
    countedSets += 1;
  }

  return { volumeKg: round2(volumeKg), countedSets, unknownSets };
}

/**
 * The load type an exercise should default to, from the equipment it needs.
 *
 * Driven by equipment **category**, not by a list of slugs. A pull-up needs a
 * `pull-up-bar` and a dip needs a `dip-station`; neither mentions bodyweight,
 * but both are in the `bodyweight` category, and a rule written against slugs
 * would have to be extended every time a piece of kit is added — silently
 * logging the next one as an external 0 kg lift until somebody noticed.
 *
 * An exercise needing nothing at all is bodyweight by definition.
 */
export function naturalLoadType(equipmentCategories: readonly string[]): LoadType {
  if (equipmentCategories.length === 0) return 'bodyweight';
  return equipmentCategories.every((category) => category === 'bodyweight')
    ? 'bodyweight'
    : 'external';
}

/**
 * Whether a set carries enough load for a one-rep-max estimate to mean
 * anything, and what weight that estimate should be based on.
 *
 * Exists so no caller passes `weight_kg` straight into `estimateOneRepMax`.
 * A weighted pull-up at +20 kg is not a 20 kg lift, and a bodyweight-only set
 * is not a 0 kg lift — it is the one that would silently never produce a record.
 */
export function loadForOneRepMax(set: LoggedSet, bodyweightKg: number | null): number | null {
  if (!countsTowardVolume(set)) return null;
  return effectiveLoadKg(set, bodyweightKg);
}

/** Two decimal places. Kilograms are logged to 0.25 at best; 0.01 is generous. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
