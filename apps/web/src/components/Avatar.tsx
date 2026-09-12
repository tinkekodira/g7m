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
}: {
  readonly name: string | null;
  readonly size?: 'md' | 'lg';
}) {
  // By code point, not by UTF-16 unit, so a name starting with an accented
  // capital or an emoji does not come out as half a character.
  const initial = Array.from(name?.trim() ?? '')[0]?.toLocaleUpperCase() ?? '';

  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        'bg-accent-subtle text-accent ring-1 ring-accent/30',
        size === 'lg' ? 'size-16 text-2xl' : 'size-12 text-lg',
      )}
    >
      {initial === '' ? <ProfileIcon className={size === 'lg' ? 'size-8' : 'size-6'} /> : initial}
    </span>
  );
}
