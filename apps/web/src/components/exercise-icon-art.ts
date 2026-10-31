/** Per-exercise thumbnails, bundled and precached for offline lists. */
const icons = import.meta.glob<string>('../assets/exercises/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function exerciseIconArt(slug: string): string | null {
  return icons[`../assets/exercises/${slug}.webp`] ?? null;
}
