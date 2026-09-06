import { describe, expect, it } from 'vitest';
import { hasBeatenPrevious, nextSetTemplate, previousSetAt, type SetTemplate } from './prefill.js';

function template(over: Partial<SetTemplate> = {}): SetTemplate {
  return { weightKg: 100, reps: 5, loadType: 'external', setType: 'working', ...over };
}

const EMPTY = { current: [], previous: [], repLow: 8, loadType: 'external' } as const;

describe('nextSetTemplate', () => {
  describe('with sets already logged in this session', () => {
    it('repeats the last one, which is what straight sets are', () => {
      const next = nextSetTemplate({
        ...EMPTY,
        current: [template({ weightKg: 100, reps: 5 }), template({ weightKg: 105, reps: 5 })],
      });
      expect(next).toEqual(template({ weightKg: 105, reps: 5 }));
    });

    it('prefers this session over last week, because a change was meant', () => {
      // The lifter dropped to 90 today — a bad day, or a deload. Offering 100
      // again is an argument with somebody who has already decided.
      const next = nextSetTemplate({
        ...EMPTY,
        current: [template({ weightKg: 90 })],
        previous: [template({ weightKg: 100 }), template({ weightKg: 100 })],
      });
      expect(next.weightKg).toBe(90);
    });

    it('stays in the warm-up when the lifter is still warming up', () => {
      const next = nextSetTemplate({
        ...EMPTY,
        current: [template({ setType: 'warmup', weightKg: 20, reps: 10 })],
      });
      expect(next.setType).toBe('warmup');
      expect(next.weightKg).toBe(20);
    });

    it('does not offer last week’s opening working set mid-warm-up', () => {
      // The positional logic counts working sets. Without the warm-up check
      // running first, one warm-up would be read as "set one is done".
      const next = nextSetTemplate({
        ...EMPTY,
        current: [template({ setType: 'warmup', weightKg: 20 })],
        previous: [template({ weightKg: 80 }), template({ weightKg: 90 })],
      });
      expect(next.weightKg).toBe(20);
    });
  });

  describe('from the last time this exercise was trained', () => {
    /** 80, 90, 100 — the case a "repeat the last set" rule retypes every week. */
    const ascending = [
      template({ weightKg: 80, reps: 8 }),
      template({ weightKg: 90, reps: 6 }),
      template({ weightKg: 100, reps: 4 }),
    ];

    it('opens with last week’s first working set', () => {
      expect(nextSetTemplate({ ...EMPTY, previous: ascending }).weightKg).toBe(80);
    });

    it('walks an ascending scheme forward while the lifter reproduces it', () => {
      const afterFirst = [template({ weightKg: 80, reps: 8 })];
      expect(nextSetTemplate({ ...EMPTY, previous: ascending, current: afterFirst }).weightKg).toBe(
        90,
      );

      const afterSecond = [...afterFirst, template({ weightKg: 90, reps: 6 })];
      expect(
        nextSetTemplate({ ...EMPTY, previous: ascending, current: afterSecond }).weightKg,
      ).toBe(100);
    });

    /**
     * The moment the lifter deviates, they have made a decision and the app
     * stops arguing. Following last week here would drag every remaining set
     * back to 80 and cost a correction on each one.
     */
    it('stops following last week as soon as the load changes', () => {
      const progressed = [template({ weightKg: 85, reps: 8 })];
      expect(nextSetTemplate({ ...EMPTY, previous: ascending, current: progressed }).weightKg).toBe(
        85,
      );
    });

    it('holds today’s load once this session goes further than last week', () => {
      const previous = [template({ weightKg: 80 }), template({ weightKg: 90 })];
      const current = [
        template({ weightKg: 80 }),
        template({ weightKg: 90 }),
        template({ weightKg: 90 }),
      ];
      expect(nextSetTemplate({ ...EMPTY, previous, current }).weightKg).toBe(90);
    });

    it('does not mistake the same number under a different load type for a match', () => {
      // 20 kg added to a pull-up is not 20 kg on a bar, and treating them as
      // the same set would walk the lifter onto last week's next row.
      const previous = [
        template({ loadType: 'bodyweight_plus', weightKg: 20 }),
        template({ loadType: 'bodyweight_plus', weightKg: 25 }),
      ];
      const current = [template({ loadType: 'external', weightKg: 20 })];
      expect(nextSetTemplate({ ...EMPTY, previous, current }).weightKg).toBe(20);
    });

    /**
     * A lifter who warmed up with the bar last week should not have this
     * week's first working set prefilled at 20 kg.
     */
    it('ignores last week’s warm-ups', () => {
      const previous = [
        template({ setType: 'warmup', weightKg: 20, reps: 10 }),
        template({ setType: 'warmup', weightKg: 60, reps: 5 }),
        template({ weightKg: 100, reps: 5 }),
      ];
      expect(nextSetTemplate({ ...EMPTY, previous }).weightKg).toBe(100);
    });

    it('carries the load type across, so a pull-up stays a pull-up', () => {
      const previous = [template({ loadType: 'bodyweight_plus', weightKg: 10, reps: 6 })];
      expect(nextSetTemplate({ ...EMPTY, previous }).loadType).toBe('bodyweight_plus');
    });

    /**
     * Last week's set three being an AMRAP does not make this week's one, and
     * a set silently marked `failure` would count toward volume nobody asked
     * for.
     */
    it('does not carry the set type across', () => {
      const previous = [template({ setType: 'amrap', reps: 15 })];
      expect(nextSetTemplate({ ...EMPTY, previous }).setType).toBe('working');
    });
  });

  describe('for an exercise never done before', () => {
    it('uses the catalogue rep range at no load', () => {
      expect(nextSetTemplate({ ...EMPTY, repLow: 8 })).toEqual({
        weightKg: 0,
        reps: 8,
        loadType: 'external',
        setType: 'working',
      });
    });

    it('starts a bodyweight exercise as bodyweight', () => {
      // Otherwise the first press-up anyone logs is an external 0 kg set and
      // contributes nothing to their volume for ever.
      expect(nextSetTemplate({ ...EMPTY, loadType: 'bodyweight' }).loadType).toBe('bodyweight');
    });

    it('never proposes a set of zero reps', () => {
      expect(nextSetTemplate({ ...EMPTY, repLow: 0 }).reps).toBe(1);
    });
  });
});

describe('previousSetAt', () => {
  it('lines the hint up with the row it sits beside', () => {
    const previous = [
      template({ setType: 'warmup', weightKg: 20 }),
      template({ weightKg: 80 }),
      template({ weightKg: 90 }),
    ];
    expect(previousSetAt(previous, 0)?.weightKg).toBe(80);
    expect(previousSetAt(previous, 1)?.weightKg).toBe(90);
  });

  it('is null past the end, rather than repeating the last one', () => {
    // A hint that says "90 kg × 5" beside a set nobody did last week is a
    // comparison to something that never happened.
    expect(previousSetAt([template()], 3)).toBeNull();
    expect(previousSetAt([], 0)).toBeNull();
  });
});

describe('hasBeatenPrevious', () => {
  it('is true on a heavier top set', () => {
    expect(hasBeatenPrevious([template({ weightKg: 105 })], [template({ weightKg: 100 })])).toBe(
      true,
    );
  });

  it('is true on the same weight for more total reps', () => {
    expect(
      hasBeatenPrevious(
        [template({ reps: 5 }), template({ reps: 5 }), template({ reps: 5 })],
        [template({ reps: 5 }), template({ reps: 5 })],
      ),
    ).toBe(true);
  });

  it('is false on less weight, even with many more reps', () => {
    // More reps at a lighter load is a different session, not a better one,
    // and claiming otherwise would congratulate a deload.
    expect(
      hasBeatenPrevious(
        [template({ weightKg: 60, reps: 20 })],
        [template({ weightKg: 100, reps: 5 })],
      ),
    ).toBe(false);
  });

  it('is false when there is nothing to compare against', () => {
    expect(hasBeatenPrevious([template()], [])).toBe(false);
  });

  it('ignores warm-ups on both sides', () => {
    expect(
      hasBeatenPrevious(
        [template({ setType: 'warmup', weightKg: 200 })],
        [template({ weightKg: 100 })],
      ),
    ).toBe(false);
  });
});
