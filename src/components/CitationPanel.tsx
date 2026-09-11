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
    <li className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-sm leading-snug text-slate-800 dark:text-slate-200">
        {formatReferenceApa(citation)}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">{formatInTextApa(citation)}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onInsert(citation)}
            className="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => onRemove(citation.id)}
            className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={`Remove citation ${citation.id}`}
          >
            ✕
          </button>
        </div>
      </div>
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
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Bibliography
        </h2>
        <button
          type="button"
          onClick={() => setImportDialogOpen(true)}
          className="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600"
        >
          Import .bib
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {citations.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No citations yet. Import a .bib file to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {citations.map((citation) => (
              <CitationCard
                key={citation.id}
                citation={citation}
                onInsert={handleInsert}
                onRemove={removeCitation}
              />
            ))}
          </ul>
        )}

        {citationSuggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
