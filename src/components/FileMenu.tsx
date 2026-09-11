import { useDocumentStore } from "../store";
import { useDocumentFileActions } from "../hooks/useDocumentFileActions";

/** Formats an ISO timestamp as a short relative "Xs/Xm/Xh ago" string. */
function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.round(deltaMs / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

interface FileMenuButtonProps {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

function FileMenuButton({ label, title, onClick, disabled }: FileMenuButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {label}
    </button>
  );
}

/**
 * File operations menu: New/Open/Save/Save As, plus the document title,
 * dirty-state indicator, and last-saved status. Combines what the design
 * called out as separate `FileMenu` + `DocumentHeader` components — merging
 * them avoided duplicating the same title/dirty-indicator display logic
 * twice for no functional benefit.
 */
export default function FileMenu(): JSX.Element {
  const documentTitle = useDocumentStore((state) => state.documentTitle);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const lastSaved = useDocumentStore((state) => state.lastSaved);
  const isFileOperationInProgress = useDocumentStore((state) => state.isFileOperationInProgress);
  const fileErrorMessage = useDocumentStore((state) => state.fileErrorMessage);
  const setFileErrorMessage = useDocumentStore((state) => state.setFileErrorMessage);

  const { newDocument, openDocument, saveDocument, saveDocumentAs } = useDocumentFileActions();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <FileMenuButton label="New" title="New Document (Ctrl+N)" onClick={newDocument} disabled={isFileOperationInProgress} />
        <FileMenuButton
          label="Open…"
          title="Open Document (Ctrl+O)"
          onClick={() => void openDocument()}
          disabled={isFileOperationInProgress}
        />
        <FileMenuButton
          label="Save"
          title="Save (Ctrl+S)"
          onClick={() => void saveDocument()}
          disabled={isFileOperationInProgress}
        />
        <FileMenuButton
          label="Save As…"
          title="Save As"
          onClick={() => void saveDocumentAs()}
          disabled={isFileOperationInProgress}
        />
      </div>

      <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />

      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          📄 {documentTitle}
          {isDirty && <span className="text-amber-500"> *</span>}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {isFileOperationInProgress
            ? "Working…"
            : lastSaved
              ? `Saved ${formatRelativeTime(lastSaved)}`
              : "Not saved yet"}
        </span>
      </div>

      {fileErrorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          <span>{fileErrorMessage}</span>
          <button
            type="button"
            onClick={() => setFileErrorMessage(null)}
            aria-label="Dismiss error"
            className="font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
