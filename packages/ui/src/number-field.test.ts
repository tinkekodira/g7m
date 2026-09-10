import { describe, expect, it } from 'vitest';
import { displayed, typed } from './number-field.js';

const ANY = { min: 0, max: 1000 };

describe('typed', () => {
  /**
   * The bug, written as a sequence. Every one of these keystrokes used to be
   * fought by a decimal point the field inserted on its own.
   */
  it('lets somebody type fifty', () => {
    expect(typed('5', ANY.min, ANY.max).value).toBe(5);
    expect(typed('50', ANY.min, ANY.max).value).toBe(50);
  });

  it('gives the text back exactly as entered', () => {
    expect(typed('5', ANY.min, ANY.max).draft).toBe('5');
    // Not '100.0', which is what the field used to replace it with.
    expect(typed('100', ANY.min, ANY.max).draft).toBe('100');
  });

  /**
   * `Number('')` is 0. Clearing a weight to retype it used to set it to zero,
   * and on a bodyweight-adjusted lift that rewrites the set rather than
   * showing an obviously empty box.
   */
  it('treats an empty box as "not said yet", not as zero', () => {
    expect(typed('', ANY.min, ANY.max).value).toBeNull();
    expect(typed('   ', ANY.min, ANY.max).value).toBeNull();
  });

  it('waits through a half-typed number rather than rejecting it', () => {
    for (const partial of ['-', '.', '1e']) {
      expect(typed(partial, ANY.min, ANY.max).value, partial).toBeNull();
      expect(typed(partial, ANY.min, ANY.max).draft, partial).toBe(partial);
    }
  });

  /**
   * A trailing point is already a number to JavaScript, so the value tracks
   * straight away and the box still shows `5.` for the next digit to land
   * after. Reporting it beats waiting: the parent stays in step.
   */
  it('reports a trailing decimal point and keeps showing it', () => {
    const half = typed('5.', ANY.min, ANY.max);
    expect(half.value).toBe(5);
    expect(half.draft).toBe('5.');
  });

  it('keeps a decimal that has been finished', () => {
    expect(typed('2.5', ANY.min, ANY.max).value).toBe(2.5);
    expect(typed('0.5', ANY.min, ANY.max).value).toBe(0.5);
  });

  /** An iOS decimal keypad shows whichever separator the locale uses. */
  it('reads a comma as a decimal point', () => {
    expect(typed('2,5', ANY.min, ANY.max).value).toBe(2.5);
    expect(typed('2,5', ANY.min, ANY.max).draft).toBe('2,5');
  });

  it('ignores text that is not a number at all', () => {
    expect(typed('abc', ANY.min, ANY.max).value).toBeNull();
  });

  it('clamps the value without touching what is on screen', () => {
    const over = typed('5000', 0, 999);
    expect(over.value).toBe(999);
    // Still shows what they typed; the clamp appears when they leave the field.
    expect(over.draft).toBe('5000');

    expect(typed('-20', 0, 999).value).toBe(0);
  });
});

describe('displayed', () => {
  it('shows the formatted number when nothing is being typed', () => {
    expect(displayed(null, 100, 1)).toBe('100.0');
    expect(displayed(null, 10, 0)).toBe('10');
  });

  /** The whole point: formatting under the typist's hands is the bug. */
  it('shows the draft untouched while it exists', () => {
    expect(displayed('5', 5, 1)).toBe('5');
    expect(displayed('', 100, 1)).toBe('');
    expect(displayed('2,', 2, 1)).toBe('2,');
  });
});
