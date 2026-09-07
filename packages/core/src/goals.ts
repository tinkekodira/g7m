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
import type { WeightTrend } from './body.js';

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
 * somebody who is told "0.1 to 0.3 kg a week" up front does not quit in week
 * three for gaining 0.2.
 */
export const GOAL_EXPECTATIONS: Record<TrainingGoal, string> = {
  lose_fat: 'Expect 0.25–0.75 kg a week. Much faster than that and strength usually goes with it.',
  build_muscle: 'Expect 0.1–0.3 kg a week. Faster than that is mostly fat.',
  recomp:
    'Expect the scale to barely move. The progress shows up in the log weeks before it shows up on the scale.',
  get_stronger:
    'Expect the numbers on the bar to move first. Bodyweight can go either way and neither is a problem.',
};

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
