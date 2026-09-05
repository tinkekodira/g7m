import { describe, expect, it } from 'vitest';
import { WCAG, contrastRatio, hexToRgb, meetsAaBody, relativeLuminance } from './contrast.js';

describe('hexToRgb', () => {
  it('parses with and without the leading hash', () => {
    expect(hexToRgb('#d97757')).toEqual({ r: 217, g: 119, b: 87 });
    expect(hexToRgb('d97757')).toEqual({ r: 217, g: 119, b: 87 });
  });

  it('is case insensitive and tolerates surrounding whitespace', () => {
    expect(hexToRgb('  #D97757 ')).toEqual({ r: 217, g: 119, b: 87 });
  });

  it('rejects anything that is not a 6-digit hex colour', () => {
    expect(() => hexToRgb('#fff')).toThrow(TypeError);
    expect(() => hexToRgb('rgb(1,2,3)')).toThrow(TypeError);
    expect(() => hexToRgb('')).toThrow(TypeError);
  });
});

describe('relativeLuminance', () => {
  it('anchors at the spec endpoints', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('uses the linear branch below the 0.03928 threshold', () => {
    // #010101 is 1/255 = 0.0039, well under the knee.
    expect(relativeLuminance('#010101')).toBeCloseTo(0.00030353, 8);
  });

  it('accepts a parsed Rgb as well as a hex string', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white and symmetric in its arguments', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1:1 for a colour against itself', () => {
    expect(contrastRatio('#d97757', '#d97757')).toBeCloseTo(1, 10);
  });
});

describe('meetsAaBody', () => {
  it('passes an obviously readable pair and fails an obviously bad one', () => {
    expect(meetsAaBody('#faf9f5', '#1f1e1d')).toBe(true);
    expect(meetsAaBody('#3a3a36', '#1f1e1d')).toBe(false);
  });

  it('uses 4.5:1 as the threshold', () => {
    expect(WCAG.AA_BODY).toBe(4.5);
  });
});
