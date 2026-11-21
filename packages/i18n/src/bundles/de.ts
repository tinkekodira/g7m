/** Everything the app needs to speak this language: its words and its catalogue. ADR-0181. */
import type { LocaleBundle } from '../runtime.js';
import { catalogue } from '../catalogue/de/index.js';
import { de } from '../messages/de/index.js';

export const bundle: LocaleBundle = { messages: de, catalogue };
