import { describe, expect, it } from 'vitest';
import {
  compareOrdered,
  initialOrderKeys,
  isOrderKey,
  orderKeyBetween,
  orderKeyForIndex,
  orderKeysBetween,
  sortByOrder,
  type Ordered,
} from './order-key.js';

/**
 * A seeded generator, so the property tests below run the same sequence on
 * every machine. A randomised test that fails once a fortnight in CI teaches
 * nobody anything; one that fails identically for everyone is a bug report.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // xorshift32
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

describe('isOrderKey', () => {
  it('accepts keys made of the alphabet', () => {
    expect(isOrderKey('i')).toBe(true);
    expect(isOrderKey('a9')).toBe(true);
    expect(isOrderKey('0i')).toBe(true);
  });

  it('rejects the empty string', () => {
    expect(isOrderKey('')).toBe(false);
  });

  /**
   * The invariant the whole scheme rests on. Nothing can be inserted between
   * 'a' and 'a0', because they are the same point on the line — so a key that
   * ends in the smallest digit is one that can never be inserted before.
   */
  it('rejects a trailing smallest digit', () => {
    expect(isOrderKey('a0')).toBe(false);
    expect(isOrderKey('0')).toBe(false);
  });

  it('rejects uppercase, which would sort differently in Postgres than in SQLite', () => {
    expect(isOrderKey('A')).toBe(false);
    expect(isOrderKey('aB')).toBe(false);
  });

  it('rejects anything outside the alphabet', () => {
    expect(isOrderKey('a-b')).toBe(false);
    expect(isOrderKey('a b')).toBe(false);
    expect(isOrderKey('é')).toBe(false);
  });
});

describe('orderKeyBetween', () => {
  it('produces a first key for an empty list', () => {
    const key = orderKeyBetween(null, null);
    expect(isOrderKey(key)).toBe(true);
  });

  it('appends after a key', () => {
    const first = orderKeyBetween(null, null);
    const second = orderKeyBetween(first, null);
    expect(second > first).toBe(true);
    expect(isOrderKey(second)).toBe(true);
  });

  it('prepends before a key', () => {
    const first = orderKeyBetween(null, null);
    const earlier = orderKeyBetween(null, first);
    expect(earlier < first).toBe(true);
    expect(isOrderKey(earlier)).toBe(true);
  });

  it('lands strictly between two neighbours', () => {
    const a = orderKeyBetween(null, null);
    const b = orderKeyBetween(a, null);
    const middle = orderKeyBetween(a, b);
    expect(a < middle).toBe(true);
    expect(middle < b).toBe(true);
  });

  it('refuses keys given in the wrong order', () => {
    const a = orderKeyBetween(null, null);
    const b = orderKeyBetween(a, null);
    expect(() => orderKeyBetween(b, a)).toThrow(RangeError);
  });

  it('refuses two identical keys, which have nothing between them', () => {
    const a = orderKeyBetween(null, null);
    expect(() => orderKeyBetween(a, a)).toThrow(RangeError);
  });

  it('refuses a malformed key rather than ordering a row arbitrarily', () => {
    expect(() => orderKeyBetween('A', null)).toThrow(RangeError);
    expect(() => orderKeyBetween(null, 'a0')).toThrow(RangeError);
    expect(() => orderKeyBetween('', null)).toThrow(RangeError);
  });

  it('never returns a key that something else could not be inserted before', () => {
    // Walk the worst case: repeatedly bisect the same narrowing gap.
    let low = orderKeyBetween(null, null);
    const high = orderKeyBetween(low, null);
    for (let i = 0; i < 200; i += 1) {
      const next = orderKeyBetween(low, high);
      expect(isOrderKey(next), `iteration ${String(i)} produced ${next}`).toBe(true);
      expect(low < next && next < high, `iteration ${String(i)}: ${low} < ${next} < ${high}`).toBe(
        true,
      );
      low = next;
    }
  });
});

describe('key growth', () => {
  it('keeps appended keys short enough to be irrelevant', () => {
    let key = orderKeyBetween(null, null);
    for (let i = 0; i < 100; i += 1) key = orderKeyBetween(key, null);
    // Documenting the real characteristic rather than asserting a magic number:
    // a hundred appends is far more sets than any exercise ever holds, and the
    // key is still shorter than a UUID by a wide margin.
    expect(key.length).toBeLessThan(30);
  });

  it('keeps prepended keys short too', () => {
    let key = orderKeyBetween(null, null);
    for (let i = 0; i < 100; i += 1) key = orderKeyBetween(null, key);
    expect(key.length).toBeLessThan(30);
  });
});

describe('orderKeysBetween', () => {
  it('returns nothing for a count of zero', () => {
    expect(orderKeysBetween(null, null, 0)).toEqual([]);
  });

  it('returns ascending keys', () => {
    const keys = orderKeysBetween(null, null, 8);
    expect(keys).toHaveLength(8);
    expect([...keys].sort()).toEqual(keys);
    for (const key of keys) expect(isOrderKey(key)).toBe(true);
  });

  it('keeps every key inside the requested bounds', () => {
    const low = orderKeyBetween(null, null);
    const high = orderKeyBetween(low, null);
    const keys = orderKeysBetween(low, high, 12);
    for (const key of keys) {
      expect(low < key && key < high, `${low} < ${key} < ${high}`).toBe(true);
    }
    expect([...keys].sort()).toEqual(keys);
  });

  it('refuses a fractional or negative count', () => {
    expect(() => orderKeysBetween(null, null, 1.5)).toThrow(RangeError);
    expect(() => orderKeysBetween(null, null, -1)).toThrow(RangeError);
  });
});

describe('initialOrderKeys', () => {
  it('orders a whole routine in one call', () => {
    const keys = initialOrderKeys(5);
    expect(keys).toHaveLength(5);
    expect([...keys].sort()).toEqual(keys);
  });
});

describe('compareOrdered', () => {
  const item = (id: string, orderKey: string): Ordered => ({ id, orderKey });

  it('orders by key', () => {
    expect(compareOrdered(item('x', 'a'), item('y', 'b'))).toBeLessThan(0);
    expect(compareOrdered(item('x', 'b'), item('y', 'a'))).toBeGreaterThan(0);
  });

  /**
   * Duplicate keys are expected, not exceptional: two devices editing the same
   * list offline mint the same key, and the column is deliberately not unique
   * so that this stays a cosmetic tie instead of a failed sync.
   */
  it('breaks a tie on id so every device renders the same order', () => {
    expect(compareOrdered(item('a', 'i'), item('b', 'i'))).toBeLessThan(0);
    expect(compareOrdered(item('b', 'i'), item('a', 'i'))).toBeGreaterThan(0);
  });

  it('reports equality only for the same row', () => {
    expect(compareOrdered(item('a', 'i'), item('a', 'i'))).toBe(0);
  });
});

describe('sortByOrder', () => {
  it('sorts without touching the input', () => {
    const input: Ordered[] = [
      { id: '3', orderKey: 'c' },
      { id: '1', orderKey: 'a' },
      { id: '2', orderKey: 'b' },
    ];
    const sorted = sortByOrder(input);
    expect(sorted.map((i) => i.id)).toEqual(['1', '2', '3']);
    expect(input.map((i) => i.id)).toEqual(['3', '1', '2']);
  });
});

describe('orderKeyForIndex', () => {
  const list: Ordered[] = sortByOrder(
    initialOrderKeys(4).map((orderKey, index) => ({ id: `id-${String(index)}`, orderKey })),
  );

  it('places an item at the front', () => {
    const key = orderKeyForIndex(list, 0);
    expect(key < (list[0]?.orderKey ?? '')).toBe(true);
  });

  it('places an item at the end', () => {
    const key = orderKeyForIndex(list, list.length);
    expect(key > (list[list.length - 1]?.orderKey ?? '')).toBe(true);
  });

  it('places an item between two neighbours at every interior position', () => {
    for (let index = 1; index < list.length; index += 1) {
      const key = orderKeyForIndex(list, index);
      expect(key > (list[index - 1]?.orderKey ?? '')).toBe(true);
      expect(key < (list[index]?.orderKey ?? '')).toBe(true);
    }
  });

  it('handles an empty list', () => {
    expect(isOrderKey(orderKeyForIndex([], 0))).toBe(true);
  });

  it('refuses an index off the end of the list', () => {
    expect(() => orderKeyForIndex(list, list.length + 1)).toThrow(RangeError);
    expect(() => orderKeyForIndex(list, -1)).toThrow(RangeError);
    expect(() => orderKeyForIndex(list, 1.5)).toThrow(RangeError);
  });
});

/**
 * The property that actually matters.
 *
 * Every test above checks one shape of insert. This one shuffles them: a
 * thousand inserts at random positions, which is the closest thing to a real
 * user dragging exercises around a routine for a year. If the arithmetic is
 * wrong anywhere — a fencepost in the prefix walk, a bad recursion base case —
 * a list this long will find it, and the seeded generator means it finds it
 * the same way for everyone.
 */
describe('a thousand random inserts', () => {
  it('leaves the list sorted, with every key valid and distinct', () => {
    const random = seededRandom(0x9e3779b9);
    const list: Ordered[] = [];

    for (let step = 0; step < 1000; step += 1) {
      const index = Math.floor(random() * (list.length + 1));
      const orderKey = orderKeyForIndex(list, index);
      expect(isOrderKey(orderKey), `step ${String(step)} produced ${JSON.stringify(orderKey)}`).toBe(
        true,
      );
      list.splice(index, 0, { id: `id-${String(step)}`, orderKey });
    }

    const keys = list.map((item) => item.orderKey);
    // Sorted by key: the array order the splices produced is the order the keys
    // themselves imply, which is the whole contract.
    expect([...keys].sort()).toEqual(keys);
    // Distinct: a single-threaded run has no concurrent devices, so a duplicate
    // here would mean the generator failed to find room rather than that two
    // clients tied.
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('leaves keys short enough that the column stays unremarkable', () => {
    const random = seededRandom(0x1234567);
    const list: Ordered[] = [];
    for (let step = 0; step < 1000; step += 1) {
      const index = Math.floor(random() * (list.length + 1));
      list.splice(index, 0, { id: `id-${String(step)}`, orderKey: orderKeyForIndex(list, index) });
    }
    const longest = Math.max(...list.map((item) => item.orderKey.length));
    expect(longest).toBeLessThan(20);
  });
});
