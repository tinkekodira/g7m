import { lazy, Suspense, useMemo } from 'react';
import { placeholderBodyParts } from '@g7m/anatomy';
import type { Sex } from '@g7m/core';
import { bodyFor, useSculptedBody } from '../lib/anatomy-model.js';
import { useStageColor } from '../lib/use-theme.js';

const AnatomyViewer = lazy(() =>
  import('@g7m/anatomy').then((module) => ({ default: module.AnatomyViewer })),
);
const ignore = () => undefined;

/** Still views allow a swipe starting on the body to turn the recap page. */
export function WorkoutMuscleBody({
  sex,
  muscles,
}: {
  readonly sex: Sex | null;
  readonly muscles: readonly { readonly slug: string; readonly commonName: string }[];
}) {
  const sculpted = useSculptedBody(bodyFor(sex));
  const generated = useMemo(() => placeholderBodyParts(), []);
  const slugs = useMemo(() => muscles.map((m) => m.slug), [muscles]);
  const intensity = useMemo(() => new Map(slugs.map((slug) => [slug, 1])), [slugs]);
  const stage = useStageColor();
  return (
    <div
      role="img"
      aria-label={`Muscles worked this session: ${muscles.map((m) => m.commonName).join(', ') || 'none recorded'}. Front and back views.`}
      className="mt-4 grid grid-cols-2 overflow-hidden rounded-card bg-stage"
    >
      {(['front', 'back'] as const).map((view) => (
        <figure key={view} aria-hidden className="min-w-0">
          {sculpted.loading ? (
            <Placeholder />
          ) : (
            <Suspense fallback={<Placeholder />}>
              <AnatomyViewer
                className="recap-body"
                parts={sculpted.parts ?? generated}
                closedSurface={sculpted.parts !== null}
                selectableSlugs={slugs}
                selectedSlug={null}
                onSelect={ignore}
                mode="heatmap"
                intensity={intensity}
                interactive={false}
                view={view}
                cameraDistance={3.1}
                background={stage}
              />
            </Suspense>
          )}
          <figcaption className="pb-2 text-center text-xs text-muted">
            {view === 'front' ? 'Front' : 'Back'}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="recap-body flex items-center justify-center text-xs text-muted">
      Loading model…
    </div>
  );
}
