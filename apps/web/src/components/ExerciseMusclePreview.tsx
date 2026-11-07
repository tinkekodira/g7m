import { useMemo } from 'react';
import { AnatomyViewer, placeholderBodyParts } from '@g7m/anatomy';
import { bodyFor, useSculptedBody } from '../lib/anatomy-model.js';
import { useStageColor, useThemeStore } from '../lib/use-theme.js';
import type { ExerciseMuscleBodyProps } from './ExerciseMuscleBody.js';

const ignore = () => undefined;

/** Static views leave scrolling in the user's hands and render on demand. */
export default function ExerciseMusclePreview({ sex, muscles }: ExerciseMuscleBodyProps) {
  const sculpted = useSculptedBody(bodyFor(sex));
  const generated = useMemo(() => placeholderBodyParts(), []);
  const stage = useStageColor();
  const theme = useThemeStore((state) => state.theme);
  const palette = useMemo(() => {
    // Canvas materials need literal colors. Reading the active CSS tokens
    // keeps the complete theme objects out of the startup JavaScript.
    const themedRoot =
      document.querySelector(`:root[data-theme='${theme}']`) ?? document.documentElement;
    const style = getComputedStyle(themedRoot);
    return {
      colors: new Map(
        muscles.map((muscle) => [
          muscle.slug,
          style
            .getPropertyValue(muscle.region === null ? '--accent' : `--region-${muscle.region}`)
            .trim(),
        ]),
      ),
      resting: style.getPropertyValue('--muscle-idle').trim(),
    };
  }, [muscles, theme]);
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
            muscleColors={palette.colors}
            restingColor={palette.resting}
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
