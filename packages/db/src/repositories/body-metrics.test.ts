import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BodyMetricsRepository } from './body-metrics.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let metrics: BodyMetricsRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';

function context(): RepositoryContext {
  return { userId: USER, newId: () => `m-${String(++nextId)}`, now: () => clock };
}

beforeEach(() => {
  db = startSqliteHarness();
  clock = new Date('2026-09-07T10:00:00.000Z');
  nextId = 0;
  metrics = new BodyMetricsRepository(db, context());
});

afterEach(() => {
  db.close();
});

describe('record', () => {
  /**
   * The whole point of the table. Overwriting last Sunday's weight with this
   * Sunday's is what makes the series unreconstructable, so there is no
   * operation that does it — only `record`.
   */
  it('appends rather than replacing', async () => {
    await metrics.record({ weightKg: 82 });
    clock = new Date('2026-09-14T10:00:00.000Z');
    await metrics.record({ weightKg: 81.4 });

    const series = await metrics.between();
    expect(series.map((entry) => entry.weightKg)).toEqual([82, 81.4]);
  });

  it('records the time it was measured, not the time it was typed', async () => {
    // A weight entered on Monday evening for Sunday morning is Sunday's.
    const measured = new Date('2026-09-06T07:00:00.000Z');
    const entry = await metrics.record({ weightKg: 82, recordedAt: measured });
    expect(entry.recordedAt).toEqual(measured);
  });

  it('defaults to now when no time is given', async () => {
    expect((await metrics.record({ weightKg: 82 })).recordedAt).toEqual(clock);
  });

  it('takes height, activity and body fat as well as weight', async () => {
    const entry = await metrics.record({
      weightKg: 82,
      heightCm: 183,
      activityLevel: 'moderate',
      bodyFatPercent: 18.5,
      note: '  after breakfast  ',
    });
    expect(entry.heightCm).toBe(183);
    expect(entry.activityLevel).toBe('moderate');
    expect(entry.bodyFatPercent).toBe(18.5);
    expect(entry.note).toBe('after breakfast');
  });

  /**
   * The Postgres CHECK refuses an empty row, and a row refused on upload is
   * discarded permanently and stranded on the device. Better to refuse it
   * here, where somebody can be told.
   */
  it('refuses a measurement with nothing in it', async () => {
    await expect(metrics.record({})).rejects.toThrow(/at least one value/);
    await expect(metrics.record({ note: 'felt strong' })).rejects.toThrow(/at least one value/);
  });

  it('drops a value the column could not hold rather than writing it', async () => {
    // Each of these breaks a CHECK, and would be refused on upload.
    await expect(metrics.record({ weightKg: 0 })).rejects.toThrow();
    await expect(metrics.record({ weightKg: -5 })).rejects.toThrow();
    await expect(metrics.record({ heightCm: 20 })).rejects.toThrow();
    await expect(metrics.record({ bodyFatPercent: 90 })).rejects.toThrow();
  });

  it('rounds to what the numeric columns hold', async () => {
    const entry = await metrics.record({ weightKg: 82.567, heightCm: 183.44 });
    expect(entry.weightKg).toBe(82.57);
    expect(entry.heightCm).toBe(183.4);
  });

  it('stamps the owner on the row', async () => {
    const entry = await metrics.record({ weightKg: 82 });
    const row = await db.get<Record<string, unknown>>('SELECT * FROM body_metrics WHERE id = ?', [
      entry.id,
    ]);
    expect(row.user_id).toBe(USER);
  });
});

describe('latestWeight', () => {
  it('is null before anything is recorded', async () => {
    expect(await metrics.latestWeight()).toBeNull();
  });

  it('is the most recent reading that has a weight in it', async () => {
    await metrics.record({ weightKg: 82 });
    clock = new Date('2026-09-14T10:00:00.000Z');
    await metrics.record({ weightKg: 81 });

    expect((await metrics.latestWeight())?.weightKg).toBe(81);
  });

  /**
   * A reading that only changed the activity level has no weight in it, and
   * returning it would read as the weight having been forgotten.
   */
  it('skips a later reading that recorded something else', async () => {
    await metrics.record({ weightKg: 82 });
    clock = new Date('2026-09-14T10:00:00.000Z');
    await metrics.record({ activityLevel: 'active' });

    expect((await metrics.latestWeight())?.weightKg).toBe(82);
  });

  it('goes by when it was measured, not the order it was entered', async () => {
    // Backfilling last week's weigh-in must not become "the latest".
    await metrics.record({ weightKg: 81 });
    await metrics.record({ weightKg: 85, recordedAt: new Date('2026-08-01T10:00:00.000Z') });

    expect((await metrics.latestWeight())?.weightKg).toBe(81);
  });

  it('does not read another user’s measurements', async () => {
    await metrics.record({ weightKg: 82 });
    const stranger = new BodyMetricsRepository(db, { userId: 'user-2' });
    expect(await stranger.latestWeight()).toBeNull();
  });
});

describe('between', () => {
  beforeEach(async () => {
    for (const [day, weight] of [
      ['2026-08-01', 85],
      ['2026-09-01', 83],
      ['2026-09-07', 82],
    ] as const) {
      await metrics.record({ weightKg: weight, recordedAt: new Date(`${day}T10:00:00.000Z`) });
    }
  });

  it('is oldest first, because a trend is drawn that way', async () => {
    expect((await metrics.between()).map((entry) => entry.weightKg)).toEqual([85, 83, 82]);
  });

  it('narrows to a window, with `to` exclusive', async () => {
    const window = await metrics.between({
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-09-07T00:00:00.000Z'),
    });
    expect(window.map((entry) => entry.weightKg)).toEqual([83]);
  });
});

describe('correct', () => {
  /**
   * The append-only rule is about not overwriting last week's reading with
   * this week's. It was never about being unable to fix a typo entered a
   * minute ago — which is why this takes an id and `record` does not.
   */
  it('fixes a reading in place', async () => {
    const entry = await metrics.record({ weightKg: 820 });
    await metrics.correct(entry.id, { weightKg: 82 });

    expect((await metrics.latestWeight())?.weightKg).toBe(82);
    expect(await metrics.between()).toHaveLength(1);
  });

  it('leaves fields it was not given alone', async () => {
    const entry = await metrics.record({ weightKg: 82, heightCm: 183 });
    await metrics.correct(entry.id, { weightKg: 81 });

    const [corrected] = await metrics.between();
    expect(corrected?.heightCm).toBe(183);
  });

  it('does nothing when given nothing', async () => {
    const entry = await metrics.record({ weightKg: 82 });
    await metrics.correct(entry.id, {});
    expect((await metrics.between())[0]?.weightKg).toBe(82);
  });

  it('does not touch another user’s reading', async () => {
    const entry = await metrics.record({ weightKg: 82 });
    const stranger = new BodyMetricsRepository(db, { userId: 'user-2' });
    await stranger.correct(entry.id, { weightKg: 60 });

    expect((await metrics.latestWeight())?.weightKg).toBe(82);
  });
});

describe('remove', () => {
  it('deletes one reading', async () => {
    const entry = await metrics.record({ weightKg: 82 });
    await metrics.remove(entry.id);
    expect(await metrics.between()).toEqual([]);
  });
});

describe('reading a row back', () => {
  it('treats an unrecognised activity level as unknown, not as sedentary', async () => {
    // The default would feed a maintenance-calorie estimate with a wrong
    // answer rather than an absent one, which is worse than saying nothing.
    await db.seed('body_metrics', {
      id: 'm-x',
      user_id: USER,
      recorded_at: '2026-09-07T10:00:00.000Z',
      weight_kg: 82,
      activity_level: 'olympian',
      created_at: '2026-09-07T10:00:00.000Z',
      updated_at: '2026-09-07T10:00:00.000Z',
    });
    expect((await metrics.latest())?.activityLevel).toBeNull();
  });

  it('reads a real activity level', async () => {
    await metrics.record({ weightKg: 82, activityLevel: 'very_active' });
    expect((await metrics.latest())?.activityLevel).toBe('very_active');
  });
});

describe('when nobody is signed in', () => {
  it('refuses to read or write', async () => {
    const anonymous = new BodyMetricsRepository(db, { userId: '' });
    await expect(anonymous.record({ weightKg: 82 })).rejects.toThrow(/signed-in user/);
    await expect(anonymous.latestWeight()).rejects.toThrow(/signed-in user/);
  });
});
