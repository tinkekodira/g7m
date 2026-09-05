import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { colorTokens, heatRamp, type ColorTokenName } from './tokens.js';
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
