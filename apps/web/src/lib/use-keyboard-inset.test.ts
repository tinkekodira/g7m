import { describe, expect, it } from 'vitest';
import { keyboardInset } from './use-keyboard-inset.js';

describe('keyboardInset', () => {
  it('is nothing without a keyboard', () => {
    expect(keyboardInset(844, { height: 844, offsetTop: 0 })).toBe(0);
  });

  /** iPhone 14: the keyboard and its bar take 336 of the 844. */
  it('is the keyboard, measured up from the bottom of the page', () => {
    expect(keyboardInset(844, { height: 508, offsetTop: 0 })).toBe(336);
  });

  /** Safari pans the visible part up to keep the field in view. */
  it('takes away how far the visible part has panned', () => {
    expect(keyboardInset(844, { height: 508, offsetTop: 120 })).toBe(216);
  });

  it('ignores a pixel or two of rounding, and never goes below zero', () => {
    expect(keyboardInset(844, { height: 842.5, offsetTop: 0 })).toBe(0);
    expect(keyboardInset(844, { height: 900, offsetTop: 0 })).toBe(0);
  });
});
