import { describe, expect, it } from 'vitest';
import { REFERENCE_TABLE_NAMES } from '../schema/app-schema.js';
import { isMissingOwner, planWrite, type QueuedChange } from './apply-crud.js';

const change = (over: Partial<QueuedChange> = {}): QueuedChange => ({
  op: 'PUT',
  table: 'session_sets',
  id: 'set-1',
  ...over,
});

describe('planWrite', () => {
  describe('PUT', () => {
    /**
     * An upsert, not an insert. A write whose acknowledgement was lost is
     * re-sent by the queue, and an insert would fail on the duplicate key —
     * permanently, since retrying cannot change it. Upserting makes the retry a
     * no-op instead.
     */
    it('becomes an upsert so a re-sent write is harmless', () => {
      const write = planWrite(change({ opData: { user_id: 'u1', reps: 8 } }));
      expect(write).toEqual({
        kind: 'upsert',
        table: 'session_sets',
        row: { user_id: 'u1', reps: 8, id: 'set-1' },
      });
    });

    it('carries the id from the entry, which is not in opData', () => {
      const write = planWrite(change({ id: 'set-9', opData: { reps: 5 } }));
      expect(write).toMatchObject({ row: { id: 'set-9' } });
    });

    it('survives an entry with no data at all', () => {
      expect(planWrite(change({ opData: undefined }))).toEqual({
        kind: 'upsert',
        table: 'session_sets',
        row: { id: 'set-1' },
      });
    });
  });

  describe('PATCH', () => {
    /**
     * Only the changed columns go up, which is what lets two devices editing
     * different fields of the same set both keep their edit. ADR-0017 only
     * promised row-level last-write-wins; this is better and free.
     */
    it('sends only the columns that changed', () => {
      const write = planWrite(change({ op: 'PATCH', opData: { reps: 10 } }));
      expect(write).toEqual({
        kind: 'update',
        table: 'session_sets',
        id: 'set-1',
        changes: { reps: 10 },
      });
    });

    it('is nothing to do when every changed column is server-owned', () => {
      expect(planWrite(change({ op: 'PATCH', opData: { updated_at: '2026-01-01' } }))).toBeNull();
    });

    it('is nothing to do when there is no data', () => {
      expect(planWrite(change({ op: 'PATCH', opData: {} }))).toBeNull();
    });
  });

  describe('DELETE', () => {
    it('becomes a delete by id and ignores any data', () => {
      expect(planWrite(change({ op: 'DELETE', opData: { reps: 8 } }))).toEqual({
        kind: 'delete',
        table: 'session_sets',
        id: 'set-1',
      });
    });
  });

  describe('columns the server owns', () => {
    /**
     * `updated_at` is set by a trigger on every table. A device whose clock runs
     * ahead — which is exactly what an iPhone did during Phase 2a — would write
     * a future timestamp and then win every comparison against rows that are
     * genuinely newer.
     */
    it('never sends updated_at, whatever the device thinks the time is', () => {
      const write = planWrite(
        change({ opData: { user_id: 'u1', reps: 8, updated_at: '2099-01-01T00:00:00Z' } }),
      );
      expect(write).toMatchObject({ row: { user_id: 'u1', reps: 8, id: 'set-1' } });
      expect(Object.keys((write as { row: Record<string, unknown> }).row)).not.toContain(
        'updated_at',
      );
    });

    /**
     * `search_text` is GENERATED ALWAYS. Postgres refuses any write to it, and
     * that refusal is permanent — one stale row would jam the queue for good.
     */
    it('never sends the generated search column', () => {
      const write = planWrite(
        change({
          table: 'exercises',
          op: 'PATCH',
          opData: { name: 'Squat', search_text: 'squat' },
        }),
      );
      expect(write).toEqual({
        kind: 'update',
        table: 'exercises',
        id: 'set-1',
        changes: { name: 'Squat' },
      });
    });

    it('leaves created_at alone, which the device legitimately sets', () => {
      const write = planWrite(
        change({ opData: { user_id: 'u1', created_at: '2026-09-05T10:00:00Z' } }),
      );
      expect(write).toMatchObject({ row: { created_at: '2026-09-05T10:00:00Z' } });
    });
  });
});

describe('isMissingOwner', () => {
  const plan = (opData: Record<string, unknown>, table = 'session_sets') => {
    const write = planWrite(change({ table, opData }));
    if (write === null) throw new Error('expected a write');
    return write;
  };

  /**
   * The commonest way a write is lost for good. Every user table's policy is
   * `user_id = auth.uid()` in both `using` and `with check`, so an insert with
   * no `user_id` is refused — permanently, so it is discarded, so the row never
   * leaves the device and nothing says why.
   */
  it('catches an insert with no owner before the server refuses it', () => {
    expect(isMissingOwner(plan({ reps: 8 }), REFERENCE_TABLE_NAMES)).toBe(true);
  });

  it('treats null and empty string as missing too', () => {
    expect(isMissingOwner(plan({ user_id: null, reps: 8 }), REFERENCE_TABLE_NAMES)).toBe(true);
    expect(isMissingOwner(plan({ user_id: '', reps: 8 }), REFERENCE_TABLE_NAMES)).toBe(true);
  });

  it('is satisfied by an owner', () => {
    expect(isMissingOwner(plan({ user_id: 'u1', reps: 8 }), REFERENCE_TABLE_NAMES)).toBe(false);
  });

  /** Reference tables have no owner, and the device never writes them anyway. */
  it('does not demand an owner on reference data', () => {
    expect(isMissingOwner(plan({ name: 'Squat' }, 'exercises'), REFERENCE_TABLE_NAMES)).toBe(false);
  });

  /**
   * A PATCH does not carry unchanged columns, so `user_id` being absent from
   * one says nothing. RLS still checks the stored row's owner via `using`.
   */
  it('says nothing about an update, which never carries unchanged columns', () => {
    const write = planWrite(change({ op: 'PATCH', opData: { reps: 10 } }));
    expect(write).not.toBeNull();
    if (write !== null) expect(isMissingOwner(write, REFERENCE_TABLE_NAMES)).toBe(false);
  });

  it('says nothing about a delete', () => {
    const write = planWrite(change({ op: 'DELETE' }));
    expect(write).not.toBeNull();
    if (write !== null) expect(isMissingOwner(write, REFERENCE_TABLE_NAMES)).toBe(false);
  });
});
