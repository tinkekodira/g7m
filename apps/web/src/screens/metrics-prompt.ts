/**
 * The words on the metrics screen, separated from the markup that shows them.
 *
 * Both of these are judgements rather than formatting — when to ask for a
 * weight, and whether a series counts as movement or as noise — and a
 * judgement inside JSX is one nobody can write a test against.
 */
import {
  WEIGH_IN_DUE_DAYS,
  toDisplayWeight,
  type UnitSystem,
  type WeighInStatus,
  type WeightTrend,
} from '@g7m/core';

export interface Prompt {
  readonly title: string;
  readonly body: string;
  /** `urgent` earns colour. Reserved for the case that is actually a problem. */
  readonly tone: 'neutral' | 'urgent';
}

/**
 * Whether to ask for a weight, and how hard.
 *
 * Null while the weight is fresh — the card is simply absent, rather than
 * present and reassuring. A banner that says "nothing to do" every day is a
 * banner people stop reading, and this one has to still work in eight weeks.
 *
 * Nothing here scolds. The overdue copy names the consequence (the trend goes
 * quiet) rather than the omission, because the person reading it already knows
 * they have not been weighing themselves.
 */
export function weighInPrompt(status: WeighInStatus): Prompt | null {
  switch (status.state) {
    case 'never':
      return {
        title: 'Add your weight',
        body: 'It sets the load for pull-ups and dips, and it is the first point on your trend.',
        tone: 'neutral',
      };
    case 'due':
      return {
        title: 'Time to weigh in',
        body: `It has been ${describeDays(status.days)}. Once a week is enough to see a trend.`,
        tone: 'neutral',
      };
    case 'overdue':
      return {
        title: 'Your trend has gone quiet',
        body: `The last weight here is ${describeDays(status.days)} old. One reading brings it back.`,
        tone: 'urgent',
      };
    case 'fresh':
      return null;
  }
}

function describeDays(days: number | null): string {
  if (days === null || days < 1) return 'less than a day';
  if (days === 1) return 'a day';
  if (days < WEIGH_IN_DUE_DAYS * 2) return `${String(days)} days`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'a week' : `${String(weeks)} weeks`;
}

/**
 * Movement small enough to be water, salt, or what time you last ate.
 *
 * Below this the honest answer is "holding", not a direction with a decimal
 * point on it. Calling a 200 g swing a loss teaches somebody to read noise as
 * progress, which is the habit that makes them quit in week three.
 */
const HOLDING_KG = 0.4;

/**
 * One sentence about where the weight is going.
 *
 * Deliberately has no opinion about whether that is good. Until there is a
 * goal to judge it against — the next piece of this phase — "down 2 kg" is a
 * fact, and dressing a fact as praise or as a warning is guessing.
 */
export function describeChange(trend: WeightTrend | null, unitSystem: UnitSystem): string | null {
  if (trend === null || trend.samples < 2) return null;

  const span = describeSpan(trend.spanDays);
  const size = show(Math.abs(trend.changeKg), unitSystem);

  if (Math.abs(trend.changeKg) < HOLDING_KG) {
    return `Holding steady over ${span}.`;
  }

  const direction = trend.changeKg < 0 ? 'Down' : 'Up';
  if (trend.perWeekKg === null) {
    // Under a fortnight the rate would be noise with a decimal point on it.
    return `${direction} ${size} over ${span} — too soon to call a rate.`;
  }

  const rate = show(Math.abs(trend.perWeekKg), unitSystem);
  return `${direction} ${size} over ${span} — about ${rate} a week.`;
}

function describeSpan(days: number): string {
  if (days < 14) return `${String(days)} days`;
  const weeks = Math.round(days / 7);
  return `${String(weeks)} weeks`;
}

function show(kg: number, unitSystem: UnitSystem): string {
  const display = toDisplayWeight(kg, unitSystem);
  return `${display.value.toFixed(1)} ${display.unit}`;
}
