import { useEffect, useState } from "react";
import DocumentEditor from "./components/DocumentEditor";
import CitationPanel from "./components/CitationPanel";
import ImportDialog from "./components/ImportDialog";
import FileMenu from "./components/FileMenu";
import { useDocumentStore } from "./store";
import { useDocumentFileActions } from "./hooks/useDocumentFileActions";

function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return [isDark, () => setIsDark((prev) => !prev)];
}

/**
 * Registers Ctrl/Cmd+S (Save), Ctrl/Cmd+O (Open), and Ctrl/Cmd+N (New) as
 * global shortcuts for the File menu actions.
 */
function useFileKeyboardShortcuts(): void {
  const { newDocument, openDocument, saveDocument } = useDocumentFileActions();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) return;

      switch (event.key.toLowerCase()) {
        case "s":
          event.preventDefault();
          void saveDocument();
          break;
        case "o":
          event.preventDefault();
          void openDocument();
          break;
        case "n":
          event.preventDefault();
          newDocument();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newDocument, openDocument, saveDocument]);
}

/** Top-level app shell: header, editor + citation sidebar, and dialogs. */
export default function App(): JSX.Element {
  const [isDark, toggleDark] = useDarkMode();
  const isCheckingSuggestions = useDocumentStore((state) => state.isCheckingSuggestions);
  useFileKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">AcademicWrite</span>
          <span className="text-xs text-slate-400">local-first academic editor</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          {isCheckingSuggestions && <span>Checking suggestions…</span>}
          <FileMenu />
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded px-2 py-1 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <DocumentEditor />
        <CitationPanel />
      </main>

      <ImportDialog />
    </div>
  );
}
