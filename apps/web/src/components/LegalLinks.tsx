import { t } from '@g7m/i18n';
import { cx } from '@g7m/ui';
import { PUBLIC_PAGE_HREF } from '../lib/public-pages.js';

/**
 * The privacy policy and the account-deletion page, as two small links.
 *
 * Plain anchors rather than router links: the sign-in screen has no router
 * (ADR-0034), and the pages are matched above the auth gate from the hash
 * itself, which a followed link changes and a router `navigate` does not.
 * See `lib/public-pages.ts`.
 */
export function LegalLinks({ className }: { readonly className?: string }) {
  return (
    // Not a <nav>: two links in a footer are not a landmark, and the tab bar
    // is the one navigation region on a screen that tests and screen readers
    // look for.
    <div className={cx('flex flex-wrap gap-x-5', className)}>
      <a href={PUBLIC_PAGE_HREF.privacy} className={LINK}>
        {t().legal.privacy}
      </a>
      <a href={PUBLIC_PAGE_HREF['delete-account']} className={LINK}>
        {t().legal.deletion}
      </a>
    </div>
  );
}

const LINK =
  'inline-flex min-h-tap items-center text-sm text-secondary underline underline-offset-2 ' +
  'hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-accent rounded-control';
