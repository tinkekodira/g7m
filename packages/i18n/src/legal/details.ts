/**
 * The facts in the privacy policy that only the app's owner knows.
 *
 * Every page and every language reads them from here, so filling one in fills
 * it in everywhere. The square brackets are deliberate: a placeholder nobody
 * replaced is obvious on the published page rather than plausible.
 *
 * No postal address, on purpose: the owner is a private person, and GDPR asks
 * for "contact details", which the email is (ADR-0190).
 *
 * Backups: the project is on Supabase's free plan, which takes no automatic
 * backups, so the policy says none are kept. Moving to a paid plan (7 days of
 * daily backups on Pro) or enabling point-in-time recovery makes that untrue —
 * rewrite the `retention` and `kept` sentences about backups in every language.
 */

/** Who is responsible for the data: the controller, in GDPR's words. */
export const CONTROLLER_NAME = 'Tin Milanović';

/** Where privacy questions and deletion requests go. */
export const CONTACT_EMAIL = 'milanovic.tin@gmail.com';

/** When the policy last changed, as an ISO date. Shown in the reader's language. */
export const LEGAL_UPDATED = '2026-11-25';
