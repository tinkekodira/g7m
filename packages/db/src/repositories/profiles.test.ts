import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProfileRepository } from './profiles.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * Every clamp here exists because SQLite enforces no CHECK constraints and
 * Postgres enforces several. A value outside the range is written happily on
 * the device and refused on upload — permanently, since the queue treats a
 * 23xxx as a discard — so it is dropped server-side and left sitting on the
 * phone with nothing to explain it.
 */

let db: SqliteHarness;
let profiles: ProfileRepository;

const USER = 'user-1';
const NOW = new Date('2026-09-06T10:00:00.000Z');

async function seedProfile(over: Record<string, string | number | null> = {}): Promise<void> {
  await db.seed('profiles', {
    id: 'profile-1',
    user_id: USER,
    display_name: 'Milan',
    unit_system: 'metric',
    experience_level: 'beginner',
    birth_year: null,
    bodyweight_kg: null,
    rest_seconds_default: 120,
    week_starts_on: 1,
    onboarded_at: null,
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z',
    ...over,
  });
}

beforeEach(() => {
  db = startSqliteHarness();
  profiles = new ProfileRepository(db, { userId: USER, now: () => NOW });
});

afterEach(() => {
  db.close();
});

describe('current', () => {
  it('reads the row the signup trigger created', async () => {
    await seedProfile({ bodyweight_kg: 80.5, unit_system: 'imperial' });
    const profile = await profiles.current();

    expect(profile?.displayName).toBe('Milan');
    expect(profile?.unitSystem).toBe('imperial');
    expect(profile?.bodyweightKg).toBe(80.5);
    expect(profile?.restSecondsDefault).toBe(120);
  });

  /**
   * Null, not an invented row. If the profile is missing the signup trigger
   * failed, and papering over it here would hide that for months.
   */
  it('is null when there is no profile', async () => {
    expect(await profiles.current()).toBeNull();
  });

  it('does not return another user’s profile', async () => {
    // A sign-out that did not clear leaves the previous user's row in place
    // until the next sync catches up. On a shared phone that matters.
    await seedProfile({ id: 'other', user_id: 'user-2', display_name: 'Someone else' });
    expect(await profiles.current()).toBeNull();
  });
});

describe('update', () => {
  // Wrapped, not passed directly: vitest hands the hook a test context, which
  // would land in `over` and be spread into the row as columns that do not exist.
  beforeEach(() => seedProfile());

  it('changes what it was given and leaves the rest', async () => {
    const updated = await profiles.update({ unitSystem: 'imperial' });
    expect(updated?.unitSystem).toBe('imperial');
    expect(updated?.displayName).toBe('Milan');
    expect(updated?.restSecondsDefault).toBe(120);
  });

  it('touches updated_at, so the change is queued for upload', async () => {
    await profiles.update({ unitSystem: 'imperial' });
    const row = await db.get<Record<string, unknown>>('SELECT * FROM profiles WHERE user_id = ?', [
      USER,
    ]);
    expect(row.updated_at).toBe('2026-09-06T10:00:00.000Z');
  });

  it('does nothing when given nothing', async () => {
    const before = await profiles.current();
    expect(await profiles.update({})).toEqual(before);
  });

  describe('bodyweight', () => {
    it('rounds to the two decimal places the column holds', async () => {
      expect((await profiles.update({ bodyweightKg: 80.567 }))?.bodyweightKg).toBe(80.57);
    });

    /**
     * `bodyweight_kg > 0` is a CHECK. Zero is also the value that would make
     * every bodyweight set worth nothing, so it must not survive as a number.
     */
    it('stores no bodyweight rather than zero or a negative', async () => {
      expect((await profiles.update({ bodyweightKg: 0 }))?.bodyweightKg).toBeNull();
      expect((await profiles.update({ bodyweightKg: -5 }))?.bodyweightKg).toBeNull();
    });

    it('lets it be cleared on purpose', async () => {
      await profiles.update({ bodyweightKg: 80 });
      expect((await profiles.update({ bodyweightKg: null }))?.bodyweightKg).toBeNull();
    });

    it('caps a mistyped value at what numeric(5,2) can hold', async () => {
      expect((await profiles.update({ bodyweightKg: 80000 }))?.bodyweightKg).toBe(999.99);
    });
  });

  describe('rest default', () => {
    it('clamps to the 15–900 the column allows', async () => {
      expect((await profiles.update({ restSecondsDefault: 5 }))?.restSecondsDefault).toBe(15);
      expect((await profiles.update({ restSecondsDefault: 9999 }))?.restSecondsDefault).toBe(900);
    });

    it('keeps a sensible value untouched', async () => {
      expect((await profiles.update({ restSecondsDefault: 90 }))?.restSecondsDefault).toBe(90);
    });
  });

  describe('birth year', () => {
    it('keeps one inside 1900–2100', async () => {
      expect((await profiles.update({ birthYear: 1998 }))?.birthYear).toBe(1998);
    });

    it('drops one outside the range rather than storing it', async () => {
      expect((await profiles.update({ birthYear: 1200 }))?.birthYear).toBeNull();
      expect((await profiles.update({ birthYear: 3000 }))?.birthYear).toBeNull();
    });
  });

  describe('display name', () => {
    it('treats whitespace as no name at all', async () => {
      // Storing '' would render the greeting as "Welcome, " with nothing after.
      expect((await profiles.update({ displayName: '   ' }))?.displayName).toBeNull();
    });

    it('trims what it keeps', async () => {
      expect((await profiles.update({ displayName: '  Milan  ' }))?.displayName).toBe('Milan');
    });
  });

  it('falls back to Monday for a week start outside 0–6', async () => {
    expect((await profiles.update({ weekStartsOn: 9 }))?.weekStartsOn).toBe(1);
    expect((await profiles.update({ weekStartsOn: 0 }))?.weekStartsOn).toBe(0);
  });

  it('writes onboardedAt as an ISO timestamp in UTC', async () => {
    await profiles.update({ onboardedAt: new Date('2026-09-06T09:30:00.000Z') });
    const row = await db.get<Record<string, unknown>>('SELECT * FROM profiles WHERE user_id = ?', [
      USER,
    ]);
    expect(row.onboarded_at).toBe('2026-09-06T09:30:00.000Z');
  });

  it('does not touch another user’s profile', async () => {
    await seedProfile({ id: 'other', user_id: 'user-2', unit_system: 'metric' });
    await profiles.update({ unitSystem: 'imperial' });

    const other = await db.get<Record<string, unknown>>('SELECT * FROM profiles WHERE id = ?', [
      'other',
    ]);
    expect(other.unit_system).toBe('metric');
  });
});

describe('when nobody is signed in', () => {
  it('refuses to read or write', async () => {
    const anonymous = new ProfileRepository(db, { userId: '' });
    await expect(anonymous.current()).rejects.toThrow(/signed-in user/);
    await expect(anonymous.update({ unitSystem: 'metric' })).rejects.toThrow(/signed-in user/);
  });
});

describe('sex', () => {
  // Not seeded by the file-level beforeEach; each block arranges its own row.
  beforeEach(() => seedProfile());

  it('is null until somebody answers', async () => {
    expect((await profiles.current())?.sex).toBeNull();
  });

  it('stores either of the two values', async () => {
    await profiles.update({ sex: 'female' });
    expect((await profiles.current())?.sex).toBe('female');
    await profiles.update({ sex: 'male' });
    expect((await profiles.current())?.sex).toBe('male');
  });

  it('can be cleared again', async () => {
    await profiles.update({ sex: 'male' });
    await profiles.update({ sex: null });
    expect((await profiles.current())?.sex).toBeNull();
  });

  /**
   * The CHECK would refuse it, and a row refused on upload is discarded
   * permanently and stranded on the device.
   */
  it('stores nothing rather than a value the column would reject', async () => {
    await profiles.update({ sex: 'other' as unknown as 'male' });
    expect((await profiles.current())?.sex).toBeNull();
  });

  it('reads an unrecognised stored value as unknown', async () => {
    // A default here would put a confident wrong answer into a sentence about
    // somebody's expected rate of progress.
    await db.execute('UPDATE profiles SET sex = ? WHERE user_id = ?', ['unspecified', USER]);
    expect((await profiles.current())?.sex).toBeNull();
  });
});

describe('country', () => {
  beforeEach(() => seedProfile());

  it('is null until somebody answers', async () => {
    expect((await profiles.current())?.country).toBeNull();
  });

  it('stores a two-letter code', async () => {
    await profiles.update({ country: 'HR' });
    expect((await profiles.current())?.country).toBe('HR');
  });

  it('normalises what a form hands it', async () => {
    // A select can return anything; the CHECK only accepts upper case.
    await profiles.update({ country: ' de ' });
    expect((await profiles.current())?.country).toBe('DE');
  });

  /**
   * The CHECK would refuse it, and a row refused on upload is discarded
   * permanently and stranded on the device.
   */
  it('stores nothing rather than a value the column would reject', async () => {
    await profiles.update({ country: 'Germany' });
    expect((await profiles.current())?.country).toBeNull();
    await profiles.update({ country: 'D' });
    expect((await profiles.current())?.country).toBeNull();
  });

  it('can be cleared again', async () => {
    await profiles.update({ country: 'HR' });
    await profiles.update({ country: null });
    expect((await profiles.current())?.country).toBeNull();
  });
});
