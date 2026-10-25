import {
  GOAL_LABELS,
  GOAL_SUMMARIES,
  TRAINING_GOALS,
  trainingFocus,
  type TrainingGoal,
} from '@g7m/core';

/** Shared by signup and the goal editor so multiple choices remain editable. */
export function TrainingGoalChoices({
  selected,
  disabled,
  onChange,
}: {
  readonly selected: readonly TrainingGoal[];
  readonly disabled: boolean;
  readonly onChange: (goals: TrainingGoal[]) => void;
}) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-3">
      <legend className="mb-3 text-sm text-secondary">Select all that apply.</legend>
      {TRAINING_GOALS.filter((goal) => goal !== 'recomp').map((goal) => (
        <label
          key={goal}
          className="flex min-h-tap cursor-pointer items-center gap-4 rounded-control border border-subtle bg-surface p-4 hover:border-strong has-checked:border-accent has-checked:bg-accent-subtle has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            type="checkbox"
            name="training-goals"
            value={goal}
            checked={selected.includes(goal)}
            className="size-5 shrink-0 accent-accent"
            onChange={() =>
              onChange(
                selected.includes(goal)
                  ? selected.filter((value) => value !== goal)
                  : [...selected, goal],
              )
            }
          />
          <span className="min-w-0">
            <span className="block text-base font-semibold text-primary">{GOAL_LABELS[goal]}</span>
            <span className="mt-1 block text-sm text-secondary">{GOAL_SUMMARIES[goal]}</span>
          </span>
        </label>
      ))}
      {selected.length > 1 && (
        <p className="text-sm text-secondary">
          Your training focus: {GOAL_LABELS[trainingFocus(selected)]}.
        </p>
      )}
    </fieldset>
  );
}
