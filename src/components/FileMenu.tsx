import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, FilePlus, FolderOpen, Save } from "lucide-react";
import { useDocumentStore } from "../store";
import { useDocumentFileActions } from "../hooks/useDocumentFileActions";

interface FileMenuItemProps {
  icon: typeof FilePlus;
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}

function FileMenuItem({ icon: Icon, label, shortcut, onClick, disabled }: FileMenuItemProps): JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <Icon size={15} className="text-gray-500 dark:text-gray-400" />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{shortcut}</span>
    </button>
  );
}

/**
 * "File" dropdown menu: New/Open/Save/Save As. Edit and View menus from the
 * design spec are intentionally omitted for now — they'd have no actions to
 * back them in this phase (see AGENTS.md "don't add features beyond current
 * phase"). Document title/status now lives in `DocumentStatus`, not here.
 */
export default function FileMenu(): JSX.Element {
  const isFileOperationInProgress = useDocumentStore((state) => state.isFileOperationInProgress);
  const fileErrorMessage = useDocumentStore((state) => state.fileErrorMessage);
  const setFileErrorMessage = useDocumentStore((state) => state.setFileErrorMessage);

  const { newDocument, openDocument, saveDocument, saveDocumentAs } = useDocumentFileActions();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const runAndClose = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`focus-ring flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          isOpen
            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        File
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="animate-pop-in absolute left-0 top-full z-40 mt-1 w-56 origin-top-left rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <FileMenuItem
            icon={FilePlus}
            label="New Document"
            shortcut="Ctrl+N"
            onClick={() => runAndClose(newDocument)}
            disabled={isFileOperationInProgress}
          />
          <FileMenuItem
            icon={FolderOpen}
            label="Open…"
            shortcut="Ctrl+O"
            onClick={() => runAndClose(() => void openDocument())}
            disabled={isFileOperationInProgress}
          />
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
          <FileMenuItem
            icon={Save}
            label="Save"
            shortcut="Ctrl+S"
            onClick={() => runAndClose(() => void saveDocument())}
            disabled={isFileOperationInProgress}
          />
          <FileMenuItem
            icon={Save}
            label="Save As…"
            shortcut="Ctrl+Shift+S"
            onClick={() => runAndClose(() => void saveDocumentAs())}
            disabled={isFileOperationInProgress}
          />
        </div>
      )}

      {fileErrorMessage && (
        <div
          role="alert"
          className="animate-fade-in absolute left-0 top-full z-40 mt-1 flex w-max max-w-sm items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700 shadow-sm dark:bg-red-950 dark:text-red-300"
        >
          <span>{fileErrorMessage}</span>
          <button
            type="button"
            onClick={() => setFileErrorMessage(null)}
            aria-label="Dismiss error"
            className="focus-ring rounded font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
