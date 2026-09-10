import { describe, expect, it, vi } from 'vitest';
import { DRAIN_POLL_MS, DRAIN_TIMEOUT_MS, drainQueue, type DrainOptions } from './handover.js';

/**
 * A clock that only moves when the code sleeps, so a test that covers an eight
 * second timeout runs in no time at all.
 */
function fakeClock(): DrainOptions {
  let elapsed = 0;
  return {
    timeoutMs: 1000,
    pollMs: 100,
    now: () => elapsed,
    sleep: async (ms) => {
      elapsed += ms;
      await Promise.resolve();
    },
  };
}

/** Returns each count in turn, then repeats the last one for ever. */
function counts(...values: number[]): () => Promise<number> {
  let index = 0;
  return async () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;
    index += 1;
    return Promise.resolve(value);
  };
}

describe('drainQueue', () => {
  it('reports an empty queue straight away', async () => {
    expect(await drainQueue(counts(0), fakeClock())).toBe(0);
  });

  /** The common sign-out. Nothing outstanding should cost no delay at all. */
  it('does not sleep when there is nothing to wait for', async () => {
    const options = { ...fakeClock(), sleep: vi.fn(async () => Promise.resolve()) };
    await drainQueue(counts(0), options);
    expect(options.sleep).not.toHaveBeenCalled();
  });

  it('waits for the queue to empty and then says so', async () => {
    expect(await drainQueue(counts(5, 3, 1, 0), fakeClock())).toBe(0);
  });

  /**
   * The case the whole feature exists for. A queue that will not go — offline,
   * or a server refusing — must be reported, not waited on for ever, and the
   * number is what the caller needs to decide against.
   */
  it('gives up after the timeout and reports what is left', async () => {
    const left = await drainQueue(counts(4), fakeClock());
    expect(left).toBe(4);
  });

  it('gives up in bounded time rather than looping', async () => {
    const options = fakeClock();
    const sleep = vi.fn(options.sleep);
    await drainQueue(counts(9), { ...options, sleep });

    // 1000 ms of timeout at 100 ms a poll, and not one poll more.
    expect(sleep.mock.calls.length).toBeLessThanOrEqual(options.timeoutMs / options.pollMs + 1);
  });

  /**
   * A queue that grows while it is being watched is a device still being
   * written to, or an upload failing and retrying. Either way it must not trap
   * the sign-out.
   */
  it('is not trapped by a queue that grows', async () => {
    expect(await drainQueue(counts(1, 4, 9, 16), fakeClock())).toBeGreaterThan(0);
  });

  it('drains on the very last poll before the deadline', async () => {
    // 1000 ms / 100 ms: reads at 0, 100 … the tenth sleep lands exactly on it.
    expect(await drainQueue(counts(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0), fakeClock())).toBe(0);
  });

  /** Long enough for a real upload, short enough not to hang a sign-out. */
  it('ships with a timeout somebody would wait through', () => {
    expect(DRAIN_TIMEOUT_MS).toBeGreaterThanOrEqual(3000);
    expect(DRAIN_TIMEOUT_MS).toBeLessThanOrEqual(15000);
    expect(DRAIN_POLL_MS).toBeLessThan(DRAIN_TIMEOUT_MS);
  });
});
