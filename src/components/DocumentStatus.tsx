import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useDocumentStore } from "../store";

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

/**
 * Centered top-bar element showing the document title alongside its
 * save state (never saved / unsaved changes / saving / saved). Split out
 * of `FileMenu` so the File dropdown and the status readout can each stay
 * focused on one job.
 */
export default function DocumentStatus(): JSX.Element {
  const documentTitle = useDocumentStore((state) => state.documentTitle);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const lastSaved = useDocumentStore((state) => state.lastSaved);
  const isFileOperationInProgress = useDocumentStore((state) => state.isFileOperationInProgress);

  if (isFileOperationInProgress) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400">
        <Loader2 size={14} className="animate-spin" />
        <span className="font-medium">Saving…</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex flex-col items-center leading-tight">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-amber-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{documentTitle}*</span>
        </div>
        <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex flex-col items-center leading-tight">
        <div className="flex items-center gap-1.5">
          <Check size={14} className="text-emerald-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{documentTitle}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">Saved {formatRelativeTime(lastSaved)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{documentTitle}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">Not saved yet</span>
    </div>
  );
}
