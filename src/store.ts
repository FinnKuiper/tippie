import { create } from "zustand";
import type { Editor } from "@tiptap/react";
import type { Citation, CitationSuggestion, Suggestion } from "./types";

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

  setContent: (content: string) => void;
  addCitations: (citations: Citation[]) => void;
  removeCitation: (id: string) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  clearSuggestions: () => void;
  dismissSuggestion: (id: string) => void;
  setCitationSuggestions: (suggestions: CitationSuggestion[]) => void;
  setIsCheckingSuggestions: (value: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  markSaved: () => void;
  setEditorInstance: (editor: Editor | null) => void;
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

  setContent: (content) => set({ documentContent: content }),

  addCitations: (newCitations) =>
    set((state) => {
      const existingIds = new Set(state.citations.map((c) => c.id));
      const deduped = newCitations.filter((c) => !existingIds.has(c.id));
      return { citations: [...state.citations, ...deduped] };
    }),

  removeCitation: (id) =>
    set((state) => ({ citations: state.citations.filter((c) => c.id !== id) })),

  addSuggestion: (suggestion) =>
    set((state) => ({ suggestions: [...state.suggestions, suggestion] })),

  setSuggestions: (suggestions) => set({ suggestions }),

  clearSuggestions: () => set({ suggestions: [] }),

  dismissSuggestion: (id) =>
    set((state) => ({ suggestions: state.suggestions.filter((s) => s.id !== id) })),

  setCitationSuggestions: (citationSuggestions) => set({ citationSuggestions }),

  setIsCheckingSuggestions: (value) => set({ isCheckingSuggestions: value }),

  setImportDialogOpen: (open) => set({ isImportDialogOpen: open }),

  markSaved: () => set({ lastSaved: new Date().toISOString() }),

  setEditorInstance: (editor) => set({ editorInstance: editor }),
}));
