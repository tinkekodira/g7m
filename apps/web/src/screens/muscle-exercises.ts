/**
 * What the muscle panel has to show, separated from the markup that shows it.
 *
 * The judgement here is what counts as "nothing", and it was wrong. The panel
 * asked the database for prime movers only, and when a muscle had none it said
 * *"Nothing in the catalogue trains this as a prime mover"* — true, and a dead
 * end on eleven of the thirty-seven muscles in the taxonomy.
 *
 * The exercises existed the whole time. The rhomboids are in eight of them,
 * the middle trapezius six, the glute medius four, the shin two. Every one of
 * those rows was in `exercise_muscles` and none of it reached the screen,
 * because the query filtered to `role = 'primary'` and threw the rest away.
 *
 * A supporting muscle is a real answer to "what trains this". It is a
 * different answer from a prime mover, which is why it gets its own section
 * rather than being merged into one longer list.
 *
 * Stabilizers are deliberately left out. A stabilizer holds a joint still
 * while the lift happens somewhere else, which is not what somebody tapping a
 * muscle is asking about — and no muscle in the taxonomy depends on them to
 * have anything to show, so leaving them out costs nothing today.
 */
import type { Exercise } from '@g7m/db';

export interface MuscleSections {
  /** Prime movers that work more than one joint. */
  readonly compound: readonly Exercise[];
  /** Prime movers that work one. */
  readonly isolation: readonly Exercise[];
  /** Trains it, but as a supporting muscle rather than the main one. */
  readonly also: readonly Exercise[];
  /** Genuinely nothing to show. Much rarer than it used to be. */
  readonly empty: boolean;
}

/**
 * The three lists the panel draws.
 *
 * Order is preserved throughout: both queries come back sorted by recruitment
 * weight, so the exercise that trains a muscle hardest is already first and
 * re-sorting here would only lose that.
 */
export function sectionsFor(
  primary: readonly Exercise[],
  secondary: readonly Exercise[],
): MuscleSections {
  const compound = primary.filter((exercise) => exercise.mechanic === 'compound');
  const isolation = primary.filter((exercise) => exercise.mechanic === 'isolation');

  return {
    compound,
    isolation,
    also: secondary,
    // Counted from the lists that actually get drawn rather than from the
    // inputs. A prime mover whose mechanic matched neither bucket would
    // otherwise leave the panel claiming to have something and showing a gap.
    empty: compound.length + isolation.length + secondary.length === 0,
  };
}
