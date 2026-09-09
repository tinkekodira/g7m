import { describe, expect, it, vi } from 'vitest';
import {
  describePersistence,
  ensurePersistentStorage,
  formatBytes,
  type PersistenceState,
} from './storage.js';

/** A StorageManager stand-in. Only the three methods we call are real. */
function fakeStorage(options: {
  persisted?: boolean | (() => Promise<boolean>);
  persist?: boolean | (() => Promise<boolean>);
  estimate?: StorageEstimate | (() => Promise<StorageEstimate>);
  omitPersist?: boolean;
}): StorageManager {
  const resolve = <T>(value: T | (() => Promise<T>)): (() => Promise<T>) =>
    typeof value === 'function' ? (value as () => Promise<T>) : () => Promise.resolve(value);

  const storage: Record<string, unknown> = {
    persisted: resolve(options.persisted ?? false),
    estimate: resolve(options.estimate ?? { quota: 1024 * 1024 * 100, usage: 1024 * 1024 }),
  };
  if (options.omitPersist !== true) storage['persist'] = resolve(options.persist ?? false);
  return storage as unknown as StorageManager;
}

describe('ensurePersistentStorage', () => {
  it('reports unsupported when there is no Storage API at all', async () => {
    const report = await ensurePersistentStorage(undefined);
    expect(report.state).toBe('unsupported');
    expect(report.quotaBytes).toBeNull();
  });

  it('reports unsupported when persist() is missing, not just storage', async () => {
    const report = await ensurePersistentStorage(fakeStorage({ omitPersist: true }));
    expect(report.state).toBe('unsupported');
  });

  it('does not re-ask when permission is already held', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    const storage = fakeStorage({ persisted: true, persist });
    const report = await ensurePersistentStorage(storage);
    expect(report.state).toBe('granted');
    expect(persist, 'persist() should not be called when already persisted').not.toHaveBeenCalled();
  });

  it('asks when permission is not held, and reports a grant', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    const report = await ensurePersistentStorage(fakeStorage({ persisted: false, persist }));
    expect(report.state).toBe('granted');
    expect(persist).toHaveBeenCalledOnce();
  });

  /**
   * The case the spike surfaced. A refusal is a real answer that the app has to
   * carry forward — it means the local database can be evicted, so a synced
   * copy is the only durable one.
   */
  it('reports a refusal as denied rather than pretending it succeeded', async () => {
    const report = await ensurePersistentStorage(fakeStorage({ persisted: false, persist: false }));
    expect(report.state).toBe('denied');
  });

  it('reports error rather than throwing when the engine throws', async () => {
    const storage = fakeStorage({
      persisted: () => Promise.reject(new Error('private browsing')),
    });
    const report = await ensurePersistentStorage(storage);
    expect(report.state).toBe('error');
  });

  it('still returns quota when the persistence check throws', async () => {
    const storage = fakeStorage({
      persisted: () => Promise.reject(new Error('nope')),
      estimate: { quota: 5000, usage: 100 },
    });
    const report = await ensurePersistentStorage(storage);
    expect(report.state).toBe('error');
    expect(report.quotaBytes).toBe(5000);
  });

  it('survives an unavailable estimate without failing the whole check', async () => {
    const storage = fakeStorage({
      persisted: true,
      estimate: () => Promise.reject(new Error('not available')),
    });
    const report = await ensurePersistentStorage(storage);
    expect(report.state).toBe('granted');
    expect(report.quotaBytes).toBeNull();
  });

  it('passes quota and usage through when the engine reports them', async () => {
    const storage = fakeStorage({
      persisted: true,
      estimate: { quota: 41231686144, usage: 6291456 },
    });
    const report = await ensurePersistentStorage(storage);
    expect(report.quotaBytes).toBe(41231686144);
    expect(report.usageBytes).toBe(6291456);
  });
});

describe('formatBytes', () => {
  it('says unknown rather than 0 when the engine will not say', () => {
    expect(formatBytes(null)).toBe('unknown');
  });

  it('scales through KB, MB and GB', () => {
    expect(formatBytes(500 * 1024)).toBe('500 KB');
    expect(formatBytes(6 * 1024 * 1024)).toBe('6 MB');
    // The iPhone quota measured in the spike.
    expect(formatBytes(41231686144)).toBe('38.4 GB');
  });
});

describe('describePersistence', () => {
  it('has a message for every state', () => {
    const states: PersistenceState[] = ['granted', 'denied', 'unsupported', 'error'];
    for (const state of states) {
      expect(describePersistence(state).length, state).toBeGreaterThan(10);
    }
  });

  it('tells a denied user their synced data is still safe', () => {
    expect(describePersistence('denied')).toContain('nothing already synced is lost');
  });
});

/**
 * The failure that stopped the whole app.
 *
 * `openDatabase` awaited this, so an advisory browser API sat on the critical
 * path of every read. A `navigator.storage` that never answers left the
 * promise pending for ever and every screen sat on "Loading" with nothing to
 * show — a promise that never settles is not something a `catch` can see.
 */
describe('a browser that never answers', () => {
  const never = new Promise<never>(() => undefined);

  it('gives up on persist() rather than waiting for ever', async () => {
    const storage = {
      estimate: () => Promise.resolve({ quota: 100, usage: 10 }),
      persisted: () => Promise.resolve(false),
      persist: () => never,
    } as unknown as StorageManager;

    const report = await ensurePersistentStorage(storage, 10);
    // "Could not check", not "denied": the browser never refused, it never
    // replied, and saying it refused would be inventing an answer.
    expect(report.state).toBe('error');
    expect(report.quotaBytes).toBe(100);
  });

  it('gives up on persisted() too', async () => {
    const storage = {
      estimate: () => Promise.resolve({}),
      persisted: () => never,
      persist: () => Promise.resolve(true),
    } as unknown as StorageManager;

    const report = await ensurePersistentStorage(storage, 10);
    // Falls through to asking, which answers.
    expect(report.state).toBe('granted');
  });

  it('gives up on estimate() and still reports persistence', async () => {
    const storage = {
      estimate: () => never,
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
    } as unknown as StorageManager;

    const report = await ensurePersistentStorage(storage, 10);
    expect(report.state).toBe('granted');
    expect(report.quotaBytes).toBeNull();
  });

  it('still answers quickly when the browser does', async () => {
    const storage = {
      estimate: () => Promise.resolve({ quota: 1, usage: 0 }),
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
    } as unknown as StorageManager;

    const started = Date.now();
    await ensurePersistentStorage(storage, 5000);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
