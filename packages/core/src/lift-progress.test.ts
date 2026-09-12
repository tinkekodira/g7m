import { describe, expect, it } from 'vitest';
import {
  DAYS_BEFORE_STALLED,
  beats,
  judgeLift,
  ladderKg,
  liftImprovement,
  sessionBests,
  type LiftMark,
} from './lift-progress.js';
import type { HistoricalSet } from './progress.js';

const NOW = new Date('2026-09-07T18:00:00.000Z');
const DAY = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

const external = (weightKg: number, reps: number): LiftMark => ({
  loadType: 'external',
  weightKg,
  reps,
});
const bodyweight = (reps: number): LiftMark => ({ loadType: 'bodyweight', weightKg: 0, reps });
const belt = (weightKg: number, reps: number): LiftMark => ({
  loadType: 'bodyweight_plus',
  weightKg,
  reps,
});
const assisted = (weightKg: number, reps: number): LiftMark => ({
  loadType: 'assisted',
  weightKg,
  reps,
});

/** One session of one lift: its sets, at a moment, with a bodyweight on the day. */
function session(
  id: string,
  at: Date,
  marks: readonly LiftMark[],
  bodyweightKg: number | null = 80,
): HistoricalSet[] {
  return marks.map((mark) => ({
    sessionId: id,
    exerciseId: 'lift',
    performedAt: at,
    bodyweightKg,
    setType: 'working',
    loadType: mark.loadType,
    weightKg: mark.weightKg,
    reps: mark.reps,
    isCompleted: true,
  }));
}

/** A session a week, oldest first, ending a week ago. */
function weekly(tops: readonly LiftMark[], bodyweights?: readonly number[]): HistoricalSet[] {
  return tops.flatMap((mark, index) =>
    session(
      `s${String(index)}`,
      daysAgo((tops.length - index) * 7),
      [mark],
      bodyweights?.[index] ?? 80,
    ),
  );
}

describe('the ladder', () => {
  it('puts every way of loading a movement on one scale', () => {
    expect(ladderKg(external(100, 5))).toBe(100);
    expect(ladderKg(belt(10, 5))).toBe(10);
    expect(ladderKg(bodyweight(5))).toBe(0);
    expect(ladderKg(assisted(40, 5))).toBe(-40);
  });

  /** The number in a bodyweight set's weight field is not a load. */
  it('ignores a stray weight on plain bodyweight', () => {
    expect(ladderKg({ loadType: 'bodyweight', weightKg: 20, reps: 5 })).toBe(0);
  });
});

describe('beats', () => {
  it('counts heavier as better', () => {
    expect(beats(external(82.5, 5), external(80, 5))).toBe(true);
  });

  /** The bug: 80 kg for 6 and then for 10 is the plan's own progression. */
  it('counts the same weight for more reps as better', () => {
    expect(beats(external(80, 10), external(80, 6))).toBe(true);
  });

  it('counts heavier for fewer reps as better — the step up after topping out a range', () => {
    expect(beats(external(85, 6), external(80, 10))).toBe(true);
  });

  it('does not count lighter for more reps, which may just be an easy day', () => {
    expect(beats(external(75, 12), external(80, 8))).toBe(false);
  });

  it('does not count a repeat as better', () => {
    expect(beats(external(80, 8), external(80, 8))).toBe(false);
  });

  it('reads bodyweight movements by their reps', () => {
    expect(beats(bodyweight(12), bodyweight(10))).toBe(true);
    expect(beats(bodyweight(10), bodyweight(12))).toBe(false);
  });

  it('climbs from the assisted machine, through bodyweight, onto a belt', () => {
    expect(beats(assisted(20, 8), assisted(30, 8))).toBe(true);
    expect(beats(bodyweight(3), assisted(10, 12))).toBe(true);
    expect(beats(belt(5, 3), bodyweight(12))).toBe(true);
    expect(beats(assisted(30, 8), assisted(20, 8))).toBe(false);
  });

  it('treats weights within storage precision as the same weight', () => {
    expect(beats(external(80.004, 8), external(80, 8))).toBe(false);
    expect(beats(external(80.004, 9), external(80, 8))).toBe(true);
  });
});

describe('sessionBests', () => {
  it('keeps each session’s best set, oldest session first', () => {
    const sets = [
      ...session('late', daysAgo(1), [external(100, 3), external(90, 8)]),
      ...session('early', daysAgo(8), [external(80, 10), external(80, 12)]),
    ];
    expect(sessionBests(sets).map((entry) => [entry.sessionId, entry.best])).toEqual([
      ['early', external(80, 12)],
      ['late', external(100, 3)],
    ]);
  });

  it('ignores warm-ups, unticked sets and zero-rep misses', () => {
    const sets: HistoricalSet[] = [
      ...session('s', daysAgo(1), [external(80, 8)]),
      { ...session('s', daysAgo(1), [external(120, 5)])[0]!, setType: 'warmup' },
      { ...session('s', daysAgo(1), [external(130, 5)])[0]!, isCompleted: false },
      ...session('s', daysAgo(1), [external(140, 0)]),
    ];
    expect(sessionBests(sets)[0]?.best).toEqual(external(80, 8));
  });
});

describe('judgeLift', () => {
  it('has no verdict on fewer than three sessions', () => {
    expect(judgeLift(weekly([external(80, 8), external(80, 8)]), NOW).kind).toBe('unclear');
  });

  it('calls a lift climbing when it has a new best', () => {
    const verdict = judgeLift(weekly([external(80, 8), external(82.5, 8), external(85, 8)]), NOW);
    expect(verdict).toEqual({
      kind: 'climbing',
      from: external(80, 8),
      to: external(85, 8),
      sessions: 3,
    });
  });

  /**
   * The reported bug, in its commonest form. Same bar, more reps every week —
   * which is what the plan prescribes — used to read as "has not moved".
   */
  it('calls more reps at the same weight climbing, not stuck', () => {
    const verdict = judgeLift(
      weekly([external(80, 6), external(80, 7), external(80, 8), external(80, 10)]),
      NOW,
    );
    expect(verdict.kind).toBe('climbing');
  });

  /**
   * Pull-ups going 6 to 12 while two kilos came off. Measured by effective load
   * this was going *down*.
   */
  it('reads a bodyweight movement by its reps, whatever the scale did', () => {
    const verdict = judgeLift(
      weekly([bodyweight(6), bodyweight(8), bodyweight(10), bodyweight(12)], [82, 81.5, 80.5, 80]),
      NOW,
    );
    expect(verdict).toMatchObject({ kind: 'climbing', from: bodyweight(6), to: bodyweight(12) });
  });

  /** And the mirror: gaining weight is not getting better at pull-ups. */
  it('does not call a bodyweight movement climbing because the lifter got heavier', () => {
    const verdict = judgeLift(
      weekly([bodyweight(10), bodyweight(10), bodyweight(10), bodyweight(10)], [78, 79, 80, 81]),
      NOW,
    );
    expect(verdict.kind).toBe('stalled');
  });

  /**
   * An early jump used to hide the plateau after it: the last session was
   * heavier than the first, so a month of standing still read as "going up".
   */
  it('calls a lift stuck when it jumped early and has not moved since', () => {
    const verdict = judgeLift(
      weekly([external(80, 8), external(90, 8), external(90, 8), external(90, 7), external(90, 8)]),
      NOW,
    );
    expect(verdict).toMatchObject({
      kind: 'stalled',
      best: external(90, 8),
      sessionsSince: 3,
    });
  });

  it('calls a flat lift stuck once the best has stood three sessions and twenty days', () => {
    const verdict = judgeLift(
      weekly([external(100, 5), external(100, 5), external(100, 5), external(100, 4)]),
      NOW,
    );
    expect(verdict).toMatchObject({ kind: 'stalled', best: external(100, 5), sessionsSince: 3 });
    if (verdict.kind === 'stalled') {
      expect(verdict.plateauDays).toBe(21);
      // From the best to today, not to the last session.
      expect(verdict.daysSince).toBe(28);
    }
  });

  /** Three sessions in one week is a week, not a plateau. */
  it('does not call a single week a plateau', () => {
    const sets = [0, 2, 4, 6].flatMap((day) =>
      session(`t${String(day)}`, daysAgo(20 - day), [external(100, 5)]),
    );
    expect(judgeLift(sets, NOW).kind).toBe('unclear');
  });

  it('needs the twenty days to run from the best, not from the first session', () => {
    // A new best eleven days ago, tried twice since: climbing, not a plateau.
    const sets = [
      ...session('a', daysAgo(40), [external(80, 8)]),
      ...session('b', daysAgo(11), [external(85, 8)]),
      ...session('c', daysAgo(6), [external(85, 8)]),
      ...session('d', daysAgo(1), [external(85, 7)]),
    ];
    expect(judgeLift(sets, NOW).kind).toBe('climbing');
    expect(DAYS_BEFORE_STALLED).toBeGreaterThan(11);
  });

  it('keeps the best set of each session, not the last one logged', () => {
    const sets = [
      ...session('a', daysAgo(21), [external(100, 5), external(80, 10)]),
      ...session('b', daysAgo(14), [external(100, 6), external(80, 10)]),
      ...session('c', daysAgo(7), [external(102.5, 5), external(80, 10)]),
    ];
    expect(judgeLift(sets, NOW)).toMatchObject({
      kind: 'climbing',
      from: external(100, 5),
      to: external(102.5, 5),
    });
  });
});

describe('liftImprovement', () => {
  it('ranks a bigger gain above a smaller one on one scale', () => {
    const squat = liftImprovement(external(100, 5), external(110, 5), 80);
    const bench = liftImprovement(external(80, 5), external(82.5, 5), 80);
    expect(squat).toBeGreaterThan(bench);
    expect(squat).toBeCloseTo(0.1);
  });

  it('puts reps and kilos on the same scale', () => {
    // Six pull-ups to twelve is a large improvement; two and a half kilos on a
    // bench is a small one.
    const pullups = liftImprovement(bodyweight(6), bodyweight(12), 80);
    const bench = liftImprovement(external(80, 5), external(82.5, 5), 80);
    expect(pullups).toBeGreaterThan(bench);
  });

  it('is zero when there was nothing to improve on', () => {
    expect(liftImprovement(assisted(90, 5), assisted(80, 5), 80)).toBe(0);
  });
});
