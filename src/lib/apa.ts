import type { Citation } from "../types";

/**
 * Formats a citation as an APA (7th edition) in-text parenthetical citation,
 * e.g. "(Smith, 2020)".
 */
export function formatInTextApa(citation: Citation): string {
  const surname = citation.author.split(",")[0]?.trim() || citation.author;
  return `(${surname}, ${citation.year})`;
}

/**
 * Formats a citation as a full APA (7th edition) reference-list entry.
 *
 * Example: Smith, J. (2020). The title of the work. Journal Name.
 *
 * This is a best-effort formatter for the MVP; it does not yet handle every
 * APA edge case (edited volumes, multiple editions, DOIs for all entry types, etc).
 */
export function formatReferenceApa(citation: Citation): string {
  const author = citation.author || "Unknown Author";
  const year = citation.year ? `(${citation.year})` : "(n.d.)";
  const title = citation.title || "Untitled";
  const source = citation.source ? `${citation.source}.` : "";
  const url = citation.url ? ` ${citation.url}` : "";
  return `${author} ${year}. ${title}. ${source}${url}`.trim();
}
