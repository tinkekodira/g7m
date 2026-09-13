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
import {
  MAX_AGE,
  MIN_AGE,
  ageFrom,
  type ActivityLevel,
  type Sex,
  type TrainingGoal,
} from '@g7m/core';

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
  'dob',
  'sex',
  'height',
  'weight',
  'activity',
  'country',
  'goal',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** What has been answered so far, from the profile and the latest metrics. */
export interface OnboardingAnswers {
  readonly displayName: string | null;
  readonly birthDate: Date | null;
  readonly sex: Sex | null;
  readonly heightCm: number | null;
  readonly weightKg: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly country: string | null;
  readonly goal: TrainingGoal | null;
}

export const NO_ANSWERS: OnboardingAnswers = {
  displayName: null,
  birthDate: null,
  sex: null,
  heightCm: null,
  weightKg: null,
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
    case 'dob':
      return answers.birthDate !== null;
    case 'sex':
      return answers.sex !== null;
    case 'height':
      return answers.heightCm !== null;
    case 'weight':
      return answers.weightKg !== null;
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

/** One-based position and the total, for "3 of 8". */
export function progressOf(step: OnboardingStep): { position: number; total: number } {
  return { position: ONBOARDING_STEPS.indexOf(step) + 1, total: ONBOARDING_STEPS.length };
}

/**
 * Whether a date of birth belongs to somebody this app will train.
 *
 * Both screens ask for the date itself, and they used to disagree — the
 * welcome flow asked an age and the You screen asked a year, so answering 26
 * in one place and reading 2000 in the other left somebody working out whether
 * the app agreed with itself. A date settles that, and it is the only version
 * of the fact that could ever wish anyone a happy birthday.
 */
export function isUsableBirthDate(birthDate: Date | null, now: Date): boolean {
  const age = ageFrom(birthDate, now);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}

/**
 * The lightest and heaviest weights, in kilograms, this will take as a
 * bodyweight.
 *
 * Wide on purpose. The point is to catch a slip — a missing digit, grams, a
 * height typed into the weight box — without ever telling a real person their
 * real weight is wrong. The column itself holds anything under a tonne.
 */
export const MIN_BODYWEIGHT_KG = 25;
export const MAX_BODYWEIGHT_KG = 400;

/**
 * Whether a weight belongs to a person.
 *
 * Asked at signup because two things run on it from the first session: a
 * pull-up or a dip is measured against it, and the weekly weigh-in needs a
 * first reading to be a trend from. It was the one number the flow forgot.
 */
export function isUsableBodyweight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= MIN_BODYWEIGHT_KG && kg <= MAX_BODYWEIGHT_KG;
}
