import { useId, useRef, useState } from 'react';
import { stopAt, thumbOffset, trackFraction } from './slider-track.js';

/**
 * Bodyweight at one end, a gym at the other, both in the middle.
 *
 * A slider rather than two chips, because the thing being chosen is a *place*
 * — a park, a garage, a commercial gym — and a person sits somewhere along
 * that line rather than ticking a box. The middle is the default and the
 * widest target, since most people want everything most of the time.
 *
 * ## Why this is not a bare `<input type="range">`
 *
 * It was, and it looked broken: `appearance-none` strips the track along with
 * the thumb, so what shipped was a white lozenge floating over nothing. Styling
 * the track back is `::-webkit-slider-runnable-track` and its three cousins,
 * none of which can hold the words — and the words are the control here. A
 * three-stop range input also has no continuous position to animate, so it can
 * only ever cut between still frames.
 *
 * So the pill is drawn, and the drag is a pointer handler. What the range input
 * still does is the part worth keeping: it stays in the tree, visually hidden,
 * as the accessibility surface. Screen readers announce a slider with a value,
 * arrow keys and Home/End move it, and none of that had to be written or, more
 * to the point, written wrong. The pointer handler and the input drive the same
 * `value` prop, so the two can never drift apart.
 *
 * ## The motion
 *
 * While a finger is down the pill has `transition: none` and is drawn at the
 * exact fraction under it — it tracks the finger, not the stops. On release the
 * transition comes back and the pill settles onto its stop with a little
 * overshoot, which is the whole difference between a control that moves and one
 * that redraws. The reduced-motion block in `tokens.css` flattens both, and the
 * pill still lands in the right place.
 */

export type KitPosition = 'bodyweight' | 'both' | 'gym';

const POSITIONS: readonly KitPosition[] = ['bodyweight', 'both', 'gym'];

const LABELS: Record<KitPosition, string> = {
  bodyweight: 'Bodyweight',
  both: 'Everything',
  gym: 'Gym',
};

/** Long enough to be seen settling, short enough not to be waited for. */
const SETTLE = 'transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1)';

export interface KitSliderProps {
  readonly value: KitPosition;
  readonly onChange: (value: KitPosition) => void;
  readonly disabled?: boolean;
}

export function KitSlider({ value, onChange, disabled = false }: KitSliderProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** What to put back if the browser decides the gesture was a scroll. */
  const startValue = useRef<KitPosition>(value);
  /** Where the finger is, or null when nothing is holding the pill. */
  const [dragFraction, setDragFraction] = useState<number | null>(null);

  const index = Math.max(0, POSITIONS.indexOf(value));
  const dragging = dragFraction !== null;
  const offset = dragging ? thumbOffset(dragFraction, POSITIONS.length) : index;

  function fractionAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect === undefined) return 0;
    return trackFraction(clientX, rect.left, rect.width);
  }

  function commit(fraction: number): void {
    const next = POSITIONS[stopAt(fraction, POSITIONS.length)];
    if (next !== undefined && next !== value) onChange(next);
  }

  return (
    <div
      // `touch-pan-y` rather than blocking touch outright: a horizontal drag is
      // ours, a vertical one is the page's, so the screen still scrolls when a
      // thumb happens to start here. When the browser claims the gesture it
      // sends pointercancel, which is why that handler puts the value back.
      className={`relative w-full touch-pan-y rounded-full border border-subtle bg-input p-1 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
        disabled ? 'opacity-50' : 'cursor-pointer'
      }`}
      onPointerDown={(event) => {
        if (disabled) return;
        // Capture, so the drag survives the finger leaving the pill — which it
        // will, because the pill is 48px tall and a thumb is not precise.
        event.currentTarget.setPointerCapture(event.pointerId);
        startValue.current = value;
        const fraction = fractionAt(event.clientX);
        setDragFraction(fraction);
        // On the way down, not the way up: a tap should light up the word under
        // the finger immediately, the same as every segmented control does.
        commit(fraction);
        // Keeps the keyboard on the same control the finger just used. Without
        // preventScroll, focusing a visually hidden element can jump the page.
        inputRef.current?.focus({ preventScroll: true });
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const fraction = fractionAt(event.clientX);
        setDragFraction(fraction);
        commit(fraction);
      }}
      onPointerUp={() => {
        setDragFraction(null);
      }}
      onPointerCancel={() => {
        setDragFraction(null);
        onChange(startValue.current);
      }}
    >
      <label htmlFor={id} className="sr-only">
        What you are training with
      </label>

      <div ref={trackRef} className="relative flex">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{
            width: `${String(100 / POSITIONS.length)}%`,
            // Percentages resolve against the pill's own width, and the pill is
            // exactly one cell wide, so a whole number of them is a stop.
            transform: `translateX(${String(offset * 100)}%) scale(${dragging ? '0.94' : '1'})`,
            transition: dragging ? 'none' : SETTLE,
          }}
        />

        {POSITIONS.map((position) => (
          // Hidden from assistive tech: the input below announces the value,
          // and these would otherwise be read out as three loose words.
          <span
            key={position}
            aria-hidden
            className={`relative flex h-10 flex-1 items-center justify-center px-1 text-xs font-medium transition-colors duration-200 ${
              position === value ? 'text-on-accent' : 'text-muted'
            }`}
          >
            {LABELS[position]}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="range"
        min={0}
        max={POSITIONS.length - 1}
        step={1}
        value={index}
        disabled={disabled}
        // The value is a word, not a number. Without this it is announced as
        // "1 of 2", which tells a screen-reader user nothing about what it does.
        aria-valuetext={LABELS[value]}
        onChange={(event) => {
          onChange(POSITIONS[Number(event.target.value)] ?? 'both');
        }}
        className="sr-only"
      />
    </div>
  );
}
