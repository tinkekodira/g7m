/**
 * Each achievement category's colours, as Tailwind classes. Milestones take
 * the accent, strength clubs gold, consistency green, and cardio and the
 * secret the two badge tokens made for them. ADR-0072.
 */
import type { AchievementCategory } from '@g7m/core';

/** The ring, the wash and the colour the plates are drawn in. */
export const CATEGORY_TONE: Readonly<Record<AchievementCategory, string>> = {
  milestones: 'border-accent bg-accent/15 text-accent',
  strength: 'border-warning bg-warning/15 text-warning',
  consistency: 'border-success bg-success/15 text-success',
  cardio: 'border-badge-cardio bg-badge-cardio/15 text-badge-cardio',
  secret: 'border-badge-secret bg-badge-secret/15 text-badge-secret',
};

/** The progress bar's fill, per category. */
export const CATEGORY_FILL: Readonly<Record<AchievementCategory, string>> = {
  milestones: 'bg-accent',
  strength: 'bg-warning',
  consistency: 'bg-success',
  cardio: 'bg-badge-cardio',
  secret: 'bg-badge-secret',
};
