import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import type { Citation, CitationSuggestion, DocumentError, SavedDocument, Suggestion } from "../types";

const AWRITE_DIALOG_FILTERS = [{ name: "AcademicWrite Document", extensions: ["awrite"] }];

/**
 * Thin, typed wrappers around the Tauri backend commands defined in
 * `src-tauri/src/commands/`. All functions here can throw — callers are
 * expected to handle rejected promises (see usages in components).
 */

/** Parses the raw text content of a .bib file into structured citations. */
export async function importBibliography(fileContent: string): Promise<Citation[]> {
  return invoke<Citation[]>("import_bibliography", { fileContent });
}

/** Requests grammar/clarity/style suggestions for a single sentence. */
export async function checkSentence(sentence: string): Promise<Suggestion[]> {
  return invoke<Suggestion[]>("check_sentence", { sentence });
}

/**
 * Requests suggestions for where in the given text a citation is likely
 * needed, given the list of known authors already in the bibliography.
 */
export async function findCitationOpportunities(
  text: string,
  authors: string[],
): Promise<CitationSuggestion[]> {
  return invoke<CitationSuggestion[]>("find_citation_opportunities", { text, authors });
}

/**
 * Writes `document` to `filePath` as a `.awrite` JSON file, creating parent
 * directories as needed. Overwrites any existing file at that path.
 * Rejects with a {@link DocumentError} on failure.
 */
export async function saveDocumentFile(filePath: string, document: SavedDocument): Promise<void> {
  return invoke<void>("save_document", { filePath, document });
}

/**
 * Reads and parses a `.awrite` file from disk.
 * Rejects with a {@link DocumentError} on failure (not found, permission
 * denied, or invalid file contents).
 */
export async function openDocumentFile(filePath: string): Promise<SavedDocument> {
  return invoke<SavedDocument>("open_document", { filePath });
}

/**
 * Shows the native "Open" file picker, filtered to `.awrite` files.
 * @returns The chosen path, or `null` if the user cancelled.
 */
export async function pickOpenFilePath(): Promise<string | null> {
  const selected = await openDialog({
    multiple: false,
    directory: false,
    filters: AWRITE_DIALOG_FILTERS,
  });
  return typeof selected === "string" ? selected : null;
}

/**
 * Shows the native "Save As" file picker, filtered to `.awrite` files.
 * @param defaultFileName - Pre-filled file name, e.g. from the current document title.
 * @returns The chosen path, or `null` if the user cancelled.
 */
export async function pickSaveFilePath(defaultFileName: string): Promise<string | null> {
  const chosen = await saveDialog({
    defaultPath: defaultFileName.endsWith(".awrite") ? defaultFileName : `${defaultFileName}.awrite`,
    filters: AWRITE_DIALOG_FILTERS,
  });
  return chosen ?? null;
}

/**
 * Extracts a user-displayable message from a rejected document command,
 * which may be a {@link DocumentError} (from `save_document`/`open_document`)
 * or, for unexpected failures (e.g. IPC-layer errors), a plain string.
 */
export function describeDocumentError(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as DocumentError).message);
  }
  return typeof error === "string" ? error : "An unexpected error occurred.";
}
