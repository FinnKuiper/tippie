import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useDocumentStore } from "../store";
import { importBibliography } from "../lib/commands";

/** Reads a browser File object as UTF-8 text. */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Modal dialog for importing a .bib bibliography file. Parsing itself
 * happens on the Rust backend (`import_bibliography`); this component only
 * handles file selection and surfaces errors.
 */
export default function ImportDialog(): JSX.Element | null {
  const isOpen = useDocumentStore((state) => state.isImportDialogOpen);
  const setImportDialogOpen = useDocumentStore((state) => state.setImportDialogOpen);
  const addCitations = useDocumentStore((state) => state.addCitations);

  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = useCallback(() => {
    setError(null);
    setImportDialogOpen(false);
  }, [setImportDialogOpen]);

  const handleFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setError(null);
      try {
        const content = await readFileAsText(file);
        const citations = await importBibliography(content);
        if (citations.length === 0) {
          setError("No valid entries were found in that file.");
          return;
        }
        addCitations(citations);
        setImportDialogOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import bibliography file.");
      } finally {
        setIsImporting(false);
      }
    },
    [addCitations, setImportDialogOpen],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
      event.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import bibliography"
        className="animate-pop-in w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Import bibliography
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select or drop a .bib (BibTeX) file to import its entries.
        </p>

        <div
          role="button"
          tabIndex={0}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="focus-ring mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-8 text-center hover:border-brand-400 dark:border-gray-600"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isImporting ? "Importing…" : "Click to browse or drag a .bib file here"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bib,text/plain"
            className="hidden"
            onChange={handleInputChange}
            disabled={isImporting}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="focus-ring rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
