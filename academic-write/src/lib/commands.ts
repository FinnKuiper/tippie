import { invoke } from "@tauri-apps/api/core";
import type { Citation, CitationSuggestion, Suggestion } from "../types";

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
