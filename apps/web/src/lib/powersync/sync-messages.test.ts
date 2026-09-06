import { describe, expect, it } from 'vitest';
import type { DiscardedWrite } from '@g7m/db';
import {
  describeDiscarded,
  describeSyncError,
  describeSyncPhase,
  type SyncPhase,
} from './sync-messages.js';

const discarded = (over: Partial<DiscardedWrite> = {}): DiscardedWrite => ({
  write: { kind: 'upsert', table: 'session_sets', row: { id: 'x' } },
  error: { code: '23514' },
  alreadyApplied: false,
  permissionDenied: false,
  ...over,
});

describe('describeSyncPhase', () => {
  it('has a message for every phase', () => {
    const phases: SyncPhase[] = ['unconfigured', 'idle', 'connecting', 'synced', 'offline'];
    for (const phase of phases) {
      expect(describeSyncPhase(phase, null).length, phase).toBeGreaterThan(3);
    }
  });

  /**
   * Offline is the normal state for this app, not a failure — it is built for
   * basements. The wording has to reassure rather than alarm, because the data
   * genuinely is safe.
   */
  it('tells an offline user their workouts are saved, not lost', () => {
    const message = describeSyncPhase('offline', null);
    expect(message).toContain('saved');
    expect(message).toContain('will sync');
  });

  it('says when it last reached the server, once it has', () => {
    const at = new Date('2026-09-06T09:30:00Z');
    expect(describeSyncPhase('offline', at)).toContain(at.toLocaleTimeString());
  });

  /**
   * A missing VITE_POWERSYNC_URL must not read as a broken app. The logger
   * works either way; only the server copy is absent.
   */
  it('explains an unconfigured instance without implying breakage', () => {
    const message = describeSyncPhase('unconfigured', null);
    expect(message).toContain('this device only');
    expect(message.toLowerCase()).not.toContain('error');
  });
});

describe('describeDiscarded', () => {
  it('says nothing when nothing was dropped', () => {
    expect(describeDiscarded([])).toBeNull();
  });

  /**
   * A duplicate key means the first attempt succeeded and its acknowledgement
   * was lost. Reporting that as loss would alarm a user about a write that is
   * sitting on the server.
   */
  it('says nothing when the only drops were already on the server', () => {
    expect(describeDiscarded([discarded({ alreadyApplied: true })])).toBeNull();
  });

  it('reports a genuine loss with a count', () => {
    const message = describeDiscarded([discarded(), discarded()]);
    expect(message).toContain('2 changes');
    expect(message).toContain('could not be saved');
  });

  it('counts in the singular where it should', () => {
    expect(describeDiscarded([discarded()])).toContain('1 change on this device');
  });

  /**
   * A policy refusal is almost always a missing `user_id` — our bug, not the
   * user's bad data — and saying "invalid" would send them looking for
   * something wrong with their workout.
   */
  it('calls a permission refusal a bug rather than invalid data', () => {
    const message = describeDiscarded([discarded({ permissionDenied: true })]);
    expect(message).toContain('bug');
    expect(message).not.toContain('invalid');
  });

  it('calls a constraint violation invalid rather than a bug', () => {
    const message = describeDiscarded([discarded({ permissionDenied: false })]);
    expect(message).toContain('invalid');
  });

  it('ignores the already-applied entries when counting a mixed batch', () => {
    const message = describeDiscarded([discarded({ alreadyApplied: true }), discarded()]);
    expect(message).toContain('1 change');
  });
});

describe('describeSyncError', () => {
  it('says nothing when there is no error', () => {
    expect(describeSyncError(undefined)).toBeNull();
  });

  /**
   * The one that actually happened, and cost an hour.
   *
   * A development token is signed by PowerSync itself, so a passing Sync
   * Diagnostics run proves replication and sync rules work while saying nothing
   * about whether a real Supabase JWT is trusted. When it is not, the only
   * symptom was a bare "Offline" — identical to being in a basement.
   */
  it('names a rejected token, and points at the setting that fixes it', () => {
    for (const message of [
      'Request failed with status 401',
      'Unauthorized',
      'JWT verification failed',
      'invalid signature',
      'no matching kid in JWKS',
    ]) {
      const described = describeSyncError(new Error(message));
      expect(described, message).not.toBeNull();
      expect(described, message).toContain('JWKS');
    }
  });

  it('reassures that nothing is lost when the token is rejected', () => {
    expect(describeSyncError(new Error('401 Unauthorized'))).toContain('still saved');
  });

  /**
   * Being offline is the normal state for this app, not an error worth a red
   * alert — the phase message already explains it in reassuring terms, and
   * duplicating it in danger red would make a basement look like a failure.
   */
  it('stays quiet about an ordinary network failure', () => {
    expect(describeSyncError(new Error('Failed to fetch'))).toBeNull();
    expect(describeSyncError(new Error('NetworkError'))).toBeNull();
  });

  it('recognises a wrong address', () => {
    expect(describeSyncError(new Error('404 Not Found'))).toContain('could not be found');
  });

  it('recognises missing sync rules', () => {
    expect(describeSyncError(new Error('No sync rules deployed'))).toContain('sync rules');
  });

  it('recognises a refused account', () => {
    expect(describeSyncError(new Error('403 Forbidden'))).toContain('refused');
  });

  /**
   * The default matters as much as the named cases. Hiding an unrecognised
   * error is what produced the bare "Offline" in the first place; showing the
   * raw text is worse to read and far better to act on.
   */
  it('shows an unrecognised error rather than swallowing it', () => {
    const described = describeSyncError(new Error('something entirely new'));
    expect(described).toContain('something entirely new');
  });
});
