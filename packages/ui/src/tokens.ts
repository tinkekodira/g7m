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
  'bg-base': '#202429',
  'bg-surface': '#2b3036',
  'bg-elevated': '#363d44',
  'bg-input': '#24292e',

  'border-subtle': '#454d56',
  'border-strong': '#687582',

  'text-primary': '#f4f6f8',
  'text-secondary': '#bac3cc',
  'text-muted': '#aab4be',
  'text-on-accent': '#18200a',
  'text-on-danger': '#f4f6f8',
  'text-danger': '#ff8585',

  accent: '#bbd477',
  'accent-hover': '#c8df8b',
  'accent-pressed': '#a7bf64',
  'accent-subtle': '#303b27',

  success: '#6fa86f',
  warning: '#d9a441',
  danger: '#a34734',

  'badge-cardio': '#6f9fd8',
  'badge-secret': '#a88bd9',

  'medal-gold': '#cfab35',
  'text-victory': '#edcb72',
  'medal-silver': '#b4b5b9',
  'medal-bronze': '#c27a38',

  'region-legs': '#d77755',
  'region-arms': '#9b69b1',
  'region-shoulders': '#b48e34',
  'region-back': '#587fc8',
  'region-chest': '#c05b6e',
  'region-core': '#249cb4',

  'muscle-idle': '#525860',
  'muscle-hover': '#d4f56a',
  'muscle-selected': '#dff889',
  'muscle-heat-0': '#35342f',
  'muscle-heat-1': '#4e4335',
  'muscle-heat-2': '#6e5138',
  'muscle-heat-3': '#9a6144',
  'muscle-heat-4': '#d97757',

  'bg-stage': '#24292e',
  'bg-demo': '#1c1c1c',
} as const;

export type ColorTokenName = keyof typeof colorTokens;

/**
 * The light theme's values — every token the light block in tokens.css
 * redefines. The anatomy tokens are not among them: the body is painted by
 * the viewer's own palette, and its backdrop is `bg-stage`, which is.
 */
export const lightColorTokens = {
  'bg-base': '#f3f5f0',
  'bg-surface': '#ffffff',
  'bg-elevated': '#e8ede3',
  'bg-input': '#edf1e8',

  'border-subtle': '#d1d8cc',
  'border-strong': '#a3af99',

  'text-primary': '#192016',
  'text-secondary': '#53604c',
  'text-muted': '#626d5a',
  'text-on-accent': '#ffffff',
  'text-on-danger': '#ffffff',
  'text-danger': '#b3261e',

  accent: '#3f6417',
  'accent-hover': '#345414',
  'accent-pressed': '#2a4510',
  'accent-subtle': '#e8f1d9',

  success: '#3b7a43',
  warning: '#8a5d0a',
  danger: '#b23b28',

  'badge-cardio': '#2e6aa8',
  'badge-secret': '#6b4aa5',

  'medal-gold': '#9c7a14',
  'text-victory': '#765809',
  'medal-silver': '#86878c',
  'medal-bronze': '#a0612a',

  'region-legs': '#c45e39',
  'region-arms': '#7f4995',
  'region-shoulders': '#b28319',
  'region-back': '#345fb2',
  'region-chest': '#b7445d',
  'region-core': '#1488a2',

  'bg-stage': '#e2e7df',
  'bg-demo': '#f5f3ee',
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
