import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from './icons.js';

export interface ViewOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description: string;
  readonly icon: ReactNode;
}

/**
 * A chart's title that is also its dropdown: "Weight lifted ⌄".
 *
 * The title rather than a separate control beside it, because what the chart
 * shows and how to change it are the same question — and a chip at the end of
 * a heading is exactly where somebody taps to change it. The menu under it
 * lists every view with an icon and a line on what it shows, the current one
 * ticked.
 *
 * Built rather than a native `<select>`, which could not carry the icons or
 * the descriptions that make six options scannable. So it does what a select
 * does for free: a listbox with the selected option announced, arrow keys,
 * Home and End, Enter to choose, Escape and a tap outside to close, and focus
 * back on the button after.
 */
export function ViewPicker<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  readonly value: T;
  readonly options: readonly ViewOption<T>[];
  readonly onChange: (next: T) => void;
  /** What is being chosen, for screen readers: "Chart view". */
  readonly label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, indexOf(options, value)));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];

  // Open on the chosen view, with focus on it, so arrows start from there.
  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, indexOf(options, value));
    setActive(index);
    // Without scrolling for the focus: the menu is brought fully into view
    // below instead, clear of the tab bar, rather than jumped to an item.
    items.current[index]?.focus({ preventScroll: true });
    list.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open, options, value]);

  // A tap anywhere else closes it, as any menu does.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  const choose = (next: T): void => {
    setOpen(false);
    button.current?.focus();
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const move = (to: number) => {
      event.preventDefault();
      const index = (to + options.length) % options.length;
      setActive(index);
      items.current[index]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        move(active + 1);
        break;
      case 'ArrowUp':
        move(active - 1);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(options.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        button.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${current?.label ?? ''}`}
        onClick={() => {
          setOpen((was) => !was);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="-ml-1 inline-flex min-h-tap items-center gap-1.5 rounded-full border border-subtle bg-elevated py-1 pr-3 pl-3 text-lg font-semibold text-primary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {current?.label}
        <ChevronDownIcon
          className={`size-5 text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="menu-in absolute top-full left-0 z-30 mt-2 w-72 scroll-mb-24 max-w-[calc(100vw-2rem)] origin-top-left rounded-card border border-subtle bg-surface p-1.5 shadow-floating"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(element) => {
                  items.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={index === active ? 0 : -1}
                onClick={() => {
                  choose(option.value);
                }}
                className={`flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left outline-none focus-visible:bg-elevated active:bg-elevated ${
                  selected ? 'bg-accent-subtle' : ''
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    selected ? 'bg-accent text-on-accent' : 'bg-elevated text-secondary'
                  }`}
                >
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-primary">{option.label}</span>
                  <span className="block truncate text-xs text-muted">{option.description}</span>
                </span>
                {selected && <CheckIcon aria-hidden className="size-5 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function indexOf<T extends string>(options: readonly ViewOption<T>[], value: T): number {
  return options.findIndex((option) => option.value === value);
}
