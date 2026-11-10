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
        <h2 id="level-up-title" className="level-up-title">
          Level up
        </h2>
        <div className="level-up-score numeric" aria-hidden="true">
          <span className="level-up-previous">{rewards.levelBefore}</span>
          <span className="level-up-current">{rewards.levelAfter}</span>
        </div>
        <div className="level-up-rule" aria-hidden="true" />
        <p id="level-up-description" className="level-up-description">
          <span className="level-up-from">Level {rewards.levelBefore}</span>
          <span className="level-up-arrow" aria-hidden="true">
            →
          </span>
          <span className="sr-only"> to </span>
          <span>Level {rewards.levelAfter}</span>
        </p>
      </div>
      <div className="level-up-footer">
        <Button fullWidth onClick={onComplete}>
          Let’s go
        </Button>
      </div>
    </dialog>
  );
}
