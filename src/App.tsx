import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import DocumentEditor from "./components/DocumentEditor";
import CitationPanel from "./components/CitationPanel";
import ImportDialog from "./components/ImportDialog";
import FileMenu from "./components/FileMenu";
import DocumentStatus from "./components/DocumentStatus";
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
 * Registers Ctrl/Cmd+S (Save), Ctrl/Cmd+Shift+S (Save As), Ctrl/Cmd+O
 * (Open), and Ctrl/Cmd+N (New) as global shortcuts for the File menu
 * actions.
 */
function useFileKeyboardShortcuts(): void {
  const { newDocument, openDocument, saveDocument, saveDocumentAs } = useDocumentFileActions();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) return;

      switch (event.key.toLowerCase()) {
        case "s":
          event.preventDefault();
          if (event.shiftKey) {
            void saveDocumentAs();
          } else {
            void saveDocument();
          }
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
  }, [newDocument, openDocument, saveDocument, saveDocumentAs]);
}

/** Top-level app shell: header, editor + citation sidebar, and dialogs. */
export default function App(): JSX.Element {
  const [isDark, toggleDark] = useDarkMode();
  const isCheckingSuggestions = useDocumentStore((state) => state.isCheckingSuggestions);
  useFileKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col">
      <header className="relative flex h-12 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-700 dark:bg-topbar-dark">
        <div className="flex items-center gap-4">
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">AcademicWrite</span>
          <FileMenu />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <DocumentStatus />
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {isCheckingSuggestions && <span className="text-xs text-gray-400">Checking suggestions…</span>}
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="focus-ring flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
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
