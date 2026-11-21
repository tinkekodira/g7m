import { formatNumber, t } from '@g7m/i18n';
import { toDisplayWeight, type RecapComparison, type UnitSystem } from '@g7m/core';

export function formatRecapWeight(kg: number, units: UnitSystem): string {
  const { value, unit } = toDisplayWeight(kg, units);
  return `${formatNumber(value, { maximumFractionDigits: 2 })} ${unit}`;
}

/** Compare the same best sets displayed on the card, including reps and assistance. */
export function recapChange(comparison: RecapComparison, units: UnitSystem) {
  const { current, previous, timed } = comparison;
  const words = t().history.recap.change;
  if (current === null || previous === null) return { label: words.first, direction: 0 };
  if (!timed && current.loadType !== previous.loadType)
    return { label: words.loadChanged, direction: 0 };
  const weight = current.weightKg - previous.weightKg;
  if (!timed && current.loadType !== 'bodyweight' && Math.abs(weight) >= 0.005) {
    const direction = Math.sign(weight) * (current.loadType === 'assisted' ? -1 : 1);
    return {
      label: `${formatRecapWeight(Math.abs(weight), units)}${current.loadType === 'assisted' ? (weight < 0 ? words.lessAssistance : words.moreAssistance) : ''}`,
      direction,
    };
  }
  const reps = current.reps - previous.reps;
  return {
    label:
      reps === 0
        ? words.noChange
        : timed
          ? words.seconds(Math.abs(reps))
          : words.reps(Math.abs(reps)),
    direction: Math.sign(reps),
  };
}
