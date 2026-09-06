import { describe, expect, it, vi } from 'vitest';
import { REFERENCE_TABLE_NAMES } from '../schema/app-schema.js';
import type { PlannedWrite, QueuedChange } from './apply-crud.js';
import type { UploadError } from './upload-outcome.js';
import {
  describeUploadReport,
  RetryableUploadError,
  uploadBatch,
  type DiscardedWrite,
} from './upload-batch.js';

const put = (id: string, over: Partial<QueuedChange> = {}): QueuedChange => ({
  op: 'PUT',
  table: 'session_sets',
  id,
  opData: { user_id: 'u1', reps: 8 },
  ...over,
});

/** An executor that succeeds at everything, recording what it was asked to do. */
function succeeds(): { execute: (w: PlannedWrite) => Promise<null>; writes: PlannedWrite[] } {
  const writes: PlannedWrite[] = [];
  return {
    writes,
    execute: (write) => {
      writes.push(write);
      return Promise.resolve(null);
    },
  };
}

/** An executor that fails the nth write (0-based) and succeeds otherwise. */
function failsAt(index: number, error: UploadError) {
  let seen = 0;
  const writes: PlannedWrite[] = [];
  return {
    writes,
    execute: (write: PlannedWrite): Promise<UploadError | null> => {
      writes.push(write);
      const result = seen === index ? error : null;
      seen += 1;
      return Promise.resolve(result);
    },
  };
}

describe('a batch that succeeds', () => {
  it('applies every change and reports the count', async () => {
    const executor = succeeds();
    const report = await uploadBatch([put('a'), put('b'), put('c')], executor.execute);
    expect(report.applied).toBe(3);
    expect(report.discarded).toEqual([]);
    expect(executor.writes).toHaveLength(3);
  });

  it('applies changes in the order they were queued', async () => {
    const executor = succeeds();
    await uploadBatch([put('a'), put('b'), put('c')], executor.execute);
    expect(executor.writes.map((w) => (w.kind === 'upsert' ? w.row['id'] : null))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('counts a change that means no write as skipped rather than applied', async () => {
    const executor = succeeds();
    const report = await uploadBatch(
      [put('a'), { op: 'PATCH', table: 'session_sets', id: 'b', opData: { updated_at: 'x' } }],
      executor.execute,
    );
    expect(report.applied).toBe(1);
    expect(report.skipped).toBe(1);
    expect(executor.writes).toHaveLength(1);
  });

  it('handles an empty batch', async () => {
    const report = await uploadBatch([], succeeds().execute);
    expect(report).toEqual({ applied: 0, skipped: 0, discarded: [] });
  });
});

describe('a failure worth retrying', () => {
  /**
   * The whole point. Throwing is how the caller learns not to call
   * `batch.complete()`; completing here would delete writes that a working
   * network would have accepted.
   */
  it('throws, so the caller cannot clear the queue', async () => {
    const executor = failsAt(1, { message: 'Failed to fetch' });
    await expect(uploadBatch([put('a'), put('b')], executor.execute)).rejects.toBeInstanceOf(
      RetryableUploadError,
    );
  });

  /**
   * The changes are ordered and the foreign keys are composite, so a child row
   * applied over a gap left by its parent is refused — permanently, which turns
   * one transient network blip into a discarded row.
   */
  it('stops at the failure rather than applying later changes over a gap', async () => {
    const executor = failsAt(1, { status: 503 });
    await expect(
      uploadBatch([put('a'), put('b'), put('c')], executor.execute),
    ).rejects.toBeInstanceOf(RetryableUploadError);
    // a and b attempted; c never reached.
    expect(executor.writes).toHaveLength(2);
  });

  it('names the table and reason, so a stalled queue can be diagnosed', async () => {
    const executor = failsAt(0, { message: 'Failed to fetch' });
    await expect(uploadBatch([put('a')], executor.execute)).rejects.toThrow(/session_sets/);
    const executor2 = failsAt(0, { message: 'Failed to fetch' });
    await expect(uploadBatch([put('a')], executor2.execute)).rejects.toThrow(/Failed to fetch/);
  });

  it('carries the failing write and the reason for the caller to inspect', async () => {
    const failure: UploadError = { status: 502, message: 'Bad Gateway' };
    try {
      await uploadBatch([put('a')], failsAt(0, failure).execute);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RetryableUploadError);
      if (error instanceof RetryableUploadError) {
        expect(error.failure).toBe(failure);
        expect(error.write.table).toBe('session_sets');
      }
    }
  });
});

describe('a failure that can never succeed', () => {
  /**
   * The opposite trap. A constraint violation fails identically forever, so
   * keeping it queued stalls every write made after it — permanently, and with
   * nothing reported anywhere. Dropping it is the only way the queue moves.
   */
  it('is dropped so the queue can drain, and the batch completes', async () => {
    const executor = failsAt(0, { code: '23514', message: 'violates check constraint' });
    const report = await uploadBatch([put('a'), put('b')], executor.execute);
    expect(report.discarded).toHaveLength(1);
    expect(report.applied).toBe(1);
  });

  it('carries on with the rest of the batch', async () => {
    const executor = failsAt(0, { code: '23514' });
    await uploadBatch([put('a'), put('b'), put('c')], executor.execute);
    expect(executor.writes).toHaveLength(3);
  });

  it('reports each dropped write, because each is a row that never leaves the device', async () => {
    const seen: DiscardedWrite[] = [];
    const executor = failsAt(0, { code: '23514', message: 'bad row' });
    await uploadBatch([put('a')], executor.execute, {
      onDiscarded: (entry) => seen.push(entry),
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.write.table).toBe('session_sets');
    expect(seen[0]?.alreadyApplied).toBe(false);
  });

  /**
   * The benign one: the first attempt landed and its acknowledgement was lost,
   * so the retry collides with the row it wrote. Nothing was lost, and the
   * report has to say so or the user is told about a failure that did not
   * happen.
   */
  it('marks a duplicate key as already applied rather than as loss', async () => {
    const executor = failsAt(0, { code: '23505' });
    const report = await uploadBatch([put('a')], executor.execute);
    expect(report.discarded[0]?.alreadyApplied).toBe(true);
  });

  it('marks a policy refusal as a permission problem', async () => {
    const executor = failsAt(0, { code: '42501' });
    const report = await uploadBatch([put('a')], executor.execute);
    expect(report.discarded[0]?.permissionDenied).toBe(true);
  });
});

describe('a row with no owner', () => {
  /**
   * Caught before the request, not after the refusal, because the server's
   * answer is permanent — so the write would be discarded and the row stranded
   * on the device with nothing explaining why.
   */
  it('never reaches the server', async () => {
    const executor = succeeds();
    const report = await uploadBatch([put('a', { opData: { reps: 8 } })], executor.execute, {
      referenceTables: REFERENCE_TABLE_NAMES,
    });
    expect(executor.writes).toHaveLength(0);
    expect(report.discarded).toHaveLength(1);
    expect(report.applied).toBe(0);
  });

  it('says it is a bug in the repository layer, not a server problem', async () => {
    const report = await uploadBatch([put('a', { opData: { reps: 8 } })], succeeds().execute, {
      referenceTables: REFERENCE_TABLE_NAMES,
    });
    expect(report.discarded[0]?.error.message).toContain('repository layer');
    expect(report.discarded[0]?.permissionDenied).toBe(true);
  });

  it('does not block the rest of the batch', async () => {
    const executor = succeeds();
    const report = await uploadBatch(
      [put('a', { opData: { reps: 8 } }), put('b')],
      executor.execute,
      { referenceTables: REFERENCE_TABLE_NAMES },
    );
    expect(report.applied).toBe(1);
    expect(report.discarded).toHaveLength(1);
  });

  it('leaves reference tables alone, which have no owner', async () => {
    const executor = succeeds();
    const report = await uploadBatch(
      [put('a', { table: 'exercises', opData: { name: 'Squat' } })],
      executor.execute,
      { referenceTables: REFERENCE_TABLE_NAMES },
    );
    expect(report.applied).toBe(1);
    expect(report.discarded).toEqual([]);
  });
});

describe('idempotency, which is what makes a retry safe', () => {
  /**
   * PostgREST has no transaction across separate requests, so a batch that
   * fails halfway has already applied its first half — and throwing re-sends
   * the whole thing. That is only safe because every write is idempotent.
   */
  it('re-sends already-applied writes as upserts, not inserts', async () => {
    const first = failsAt(2, { message: 'Failed to fetch' });
    await expect(uploadBatch([put('a'), put('b'), put('c')], first.execute)).rejects.toBeInstanceOf(
      RetryableUploadError,
    );

    // The retry: the same three changes, with a and b already on the server.
    const second = succeeds();
    const report = await uploadBatch([put('a'), put('b'), put('c')], second.execute);
    expect(report.applied).toBe(3);
    expect(second.writes.every((w) => w.kind === 'upsert')).toBe(true);
  });
});

describe('describeUploadReport', () => {
  const discarded = (table: string, alreadyApplied: boolean): DiscardedWrite => ({
    write: { kind: 'upsert', table, row: { id: 'x' } },
    error: { code: '23514' },
    alreadyApplied,
    permissionDenied: false,
  });

  it('leads with what was lost, not with what succeeded', () => {
    const message = describeUploadReport({
      applied: 40,
      skipped: 0,
      discarded: [discarded('session_sets', false)],
    });
    expect(message).toContain('could not be saved');
    expect(message).toContain('session_sets');
  });

  it('does not report a write that was already on the server as lost', () => {
    const message = describeUploadReport({
      applied: 2,
      skipped: 0,
      discarded: [discarded('session_sets', true)],
    });
    expect(message).toBe('Synced 2 changes.');
  });

  it('counts in singular where it should', () => {
    expect(describeUploadReport({ applied: 1, skipped: 0, discarded: [] })).toBe(
      'Synced 1 change.',
    );
    expect(
      describeUploadReport({ applied: 0, skipped: 0, discarded: [discarded('routines', false)] }),
    ).toContain('1 change could not be saved');
  });

  it('says so when there was nothing to do', () => {
    expect(describeUploadReport({ applied: 0, skipped: 0, discarded: [] })).toBe(
      'Nothing to sync.',
    );
  });

  it('lists each affected table once', () => {
    const message = describeUploadReport({
      applied: 0,
      skipped: 0,
      discarded: [
        discarded('session_sets', false),
        discarded('session_sets', false),
        discarded('routines', false),
      ],
    });
    expect(message).toContain('session_sets, routines');
    expect(message).toContain('3 changes');
  });
});

describe('the executor is called exactly once per write', () => {
  it('does not retry internally — that is PowerSync’s job, on its own schedule', async () => {
    const execute = vi.fn(() =>
      Promise.resolve<UploadError | null>({ message: 'Failed to fetch' }),
    );
    await expect(uploadBatch([put('a')], execute)).rejects.toBeInstanceOf(RetryableUploadError);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
