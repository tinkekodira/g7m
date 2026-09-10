/**
 * What a keystroke in a numeric field means.
 *
 * Pulled out of `Stepper` because the component could not be typed into. The
 * field was fully controlled from the number — `value={value.toFixed(1)}` —
 * so typing `5` into a weight put 5 into the parent, which came back as the
 * string `"5.0"`, which is a different string from what the input held. React
 * rewrites the field and drops the caret at the end, so the next keystroke
 * gives `"5.00"`, which parses to 5, which renders `"5.0"` again.
 *
 * The result is a field that cannot reach 50. Every digit after the first is
 * swallowed by a decimal point that arrived uninvited.
 *
 * The fix is that a field being typed into shows **the typist's own text**,
 * and only goes back to the formatted number once they leave. That needs one
 * decision made in one place: given what is now in the box, what should be
 * displayed, and what — if anything — should be reported upward.
 */

export interface Typed {
  /** What the field shows now: the text as entered, never reformatted. */
  readonly draft: string;
  /** The number to report, or null to leave the current value alone. */
  readonly value: number | null;
}

/**
 * Read a half-typed field.
 *
 * Null rather than a number in two cases that are easy to get wrong:
 *
 * An **empty** box is not zero. `Number('')` is 0, so clearing a weight to
 * type a new one used to set it to zero and, on a bodyweight-adjusted lift,
 * silently rewrite the set. It means "I have not said yet".
 *
 * A **partial** number is not a mistake. `"5."`, `"-"` and `"1e"` all appear
 * on the way to something valid, and the value simply waits.
 */
export function typed(text: string, min: number, max: number): Typed {
  // A comma is the decimal point in most of Europe, and an iOS decimal keypad
  // shows whichever one the locale uses.
  const cleaned = text.replace(',', '.').trim();
  if (cleaned === '') return { draft: text, value: null };

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return { draft: text, value: null };

  return { draft: text, value: Math.min(max, Math.max(min, parsed)) };
}

/**
 * What the field shows.
 *
 * The draft wins whenever there is one, which is exactly while the field has
 * focus. Formatting a number under the typist's hands is the whole bug.
 */
export function displayed(draft: string | null, value: number, decimals: number): string {
  return draft ?? value.toFixed(decimals);
}
