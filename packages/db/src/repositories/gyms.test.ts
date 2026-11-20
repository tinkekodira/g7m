import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryContext } from './database.js';
import { GymRepository, cleanGymName } from './gyms.js';
import { SessionRepository } from './sessions.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let gyms: GymRepository;
let sessions: SessionRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';

function context(): RepositoryContext {
  return { userId: USER, newId: () => `id-${String(++nextId)}`, now: () => clock };
}

function later(minutes: number): void {
  clock = new Date(clock.getTime() + minutes * 60_000);
}

beforeEach(() => {
  db = startSqliteHarness();
  clock = new Date('2026-11-20T10:00:00.000Z');
  nextId = 0;
  gyms = new GymRepository(db, context());
  sessions = new SessionRepository(db, context());
});

afterEach(() => {
  db.close();
});

describe('cleanGymName', () => {
  it('trims and collapses spaces', () => {
    expect(cleanGymName('  Iron   Works ')).toBe('Iron Works');
  });

  it('refuses what the column would refuse', () => {
    expect(() => cleanGymName('   ')).toThrow(/needs a name/);
    expect(() => cleanGymName('x'.repeat(41))).toThrow(/40 characters/);
    expect(cleanGymName('x'.repeat(40))).toHaveLength(40);
  });
});

describe('list', () => {
  it('keeps the order gyms were added in, and moves one', async () => {
    const a = await gyms.create('Home gym');
    const b = await gyms.create('Work gym');
    const c = await gyms.create('Hotel');
    expect((await gyms.list()).map((gym) => gym.id)).toEqual([a.id, b.id, c.id]);

    await gyms.move(c.id, 0);
    expect((await gyms.list()).map((gym) => gym.id)).toEqual([c.id, a.id, b.id]);
  });

  it('hides archived gyms unless asked, and keeps their names', async () => {
    const a = await gyms.create('Old gym');
    const b = await gyms.create('New gym');
    await gyms.archive(a.id);
    expect((await gyms.list()).map((gym) => gym.id)).toEqual([b.id]);
    const all = await gyms.list({ includeArchived: true });
    expect(all.map((gym) => gym.name)).toEqual(['Old gym', 'New gym']);
    expect(all[0]?.archivedAt).not.toBeNull();
  });

  it('renames', async () => {
    const a = await gyms.create('Gym');
    await gyms.rename(a.id, ' Iron Works ');
    expect((await gyms.byId(a.id))?.name).toBe('Iron Works');
    await expect(gyms.rename(a.id, '')).rejects.toThrow(/needs a name/);
  });
});

describe('lastUsed', () => {
  it('is null with no gyms, and the first gym before any workout names one', async () => {
    expect(await gyms.lastUsed()).toBeNull();
    const a = await gyms.create('A');
    await gyms.create('B');
    expect(await gyms.lastUsed()).toBe(a.id);
  });

  it('is wherever the latest workout was', async () => {
    const a = await gyms.create('A');
    const b = await gyms.create('B');
    await sessions.start({ gymId: b.id });
    later(60);
    await sessions.start({ gymId: a.id, startedAt: new Date('2026-11-19T10:00:00.000Z') });
    expect(await gyms.lastUsed()).toBe(b.id);
  });

  it('skips a gym that has since been archived', async () => {
    const a = await gyms.create('A');
    const b = await gyms.create('B');
    await sessions.start({ gymId: b.id });
    await gyms.archive(b.id);
    expect(await gyms.lastUsed()).toBe(a.id);
  });
});

describe('tagUntaggedSessions', () => {
  it('tags every workout with no gym, and leaves tagged ones alone', async () => {
    const old = await sessions.start({ startedAt: new Date('2026-10-01T10:00:00.000Z') });
    await sessions.finish(old.id);
    const a = await gyms.create('A');
    const b = await gyms.create('B');
    const atB = await sessions.start({ gymId: b.id });

    expect(await gyms.tagUntaggedSessions(a.id)).toBe(1);
    expect((await sessions.byId(old.id))?.gymId).toBe(a.id);
    expect((await sessions.byId(atB.id))?.gymId).toBe(b.id);
    expect(await gyms.tagUntaggedSessions(a.id)).toBe(0);
  });
});

describe('sessions', () => {
  it('start with a gym and can be moved to another', async () => {
    const a = await gyms.create('A');
    const b = await gyms.create('B');
    const session = await sessions.start({ gymId: a.id });
    expect(session.gymId).toBe(a.id);
    await sessions.setGym(session.id, b.id);
    expect((await sessions.byId(session.id))?.gymId).toBe(b.id);
    await sessions.setGym(session.id, null);
    expect((await sessions.byId(session.id))?.gymId).toBeNull();
  });

  it('start without one for anybody with a single gym', async () => {
    await gyms.create('A');
    expect((await sessions.start()).gymId).toBeNull();
  });

  it('start at the usual gym once somebody trains at more than one', async () => {
    await db.execute(
      `INSERT INTO profiles (id, user_id, multiple_gyms, created_at, updated_at)
       VALUES ('p', ?, 1, '2026-11-20T00:00:00Z', '2026-11-20T00:00:00Z')`,
      [USER],
    );
    const a = await gyms.create('A');
    const b = await gyms.create('B');
    expect((await sessions.start()).gymId).toBe(a.id);
    later(60);
    await sessions.start({ gymId: b.id });
    later(60);
    expect((await sessions.start()).gymId).toBe(b.id);
    expect((await sessions.start({ gymId: null })).gymId).toBeNull();
  });
});
