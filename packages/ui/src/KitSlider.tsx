import { useId } from 'react';

/**
 * Bodyweight at one end, a gym at the other, both in the middle.
 *
 * A slider rather than two chips, because the thing being chosen is a *place*
 * — a park, a garage, a commercial gym — and a person sits somewhere along
 * that line rather than ticking a box. The middle is the default and the
 * widest target, since most people want everything most of the time.
 *
 * Built on a real `<input type="range">` with three stops rather than divs
 * with pointer handlers. That is the whole accessibility story for free: it is
 * announced as a slider, arrow keys move it, it inherits the platform's own
 * touch behaviour, and it is draggable on a phone without a single line of
 * gesture code. A custom control would have needed all of that written and
 * most of it would have been written wrong.
 */

export type KitPosition = 'bodyweight' | 'both' | 'gym';

const POSITIONS: readonly KitPosition[] = ['bodyweight', 'both', 'gym'];

const LABELS: Record<KitPosition, string> = {
  bodyweight: 'Bodyweight',
  both: 'Everything',
  gym: 'Gym',
};

export interface KitSliderProps {
  readonly value: KitPosition;
  readonly onChange: (value: KitPosition) => void;
  readonly disabled?: boolean;
}

export function KitSlider({ value, onChange, disabled = false }: KitSliderProps) {
  const id = useId();
  const index = Math.max(0, POSITIONS.indexOf(value));

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        What you are training with
      </label>

      <input
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
        className="h-tap w-full cursor-pointer appearance-none bg-transparent accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
      />

      {/*
        The labels double as buttons.

        Dragging a slider to an exact stop is fiddly with a thumb, and the
        label is already sitting there naming the thing somebody wants. Two
        ways to the same state costs one line and removes the only awkward
        thing about a three-stop slider.
      */}
      <div className="flex justify-between">
        {POSITIONS.map((position) => (
          <button
            key={position}
            type="button"
            disabled={disabled}
            aria-pressed={position === value}
            onClick={() => {
              onChange(position);
            }}
            className={`min-h-tap px-1 text-xs ${
              position === value ? 'font-semibold text-accent' : 'text-muted'
            }`}
          >
            {LABELS[position]}
          </button>
        ))}
      </div>
    </div>
  );
}
