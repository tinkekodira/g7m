/**
 * @g7m/core — pure domain logic.
 *
 * Rules for this package (Brief §4.1), enforced by an ESLint rule in
 * eslint.config.js rather than by good intentions:
 *   · No React, no Capacitor, no Tauri, no three.js.
 *   · No database, no network, no filesystem.
 *   · Pure functions wherever the problem allows it.
 *
 * If it cannot run under `node --eval`, it does not belong here.
 */

export * from './units.js';
export * from './one-rep-max.js';
export * from './order-key.js';
export * from './exercise-search.js';
export * from './load.js';
export * from './rest.js';
export * from './prefill.js';
export * from './week.js';
export * from './explain.js';
export * from './progress.js';
export * from './periods.js';
export * from './calendar.js';
export * from './estimate.js';
export * from './records.js';
export * from './body.js';
export * from './goals.js';
export * from './programming.js';
export * from './generate.js';
export * from './lift-progress.js';
export * from './review.js';
export * from './greeting.js';
