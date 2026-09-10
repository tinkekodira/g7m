import { describe, expect, it } from 'vitest';
import { claimFor } from './owner.js';

const ALICE = '598c28d0-39ad-41c6-8a3a-f8710f15d3cd';
const BOB = 'd8322a2a-0cf2-4080-8d04-0308a9d72ce2';

describe('claimFor', () => {
  /**
   * The bug this exists for. One local database, one set of PowerSync bucket
   * checkpoints, and a second account arriving on top of the first: the
   * checkpoints say data is already held, so it is never re-requested, and
   * training that is safe on the server never comes back down.
   */
  it('clears when a different account arrives', () => {
    expect(claimFor(ALICE, BOB)).toEqual({ action: 'clear', previous: ALICE });
  });

  it('leaves the same account alone', () => {
    expect(claimFor(ALICE, ALICE)).toEqual({ action: 'keep' });
  });

  /**
   * The dangerous direction, and the reason this is a rule rather than an
   * `if`. A device with no record could be a first run or a browser that
   * cleared its storage — neither is evidence of a different owner, and
   * clearing on a guess deletes unsent sets belonging to the person signing in.
   */
  it('never clears on an unknown owner', () => {
    expect(claimFor(null, ALICE)).toEqual({ action: 'keep' });
    expect(claimFor('', ALICE)).toEqual({ action: 'keep' });
  });

  /** Signed out, or a session still loading. Not a change of owner. */
  it('does nothing when nobody has arrived', () => {
    expect(claimFor(ALICE, '')).toEqual({ action: 'keep' });
    expect(claimFor(null, '')).toEqual({ action: 'keep' });
  });

  it('reports who it is clearing after, so the reason can be logged', () => {
    const claim = claimFor(ALICE, BOB);
    expect(claim.action === 'clear' && claim.previous).toBe(ALICE);
  });
});
