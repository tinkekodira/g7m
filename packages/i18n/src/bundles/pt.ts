/** Everything the app needs to speak this language: its words and its catalogue. ADR-0181. */
import type { LocaleBundle } from '../runtime.js';
import { catalogue } from '../catalogue/pt/index.js';
import { pt } from '../messages/pt/index.js';

export const bundle: LocaleBundle = { messages: pt, catalogue };
