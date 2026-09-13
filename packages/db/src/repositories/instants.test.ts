import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BodyMetricsRepository } from './body-metrics.js';
import { HistoryRepository } from './history.js';
import { INSTANT_PARAMETER, instant, isoText } from './instants.js';
import { PlannerRepository } from './planner.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * Two spellings of one instant, on one device.
 *
 * `…T…` is what the app writes; `… …Z` (a space, and no fraction on a whole
 * second) is what PowerSync sent under the legacy sync-rules edition, and what
 * any row that synced back before ADR-0068 still holds. Compared as text, the
 * space sorts first, so the synced row lands on the wrong side of a window
 * that starts on its own day. These are the cases that used to be wrong.
 */

let db: SqliteHarness;
const USER = 'user-1';
const context: RepositoryContext = { userId: USER, now: () => new Date('2026-09-14T12:00:00Z') };

beforeEach(async () => {
  db = startSqliteHarness();
  await db.seed('exercises', { id: 'bench', slug: 'bench-press', name: 'Bench Press' });
});

afterEach(() => {
  db.close();
});

/** A finished workout with one completed set, spelt however the test says. */
async function workout(id: string, startedAt: string, completedAt = startedAt): Promise<void> {
  await db.seed('workout_sessions', {
    id,
    user_id: USER,
    started_at: startedAt,
    ended_at: startedAt,
    source: 'manual',
  });
  await db.seed('session_exercises', {
    id: `${id}-ex`,
    user_id: USER,
    session_id: id,
    exercise_id: 'bench',
    order_key: 'a0',
  });
  await db.seed('session_sets', {
    id: `${id}-set`,
    user_id: USER,
    session_exercise_id: `${id}-ex`,
    order_key: 'a0',
    set_type: 'working',
    load_type: 'external',
    weight_kg: 100,
    reps: 5,
    is_completed: 1,
    completed_at: completedAt,
  });
}

describe('instant()', () => {
  it.each([
    ['2026-09-13T22:30:00.000Z', '2026-09-13 22:30:00Z'],
    ['2026-09-13T22:30:00.120Z', '2026-09-13 22:30:00.12Z'],
    ['2026-09-13T22:30:00.123Z', '2026-09-13T22:30:00.123456Z'],
  ])('reads %s and %s as the same instant', async (a, b) => {
    const row = await db.get<{ same: number }>(
      `SELECT abs(${instant('?')} - ${INSTANT_PARAMETER}) < 1e-8 AS same`,
      [a, b],
    );
    expect(row.same).toBe(1);
  });

  it('orders by time where text would not', async () => {
    // As text, the space puts 23:30 before 22:00 on the same day.
    const row = await db.get<{ text: number; time: number }>(
      `SELECT ? < ? AS text, ${instant('?')} < ${INSTANT_PARAMETER} AS time`,
      [
        '2026-09-13 23:30:00Z',
        '2026-09-13T22:00:00.000Z',
        '2026-09-13 23:30:00Z',
        '2026-09-13T22:00:00.000Z',
      ],
    );
    expect(row).toEqual({ text: 1, time: 0 });
  });

  it('writes an aggregate back as the app spells it', async () => {
    const row = await db.get<{ at: string }>(`SELECT ${isoText(instant('?'))} AS at`, [
      '2026-09-13 22:30:00.5Z',
    ]);
    expect(row.at).toBe('2026-09-13T22:30:00.500Z');
  });
});

describe('windows that start on the same day as a synced row', () => {
  // Monday 00:00 in Central Europe is Sunday 22:00 UTC: the start of "this
  // week" falls on the same UTC date as a Sunday-night-UTC workout.
  const weekStart = new Date('2026-09-13T22:00:00.000Z');

  it('counts a synced workout inside the week it belongs to', async () => {
    await workout('synced', '2026-09-13 23:30:00Z');
    const sets = await new HistoryRepository(db, context).completedSets({ from: weekStart });
    expect(sets.map((set) => set.sessionId)).toEqual(['synced']);
  });

  it('keeps one just before the week out of it', async () => {
    await workout('before', '2026-09-13 21:59:59.5Z');
    const sets = await new HistoryRepository(db, context).completedSets({ from: weekStart });
    expect(sets).toEqual([]);
  });

  it('counts sessions for the planner the same way', async () => {
    await workout('synced', '2026-09-13 23:30:00Z');
    await workout('local', '2026-09-14T08:00:00.000Z');
    expect(await new PlannerRepository(db, context).sessionCountSince(weekStart)).toBe(2);
  });

  it('keeps a weigh-in in its window', async () => {
    await db.seed('body_metrics', {
      id: 'w1',
      user_id: USER,
      recorded_at: '2026-09-13 23:00:00Z',
      weight_kg: 80,
    });
    const readings = await new BodyMetricsRepository(db, context).between({ from: weekStart });
    expect(readings.map((reading) => reading.weightKg)).toEqual([80]);
  });
});

describe('two workouts on one day, one synced and one not', () => {
  it('lists them newest first by time, not by spelling', async () => {
    // As text, both `T` rows sort after the space row whatever their times,
    // which put the evening's synced workout last.
    await workout('morning-local', '2026-09-14T07:00:00.000Z');
    await workout('evening-synced', '2026-09-14 19:00:00.25Z');
    await workout('noon-local', '2026-09-14T12:00:00.000Z');

    const summaries = await new HistoryRepository(db, context).sessionSummaries();
    expect(summaries.map((summary) => summary.sessionId)).toEqual([
      'evening-synced',
      'noon-local',
      'morning-local',
    ]);
  });

  it('finds the latest of them for "last trained"', async () => {
    await workout('evening-synced', '2026-09-14 19:00:00Z');
    await workout('morning-local', '2026-09-14T07:00:00.000Z');

    const [bench] = await new HistoryRepository(db, context).trainedExercises();
    expect(bench?.lastAt.toISOString()).toBe('2026-09-14T19:00:00.000Z');
  });

  it('spans the first and last set by time', async () => {
    await workout('one', '2026-09-14T07:00:00.000Z', '2026-09-14T07:05:00.000Z');
    await db.seed('session_sets', {
      id: 'one-set-2',
      user_id: USER,
      session_exercise_id: 'one-ex',
      order_key: 'a1',
      set_type: 'working',
      load_type: 'external',
      weight_kg: 100,
      reps: 5,
      is_completed: 1,
      completed_at: '2026-09-14 07:40:00Z',
    });

    const [summary] = await new HistoryRepository(db, context).sessionSummaries();
    expect(summary?.firstSetAt?.toISOString()).toBe('2026-09-14T07:05:00.000Z');
    expect(summary?.lastSetAt?.toISOString()).toBe('2026-09-14T07:40:00.000Z');
  });
});
