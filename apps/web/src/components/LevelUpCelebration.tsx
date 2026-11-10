import { useEffect, useRef } from 'react';
import type { RecapRewards } from '@g7m/core';
import { Button } from '@g7m/ui';
import { useReducedMotion } from '../lib/use-reduced-motion.js';
import '../level-up.css';

/** A saved reward gets a moment of its own, after leaving a freshly finished recap. */
export function LevelUpCelebration({
  rewards,
  onComplete,
}: {
  readonly rewards: RecapRewards;
  readonly onComplete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = dialog.current;
    if (node === null) return;
    node.showModal();
    return () => node.close();
  }, []);

  useEffect(() => {
    // Reduced motion keeps the announcement still and gives the reader their own time.
    if (reduced) return;
    const timer = setTimeout(onComplete, 3400);
    return () => clearTimeout(timer);
  }, [onComplete, reduced]);

  return (
    <dialog
      ref={dialog}
      className="level-up-dialog"
      aria-labelledby="level-up-title"
      aria-describedby="level-up-description"
      onCancel={(event) => {
        event.preventDefault();
        onComplete();
      }}
    >
      <div className="level-up-content">
        <div className="level-up-emblem" aria-hidden="true">
          <div className="level-up-orbit" />
          <div className="level-up-burst">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ rotate: `${String(i * 30)}deg` }} />
            ))}
          </div>
          <div className="level-up-badge">
            <svg viewBox="0 0 64 40" fill="none" className="level-up-chevrons">
              <path d="m8 20 24-14 24 14M8 34l24-14 24 14" />
            </svg>
            <span className="level-up-number numeric">{rewards.levelAfter}</span>
            <span className="level-up-label">Level</span>
          </div>
        </div>
        <h2 id="level-up-title" className="level-up-title">
          Level up!
        </h2>
        <p id="level-up-description" className="level-up-description">
          Level {rewards.levelBefore} <span aria-hidden="true">→</span>
          <span className="sr-only">to</span> Level {rewards.levelAfter}
        </p>
        <p className="level-up-message">Your hard work is adding up.</p>
      </div>
      <div className="level-up-footer">
        <Button fullWidth onClick={onComplete}>
          Let’s go
        </Button>
      </div>
    </dialog>
  );
}
