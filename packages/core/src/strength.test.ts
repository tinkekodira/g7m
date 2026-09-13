import { describe, expect, it } from 'vitest';
import type { HistoricalSet } from './progress.js';
import { CURRENT_STRENGTH_WEEKS, strengthEstimate } from './strength.js';

const NOW = new Date('2026-09-13T12:00:00.000Z');
const DAY = 86_400_000;

function set(daysAgo: number, over: Partial<HistoricalSet> = {}): HistoricalSet {
  return {
    sessionId: `s${String(daysAgo)}`,
    exerciseId: 'bench',
    performedAt: new Date(NOW.getTime() - daysAgo * DAY),
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  };
}

describe('strengthEstimate', () => {
  it('estimates from the best recent set, and says which set', () => {
    const { current } = strengthEstimate(
      [set(20, { weightKg: 100, reps: 5 }), set(6, { weightKg: 105, reps: 3 })],
      NOW,
    );
    // Epley: 100 × (1 + 5/30) = 116.67; 105 × (1 + 3/30) = 115.5.
    expect(current?.estimate.valueKg).toBe(116.67);
    expect(current).toMatchObject({ weightKg: 100, reps: 5, loadType: 'external' });
  });

  /** A single is its own one-rep max, not 3% more than it. */
  it('takes a single at face value', () => {
    expect(
      strengthEstimate([set(3, { weightKg: 130, reps: 1 })], NOW).current?.estimate.valueKg,
    ).toBe(130);
  });

  it('keeps an older, stronger best apart from the current one', () => {
    const { current, best } = strengthEstimate(
      [set(90, { weightKg: 120, reps: 5 }), set(10, { weightKg: 100, reps: 5 })],
      NOW,
    );
    expect(current?.weightKg).toBe(100);
    expect(best?.weightKg).toBe(120);
  });

  it('has no current reading when nothing is recent enough', () => {
    const { current, best } = strengthEstimate(
      [set(CURRENT_STRENGTH_WEEKS * 7 + 1, { weightKg: 100, reps: 5 })],
      NOW,
    );
    expect(current).toBeNull();
    expect(best?.weightKg).toBe(100);
  });

  it('leaves out what the formula means nothing for', () => {
    const { best } = strengthEstimate(
      [
        set(2, { reps: 15 }),
        set(2, { setType: 'warmup', weightKg: 200 }),
        set(2, { isCompleted: false, weightKg: 200 }),
        set(2, { loadType: 'bodyweight', weightKg: 0, reps: 10 }),
        set(2, { loadType: 'assisted', weightKg: 20, reps: 8 }),
      ],
      NOW,
    );
    expect(best).toBeNull();
  });

  /** A belt hangs from a body, so the estimate is of both together. */
  it('counts the bodyweight a belt hangs from, and needs to know it', () => {
    const weighted = strengthEstimate(
      [set(2, { loadType: 'bodyweight_plus', weightKg: 20, reps: 5, bodyweightKg: 80 })],
      NOW,
    );
    expect(weighted.best?.estimate.valueKg).toBe(116.67);
    expect(weighted.best).toMatchObject({ loadType: 'bodyweight_plus', weightKg: 20 });

    const unknown = strengthEstimate(
      [set(2, { loadType: 'bodyweight_plus', weightKg: 20, reps: 5, bodyweightKg: null })],
      NOW,
    );
    expect(unknown.best).toBeNull();
  });

  it('keeps the earlier of two equal bests, as a record does', () => {
    const { best } = strengthEstimate([set(5, { weightKg: 100 }), set(30, { weightKg: 100 })], NOW);
    expect(best?.at.getTime()).toBe(NOW.getTime() - 30 * DAY);
  });

  it('is empty for no history', () => {
    expect(strengthEstimate([], NOW)).toEqual({ current: null, best: null });
  });
});
