import type { BodyRegion } from '@g7m/core';

/**
 * Each body region's colour as a fill, for the dots beside its name: the
 * month's muscle ring on Home, and the muscle tags on today's workout.
 *
 * Written out in full rather than built from the region's name, so Tailwind's
 * scanner sees every class. The colours themselves are tokens (`--region-*`,
 * ADR-0120); the ring reads the same variables for its strokes.
 */
export const REGION_DOT: Record<BodyRegion, string> = {
  legs: 'bg-region-legs',
  arms: 'bg-region-arms',
  shoulders: 'bg-region-shoulders',
  back: 'bg-region-back',
  chest: 'bg-region-chest',
  core: 'bg-region-core',
};
