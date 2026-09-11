import { useEffect, useRef } from "react";
import { useDocumentStore } from "../store";
import type { Suggestion } from "../types";

const TYPE_LABELS: Record<Suggestion["type"], string> = {
  grammar: "Grammar",
  clarity: "Clarity",
  style: "Style",
  citation: "Citation",
};

const TYPE_BADGE_CLASSES: Record<Suggestion["type"], string> = {
  grammar: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  clarity: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  style: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  citation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

interface SuggestionPopupProps {
  suggestion: Suggestion;
  /** Viewport-relative position (already includes page scroll offset). */
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Small floating card shown when the user clicks a highlighted suggestion
 * span in the editor. Lets the user apply the suggested replacement (when
 * one exists) or dismiss the suggestion outright.
 */
export default function SuggestionPopup({ suggestion, position, onClose }: SuggestionPopupProps): JSX.Element {
  const dismissSuggestion = useDocumentStore((state) => state.dismissSuggestion);
  const editorInstance = useDocumentStore((state) => state.editorInstance);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleApply = (): void => {
    if (editorInstance && suggestion.replacement) {
      // TODO: For multi-occurrence text this replaces the first match only.
      // A production implementation should track precise ProseMirror
      // positions rather than searching document text.
      const { state } = editorInstance;
      const docText = state.doc.textBetween(0, state.doc.content.size, "\n");
      const index = docText.indexOf(suggestion.text);
      if (index !== -1) {
        const from = index;
        const to = index + suggestion.text.length;
        editorInstance
          .chain()
          .focus()
          .insertContentAt({ from, to }, suggestion.replacement)
          .run();
      }
    }
    dismissSuggestion(suggestion.id);
    onClose();
  };

  const handleDismiss = (): void => {
    dismissSuggestion(suggestion.id);
    onClose();
  };

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-label={`${TYPE_LABELS[suggestion.type]} suggestion`}
      className="animate-pop-in absolute z-50 w-72 origin-top-left rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      style={{ left: position.x, top: position.y + 6 }}
    >
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE_CLASSES[suggestion.type]}`}>
        {TYPE_LABELS[suggestion.type]}
      </span>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{suggestion.message}</p>
      {suggestion.replacement && (
        <p className="mt-2 rounded bg-gray-100 px-2 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100">
          <span className="font-semibold">Suggested:</span> {suggestion.replacement}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="focus-ring rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Dismiss
        </button>
        {suggestion.replacement && (
          <button
            type="button"
            onClick={handleApply}
            className="focus-ring rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
