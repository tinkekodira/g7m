/** Everything the app needs to speak this language: its words and its catalogue. ADR-0181. */
import type { LocaleBundle } from '../runtime.js';
import { catalogue } from '../catalogue/fr/index.js';
import { fr } from '../messages/fr/index.js';

export const bundle: LocaleBundle = { messages: fr, catalogue };
