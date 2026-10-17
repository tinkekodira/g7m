import type { CSSProperties } from 'react';

/** Related to Home's body-region palette, so theme changes carry through. */
export const MUSCLE_COLORS = {
  chest: 'var(--region-chest)',
  back: 'var(--region-back)',
  shoulders: 'var(--region-shoulders)',
  biceps: 'var(--region-arms)',
  triceps: 'color-mix(in oklab, var(--region-arms) 65%, var(--region-chest))',
  forearms: 'color-mix(in oklab, var(--region-arms) 65%, var(--region-back))',
  core: 'var(--region-core)',
  quads: 'var(--region-legs)',
  hamstrings: 'color-mix(in oklab, var(--region-legs) 65%, var(--region-shoulders))',
  glutes: 'color-mix(in oklab, var(--region-legs) 65%, var(--region-chest))',
  calves: 'color-mix(in oklab, var(--region-shoulders) 70%, var(--region-legs))',
  adductors: 'color-mix(in oklab, var(--region-legs) 40%, var(--region-arms))',
  traps: 'color-mix(in oklab, var(--region-back) 65%, var(--text-muted))',
  neck: 'color-mix(in oklab, var(--region-shoulders) 45%, var(--text-muted))',
} as const;

/** Unknown or not-yet-synced groups stay neutral rather than borrowing a hue. */
export function muscleColorStyle(group: string | null): CSSProperties | undefined {
  if (group === null || !Object.hasOwn(MUSCLE_COLORS, group)) return undefined;
  return { '--muscle-color': MUSCLE_COLORS[group as keyof typeof MUSCLE_COLORS] } as CSSProperties;
}
