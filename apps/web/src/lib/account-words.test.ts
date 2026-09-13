import { describe, expect, it } from 'vitest';
import {
  confirmsDeletion,
  describeDeletionError,
  describeExportCaveat,
  describeExportContents,
} from './account-words.js';

describe('describeExportContents', () => {
  it('counts what went in', () => {
    expect(describeExportContents({ workouts: 42, sets: 1904, weighIns: 3 })).toBe(
      'It holds 42 workouts, 1,904 sets and 3 weigh-ins.',
    );
  });

  it('speaks in the singular when there is one', () => {
    expect(describeExportContents({ workouts: 1, sets: 1, weighIns: 1 })).toBe(
      'It holds 1 workout, 1 set and 1 weigh-in.',
    );
  });

  it('leaves out what there is none of', () => {
    expect(describeExportContents({ workouts: 0, sets: 0, weighIns: 2 })).toBe(
      'It holds 2 weigh-ins.',
    );
    expect(describeExportContents({ workouts: 3, sets: 20, weighIns: 0 })).toBe(
      'It holds 3 workouts and 20 sets.',
    );
  });

  it('says what an empty account’s file still has', () => {
    expect(describeExportContents({ workouts: 0, sets: 0, weighIns: 0 })).toMatch(
      /Nothing is logged yet/,
    );
  });
});

describe('describeExportCaveat', () => {
  it('warns when this device has not finished its first download', () => {
    expect(describeExportCaveat({ syncConfigured: true, hasSynced: false })).toMatch(
      /older workouts may be missing/,
    );
  });

  it('has nothing to say once it has', () => {
    expect(describeExportCaveat({ syncConfigured: true, hasSynced: true })).toBeNull();
  });

  it('has nothing to say where there is no sync at all', () => {
    expect(describeExportCaveat({ syncConfigured: false, hasSynced: false })).toBeNull();
  });
});

describe('confirmsDeletion', () => {
  it.each(['DELETE', 'delete', 'Delete ', '  DELETE'])('accepts %j', (typed) => {
    expect(confirmsDeletion(typed)).toBe(true);
  });

  it.each(['', 'DEL', 'DELETE ME', 'yes'])('refuses %j', (typed) => {
    expect(confirmsDeletion(typed)).toBe(false);
  });
});

describe('describeDeletionError', () => {
  it('says an offline attempt deleted nothing, and why a connection is needed', () => {
    expect(describeDeletionError('TypeError: Failed to fetch')).toMatch(
      /nothing was deleted.*has to be deleted there/i,
    );
    // WebKit's wording for the same thing.
    expect(describeDeletionError('Load failed')).toMatch(/Could not reach the server/);
  });

  it('sends an expired session to sign in again', () => {
    expect(describeDeletionError('JWT expired')).toMatch(/Sign out and back in/);
  });

  it('passes anything else through, after saying nothing happened', () => {
    expect(describeDeletionError('permission denied for function')).toBe(
      'Nothing was deleted: permission denied for function',
    );
  });
});
