/**
 * The questions asked once, when an account is new.
 *
 * All of this was already askable on the You screen, and asking there is the
 * wrong time: the generator needs an age, a height and an activity level to
 * pick a starting weight, and the greeting needs a name. A user who never
 * opens You gets defaults chosen for a person who does not exist.
 *
 * Kept apart from the screen because the ordering rules are the part worth
 * testing and the part that silently rots. A flow that loses its place when
 * somebody closes the app halfway through is not visibly broken — it just
 * asks them their name again.
 */
import type { ActivityLevel, Sex, TrainingGoal } from '@g7m/core';

/**
 * In order, and the order is deliberate.
 *
 * Name first because it is the one question that is not about a body, and
 * being asked your height by something that does not know your name is a form.
 * Goal last because it is the only one that changes what the app then does,
 * and it reads as a decision rather than a detail.
 */
export const ONBOARDING_STEPS = [
  'name',
  'age',
  'sex',
  'height',
  'activity',
  'country',
  'goal',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** What has been answered so far, from the profile and the latest metrics. */
export interface OnboardingAnswers {
  readonly displayName: string | null;
  readonly birthYear: number | null;
  readonly sex: Sex | null;
  readonly heightCm: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly country: string | null;
  readonly goal: TrainingGoal | null;
}

export const NO_ANSWERS: OnboardingAnswers = {
  displayName: null,
  birthYear: null,
  sex: null,
  heightCm: null,
  activityLevel: null,
  country: null,
  goal: null,
};

/**
 * Whether a step may be left unanswered.
 *
 * Only the country, which exists to pick the language of one greeting. Somebody
 * who would rather not say gets English, which is what they would have got by
 * answering wrongly anyway — so making it compulsory buys nothing and asks a
 * question some people do not want to answer.
 */
export function isOptional(step: OnboardingStep): boolean {
  return step === 'country';
}

/** Whether this step already has an answer. */
export function isAnswered(step: OnboardingStep, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 'name':
      return answers.displayName !== null && answers.displayName.trim() !== '';
    case 'age':
      return answers.birthYear !== null;
    case 'sex':
      return answers.sex !== null;
    case 'height':
      return answers.heightCm !== null;
    case 'activity':
      return answers.activityLevel !== null;
    case 'country':
      return answers.country !== null;
    case 'goal':
      return answers.goal !== null;
  }
}

/**
 * Where to pick the flow back up.
 *
 * Null when every question that has to be answered has been, which is what
 * lets the last screen offer to finish rather than asking again. The optional
 * one never holds this up: skipping the country is an answer.
 */
export function firstUnanswered(answers: OnboardingAnswers): OnboardingStep | null {
  return ONBOARDING_STEPS.find((step) => !isOptional(step) && !isAnswered(step, answers)) ?? null;
}

/** A step from the URL, or the first one when the URL says something else. */
export function readStep(raw: string | undefined): OnboardingStep {
  const match = ONBOARDING_STEPS.find((step) => step === raw);
  return match ?? ONBOARDING_STEPS[0];
}

/** The step after this one, or null at the end of the flow. */
export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] ?? null;
}

/** The step before this one, or null at the start. */
export function previousStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return index <= 0 ? null : (ONBOARDING_STEPS[index - 1] ?? null);
}

/** One-based position and the total, for "3 of 7". */
export function progressOf(step: OnboardingStep): { position: number; total: number } {
  return { position: ONBOARDING_STEPS.indexOf(step) + 1, total: ONBOARDING_STEPS.length };
}

/**
 * The year somebody born this many years ago was born.
 *
 * Onboarding asks an age because that is what a person knows without thinking;
 * the column stores a year because that is the fact that does not go stale.
 * Off by up to a year depending on the birthday, which is the correct
 * precision for choosing a starting weight and the wrong precision for
 * anything else — so the You screen asks for the year itself.
 */
export function birthYearFromAge(age: number, now: Date): number | null {
  if (!Number.isInteger(age) || age < 13 || age > 100) return null;
  return now.getFullYear() - age;
}
