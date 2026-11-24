/**
 * The facts in the privacy policy that only the app's owner knows.
 *
 * Every page and every language reads them from here, so filling one in fills
 * it in everywhere. The square brackets are deliberate: a placeholder nobody
 * replaced is obvious on the published page rather than plausible.
 */

/** Who is responsible for the data: the controller, in GDPR's words. */
export const CONTROLLER_NAME = '[YOUR NAME]';

/** A postal address for the controller. GDPR asks for contact details; this is the usual one. */
export const CONTROLLER_ADDRESS = '[YOUR ADDRESS]';

/** Where privacy questions and deletion requests go. */
export const CONTACT_EMAIL = '[CONTACT EMAIL]';

/**
 * How long Supabase keeps backups of the database on this project's plan, in
 * words ("7 days"). It is the one place a deleted account can linger.
 */
export const BACKUP_RETENTION = '[BACKUP RETENTION]';

/** When the policy last changed, as an ISO date. Shown in the reader's language. */
export const LEGAL_UPDATED = '2026-11-24';
