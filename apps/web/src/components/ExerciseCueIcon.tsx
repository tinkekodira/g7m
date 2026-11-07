/** Small coaching symbols; the cue text always supplies the instruction. */
export function ExerciseCueIcon({
  slug,
  index,
}: {
  readonly slug: string;
  readonly index: number;
}) {
  const bench = slug === 'barbell-bench-press';
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-8 shrink-0 text-accent"
    >
      {bench && index === 0 ? (
        <path d="m12 4-1 4-6 3-2 10 5 2 3-5 5 3 5-3 3 5 5-2-2-10-6-3-1-4M16 10v11M8 13l4 1m12-1-4 1" />
      ) : bench && index === 1 ? (
        <>
          <path d="m26 5-19 20h21M16 16a12 12 0 0 1 5 9" />
          <path d="m6 19-3 6 5 4" />
        </>
      ) : bench && index === 2 ? (
        <path d="m4 23 2-10 5 5 6 2 4-3 3 5 5 1v5H3v-5Zm4-2 3 1m2-2 2 3m2-2 2 3M3 25h26" />
      ) : (
        <>
          <path d="m10 9 7 7-7 7" />
          <path d="m18 9 7 7-7 7" />
        </>
      )}
    </svg>
  );
}
