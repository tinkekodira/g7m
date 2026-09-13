/**
 * Comparing timestamps in SQL by when they are, not by how they are spelt.
 *
 * Every timestamp is TEXT on the device, and a device holds two spellings of
 * the same instant. What the app writes is `toISOString()` —
 * `2026-09-13T10:00:00.123Z`. What PowerSync sends down was, under the sync
 * rules' legacy edition, `2026-09-13 10:00:00.123Z`: a space instead of the
 * `T`, and no fraction at all on a whole second. A row that synced back
 * carried the second spelling, a row not yet uploaded the first.
 *
 * Compared as text, a space sorts before `T`, so a synced workout at 23:30 was
 * "earlier" than a window starting at 22:00 the same day — outside the week it
 * belonged to — and `MAX(started_at)` could pick the wrong one of two workouts
 * on one day. The sync rules now ask for the device's own spelling
 * (ADR-0068), but phones hold the old one until they re-sync, and a query that
 * is only right while every row is spelt one way is a query waiting to be
 * wrong again.
 *
 * So: compare instants. `julianday()` reads both spellings — the separator,
 * the `Z`, any number of fractional digits — into one number, which compares
 * and sorts as time does. Only ordering and windows need this; reading a
 * value out goes through `readDate`, and `new Date()` reads both as well.
 */

/** A timestamp column or expression, as a number that compares as time does. */
export function instant(expression: string): string {
  return `julianday(${expression})`;
}

/** A bound timestamp parameter, on the same scale. */
export const INSTANT_PARAMETER = 'julianday(?)';

/**
 * An instant back as the app's own ISO 8601 text, for an aggregate that has to
 * return a timestamp: `MAX(started_at)` compares text, so it is written
 * `isoText(\`MAX(${instant('started_at')})\`)` instead.
 */
export function isoText(expression: string): string {
  return `strftime('%Y-%m-%dT%H:%M:%fZ', ${expression})`;
}
