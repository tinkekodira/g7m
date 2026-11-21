import { currentLocale, t } from '@g7m/i18n';
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
import { LanguageChoices } from '../components/LanguagePicker.js';
import { switchLanguage } from '../lib/language.js';
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
    language: profile.data?.language ?? null,
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

  // A profile UPDATE before sync has delivered the row changes nothing. Let
  // new users type their name immediately, but never advance on a lost write.
  const loading = profile.loading || profile.data === null || metrics.loading || goal.loading;

  /**
   * No step in the URL: pick up where they left off.
   *
   * Somebody who closes the app three questions in should not be asked their
   * name again. Waits for the reads, because resuming from answers that have
   * not arrived yet is the same as not resuming.
   */
  if (raw === undefined) {
    if (loading) return <Preparing />;
    return <Navigate to={`/welcome/${firstUnanswered(answers) ?? 'language'}`} replace />;
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
      case 'language': {
        // Whatever is on screen is the answer: tapping a language switches
        // the app at once, and the phone's own is preselected.
        const chosen = currentLocale();
        return (await write((r) => r.profile.update({ language: chosen }))) !== null;
      }
      case 'guidance': {
        const selected = recommendations ?? answers.workoutRecommendations;
        if (selected === null) {
          setProblem(t().onboarding.problems.guidance);
          firstGuidanceOption.current?.focus();
          return false;
        }
        return (
          (await write((r) => r.profile.update({ workoutRecommendations: selected }))) !== null
        );
      }
      case 'name': {
        if (enteredName.trim() === '') {
          setProblem(t().onboarding.problems.name);
          return false;
        }
        return (await write((r) => r.profile.update({ displayName: enteredName }))) !== null;
      }
      case 'dob': {
        const born = parseBirthDate(enteredDob);
        if (!isUsableBirthDate(born, now)) {
          setProblem(t().onboarding.problems.dob(MIN_AGE, MAX_AGE));
          return false;
        }
        return (await write((r) => r.profile.update({ birthDate: born }))) !== null;
      }
      case 'sex': {
        const selected = sex ?? answers.sex;
        if (selected === null) {
          setProblem(t().onboarding.problems.sex);
          return false;
        }
        return (await write((r) => r.profile.update({ sex: selected }))) !== null;
      }
      case 'height': {
        const typed = Number(enteredHeight.replace(',', '.'));
        const cm = Number.isFinite(typed) ? fromDisplayHeight(typed, unitSystem) : Number.NaN;
        if (!Number.isFinite(cm) || cm <= 50 || cm >= 300) {
          setProblem(t().onboarding.problems.height(heightUnit));
          return false;
        }
        return (await write((r) => r.bodyMetrics.record({ heightCm: cm }))) !== null;
      }
      case 'weight': {
        const typed = Number(enteredWeight.replace(',', '.'));
        const kg = Number.isFinite(typed) ? fromDisplayWeight(typed, unitSystem) : Number.NaN;
        if (!isUsableBodyweight(kg)) {
          setProblem(t().onboarding.problems.weight(weightUnit));
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
          setProblem(t().onboarding.problems.activity);
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
          setProblem(t().onboarding.problems.goal);
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
    if (busy || loading) return;
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
          <span className="font-semibold text-primary">{t().onboarding.startsHere}</span>
          <span className="numeric">{t().onboarding.progress(position, total)}</span>
        </div>
        <div
          role="progressbar"
          aria-label={t().onboarding.progressLabel}
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
          {t().onboarding.titles[step]}
        </h1>
        <p id="question-hint" className="mt-3 text-base leading-relaxed text-secondary">
          {t().onboarding.blurbs[step]}
        </p>
      </header>

      <form
        ref={form}
        aria-labelledby="welcome-question"
        aria-describedby="question-hint"
        className="flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void advance();
        }}
      >
        <fieldset disabled={busy || (loading && step !== 'name')} className="mt-7 mb-6 min-w-0">
          <legend className="sr-only">{t().onboarding.titles[step]}</legend>
          {step === 'language' && (
            <LanguageChoices
              selected={currentLocale()}
              disabled={busy}
              onPick={(locale) => {
                setProblem(null);
                void switchLanguage(locale);
              }}
            />
          )}

          {step === 'name' && (
            <TextField
              label={t().onboarding.yourName}
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
              label={t().onboarding.dateOfBirth}
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
                label={t().onboarding.height(heightUnit)}
                inputMode="decimal"
                name="height"
                autoComplete="off"
                value={enteredHeight}
                onChange={(event) => {
                  setHeight(event.target.value);
                }}
              />
              <UnitToggle
                label={t().onboarding.heightUnit}
                options={[
                  { value: 'metric', label: t().onboarding.centimetres },
                  { value: 'imperial', label: t().onboarding.inches },
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
                label={t().onboarding.weight(weightUnit)}
                inputMode="decimal"
                name="weight"
                autoComplete="off"
                value={enteredWeight}
                onChange={(event) => {
                  setWeight(event.target.value);
                }}
              />
              <UnitToggle
                label={t().onboarding.weightUnit}
                options={[
                  { value: 'metric', label: t().onboarding.kilograms },
                  { value: 'imperial', label: t().onboarding.pounds },
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
              label={t().onboarding.whereFrom}
              hint={t().onboarding.countryHint}
              onChange={setCountry}
            />
          )}

          {step === 'guidance' && (
            <fieldset className="flex flex-col gap-3" disabled={busy}>
              <legend className="sr-only">{t().onboarding.workoutRecommendations}</legend>
              {[
                {
                  value: false,
                  label: t().onboarding.ownTraining,
                  detail: t().onboarding.ownTrainingDetail,
                },
                {
                  value: true,
                  label: t().onboarding.suggest,
                  detail: t().onboarding.suggestDetail,
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

        {loading && (
          <p role="status" className="mb-4 text-sm text-secondary">
            {t().onboarding.settingUp}
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
              {t().common.back}
            </Button>
          )}
          <Button className="flex-1" type="submit" disabled={busy || loading}>
            {busy
              ? t().common.saving
              : nextStep(step) === null
                ? t().onboarding.finish
                : t().common.continue}
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
              {t().common.skip}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

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
      <p className="text-sm text-muted">{t().onboarding.preparing}</p>
    </main>
  );
}
