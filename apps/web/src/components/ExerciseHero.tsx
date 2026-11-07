import { useState } from 'react';
import { exerciseIconArt } from './exercise-icon-art.js';

const heroes = import.meta.glob<string>('../assets/exercise-heroes/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** A movement, rather than just its equipment. Thumbnails are available offline. */
export function ExerciseHero({ slug, name }: { readonly slug: string; readonly name: string }) {
  const thumbnail = exerciseIconArt(slug);
  const hero = heroes[`../assets/exercise-heroes/${slug}.webp`] ?? thumbnail;
  return hero === null ? null : (
    <HeroImage key={slug} hero={hero} thumbnail={thumbnail} name={name} />
  );
}

function HeroImage({
  hero,
  thumbnail,
  name,
}: {
  readonly hero: string;
  readonly thumbnail: string | null;
  readonly name: string;
}) {
  const [failed, setFailed] = useState(false);
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <div className="exercise-art-stage">
      <div aria-hidden className="exercise-art-backdrop" />
      <img
        src={failed && thumbnail !== null ? thumbnail : hero}
        alt={`${name} illustration`}
        width={960}
        height={960}
        fetchPriority="high"
        decoding="async"
        onError={() => {
          if (!failed && thumbnail !== null && hero !== thumbnail) setFailed(true);
          else setMissing(true);
        }}
        className="relative size-full object-contain"
      />
    </div>
  );
}
