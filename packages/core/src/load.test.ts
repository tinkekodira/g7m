import { describe, expect, it } from 'vitest';
import {
  WEIGHT_FIELD_MEANING,
  countsTowardVolume,
  effectiveLoadKg,
  loadForOneRepMax,
  naturalLoadType,
  setVolumeKg,
  totalVolumeKg,
  type LoadType,
  type LoggedSet,
  type SetType,
  canAddWeight,
  describePreviousSet,
} from './load.js';

function set(over: Partial<LoggedSet> = {}): LoggedSet {
  return {
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  };
}

describe('effectiveLoadKg', () => {
  it('is the bar weight for external load', () => {
    expect(effectiveLoadKg({ loadType: 'external', weightKg: 100 }, 80)).toBe(100);
  });

  /**
   * The whole reason `load_type` exists. Reading `weight_kg` directly here
   * gives 0, and every pull-up a lifter ever did contributes nothing to their
   * volume — which for a beginner is most of their training.
   */
  it('is the lifter for a bodyweight set, not the zero in the weight field', () => {
    expect(effectiveLoadKg({ loadType: 'bodyweight', weightKg: 0 }, 80)).toBe(80);
  });

  it('adds the extra plate for a weighted pull-up', () => {
    expect(effectiveLoadKg({ loadType: 'bodyweight_plus', weightKg: 20 }, 80)).toBe(100);
  });

  it('subtracts the band for an assisted set', () => {
    expect(effectiveLoadKg({ loadType: 'assisted', weightKg: 30 }, 80)).toBe(50);
  });

  it('clamps assistance heavier than the lifter to zero, not below', () => {
    // A mistyped 100 kg of assistance should cost this set, not subtract
    // volume from the rest of the session.
    expect(effectiveLoadKg({ loadType: 'assisted', weightKg: 100 }, 80)).toBe(0);
  });

  describe('when the bodyweight is unknown', () => {
    it('still knows an external load', () => {
      expect(effectiveLoadKg({ loadType: 'external', weightKg: 60 }, null)).toBe(60);
    });

    /**
     * Null, not zero. A total that silently omits half a session is worse than
     * one that says which sets it could not count.
     */
    it('refuses to guess for anything bodyweight-derived', () => {
      for (const loadType of ['bodyweight', 'bodyweight_plus', 'assisted'] as LoadType[]) {
        expect(effectiveLoadKg({ loadType, weightKg: 10 }, null), loadType).toBeNull();
        expect(effectiveLoadKg({ loadType, weightKg: 10 }, 0), `${loadType} at zero`).toBeNull();
      }
    });
  });

  it('refuses nonsense input rather than propagating it', () => {
    expect(effectiveLoadKg({ loadType: 'external', weightKg: Number.NaN }, 80)).toBeNull();
    expect(effectiveLoadKg({ loadType: 'external', weightKg: -5 }, 80)).toBeNull();
    expect(effectiveLoadKg({ loadType: 'bodyweight', weightKg: 0 }, Number.NaN)).toBeNull();
  });
});

describe('WEIGHT_FIELD_MEANING', () => {
  it('has an entry for every load type', () => {
    // The map and `effectiveLoadKg` are the same fact stated twice. A load
    // type added to one and not the other is a field labelled "Weight" whose
    // value gets subtracted from bodyweight.
    expect(Object.keys(WEIGHT_FIELD_MEANING).sort()).toEqual([
      'assisted',
      'bodyweight',
      'bodyweight_plus',
      'external',
    ]);
  });

  it('asks for nothing at all on a pure bodyweight set', () => {
    expect(WEIGHT_FIELD_MEANING.bodyweight).toBeNull();
  });

  it('never calls added load or assistance "Weight"', () => {
    expect(WEIGHT_FIELD_MEANING.bodyweight_plus).toBe('Added');
    expect(WEIGHT_FIELD_MEANING.assisted).toBe('Assistance');
  });
});

describe('countsTowardVolume', () => {
  it('counts a completed working set', () => {
    expect(countsTowardVolume({ setType: 'working', isCompleted: true })).toBe(true);
  });

  it('does not count a set that has not been done yet', () => {
    // The logger writes the row when the set is planned and flips the flag
    // when it is done, so uncompleted rows are the normal state mid-session.
    expect(countsTowardVolume({ setType: 'working', isCompleted: false })).toBe(false);
  });

  it('does not count a warm-up', () => {
    expect(countsTowardVolume({ setType: 'warmup', isCompleted: true })).toBe(false);
  });

  /**
   * These are working sets done differently, not preparation. Excluding them
   * would under-report exactly the sessions someone worked hardest in.
   */
  it('counts drop sets, failure sets and AMRAPs', () => {
    for (const setType of ['dropset', 'failure', 'amrap'] as SetType[]) {
      expect(countsTowardVolume({ setType, isCompleted: true }), setType).toBe(true);
    }
  });
});

describe('setVolumeKg', () => {
  it('is load times reps', () => {
    expect(setVolumeKg(set({ weightKg: 100, reps: 5 }), 80)).toBe(500);
  });

  it('uses the effective load, so a bodyweight set is not worth nothing', () => {
    expect(setVolumeKg(set({ loadType: 'bodyweight', weightKg: 0, reps: 10 }), 80)).toBe(800);
  });

  it('is zero for a set that does not count, not null', () => {
    // Zero and unknown are different answers, and the totals below rely on
    // being able to tell them apart.
    expect(setVolumeKg(set({ setType: 'warmup' }), 80)).toBe(0);
    expect(setVolumeKg(set({ isCompleted: false }), 80)).toBe(0);
  });

  it('is null when the load cannot be worked out', () => {
    expect(setVolumeKg(set({ loadType: 'bodyweight', weightKg: 0 }), null)).toBeNull();
  });

  it('rejects fractional or negative reps', () => {
    expect(setVolumeKg(set({ reps: 5.5 }), 80)).toBeNull();
    expect(setVolumeKg(set({ reps: -1 }), 80)).toBeNull();
  });
});

describe('totalVolumeKg', () => {
  it('adds up the sets that count and ignores the rest', () => {
    const total = totalVolumeKg(
      [
        set({ setType: 'warmup', weightKg: 60, reps: 10 }),
        set({ weightKg: 100, reps: 5 }),
        set({ weightKg: 100, reps: 5 }),
        set({ weightKg: 100, reps: 5, isCompleted: false }),
      ],
      80,
    );
    expect(total).toEqual({ volumeKg: 1000, countedSets: 2, unknownSets: 0 });
  });

  /**
   * The number that makes the difference visible. Without `load_type` this
   * session is worth 500 kg; with it, 1300.
   */
  it('includes bodyweight work in the session total', () => {
    const total = totalVolumeKg(
      [set({ weightKg: 100, reps: 5 }), set({ loadType: 'bodyweight', weightKg: 0, reps: 10 })],
      80,
    );
    expect(total.volumeKg).toBe(1300);
    expect(total.countedSets).toBe(2);
  });

  /**
   * A total that quietly drops half the session reads as lost progress. The
   * screen has to be able to say "three sets not counted, tell us your weight".
   */
  it('reports the sets it could not measure instead of swallowing them', () => {
    const total = totalVolumeKg(
      [
        set({ weightKg: 100, reps: 5 }),
        set({ loadType: 'bodyweight', weightKg: 0, reps: 10 }),
        set({ loadType: 'assisted', weightKg: 20, reps: 8 }),
      ],
      null,
    );
    expect(total).toEqual({ volumeKg: 500, countedSets: 1, unknownSets: 2 });
  });

  it('is zero and empty for a session with nothing done yet', () => {
    expect(totalVolumeKg([], 80)).toEqual({ volumeKg: 0, countedSets: 0, unknownSets: 0 });
  });

  it('does not accumulate floating point noise', () => {
    const sets = new Array(10).fill(null).map(() => set({ weightKg: 20.1, reps: 3 }));
    expect(totalVolumeKg(sets, 80).volumeKg).toBe(603);
  });
});

describe('loadForOneRepMax', () => {
  /**
   * Exists so nothing passes `weight_kg` straight into `estimateOneRepMax`.
   * A bodyweight set would be a 0 kg lift and never produce a record.
   */
  it('gives the real load for a bodyweight set', () => {
    expect(loadForOneRepMax(set({ loadType: 'bodyweight', weightKg: 0 }), 80)).toBe(80);
  });

  it('gives bodyweight plus the plate for a weighted pull-up', () => {
    expect(loadForOneRepMax(set({ loadType: 'bodyweight_plus', weightKg: 20 }), 80)).toBe(100);
  });

  it('is null for a warm-up or an unfinished set', () => {
    expect(loadForOneRepMax(set({ setType: 'warmup' }), 80)).toBeNull();
    expect(loadForOneRepMax(set({ isCompleted: false }), 80)).toBeNull();
  });
});

describe('naturalLoadType', () => {
  it('is bodyweight when everything needed is bodyweight kit', () => {
    // A pull-up needs a `pull-up-bar` and a dip needs a `dip-station`. Neither
    // slug mentions bodyweight; both are in the bodyweight category, which is
    // why the rule is written against categories.
    expect(naturalLoadType(['bodyweight'])).toBe('bodyweight');
    expect(naturalLoadType(['bodyweight', 'bodyweight'])).toBe('bodyweight');
  });

  it('is bodyweight when nothing at all is needed', () => {
    expect(naturalLoadType([])).toBe('bodyweight');
  });

  it('is external as soon as anything loadable is involved', () => {
    expect(naturalLoadType(['barbell', 'other'])).toBe('external');
    expect(naturalLoadType(['machine'])).toBe('external');
  });

  /**
   * A weight belt turns a pull-up into a loaded lift. One non-bodyweight item
   * is enough, and treating this as bodyweight would throw away the plate.
   */
  it('is external for bodyweight kit plus something loaded', () => {
    expect(naturalLoadType(['bodyweight', 'other'])).toBe('external');
  });
});

describe('canAddWeight', () => {
  /**
   * The switch the screen was missing. A dip is logged as `bodyweight` because
   * the dip station is bodyweight equipment, and nothing ever let it become the
   * `bodyweight_plus` the schema has always supported.
   */
  it('offers added weight on a bodyweight movement', () => {
    expect(canAddWeight('bodyweight')).toBe(true);
  });

  it('keeps offering it once weight has been added, so it can be taken off', () => {
    expect(canAddWeight('bodyweight_plus')).toBe(true);
  });

  it('does not offer it where a weight field already exists', () => {
    expect(canAddWeight('external')).toBe(false);
    // Assistance has its own field, and "add weight" on top of it means nothing.
    expect(canAddWeight('assisted')).toBe(false);
  });
});

describe('describePreviousSet', () => {
  const show = (kg: number): string => String(kg);

  it('reads a barbell set the way it always has', () => {
    expect(describePreviousSet({ loadType: 'external', weightKg: 100, reps: 5 }, show)).toBe(
      '100 × 5',
    );
  });

  /** It used to read "Last: 0 × 10", which looks like a mistake. */
  it('does not print a zero weight for a bodyweight set', () => {
    expect(describePreviousSet({ loadType: 'bodyweight', weightKg: 0, reps: 10 }, show)).toBe(
      '10 reps',
    );
  });

  /**
   * 20 kg on a belt is not a 20 kg lift. Without the sign this would have read
   * exactly like one.
   */
  it('marks added weight as added', () => {
    expect(describePreviousSet({ loadType: 'bodyweight_plus', weightKg: 20, reps: 8 }, show)).toBe(
      '+20 × 8',
    );
  });

  it('marks assistance as taken off', () => {
    expect(describePreviousSet({ loadType: 'assisted', weightKg: 30, reps: 8 }, show)).toBe(
      '−30 × 8',
    );
  });

  it('reads a weighted set with nothing added as plain reps', () => {
    expect(describePreviousSet({ loadType: 'bodyweight_plus', weightKg: 0, reps: 8 }, show)).toBe(
      '8 reps',
    );
  });

  it('says "rep" for one', () => {
    expect(describePreviousSet({ loadType: 'bodyweight', weightKg: 0, reps: 1 }, show)).toBe(
      '1 rep',
    );
  });

  it('uses the formatter it is given, so pounds read as pounds', () => {
    const inPounds = (kg: number): string => String(Math.round(kg * 2.20462));
    expect(
      describePreviousSet({ loadType: 'bodyweight_plus', weightKg: 20, reps: 8 }, inPounds),
    ).toBe('+44 × 8');
  });
});
