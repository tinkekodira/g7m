import { describe, expect, it } from 'vitest';
import { pastWorkoutStamps, validPastWorkoutMinutes } from './past-workout-time.js';
import { trainingMinutes } from './progress.js';

const start = new Date('2026-11-20T17:30:00Z');
const minute = 60_000;
const set = (setType = 'working', durationSeconds: number | null = null) => ({
  setType,
  durationSeconds,
});
/** What every duration reader measures: counted sets, timed ones from their start. */
const measured = (items: ReturnType<typeof set>[], stamps: Date[]) =>
  trainingMinutes(
    items.flatMap((item, i) => {
      if (item.setType === 'warmup') return [];
      const at = stamps[i] ?? null;
      if (at === null) return [];
      return [at, new Date(at.getTime() - (item.durationSeconds ?? 0) * 1000)];
    }),
  );

describe('pastWorkoutStamps', () => {
  it('spreads counted sets so the workout measures exactly the minutes given', () => {
    const items = [set(), set(), set(), set(), set()];
    const stamps = pastWorkoutStamps(items, start, 56);
    expect(stamps[0]).toEqual(start);
    expect(stamps.at(-1)).toEqual(new Date(start.getTime() + 56 * minute));
    expect(measured(items, stamps)).toBe(56);
    // In order, never two counted sets swapped.
    expect(stamps.map((d) => d.getTime())).toEqual([...stamps.map((d) => d.getTime())].sort());
  });

  it('gives a warm-up the time of the set it leads into, so it stretches nothing', () => {
    const items = [set('warmup'), set('warmup'), set(), set(), set('warmup'), set()];
    const stamps = pastWorkoutStamps(items, start, 40);
    expect(stamps[0]).toEqual(stamps[2]);
    expect(stamps[1]).toEqual(stamps[2]);
    expect(stamps[4]).toEqual(stamps[5]);
    expect(measured(items, stamps)).toBe(40);
  });

  it('never ticks a timed bout before its own time has passed', () => {
    const items = [set('working', 30 * 60), set()];
    const stamps = pastWorkoutStamps(items, start, 45);
    expect(stamps[0]).toEqual(new Date(start.getTime() + 30 * minute));
    expect(measured(items, stamps)).toBe(45);
  });

  it('a lone bout spans its own length from the start', () => {
    const items = [set('working', 20 * 60)];
    const stamps = pastWorkoutStamps(items, start, 20);
    expect(measured(items, stamps)).toBe(20);
  });

  it('cannot give one untimed set a span, and puts it at the end', () => {
    const stamps = pastWorkoutStamps([set()], start, 30);
    expect(stamps).toEqual([new Date(start.getTime() + 30 * minute)]);
  });
});

describe('validPastWorkoutMinutes', () => {
  it('takes whole minutes from 1 to 10 hours', () => {
    expect(validPastWorkoutMinutes(1)).toBe(true);
    expect(validPastWorkoutMinutes(600)).toBe(true);
    expect(validPastWorkoutMinutes(0)).toBe(false);
    expect(validPastWorkoutMinutes(601)).toBe(false);
    expect(validPastWorkoutMinutes(12.5)).toBe(false);
    expect(validPastWorkoutMinutes(Number.NaN)).toBe(false);
  });
});
