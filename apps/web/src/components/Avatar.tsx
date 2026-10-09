import type { CSSProperties } from 'react';
import { cx } from '@g7m/ui';
import { ProfileIcon } from './icons.js';

/**
 * A circle with somebody's initial in it, or the profile glyph without one.
 *
 * No photo, deliberately: the app has nowhere to store one and no reason to
 * hold a picture of anybody's face. The initial is what the name field gives,
 * and most people never fill that in, so the glyph is the common case rather
 * than a fallback.
 *
 * Decorative — it always sits beside the name, or inside a link that says
 * "Your profile".
 */
export function Avatar({
  name,
  size = 'md',
  tint = false,
}: {
  readonly name: string | null;
  /** `lead` is a step over `md`, for whoever is first on a board. */
  readonly size?: 'md' | 'lead' | 'lg';
  /**
   * In a colour of the person's own rather than the accent, so a list of
   * friends can be told apart at a glance. The same name always gets the same
   * colour. Off by default: the accent is how your own avatar looks.
   */
  readonly tint?: boolean;
}) {
  // By code point, not by UTF-16 unit, so a name starting with an accented
  // capital or an emoji does not come out as half a character.
  const initial = Array.from(name?.trim() ?? '')[0]?.toLocaleUpperCase() ?? '';
  const tinted = tint && initial !== '';

  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        tinted ? 'avatar-tint' : 'bg-accent-subtle text-accent ring-1 ring-accent/30',
        size === 'lg'
          ? 'size-16 text-2xl'
          : size === 'lead'
            ? 'size-[51px] text-xl'
            : 'size-12 text-lg',
      )}
      style={tinted ? ({ '--avatar-hue': hueFor(name ?? '') } as CSSProperties) : undefined}
    >
      {initial === '' ? <ProfileIcon className={size === 'lg' ? 'size-8' : 'size-6'} /> : initial}
    </span>
  );
}

/**
 * Hues for tinted avatars, in degrees of OKLCH, 30 apart. Nothing from 0 to
 * 140: that is the accent’s orange, first place’s gold and the yellows that
 * read as gold beside it, and a friend should never look like you or a medal.
 */
const HUES = [145, 175, 205, 235, 265, 295, 325, 355] as const;

/** A hue from the name, the same every time and on every phone. */
function hueFor(name: string): number {
  let hash = 0;
  for (const char of name.trim().toLocaleLowerCase()) {
    hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) | 0;
  }
  return HUES[Math.abs(hash) % HUES.length] ?? HUES[0];
}
