/** Everything the app needs to speak this language: its words and its catalogue. ADR-0181. */
import type { LocaleBundle } from '../runtime.js';
import { catalogue } from '../catalogue/es/index.js';
import { es } from '../messages/es/index.js';

export const bundle: LocaleBundle = { messages: es, catalogue };
