/**
 * How fast a held button repeats.
 *
 * Tapping `+` twenty-five times to get a set of reps from 5 to 30 is the kind
 * of thing an app makes somebody do once before they stop logging accessories
 * properly. Holding should do it.
 *
 * The schedule is the whole of the feel, and it is three numbers pulling
 * against each other:
 *
 * **The first wait has to be long enough that a tap is only ever a tap.** A
 * short hold delay makes the button fire twice for people who press deliberately
 * — which on a weight field means logging 55 kg when they meant 52.5.
 *
 * **The first repeats have to be slow enough to stop on.** Straight to full
 * speed and the number is past the one you wanted before you can lift a thumb.
 *
 * **And it has to reach a speed that is actually worth holding for.** A steady
 * 140 ms means five seconds to add twenty-five reps, which is not better than
 * tapping.
 *
 * So: wait, then start gently and accelerate to a floor. The curve is
 * exponential because that is what feels linear — the eye reads a constant
 * *proportional* change in speed as a smooth ramp.
 */

/** Held for less than this and nothing repeats at all. It was a tap. */
export const HOLD_DELAY_MS = 420;

/** The first repeat after the wait. Slow enough to release on the number you want. */
export const FIRST_REPEAT_MS = 150;

/** As fast as it ever goes. Below this the digits stop being readable. */
export const FASTEST_REPEAT_MS = 45;

/** How much of the previous interval each repeat keeps. */
const EASING = 0.82;

/**
 * The wait before the next step, given how many have already repeated.
 *
 * `0` is the gap between the press and the first repeat — the hold delay —
 * and everything after that accelerates toward the floor.
 */
export function repeatDelay(repeats: number): number {
  if (repeats <= 0) return HOLD_DELAY_MS;

  const eased = FIRST_REPEAT_MS * EASING ** (repeats - 1);
  return Math.max(FASTEST_REPEAT_MS, Math.round(eased));
}
