import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT } from './cardio.js';
import {
  buildWorkoutRecap,
  workoutRecapRewards,
  type RecapBlock,
  type RecapSet,
} from './workout-recap.js';
import type { HistoricalSet } from './progress.js';

const START = new Date('2026-10-20T12:00:00Z');
const END = new Date('2026-10-20T13:02:09Z');
const set = (id: string, over: Partial<RecapSet> = {}): RecapSet => ({
  id,
  setType: 'working',
  loadType: 'external',
  weightKg: 50,
  reps: 5,
  isCompleted: true,
  completedAt: START,
  bout: EMPTY_BOUT,
  ...over,
});
const block = (
  exerciseId = 'bench',
  sets: RecapSet[] = [set('a'), set('b', { completedAt: END })],
  over: Partial<RecapBlock> = {},
): RecapBlock => ({ exerciseId, sets, isTimeBased: false, cardioKind: null, ...over });
const historical = (id: string, when: Date, over: Partial<HistoricalSet> = {}): HistoricalSet => ({
  ...set(id),
  exerciseId: 'bench',
  sessionId: id,
  performedAt: when,
  bodyweightKg: 80,
  ...over,
});
function input(over: Partial<Parameters<typeof buildWorkoutRecap>[0]> = {}) {
  return {
    sessionId: 'today',
    startedAt: START,
    endedAt: END,
    backdated: false,
    bodyweightKg: 80,
    blocks: [block()],
    history: [],
    work: [{ exerciseId: 'bench', group: 'chest', muscle: 'pec', sets: 2 }],
    ...over,
  };
}

describe('workout recap facts', () => {
  it('shows distinct elapsed and logged training clocks and counts completed work', () => {
    const recap = buildWorkoutRecap(
      input({
        blocks: [
          block('bench', [
            set('a', { completedAt: new Date(START.getTime() + 5 * 60_000) }),
            set('b', { completedAt: new Date(START.getTime() + 60 * 60_000) }),
          ]),
        ],
      }),
    );
    expect(recap.elapsedSeconds).toBe(3729);
    expect(recap.trainingMinutes).toBe(55);
    expect(recap.exercises).toBe(1);
    expect(recap.sets).toBe(2);
    expect(recap.volume.volumeKg).toBe(500);
  });
  it('folds drops, excludes warmups and unfinished work, and handles repeated exercise blocks', () => {
    const recap = buildWorkoutRecap(
      input({
        blocks: [
          block('bench', [
            set('a'),
            set('drop', { setType: 'dropset' }),
            set('warm', { setType: 'warmup' }),
            set('pending', { isCompleted: false }),
          ]),
          block('bench', [
            set('failure', { setType: 'failure' }),
            set('amrap', { setType: 'amrap' }),
          ]),
          block('empty', []),
          block('warm', [set('w', { setType: 'warmup' })]),
        ],
      }),
    );
    expect(recap.exercises).toBe(1);
    expect(recap.sets).toBe(3);
    expect(recap.volume.volumeKg).toBe(1000);
    expect(recap.comparisons).toHaveLength(1);
  });
  it('does not invent clocks for backdated, one-set or invalid-timestamp sessions', () => {
    const recap = buildWorkoutRecap(input({ backdated: true }));
    expect(recap.elapsedSeconds).toBeNull();
    expect(recap.trainingMinutes).toBeNull();
    expect(
      buildWorkoutRecap(input({ endedAt: new Date(START.getTime() - 1) })).elapsedSeconds,
    ).toBe(0);
    expect(
      buildWorkoutRecap(
        input({
          blocks: [
            block('bench', [
              set('a', { completedAt: null }),
              set('b', { completedAt: new Date(NaN) }),
            ]),
          ],
        }),
      ).trainingMinutes,
    ).toBeNull();
    expect(
      buildWorkoutRecap(input({ blocks: [block('bench', [set('a')])] })).trainingMinutes,
    ).toBeNull();
  });
  it('explains unknown bodyweight volume while retaining working-set counts', () => {
    const recap = buildWorkoutRecap(
      input({
        bodyweightKg: null,
        blocks: [block('pullup', [set('a', { loadType: 'bodyweight', weightKg: 0 })])],
      }),
    );
    expect(recap.volume).toMatchObject({ unknownSets: 1, countedSets: 0, volumeKg: 0 });
    expect(recap.sets).toBe(1);
  });
  it('keeps cardio out of lifting totals, includes bout start time and uses existing calories', () => {
    const recap = buildWorkoutRecap(
      input({
        work: [],
        blocks: [
          block(
            'treadmill',
            [
              set('cardio', {
                weightKg: 0,
                reps: 0,
                completedAt: END,
                bout: { ...EMPTY_BOUT, durationSeconds: 1800, caloriesKcal: 200 },
              }),
              set('pending', { isCompleted: false }),
            ],
            { cardioKind: 'treadmill' },
          ),
        ],
      }),
    );
    expect(recap.sets).toBe(0);
    expect(recap.comparisons).toEqual([]);
    expect(recap.cardioSeconds).toBe(1800);
    expect(recap.cardioKcal).toBe(200);
    expect(recap.trainingMinutes).toBe(30);
    expect(
      buildWorkoutRecap(
        input({
          blocks: [
            block('treadmill', [set('unknown', { completedAt: null, bout: EMPTY_BOUT })], {
              cardioKind: 'treadmill',
            }),
          ],
        }),
      ).cardioKcal,
    ).toBe(0);
  });
  it('normalizes muscle distribution across primary movers without counting a set twice', () => {
    const recap = buildWorkoutRecap(
      input({
        work: [
          { exerciseId: 'bench', group: 'chest', muscle: 'pec-upper', sets: 3 },
          { exerciseId: 'bench', group: 'chest', muscle: 'pec-mid', sets: 3 },
          { exerciseId: 'row', group: 'back', muscle: 'lat', sets: 2 },
          { exerciseId: 'row', group: 'shoulders', muscle: 'rear', sets: 2 },
        ],
      }),
    );
    expect(recap.muscles.map((m) => [m.group, m.sets])).toEqual([
      ['chest', 3],
      ['back', 1],
      ['shoulders', 1],
    ]);
    expect(recap.muscles.reduce((n, m) => n + m.share, 0)).toBe(1);
    expect(
      buildWorkoutRecap(
        input({ work: [{ exerciseId: 'b', group: 'chest', muscle: 'pec', sets: 0 }] }),
      ).muscles[0]?.share,
    ).toBe(0);
  });
});

describe('exercise comparisons and records', () => {
  it('compares only with the previous finished session and excludes the current and later sessions', () => {
    const history = [
      historical('old', new Date('2026-10-10T12:00:00Z'), { weightKg: 40 }),
      historical('previous', new Date('2026-10-19T12:00:00Z'), { weightKg: 45 }),
      historical('today', START, { weightKg: 100 }),
      historical('future', new Date('2026-10-21T12:00:00Z'), { weightKg: 200 }),
    ];
    const comparison = buildWorkoutRecap(input({ history })).comparisons[0];
    expect(comparison?.current?.weightKg).toBe(50);
    expect(comparison?.previous?.weightKg).toBe(45);
    expect(comparison?.records).toHaveLength(1);
    expect(comparison?.records[0]?.previous).toBe(45);
  });
  it('does not call first attempts, ties, warmups or missing bodyweight records', () => {
    expect(buildWorkoutRecap(input()).comparisons[0]?.records).toEqual([]);
    expect(
      buildWorkoutRecap(input({ history: [historical('old', new Date('2026-10-19'))] }))
        .comparisons[0]?.records,
    ).toEqual([]);
    const recap = buildWorkoutRecap(
      input({
        bodyweightKg: null,
        blocks: [block('bench', [set('a', { loadType: 'bodyweight' })])],
        history: [
          historical('old', new Date('2026-10-19'), { loadType: 'bodyweight', bodyweightKg: null }),
        ],
      }),
    );
    expect(recap.comparisons[0]?.records).toEqual([]);
  });
  it('preserves assisted/bodyweight progression and never computes timed-lift 1RM records', () => {
    const assisted = buildWorkoutRecap(
      input({
        blocks: [block('bench', [set('a', { loadType: 'assisted', weightKg: 10 })])],
        history: [
          historical('old', new Date('2026-10-19'), { loadType: 'assisted', weightKg: 20 }),
        ],
      }),
    ).comparisons[0];
    expect(assisted?.current).toMatchObject({ loadType: 'assisted', weightKg: 10 });
    expect(assisted?.previous).toMatchObject({ loadType: 'assisted', weightKg: 20 });
    const timed = buildWorkoutRecap(
      input({ blocks: [block('plank', [set('a', { reps: 60 })], { isTimeBased: true })] }),
    ).comparisons[0];
    expect(timed?.timed).toBe(true);
    expect(timed?.records).toEqual([]);
    expect(
      buildWorkoutRecap(input({ blocks: [block('bench', [set('a', { reps: 0 })])] })).comparisons[0]
        ?.current,
    ).toBeNull();
  });
});

describe('rewards as of the selected session', () => {
  const sessions = [1, 2, 3].map((n) => ({
    sessionId: `s${String(n)}`,
    startedAt: new Date(`2026-10-${String(n + 10)}T12:00:00Z`),
    loggedAt: new Date(`2026-10-${String(n + 10)}T12:00:00Z`),
    finished: true,
    backdated: false,
    clockKnown: true,
    firstSetAt: null,
    lastSetAt: null,
  }));
  const sets = sessions.flatMap((s) =>
    Array.from({ length: 3 }, () => historical(s.sessionId, s.startedAt)),
  );
  const rewardsInput = {
    sessionId: 's1',
    sessions,
    sets,
    bouts: [],
    goals: [],
    groups: new Map([['bench', ['chest']]]),
    lifts: new Map(),
    birthDate: null,
    bodyweightKg: 80,
    unitSystem: 'metric' as const,
    weekStartsOn: 1 as const,
  };
  it('attributes the first workout and its achievement without later session XP', () => {
    const result = workoutRecapRewards(rewardsInput);
    expect(result.xp).toBe(115 + result.achievements.length * 100);
    expect(result.achievements.map((a) => a.key)).toContain('day-one');
    expect(result.levelBefore).toBe(1);
    expect(
      workoutRecapRewards({
        ...rewardsInput,
        sessions: sessions.slice(0, 1),
        sets: sets.slice(0, 3),
      }),
    ).toEqual(result);
    expect(workoutRecapRewards(rewardsInput)).toEqual(result);
  });
  it('replays earlier achievements and levels, without granting them again on the second session', () => {
    const result = workoutRecapRewards({ ...rewardsInput, sessionId: 's2' });
    expect(result.achievements.map((a) => a.key)).not.toContain('day-one');
    expect(result.xp).toBeGreaterThanOrEqual(115);
    expect(result.levelAfter).toBeGreaterThanOrEqual(result.levelBefore);
  });
  it('returns no awards for an absent or unfinished target', () => {
    expect(workoutRecapRewards({ ...rewardsInput, sessionId: 'missing' })).toEqual({
      xp: 0,
      levelBefore: 1,
      levelAfter: 1,
      achievements: [],
    });
    expect(
      workoutRecapRewards({
        ...rewardsInput,
        sessions: sessions.map((s) => ({ ...s, finished: false })),
      }).xp,
    ).toBe(0);
  });
  it('honors late-backdated and daily XP caps through the existing ledger', () => {
    const late = sessions.map((s) => ({ ...s, backdated: true, loggedAt: new Date('2026-10-30') }));
    const result = workoutRecapRewards({ ...rewardsInput, sessions: late, sessionId: 's3' });
    expect(result.xp).toBe(0);
  });
});
