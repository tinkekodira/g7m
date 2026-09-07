import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryContext } from './database.js';
import { GoalRepository } from './goals.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let goals: GoalRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';

function context(): RepositoryContext {
  return { userId: USER, newId: () => `g-${String(++nextId)}`, now: () => clock };
}

beforeEach(() => {
  db = startSqliteHarness();
  clock = new Date('2026-09-07T10:00:00.000Z');
  nextId = 0;
  goals = new GoalRepository(db, context());
});

afterEach(() => {
  db.close();
});

describe('set', () => {
  it('records the goal and how often they can train', async () => {
    const goal = await goals.set({ goal: 'lose_fat', daysPerWeek: 4 });
    expect(goal.goal).toBe('lose_fat');
    expect(goal.daysPerWeek).toBe(4);
  });

  /**
   * The reason this is a table and not a column. "How has this been going" is
   * only answerable against a start date, and a change of mind must not be
   * able to rewrite the window the feedback loop reads.
   */
  it('appends rather than replacing', async () => {
    await goals.set({ goal: 'lose_fat', daysPerWeek: 4 });
    clock = new Date('2026-11-01T10:00:00.000Z');
    await goals.set({ goal: 'build_muscle', daysPerWeek: 4 });

    expect(await goals.history()).toHaveLength(2);
    expect((await goals.current())?.goal).toBe('build_muscle');
  });

  it('defaults the training frequency rather than demanding it', async () => {
    expect((await goals.set({ goal: 'recomp' })).daysPerWeek).toBe(3);
  });

  /**
   * Somebody who types 9 meant "as often as I can", and seven is that. A
   * rejection would be a modal in the way of the one decision this captures.
   */
  it('clamps a frequency the column could not hold', async () => {
    expect((await goals.set({ goal: 'recomp', daysPerWeek: 9 })).daysPerWeek).toBe(7);
    expect((await goals.set({ goal: 'recomp', daysPerWeek: 0 })).daysPerWeek).toBe(1);
    expect((await goals.set({ goal: 'recomp', daysPerWeek: 3.4 })).daysPerWeek).toBe(3);
  });

  /**
   * The CHECK would refuse it, and a row refused on upload is discarded
   * permanently and stranded on the device.
   */
  it('refuses a goal the column would reject', async () => {
    await expect(goals.set({ goal: 'get_shredded' as unknown as 'lose_fat' })).rejects.toThrow(
      /not a training goal/i,
    );
  });

  it('records when the goal began, not when it was typed', async () => {
    // Somebody entering a cut they started three weeks ago.
    const began = new Date('2026-08-17T06:00:00.000Z');
    expect((await goals.set({ goal: 'lose_fat', startedAt: began })).startedAt).toEqual(began);
  });

  it('trims a note and stores nothing rather than an empty string', async () => {
    expect((await goals.set({ goal: 'recomp', note: '   ' })).note).toBeNull();
    expect((await goals.set({ goal: 'recomp', note: '  knee rehab ' })).note).toBe('knee rehab');
  });

  it('stamps the owner on the row', async () => {
    const goal = await goals.set({ goal: 'lose_fat' });
    const row = await db.get<Record<string, unknown>>('SELECT * FROM training_goals WHERE id = ?', [
      goal.id,
    ]);
    expect(row.user_id).toBe(USER);
  });
});

describe('current', () => {
  it('is null before a goal has ever been chosen', async () => {
    expect(await goals.current()).toBeNull();
  });

  it('goes by when the goal began, not the order it was entered', async () => {
    // Backfilling a goal that started in August must not become the current one.
    await goals.set({ goal: 'build_muscle' });
    await goals.set({ goal: 'lose_fat', startedAt: new Date('2026-08-01T10:00:00.000Z') });

    expect((await goals.current())?.goal).toBe('build_muscle');
  });

  it('does not read another user’s goal', async () => {
    await goals.set({ goal: 'lose_fat' });
    const stranger = new GoalRepository(db, { userId: 'user-2' });
    expect(await stranger.current()).toBeNull();
  });
});

describe('history', () => {
  it('is newest first, because that is how a list is read', async () => {
    await goals.set({ goal: 'lose_fat', startedAt: new Date('2026-06-01T10:00:00.000Z') });
    await goals.set({ goal: 'recomp', startedAt: new Date('2026-08-01T10:00:00.000Z') });

    expect((await goals.history()).map((entry) => entry.goal)).toEqual(['recomp', 'lose_fat']);
  });

  it('is empty rather than throwing when there is nothing', async () => {
    expect(await goals.history()).toEqual([]);
  });
});

describe('correct', () => {
  it('fixes a decision in place without appending', async () => {
    const goal = await goals.set({ goal: 'lose_fat', daysPerWeek: 2 });
    await goals.correct(goal.id, { daysPerWeek: 4 });

    expect((await goals.current())?.daysPerWeek).toBe(4);
    expect(await goals.history()).toHaveLength(1);
  });

  it('leaves fields it was not given alone', async () => {
    const goal = await goals.set({ goal: 'lose_fat', daysPerWeek: 4 });
    await goals.correct(goal.id, { daysPerWeek: 5 });
    expect((await goals.current())?.goal).toBe('lose_fat');
  });

  it('does nothing when given nothing', async () => {
    const goal = await goals.set({ goal: 'lose_fat', daysPerWeek: 4 });
    await goals.correct(goal.id, {});
    expect((await goals.current())?.daysPerWeek).toBe(4);
  });

  it('refuses a goal the column would reject', async () => {
    const goal = await goals.set({ goal: 'lose_fat' });
    await expect(
      goals.correct(goal.id, { goal: 'bulking' as unknown as 'lose_fat' }),
    ).rejects.toThrow(/not a training goal/i);
  });

  it('does not touch another user’s decision', async () => {
    const goal = await goals.set({ goal: 'lose_fat', daysPerWeek: 4 });
    const stranger = new GoalRepository(db, { userId: 'user-2' });
    await stranger.correct(goal.id, { daysPerWeek: 1 });

    expect((await goals.current())?.daysPerWeek).toBe(4);
  });
});

describe('remove', () => {
  it('deletes one decision', async () => {
    const goal = await goals.set({ goal: 'lose_fat' });
    await goals.remove(goal.id);
    expect(await goals.current()).toBeNull();
  });
});

describe('when nobody is signed in', () => {
  it('refuses to read or write', async () => {
    const anonymous = new GoalRepository(db, { userId: '' });
    await expect(anonymous.set({ goal: 'lose_fat' })).rejects.toThrow(/signed-in user/);
    await expect(anonymous.current()).rejects.toThrow(/signed-in user/);
  });
});
