import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  colorTokens,
  heatRamp,
  lightColorTokens,
  type ColorTokenName,
  type LightTokenName,
} from './tokens.js';
import { WCAG, contrastRatio } from './contrast.js';

const cssPath = fileURLToPath(new URL('./tokens.css', import.meta.url));
const css = readFileSync(cssPath, 'utf8');

/** Pull the `:root` declarations out of tokens.css. */
function parseRootTokens(source: string): Map<string, string> {
  const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(source);
  if (rootBlock?.[1] === undefined) throw new Error('No :root block found in tokens.css');
  const declarations = new Map<string, string>();
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(rootBlock[1])) !== null) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) declarations.set(name, value.trim());
  }
  return declarations;
}

const cssTokens = parseRootTokens(css);

describe('tokens.css / tokens.ts parity', () => {
  it('defines every TypeScript colour token in CSS with the same value', () => {
    for (const [name, value] of Object.entries(colorTokens)) {
      expect(cssTokens.get(name), `--${name} missing from tokens.css`).toBe(value);
    }
  });

  it('defines no colour in CSS that TypeScript does not know about', () => {
    const known = new Set<string>(Object.keys(colorTokens));
    const cssColours = [...cssTokens.entries()]
      .filter(([, value]) => value.startsWith('#'))
      .map(([name]) => name);
    for (const name of cssColours) {
      expect(known.has(name), `--${name} exists in tokens.css but not tokens.ts`).toBe(true);
    }
  });
});

describe('contrast — Brief §10 requires this to be verified, not assumed', () => {
  const surfaces: ColorTokenName[] = ['bg-base', 'bg-surface', 'bg-elevated', 'bg-input'];

  it('--text-primary clears AAA body text on every surface', () => {
    for (const surface of surfaces) {
      const ratio = contrastRatio(colorTokens['text-primary'], colorTokens[surface]);
      expect(ratio, `text-primary on ${surface} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        WCAG.AAA_BODY,
      );
    }
  });

  it('--text-secondary clears AA body text on every surface (the brief’s hard requirement)', () => {
    for (const surface of surfaces) {
      const ratio = contrastRatio(colorTokens['text-secondary'], colorTokens[surface]);
      expect(ratio, `text-secondary on ${surface} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        WCAG.AA_BODY,
      );
    }
  });

  it('--text-muted clears AA body text on every surface', () => {
    for (const surface of surfaces) {
      const ratio = contrastRatio(colorTokens['text-muted'], colorTokens[surface]);
      expect(ratio, `text-muted on ${surface} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        WCAG.AA_BODY,
      );
    }
  });

  /**
   * The three text tokens have to stay visibly distinct or the hierarchy
   * collapses into one grey. Raising --text-muted for contrast is only safe
   * while it stays clearly dimmer than --text-secondary.
   */
  it('keeps the three text tiers distinct', () => {
    const surface = colorTokens['bg-surface'];
    const primary = contrastRatio(colorTokens['text-primary'], surface);
    const secondary = contrastRatio(colorTokens['text-secondary'], surface);
    const muted = contrastRatio(colorTokens['text-muted'], surface);
    expect(primary).toBeGreaterThan(secondary);
    expect(secondary).toBeGreaterThan(muted);
    expect(secondary - muted).toBeGreaterThan(2);
  });

  it('--accent carries enough contrast on the base background for an active control', () => {
    expect(contrastRatio(colorTokens.accent, colorTokens['bg-base'])).toBeGreaterThanOrEqual(
      WCAG.AA_LARGE,
    );
  });

  /**
   * The reason --text-on-accent exists. Light text on the accent orange is
   * 2.96:1 and fails even AA large, so the filled Button variants use the dark
   * ink instead. Both numbers are pinned so neither can regress unnoticed.
   */
  it('--text-on-accent clears AA body on a filled accent button', () => {
    expect(contrastRatio(colorTokens['text-on-accent'], colorTokens.accent)).toBeGreaterThanOrEqual(
      WCAG.AA_BODY,
    );
  });

  it('records why --text-primary is not used on accent fills', () => {
    expect(contrastRatio(colorTokens['text-primary'], colorTokens.accent)).toBeLessThan(
      WCAG.AA_LARGE,
    );
  });

  it('--text-primary clears AA body on a filled danger button', () => {
    expect(contrastRatio(colorTokens['text-primary'], colorTokens.danger)).toBeGreaterThanOrEqual(
      WCAG.AA_BODY,
    );
  });

  /**
   * The two filled variants take opposite foregrounds, which reads as an
   * inconsistency until you check the numbers: --accent is a light orange and
   * --danger is a dark red, so each needs the ink the other cannot use. Pinned
   * so nobody "fixes" it into consistency later.
   */
  it('confirms the two filled variants genuinely need opposite foregrounds', () => {
    expect(contrastRatio(colorTokens['text-on-accent'], colorTokens.accent)).toBeGreaterThan(
      contrastRatio(colorTokens['text-primary'], colorTokens.accent),
    );
    expect(contrastRatio(colorTokens['text-primary'], colorTokens.danger)).toBeGreaterThan(
      contrastRatio(colorTokens['text-on-accent'], colorTokens.danger),
    );
  });
});

describe('heat ramp', () => {
  it('increases monotonically in luminance so the scale reads as a ramp', () => {
    const luminances = heatRamp.map((hex) => contrastRatio(hex, '#000000'));
    for (let i = 1; i < luminances.length; i += 1) {
      const previous = luminances[i - 1];
      const current = luminances[i];
      expect(previous).toBeDefined();
      expect(current).toBeDefined();
      expect(current ?? 0).toBeGreaterThan(previous ?? 0);
    }
  });

  it('has one colour per bucket: 0, <5, 5-9, 10-14, 15+', () => {
    expect(heatRamp).toHaveLength(5);
  });
});

/** Pull the light theme's declarations out of tokens.css. */
function parseLightTokens(source: string): Map<string, string> {
  const block = /:root\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/.exec(source);
  if (block?.[1] === undefined) throw new Error('No light theme block found in tokens.css');
  const declarations = new Map<string, string>();
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block[1])) !== null) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) declarations.set(name, value.trim());
  }
  return declarations;
}

const lightCss = parseLightTokens(css);

describe('the light theme', () => {
  it('matches tokens.ts, both ways', () => {
    for (const [name, value] of Object.entries(lightColorTokens)) {
      expect(lightCss.get(name), `--${name} missing from the light block`).toBe(value);
    }
    for (const [name, value] of lightCss) {
      if (!value.startsWith('#')) continue;
      expect(name in lightColorTokens, `--${name} is in the light block but not tokens.ts`).toBe(
        true,
      );
    }
  });

  /** Anything the light block leaves out would silently keep its dark value. */
  it('redefines every surface, border and text token, not just some', () => {
    for (const name of Object.keys(colorTokens)) {
      if (name.startsWith('muscle-')) continue;
      expect(name in lightColorTokens, `--${name} is not redefined for light`).toBe(true);
    }
  });

  const light = lightColorTokens;
  const surfaces: LightTokenName[] = ['bg-base', 'bg-surface', 'bg-elevated', 'bg-input'];

  it('holds the same text contrast rules as the dark theme', () => {
    for (const surface of surfaces) {
      expect(contrastRatio(light['text-primary'], light[surface]), surface).toBeGreaterThanOrEqual(
        WCAG.AAA_BODY,
      );
      expect(
        contrastRatio(light['text-secondary'], light[surface]),
        surface,
      ).toBeGreaterThanOrEqual(WCAG.AA_BODY);
      expect(contrastRatio(light['text-muted'], light[surface]), surface).toBeGreaterThanOrEqual(
        WCAG.AA_BODY,
      );
    }
    const surface = light['bg-surface'];
    expect(
      contrastRatio(light['text-secondary'], surface) - contrastRatio(light['text-muted'], surface),
    ).toBeGreaterThan(2);
  });

  /**
   * Stricter than the dark theme's rule, deliberately: the accent is used as
   * small text — links, the lit tab — and on white the dark theme's orange
   * managed barely 3:1.
   */
  it('reads the accent as text on every surface, and on its own tint', () => {
    for (const surface of [...surfaces, 'accent-subtle'] as const) {
      expect(contrastRatio(light.accent, light[surface]), surface).toBeGreaterThanOrEqual(
        WCAG.AA_BODY,
      );
    }
    expect(contrastRatio(colorTokens.accent, light['bg-surface'])).toBeLessThan(WCAG.AA_BODY);
  });

  it('gives every filled button readable ink, in every state', () => {
    for (const fill of ['accent', 'accent-hover', 'accent-pressed'] as const) {
      expect(contrastRatio(light['text-on-accent'], light[fill]), fill).toBeGreaterThanOrEqual(
        WCAG.AA_BODY,
      );
    }
    expect(contrastRatio(light['text-on-danger'], light.danger)).toBeGreaterThanOrEqual(
      WCAG.AA_BODY,
    );
  });
});

describe('the danger button, in either theme', () => {
  /** Its own token because the two themes need opposite ink on red. */
  it('has readable ink on the danger fill', () => {
    expect(contrastRatio(colorTokens['text-on-danger'], colorTokens.danger)).toBeGreaterThanOrEqual(
      WCAG.AA_BODY,
    );
    expect(contrastRatio(lightColorTokens['text-primary'], lightColorTokens.danger)).toBeLessThan(
      WCAG.AA_BODY,
    );
  });
});
