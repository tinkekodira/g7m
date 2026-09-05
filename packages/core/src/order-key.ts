/**
 * Ordering keys for user-reorderable lists.
 *
 * Every ordered list in this app — the exercises in a routine, the sets under
 * an exercise — is ordered by a lexicographic `order_key text`, never by an
 * integer index. That choice is forced by offline editing:
 *
 *   · An integer index makes every insert a rewrite of all its siblings. On a
 *     sync engine that ships row-level changes, dragging one exercise to the
 *     top of a routine becomes ten row updates, ten conflicts to resolve, and
 *     ten chances to lose one.
 *   · Two devices editing offline mint the same integers, and row-level
 *     last-write-wins cannot repair that: whichever syncs second wins outright,
 *     and the other device's reorder silently vanishes.
 *
 * With a fractional key, an insert is a *single-row write* that touches nothing
 * else, so two offline devices reordering different parts of the same list both
 * survive the merge.
 *
 * See DECISIONS.md ADR-0017 §12.5.4.
 *
 * ## Why base 36, lowercase
 *
 * The obvious alphabet is base 62 — digits, uppercase, lowercase — because it
 * packs the most order into the fewest characters. It is also a trap. Postgres
 * compares `text` under the database collation, and under a typical
 * `en_US.UTF-8` collation `'a' < 'B'`, which is not ASCII order. SQLite, where
 * the same keys are read offline, compares bytes. Mixed case would mean the two
 * databases disagree about the order of the same list.
 *
 * Digits plus lowercase has no case to fold, so it sorts identically under
 * every collation we could plausibly meet. The cost is 5.2 bits per character
 * instead of 5.95 — irrelevant for lists of tens of items.
 *
 * ## Key length
 *
 * Repeatedly appending to the end grows the key by one character roughly every
 * five appends, because each append bisects the space that is left. A hundred
 * sets logged one after another on a single exercise would reach about twenty
 * characters. `text` has no length limit and nobody logs a hundred sets on one
 * exercise, so the simple scheme is kept over the "integer part" refinement
 * that would hold appends at constant length.
 */

/**
 * Ordered smallest to largest, and — importantly — in the same order as the
 * bytes that represent them.
 */
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
const BASE = DIGITS.length;
const SMALLEST = '0';

/** Whether a string is a well-formed order key. */
export function isOrderKey(value: string): boolean {
  if (value.length === 0) return false;
  // A trailing smallest-digit is banned, not merely unusual: 'a' and 'a0'
  // compare as adjacent with no room between them, so a key ending in '0'
  // is one nobody can ever insert before.
  if (value.endsWith(SMALLEST)) return false;
  for (const character of value) {
    if (!DIGITS.includes(character)) return false;
  }
  return true;
}

function digitValue(key: string, index: number): number {
  const character = key[index];
  // Past the end of a key, treat it as padded with the smallest digit. This is
  // what makes 'a' and 'a00…' compare as the same point on the line.
  if (character === undefined) return 0;
  const value = DIGITS.indexOf(character);
  if (value < 0) throw new RangeError(`not an order key: ${JSON.stringify(key)}`);
  return value;
}

function digitCharacter(value: number): string {
  const character = DIGITS[value];
  if (character === undefined) throw new RangeError(`digit out of range: ${String(value)}`);
  return character;
}

/**
 * A key strictly between `a` and `b`, where an empty `a` means "before
 * everything" and a null `b` means "after everything".
 */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) {
    throw new RangeError(`order keys are not in ascending order: ${a} >= ${b}`);
  }
  if (a.endsWith(SMALLEST) || b?.endsWith(SMALLEST) === true) {
    throw new RangeError('an order key must not end with the smallest digit');
  }

  if (b !== null) {
    // Whatever the two keys agree on is not where the answer lives. Strip the
    // shared prefix and solve the smaller problem.
    let shared = 0;
    while (shared < b.length && (a[shared] ?? SMALLEST) === b[shared]) shared += 1;
    if (shared > 0) return b.slice(0, shared) + midpoint(a.slice(shared), b.slice(shared));
  }

  const low = digitValue(a, 0);
  const high = b === null ? BASE : digitValue(b, 0);

  // Room for a digit between them: take it, and we are done in one character.
  if (high - low > 1) return digitCharacter(Math.round((low + high) / 2));

  // The two digits are adjacent, so this position is full. Descend a level.
  //
  // When `b` has more characters, its own first digit is already strictly
  // greater than `a`'s, so borrowing just that digit lands between the two.
  if (b !== null && b.length > 1) return b.slice(0, 1);

  // Otherwise stay on `a`'s digit and find room in the position after it.
  return digitCharacter(low) + midpoint(a.slice(1), null);
}

/**
 * A key that sorts strictly after `before` and strictly before `after`.
 *
 * Pass null for either end to mean "nothing there": `orderKeyBetween(null,
 * null)` is the first key in an empty list, `orderKeyBetween(last, null)`
 * appends, `orderKeyBetween(null, first)` prepends.
 *
 * Throws if the two keys are equal or in the wrong order — that is a caller
 * bug, and generating a key anyway would put a row somewhere arbitrary.
 */
export function orderKeyBetween(before: string | null, after: string | null): string {
  if (before !== null && !isOrderKey(before)) {
    throw new RangeError(`not an order key: ${JSON.stringify(before)}`);
  }
  if (after !== null && !isOrderKey(after)) {
    throw new RangeError(`not an order key: ${JSON.stringify(after)}`);
  }
  return midpoint(before ?? '', after);
}

/**
 * `count` keys in ascending order, all strictly between `before` and `after`.
 *
 * Used where a whole list arrives at once — starting a session from a routine,
 * or the generator handing over a finished workout — so that one call produces
 * the whole ordering rather than a loop that has to thread the previous key
 * through by hand.
 */
export function orderKeysBetween(
  before: string | null,
  after: string | null,
  count: number,
): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`count must be a non-negative integer, got ${String(count)}`);
  }
  const keys: string[] = [];
  let low = before;
  for (let index = 0; index < count; index += 1) {
    // Bisecting toward `after` each time, rather than spreading evenly, keeps
    // this to one well-tested operation. The keys are a few characters longer
    // than an even spread would give and are otherwise identical in behaviour.
    const key = orderKeyBetween(low, after);
    keys.push(key);
    low = key;
  }
  return keys;
}

/** The first `count` keys of a brand new list. */
export function initialOrderKeys(count: number): string[] {
  return orderKeysBetween(null, null, count);
}

export interface Ordered {
  readonly id: string;
  readonly orderKey: string;
}

/**
 * The total order for a list.
 *
 * `order_key` is deliberately not unique — two devices editing offline can mint
 * the same key, and a unique constraint would turn that into a failed sync
 * rather than a cosmetic tie. So the key alone is a partial order, and
 * something has to break ties or the same data renders in a different order on
 * each device. The id does it: arbitrary, but identical everywhere.
 */
export function compareOrdered(a: Ordered, b: Ordered): number {
  if (a.orderKey !== b.orderKey) return a.orderKey < b.orderKey ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/** A sorted copy, leaving the input untouched. */
export function sortByOrder<T extends Ordered>(items: readonly T[]): T[] {
  return [...items].sort(compareOrdered);
}

/**
 * The key for moving an item to sit at `index` in `siblings`, where `siblings`
 * is the list without the item being moved, already sorted.
 *
 * Callers think in terms of "drop it third", not "find its new neighbours", and
 * getting the neighbour arithmetic subtly wrong at each call site is how a
 * drag-and-drop ends up off by one.
 */
export function orderKeyForIndex(siblings: readonly Ordered[], index: number): string {
  if (!Number.isInteger(index) || index < 0 || index > siblings.length) {
    throw new RangeError(
      `index ${String(index)} is outside a list of ${String(siblings.length)} items`,
    );
  }
  const before = index === 0 ? null : (siblings[index - 1]?.orderKey ?? null);
  const after = index === siblings.length ? null : (siblings[index]?.orderKey ?? null);
  return orderKeyBetween(before, after);
}
