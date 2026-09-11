import { useEffect, useState } from "react";
import DocumentEditor from "./components/DocumentEditor";
import CitationPanel from "./components/CitationPanel";
import ImportDialog from "./components/ImportDialog";
import { useDocumentStore } from "./store";

function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return [isDark, () => setIsDark((prev) => !prev)];
}

function formatLastSaved(iso: string | null): string {
  if (!iso) return "Not saved yet";
  return `Saved ${new Date(iso).toLocaleTimeString()}`;
}

/** Top-level app shell: header, editor + citation sidebar, and dialogs. */
export default function App(): JSX.Element {
  const [isDark, toggleDark] = useDarkMode();
  const lastSaved = useDocumentStore((state) => state.lastSaved);
  const markSaved = useDocumentStore((state) => state.markSaved);
  const isCheckingSuggestions = useDocumentStore((state) => state.isCheckingSuggestions);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">AcademicWrite</span>
          <span className="text-xs text-slate-400">local-first academic editor</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          {isCheckingSuggestions && <span>Checking suggestions…</span>}
          <span>{formatLastSaved(lastSaved)}</span>
          <button
            type="button"
            onClick={() => markSaved()}
            className="rounded bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600"
          >
            Save
          </button>
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
