/** Everything the app needs to speak this language: its words and its catalogue. ADR-0181. */
import type { LocaleBundle } from '../runtime.js';
import { catalogue } from '../catalogue/it/index.js';
import { it } from '../messages/it/index.js';

export const bundle: LocaleBundle = { messages: it, catalogue };
