import { useContext, useEffect, useState, type ReactNode } from 'react';
import { LoadingStarted, LOADING_DELAY_MS } from '../lib/loading-context.js';

/** Reserve the final shape immediately, without flashing on quick reads. */
export function LoadingRegion({
  label,
  className,
  children,
}: {
  readonly label: string;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  const inherited = useContext(LoadingStarted);
  const [started] = useState(() => inherited ?? Date.now());
  const [visible, setVisible] = useState(() => Date.now() - started >= LOADING_DELAY_MS);

  useEffect(() => {
    const remaining = LOADING_DELAY_MS - (Date.now() - started);
    if (visible) return;
    const timer = setTimeout(() => setVisible(true), remaining);
    return () => clearTimeout(timer);
  }, [started, visible]);

  return (
    <>
      {/* Outside the busy subtree so assistive technology can announce it. */}
      <span role="status" className="sr-only">
        {visible ? label : ''}
      </span>
      <div role="region" aria-label={label} aria-busy="true" className={className}>
        <div
          aria-hidden="true"
          className={visible ? undefined : 'invisible'}
          data-skeleton-visible={visible}
        >
          {children}
        </div>
      </div>
    </>
  );
}
