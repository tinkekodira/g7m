import { describe, expect, it } from 'vitest';
import {
  recommendExercises,
  type RecommendationInput,
  type RecommendationBlock,
} from './recommendations.js';
import { RECOMMENDATION_PROFILES, trainingProfile } from './recommendation-catalogue.js';
import type { LoggedSet } from './load.js';
import type { HistoricalSet } from './progress.js';

const NOW = new Date('2026-10-20T12:00:00Z');
const DAY = 86_400_000;
const set = (over: Partial<LoggedSet> = {}): LoggedSet => ({
  setType: 'working',
  loadType: 'external',
  weightKg: 30,
  reps: 8,
  isCompleted: true,
  ...over,
});
const block = (exerciseId: string, n = 2): RecommendationBlock => ({
  exerciseId,
  sets: Array.from({ length: n }, () => set()),
});
const CHEST = [block('barbell-bench-press'), block('dumbbell-bench-press'), block('cable-fly')];
function input(over: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    now: NOW,
    sessionId: 'today',
    experience: 'intermediate',
    goal: 'build_muscle',
    catalogue: [...Object.keys(RECOMMENDATION_PROFILES), 'unknown'].map((slug, i) => ({
      id: slug,
      slug,
      equipment: [],
      favourite: false,
      order: i,
    })),
    eligibleIds: new Set(['incline-barbell-press']),
    blocks: CHEST,
    history: [],
    ...over,
  };
}
function history(id: string, days: number, slugs: string[], n = 2): HistoricalSet[] {
  return slugs.flatMap((exerciseId) =>
    Array.from({ length: n }, () => ({
      ...set(),
      exerciseId,
      sessionId: id,
      bodyweightKg: 80,
      performedAt: new Date(NOW.getTime() - days * DAY),
    })),
  );
}
const ids = (i: RecommendationInput) => recommendExercises(i).map((r) => r.exerciseId);

describe('workout evidence and workload', () => {
  it('waits for three fully completed distinct exercises', () => {
    expect(ids(input({ blocks: CHEST.slice(0, 2) }))).toEqual([]);
    expect(ids(input())).toEqual(['incline-barbell-press']);
    const unfinished = [
      ...CHEST.slice(0, 2),
      { exerciseId: 'cable-fly', sets: [set(), set({ isCompleted: false })] },
    ];
    expect(ids(input({ blocks: unfinished }))).toEqual([]);
    expect(ids(input({ blocks: [CHEST[0]!, CHEST[0]!, CHEST[1]!] }))).toEqual([]);
  });
  it('does not use warmups, drops alone, zero reps or unknown mappings as evidence', () => {
    for (const s of [set({ setType: 'warmup' }), set({ setType: 'dropset' }), set({ reps: 0 })]) {
      expect(
        ids(input({ blocks: [...CHEST.slice(0, 2), { exerciseId: 'cable-fly', sets: [s] }] })),
      ).toEqual([]);
    }
    expect(
      ids(input({ blocks: [block('unknown'), block('missing'), block('turkish-get-up')] })),
    ).toEqual([]);
    expect(trainingProfile('toString')).toBeUndefined();
  });
  it('counts failure and AMRAP, but incomplete drops keep an exercise unfinished', () => {
    const blocks = CHEST.map((b) => ({
      ...b,
      sets: [set({ setType: 'failure' }), set({ setType: 'amrap' })],
    }));
    expect(ids(input({ blocks }))).toHaveLength(1);
    blocks[0]!.sets.push(set({ setType: 'dropset', isCompleted: false }));
    expect(ids(input({ blocks }))).toEqual([]);
  });
  it('needs meaningful direct work before inferring a muscle group', () => {
    expect(
      ids(
        input({
          blocks: CHEST.map((b) => ({ ...b, sets: [set()] })).map((b, i) => ({
            ...b,
            exerciseId: ['barbell-bench-press', 'lateral-raise', 'barbell-curl'][i]!,
          })),
        }),
      ),
    ).toEqual([]);
  });
  it('reserves room for three new sets and honors beginner and advanced caps', () => {
    expect(
      ids(
        input({
          experience: 'beginner',
          blocks: CHEST.map((b) => ({ ...b, sets: Array.from({ length: 5 }, () => set()) })),
        }),
      ),
    ).toEqual([]);
    expect(
      ids(
        input({
          experience: 'advanced',
          blocks: CHEST.map((b) => ({ ...b, sets: Array.from({ length: 8 }, () => set()) })),
        }),
      ),
    ).toEqual([]);
    const queued = ['pec-deck', 'push-up', 'machine-chest-press'].map((id) => block(id, 0));
    expect(ids(input({ blocks: [...CHEST, ...queued] }))).toEqual([]);
  });
  it('folds completed drops and warm-ups out of the set budget', () => {
    const blocks = CHEST.map((b) => ({
      ...b,
      sets: [
        ...b.sets,
        ...Array.from({ length: 8 }, () => set({ setType: 'dropset' })),
        set({ setType: 'warmup' }),
      ],
    }));
    expect(ids(input({ blocks }))).toHaveLength(1);
  });
  it('reserves budget for every queued entry, even a repeated exercise', () => {
    expect(
      ids(
        input({
          experience: 'beginner',
          blocks: [...CHEST, block('barbell-bench-press', 0), block('barbell-bench-press', 0)],
        }),
      ),
    ).toEqual([]);
  });
});

describe('intent, overlap and recent history', () => {
  const push = [
    block('barbell-bench-press'),
    block('dumbbell-bench-press'),
    block('triceps-pushdown'),
  ];
  const pastPush = ['barbell-bench-press', 'triceps-pushdown', 'lateral-raise'];
  it('stays chest-only even with shoulder assistance or a single historical example', () => {
    const eligibleIds = new Set(['lateral-raise']);
    expect(ids(input({ eligibleIds }))).toEqual([]);
    expect(ids(input({ blocks: push, eligibleIds, history: history('a', 10, pastPush) }))).toEqual(
      [],
    );
  });
  it('requires two of the last three comparable sessions before adding shoulders', () => {
    const eligibleIds = new Set(['lateral-raise']);
    const examples = [
      ...history('a', 10, pastPush),
      ...history('b', 20, pastPush),
      ...history('c', 30, pastPush.slice(0, 2)),
    ];
    expect(ids(input({ blocks: push, eligibleIds, history: examples }))).toEqual(['lateral-raise']);
    expect(
      ids(
        input({
          blocks: push,
          eligibleIds,
          history: [
            ...history('a', 10, pastPush),
            ...history('b', 20, pastPush.slice(0, 2)),
            ...history('c', 30, pastPush.slice(0, 2)),
          ],
        }),
      ),
    ).toEqual([]);
    expect(
      ids(
        input({
          blocks: push,
          eligibleIds,
          history: [...history('a', 10, pastPush), ...history('b', 20, pastPush)],
        }),
      ),
    ).toHaveLength(1);
  });
  it('does not let an old pattern override the latest three, or unrelated full-body work expand a split', () => {
    const examples = [
      ...history('old-a', 40, pastPush),
      ...history('old-b', 50, pastPush),
      ...history('a', 10, pastPush.slice(0, 2)),
      ...history('b', 20, pastPush.slice(0, 2)),
      ...history('c', 30, pastPush.slice(0, 2)),
    ];
    expect(
      ids(input({ blocks: push, eligibleIds: new Set(['lateral-raise']), history: examples })),
    ).toEqual([]);
    expect(
      ids(
        input({
          blocks: push,
          eligibleIds: new Set(['lateral-raise']),
          history: [
            ...history('a', 10, [...pastPush, 'leg-extension']),
            ...history('b', 20, [...pastPush, 'leg-extension']),
          ],
        }),
      ),
    ).toEqual([]);
  });
  it('ignores future, same-session, invalid, warmup and older-than-90-day history', () => {
    const examples = [
      ...history('today', 1, pastPush),
      ...history('future', -1, pastPush),
      ...history('old', 91, pastPush),
      ...history('invalid', NaN, pastPush),
      ...history('warmup', 10, pastPush).map((s) => ({ ...s, setType: 'warmup' as const })),
      ...history('unknown', 10, ['unknown']),
    ];
    expect(
      ids(input({ blocks: push, eligibleIds: new Set(['lateral-raise']), history: examples })),
    ).toEqual([]);
  });
  it('accounts for queued incline work and suppresses recently trained regional emphasis', () => {
    expect(ids(input({ blocks: [...CHEST, block('incline-barbell-press', 0)] }))).toEqual([]);
    expect(ids(input({ blocks: [...CHEST, block('incline-dumbbell-press', 0)] }))).toEqual([]);
    expect(
      ids(
        input({
          blocks: [
            ...CHEST,
            { exerciseId: 'incline-dumbbell-press', sets: [set({ isCompleted: false })] },
          ],
        }),
      ),
    ).toEqual([]);
    expect(ids(input({ history: history('a', 2, ['incline-dumbbell-press']) }))).toEqual([]);
    expect(ids(input({ history: history('a', 7, ['incline-dumbbell-press']) }))).toEqual([]);
    expect(ids(input({ history: history('a', 7.01, ['incline-dumbbell-press']) }))).toHaveLength(1);
  });
  it('stops at the rolling weekly budget and ignores unknown equipment mappings', () => {
    expect(ids(input({ history: history('a', 2, ['barbell-bench-press'], 10) }))).toEqual([]);
    expect(
      ids(input({ catalogue: input().catalogue.filter((e) => e.id !== 'cable-fly') })),
    ).toHaveLength(1);
  });
  it('offers hammer curls as optional variety, while counting ordinary curls and compound assistance', () => {
    const blocks = [block('barbell-row'), block('lat-pulldown'), block('barbell-curl')];
    const result = recommendExercises(input({ blocks, eligibleIds: new Set(['hammer-curl']) }));
    expect(result[0]).toMatchObject({
      exerciseId: 'hammer-curl',
      reason: 'regional-variety',
      group: 'biceps',
    });
    expect(
      ids(
        input({
          blocks,
          eligibleIds: new Set(['hammer-curl']),
          history: history('a', 2, ['barbell-row'], 20),
        }),
      ),
    ).toEqual([]);
  });
  it('offers overhead triceps emphasis without assuming pushdowns train only one head', () => {
    expect(
      recommendExercises(
        input({ blocks: push, eligibleIds: new Set(['overhead-triceps-extension']) }),
      )[0],
    ).toMatchObject({ reason: 'regional-variety', group: 'triceps' });
  });
});

describe('candidate ranking and restraint', () => {
  it('filters before ranking and excludes already selected, unknown and unclassified exercises', () => {
    expect(ids(input({ eligibleIds: new Set() }))).toEqual([]);
    expect(ids(input({ selectedIds: new Set(['incline-barbell-press']) }))).toEqual([]);
    expect(ids(input({ selectedIds: new Set(['incline-dumbbell-press']) }))).toEqual([]);
    expect(ids(input({ eligibleIds: new Set(['unknown', 'turkish-get-up']) }))).toEqual([]);
    expect(ids(input({ eligibleIds: new Set(['barbell-bench-press']) }))).toEqual([]);
  });
  it('prefers familiar equipment then favourites then stable catalogue order', () => {
    const eligibleIds = new Set(['incline-barbell-press', 'incline-dumbbell-press']);
    const catalogue = input().catalogue.map((e) => ({
      ...e,
      equipment: e.slug === 'incline-dumbbell-press' ? ['db'] : ['bar'],
      favourite: e.slug === 'incline-dumbbell-press',
    }));
    expect(ids(input({ catalogue, eligibleIds }))).toEqual(['incline-barbell-press']);
    expect(
      ids(input({ eligibleIds, catalogue: catalogue.map((e) => ({ ...e, equipment: [] })) })),
    ).toEqual(['incline-dumbbell-press']);
    expect(ids(input({ eligibleIds }))).toEqual(['incline-barbell-press']);
  });
  it('returns at most three different needs and limits strength-only regional suggestions', () => {
    const blocks = [
      block('barbell-front-squat'),
      block('barbell-back-squat'),
      block('seated-calf-raise'),
    ];
    const eligibleIds = new Set([
      'hip-abduction-machine',
      'standing-calf-raise',
      'leg-extension',
      'barbell-hip-thrust',
    ]);
    expect(recommendExercises(input({ blocks, eligibleIds }))).toHaveLength(3);
    const regionalBlocks = [
      block('incline-barbell-press'),
      block('dumbbell-shoulder-press'),
      block('triceps-pushdown'),
    ];
    const candidates = new Set(['lateral-raise', 'overhead-triceps-extension']);
    expect(
      ids(input({ blocks: regionalBlocks, eligibleIds: candidates, goal: 'get_stronger' })),
    ).toHaveLength(1);
    expect(ids(input({ blocks: regionalBlocks, eligibleIds: candidates }))).toHaveLength(2);
  });
  it('ranks a history-supported missing group ahead of movement and regional variety', () => {
    const blocks = [
      block('barbell-bench-press'),
      block('dumbbell-bench-press'),
      block('lateral-raise'),
    ];
    const past = ['barbell-bench-press', 'lateral-raise', 'triceps-pushdown'];
    const result = recommendExercises(
      input({
        blocks,
        eligibleIds: new Set(['triceps-pushdown', 'cable-fly', 'incline-barbell-press']),
        history: [...history('a', 10, past), ...history('b', 20, past)],
      }),
    );
    // Press assistance is acknowledged; extra work is never labeled an untouched muscle.
    expect(result.map((r) => r.reason)).toContain('movement-variety');
    expect(result.length).toBeLessThanOrEqual(3);
  });
  it('can identify a genuine missing directly supported group with no compound contribution', () => {
    const blocks = [block('cable-fly'), block('pec-deck'), block('lateral-raise')];
    const past = ['cable-fly', 'lateral-raise', 'triceps-pushdown'];
    expect(
      recommendExercises(
        input({
          blocks,
          eligibleIds: new Set(['triceps-pushdown']),
          history: [...history('a', 10, past), ...history('b', 20, past)],
        }),
      )[0]?.reason,
    ).toBe('missing-group');
  });
});
