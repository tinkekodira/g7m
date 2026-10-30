import { expect, type Locator } from '@playwright/test';

/** Compare a rendered colour with its semantic token in the active theme. */
export async function expectToken(element: Locator, property: string, token: string) {
  await expect
    .poll(() =>
      element.evaluate(
        (node, { property, token }) => {
          const probe = document.createElement('span');
          probe.style.color = `var(--${token})`;
          node.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return getComputedStyle(node).getPropertyValue(property) === expected;
        },
        { property, token },
      ),
    )
    .toBe(true);
}
