import { describe, expect, it } from 'vitest';
import { canConfirm, selectionNumber, toggleSelected } from './superset-picker.js';

const curl = { id: 'curl' };
const pushdown = { id: 'pushdown' };
const raise = { id: 'raise' };

describe('picking a superset', () => {
  it('keeps the order the exercises were tapped in', () => {
    const picked = toggleSelected(toggleSelected(toggleSelected([], pushdown), curl), raise);
    expect(picked.map((entry) => entry.id)).toEqual(['pushdown', 'curl', 'raise']);
    expect(selectionNumber(picked, 'curl')).toBe(2);
    expect(selectionNumber(picked, 'squat')).toBeNull();
  });

  it('takes an exercise out on a second tap, and the rest close up', () => {
    const picked = toggleSelected([curl, pushdown, raise], pushdown);
    expect(picked.map((entry) => entry.id)).toEqual(['curl', 'raise']);
    expect(selectionNumber(picked, 'raise')).toBe(2);
  });

  /** One exercise is not a superset. */
  it('offers Confirm from two exercises', () => {
    expect(canConfirm([])).toBe(false);
    expect(canConfirm([curl])).toBe(false);
    expect(canConfirm([curl, pushdown])).toBe(true);
  });
});
