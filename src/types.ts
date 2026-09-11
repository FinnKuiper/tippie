/**
 * Shared TypeScript types for AcademicWrite.
 *
 * These mirror the Rust structs in `src-tauri/src/models/mod.rs`.
 * Keep the two in sync when adding fields — `serde` on the Rust side
 * serializes using the same camelCase field names via `#[serde(rename_all = "camelCase")]`.
 */

/** A single bibliography entry imported from a .bib file. */
export interface Citation {
  /** Stable unique id (bibtex citation key, e.g. "smith2020"). */
  id: string;
  /** Author string, e.g. "Smith, J., & Doe, A." */
  author: string;
  title: string;
  year: string;
  /** Journal, publisher, or conference name. */
  source: string;
  /** Raw bibtex entry type: article, book, inproceedings, etc. */
  entryType?: BibEntryType;
  /** DOI or URL, if present. */
  url?: string;
}

export type BibEntryType =
  | "article"
  | "book"
  | "inproceedings"
  | "incollection"
  | "phdthesis"
  | "misc"
  | "unpublished"
  | "other";

/** Category of an AI-generated writing suggestion. */
export type SuggestionType = "grammar" | "clarity" | "style" | "citation";

/** Position of a suggestion within the plain-text content of the document. */
export interface TextPosition {
  from: number;
  to: number;
}

/** A single AI-generated suggestion attached to a span of text. */
export interface Suggestion {
  id: string;
  type: SuggestionType;
  /** The original text the suggestion refers to. */
  text: string;
  /** Suggested replacement text, if applicable (absent for citation suggestions). */
  replacement?: string;
  position: TextPosition;
  /** Human-readable explanation shown to the user. */
  message: string;
}

/** A suggestion that a citation is likely needed near a given span of text. */
export interface CitationSuggestion {
  id: string;
  position: TextPosition;
  text: string;
  reason: string;
  /** Citation ids from the bibliography that could plausibly support this claim. */
  suggestedCitationIds: string[];
}

/** The in-memory representation of the open document. */
export interface AcademicDocument {
  content: string;
  citations: Citation[];
  lastSaved: string | null;
}

/** Title and timestamps for a saved `.awrite` document. */
export interface DocumentMetadata {
  title: string;
  /** ISO 8601 timestamp set once, when the document is first saved. */
  createdAt: string;
  /** ISO 8601 timestamp, updated on every save. */
  lastModified: string;
}

/** The document body, in the formats the frontend needs. */
export interface DocumentBody {
  /** TipTap's HTML serialization — the source of truth. */
  html: string;
  /**
   * Markdown rendering of `html`. Currently always empty — see
   * `src-tauri/src/models/mod.rs` `DocumentBody` for why this is deferred.
   */
  markdown: string;
}

/** On-disk representation of a `.awrite` file, mirrors the Rust `SavedDocument` struct. */
export interface SavedDocument {
  /** File format version, for forward compatibility. Currently always "1.0". */
  version: string;
  metadata: DocumentMetadata;
  content: DocumentBody;
  bibliography: Citation[];
}

/** Structured error returned by document file-I/O commands (see `commands/documents.rs`). */
export interface DocumentError {
  code: string;
  message: string;
  path?: string;
}
