import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { BodyRegion, Sex } from '@g7m/core';
import { ErrorBoundary } from './ErrorBoundary.js';

const Preview = lazy(() => import('./ExerciseMusclePreview.js'));
export interface ExerciseMuscleBodyProps {
  readonly sex: Sex | null;
  readonly muscles: readonly {
    readonly slug: string;
    readonly name: string;
    readonly region: BodyRegion | null;
  }[];
}
const unavailable = () => null;

/** WebGL and the optional model arrive only when this section approaches. */
export default function ExerciseMuscleBody(props: ExerciseMuscleBodyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReached(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="exercise-body-preview">
      <ErrorBoundary fallback={unavailable}>
        <Suspense fallback={null}>{reached && <Preview {...props} />}</Suspense>
      </ErrorBoundary>
    </div>
  );
}
