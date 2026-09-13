import { KG_KIT, LB_KIT, loadBar, type UnitSystem } from '@g7m/core';

/**
 * "Each side: 25 · 15 · 1.25 on a 20 kg bar", under a barbell set.
 *
 * Worked out from the weight in the stepper as it changes, so the plates are
 * right for the number about to be ticked rather than the one that was
 * prefilled. In the lifter's own units: pound plates on a 45 lb bar for
 * somebody who logs in pounds.
 *
 * Silent at zero, which is a set nobody has filled in yet rather than an empty
 * bar.
 */
export function PlateLine({
  weight,
  unitSystem,
}: {
  /** In the display unit, as the stepper holds it. */
  readonly weight: number;
  readonly unitSystem: UnitSystem;
}) {
  if (!(weight > 0)) return null;

  const kit = unitSystem === 'imperial' ? LB_KIT : KG_KIT;
  const loading = loadBar(weight, kit);
  const bar = `${plate(kit.bar)} ${kit.unit} bar`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      {loading.kind === 'below_bar' ? (
        <span>Lighter than a {bar}</span>
      ) : loading.kind === 'bar_only' ? (
        <span>Just the {bar}</span>
      ) : (
        <>
          <span>Each side</span>
          {loading.perSide.map((size, index) => (
            <span
              // Position, because the same plate can appear twice.
              key={`${String(index)}-${String(size)}`}
              className="numeric rounded-full border border-subtle bg-elevated px-2 py-0.5 font-medium text-secondary"
            >
              {plate(size)}
            </span>
          ))}
          <span>
            on a {bar}
            {/* A weight between plates: say what the plates actually make. */}
            {loading.short > 0 && ` · makes ${plate(loading.total)} ${kit.unit}`}
          </span>
        </>
      )}
    </p>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function plate(size: number): string {
  return String(Math.round(size * 100) / 100);
}
