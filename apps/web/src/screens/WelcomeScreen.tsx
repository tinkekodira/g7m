import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  MAX_AGE,
  MIN_AGE,
  SEXES,
  SEX_LABELS,
  trainingFocus,
  fromDisplayHeight,
  fromDisplayWeight,
  parseBirthDate,
  toDateOnly,
  toDisplayHeight,
  toDisplayWeight,
  type ActivityLevel,
  type Sex,
  type TrainingGoal,
  type UnitSystem,
} from '@g7m/core';
import { Button, SegmentedControl, TextField } from '@g7m/ui';
import { CountryPicker } from '../components/CountryPicker.js';
import { TrainingGoalChoices } from '../components/TrainingGoalChoices.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import {
  firstUnanswered,
  isOptional,
  isUsableBirthDate,
  isUsableBodyweight,
  nextStep,
  previousStep,
  progressOf,
  readStep,
  type OnboardingAnswers,
  type OnboardingStep,
} from './onboarding-steps.js';

/**
 * The questions asked once, when an account is new.
 *
 * Every one of these was already askable on the You screen, which is the wrong
 * time to ask: the generator picks a starting weight from an age, a height and
 * an activity level, and a user who never opens You gets numbers chosen for
 * somebody who does not exist. Asking at the start is the difference between a
 * program and a guess.
 *
 * One question per screen. A single form with every field is faster to build
 * and worse to answer on a phone — it opens as a wall, and the first thing it
 * asks of somebody who has just signed up is to scroll.
 *
 * The step lives in the URL, like the library's filters and for the same
 * reason: the back button then means "the previous question" rather than
 * "leave", which is what a phone's back gesture is going to do anyway.
 */
export function WelcomeScreen() {
  const { step: raw } = useParams();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const { write, busy, error: writeError } = useWrite();

  const profile = useCatalogue('profile', (r) => r.profile.current());
  const metrics = useCatalogue('body-metrics-current', (r) => r.bodyMetrics.current());
  const goal = useCatalogue('goal', (r) => r.goals.current());

  /**
   * Kilograms or pounds, chosen on the height and weight questions.
   *
   * Held here as well as written to the profile, so the toggle moves the
   * moment it is tapped rather than a re-read later — and so a height typed in
   * one step is still read in the unit it was typed in on the next.
   */
  const [units, setUnits] = useState<UnitSystem | null>(null);
  const unitSystem: UnitSystem = units ?? profile.data?.unitSystem ?? 'metric';
  const heightUnit = unitSystem === 'imperial' ? 'in' : 'cm';
  const weightUnit = unitSystem === 'imperial' ? 'lb' : 'kg';

  const answers: OnboardingAnswers = {
    displayName: profile.data?.displayName ?? null,
    birthDate: profile.data?.birthDate ?? null,
    sex: profile.data?.sex ?? null,
    heightCm: metrics.data?.heightCm ?? null,
    weightKg: metrics.data?.weightKg ?? null,
    activityLevel: metrics.data?.activityLevel ?? null,
    country: profile.data?.country ?? null,
    goal: goal.data?.goal ?? null,
    workoutRecommendations: profile.data?.workoutRecommendations ?? null,
  };

  // Answers in progress. The component stays mounted as the step changes, so
  // going back to a question still shows what was typed into it.
  const [name, setName] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  const [choices, setChoices] = useState<TrainingGoal[] | null>(null);
  const [recommendations, setRecommendations] = useState<boolean | null>(null);
  const firstGuidanceOption = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [raw]);

  const loading = profile.loading || metrics.loading || goal.loading;

  /**
   * No step in the URL: pick up where they left off.
   *
   * Somebody who closes the app three questions in should not be asked their
   * name again. Waits for the reads, because resuming from answers that have
   * not arrived yet is the same as not resuming.
   */
  if (raw === undefined) {
    if (loading) return <Preparing />;
    return <Navigate to={`/welcome/${firstUnanswered(answers) ?? 'name'}`} replace />;
  }

  const step = readStep(raw);
  const { position, total } = progressOf(step);
  const back = previousStep(step);

  // What is selected right now: this session's pick, or what is already on
  // file for somebody stepping back through the flow.
  const chosenActivity = activity ?? answers.activityLevel;
  const chosenCountry = country === undefined ? answers.country : country;
  const error = problem ?? writeError ?? profile.error ?? metrics.error ?? goal.error;
  const selectedGoals = choices ?? goal.data?.selectedGoals ?? [];
  const enteredName = name ?? answers.displayName ?? '';
  const enteredDob = dob ?? (answers.birthDate === null ? '' : toDateOnly(answers.birthDate));
  const enteredHeight =
    height ??
    (answers.heightCm === null ? '' : String(toDisplayHeight(answers.heightCm, unitSystem).value));
  const enteredWeight =
    weight ??
    (answers.weightKg === null ? '' : String(toDisplayWeight(answers.weightKg, unitSystem).value));

  async function save(): Promise<boolean> {
    switch (step) {
      case 'guidance': {
        const selected = recommendations ?? answers.workoutRecommendations;
        if (selected === null) {
          setProblem('Choose how you want to plan your training.');
          firstGuidanceOption.current?.focus();
          return false;
        }
        return (
          (await write((r) => r.profile.update({ workoutRecommendations: selected }))) !== null
        );
      }
      case 'name': {
        if (enteredName.trim() === '') {
          setProblem('What should we call you?');
          return false;
        }
        return (await write((r) => r.profile.update({ displayName: enteredName }))) !== null;
      }
      case 'dob': {
        const born = parseBirthDate(enteredDob);
        if (!isUsableBirthDate(born, now)) {
          setProblem(
            `Enter the day you were born. Between ${String(MIN_AGE)} and ${String(MAX_AGE)}.`,
          );
          return false;
        }
        return (await write((r) => r.profile.update({ birthDate: born }))) !== null;
      }
      case 'sex': {
        const selected = sex ?? answers.sex;
        if (selected === null) {
          setProblem('Pick one to carry on.');
          return false;
        }
        return (await write((r) => r.profile.update({ sex: selected }))) !== null;
      }
      case 'height': {
        const typed = Number(enteredHeight.replace(',', '.'));
        const cm = Number.isFinite(typed) ? fromDisplayHeight(typed, unitSystem) : Number.NaN;
        if (!Number.isFinite(cm) || cm <= 50 || cm >= 300) {
          setProblem(`Enter your height in ${heightUnit}.`);
          return false;
        }
        return (await write((r) => r.bodyMetrics.record({ heightCm: cm }))) !== null;
      }
      case 'weight': {
        const typed = Number(enteredWeight.replace(',', '.'));
        const kg = Number.isFinite(typed) ? fromDisplayWeight(typed, unitSystem) : Number.NaN;
        if (!isUsableBodyweight(kg)) {
          setProblem(`Enter your weight in ${weightUnit}.`);
          return false;
        }
        return (
          (await write(async (r) => {
            // The series the weekly weigh-in extends, and the current value a
            // pull-up is measured against. The same two writes the You screen
            // makes, so the first reading is no different from any later one.
            await r.bodyMetrics.record({ weightKg: kg });
            await r.profile.update({ bodyweightKg: kg });
          })) !== null
        );
      }
      case 'activity': {
        if (chosenActivity === null) {
          setProblem('Pick the one that sounds most like your week.');
          return false;
        }
        return (
          (await write((r) => r.bodyMetrics.record({ activityLevel: chosenActivity }))) !== null
        );
      }
      case 'country': {
        // Optional, and skipping is handled by its own button. Reaching here
        // means something was chosen.
        return (await write((r) => r.profile.update({ country: chosenCountry }))) !== null;
      }
      case 'goal': {
        if (selectedGoals.length === 0) {
          setProblem('Pick what you are training for.');
          return false;
        }
        if (
          goal.data !== null &&
          selectedGoals.length === goal.data.selectedGoals.length &&
          selectedGoals.every((value) => goal.data?.selectedGoals.includes(value))
        )
          return true;
        return (
          (await write((r) =>
            r.goals.set({ goal: trainingFocus(selectedGoals), selectedGoals }),
          )) !== null
        );
      }
    }
  }

  /**
   * Switch units, and carry whatever has been typed across rather than
   * reinterpreting it: 180 typed as centimetres becomes 71 inches, not 180.
   */
  function switchUnits(next: UnitSystem): void {
    if (next === unitSystem) return;
    const convert = (text: string, kind: 'height' | 'weight'): string => {
      const typed = Number(text.replace(',', '.'));
      if (text.trim() === '' || !Number.isFinite(typed)) return text;
      return kind === 'height'
        ? String(toDisplayHeight(fromDisplayHeight(typed, unitSystem), next).value)
        : String(toDisplayWeight(fromDisplayWeight(typed, unitSystem), next).value);
    };
    setHeight(convert(enteredHeight, 'height'));
    setWeight(convert(enteredWeight, 'weight'));
    setUnits(next);
    void write((r) => r.profile.update({ unitSystem: next }));
  }

  async function advance(): Promise<void> {
    setProblem(null);
    if (!(await save())) {
      form.current?.querySelector<HTMLElement>('input, select')?.focus();
      return;
    }
    await go();
  }

  /**
   * On to the next question, or out of the flow entirely.
   *
   * Finishing navigates nowhere. Writing `onboarded_at` swaps the app's routes
   * in underneath this screen — see `Gate` in `App.tsx` — and the catch-all
   * there takes the welcome URL home. Navigating as well would race that swap
   * and could land back on question one.
   *
   * `onboarded_at` is also the only thing that decides the flow is done.
   * Deriving it from the answers would put somebody who later cleared their
   * name back at the start of it, months on.
   */
  async function go(): Promise<void> {
    const next = nextStep(step);
    if (next !== null) {
      void navigate(`/welcome/${next}`);
      return;
    }
    await write((r) => r.profile.update({ onboardedAt: new Date() }));
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col px-5 pt-safe-top pb-safe-bottom sm:px-8">
      <header className="pt-6 sm:pt-12">
        <div className="mb-3 flex items-center justify-between text-sm text-secondary">
          <span className="font-semibold text-primary">Your training starts here</span>
          <span className="numeric">
            {position} of {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Signup progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
          className="h-1 overflow-hidden rounded-full bg-elevated"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${String((position / total) * 100)}%` }}
          />
        </div>
        <h1
          id="welcome-question"
          ref={heading}
          tabIndex={-1}
          className="mt-10 text-3xl leading-tight font-semibold text-balance text-primary outline-none sm:text-4xl"
        >
          {TITLES[step]}
        </h1>
        <p id="question-hint" className="mt-3 text-base leading-relaxed text-secondary">
          {BLURBS[step]}
        </p>
      </header>

      <form
        ref={form}
        aria-labelledby="welcome-question"
        aria-describedby="question-hint"
        className="flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) void advance();
        }}
      >
        <fieldset disabled={busy || loading} className="mt-7 mb-6 min-w-0">
          <legend className="sr-only">{TITLES[step]}</legend>
          {step === 'name' && (
            <TextField
              label="Your name"
              name="name"
              autoComplete="given-name"
              value={enteredName}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          )}

          {/* A real date input, so a phone opens its own date picker rather
            than a keyboard and three separators to get wrong. */}
          {step === 'dob' && (
            <TextField
              label="Date of birth"
              type="date"
              name="birth-date"
              autoComplete="bday"
              value={enteredDob}
              max={toDateOnly(now)}
              onChange={(event) => {
                setDob(event.target.value);
              }}
            />
          )}

          {step === 'sex' && (
            <Choices
              options={SEXES}
              name="sex"
              label={(option) => SEX_LABELS[option]}
              selected={sex ?? answers.sex}
              disabled={busy}
              onPick={setSex}
            />
          )}

          {step === 'height' && (
            <>
              <TextField
                label={`Height (${heightUnit})`}
                inputMode="decimal"
                name="height"
                autoComplete="off"
                value={enteredHeight}
                onChange={(event) => {
                  setHeight(event.target.value);
                }}
              />
              <UnitToggle
                label="Height unit"
                options={[
                  { value: 'metric', label: 'Centimetres' },
                  { value: 'imperial', label: 'Inches' },
                ]}
                value={unitSystem}
                disabled={busy}
                onChange={switchUnits}
              />
            </>
          )}

          {step === 'weight' && (
            <>
              <TextField
                label={`Weight (${weightUnit})`}
                inputMode="decimal"
                name="weight"
                autoComplete="off"
                value={enteredWeight}
                onChange={(event) => {
                  setWeight(event.target.value);
                }}
              />
              <UnitToggle
                label="Weight unit"
                options={[
                  { value: 'metric', label: 'Kilograms' },
                  { value: 'imperial', label: 'Pounds' },
                ]}
                value={unitSystem}
                disabled={busy}
                onChange={switchUnits}
              />
            </>
          )}

          {step === 'activity' && (
            <Choices
              options={ACTIVITY_LEVELS}
              name="activity"
              label={(option) => ACTIVITY_LABELS[option]}
              detail={(option) => ACTIVITY_DESCRIPTIONS[option]}
              selected={chosenActivity}
              disabled={busy}
              onPick={setActivity}
            />
          )}

          {step === 'country' && (
            <CountryPicker
              value={chosenCountry}
              disabled={busy}
              label="Where you are from"
              hint="Only changes the language of the greeting on the home screen."
              onChange={setCountry}
            />
          )}

          {step === 'guidance' && (
            <fieldset className="flex flex-col gap-3" disabled={busy}>
              <legend className="sr-only">Workout recommendations</legend>
              {[
                {
                  value: false,
                  label: 'I’ll choose my own training',
                  detail: 'Plan your sessions without suggestions.',
                },
                {
                  value: true,
                  label: 'Suggest workouts for me',
                  detail: 'Get today’s workout and exercise suggestions.',
                },
              ].map((option) => (
                <label
                  key={String(option.value)}
                  className="flex min-h-tap cursor-pointer items-center gap-4 rounded-control border border-subtle bg-surface p-4 hover:border-strong has-checked:border-accent has-checked:bg-accent-subtle has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    ref={option.value ? undefined : firstGuidanceOption}
                    name="workout-recommendations"
                    className="size-5 shrink-0 accent-accent"
                    checked={(recommendations ?? answers.workoutRecommendations) === option.value}
                    onChange={() => setRecommendations(option.value)}
                  />
                  <span>
                    <span className="block text-base font-medium text-primary">{option.label}</span>
                    <span className="mt-1 block text-sm text-secondary">{option.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {step === 'goal' && (
            <TrainingGoalChoices selected={selectedGoals} disabled={busy} onChange={setChoices} />
          )}
        </fieldset>

        {error !== null && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-subtle py-5 sm:py-6">
          {back !== null && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setProblem(null);
                void navigate(`/welcome/${back}`);
              }}
            >
              Back
            </Button>
          )}
          <Button className="flex-1" type="submit" disabled={busy || loading}>
            {busy ? 'Saving…' : nextStep(step) === null ? 'Finish' : 'Continue'}
          </Button>

          {/* Skipping writes nothing and moves on, which is what makes the
            question genuinely optional rather than optional-looking. */}
          {isOptional(step) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setProblem(null);
                void go();
              }}
              className="min-h-tap w-full text-sm text-secondary underline-offset-4 hover:underline"
            >
              Skip
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

/** The heading for each question. */
const TITLES: Record<OnboardingStep, string> = {
  name: 'What should we call you?',
  dob: 'When were you born?',
  sex: 'Your sex',
  height: 'How tall are you?',
  weight: 'What do you weigh?',
  activity: 'How active is your week?',
  country: 'Where are you from?',
  goal: 'What are you training for?',
  guidance: 'Who plans your workouts?',
};

/**
 * Why each one is being asked.
 *
 * Said at the point of asking, not in a privacy page nobody opens. Two of
 * these — sex and activity — are questions people are right to want a reason
 * for, and the reason is short.
 */
const BLURBS: Record<OnboardingStep, string> = {
  name: 'Only used to say hello.',
  dob: 'Used to pick sensible starting weights.',
  sex: 'Used to quote realistic rates of gain and loss. It never changes how much training you are given, and it is the one answer you cannot change later.',
  height: 'Used with your weight to track what is changing.',
  weight:
    'Pull-ups and dips are measured against it, and your weekly weigh-in starts from here. Nobody else sees it.',
  activity: 'Everything outside the gym. It changes what your training has to fit around.',
  country: 'Only changes the language of the greeting. Skip it and you get English.',
  goal: 'Helps tailor your training and progress feedback. You can change it whenever it changes.',
  guidance: 'You can change workout recommendations in Settings anytime.',
};

function Choices<T extends string>({
  options,
  name,
  label,
  detail,
  selected,
  disabled,
  onPick,
}: {
  readonly options: readonly T[];
  readonly name: string;
  readonly label: (option: T) => string;
  readonly detail?: (option: T) => string;
  readonly selected: T | null;
  readonly disabled: boolean;
  readonly onPick: (option: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <label
          key={option}
          className="flex min-h-tap cursor-pointer items-center gap-4 rounded-control border border-subtle bg-surface p-4 hover:border-strong has-checked:border-accent has-checked:bg-accent-subtle has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={selected === option}
            disabled={disabled}
            onChange={() => onPick(option)}
            className="size-5 shrink-0 accent-accent"
          />
          <span className="min-w-0">
            <span className="block text-base font-semibold text-primary">{label(option)}</span>
            {detail !== undefined && (
              <span className="mt-1 block text-sm text-secondary">{detail(option)}</span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

/**
 * The unit a measurement is typed in, under the box it is typed into.
 *
 * The same setting as Settings' kilograms-or-pounds, asked here because this
 * is the first time a number is: an American asked for their height in
 * centimetres has no good answer. Height and weight share it, so choosing
 * inches on one question already means pounds on the next.
 */
function UnitToggle({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly { readonly value: UnitSystem; readonly label: string }[];
  readonly value: UnitSystem;
  readonly disabled: boolean;
  readonly onChange: (next: UnitSystem) => void;
}) {
  return (
    <SegmentedControl
      className="mt-4"
      label={label}
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

function Preparing() {
  return (
    <main className="flex min-h-full items-center justify-center px-4">
      <p className="text-sm text-muted">Setting your account up…</p>
    </main>
  );
}
