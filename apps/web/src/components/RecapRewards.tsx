import { useEffect, useState } from 'react';
import type { RecapRewards as Rewards } from '@g7m/core';
import { useReducedMotion } from '../lib/use-reduced-motion.js';
import { TrophyIcon } from './icons.js';

/** Presentation only: viewing a saved reward never awards XP again. */
export function RecapRewards({ rewards }: { readonly rewards: Rewards }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (reduced || rewards.xp <= 1) return;
    const start = performance.now();
    let frame = requestAnimationFrame(tick);
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / 750);
      setShown(Math.round(1 + (rewards.xp - 1) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [rewards.xp, reduced]);

  if (rewards.xp <= 0 && rewards.achievements.length === 0) return null;
  return (
    <section aria-label="Earned this session" className="recap-rewards">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-primary">Earned this session</h3>
        <p className="recap-xp numeric font-semibold text-accent">
          <span className="sr-only">+{rewards.xp} XP</span>
          <span
            aria-hidden
          >{`+${String(reduced || rewards.xp <= 1 ? rewards.xp : shown)} XP`}</span>
        </p>
      </div>
      {rewards.levelAfter > rewards.levelBefore && (
        <div className="recap-level mt-3 flex items-center gap-3 rounded-control border border-accent/30 bg-accent/10 p-3">
          <TrophyIcon className="size-6 shrink-0 text-accent" />
          <div>
            <p className="font-semibold text-primary">Level up!</p>
            <p className="numeric text-sm text-secondary">
              Level {rewards.levelBefore} → Level {rewards.levelAfter}
            </p>
          </div>
        </div>
      )}
      {rewards.achievements.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rewards.achievements.map((a) => (
            <li key={a.key} className="text-sm font-medium text-primary">
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
