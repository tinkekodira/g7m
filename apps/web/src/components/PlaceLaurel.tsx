import { LaurelIcon } from './icons.js';

/**
 * First, second or third, in a laurel of its metal: the best lifts on Profile
 * and the top of the friends' leaderboard. The metal comes from the nearest
 * `.podium-n` (styles.css). Hidden from a screen reader: the order of the
 * list already says it.
 */
export function PlaceLaurel({ place }: { readonly place: number }) {
  return (
    <span aria-hidden className="relative grid size-8 place-items-center podium-badge">
      <LaurelIcon className="absolute inset-0 size-8" />
      <span className="numeric text-xs leading-none font-semibold">{place}</span>
    </span>
  );
}
