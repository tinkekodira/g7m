import { useMemo } from 'react';
import { AnatomyViewer, placeholderBodyParts } from '@g7m/anatomy';
import { bodyFor, useSculptedBody } from '../lib/anatomy-model.js';
import { useStageColor } from '../lib/use-theme.js';
import type { ExerciseMuscleBodyProps } from './ExerciseMuscleBody.js';

const ignore = () => undefined;

/** Static views leave scrolling in the user's hands and render on demand. */
export default function ExerciseMusclePreview({ sex, muscles }: ExerciseMuscleBodyProps) {
  const sculpted = useSculptedBody(bodyFor(sex));
  const generated = useMemo(() => placeholderBodyParts(), []);
  const stage = useStageColor();
  const intensity = useMemo(
    () => new Map(muscles.map((muscle) => [muscle.slug, muscle.share])),
    [muscles],
  );
  const slugs = useMemo(() => muscles.map((muscle) => muscle.slug), [muscles]);
  return (
    <div
      role="img"
      aria-label={`Muscles worked: ${muscles.map((muscle) => muscle.name).join(', ')}. Front and back views.`}
      className="grid grid-cols-2 overflow-hidden rounded-card bg-stage"
    >
      {(['front', 'back'] as const).map((view) => (
        <figure key={view} aria-hidden className="min-w-0">
          <AnatomyViewer
            className="h-44 w-full"
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
          <figcaption className="pb-2 text-center text-xs text-muted">
            {view === 'front' ? 'Front' : 'Back'}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
