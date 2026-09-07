/**
 * What the lifter is training for, and how much training experience they bring.
 *
 * The second half of the pair ADR-0032 named: the generator takes a person and
 * a goal, `body.ts` is the person, and this is the goal. Everything here is
 * vocabulary and judgement — no plan is built yet.
 *
 * ## Why the suggestion works the way it does
 *
 * The brief asks the app to *offer* a goal from the user's metrics. There is
 * an obvious way to do that and it is the wrong one: read a weight and a
 * height, decide the person is carrying too much, and propose losing fat. That
 * is a verdict on somebody's body from an app that was asked for a training
 * plan, and ADR-0035 already refused the arithmetic it would rest on.
 *
 * So the suggestion is drawn from two things that are nobody's business but
 * the training's: what the weight has *already been doing*, and how long the
 * person has been lifting. "You have been losing about half a kilo a week — if
 * that is on purpose, this is the goal that matches" is useful and carries no
 * judgement, because it is a description of their own behaviour rather than an
 * opinion about their body.
 */
import type { Sex, WeightTrend } from './body.js';

export const TRAINING_GOALS = ['lose_fat', 'build_muscle', 'recomp', 'get_stronger'] as const;
export type TrainingGoal = (typeof TRAINING_GOALS)[number];

/**
 * How long somebody has been training.
 *
 * Lives here rather than beside `profiles` because it changes what a plan
 * should contain — a beginner progresses on the same weight a fortnight
 * running, and an advanced lifter does not — which makes it the generator's
 * input before it is a column. `@g7m/db` re-exports it.
 */
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const GOAL_LABELS: Record<TrainingGoal, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  recomp: 'Both at once',
  get_stronger: 'Get stronger',
};

/**
 * One line each, for the picker.
 *
 * Four cards each carrying a paragraph and a pace range is a wall — everything
 * true, none of it read. The card shows this; the detail below arrives when a
 * goal is chosen or suggested, which is the only point at which somebody
 * actually wants it.
 */
export const GOAL_SUMMARIES: Record<TrainingGoal, string> = {
  lose_fat: 'Weight down, strength kept.',
  build_muscle: 'More size, in the reps that build it.',
  recomp: 'Both at once, slower than either alone.',
  get_stronger: 'Heavier bar, fewer reps.',
};

/** What choosing it changes about the training itself. */
export const GOAL_DESCRIPTIONS: Record<TrainingGoal, string> = {
  lose_fat:
    'Keep the strength you have while the weight comes down. The loads stay heavy and the total work comes down a little.',
  build_muscle:
    'More sets per muscle and more moderate reps, with enough recovery between sessions to actually use them.',
  recomp:
    'Muscle up and fat down together. Slower than doing either on its own, and it works best if you are new to lifting or coming back after a break.',
  get_stronger:
    'Heavier loads, fewer reps, longer rests. Fewer sets that count, and each one matters more.',
};

/**
 * What is realistic, said plainly before they start.
 *
 * The honest version of each of these is slower than the internet's, and
 * somebody told "0.1 to 0.3 kg a week" up front does not quit in week three
 * for gaining 0.2.
 *
 * Fat loss is quoted as a share of bodyweight rather than in kilograms, which
 * is both better advice and the reason it needs no sex at all: half a percent
 * a week is the same instruction to everybody, and "0.75 kg a week" is a very
 * different week for a 60 kg lifter than for a 100 kg one.
 *
 * Muscle gain is the one that genuinely differs. Women gain at roughly half
 * the absolute rate, so a single number is good advice for one person and a
 * setup for disappointment for another. Saying so is the whole point of
 * stating a rate — it is not a smaller goal, it is the real number.
 */
const EXPECTATIONS: Record<TrainingGoal, string> = {
  lose_fat:
    'Expect 0.5–1% of your bodyweight a week. Much faster than that and strength usually goes with it.',
  build_muscle:
    'Expect 0.1–0.3 kg a week for men, around half that for women. Faster is mostly fat.',
  recomp:
    'Expect the scale to barely move. The progress shows up in the log weeks before it shows up on the scale.',
  get_stronger:
    'Expect the numbers on the bar to move first. Bodyweight can go either way and neither is a problem.',
};

/** The one goal where the honest number depends on who is asking. */
const MUSCLE_GAIN_BY_SEX: Record<Sex, string> = {
  male: 'Expect 0.1–0.3 kg a week. Faster than that is mostly fat.',
  female:
    'Expect 0.05–0.15 kg a week. Muscle is gained at about half the absolute rate, which is biology rather than effort.',
};

/**
 * The pace to expect, narrowed by sex where sex actually changes the answer.
 *
 * A null sex gets the unqualified version with both figures in it, rather than
 * a guess. Nothing else about the app changes: sex is not an input to how much
 * training gets prescribed, and `programming.ts` does not import it.
 */
export function goalExpectation(goal: TrainingGoal, sex: Sex | null): string {
  if (goal === 'build_muscle' && sex !== null) return MUSCLE_GAIN_BY_SEX[sex];
  return EXPECTATIONS[goal];
}

/**
 * The weekly change on the scale a goal is aiming for, in kilograms.
 *
 * The same numbers `goalExpectation` states in prose, so the sentence somebody
 * reads before they start and the verdict they get six weeks later cannot
 * drift apart. Stating one figure and then judging against another is how an
 * app loses somebody's trust in a way it never gets back.
 *
 * Fat loss is a share of bodyweight rather than a flat rate: half a percent a
 * week is the same instruction to everybody, while 0.75 kg is a very different
 * week at 60 kg than at 100 kg. Hence the bodyweight argument.
 *
 * Null when the goal makes no promise about the scale. Getting stronger is the
 * clear case — bodyweight can go either way and neither is a problem — and
 * judging it by weight would be judging the wrong thing entirely.
 */
export interface PaceTarget {
  /** Kilograms per week. Negative is loss, and `low` is always the smaller. */
  readonly low: number;
  readonly high: number;
}

export function paceTarget(
  goal: TrainingGoal,
  sex: Sex | null,
  bodyweightKg: number | null,
): PaceTarget | null {
  switch (goal) {
    case 'lose_fat': {
      // 0.5-1% of bodyweight a week. Faster and strength goes with it.
      if (bodyweightKg === null || bodyweightKg <= 0) return null;
      return { low: -0.01 * bodyweightKg, high: -0.005 * bodyweightKg };
    }
    case 'build_muscle':
      if (sex === 'female') return { low: 0.05, high: 0.15 };
      if (sex === 'male') return { low: 0.1, high: 0.3 };
      // Unknown: the band spans both, so nobody is told they are failing at a
      // rate that is correct for them.
      return { low: 0.05, high: 0.3 };
    case 'recomp':
      // The scale barely moving is the whole point, so the band straddles zero.
      return { low: -0.1, high: 0.1 };
    case 'get_stronger':
      return null;
  }
}

export const MIN_DAYS_PER_WEEK = 1;
export const MAX_DAYS_PER_WEEK = 7;
/** What most people can actually hold down, rather than what they first pick. */
export const DEFAULT_DAYS_PER_WEEK = 3;

/**
 * Weekly movement below this is water, salt and what time you last ate.
 *
 * Slightly above the equivalent threshold in `metrics-prompt.ts`, because that
 * one describes a change that already happened and this one predicts an
 * intention from it. Guessing wrong here puts a goal in front of somebody that
 * they did not ask for.
 */
const MEANINGFUL_RATE_KG = 0.2;

export interface GoalContext {
  readonly trend: WeightTrend | null;
  readonly experienceLevel: ExperienceLevel | null;
}

export interface GoalSuggestion {
  readonly goal: TrainingGoal;
  /** Shown to the user. Always a description of them, never a verdict on them. */
  readonly because: string;
}

/**
 * The goal to put in front of the user first, or null to just show the four.
 *
 * Null is a real answer and the common one early on. A suggestion invented
 * from nothing is worse than none: it looks like the app knows something, and
 * the first thing it says about somebody should not be a guess.
 */
export function suggestGoal(context: GoalContext): GoalSuggestion | null {
  const rate = context.trend?.perWeekKg ?? null;

  // What they are already doing, which they are the authority on.
  if (rate !== null && Math.abs(rate) >= MEANINGFUL_RATE_KG) {
    const size = Math.abs(rate).toFixed(2).replace(/0$/, '');
    return rate < 0
      ? {
          goal: 'lose_fat',
          because: `Your weight has been coming down about ${size} kg a week. If that is on purpose, this is the goal that matches it.`,
        }
      : {
          goal: 'build_muscle',
          because: `Your weight has been going up about ${size} kg a week. If that is on purpose, this is the goal that matches it.`,
        };
  }

  // Nothing to go on but training age. A beginner genuinely does gain muscle
  // and lose fat at the same time, which stops being true within a year or so
  // — so this is the one case where recomp is the honest recommendation
  // rather than the compromise it becomes later.
  if (context.experienceLevel === 'beginner') {
    return {
      goal: 'recomp',
      because:
        'In your first year of lifting, muscle up and fat down at the same time is genuinely possible. It stops being the easy option later.',
    };
  }

  return null;
}
