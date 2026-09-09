import { describe, expect, it } from 'vitest';
import { ENTRY_BUDGET_BYTES, describeOverBudget, entryScript } from './budget.js';

describe('entryScript', () => {
  it('finds the module entry Vite emits', () => {
    const html =
      '<!doctype html><html><head>' +
      '<script type="module" crossorigin src="./assets/index-Dt6g9Pys.js"></script>' +
      '</head><body></body></html>';
    expect(entryScript(html)).toBe('assets/index-Dt6g9Pys.js');
  });

  it('does not mind which order the attributes come in', () => {
    const html = '<script crossorigin src="/assets/index-abc.js" type="module"></script>';
    expect(entryScript(html)).toBe('assets/index-abc.js');
  });

  /**
   * Preload hints and the legacy nomodule fallback are both `<script>` tags
   * pointing at JavaScript, and neither is the entry.
   */
  it('ignores scripts that are not the module entry', () => {
    const html =
      '<script nomodule src="./assets/polyfills-legacy.js"></script>' +
      '<script type="module" src="./assets/index-real.js"></script>';
    expect(entryScript(html)).toBe('assets/index-real.js');
  });

  it('answers null rather than guessing when there is no entry', () => {
    expect(entryScript('<html><body>nothing here</body></html>')).toBeNull();
    expect(entryScript('<script type="module">inline</script>')).toBeNull();
  });
});

describe('describeOverBudget', () => {
  it('says nothing while the entry fits', () => {
    expect(describeOverBudget('assets/index.js', 820_000)).toBeNull();
    expect(describeOverBudget('assets/index.js', ENTRY_BUDGET_BYTES)).toBeNull();
  });

  /**
   * The regression this exists for: `three` reached the entry through a module
   * that only needed it on the Learn screen, and 915 KB became 1.5 MB with
   * nothing to show for it but a Vite warning that prints on every build.
   */
  it('names the size, the limit and the usual cause when it does not', () => {
    const message = describeOverBudget('assets/index.js', 1_542_000);
    expect(message).toContain('1506 KB');
    expect(message).toContain('977 KB');
    expect(message).toContain('dynamic import');
  });

  it('takes a limit, so the budget can be tested without moving it', () => {
    expect(describeOverBudget('a.js', 101, 100)).not.toBeNull();
    expect(describeOverBudget('a.js', 100, 100)).toBeNull();
  });
});
