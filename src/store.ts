import { create } from "zustand";
import type { Editor } from "@tiptap/react";
import type { Citation, CitationSuggestion, SavedDocument, Suggestion } from "./types";

export interface DocumentState {
  /** HTML content of the TipTap editor. */
  documentContent: string;
  citations: Citation[];
  suggestions: Suggestion[];
  citationSuggestions: CitationSuggestion[];
  /** ISO timestamp of the last save, or null if never saved. */
  lastSaved: string | null;
  /** True while a suggestion-fetch request is in flight. */
  isCheckingSuggestions: boolean;
  /** True while the import dialog is open. */
  isImportDialogOpen: boolean;
  /**
   * Live handle to the mounted TipTap editor instance, registered by
   * `DocumentEditor` on mount. Lets other components (e.g. `CitationPanel`)
   * insert content at the current cursor position. Not serialized/persisted.
   */
  editorInstance: Editor | null;

  /** Full path of the document currently open on disk, or null for an unsaved document. */
  currentFilePath: string | null;
  /** Display title, derived from the filename once the document has a path. */
  documentTitle: string;
  /** ISO timestamp the document was first saved at (kept across subsequent saves). */
  documentCreatedAt: string | null;
  /** True if there are edits that haven't been written to `currentFilePath`. */
  isDirty: boolean;
  /** True while a document is being opened/saved (disables File menu actions). */
  isFileOperationInProgress: boolean;
  /**
   * User-facing message from the most recent failed file operation, or null.
   * Lives in the store (rather than component state) so it stays visible
   * regardless of whether the operation was triggered from `FileMenu` or a
   * keyboard shortcut in `App.tsx`.
   */
  fileErrorMessage: string | null;

  setContent: (content: string) => void;
  addCitations: (citations: Citation[]) => void;
  removeCitation: (id: string) => void;
  setCitations: (citations: Citation[]) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  clearSuggestions: () => void;
  dismissSuggestion: (id: string) => void;
  setCitationSuggestions: (suggestions: CitationSuggestion[]) => void;
  setIsCheckingSuggestions: (value: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setEditorInstance: (editor: Editor | null) => void;

  setIsDirty: (dirty: boolean) => void;
  setIsFileOperationInProgress: (value: boolean) => void;
  setFileErrorMessage: (message: string | null) => void;
  /** Resets to a blank, never-saved document. Does not touch `citations`. */
  resetDocument: () => void;
  /** Applies a document freshly loaded from `filePath` (clears dirty state). */
  loadDocument: (document: SavedDocument, filePath: string) => void;
  /** Records a successful save to `filePath`, deriving `documentTitle` from it. */
  markSavedToFile: (filePath: string, createdAt: string) => void;
}

/** Derives a display title ("My Essay") from a full `.awrite` file path. */
function titleFromFilePath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  return fileName.replace(/\.awrite$/i, "") || "Untitled";
}

/**
 * Central application store for the document editor, imported bibliography,
 * and AI-generated suggestions. Kept intentionally flat and framework-agnostic
 * so it can be unit tested without mounting React.
 */
export const useDocumentStore = create<DocumentState>((set) => ({
  documentContent: "",
  citations: [],
  suggestions: [],
  citationSuggestions: [],
  lastSaved: null,
  isCheckingSuggestions: false,
  isImportDialogOpen: false,
  editorInstance: null,

  currentFilePath: null,
  documentTitle: "Untitled",
  documentCreatedAt: null,
  isDirty: false,
  isFileOperationInProgress: false,
  fileErrorMessage: null,

  setContent: (content) => set({ documentContent: content }),

  addCitations: (newCitations) =>
    set((state) => {
      const existingIds = new Set(state.citations.map((c) => c.id));
      const deduped = newCitations.filter((c) => !existingIds.has(c.id));
      return { citations: [...state.citations, ...deduped] };
    }),

  removeCitation: (id) =>
    set((state) => ({ citations: state.citations.filter((c) => c.id !== id) })),

  setCitations: (citations) => set({ citations }),

  addSuggestion: (suggestion) =>
    set((state) => ({ suggestions: [...state.suggestions, suggestion] })),

  setSuggestions: (suggestions) => set({ suggestions }),

  clearSuggestions: () => set({ suggestions: [] }),

  dismissSuggestion: (id) =>
    set((state) => ({ suggestions: state.suggestions.filter((s) => s.id !== id) })),

  setCitationSuggestions: (citationSuggestions) => set({ citationSuggestions }),

  setIsCheckingSuggestions: (value) => set({ isCheckingSuggestions: value }),

  setImportDialogOpen: (open) => set({ isImportDialogOpen: open }),

  setEditorInstance: (editor) => set({ editorInstance: editor }),

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setIsFileOperationInProgress: (value) => set({ isFileOperationInProgress: value }),

  setFileErrorMessage: (message) => set({ fileErrorMessage: message }),

  resetDocument: () =>
    set({
      documentContent: "",
      currentFilePath: null,
      documentTitle: "Untitled",
      documentCreatedAt: null,
      isDirty: false,
      lastSaved: null,
    }),

  loadDocument: (document, filePath) =>
    set({
      documentContent: document.content.html,
      citations: document.bibliography,
      currentFilePath: filePath,
      documentTitle: titleFromFilePath(filePath),
      documentCreatedAt: document.metadata.createdAt,
      isDirty: false,
      lastSaved: new Date().toISOString(),
    }),

  markSavedToFile: (filePath, createdAt) =>
    set({
      currentFilePath: filePath,
      documentTitle: titleFromFilePath(filePath),
      documentCreatedAt: createdAt,
      isDirty: false,
      lastSaved: new Date().toISOString(),
    }),
}));
