import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  GOAL_LABELS,
  SEXES,
  SEX_LABELS,
  TRAINING_GOALS,
  fromDisplayHeight,
  type ActivityLevel,
  type Sex,
  type TrainingGoal,
  type UnitSystem,
} from '@g7m/core';
import { Button, Chip, TextField } from '@g7m/ui';
import { CountryPicker } from '../components/CountryPicker.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import {
  birthYearFromAge,
  firstUnanswered,
  isOptional,
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
 * One question per screen. A single form with seven fields is faster to build
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

  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const heightUnit = unitSystem === 'imperial' ? 'in' : 'cm';

  const answers: OnboardingAnswers = {
    displayName: profile.data?.displayName ?? null,
    birthYear: profile.data?.birthYear ?? null,
    sex: profile.data?.sex ?? null,
    heightCm: metrics.data?.heightCm ?? null,
    activityLevel: metrics.data?.activityLevel ?? null,
    country: profile.data?.country ?? null,
    goal: goal.data?.goal ?? null,
  };

  // Answers in progress. The component stays mounted as the step changes, so
  // going back to a question still shows what was typed into it.
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [choice, setChoice] = useState<TrainingGoal | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

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

  async function save(): Promise<boolean> {
    switch (step) {
      case 'name': {
        if (name.trim() === '') {
          setProblem('What should we call you?');
          return false;
        }
        await write((r) => r.profile.update({ displayName: name }));
        return true;
      }
      case 'age': {
        const year = birthYearFromAge(Number(age), now);
        if (year === null) {
          setProblem('Enter your age in years.');
          return false;
        }
        await write((r) => r.profile.update({ birthYear: year }));
        return true;
      }
      case 'sex': {
        if (sex === null) {
          setProblem('Pick one to carry on.');
          return false;
        }
        await write((r) => r.profile.update({ sex }));
        return true;
      }
      case 'height': {
        const typed = Number(height.replace(',', '.'));
        const cm = Number.isFinite(typed) ? fromDisplayHeight(typed, unitSystem) : Number.NaN;
        if (!Number.isFinite(cm) || cm <= 50 || cm >= 300) {
          setProblem(`Enter your height in ${heightUnit}.`);
          return false;
        }
        await write((r) => r.bodyMetrics.record({ heightCm: cm }));
        return true;
      }
      case 'activity': {
        if (activity === null) {
          setProblem('Pick the one that sounds most like your week.');
          return false;
        }
        await write((r) => r.bodyMetrics.record({ activityLevel: activity }));
        return true;
      }
      case 'country': {
        // Optional, and skipping is handled by its own button. Reaching here
        // means something was chosen.
        if (country !== null) await write((r) => r.profile.update({ country }));
        return true;
      }
      case 'goal': {
        if (choice === null) {
          setProblem('Pick what you are training for.');
          return false;
        }
        await write((r) => r.goals.set({ goal: choice }));
        return true;
      }
    }
  }

  async function advance(): Promise<void> {
    setProblem(null);
    if (!(await save())) return;
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
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-8 pb-2">
        <p className="numeric text-xs text-muted">
          {position} of {total}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-primary">{TITLES[step]}</h1>
        <p className="mt-2 text-sm text-secondary">{BLURBS[step]}</p>
      </header>

      <section className="rounded-card bg-surface p-4">
        {step === 'name' && (
          <TextField
            label="Your name"
            value={name}
            placeholder={answers.displayName ?? ''}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        )}

        {step === 'age' && (
          <TextField
            label="Age"
            inputMode="numeric"
            value={age}
            placeholder={
              answers.birthYear === null ? '' : String(now.getFullYear() - answers.birthYear)
            }
            onChange={(event) => {
              setAge(event.target.value);
            }}
          />
        )}

        {step === 'sex' && (
          <Choices
            options={SEXES}
            label={(option) => SEX_LABELS[option]}
            selected={sex ?? answers.sex}
            disabled={busy}
            onPick={setSex}
          />
        )}

        {step === 'height' && (
          <TextField
            label={`Height (${heightUnit})`}
            inputMode="decimal"
            value={height}
            onChange={(event) => {
              setHeight(event.target.value);
            }}
          />
        )}

        {step === 'activity' && (
          <>
            <Choices
              options={ACTIVITY_LEVELS}
              label={(option) => ACTIVITY_LABELS[option]}
              selected={chosenActivity}
              disabled={busy}
              onPick={setActivity}
            />
            {/* What the chosen level actually means, under the chips rather
                than inside them: five labels are a row, five sentences are a
                wall. */}
            {chosenActivity !== null && (
              <p className="mt-3 text-sm text-muted">{ACTIVITY_DESCRIPTIONS[chosenActivity]}</p>
            )}
          </>
        )}

        {step === 'country' && (
          <CountryPicker
            value={country ?? answers.country}
            disabled={busy}
            label="Where you are from"
            hint="Only changes the language of the greeting on the home screen."
            onChange={setCountry}
          />
        )}

        {step === 'goal' && (
          <Choices
            options={TRAINING_GOALS}
            label={(option) => GOAL_LABELS[option]}
            selected={choice ?? answers.goal}
            disabled={busy}
            onPick={setChoice}
          />
        )}
      </section>

      {(problem ?? writeError) !== null && (
        <p role="alert" className="text-sm text-danger">
          {problem ?? writeError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          disabled={busy}
          onClick={() => {
            void advance();
          }}
        >
          {nextStep(step) === null ? 'Finish' : 'Continue'}
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
            className="min-h-tap text-sm text-muted underline-offset-4 hover:underline"
          >
            Skip
          </button>
        )}

        {back !== null && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setProblem(null);
              void navigate(`/welcome/${back}`);
            }}
            className="ml-auto min-h-tap text-sm text-muted underline-offset-4 hover:underline"
          >
            Back
          </button>
        )}
      </div>
    </main>
  );
}

/** The heading for each question. */
const TITLES: Record<OnboardingStep, string> = {
  name: 'What should we call you?',
  age: 'How old are you?',
  sex: 'Your sex',
  height: 'How tall are you?',
  activity: 'How active is your week?',
  country: 'Where are you from?',
  goal: 'What are you training for?',
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
  age: 'Used to pick sensible starting weights.',
  sex: 'Used to quote realistic rates of gain and loss. It never changes how much training you are given, and it is the one answer you cannot change later.',
  height: 'Used with your weight to track what is changing.',
  activity: 'Everything outside the gym. It changes what your training has to fit around.',
  country: 'Only changes the language of the greeting. Skip it and you get English.',
  goal: 'This one decides what the app builds you. You can change it whenever it changes.',
};

function Choices<T extends string>({
  options,
  label,
  selected,
  disabled,
  onPick,
}: {
  readonly options: readonly T[];
  readonly label: (option: T) => string;
  readonly selected: T | null;
  readonly disabled: boolean;
  readonly onPick: (option: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option}
          selected={selected === option}
          disabled={disabled}
          onClick={() => {
            onPick(option);
          }}
        >
          {label(option)}
        </Chip>
      ))}
    </div>
  );
}

function Preparing() {
  return (
    <main className="flex min-h-full items-center justify-center px-4">
      <p className="text-sm text-muted">Setting your account up…</p>
    </main>
  );
}
