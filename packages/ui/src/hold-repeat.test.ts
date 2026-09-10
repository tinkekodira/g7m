import { describe, expect, it } from 'vitest';
import { FASTEST_REPEAT_MS, FIRST_REPEAT_MS, HOLD_DELAY_MS, repeatDelay } from './hold-repeat.js';

describe('repeatDelay', () => {
  /**
   * The gap between pressing and the first repeat. Short and the button fires
   * twice for anybody who presses deliberately, which on a weight field is
   * logging 55 kg when you meant 52.5.
   */
  it('waits before it repeats at all, so a tap stays a tap', () => {
    expect(repeatDelay(0)).toBe(HOLD_DELAY_MS);
    expect(HOLD_DELAY_MS).toBeGreaterThan(300);
  });

  it('starts gently enough to release on the number you wanted', () => {
    expect(repeatDelay(1)).toBe(FIRST_REPEAT_MS);
  });

  it('never speeds up and then slows down again', () => {
    for (let repeats = 1; repeats < 40; repeats += 1) {
      expect(repeatDelay(repeats + 1), `after ${String(repeats)}`).toBeLessThanOrEqual(
        repeatDelay(repeats),
      );
    }
  });

  it('reaches the floor and stays there', () => {
    expect(repeatDelay(40)).toBe(FASTEST_REPEAT_MS);
    expect(repeatDelay(400)).toBe(FASTEST_REPEAT_MS);
  });

  /**
   * The point of holding. Five reps to thirty is twenty-five steps, and it has
   * to take about a second — at a flat 150 ms it is nearly four, which is not
   * better than tapping.
   */
  it('gets through twenty-five steps in about a second of holding', () => {
    let total = 0;
    for (let repeats = 1; repeats <= 25; repeats += 1) total += repeatDelay(repeats);

    expect(total).toBeGreaterThan(600);
    expect(total).toBeLessThan(1800);
  });

  it('is never zero, which would be a spin rather than a repeat', () => {
    for (const repeats of [1, 2, 5, 50, 5000]) {
      expect(repeatDelay(repeats), String(repeats)).toBeGreaterThan(0);
    }
  });
});
