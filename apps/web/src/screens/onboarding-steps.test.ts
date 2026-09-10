import { describe, expect, it } from 'vitest';
import {
  NO_ANSWERS,
  ONBOARDING_STEPS,
  isUsableBirthDate,
  firstUnanswered,
  isAnswered,
  isOptional,
  nextStep,
  previousStep,
  progressOf,
  readStep,
  type OnboardingAnswers,
} from './onboarding-steps.js';

const EVERYTHING: OnboardingAnswers = {
  displayName: 'Tin',
  birthDate: new Date(Date.UTC(2000, 5, 15)),
  sex: 'male',
  heightCm: 183,
  activityLevel: 'moderate',
  country: 'HR',
  goal: 'build_muscle',
};

describe('the order of the flow', () => {
  it('asks for a name before it asks for a body', () => {
    expect(ONBOARDING_STEPS[0]).toBe('name');
  });

  it('leaves the goal until last, because it is the one that decides something', () => {
    expect(ONBOARDING_STEPS.at(-1)).toBe('goal');
  });

  it('walks forwards and back without falling off either end', () => {
    expect(previousStep('name')).toBeNull();
    expect(nextStep('name')).toBe('dob');
    expect(previousStep('dob')).toBe('name');
    expect(nextStep('goal')).toBeNull();
  });

  it('counts from one, so "1 of 7" is the first question', () => {
    expect(progressOf('name')).toEqual({ position: 1, total: ONBOARDING_STEPS.length });
    expect(progressOf('goal').position).toBe(ONBOARDING_STEPS.length);
  });
});

describe('readStep', () => {
  it('takes a step out of the URL', () => {
    expect(readStep('height')).toBe('height');
  });

  /**
   * A hand-edited hash is not an error worth a screen. Anything unrecognised
   * starts at the beginning, which is where somebody with no answers belongs
   * anyway.
   */
  it('starts at the beginning for anything it does not recognise', () => {
    expect(readStep(undefined)).toBe('name');
    expect(readStep('')).toBe('name');
    expect(readStep('favourite-colour')).toBe('name');
  });
});

describe('isAnswered', () => {
  it('is true for every step once everything has been given', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(isAnswered(step, EVERYTHING), step).toBe(true);
    }
  });

  it('is false for every step when nothing has', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(isAnswered(step, NO_ANSWERS), step).toBe(false);
    }
  });

  /** A name of spaces is not a name; it would greet somebody as "Welcome, ". */
  it('does not count whitespace as a name', () => {
    expect(isAnswered('name', { ...NO_ANSWERS, displayName: '   ' })).toBe(false);
  });
});

describe('firstUnanswered', () => {
  it('is where somebody who closed the app halfway through picks up', () => {
    expect(firstUnanswered({ ...NO_ANSWERS, displayName: 'Tin' })).toBe('dob');
    expect(
      firstUnanswered({
        ...NO_ANSWERS,
        displayName: 'Tin',
        birthDate: new Date(Date.UTC(2000, 5, 15)),
      }),
    ).toBe('sex');
  });

  it('is null once every question that has to be answered has been', () => {
    expect(firstUnanswered(EVERYTHING)).toBeNull();
  });

  /**
   * The country picks the language of one greeting, and not saying is a fine
   * answer — it means English. Holding the flow open for it would make a
   * question some people would rather not answer compulsory for no gain.
   */
  it('does not hold the flow open for the optional question', () => {
    expect(isOptional('country')).toBe(true);
    expect(firstUnanswered({ ...EVERYTHING, country: null })).toBeNull();
  });

  it('treats every other question as required', () => {
    for (const step of ONBOARDING_STEPS) {
      if (step === 'country') continue;
      expect(isOptional(step), step).toBe(false);
    }
  });
});

describe('isUsableBirthDate', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');

  it('accepts somebody this app will train', () => {
    expect(isUsableBirthDate(new Date(Date.UTC(2000, 5, 15)), now)).toBe(true);
  });

  /**
   * False rather than a clamp, so the screen can say so. A wrong answer here
   * sets the starting weights for somebody who does not exist, and the row it
   * writes looks perfectly valid afterwards.
   */
  it('refuses a date that does not belong to a lifter', () => {
    expect(isUsableBirthDate(null, now)).toBe(false);
    expect(isUsableBirthDate(new Date(Date.UTC(2020, 0, 1)), now)).toBe(false);
    expect(isUsableBirthDate(new Date(Date.UTC(1890, 0, 1)), now)).toBe(false);
    expect(isUsableBirthDate(new Date(Date.UTC(2030, 0, 1)), now)).toBe(false);
  });

  /** The boundary is an age, so it moves with the birthday and not the year. */
  it('counts the birthday, not the year', () => {
    const thirteenTomorrow = new Date(Date.UTC(2013, 8, 11));
    expect(isUsableBirthDate(thirteenTomorrow, now)).toBe(false);
    expect(isUsableBirthDate(new Date(Date.UTC(2013, 8, 10)), now)).toBe(true);
  });
});
