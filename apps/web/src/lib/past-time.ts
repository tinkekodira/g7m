/** A past workout's time of day and length (ADR-0193, ADR-0194). */
export interface PastTime {
  readonly start: Date;
  readonly minutes: number;
}

/**
 * The time a finished past workout was given, or null: given, it ends after
 * it starts (`setPastTime`); until then it ends where it starts.
 */
export function givenPastTime(
  startedAt: Date,
  endedAt: Date | null,
  minutes: number | null,
): PastTime | null {
  if (endedAt === null || minutes === null || endedAt.getTime() <= startedAt.getTime()) return null;
  return { start: startedAt, minutes };
}

/**
 * Whether a finished workout logged afterwards can be given its time. One
 * untimed set has no first-to-last span to hold a length.
 */
export function pastTimeable(source: string, sets: number, cardioSeconds: number): boolean {
  return source === 'past' && (sets >= 2 || cardioSeconds > 0);
}
