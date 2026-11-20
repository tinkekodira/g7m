import { useEffect, useState, type FormEvent } from 'react';
import { MAX_GYM_NAME_LENGTH, type Gym } from '@g7m/db';
import { Button, Switch, TextField } from '@g7m/ui';
import { useWrite } from '../lib/db/use-catalogue.js';
import { useGyms } from '../lib/db/use-gyms.js';
import { PencilIcon, PinIcon, TrashIcon } from './icons.js';

/**
 * "I train at more than one gym", and the gyms. ADR-0178.
 *
 * Switching it on the first time asks for one name, the gym trained at so
 * far, and every workout already logged is saved as having been there. That
 * is what keeps the history somebody already has counting at the gym it came
 * from. A second gym is added below, and from then on a workout asks which.
 */
export function GymSettings() {
  const gyms = useGyms();
  const { write, busy, error } = useWrite();
  const [pending, setPending] = useState<boolean | null>(null);
  const [naming, setNaming] = useState(false);
  const saved = gyms.data?.enabled ?? false;
  const shown = pending ?? (saved || naming);

  useEffect(() => {
    if (pending !== null && pending === saved) setPending(null);
  }, [pending, saved]);

  function turnOn(): void {
    if ((gyms.data?.gyms ?? []).length === 0) {
      // Nothing is switched on until the first gym has a name: a switch that
      // is on with no gym behind it would tag nothing and ask nothing.
      setNaming(true);
      return;
    }
    setPending(true);
    void write(async (r) => {
      const usual = await r.gyms.lastUsed();
      if (usual !== null) await r.gyms.tagUntaggedSessions(usual);
      return r.profile.update({ multipleGyms: true });
    }).then((updated) => {
      if (updated === null) setPending(null);
    });
  }

  function turnOff(): void {
    setNaming(false);
    if (!saved) return;
    setPending(false);
    void write((r) => r.profile.update({ multipleGyms: false })).then((updated) => {
      if (updated === null) setPending(null);
    });
  }

  return (
    <>
      <Switch
        label="I train at more than one gym"
        checked={shown}
        disabled={busy || gyms.data === null}
        description={
          shown
            ? 'Each workout is saved with the gym it was at.'
            : 'Off: workouts are not tied to a gym.'
        }
        onChange={(next) => {
          if (next) turnOn();
          else turnOff();
        }}
      />
      {naming && !saved && (
        <NameForm
          label="The gym you’ve trained at so far"
          hint="Every workout you’ve already logged is saved as this gym."
          action="Save gym"
          busy={busy}
          onSave={async (name) => {
            const done = await write(async (r) => {
              const gym = await r.gyms.create(name);
              await r.gyms.tagUntaggedSessions(gym.id);
              return r.profile.update({ multipleGyms: true });
            });
            if (done !== null) setNaming(false);
            return done !== null;
          }}
        />
      )}
      {saved && gyms.data !== null && (
        <div className="mt-4 border-t border-subtle pt-4">
          <ul className="flex flex-col gap-2" aria-label="Your gyms">
            {gyms.data.gyms.map((gym) => (
              <GymRow key={gym.id} gym={gym} busy={busy} write={write} />
            ))}
          </ul>
          <NameForm
            label="Add a gym"
            hint={
              gyms.data.gyms.length < 2
                ? 'Add the other gym you go to. Starting a workout then asks which one.'
                : undefined
            }
            action="Add gym"
            busy={busy}
            clearOnSave
            onSave={async (name) => (await write((r) => r.gyms.create(name))) !== null}
          />
        </div>
      )}
      {(error ?? gyms.error) !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error ?? gyms.error}
        </p>
      )}
    </>
  );
}

function GymRow({
  gym,
  busy,
  write,
}: {
  readonly gym: Gym;
  readonly busy: boolean;
  readonly write: ReturnType<typeof useWrite>['write'];
}) {
  const [renaming, setRenaming] = useState(false);

  if (renaming) {
    return (
      <li>
        <NameForm
          label={`Rename ${gym.name}`}
          initial={gym.name}
          action="Save"
          busy={busy}
          onCancel={() => {
            setRenaming(false);
          }}
          onSave={async (name) => {
            const done = await write(async (r) => {
              await r.gyms.rename(gym.id, name);
              return true;
            });
            if (done !== null) setRenaming(false);
            return done !== null;
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-card border border-subtle bg-elevated py-1 pr-1 pl-3">
      <PinIcon className="size-4 shrink-0 text-muted" />
      <span className="min-w-0 flex-1 text-base font-medium break-words text-primary">
        {gym.name}
      </span>
      <button
        type="button"
        aria-label={`Rename ${gym.name}`}
        disabled={busy}
        onClick={() => {
          setRenaming(true);
        }}
        className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-control text-secondary focus-visible:outline-2 focus-visible:outline-accent active:bg-surface disabled:opacity-50"
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Remove ${gym.name}`}
        disabled={busy}
        onClick={() => {
          if (
            !globalThis.confirm(
              `Remove ${gym.name}? Workouts you did there keep its name, and it stops being offered when you start one.`,
            )
          )
            return;
          void write(async (r) => {
            await r.gyms.archive(gym.id);
            return true;
          });
        }}
        className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-control text-destructive focus-visible:outline-2 focus-visible:outline-accent active:bg-surface disabled:opacity-50"
      >
        <TrashIcon className="size-4" />
      </button>
    </li>
  );
}

function NameForm({
  label,
  hint,
  action,
  initial = '',
  busy,
  clearOnSave = false,
  onSave,
  onCancel,
}: {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly action: string;
  readonly initial?: string;
  readonly busy: boolean;
  readonly clearOnSave?: boolean;
  /** Resolves true when saved. */
  readonly onSave: (name: string) => Promise<boolean>;
  readonly onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const trimmed = draft.trim();

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if ([...trimmed].length > MAX_GYM_NAME_LENGTH) {
      setProblem(`Keep the name to ${String(MAX_GYM_NAME_LENGTH)} characters.`);
      return;
    }
    if ((await onSave(trimmed)) && clearOnSave) setDraft('');
  }

  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <TextField
        label={label}
        hint={hint}
        error={problem ?? undefined}
        value={draft}
        autoComplete="off"
        enterKeyHint="done"
        maxLength={MAX_GYM_NAME_LENGTH}
        onChange={(event) => {
          setDraft(event.target.value);
          setProblem(null);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="secondary" disabled={busy || trimmed === ''}>
          {action}
        </Button>
        {onCancel !== undefined && (
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
