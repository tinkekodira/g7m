/**
 * A country's flag, as the phone draws it.
 *
 * A flag emoji is two regional-indicator letters — `HR` becomes 🇭🇷 — and
 * iOS, Android and macOS draw the pair as the flag. So the app ships no flag
 * images at all, works offline, and every flag matches the ones the rest of
 * the phone shows. See ADR-0071.
 *
 * Windows is the exception: its emoji font has no flags and draws the two
 * letters side by side. `supportsFlagEmoji` notices, and the caller shows a
 * small code tag instead of letters that look broken.
 */

/** 🇦 is U+1F1E6; each letter of a country code offsets from it. */
const REGIONAL_INDICATOR_A = 0x1f1e6;

/** The flag emoji for a two-letter country code, or null for anything else. */
export function flagEmoji(code: string): string | null {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(
    ...[...upper].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65),
  );
}

/**
 * Whether two regional indicators decide to be one flag, from their widths.
 *
 * A pair drawn as a flag is as wide as one indicator drawn alone; a pair drawn
 * as letters is twice as wide. Pure, so the rule is tested without a canvas.
 */
export function drawsFlags(pairWidth: number, singleWidth: number): boolean {
  if (!(pairWidth > 0) || !(singleWidth > 0)) return false;
  return pairWidth < singleWidth * 1.5;
}

let supported: boolean | null = null;

/** Whether this device draws flag emoji. Measured once, on a canvas. */
export function supportsFlagEmoji(): boolean {
  if (supported !== null) return supported;
  try {
    const context = document.createElement('canvas').getContext('2d');
    if (context === null) return (supported = false);
    context.font = '32px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
    const pair = context.measureText(flagEmoji('HR') ?? '').width;
    const single = context.measureText(String.fromCodePoint(REGIONAL_INDICATOR_A + 7)).width;
    supported = drawsFlags(pair, single);
  } catch {
    supported = false;
  }
  return supported;
}
