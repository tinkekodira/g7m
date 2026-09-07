/**
 * The arithmetic behind a segmented slider: where the thumb sits, and which
 * stop it will lock to when the finger comes off.
 *
 * Pulled out of the component because it is the only part with a wrong answer.
 * Rendering is checked by looking at it; `Math.floor(f * stops)` versus
 * `Math.round(f * (stops - 1))` is an off-by-one that looks fine in a
 * screenshot and picks the wrong option a quarter of the time.
 *
 * ## Two numbers that must agree
 *
 * `stopAt` answers *what is selected* and `thumbOffset` answers *where the pill
 * is drawn*. If they disagree the control lies: the pill sits over one word
 * while a different word is highlighted, and releasing makes it jump somewhere
 * the finger never was.
 *
 * They agree by construction. The track is cut into one cell per stop, so the
 * selected cell is `floor(fraction * stops)`; the pill is drawn centred on the
 * finger, which in cell units is at exactly `fraction * stops`. The pill is
 * therefore always drawn inside the cell it names — except where it is pinned
 * at an end, and there the cell it names is that end. `slider-track.test.ts`
 * asserts that as a property rather than trusting the paragraph above.
 */

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * Where along the track a pointer landed: 0 at the left edge, 1 at the right.
 *
 * Clamped, because a pointer that has been captured keeps reporting positions
 * after it leaves the element — which is exactly what should happen, and it is
 * this function's job to stop the pill leaving with it.
 */
export function trackFraction(clientX: number, left: number, width: number): number {
  // A zero-width rect means the control has not been laid out yet. Answering 0
  // is wrong but harmless; dividing by it is not.
  if (width <= 0) return 0;
  return clamp((clientX - left) / width, 0, 1);
}

/**
 * The stop under the finger.
 *
 * The track is cut into equal cells, one per stop, so the boundaries fall
 * exactly where the reader sees them — between two words. Tapping a word
 * selects that word, which a nearest-stop mapping would not do: with three
 * stops it puts the boundaries at the quarter points, and a tap 30% along
 * lands on the first word and selects the second.
 */
export function stopAt(fraction: number, stops: number): number {
  if (stops <= 1) return 0;
  // `floor` gives `stops` exactly at fraction 1, which is the one case the
  // clamp is load-bearing rather than defensive.
  return clamp(Math.floor(clamp(fraction, 0, 1) * stops), 0, stops - 1);
}

/**
 * How far the pill has travelled, measured in its own widths.
 *
 * The pill is one cell wide, so this runs 0 to `stops - 1` and the component
 * can hand it straight to `translateX(n * 100%)`.
 *
 * The half-width shift centres the pill on the finger rather than starting it
 * there; without it the finger holds the pill's left edge, which feels like
 * dragging something by its corner. Clamping is what pins the pill at either
 * end while the finger carries on past — the behaviour that makes the ends
 * reachable without precision.
 */
export function thumbOffset(fraction: number, stops: number): number {
  if (stops <= 1) return 0;
  return clamp(clamp(fraction, 0, 1) * stops - 0.5, 0, stops - 1);
}
