import { HeaderLink } from './HeaderLink.js';
import { equipmentArt } from './equipment-art.js';

/**
 * The top of an exercise's page: its name over a render of the kit it needs.
 *
 * Only for exercises that have a hero render. Everything else keeps the plain
 * header it has always had — an exercise with no art gets no empty frame and
 * no placeholder, because a grey rectangle where a photograph should be is
 * worse than a heading.
 *
 * ## Why the image is dimmed rather than darkened
 *
 * The bench is black and grey and the page is #1f1e1d, so the render has very
 * little room between "invisible" and "competing with the title". Three things
 * share the work, and only the first two touch the image:
 *
 *  - **Opacity 0.65.** Inside the brief's 0.6–0.7. The bar and plates are the
 *    lit parts of the render and stay clearly readable; the frame drops to a
 *    shade above the page.
 *  - **A short top wash**, 60% of the page colour fading out by 30%. It exists
 *    for the status bar and the back button, not for the image.
 *  - **A long bottom wash** reaching the full page colour before the hero ends,
 *    so there is no seam where the image stops — the page simply continues.
 *
 * The title gets its contrast from the third of those, not from a shadow or a
 * glow. Measured on the rendered pixels it sits on at least 86% page colour,
 * which is 14:1 against `--text-primary` in both themes — so the gradient alone
 * clears AA with room to spare and the image never has to go darker.
 *
 * ## Both themes, from one asset
 *
 * The render ships with a drop shadow baked for a light backdrop: pure black at
 * partial alpha. That is invisible on the dark theme and a grey smear across
 * the bottom of the hero on the light one, so it is cut out when the asset is
 * built and the bottom wash does the grounding instead. Everything else here is
 * a token, so the light theme is the same component with `--bg-base` swapped.
 *
 * ## No parallax
 *
 * The brief offered it if it were smooth. It would not be: scroll-driven CSS
 * animations are not in Safari 17, which is the iOS WebView this app targets,
 * so the only way to do it is a scroll listener writing a transform every
 * frame — jank on exactly the mid-range Android the app is built for. The hero
 * scrolls away with the page, which is what it should do anyway.
 */
export function ExerciseHero({
  slug,
  name,
  aliases,
}: {
  readonly slug: string;
  /** Null until the exercise has loaded; the image and the way back are not. */
  readonly name: string | null;
  readonly aliases: readonly string[];
}) {
  const art = equipmentArt(slug);
  if (art?.hero == null) return null;

  return (
    <div
      // `-mx-4` cancels the page's gutter so the render reaches both edges, and
      // the height carries the status bar inset on top of its own, so the image
      // runs up behind the clock rather than starting under it.
      className="relative -mx-4 h-[calc(clamp(300px,45vh,400px)+var(--spacing-safe-top))] overflow-hidden"
    >
      <img
        src={art.hero}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-65"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[30%] bg-linear-to-b from-base/60 to-base/0"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-base from-13% via-base/72 via-48% to-base/0"
      />

      <div className="relative flex h-full flex-col px-4 pt-safe-top">
        <div className="pt-6">
          <HeaderLink to="/exercises">← All exercises</HeaderLink>
        </div>
        {/* Pushed to the bottom, where the wash is at its strongest. A long
            name growing to two lines therefore grows upward into the calm part
            of the image rather than down towards the chips. */}
        <div className="mt-auto pb-5">
          <h1 className="text-2xl font-semibold text-balance text-primary">{name}</h1>
          {aliases.length > 0 && (
            <p className="mt-1 text-sm text-secondary">Also called {aliases.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
