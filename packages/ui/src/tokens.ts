/**
 * The §10 palette as TypeScript values.
 *
 * This exists because three.js materials need literal hex — a WebGL material
 * cannot read a CSS custom property. `packages/anatomy` colours muscle meshes
 * from here; everything rendered as DOM should use the CSS variables or the
 * Tailwind utilities instead, so a future theme swap is a single CSS change.
 *
 * `tokens.test.ts` parses tokens.css and fails if the two ever drift.
 */

export const colorTokens = {
  'bg-base': '#1f1e1d',
  'bg-surface': '#262624',
  'bg-elevated': '#30302e',
  'bg-input': '#1a1917',

  'border-subtle': '#3a3a36',
  'border-strong': '#4a4a44',

  'text-primary': '#faf9f5',
  'text-secondary': '#c2c0b6',
  'text-muted': '#99978f',
  'text-on-accent': '#1f1e1d',

  accent: '#d97757',
  'accent-hover': '#e08a6e',
  'accent-pressed': '#c56642',
  'accent-subtle': '#3a2a24',

  success: '#6fa86f',
  warning: '#d9a441',
  danger: '#a34734',

  'muscle-idle': '#4a4844',
  'muscle-hover': '#d97757',
  'muscle-selected': '#e8a184',
  'muscle-heat-0': '#35342f',
  'muscle-heat-1': '#4e4335',
  'muscle-heat-2': '#6e5138',
  'muscle-heat-3': '#9a6144',
  'muscle-heat-4': '#d97757',
} as const;

export type ColorTokenName = keyof typeof colorTokens;

/** Ordered heat ramp, indexed by the bucket returned from packages/core. */
export const heatRamp = [
  colorTokens['muscle-heat-0'],
  colorTokens['muscle-heat-1'],
  colorTokens['muscle-heat-2'],
  colorTokens['muscle-heat-3'],
  colorTokens['muscle-heat-4'],
] as const;

/** Brief §8: minimum tap target, in CSS pixels. No exceptions. */
export const MIN_TAP_TARGET_PX = 48;

export const radiusTokens = {
  control: '6px',
  card: '12px',
  sheet: '20px',
} as const;
