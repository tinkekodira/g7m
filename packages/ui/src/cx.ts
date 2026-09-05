/**
 * Minimal class-name joiner. Deliberately not `clsx` — five lines is not worth
 * a dependency, and we do not need clsx's object/array recursion.
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ');
}
