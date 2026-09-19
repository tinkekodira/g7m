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
 * ## The render is never cropped, by construction
 *
 * It used to be `object-cover` on a box the right shape, which was fine until a
 * real phone: the hero's height is 45vh *plus the status bar inset*, and a 59px
 * notch makes the box narrower than the art, so cover trimmed 31px off each
 * side and cut the end off the bench. Chromium reports a zero inset, so no
 * amount of testing there would have shown it.
 *
 * So the fit no longer depends on the box. The art is cut to 1.22 — wider than
 * any hero can be, since the tallest case is a narrow phone with a big notch —
 * and the image is laid in at `w-full` with its natural height. Filling the
 * width is then the only outcome available, whatever the inset does to the
 * height, and the slack lands at the top, behind the status bar, where it is
 * wanted. `max-h-full` is there for a landscape window and nothing else.
 *
 * ## Why the image is dimmed rather than darkened
 *
 * The bench is black and grey and the page is #1f1e1d, so the render has very
 * little room between "invisible" and "competing with the title". Three things
 * share the work, and only the first touches the image:
 *
 *  - **Opacity 0.5.** The title sits *on* the bench rather than under it, so
 *    the render has to sit further back than it would as a backdrop below the
 *    text. The bar and plates are the lit parts and still read.
 *  - **A short top wash**, 50% of the page colour fading out by a quarter. It
 *    exists for the status bar and the back button, not for the image.
 *  - **A long bottom wash** reaching the full page colour before the hero ends,
 *    so there is no seam where the image stops — the page simply continues.
 *
 * The title gets its contrast from the third of those, not from a shadow or a
 * glow. Measured on the rendered pixels it sits on at least 81% page colour,
 * which clears AA several times over in both themes — so the gradient alone
 * does it and the image never has to go darker.
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
      // `-mx-4` cancels the page's gutter so the render reaches both edges. The
      // box starts at the very top of the screen — the page drops its own top
      // inset when a hero is present — so 45% of the screen is 45% of the
      // screen, notch included, rather than 45% plus a notch.
      className="relative -mx-4 h-[var(--hero-h)] overflow-hidden [--hero-h:clamp(300px,45vh,400px)]"
    >
      {/* Bottom-aligned inside the box, so the bench always lands in the same
          place relative to the title and the notch only ever changes how much
          page shows above it. */}
      <div aria-hidden className="absolute inset-0 flex items-end pb-6">
        <img
          src={art.hero}
          alt=""
          className="max-h-full w-full object-contain object-bottom opacity-50"
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[25%] bg-linear-to-b from-base/50 to-base/0"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-base from-7% via-base/68 via-45% to-base/0"
      />

      <div className="relative flex h-full flex-col px-4 pt-safe-top">
        <div className="pt-6">
          <HeaderLink to="/exercises">← All exercises</HeaderLink>
        </div>
        {/* Across the bench itself, not under it — a quarter of the hero up
            from the bottom, which lands on the pad and the frame and leaves the
            base showing below. Tied to `--hero-h` rather than set in pixels so
            it stays on the same part of the bench at every hero size; a
            percentage would resolve against the width and drift. A long name
            growing to two lines grows upward into the calmer part of the
            image rather than down towards the chips. */}
        <div className="mt-auto pb-[calc(var(--hero-h)*0.25)]">
          <h1 className="text-2xl font-semibold text-balance text-primary">{name}</h1>
          {aliases.length > 0 && (
            <p className="mt-1 text-sm text-secondary">Also called {aliases.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
