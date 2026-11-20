import { useId } from 'react';
import { Chip } from '@g7m/ui';
import { PinIcon } from './icons.js';

/**
 * Which gym, as a row of chips. ADR-0178.
 *
 * Chips rather than a select: there are two or three of these at most, every
 * one visible at once is one tap rather than two, and the row scrolls
 * sideways under a thumb when somebody has named more.
 */
export function GymChips({
  gyms,
  value,
  onChange,
  disabled = false,
  label = 'Which gym',
}: {
  readonly gyms: readonly { readonly id: string; readonly name: string }[];
  readonly value: string | null;
  readonly onChange: (gymId: string) => void;
  readonly disabled?: boolean;
  readonly label?: string;
}) {
  const heading = useId();
  return (
    <div role="group" aria-labelledby={heading}>
      <p id={heading} className="mb-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
        <PinIcon className="size-4 shrink-0 text-muted" />
        {label}
      </p>
      <div className="no-scrollbar -mx-0.5 flex gap-2 overflow-x-auto p-0.5">
        {gyms.map((gym) => (
          <Chip
            key={gym.id}
            selected={gym.id === value}
            disabled={disabled}
            onClick={() => {
              onChange(gym.id);
            }}
          >
            {gym.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
