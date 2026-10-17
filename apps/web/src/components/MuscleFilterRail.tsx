import { useLayoutEffect, useRef, useState } from 'react';
import type { MuscleGroup } from '@g7m/db';
import { muscleColorStyle } from './muscle-colors.js';

/** Scroll only this rail: scrollIntoView would also move the document. */
function reveal(track: HTMLDivElement, button: HTMLButtonElement): void {
  const bounds = track.getBoundingClientRect();
  const target = button.getBoundingClientRect();
  const inset = 18; // Keep the whole button clear of the overflow fades.
  if (target.left < bounds.left + inset) {
    track.scrollLeft += target.left - bounds.left - inset;
  } else if (target.right > bounds.right - inset) {
    track.scrollLeft += target.right - bounds.right + inset;
  }
}

export function MuscleFilterRail({
  groups,
  muscleGroup,
  cardio,
  onChange,
}: {
  readonly groups: readonly MuscleGroup[];
  readonly muscleGroup: string | null;
  readonly cardio: boolean;
  readonly onChange: (group: string | null, cardio: boolean) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const selected = cardio ? 'cardio' : (muscleGroup ?? 'all');

  useLayoutEffect(() => {
    const element = track.current;
    if (element === null) return;

    const measure = (): void => {
      const next = {
        start: element.scrollLeft > 1,
        end: element.scrollWidth - element.clientWidth - element.scrollLeft > 1,
      };
      setEdges((previous) =>
        previous.start === next.start && previous.end === next.end ? previous : next,
      );
    };
    const revealSelected = (): void => {
      const button = element.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (button !== null) reveal(element, button);
      measure();
    };

    revealSelected();
    const observer = new ResizeObserver(revealSelected);
    observer.observe(element);
    // Font loading or taxonomy sync can change content without resizing the track.
    for (const button of element.children) observer.observe(button);
    element.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [groups, selected]);

  const options = [
    { slug: 'all', name: 'All', group: null },
    { slug: 'cardio', name: 'Cardio', group: null },
    ...groups.map((group) => ({ slug: group.slug, name: group.name, group: group.slug })),
  ];

  return (
    <div className="muscle-filter-rail" role="group" aria-label="Muscle filters">
      <div ref={track} className="muscle-filter-track no-scrollbar">
        {options.map((option) => (
          <button
            key={option.slug}
            type="button"
            aria-pressed={selected === option.slug}
            className="muscle-filter-button muscle-wash"
            style={muscleColorStyle(option.group)}
            onFocus={(event) => {
              if (track.current !== null) reveal(track.current, event.currentTarget);
            }}
            onClick={() => {
              onChange(
                option.group !== null && option.slug !== selected ? option.group : null,
                option.slug === 'cardio' && !cardio,
              );
            }}
          >
            {option.name}
          </button>
        ))}
      </div>
      {edges.start && <span aria-hidden className="muscle-filter-fade muscle-filter-fade-start" />}
      {edges.end && <span aria-hidden className="muscle-filter-fade muscle-filter-fade-end" />}
    </div>
  );
}
