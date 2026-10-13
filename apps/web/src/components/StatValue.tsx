/**
 * A figure with its units a size down: "4h 32m", "12.4 t", "850 kg", "7".
 *
 * Home's month cards and Progress draw their numbers this way, so a figure
 * reads the same on both (ADR-0124). It takes the text the formatters already
 * produce (`formatMinutes`, `formatWeightTotal`) and splits it into number and
 * unit pairs, rather than every caller learning to build the pairs itself.
 *
 * The formatter's own spacing is kept inside the unit, and anything before the
 * first number ("≈ ") stays in front of it, so the text reads exactly as the
 * formatter wrote it: "850 kg", not "850kg".
 */
const PAIRS = /(\d[\d.,]*k?)(\s*)([a-z]*)/gi;

export function StatValue({
  text,
  size = 'text-2xl leading-7',
}: {
  readonly text: string;
  /** The number's size; the unit is always `text-sm`. */
  readonly size?: string;
}) {
  const matches = [...text.matchAll(PAIRS)];
  const lead = matches.length === 0 ? '' : text.slice(0, matches[0]?.index ?? 0);
  const pairs = matches.map(
    (match) => [match[1] ?? '', `${match[2] ?? ''}${match[3] ?? ''}`, match[3] ?? ''] as const,
  );

  return (
    <span className={`numeric block font-bold whitespace-nowrap text-primary ${size}`}>
      {pairs.length === 0
        ? text
        : [
            lead,
            ...pairs.map(([number, spacedUnit, unit], index) => (
              <span key={`${String(index)}-${unit}`}>
                {index > 0 && ' '}
                {number}
                {unit !== '' && (
                  <span className="ml-px text-sm font-semibold whitespace-pre text-muted">
                    {spacedUnit}
                  </span>
                )}
              </span>
            )),
          ]}
    </span>
  );
}
