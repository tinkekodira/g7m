/**
 * Bringing a newly added exercise into view.
 *
 * Adding an exercise goes to the library and back, and the workout screen that
 * comes back is a fresh one, scrolled to the top. Add the fifth exercise and
 * you land on the first, then scroll past four to find the one you just chose —
 * which is the one you are about to use.
 *
 * The library knows exactly which entry it created: `addExercise` returns it.
 * It was being thrown away at the moment it was needed. Now it travels back as
 * navigation state, and the workout screen scrolls to it once it is drawn.
 */

/** The state the library hands back. */
export interface AddedExerciseState {
  readonly added: string;
}

export function addedState(entryId: string): AddedExerciseState {
  return { added: entryId };
}

/**
 * The id of an exercise that has just been added, from `location.state`.
 *
 * Validated rather than cast. Navigation state is whatever the last
 * `navigate` call put there — any screen, any shape, or a history entry
 * restored after a reload — and treating it as trusted is how a stray object
 * becomes an attempt to scroll to `[object Object]`.
 */
export function addedExerciseId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  const added: unknown = (state as { added?: unknown }).added;
  return typeof added === 'string' && added !== '' ? added : null;
}

/**
 * The exercise to scroll to: the one just added, once it is on screen.
 *
 * Null until it is actually among the rendered entries. The workout is read
 * asynchronously, so on the first render after coming back the new entry may
 * not exist yet — and scrolling to an element that is not there does nothing
 * and then never happens, because the moment has passed.
 */
export function exerciseToReveal(state: unknown, entryIds: readonly string[]): string | null {
  const added = addedExerciseId(state);
  return added !== null && entryIds.includes(added) ? added : null;
}

/**
 * Coming back from the library without adding anything.
 *
 * Somebody who opened "+ Add an exercise" and changed their mind was at the
 * bottom of the workout, where that link is. Back used to land them on a fresh
 * screen scrolled to the top, a long scroll from where they were and from
 * Finish. Back now says where it came from, and the workout returns to its
 * end.
 */
export interface BackFromAddingState {
  readonly backFromAdding: true;
}

export function backFromAddingState(): BackFromAddingState {
  return { backFromAdding: true };
}

/** Whether `location.state` says the library was left without adding. Validated, not cast. */
export function cameBackFromAdding(state: unknown): boolean {
  if (typeof state !== 'object' || state === null) return false;
  return (state as { backFromAdding?: unknown }).backFromAdding === true;
}

/** The DOM id of the end of the workout: "+ Add an exercise" and the buttons under it. */
export const WORKOUT_END_ANCHOR = 'workout-end';

/** The DOM id an exercise card carries, so it can be found to scroll to. */
export function exerciseAnchor(entryId: string): string {
  return `exercise-${entryId}`;
}

/**
 * The DOM id a set row carries, so a superset can bring the next exercise's
 * set into view after a tick.
 */
export function setAnchor(setId: string): string {
  return `set-${setId}`;
}
