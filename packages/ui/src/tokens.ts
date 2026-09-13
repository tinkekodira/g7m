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
  'text-on-danger': '#faf9f5',

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

  'bg-stage': '#17161a',
} as const;

export type ColorTokenName = keyof typeof colorTokens;

/**
 * The light theme's values — every token the light block in tokens.css
 * redefines. The anatomy tokens are not among them: the body is painted by
 * the viewer's own palette, and its backdrop is `bg-stage`, which is.
 */
export const lightColorTokens = {
  'bg-base': '#f5f3ee',
  'bg-surface': '#ffffff',
  'bg-elevated': '#ece9e2',
  'bg-input': '#f1efe9',

  'border-subtle': '#e0dcd2',
  'border-strong': '#c7c1b4',

  'text-primary': '#1f1e1d',
  'text-secondary': '#4a4843',
  'text-muted': '#6a675f',
  'text-on-accent': '#ffffff',
  'text-on-danger': '#ffffff',

  accent: '#a84a28',
  'accent-hover': '#973f1f',
  'accent-pressed': '#85361a',
  'accent-subtle': '#f8e9e1',

  success: '#3b7a43',
  warning: '#8a5d0a',
  danger: '#b23b28',

  'bg-stage': '#e6e2d9',
} as const satisfies Partial<Record<ColorTokenName, string>>;

export type LightTokenName = keyof typeof lightColorTokens;

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
