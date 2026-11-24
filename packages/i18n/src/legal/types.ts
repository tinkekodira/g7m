/**
 * The shape of the privacy policy and the account-deletion page, in every
 * language. English (`en.ts`) is the original; each translation is typed
 * against this, so one that misses a section does not compile.
 *
 * Kept out of `Messages` on purpose. `Messages` in English is part of the
 * entry chunk, downloaded before the first paint by everybody, and these are
 * pages of prose that almost nobody opens. Each language's text is a chunk of
 * its own, fetched by the legal screen (ADR-0189).
 */

/** A paragraph, a bulleted list, or a list of terms with what each means. */
export type LegalBlock =
  string | { readonly list: readonly string[] } | { readonly terms: readonly LegalTerm[] };

export interface LegalTerm {
  readonly term: string;
  readonly detail: string;
}

export interface LegalSection {
  /** Stable across languages; the tests compare them. */
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
}

/** The app's own words for the controls the deletion steps name, read from `Messages`. */
export interface DeletionLabels {
  readonly settings: string;
  readonly account: string;
  readonly open: string;
  readonly word: string;
  readonly yourData: string;
}

export interface LegalText {
  readonly chrome: {
    readonly back: string;
    readonly openApp: string;
    readonly updated: (date: string) => string;
    readonly contents: string;
    readonly inShort: string;
    readonly contact: string;
    /** Said above a translation, never above the English. */
    readonly translationNote: string | null;
  };
  readonly privacy: {
    readonly title: string;
    readonly summary: readonly string[];
    readonly sections: readonly LegalSection[];
  };
  readonly deletion: {
    readonly title: string;
    readonly intro: string;
    readonly inApp: {
      readonly heading: string;
      readonly steps: (labels: DeletionLabels) => readonly string[];
      readonly action: string;
    };
    readonly byEmail: {
      readonly heading: string;
      readonly body: string;
      readonly action: string;
      readonly subject: string;
    };
    readonly sections: readonly LegalSection[];
  };
}
