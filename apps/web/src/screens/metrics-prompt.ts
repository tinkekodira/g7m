/**
 * The words on the metrics screen, separated from the markup that shows them.
 *
 * Both of these are judgements rather than formatting — when to ask for a
 * weight, and whether a series counts as movement or as noise — and a
 * judgement inside JSX is one nobody can write a test against.
 */
import { formatNumber, t } from '@g7m/i18n';
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
        title: t().profile.prompt.addWeight,
        body: t().profile.prompt.addWeightBody,
        tone: 'neutral',
      };
    case 'due':
      return {
        title: t().profile.prompt.due,
        body: t().profile.prompt.dueBody(describeDays(status.days)),
        tone: 'neutral',
      };
    case 'overdue':
      return {
        title: t().profile.prompt.overdue,
        body: t().profile.prompt.overdueBody(describeDays(status.days)),
        tone: 'urgent',
      };
    case 'fresh':
      return null;
  }
}

function describeDays(days: number | null): string {
  const words = t().profile.prompt;
  if (days === null || days < 1) return words.lessThanDay;
  if (days === 1) return words.aDay;
  if (days < WEIGH_IN_DUE_DAYS * 2) return words.days(days);
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? words.aWeek : words.weeks(weeks);
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
    return t().profile.prompt.holding(span);
  }

  const down = trend.changeKg < 0;
  if (trend.perWeekKg === null) {
    // Under a fortnight the rate would be noise with a decimal point on it.
    return t().profile.prompt.tooSoon(down, size, span);
  }

  const rate = show(Math.abs(trend.perWeekKg), unitSystem);
  return t().profile.prompt.rate(down, size, span, rate);
}

function describeSpan(days: number): string {
  if (days < 14) return t().profile.prompt.days(days);
  const weeks = Math.round(days / 7);
  return t().profile.prompt.weeks(weeks);
}

function show(kg: number, unitSystem: UnitSystem): string {
  const display = toDisplayWeight(kg, unitSystem);
  return `${formatNumber(display.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${display.unit}`;
}
