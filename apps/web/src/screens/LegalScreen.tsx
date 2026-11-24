import {
  CONTACT_EMAIL,
  LEGAL_UPDATED,
  currentLocale,
  formatDate,
  loadLegalText,
  t,
  type LegalBlock,
  type LegalSection,
  type LegalText,
} from '@g7m/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../auth/auth-store.js';
import { LanguageSelect } from '../components/LanguagePicker.js';
import { ScreenFallback } from '../components/ScreenFallback.js';
import { switchLanguage } from '../lib/language.js';
import { useReducedMotion } from '../lib/use-reduced-motion.js';
import {
  DELETE_ACCOUNT_SETTINGS_HREF,
  PUBLIC_PAGE_HREF,
  type PublicPage,
} from '../lib/public-pages.js';

/**
 * The privacy policy, or how to delete an account: the two pages the app
 * stores link to. ADR-0189.
 *
 * Shown above the auth gate, so it renders the same signed in, signed out,
 * offline, or before the session has been read. It has no router to lean on,
 * which is why its links are plain `href`s.
 *
 * A document rather than an app screen: one readable column, no tab bar, and
 * the words loaded on demand — they are long, and almost nobody opens them.
 */
export function LegalScreen({ page }: { readonly page: PublicPage }) {
  const locale = currentLocale();
  const [text, setText] = useState<LegalText | null>(null);

  useEffect(() => {
    let live = true;
    loadLegalText(locale).then(
      (loaded) => {
        if (live) setText(loaded);
      },
      (error: unknown) => {
        console.error('Could not load the legal text.', error);
      },
    );
    return () => {
      live = false;
    };
  }, [locale]);

  // A new page starts at its top, as the routed screens do (`TabLayout`).
  useEffect(() => {
    globalThis.scrollTo(0, 0);
  }, [page]);

  const title =
    text === null ? null : page === 'privacy' ? text.privacy.title : text.deletion.title;
  // The tab a store reviewer has open says what it is.
  useEffect(() => {
    if (title === null) return;
    const before = document.title;
    document.title = `${title} · g7m`;
    return () => {
      document.title = before;
    };
  }, [title]);

  if (text === null || title === null) return <ScreenFallback />;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-4 pt-safe-top pb-safe-bottom">
      <Header text={text} title={title} />
      {page === 'privacy' ? <Privacy text={text} /> : <Deletion text={text} />}
      <Footer text={text} page={page} />
    </main>
  );
}

function Header({ text, title }: { readonly text: LegalText; readonly title: string }) {
  const signedIn = useAuthStore((s) => s.status === 'signed-in');
  const [year, month, day] = LEGAL_UPDATED.split('-').map(Number);
  // Built from its parts, not parsed: `new Date('2026-11-24')` is midnight in
  // UTC, which is the 23rd anywhere west of Greenwich.
  const updated = formatDate(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1), {
    dateStyle: 'long',
  });

  return (
    <header className="flex flex-col gap-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        {/* Signed in, this was opened from Settings, so that is the way back.
            Signed out, the way on is the app itself. */}
        <a href={signedIn ? '#/settings' : '#/'} className={HEADER_LINK}>
          <span aria-hidden>←</span>
          {signedIn ? text.chrome.back : text.chrome.openApp}
        </a>
        {/* Signed in, the account's language decides, and the auth gate would
            switch straight back to it. Signed out, this is the only control
            somebody who reads no English has. */}
        {!signedIn && (
          <LanguageSelect
            compact
            label={t().auth.language}
            value={currentLocale()}
            onChange={(locale) => {
              void switchLanguage(locale);
            }}
          />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-muted">{text.chrome.updated(updated)}</p>
      </div>
      {text.chrome.translationNote !== null && (
        <p className="rounded-control bg-surface px-3 py-2 text-sm text-secondary">
          {text.chrome.translationNote}
        </p>
      )}
    </header>
  );
}

function Privacy({ text }: { readonly text: LegalText }) {
  const { summary, sections } = text.privacy;
  return (
    <>
      <Card title={text.chrome.inShort} id="privacy-in-short">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-primary marker:text-muted">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>
      <Contents label={text.chrome.contents} sections={sections} prefix="privacy" />
      {sections.map((section) => (
        <Section key={section.id} section={section} prefix="privacy" />
      ))}
    </>
  );
}

function Deletion({ text }: { readonly text: LegalText }) {
  const { intro, inApp, byEmail, sections } = text.deletion;
  const words = t().settings;
  const steps = inApp.steps({
    settings: words.title,
    account: words.groups.account,
    open: words.deletion.open,
    word: words.deletion.word,
    yourData: words.data.title,
  });
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(byEmail.subject)}`;

  return (
    <>
      <p className={PARAGRAPH}>{intro}</p>
      <Card title={inApp.heading} id="deletion-in-app" step={1}>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-secondary marker:text-muted">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <a href={DELETE_ACCOUNT_SETTINGS_HREF} className={`${ACTION} ${PRIMARY} mt-4`}>
          {inApp.action}
        </a>
      </Card>
      <Card title={byEmail.heading} id="deletion-by-email" step={2}>
        <p className={PARAGRAPH}>{byEmail.body}</p>
        <a href={mailto} className={`${ACTION} ${SECONDARY} mt-4 break-all`}>
          {byEmail.action}
        </a>
      </Card>
      {sections.map((section) => (
        <Section key={section.id} section={section} prefix="deletion" />
      ))}
    </>
  );
}

function Footer({ text, page }: { readonly text: LegalText; readonly page: PublicPage }) {
  const other: PublicPage = page === 'privacy' ? 'delete-account' : 'privacy';
  return (
    <footer className="flex flex-col gap-3 border-t border-subtle py-6 text-sm text-secondary">
      <p>
        {text.chrome.contact}:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={INLINE_LINK}>
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>
        <a href={PUBLIC_PAGE_HREF[other]} className={INLINE_LINK}>
          {other === 'privacy' ? t().legal.privacy : t().legal.deletion}
        </a>
      </p>
    </footer>
  );
}

/**
 * The section list, folded: ten tap-sized rows would push the policy itself
 * below the first screen of a phone. Buttons that scroll rather than `#id`
 * links, because the fragment is already the route.
 */
function Contents({
  label,
  sections,
  prefix,
}: {
  readonly label: string;
  readonly sections: readonly LegalSection[];
  readonly prefix: string;
}) {
  const reduced = useReducedMotion();
  return (
    <details className="group rounded-sheet border border-subtle bg-surface">
      <summary className="flex min-h-tap cursor-pointer items-center justify-between gap-3 rounded-sheet px-4 text-base font-medium text-primary select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        {label}
        <span
          aria-hidden
          className="text-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
        >
          ▾
        </span>
      </summary>
      <nav aria-label={label} className="px-2 pb-2">
        <ol>
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className="flex min-h-tap w-full items-center rounded-control px-2 text-left text-sm text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => {
                  const target = document.getElementById(`${prefix}-${section.id}`);
                  target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
                  // Somebody navigating by keyboard lands where they asked to.
                  target?.focus({ preventScroll: true });
                }}
              >
                {section.heading}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}

function Section({ section, prefix }: { readonly section: LegalSection; readonly prefix: string }) {
  const id = `${prefix}-${section.id}`;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      tabIndex={-1}
      className="flex scroll-mt-4 flex-col gap-3 outline-none"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-primary">
        {section.heading}
      </h2>
      {section.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </section>
  );
}

function Block({ block }: { readonly block: LegalBlock }) {
  if (typeof block === 'string') return <p className={PARAGRAPH}>{block}</p>;
  if ('list' in block) {
    return (
      <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-secondary marker:text-muted">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="flex max-w-prose flex-col gap-3">
      {block.terms.map(({ term, detail }) => (
        <div key={term} className="rounded-card border border-subtle bg-surface p-3">
          <dt className="text-base font-medium text-primary">{term}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-secondary">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function Card({
  title,
  id,
  step,
  children,
}: {
  readonly title: string;
  readonly id: string;
  readonly step?: number;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-sheet border border-subtle bg-surface p-4">
      <h2 id={id} className="mb-3 flex items-center gap-3 text-lg font-semibold text-primary">
        {step !== undefined && (
          <span
            aria-hidden
            className="numeric flex size-8 shrink-0 items-center justify-center rounded-card bg-elevated text-sm text-secondary"
          >
            {step}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

const PARAGRAPH = 'max-w-prose text-base leading-relaxed text-secondary';

const INLINE_LINK =
  'text-accent underline underline-offset-2 break-all focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent rounded-control';

/** `HeaderLink`'s look, as a plain anchor: that one is a router `Link`, and there is no router here. */
const HEADER_LINK =
  'inline-flex min-h-tap shrink-0 items-center gap-1 rounded-control border border-subtle ' +
  'bg-elevated px-4 text-sm font-medium text-primary select-none active:bg-surface ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** `Button`'s shapes, as anchors: these go somewhere rather than do something. */
const ACTION =
  'inline-flex min-h-tap w-full items-center justify-center gap-2 rounded-control px-4 ' +
  'text-center text-base font-medium select-none transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const PRIMARY = 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-pressed';
const SECONDARY =
  'border border-subtle bg-elevated text-primary hover:border-strong active:bg-surface';
