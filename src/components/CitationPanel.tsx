import { Library, X } from "lucide-react";
import { useDocumentStore } from "../store";
import { formatInTextApa, formatReferenceApa } from "../lib/apa";
import type { Citation } from "../types";

interface CitationCardProps {
  citation: Citation;
  onInsert: (citation: Citation) => void;
  onRemove: (id: string) => void;
}

function CitationCard({ citation, onInsert, onRemove }: CitationCardProps): JSX.Element {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onInsert(citation)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onInsert(citation);
      }}
      className="focus-ring group relative rounded-md border border-transparent p-3 transition-colors hover:border-gray-200 hover:bg-white dark:hover:border-gray-700 dark:hover:bg-gray-800"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(citation.id);
        }}
        aria-label={`Remove citation ${citation.id}`}
        className="focus-ring absolute right-2 top-2 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700"
      >
        <X size={13} />
      </button>

      <p className="pr-5 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
        {formatReferenceApa(citation)}
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400 dark:text-gray-500">{formatInTextApa(citation)}</p>
      <span className="mt-1.5 inline-block text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
        Insert citation
      </span>
    </li>
  );
}

/**
 * Right-hand sidebar listing all imported bibliography entries in APA
 * format, plus any AI-identified citation opportunities in the document.
 */
export default function CitationPanel(): JSX.Element {
  const citations = useDocumentStore((state) => state.citations);
  const citationSuggestions = useDocumentStore((state) => state.citationSuggestions);
  const removeCitation = useDocumentStore((state) => state.removeCitation);
  const setImportDialogOpen = useDocumentStore((state) => state.setImportDialogOpen);
  const editorInstance = useDocumentStore((state) => state.editorInstance);

  const handleInsert = (citation: Citation): void => {
    if (!editorInstance) return;
    editorInstance.chain().focus().insertContent(`${formatInTextApa(citation)} `).run();
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Bibliography
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {citations.length === 0 ? (
          <div className="py-8 text-center">
            <Library size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">No citations yet</p>
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
              Import a .bib file to get started
            </p>
            <button
              type="button"
              onClick={() => setImportDialogOpen(true)}
              className="focus-ring w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Import .bib file
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setImportDialogOpen(true)}
              className="focus-ring mb-3 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Import .bib file
            </button>
            <ul className="space-y-1">
              {citations.map((citation) => (
                <CitationCard
                  key={citation.id}
                  citation={citation}
                  onInsert={handleInsert}
                  onRemove={removeCitation}
                />
              ))}
            </ul>
          </>
        )}

        {citationSuggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Suggested citation spots
            </h3>
            <ul className="mt-2 space-y-2">
              {citationSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                >
                  <p className="italic">&ldquo;{suggestion.text}&rdquo;</p>
                  <p className="mt-1">{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
