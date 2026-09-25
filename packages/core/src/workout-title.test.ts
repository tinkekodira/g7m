import { describe, expect, it } from 'vitest';
import { workoutTitle, type PrimaryWork } from './workout-title.js';

/** One exercise's sets, spread over the primary muscles it lists. */
function exercise(
  exerciseId: string,
  sets: number,
  muscles: readonly (readonly [muscle: string, group: string])[],
): PrimaryWork[] {
  return muscles.map(([muscle, group]) => ({ exerciseId, muscle, group, sets }));
}

const squat = (sets: number) =>
  exercise('squat', sets, [
    ['vastus-lateralis', 'quads'],
    ['vastus-medialis', 'quads'],
  ]);
const legPress = (sets: number) => exercise('leg-press', sets, [['vastus-lateralis', 'quads']]);
const rdl = (sets: number) =>
  exercise('rdl', sets, [
    ['biceps-femoris', 'hamstrings'],
    ['semitendinosus', 'hamstrings'],
    ['semimembranosus', 'hamstrings'],
  ]);
const pulldown = (sets: number) => exercise('pulldown', sets, [['latissimus-dorsi', 'back']]);
const row = (sets: number) => exercise('row', sets, [['rhomboids', 'back']]);
const curl = (sets: number) => exercise('curl', sets, [['biceps-brachii', 'biceps']]);
const bench = (sets: number) => exercise('bench', sets, [['pec-major-sternal', 'chest']]);
const press = (sets: number) => exercise('ohp', sets, [['anterior-deltoid', 'shoulders']]);
const pushdown = (sets: number) =>
  exercise('pushdown', sets, [['triceps-lateral-head', 'triceps']]);
const crunch = (sets: number) => exercise('crunch', sets, [['rectus-abdominis', 'core']]);

describe('workoutTitle', () => {
  it('names a day that leaned on one muscle after it', () => {
    expect(workoutTitle([...squat(4), ...legPress(3), ...rdl(2)])).toBe('Leg day (quad focused)');
    expect(workoutTitle([...pulldown(6), ...curl(2)])).toBe('Pull day (lat focused)');
    expect(workoutTitle([...bench(6), ...press(2), ...pushdown(2)])).toBe(
      'Push day (chest focused)',
    );
  });

  it('says all-round when nothing led', () => {
    expect(workoutTitle([...squat(4), ...rdl(4)])).toBe('Leg day (all-round)');
    expect(workoutTitle([...pulldown(3), ...row(3), ...curl(3)])).toBe('Pull day (all-round)');
  });

  /**
   * A squat's set is split between its two quad heads, an RDL's between three
   * hamstrings. Counted once per muscle, three sets of RDLs would outweigh
   * four of squats and the day would be called hamstring focused.
   */
  it('splits a set across its primary movers rather than counting it for each', () => {
    expect(workoutTitle([...squat(6), ...rdl(3)])).toBe('Leg day (quad focused)');
  });

  it('tells the lats from the upper back', () => {
    expect(workoutTitle([...row(6), ...pulldown(2)])).toBe('Pull day (upper back focused)');
  });

  it('calls a rear-delt day a pull day, not a push day', () => {
    expect(
      workoutTitle([...exercise('face-pull', 4, [['posterior-deltoid', 'shoulders']]), ...row(4)]),
    ).toBe('Pull day (all-round)');
  });

  it('does not let a few sets of abs change what the day was', () => {
    expect(workoutTitle([...squat(8), ...crunch(3)])).toBe('Leg day (quad focused)');
  });

  it('names arms, upper body, full body and core days', () => {
    expect(workoutTitle([...curl(4), ...pushdown(4)])).toBe('Arm day (all-round)');
    expect(workoutTitle([...bench(4), ...pulldown(4)])).toBe('Upper body (all-round)');
    expect(workoutTitle([...bench(2), ...pulldown(2), ...squat(4)])).toBe('Full body (all-round)');
    expect(workoutTitle([...bench(1), ...pulldown(1), ...squat(4)])).toBe(
      'Full body (leg focused)',
    );
    expect(workoutTitle([...bench(2), ...squat(8)])).toBe('Leg day (quad focused)');
    expect(workoutTitle(crunch(6))).toBe('Core day (ab focused)');
  });

  it('falls back when there is nothing to place', () => {
    expect(workoutTitle([])).toBe('Workout');
    expect(workoutTitle([], 1)).toBe('Cardio');
    expect(workoutTitle(exercise('neck', 3, [['sternocleidomastoid', 'neck']]))).toBe('Workout');
  });
});
