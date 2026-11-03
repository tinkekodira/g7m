import { describe, expect, it } from 'vitest';
import { canEditWorkout } from './workout-edit.js';

describe('completed workout correction window', () => {
  const end = new Date('2026-11-03T10:00:00Z');
  it('starts at completion and ends exactly two hours later', () => {
    expect(canEditWorkout(end, end)).toBe(true);
    expect(canEditWorkout(end, new Date('2026-11-03T11:59:59.999Z'))).toBe(true);
    expect(canEditWorkout(end, new Date('2026-11-03T12:00:00Z'))).toBe(false);
  });
  it('does not offer corrections for active workouts or future completion times', () => {
    expect(canEditWorkout(null, end)).toBe(false);
    expect(canEditWorkout(end, new Date('2026-11-03T09:59:59Z'))).toBe(false);
  });
});
