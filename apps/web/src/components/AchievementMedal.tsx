import type { Achievement } from '@g7m/core';
import { cx } from '@g7m/ui';
import { CATEGORY_TONE } from './achievement-tones.js';

/**
 * A badge's face: a disc in its category's colour, with an emoji on it — or,
 * for the plate clubs, a barbell loaded with that many plates a side, which
 * says "three-plate squat" faster than any emoji could. ADR-0072.
 *
 * Emoji because they are colourful, instantly readable, need no artwork and
 * are drawn by the phone's own font. Locked badges are the same face in grey
 * at half strength, so the collection shows what is still to come.
 */

const EMOJI: Readonly<Record<string, string>> = {
  'day-one': '🌱',
  'double-digits': '🔟',
  'quarter-century': '🪙',
  'fifty-strong': '🎖️',
  centurion: '💯',
  'iron-veteran': '🛡️',
  lifer: '♾️',
  'record-breaker': '📈',
  'pr-machine': '🚀',
  'heavy-mover': '🐘',
  'whale-of-a-time': '🐋',
  'mountain-mover': '⛰️',
  'total-club': '👑',
  'bench-your-body': '⚖️',
  'squat-and-a-half': '🦵',
  'double-trouble': '✌️',
  'ten-clean': '🧗',
  'gym-rat': '🐀',
  'no-days-off': '🗓️',
  'on-a-roll': '🛼',
  'habit-formed': '🧱',
  'half-year-hero': '🦸',
  'year-rounder': '🌍',
  'comeback-kid': '🪃',
  'early-bird': '🐓',
  'night-owl': '🦉',
  'weekend-warrior': '⚔️',
  'new-year-same-me': '🎆',
  'jingle-lifts': '🎄',
  'leap-lifter': '🐸',
  'heart-starter': '💓',
  'the-2k': '🚣',
  'five-k-finisher': '🏃',
  marathoner: '🏅',
  'road-tripper': '🚗',
  everest: '🏔️',
  furnace: '🔥',
  'machine-collector': '🧰',
  'hybrid-athlete': '⚡',
  explorer: '🧭',
  'lit-up': '💡',
  'birthday-pump': '🎂',
};

/** Plates a side, for the clubs named after them. */
const PLATES: Readonly<Record<string, number>> = {
  'plate-club': 1,
  'plate-overhead': 1,
  'two-plate-bench': 2,
  'two-plate-squat': 2,
  'three-plate-bench': 3,
  'three-plate-squat': 3,
  'three-plate-pull': 3,
  'four-plate-squat': 4,
  'four-plate-pull': 4,
  'five-plate-pull': 5,
};

const SIZES = {
  sm: { disc: 'size-9 border', emoji: 'text-lg', plates: 'size-7' },
  md: { disc: 'size-14 border-2', emoji: 'text-[28px]', plates: 'size-11' },
  lg: { disc: 'size-16 border-2', emoji: 'text-[32px]', plates: 'size-12' },
} as const;

export function AchievementMedal({
  achievement,
  size = 'md',
  className,
}: {
  readonly achievement: Pick<Achievement, 'key' | 'category' | 'secret' | 'earnedAt'>;
  readonly size?: keyof typeof SIZES;
  readonly className?: string;
}) {
  const locked = achievement.earnedAt === null;
  const hidden = achievement.secret && locked;
  const plates = PLATES[achievement.key];
  const sizing = SIZES[size];

  return (
    <span
      aria-hidden
      className={cx(
        'relative flex shrink-0 items-center justify-center rounded-full leading-none select-none',
        sizing.disc,
        locked ? 'border-strong bg-elevated text-muted' : CATEGORY_TONE[achievement.category],
        className,
      )}
    >
      <span className={cx('flex items-center justify-center', locked && 'opacity-45 grayscale')}>
        {hidden ? (
          <span className={cx('font-bold', sizing.emoji)}>?</span>
        ) : plates !== undefined ? (
          <Barbell plates={plates} className={sizing.plates} />
        ) : (
          <span className={sizing.emoji}>{EMOJI[achievement.key] ?? '🏆'}</span>
        )}
      </span>
    </span>
  );
}

/**
 * A bar with `plates` plates a side, as seen from the front.
 *
 * The collars stay where they are and the plates stack outwards from them, so
 * a one-plate bar shows a lot of bare sleeve and a five-plate bar is loaded
 * to the ends — the difference between them is the picture.
 */
function Barbell({ plates, className }: { readonly plates: number; readonly className?: string }) {
  const sides = Array.from({ length: plates }, (_, index) => index);
  return (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-hidden>
      <rect x="1" y="22.5" width="46" height="3" rx="1.5" opacity="0.55" />
      <rect x="19.5" y="20" width="1.5" height="8" rx="0.5" />
      <rect x="27" y="20" width="1.5" height="8" rx="0.5" />
      {sides.map((index) => (
        <g key={index}>
          <rect x={16 - index * 3.6} y="12" width="3" height="24" rx="1" />
          <rect x={29 + index * 3.6} y="12" width="3" height="24" rx="1" />
        </g>
      ))}
    </svg>
  );
}
