import { describe, expect, it } from 'vitest';
import { addedExerciseId, addedState, exerciseAnchor, exerciseToReveal } from './added-exercise.js';

describe('addedExerciseId', () => {
  it('reads what the library hands back', () => {
    expect(addedExerciseId(addedState('entry-5'))).toBe('entry-5');
  });

  /**
   * Navigation state is whatever the last `navigate` put there, from any
   * screen, or a history entry restored after a reload. None of it is trusted.
   */
  it('ignores state that is not from the library', () => {
    for (const stray of [null, undefined, 'entry-5', 5, [], {}, { added: 5 }, { added: '' }]) {
      expect(addedExerciseId(stray), JSON.stringify(stray)).toBeNull();
    }
  });
});

describe('exerciseToReveal', () => {
  const entries = ['entry-1', 'entry-2', 'entry-5'];

  it('reveals the exercise that was just added', () => {
    expect(exerciseToReveal(addedState('entry-5'), entries)).toBe('entry-5');
  });

  /**
   * The workout is read asynchronously. On the first render after coming back
   * the new entry may not be drawn yet, and scrolling to something that is not
   * there does nothing — so this waits until it is.
   */
  it('waits until the new exercise has actually been drawn', () => {
    expect(exerciseToReveal(addedState('entry-6'), entries)).toBeNull();
    expect(exerciseToReveal(addedState('entry-6'), [...entries, 'entry-6'])).toBe('entry-6');
  });

  it('does nothing when nothing was added', () => {
    expect(exerciseToReveal(null, entries)).toBeNull();
    expect(exerciseToReveal({ something: 'else' }, entries)).toBeNull();
  });
});

describe('exerciseAnchor', () => {
  it('is a stable, prefixed DOM id', () => {
    expect(exerciseAnchor('abc')).toBe('exercise-abc');
    // A uuid can start with a digit, which is not a valid id to select by.
    expect(exerciseAnchor('9f3e')).toMatch(/^[a-z]/);
  });
});
