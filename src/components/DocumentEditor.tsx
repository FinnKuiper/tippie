import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import {
  Bold,
  BookMarked,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Underline as UnderlineIcon,
  type LucideIcon,
} from "lucide-react";
import { useDocumentStore } from "../store";
import { checkSentence, findCitationOpportunities } from "../lib/commands";
import { SuggestionHighlight } from "../lib/suggestionExtension";
import SuggestionPopup from "./SuggestionPopup";
import type { Suggestion } from "../types";

const SENTENCE_CHECK_DEBOUNCE_MS = 1200;

/** Extracts the last non-empty sentence from a block of plain text. */
function extractLastSentence(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim());
  for (let i = sentences.length - 1; i >= 0; i -= 1) {
    if (sentences[i]) return sentences[i];
  }
  return "";
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: LucideIcon;
  title: string;
}

function ToolbarButton({ onClick, active, icon: Icon, title }: ToolbarButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`focus-ring flex items-center justify-center rounded-md p-2 transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

/** Vertical separator between toolbar groups, per the design spec's divider spec (24px tall, 8px margin). */
function ToolbarDivider(): JSX.Element {
  return <span className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />;
}

interface EditorToolbarProps {
  editor: Editor;
  onCheckCitations: () => void;
  isCheckingCitations: boolean;
}

function EditorToolbar({ editor, onCheckCitations, isCheckingCitations }: EditorToolbarProps): JSX.Element {
  return (
    <div className="flex h-14 flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-topbar-dark">
      {/* Text formatting */}
      <ToolbarButton
        icon={Bold}
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <ToolbarDivider />

      {/* Block styles */}
      <ToolbarButton
        icon={Heading1}
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2}
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        title="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <ToolbarDivider />

      {/* Table */}
      <ToolbarButton
        icon={TableIcon}
        title="Insert 3x3 table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      />

      {/* Citations — secondary/green accent, per design spec */}
      <div className="ml-auto">
        <button
          type="button"
          onClick={onCheckCitations}
          disabled={isCheckingCitations}
          className="focus-ring flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BookMarked size={15} />
          {isCheckingCitations ? "Checking…" : "Check citations"}
        </button>
      </div>
    </div>
  );
}

/**
 * Main rich-text editor. Wraps TipTap, wires document content into the
 * Zustand store, and periodically asks the backend for grammar/clarity/style
 * suggestions on the sentence the user just finished typing.
 */
export default function DocumentEditor(): JSX.Element {
  const setContent = useDocumentStore((state) => state.setContent);
  const setIsDirty = useDocumentStore((state) => state.setIsDirty);
  const suggestions = useDocumentStore((state) => state.suggestions);
  const addSuggestion = useDocumentStore((state) => state.addSuggestion);
  const setCitationSuggestions = useDocumentStore((state) => state.setCitationSuggestions);
  const setIsCheckingSuggestions = useDocumentStore((state) => state.setIsCheckingSuggestions);
  const setEditorInstance = useDocumentStore((state) => state.setEditorInstance);
  const citations = useDocumentStore((state) => state.citations);

  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCheckingCitations, setIsCheckingCitations] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const lastCheckedSentenceRef = useRef<string>("");

  const runSentenceCheck = useCallback(
    async (text: string) => {
      const sentence = extractLastSentence(text);
      if (!sentence || sentence === lastCheckedSentenceRef.current) return;
      lastCheckedSentenceRef.current = sentence;

      setIsCheckingSuggestions(true);
      try {
        const results = await checkSentence(sentence);
        results.forEach(addSuggestion);
      } catch (error) {
        console.error("Failed to fetch sentence suggestions:", error);
      } finally {
        setIsCheckingSuggestions(false);
      }
    },
    [addSuggestion, setIsCheckingSuggestions],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      SuggestionHighlight,
    ],
    content: "<h1>Untitled Document</h1><p>Start writing your academic paper here…</p>",
    // Fires on genuine user edits only: `useDocumentFileActions` passes
    // `emitUpdate: false` to `setContent` for New/Open, so loading a
    // document doesn't spuriously mark it dirty here.
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      setContent(html);
      setIsDirty(true);

      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void runSentenceCheck(updatedEditor.getText());
      }, SENTENCE_CHECK_DEBOUNCE_MS);
    },
  });

  // Keep the decoration layer in sync whenever the suggestion list changes.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setSuggestions(suggestions);
  }, [editor, suggestions]);

  // Publish the editor instance so other components (e.g. CitationPanel) can
  // insert content at the current cursor position.
  useEffect(() => {
    setEditorInstance(editor ?? null);
    return () => setEditorInstance(null);
  }, [editor, setEditorInstance]);

  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  const handleEditorClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const suggestionEl = target.closest<HTMLElement>("[data-suggestion-id]");
      if (!suggestionEl) {
        setActiveSuggestion(null);
        setPopupPosition(null);
        return;
      }
      const id = suggestionEl.dataset.suggestionId;
      const suggestion = suggestions.find((s) => s.id === id) ?? null;
      const rect = suggestionEl.getBoundingClientRect();
      setActiveSuggestion(suggestion);
      setPopupPosition({ x: rect.left, y: rect.bottom + window.scrollY });
    },
    [suggestions],
  );

  const handleCheckCitations = useCallback(async () => {
    if (!editor) return;
    setIsCheckingCitations(true);
    try {
      const text = editor.getText();
      const authors = citations.map((c) => c.author);
      const results = await findCitationOpportunities(text, authors);
      setCitationSuggestions(results);
    } catch (error) {
      console.error("Failed to fetch citation opportunities:", error);
    } finally {
      setIsCheckingCitations(false);
    }
  }, [editor, citations, setCitationSuggestions]);

  if (!editor) {
    return <div className="flex-1 p-6 text-gray-500">Loading editor…</div>;
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <EditorToolbar
        editor={editor}
        onCheckCitations={() => void handleCheckCitations()}
        isCheckingCitations={isCheckingCitations}
      />
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800" onClick={handleEditorClick}>
        {/* 816px matches the design spec's standard document width (Google Docs-style). */}
        <div className="mx-auto max-w-[816px] px-8 py-12">
          <EditorContent editor={editor} />
        </div>
      </div>
      {activeSuggestion && popupPosition && (
        <SuggestionPopup
          suggestion={activeSuggestion}
          position={popupPosition}
          onClose={() => {
            setActiveSuggestion(null);
            setPopupPosition(null);
          }}
        />
      )}
    </div>
  );
}

export { extractLastSentence };
