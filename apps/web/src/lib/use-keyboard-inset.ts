import { useEffect, useState } from 'react';

/** What `window.visualViewport` reports that matters here. */
export interface ViewportBox {
  readonly height: number;
  readonly offsetTop: number;
}

/**
 * How far the on-screen keyboard reaches up from the bottom of the layout
 * viewport, in CSS pixels. Zero when there is no keyboard.
 *
 * iOS Safari does not shrink the page when the keyboard opens. It shrinks
 * the visual viewport and pans it, so a sheet fixed to `bottom: 0` stays where
 * it was, under the keyboard. The gap between the bottom of the layout
 * viewport and the bottom of the visible part is the keyboard, and that is
 * how far a sheet has to lift to sit on top of it.
 */
export function keyboardInset(layoutHeight: number, visual: ViewportBox): number {
  const gap = layoutHeight - visual.height - visual.offsetTop;
  // Below a few pixels it is rounding or a toolbar settling, not a keyboard.
  return gap > 2 ? Math.round(gap) : 0;
}

/**
 * The keyboard's height while one is open, kept current as it opens, closes
 * and the page pans under it. For a bottom sheet with a field in it:
 * set the sheet's `bottom` to this.
 *
 * Android Chrome resizes the page itself, so this stays 0 there; where there
 * is no `visualViewport` at all it is 0 too, and the sheet stays where it was.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const visual = globalThis.visualViewport;
    if (visual === null || visual === undefined) return;
    const update = () => {
      setInset(keyboardInset(globalThis.innerHeight, visual));
    };
    update();
    visual.addEventListener('resize', update);
    visual.addEventListener('scroll', update);
    return () => {
      visual.removeEventListener('resize', update);
      visual.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
