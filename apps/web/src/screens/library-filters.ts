/**
 * The library's filters live in the URL.
 *
 * Not in component state, for three reasons that all come from this being a
 * phone app: the back button undoes a filter instead of leaving the library,
 * the state survives the page reload the update banner asks for, and a
 * filtered list is a thing you can send to someone.
 *
 * Pure, and tested, because the round trip is the part that silently rots —
 * a filter that writes a parameter it cannot read back is a screen that
 * forgets what you asked for every time you open an exercise and come back.
 */
import type { ExerciseFilter } from '@g7m/db';

/**
 * Short keys, because this string ends up in a hash fragment that people see.
 * `?q=press&muscle=chest` reads; `?searchQuery=press` does not read better.
 */
export const PARAM_QUERY = 'q';
export const PARAM_GROUP = 'muscle';
export const PARAM_EQUIPMENT = 'gear';

export interface LibraryFilters {
  /** Free text. Ranked by the same code the server search uses. */
  readonly query: string;
  /** A muscle group slug, or null for all of them. */
  readonly muscleGroup: string | null;
  /** Equipment slugs. Empty means the user has not narrowed by equipment. */
  readonly equipment: readonly string[];
}

export const NO_FILTERS: LibraryFilters = { query: '', muscleGroup: null, equipment: [] };

export function readFilters(params: URLSearchParams): LibraryFilters {
  const equipment = params.get(PARAM_EQUIPMENT);
  return {
    query: params.get(PARAM_QUERY) ?? '',
    muscleGroup: params.get(PARAM_GROUP),
    // Comma-separated rather than a repeated key: it survives being typed by a
    // human and keeps the URL short enough to read.
    equipment:
      equipment === null || equipment === '' ? [] : equipment.split(',').filter((s) => s !== ''),
  };
}

/**
 * The inverse, with defaults left out.
 *
 * Omitting them matters: a URL that carries `?q=&muscle=` for the unfiltered
 * library makes every history entry look different from every other one, so
 * the back button walks through states the user never chose.
 */
export function writeFilters(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim() !== '') params.set(PARAM_QUERY, filters.query);
  if (filters.muscleGroup !== null) params.set(PARAM_GROUP, filters.muscleGroup);
  if (filters.equipment.length > 0) params.set(PARAM_EQUIPMENT, filters.equipment.join(','));
  return params;
}

export function hasFilters(filters: LibraryFilters): boolean {
  return (
    filters.query.trim() !== '' || filters.muscleGroup !== null || filters.equipment.length > 0
  );
}

/**
 * Turn the screen's filters into the repository's, given the ids behind the
 * slugs the URL carries.
 *
 * **An empty selection means no constraint here**, which is deliberately not
 * what `ExerciseFilter` means by an empty array. In the repository,
 * `equipmentIds: []` asks for exercises needing no equipment at all — the
 * hotel-room question. On screen, no chips lit is plainly "I have not narrowed
 * by equipment", and translating that into "show me things needing nothing"
 * would empty the list the moment someone cleared a filter. So the field is
 * omitted instead, and the two meanings stay separate.
 *
 * A slug with no matching id is dropped rather than passed through, because an
 * unknown id would silently filter everything away. That happens for real: a
 * link shared from a newer build, or a bookmark from before a rename.
 */
export function toExerciseFilter(
  filters: LibraryFilters,
  muscleGroupIdBySlug: ReadonlyMap<string, string>,
  equipmentIdBySlug: ReadonlyMap<string, string>,
): ExerciseFilter {
  const groupId =
    filters.muscleGroup === null ? undefined : muscleGroupIdBySlug.get(filters.muscleGroup);
  const equipmentIds = filters.equipment
    .map((slug) => equipmentIdBySlug.get(slug))
    .filter((id): id is string => id !== undefined);

  return {
    ...(groupId === undefined ? {} : { muscleGroupIds: [groupId] }),
    ...(equipmentIds.length === 0 ? {} : { equipmentIds }),
  };
}

/** Toggling one chip, without mutating the array behind it. */
export function toggleEquipment(filters: LibraryFilters, slug: string): LibraryFilters {
  const equipment = filters.equipment.includes(slug)
    ? filters.equipment.filter((item) => item !== slug)
    : [...filters.equipment, slug];
  return { ...filters, equipment };
}
