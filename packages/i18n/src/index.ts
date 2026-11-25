export {
  DEFAULT_LOCALE,
  INTL_TAGS,
  LOCALES,
  LOCALE_NAMES,
  isLocale,
  matchLocale,
  type Locale,
} from './locales.js';
export {
  activateLocale,
  currentLocale,
  equipmentName,
  exerciseText,
  formatDate,
  formatList,
  formatNumber,
  formatTime,
  intlLocale,
  live,
  muscleGroupName,
  muscleName,
  onLocaleChange,
  t,
  setBundleForTesting,
  type LocaleBundle,
} from './runtime.js';
export type { CatalogueText, ExerciseText } from './catalogue/types.js';
export type { Messages } from './messages/en/index.js';
export {
  CONTACT_EMAIL,
  CONTROLLER_NAME,
  LEGAL_UPDATED,
  loadLegalText,
  type DeletionLabels,
  type LegalBlock,
  type LegalSection,
  type LegalTerm,
  type LegalText,
} from './legal/index.js';
