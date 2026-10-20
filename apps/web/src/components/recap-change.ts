import { toDisplayWeight, type RecapComparison, type UnitSystem } from '@g7m/core';

export function formatRecapWeight(kg: number, units: UnitSystem): string {
  const { value, unit } = toDisplayWeight(kg, units);
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

/** Compare the same best sets displayed on the card, including reps and assistance. */
export function recapChange(comparison: RecapComparison, units: UnitSystem) {
  const { current, previous, timed } = comparison;
  if (current === null || previous === null) return { label: 'First session', direction: 0 };
  if (!timed && current.loadType !== previous.loadType)
    return { label: 'Load changed', direction: 0 };
  const weight = current.weightKg - previous.weightKg;
  if (!timed && current.loadType !== 'bodyweight' && Math.abs(weight) >= 0.005) {
    const direction = Math.sign(weight) * (current.loadType === 'assisted' ? -1 : 1);
    return {
      label: `${formatRecapWeight(Math.abs(weight), units)}${current.loadType === 'assisted' ? (weight < 0 ? ' less assistance' : ' more assistance') : ''}`,
      direction,
    };
  }
  const reps = current.reps - previous.reps;
  return {
    label:
      reps === 0
        ? 'No change'
        : `${String(Math.abs(reps))} ${timed ? 'sec' : Math.abs(reps) === 1 ? 'rep' : 'reps'}`,
    direction: Math.sign(reps),
  };
}
