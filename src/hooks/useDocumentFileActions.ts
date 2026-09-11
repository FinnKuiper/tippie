import { useCallback } from "react";
import { useDocumentStore } from "../store";
import {
  describeDocumentError,
  openDocumentFile,
  pickOpenFilePath,
  pickSaveFilePath,
  saveDocumentFile,
} from "../lib/commands";
import type { SavedDocument } from "../types";

const EMPTY_DOCUMENT_HTML = "<h1>Untitled Document</h1><p>Start writing your academic paper here…</p>";

export interface UseDocumentFileActions {
  /** Clears the editor back to a blank, never-saved document. */
  newDocument: () => void;
  /** Shows the native Open dialog, then loads the chosen `.awrite` file. */
  openDocument: () => Promise<void>;
  /** Saves to `currentFilePath`, or falls back to Save As if never saved. */
  saveDocument: () => Promise<void>;
  /** Shows the native Save dialog, then writes the document to the chosen path. */
  saveDocumentAs: () => Promise<void>;
}

/**
 * Owns the async File menu operations (New/Open/Save/Save As).
 *
 * Per the store's design rule (async operations belong in components, not
 * the store — see `store.ts`), this hook is where `invoke`/dialog calls
 * happen; it only ever writes plain values back into the store via its sync
 * actions. Safe to call from multiple components (`FileMenu` and `App`'s
 * keyboard shortcuts) since all operation-in-progress/error state lives in
 * the shared store, not component-local state.
 */
export function useDocumentFileActions(): UseDocumentFileActions {
  const editorInstance = useDocumentStore((state) => state.editorInstance);
  const documentContent = useDocumentStore((state) => state.documentContent);
  const citations = useDocumentStore((state) => state.citations);
  const currentFilePath = useDocumentStore((state) => state.currentFilePath);
  const documentTitle = useDocumentStore((state) => state.documentTitle);
  const documentCreatedAt = useDocumentStore((state) => state.documentCreatedAt);
  const isDirty = useDocumentStore((state) => state.isDirty);
  const resetDocument = useDocumentStore((state) => state.resetDocument);
  const loadDocument = useDocumentStore((state) => state.loadDocument);
  const markSavedToFile = useDocumentStore((state) => state.markSavedToFile);
  const setIsFileOperationInProgress = useDocumentStore((state) => state.setIsFileOperationInProgress);
  const setFileErrorMessage = useDocumentStore((state) => state.setFileErrorMessage);

  /** Builds the JSON-serializable document from current store state. */
  const buildSavedDocument = useCallback((): SavedDocument => {
    const now = new Date().toISOString();
    return {
      version: "1.0",
      metadata: {
        title: documentTitle,
        createdAt: documentCreatedAt ?? now,
        lastModified: now,
      },
      content: {
        html: documentContent,
        // TODO(export): see DocumentBody.markdown in src/types.ts.
        markdown: "",
      },
      bibliography: citations,
    };
  }, [documentTitle, documentCreatedAt, documentContent, citations]);

  const newDocument = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved changes and start a new document?")) {
      return;
    }
    // `false` suppresses onUpdate so this programmatic reset doesn't
    // immediately re-mark the fresh document dirty (see DocumentEditor.tsx).
    editorInstance?.commands.setContent(EMPTY_DOCUMENT_HTML, false);
    resetDocument();
    setFileErrorMessage(null);
  }, [editorInstance, isDirty, resetDocument, setFileErrorMessage]);

  const openDocument = useCallback(async () => {
    const filePath = await pickOpenFilePath();
    if (!filePath) return;

    setIsFileOperationInProgress(true);
    setFileErrorMessage(null);
    try {
      const document = await openDocumentFile(filePath);
      editorInstance?.commands.setContent(document.content.html, false);
      loadDocument(document, filePath);
    } catch (error) {
      setFileErrorMessage(describeDocumentError(error));
    } finally {
      setIsFileOperationInProgress(false);
    }
  }, [editorInstance, loadDocument, setIsFileOperationInProgress, setFileErrorMessage]);

  const saveDocumentAs = useCallback(async () => {
    const filePath = await pickSaveFilePath(documentTitle);
    if (!filePath) return;

    setIsFileOperationInProgress(true);
    setFileErrorMessage(null);
    try {
      const document = buildSavedDocument();
      await saveDocumentFile(filePath, document);
      markSavedToFile(filePath, document.metadata.createdAt);
    } catch (error) {
      setFileErrorMessage(describeDocumentError(error));
    } finally {
      setIsFileOperationInProgress(false);
    }
  }, [documentTitle, buildSavedDocument, markSavedToFile, setIsFileOperationInProgress, setFileErrorMessage]);

  const saveDocument = useCallback(async () => {
    if (!currentFilePath) {
      await saveDocumentAs();
      return;
    }

    setIsFileOperationInProgress(true);
    setFileErrorMessage(null);
    try {
      const document = buildSavedDocument();
      await saveDocumentFile(currentFilePath, document);
      markSavedToFile(currentFilePath, document.metadata.createdAt);
    } catch (error) {
      setFileErrorMessage(describeDocumentError(error));
    } finally {
      setIsFileOperationInProgress(false);
    }
  }, [
    currentFilePath,
    buildSavedDocument,
    markSavedToFile,
    setIsFileOperationInProgress,
    setFileErrorMessage,
    saveDocumentAs,
  ]);

  return { newDocument, openDocument, saveDocument, saveDocumentAs };
}
