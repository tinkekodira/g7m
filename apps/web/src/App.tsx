import { useState, type ReactNode } from 'react';
import { Button, colorTokens, heatRamp } from '@g7m/ui';
import { estimateOneRepMax, toDisplayWeight, type UnitSystem } from '@g7m/core';
import { detectPlatform, platformLabel } from './platform.js';

/**
 * Phase 0 smoke screen.
 *
 * Its entire job is to prove that one bundle renders identically in a browser,
 * in an iOS WKWebView, in an Android WebView, in WKWebView on macOS and in
 * WebView2 on Windows — with the design tokens applied, the shared primitives
 * resolving across the workspace, and the pure domain functions running.
 *
 * It gets deleted in Phase 3, when there is a real screen to replace it.
 */

const HEAT_LABELS = ['0 sets', '1–4', '5–9', '10–14', '15+'] as const;

const SWATCHES = [
  'bg-base',
  'bg-surface',
  'bg-elevated',
  'bg-input',
  'accent',
  'success',
  'warning',
  'danger',
] as const;

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="numeric text-base text-primary">{value}</span>
    </div>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function App() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const platform = detectPlatform();

  // A set from the logger's hot path, run through the real core functions so
  // this screen proves cross-package imports rather than mocking them.
  const workingSetKg = 82.5;
  const reps = 8;
  const displayed = toDisplayWeight(workingSetKg, unitSystem);
  const oneRepMax = estimateOneRepMax(workingSetKg, reps);
  const oneRepMaxDisplayed =
    oneRepMax === null ? null : toDisplayWeight(oneRepMax.valueKg, unitSystem);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">g7m</h1>
        <p className="mt-1 max-w-prose text-sm text-secondary">
          Phase 0 foundation. If this screen looks the same on your phone and on your desktop, the
          shell layer works.
        </p>
      </header>

      <Section title="Where this is running">
        <Row label="Shell" value={platform.shell} />
        <Row label="Platform" value={platformLabel(platform.platform)} />
        <Row
          label="Pointer"
          value={platform.hasFinePointer ? 'Fine — hover available' : 'Coarse — tap only'}
        />
        <Row label="Reduced motion" value={platform.prefersReducedMotion ? 'On' : 'Off'} />
      </Section>

      <Section title="Domain logic">
        <Row
          label="Working set"
          value={`${String(displayed.value)} ${displayed.unit} × ${String(reps)}`}
        />
        <Row
          label={`Estimated 1RM (${oneRepMax?.formula ?? 'none'})`}
          value={
            oneRepMaxDisplayed === null
              ? 'Not estimated'
              : `${String(oneRepMaxDisplayed.value)} ${oneRepMaxDisplayed.unit}`
          }
        />
        <div className="mt-3 flex gap-2">
          <Button
            variant={unitSystem === 'metric' ? 'primary' : 'secondary'}
            onClick={() => {
              setUnitSystem('metric');
            }}
          >
            Kilograms
          </Button>
          <Button
            variant={unitSystem === 'imperial' ? 'primary' : 'secondary'}
            onClick={() => {
              setUnitSystem('imperial');
            }}
          >
            Pounds
          </Button>
        </div>
      </Section>

      <Section title="Controls">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Finish workout</Button>
          <Button variant="secondary">Add a set</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete session</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Volume heat ramp">
        <div className="flex gap-1">
          {heatRamp.map((hex, index) => (
            <div key={`${hex}-${String(index)}`} className="flex-1">
              <div
                className="h-12 rounded-control border border-subtle"
                style={{ backgroundColor: hex }}
              />
              <p className="numeric mt-1 text-center text-xs text-muted">{HEAT_LABELS[index]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-prose text-sm text-secondary">
          Weekly working sets per muscle. Colour never carries the meaning alone — the scale is
          always labelled.
        </p>
      </Section>

      <Section title="Surfaces">
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-control bg-elevated px-2 py-1"
            >
              <span
                className="size-5 rounded-sm border border-subtle"
                style={{ backgroundColor: colorTokens[name] }}
              />
              <code className="text-xs text-secondary">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <footer className="py-6 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}
