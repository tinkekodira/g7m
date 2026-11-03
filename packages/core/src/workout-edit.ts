/** Corrections never reopen a workout or extend its original completion time. */
export function canEditWorkout(endedAt: Date | null, now: Date): boolean {
  if (endedAt === null) return false;
  const elapsed = now.getTime() - endedAt.getTime();
  return elapsed >= 0 && elapsed < 2 * 60 * 60 * 1000;
}
