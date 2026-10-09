import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STREAK_DAYS_PER_WEEK,
  FRIEND_CODE_ALPHABET,
  bestLiftsByExercise,
  cardLiftName,
  cardLifts,
  checkFriendCode,
  compareLifts,
  describeDot,
  describePresence,
  describeStreak,
  describeWorkoutDay,
  isLegLift,
  normaliseFriendCode,
  sharedLifts,
  weekDots,
  weeklyStreak,
  workoutToCopy,
  type BestLift,
  type BestLiftSet,
  type FriendSet,
} from './friends.js';

/** Local time, never a `Z` string — see the note at the top of week.test.ts. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// 2026-10-05 is a Monday; "now" is the Wednesday after it.
const NOW = local(2026, 10, 7, 18);

describe('friend codes', () => {
  it('leaves out every character that is easy to misread', () => {
    for (const lookAlike of ['0', 'O', '1', 'I', 'L']) {
      expect(FRIEND_CODE_ALPHABET).not.toContain(lookAlike);
    }
    expect(FRIEND_CODE_ALPHABET).toHaveLength(31);
  });

  it('ignores case, spaces and dashes', () => {
    expect(normaliseFriendCode(' k7p-x4m ')).toBe('K7PX4M');
    expect(normaliseFriendCode('k7p x4m')).toBe('K7PX4M');
  });

  it('accepts a well-formed code however it was typed', () => {
    expect(checkFriendCode('k7p-x4m')).toEqual({ ok: true, code: 'K7PX4M' });
  });

  it('says what is wrong with one that is not', () => {
    expect(checkFriendCode('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(checkFriendCode('K7PX4')).toEqual({ ok: false, reason: 'length' });
    expect(checkFriendCode('K7PX4MM')).toEqual({ ok: false, reason: 'length' });
    expect(checkFriendCode('K7PX4O')).toEqual({ ok: false, reason: 'characters' });
    expect(checkFriendCode('K7PX4!')).toEqual({ ok: false, reason: 'characters' });
  });
});

describe('weekDots', () => {
  it('runs from the viewer’s first day of the week', () => {
    expect(weekDots([], NOW, 1).map((dot) => dot.initial)).toEqual([
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
      'S',
    ]);
    expect(weekDots([], NOW, 0).map((dot) => dot.initial)).toEqual([
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
  });

  it('colours a day with any workout started on it, and marks today', () => {
    const dots = weekDots([local(2026, 10, 6, 7), local(2026, 10, 6, 19)], NOW, 1);
    expect(dots.map((dot) => dot.trained)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(dots.findIndex((dot) => dot.isToday)).toBe(2);
    expect(dots.map((dot) => dot.isFuture)).toEqual([false, false, false, true, true, true, true]);
  });

  it('ignores workouts from other weeks', () => {
    const dots = weekDots([local(2026, 10, 4), local(2026, 10, 12)], NOW, 1);
    expect(dots.some((dot) => dot.trained)).toBe(false);
  });

  it('files a late workout under the day it started, not the next', () => {
    const dots = weekDots([local(2026, 10, 5, 23, 50)], NOW, 1);
    expect(dots[0]?.trained).toBe(true);
    expect(dots[1]?.trained).toBe(false);
  });

  it('says each day in words, so it is not colour alone', () => {
    const [monday, tuesday] = weekDots([local(2026, 10, 6)], NOW, 1);
    expect(monday && describeDot(monday)).toBe('Monday: no workout');
    expect(tuesday && describeDot(tuesday)).toBe('Tuesday: trained');
  });
});

describe('weeklyStreak', () => {
  /** One workout on each given day. */
  const on = (...days: [number, number][]) => days.map(([month, day]) => local(2026, month, day));

  it('counts whole weeks back from last week while the goal was hit', () => {
    // Three days a week for the three weeks before this one.
    const trained = on(
      [9, 14],
      [9, 16],
      [9, 18],
      [9, 21],
      [9, 23],
      [9, 25],
      [9, 28],
      [9, 30],
      [10, 2],
    );
    expect(weeklyStreak(trained, 3, NOW, 1)).toBe(3);
  });

  it('does not break on a week still in progress', () => {
    const trained = on([9, 28], [9, 30], [10, 2]);
    expect(weeklyStreak(trained, 3, NOW, 1)).toBe(1);
  });

  it('counts this week as soon as it is hit', () => {
    const trained = on([9, 28], [9, 30], [10, 2], [10, 5], [10, 6], [10, 7]);
    expect(weeklyStreak(trained, 3, NOW, 1)).toBe(2);
  });

  it('stops at the first week missed', () => {
    // Hit, missed (two days of three), hit, then last week hit.
    const trained = on([9, 14], [9, 15], [9, 16], [9, 21], [9, 22], [9, 28], [9, 29], [9, 30]);
    expect(weeklyStreak(trained, 3, NOW, 1)).toBe(1);
  });

  it('counts days, not workouts: two sessions on one day are one day', () => {
    const trained = [local(2026, 9, 29, 7), local(2026, 9, 29, 19)];
    expect(weeklyStreak(trained, 2, NOW, 1)).toBe(0);
  });

  it('assumes one workout a week for somebody with no goal', () => {
    expect(DEFAULT_STREAK_DAYS_PER_WEEK).toBe(1);
    expect(weeklyStreak(on([9, 23], [9, 30]), null, NOW, 1)).toBe(2);
  });

  it('is zero with nothing logged, and ignores a time in the future', () => {
    expect(weeklyStreak([], 3, NOW, 1)).toBe(0);
    expect(weeklyStreak([local(2026, 10, 9)], 1, NOW, 1)).toBe(0);
  });

  it('keeps the goal between one and seven days', () => {
    const everyDay = Array.from({ length: 7 }, (_, index) => local(2026, 9, 28 + index));
    expect(weeklyStreak(everyDay, 12, NOW, 1)).toBe(1);
    expect(weeklyStreak(on([9, 30]), 0, NOW, 1)).toBe(1);
  });

  it('reads weeks in the viewer’s week order', () => {
    // A Sunday and the Monday after it: one Sunday-week, two Monday-weeks.
    const trained = on([10, 4], [10, 5]);
    expect(weeklyStreak(trained, 2, NOW, 0)).toBe(1);
    expect(weeklyStreak(trained, 2, NOW, 1)).toBe(0);
  });

  it('is said in weeks, or not at all', () => {
    expect(describeStreak(0)).toBeNull();
    expect(describeStreak(1)).toBe('1 week');
    expect(describeStreak(4)).toBe('4 weeks');
  });
});

describe('bestLiftsByExercise', () => {
  const set = (over: Partial<BestLiftSet> = {}): BestLiftSet => ({
    exerciseId: 'bench',
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    isCompleted: true,
    performedAt: local(2026, 10, 1),
    ...over,
  });

  it('takes the heaviest completed working set per exercise', () => {
    const bests = bestLiftsByExercise([
      set({ weightKg: 90 }),
      set({ weightKg: 105, performedAt: local(2026, 9, 1) }),
      set({ exerciseId: 'squat', weightKg: 140 }),
    ]);
    expect(bests.get('bench')).toEqual({ bestKg: 105, lastAt: local(2026, 10, 1) });
    expect(bests.get('squat')?.bestKg).toBe(140);
  });

  it('never counts a warm-up or a set not done', () => {
    const bests = bestLiftsByExercise([
      set({ weightKg: 60 }),
      set({ weightKg: 200, setType: 'warmup' }),
      set({ weightKg: 210, isCompleted: false }),
    ]);
    expect(bests.get('bench')?.bestKg).toBe(60);
  });

  it('leaves out bodyweight-based loads, which would need a bodyweight to mean anything', () => {
    const bests = bestLiftsByExercise([
      set({ exerciseId: 'pull-up', loadType: 'bodyweight_plus', weightKg: 20 }),
      set({ exerciseId: 'dip', loadType: 'assisted', weightKg: 30 }),
      set({ exerciseId: 'push-up', loadType: 'bodyweight', weightKg: 0 }),
      set({ exerciseId: 'plank', weightKg: 0 }),
    ]);
    expect(bests.size).toBe(0);
  });

  it('counts any kind of working set', () => {
    const bests = bestLiftsByExercise([set({ setType: 'amrap', weightKg: 80 })]);
    expect(bests.get('bench')?.bestKg).toBe(80);
  });
});

describe('compareLifts', () => {
  it('says who is ahead, from the viewer’s side, in the viewer’s unit', () => {
    expect(compareLifts(110, 100, 'metric')).toMatchObject({
      standing: 'ahead',
      gap: { value: 10, unit: 'kg' },
    });
    expect(compareLifts(95, 100, 'metric')).toMatchObject({
      standing: 'behind',
      gap: { value: 5, unit: 'kg' },
    });
  });

  it('compares what is shown, so float noise is level', () => {
    expect(compareLifts(100.000001, 100, 'metric')?.standing).toBe('level');
    expect(compareLifts(100, 100, 'imperial')).toMatchObject({
      standing: 'level',
      gap: { value: 0, unit: 'lb' },
      mine: { value: 220.5, unit: 'lb' },
    });
  });

  it('has nothing to say when either side has no number', () => {
    expect(compareLifts(null, 100, 'metric')).toBeNull();
    expect(compareLifts(100, null, 'metric')).toBeNull();
  });
});

describe('sharedLifts', () => {
  const best = (bestKg: number, day: number): BestLift => ({
    bestKg,
    lastAt: local(2026, 10, day),
  });

  it('keeps only lifts both people have done, most recent first', () => {
    const mine = new Map([
      ['bench', best(100, 1)],
      ['squat', best(140, 6)],
      ['curl', best(20, 7)],
    ]);
    const theirs = new Map([
      ['bench', best(110, 3)],
      ['squat', best(150, 2)],
      ['row', best(80, 7)],
    ]);
    const { lifts, defaultId } = sharedLifts(mine, theirs, null);
    expect(lifts.map((lift) => lift.exerciseId)).toEqual(['squat', 'bench']);
    expect(lifts[0]).toMatchObject({ mineKg: 140, theirsKg: 150 });
    expect(defaultId).toBe('squat');
  });

  it('opens on the preferred lift when both have it', () => {
    const mine = new Map([
      ['bench', best(100, 1)],
      ['squat', best(140, 6)],
    ]);
    const theirs = new Map([
      ['bench', best(110, 1)],
      ['squat', best(150, 6)],
    ]);
    expect(sharedLifts(mine, theirs, 'bench').defaultId).toBe('bench');
    expect(sharedLifts(mine, theirs, 'deadlift').defaultId).toBe('squat');
  });

  it('has no default with nothing in common', () => {
    expect(sharedLifts(new Map(), new Map([['bench', best(1, 1)]]), 'bench')).toEqual({
      lifts: [],
      defaultId: null,
    });
  });
});

describe('isLegLift', () => {
  it('is a lift whose primary movers are all in the legs and hips', () => {
    expect(isLegLift('barbell-back-squat', ['quads', 'glutes'])).toBe(true);
    expect(isLegLift('barbell-hip-thrust', ['glutes'])).toBe(true);
    expect(isLegLift('romanian-deadlift', ['hamstrings'])).toBe(true);
    expect(isLegLift('standing-calf-raise', ['calves'])).toBe(true);
  });

  it('never counts a deadlift, whatever its muscles say', () => {
    expect(isLegLift('conventional-deadlift', ['back', 'glutes'])).toBe(false);
    expect(isLegLift('trap-bar-deadlift', ['glutes'])).toBe(false);
    expect(isLegLift('kettlebell-deadlift', ['glutes', 'hamstrings'])).toBe(false);
  });

  it('is not an upper-body lift, nor one with nothing to go on', () => {
    expect(isLegLift('barbell-bench-press', ['chest'])).toBe(false);
    expect(isLegLift('farmer-carry', ['forearms', 'traps'])).toBe(false);
    expect(isLegLift('treadmill', [])).toBe(false);
    expect(isLegLift(undefined, ['quads'])).toBe(true);
  });
});

describe('cardLifts', () => {
  const lift = (exerciseId: string, bestKg: number, day = 1) => ({
    exerciseId,
    bestKg,
    lastAt: local(2026, 10, day),
  });
  const LEGS = new Set(['squat', 'leg-press', 'rdl', 'hip-thrust', 'lunge']);
  const isLeg = (id: string) => LEGS.has(id);

  it('takes the heaviest three, but no more than two of them legs', () => {
    expect(
      cardLifts(
        [lift('bench', 100), lift('squat', 140), lift('rdl', 120), lift('leg-press', 250)],
        isLeg,
      ),
    ).toEqual(['leg-press', 'squat', 'bench']);
  });

  it('leaves the deadlift free to take a place beside two leg lifts', () => {
    expect(
      cardLifts(
        [lift('leg-press', 250), lift('deadlift', 180), lift('squat', 140), lift('bench', 100)],
        isLeg,
      ),
    ).toEqual(['leg-press', 'deadlift', 'squat']);
  });

  it('shows a hip thrust somebody is proud of', () => {
    expect(
      cardLifts(
        [lift('hip-thrust', 140), lift('squat', 80), lift('rdl', 70), lift('bench', 50)],
        isLeg,
      ),
    ).toEqual(['hip-thrust', 'squat', 'bench']);
  });

  it('fills with a third leg lift when there is nothing else', () => {
    expect(cardLifts([lift('hip-thrust', 140), lift('squat', 80), lift('rdl', 70)], isLeg)).toEqual(
      ['hip-thrust', 'squat', 'rdl'],
    );
  });

  it('shows fewer than three when there are fewer, and none when there are none', () => {
    expect(cardLifts([lift('bench', 60)], isLeg)).toEqual(['bench']);
    expect(cardLifts([], isLeg)).toEqual([]);
  });

  it('breaks a tie by the lift trained most recently', () => {
    expect(cardLifts([lift('row', 80, 1), lift('bench', 80, 5), lift('press', 50)], isLeg)).toEqual(
      ['bench', 'row', 'press'],
    );
  });

  it('ignores a best that is not a weight', () => {
    expect(cardLifts([lift('bench', 0), lift('row', Number.NaN)], isLeg)).toEqual([]);
  });
});

describe('cardLiftName', () => {
  it('uses the name the gym uses, where it is shorter', () => {
    expect(cardLiftName('romanian-deadlift', 'Romanian Deadlift')).toBe('RDL');
    expect(cardLiftName('barbell-bench-press', 'Barbell Bench Press')).toBe('Bench');
  });

  it('keeps the catalogue name where there is no shorter one', () => {
    expect(cardLiftName('lat-pulldown', 'Lat Pulldown')).toBe('Lat Pulldown');
    expect(cardLiftName(undefined, 'Leg Press')).toBe('Leg Press');
  });
});

describe('describePresence', () => {
  const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

  it('is online within five minutes', () => {
    expect(describePresence(ago(0), NOW)).toEqual({ online: true, label: 'Online now' });
    expect(describePresence(ago(4), NOW).online).toBe(true);
    expect(describePresence(ago(5), NOW)).toEqual({
      online: false,
      label: 'Last seen 5 min ago',
    });
  });

  it('counts hours, then days', () => {
    expect(describePresence(ago(125), NOW).label).toBe('Last seen 2h ago');
    expect(describePresence(local(2026, 10, 6, 9), NOW).label).toBe('Last seen yesterday');
    expect(describePresence(local(2026, 10, 3, 9), NOW).label).toBe('Last seen 4 days ago');
    expect(describePresence(local(2026, 9, 1, 9), NOW).label).toBe('Last seen Tue 1 Sep');
    expect(describePresence(local(2025, 9, 1, 9), NOW).label).toBe('Last seen Mon 1 Sep 2025');
  });

  it('says hours rather than "yesterday" just after midnight', () => {
    const justAfterMidnight = local(2026, 10, 7, 0, 30);
    expect(describePresence(local(2026, 10, 6, 23, 15), justAfterMidnight).label).toBe(
      'Last seen 1h ago',
    );
  });

  it('copes with somebody never seen', () => {
    expect(describePresence(null, NOW)).toEqual({ online: false, label: 'Not seen yet' });
  });
});

describe('describeWorkoutDay', () => {
  it('says today, yesterday, or the date', () => {
    expect(describeWorkoutDay(local(2026, 10, 7, 6), NOW)).toBe('Today');
    expect(describeWorkoutDay(local(2026, 10, 6), NOW)).toBe('Yesterday');
    expect(describeWorkoutDay(local(2026, 10, 5), NOW)).toBe('Mon 5 Oct');
    expect(describeWorkoutDay(local(2025, 12, 30), NOW)).toBe('Tue 30 Dec 2025');
  });
});

describe('workoutToCopy', () => {
  const set = (over: Partial<FriendSet> = {}): FriendSet => ({
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  });

  it('keeps their order and their number of working sets', () => {
    const copied = workoutToCopy([
      { exerciseId: 'squat', sets: [set({ setType: 'warmup', weightKg: 60 }), set(), set()] },
      { exerciseId: 'bench', sets: [set(), set(), set(), set({ isCompleted: false })] },
    ]);
    expect(copied.map((exercise) => [exercise.exerciseId, exercise.workingSets])).toEqual([
      ['squat', 2],
      ['bench', 3],
    ]);
  });

  it('keeps their supersets, and only real ones', () => {
    const copied = workoutToCopy([
      { exerciseId: 'curl', supersetId: 'g', sets: [set()] },
      { exerciseId: 'pushdown', supersetId: 'g', sets: [set()] },
      { exerciseId: 'raise', supersetId: 'lonely', sets: [set()] },
      { exerciseId: 'squat', sets: [set()] },
    ]);
    expect(copied.map((exercise) => exercise.superset)).toEqual(['g', 'g', null, null]);
  });

  it('copies a set with a drop on it as one set', () => {
    const [copied] = workoutToCopy([
      {
        exerciseId: 'curl',
        sets: [set(), set(), set({ setType: 'dropset', weightKg: 80, reps: 12 })],
      },
    ]);
    expect(copied?.workingSets).toBe(2);
  });

  it('shows their heaviest working set as the reference, more reps breaking a tie', () => {
    const [copied] = workoutToCopy([
      {
        exerciseId: 'bench',
        sets: [
          set({ weightKg: 100, reps: 5 }),
          set({ weightKg: 100, reps: 6 }),
          set({ weightKg: 90 }),
        ],
      },
    ]);
    expect(copied?.reference).toMatchObject({ weightKg: 100, reps: 6 });
  });

  it('falls back to the planned sets, and never to fewer than one', () => {
    const copied = workoutToCopy([
      { exerciseId: 'row', sets: [set({ isCompleted: false }), set({ isCompleted: false })] },
      { exerciseId: 'plank', sets: [] },
    ]);
    expect(copied.map((exercise) => exercise.workingSets)).toEqual([2, 1]);
    expect(copied.map((exercise) => exercise.reference)).toEqual([null, null]);
  });
});
