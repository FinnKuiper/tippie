import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Suggestion } from "../types";

export const suggestionPluginKey = new PluginKey<DecorationSet>("suggestionHighlight");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    suggestionHighlight: {
      /** Replaces the set of active suggestions rendered as inline highlights. */
      setSuggestions: (suggestions: Suggestion[]) => ReturnType;
    };
  }
}

/**
 * Builds decorations for the current document by locating each suggestion's
 * `text` inside the document's text nodes.
 *
 * We deliberately search for the literal text rather than trusting the
 * `position` offsets from the AI backend: those offsets are computed against
 * a plain-text snapshot (`editor.getText()`), which can drift from live
 * ProseMirror node positions as the user keeps typing. A substring search is
 * more resilient for an MVP and avoids mis-highlighting the wrong span.
 */
function buildDecorations(doc: ProseMirrorNode, suggestions: Suggestion[]): DecorationSet {
  const decorations: Decoration[] = [];

  for (const suggestion of suggestions) {
    if (!suggestion.text.trim()) continue;

    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      const index = node.text.indexOf(suggestion.text);
      if (index === -1) return;

      const from = pos + index;
      const to = from + suggestion.text.length;
      decorations.push(
        Decoration.inline(from, to, {
          class: `suggestion-highlight suggestion-highlight--${suggestion.type}`,
          "data-suggestion-id": suggestion.id,
        }),
      );
    });
  }

  return DecorationSet.create(doc, decorations);
}

/**
 * TipTap extension that renders AI suggestions as inline decorations
 * (underlines) without altering the document content. Clicking a decorated
 * span is handled by the host component (see `DocumentEditor`), which reads
 * `data-suggestion-id` off the clicked element.
 */
export const SuggestionHighlight = Extension.create({
  name: "suggestionHighlight",

  addCommands() {
    return {
      setSuggestions:
        (suggestions: Suggestion[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(suggestionPluginKey, suggestions);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: suggestionPluginKey,
        state: {
          init: (_, { doc }) => buildDecorations(doc, []),
          apply(tr, old, _oldState, newState) {
            const meta = tr.getMeta(suggestionPluginKey) as Suggestion[] | undefined;
            if (meta) {
              return buildDecorations(newState.doc, meta);
            }
            if (tr.docChanged) {
              return old.map(tr.mapping, tr.doc);
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
