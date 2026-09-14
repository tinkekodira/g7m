import { flagEmoji, supportsFlagEmoji } from '../lib/flags.js';

/**
 * A country's flag beside its name.
 *
 * Decorative — the name next to it says the same thing — so it is hidden from
 * screen readers rather than announced as "flag: Croatia, Croatia". Where the
 * device cannot draw flag emoji (Windows), a small tag with the code stands in,
 * which reads as intended rather than as two stray letters.
 */
export function Flag({ code, className }: { readonly code: string; readonly className?: string }) {
  const emoji = flagEmoji(code);
  if (emoji === null) return null;
  if (supportsFlagEmoji()) {
    return (
      <span aria-hidden className={`inline-block leading-none ${className ?? ''}`}>
        {emoji}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex items-center rounded-sm border border-subtle bg-elevated px-1 text-[0.625rem] leading-4 font-semibold tracking-wide text-secondary ${className ?? ''}`}
    >
      {code.toUpperCase()}
    </span>
  );
}
