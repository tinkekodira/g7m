/**
 * WCAG 2.1 relative luminance and contrast ratio.
 *
 * Brief §10 asks us to verify contrast rather than assume it. Doing that as an
 * executable check means the answer stays true after someone nudges a token.
 * Spec: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_RE = /^#?([0-9a-f]{6})$/i;

export function hexToRgb(hex: string): Rgb {
  const match = HEX_RE.exec(hex.trim());
  if (match?.[1] === undefined) {
    throw new TypeError(`Expected a 6-digit hex colour, got "${hex}"`);
  }
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

function channelLuminance(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === 'string' ? hexToRgb(color) : color;
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Contrast ratio between two colours, from 1 (identical) to 21 (black/white). */
export function contrastRatio(foreground: string | Rgb, background: string | Rgb): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG minimums. "Large" is >=18.66px bold or >=24px regular. */
export const WCAG = {
  AA_BODY: 4.5,
  AA_LARGE: 3,
  AAA_BODY: 7,
  AAA_LARGE: 4.5,
} as const;

export function meetsAaBody(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= WCAG.AA_BODY;
}
