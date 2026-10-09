import { describe, expect, it } from 'vitest';
import {
  afterTick,
  planMove,
  roundRestSeconds,
  supersetRounds,
  workoutUnits,
  type MovableRow,
  type RoundMember,
} from './superset.js';
import { initialOrderKeys, sortByOrder } from './order-key.js';

const of = (row: { group: string | null }) => row.group;

describe('grouping a workout into supersets', () => {
  it('groups neighbours that share an id', () => {
    const units = workoutUnits(
      [
        { id: 'a', group: null },
        { id: 'b', group: 'x' },
        { id: 'c', group: 'x' },
        { id: 'd', group: 'x' },
        { id: 'e', group: null },
      ],
      of,
    );
    expect(
      units.map((unit) =>
        unit.kind === 'single' ? unit.item.id : unit.members.map((entry) => entry.id),
      ),
    ).toEqual(['a', ['b', 'c', 'd'], 'e']);
  });

  /** What removing the other half of a pair leaves: an ordinary exercise. */
  it('reads a group of one as an ordinary exercise', () => {
    const units = workoutUnits([{ id: 'a', group: 'x' }], of);
    expect(units).toEqual([{ kind: 'single', item: { id: 'a', group: 'x' } }]);
  });

  /** Two phones reordering offline can split a group. It is shown as it now is. */
  it('does not glue a group back together across the list', () => {
    const units = workoutUnits(
      [
        { id: 'a', group: 'x' },
        { id: 'b', group: null },
        { id: 'c', group: 'x' },
      ],
      of,
    );
    expect(units.every((unit) => unit.kind === 'single')).toBe(true);
  });

  it('keeps two different supersets apart even side by side', () => {
    const units = workoutUnits(
      [
        { id: 'a', group: 'x' },
        { id: 'b', group: 'x' },
        { id: 'c', group: 'y' },
        { id: 'd', group: 'y' },
      ],
      of,
    );
    expect(units.map((unit) => unit.kind)).toEqual(['superset', 'superset']);
  });

  it('handles nothing', () => {
    expect(workoutUnits([], of)).toEqual([]);
  });
});

function member(entryId: string, sets: [string, string, boolean][]): RoundMember {
  return {
    entryId,
    sets: sets.map(([id, setType, isCompleted]) => ({ id, setType, isCompleted })),
  };
}

describe('rounds', () => {
  it('pairs each exercise’s first set, then each one’s second', () => {
    const rounds = supersetRounds([
      member('bench', [
        ['b1', 'working', true],
        ['b2', 'working', false],
      ]),
      member('row', [
        ['r1', 'working', false],
        ['r2', 'working', false],
      ]),
    ]);
    expect(rounds.map((round) => round.map((stop) => stop.setId))).toEqual([
      ['b1', 'r1'],
      ['b2', 'r2'],
    ]);
    expect(rounds[0]?.map((stop) => stop.done)).toEqual([true, false]);
  });

  it('leaves warm-ups out and lets a shorter exercise drop out of later rounds', () => {
    const rounds = supersetRounds([
      member('bench', [
        ['w', 'warmup', true],
        ['b1', 'working', true],
        ['b2', 'working', false],
        ['b3', 'working', false],
      ]),
      member('fly', [['f1', 'working', true]]),
    ]);
    expect(rounds.map((round) => round.map((stop) => stop.setId))).toEqual([
      ['b1', 'f1'],
      ['b2'],
      ['b3'],
    ]);
  });

  it('keeps a round open while a drop off one of its sets is still to tick', () => {
    const rounds = supersetRounds([
      member('curl', [
        ['c1', 'working', true],
        ['d1', 'dropset', false],
      ]),
      member('pushdown', [['p1', 'working', true]]),
    ]);
    expect(rounds[0]).toEqual([
      { entryId: 'curl', setId: 'c1', done: false },
      { entryId: 'pushdown', setId: 'p1', done: true },
    ]);
  });
});

describe('after a tick', () => {
  it('moves on to the next exercise mid-round, holding the rest', () => {
    const members = [
      member('bench', [
        ['b1', 'working', true],
        ['b2', 'working', false],
      ]),
      member('row', [
        ['r1', 'working', false],
        ['r2', 'working', false],
      ]),
    ];
    expect(afterTick(members, 'b1')).toEqual({
      rest: 'hold',
      next: { entryId: 'row', setId: 'r1', done: false },
    });
  });

  it('rests once the round is done, and shows where the next one starts', () => {
    const members = [
      member('bench', [
        ['b1', 'working', true],
        ['b2', 'working', false],
      ]),
      member('row', [
        ['r1', 'working', true],
        ['r2', 'working', false],
      ]),
    ];
    expect(afterTick(members, 'r1')).toEqual({
      rest: 'start',
      next: { entryId: 'bench', setId: 'b2', done: false },
    });
  });

  it('comes round to an exercise earlier in the list that was skipped', () => {
    const members = [
      member('a', [['a1', 'working', false]]),
      member('b', [['b1', 'working', true]]),
      member('c', [['c1', 'working', true]]),
    ];
    expect(afterTick(members, 'c1')).toEqual({
      rest: 'hold',
      next: { entryId: 'a', setId: 'a1', done: false },
    });
  });

  it('rests with nowhere to go after the last set of all', () => {
    const members = [
      member('a', [['a1', 'working', true]]),
      member('b', [['b1', 'working', true]]),
    ];
    expect(afterTick(members, 'b1')).toEqual({ rest: 'start', next: null });
  });

  it('treats a drop as part of its set: on to the next exercise', () => {
    const members = [
      member('curl', [
        ['c1', 'working', true],
        ['d1', 'dropset', true],
      ]),
      member('pushdown', [['p1', 'working', false]]),
    ];
    expect(afterTick(members, 'd1').next?.setId).toBe('p1');
  });

  /** The drop is right there under the thumb; the round waits for it. */
  it('holds without moving while a drop on the set just done is still to tick', () => {
    const members = [
      member('curl', [['c1', 'working', true]]),
      member('pushdown', [
        ['p1', 'working', true],
        ['d1', 'dropset', false],
      ]),
    ];
    expect(afterTick(members, 'p1')).toEqual({ rest: 'hold', next: null });
  });

  it('rests as usual after a warm-up, which is not part of a round', () => {
    const members = [
      member('bench', [
        ['w', 'warmup', true],
        ['b1', 'working', false],
      ]),
      member('row', [['r1', 'working', false]]),
    ];
    expect(afterTick(members, 'w')).toEqual({ rest: 'start', next: null });
    expect(afterTick(members, 'nowhere')).toEqual({ rest: 'start', next: null });
  });
});

describe('the rest after a round', () => {
  it('is as long as the longest of its exercises needs', () => {
    expect(roundRestSeconds([90, 180, 60])).toBe(180);
    expect(roundRestSeconds([])).toBe(0);
  });
});

describe('moving things in a routine', () => {
  function rows(groups: (string | null)[]): MovableRow[] {
    const keys = initialOrderKeys(groups.length);
    return groups.map((group, index) => ({
      id: String.fromCharCode(97 + index),
      orderKey: keys[index]!,
      supersetId: group,
    }));
  }

  function apply(list: MovableRow[], writes: { id: string; orderKey: string }[]): string {
    const keyed = list.map((row) => ({
      ...row,
      orderKey: writes.find((write) => write.id === row.id)?.orderKey ?? row.orderKey,
    }));
    return sortByOrder(keyed)
      .map((row) => row.id)
      .join('');
  }

  it('moves a lone exercise past a whole superset in one write', () => {
    const list = rows([null, 'x', 'x', 'x']);
    const writes = planMove(list, { unit: 0 }, 1);
    expect(writes).toHaveLength(1);
    expect(apply(list, writes)).toBe('bcda');
  });

  it('moves a superset as a block', () => {
    const list = rows([null, 'x', 'x']);
    expect(apply(list, planMove(list, { unit: 1 }, -1))).toBe('bca');
  });

  it('moves a member only inside its superset', () => {
    const list = rows([null, 'x', 'x', null]);
    expect(apply(list, planMove(list, { member: 'c' }, -1))).toBe('acbd');
    expect(planMove(list, { member: 'b' }, -1)).toEqual([]);
    expect(planMove(list, { member: 'c' }, 1)).toEqual([]);
    expect(planMove(list, { member: 'a' }, 1)).toEqual([]);
    expect(planMove(list, { member: 'nowhere' }, 1)).toEqual([]);
  });

  it('has nowhere to go past either end', () => {
    const list = rows([null, null]);
    expect(planMove(list, { unit: 0 }, -1)).toEqual([]);
    expect(planMove(list, { unit: 1 }, 1)).toEqual([]);
  });

  /** Two devices minted the same key. The whole list is re-keyed rather than stuck. */
  it('re-keys everything when tied keys leave no room', () => {
    const list: MovableRow[] = [
      { id: 'a', orderKey: 'a0', supersetId: null },
      { id: 'b', orderKey: 'a1', supersetId: null },
      { id: 'c', orderKey: 'a1', supersetId: null },
    ];
    const writes = planMove(list, { unit: 2 }, -1);
    expect(apply(list, writes)).toBe('acb');
  });
});
