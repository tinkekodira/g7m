import { describe, expect, it } from 'vitest';
import type { Exercise } from '@g7m/db';
import { sectionsFor } from './muscle-exercises.js';

/** Only the two fields this decides on ever get read. */
function exercise(name: string, mechanic: 'compound' | 'isolation'): Exercise {
  return { name, mechanic } as unknown as Exercise;
}

const ROW = exercise('Barbell Row', 'compound');
const CURL = exercise('Barbell Curl', 'isolation');
const FACE_PULL = exercise('Face Pull', 'compound');

describe('sectionsFor', () => {
  it('splits the prime movers by what they ask of a joint', () => {
    const sections = sectionsFor([ROW, CURL], []);
    expect(sections.compound).toEqual([ROW]);
    expect(sections.isolation).toEqual([CURL]);
  });

  it('keeps the recruitment order it was given', () => {
    const heaviest = exercise('Heaviest', 'compound');
    const lightest = exercise('Lightest', 'compound');
    expect(sectionsFor([heaviest, lightest], []).compound).toEqual([heaviest, lightest]);
  });

  /**
   * The fix, stated. The rhomboids are a prime mover for nothing in the
   * catalogue and a supporting muscle in eight exercises; the panel used to
   * call that "nothing trains this".
   */
  it('has something to show for a muscle nothing trains as a prime mover', () => {
    const sections = sectionsFor([], [ROW, FACE_PULL]);
    expect(sections.empty).toBe(false);
    expect(sections.also).toEqual([ROW, FACE_PULL]);
  });

  /**
   * A supporting exercise is a different answer, not a worse one, so it must
   * not be quietly folded in among the prime movers. Face Pull is compound and
   * would land in that list if the two roles were merged.
   */
  it('never files a supporting exercise under the prime movers', () => {
    const sections = sectionsFor([], [FACE_PULL]);
    expect(sections.compound).toEqual([]);
    expect(sections.isolation).toEqual([]);
    expect(sections.also).toEqual([FACE_PULL]);
  });

  it('is empty only when there is nothing in either role', () => {
    expect(sectionsFor([], []).empty).toBe(true);
    expect(sectionsFor([ROW], []).empty).toBe(false);
    expect(sectionsFor([], [ROW]).empty).toBe(false);
  });

  /**
   * `empty` counts what gets drawn, not what came in. A prime mover whose
   * mechanic is neither would otherwise leave the panel with no message and
   * no list — the one state that reads as broken rather than as unfinished.
   */
  it('reports empty when a prime mover lands in neither list', () => {
    const odd = exercise('Sled Push', 'plyometric' as 'compound');
    const sections = sectionsFor([odd], []);
    expect(sections.compound).toEqual([]);
    expect(sections.isolation).toEqual([]);
    expect(sections.empty).toBe(true);
  });
});
