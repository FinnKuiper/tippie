# AcademicWrite

A local-first, AI-powered academic document editor (a Word alternative) built with
**React + TypeScript + TipTap** on the frontend and **Tauri (Rust)** on the backend.
Everything runs on-device — no cloud calls, no telemetry, no accounts.

> **Status: MVP scaffold.** Rich text editing, bibliography import, and manual
> citation insertion are fully wired up. AI suggestions currently come from
> simple heuristics in Rust — see [AI backend](#ai-backend-currently-mocked)
> for how to swap in a real local LLM.

## Features

- 📝 Rich text editing (bold, italic, underline, headings, lists, tables) via [TipTap](https://tiptap.dev/)
- 📚 Import a `.bib` (BibTeX) file and browse entries in the sidebar, formatted in APA
- ➕ One-click insertion of in-text APA citations at the cursor
- ✍️ Inline grammar/clarity/style suggestions, shown as underlines you can click
- 🔍 "Check citations" scan that flags sentences which look like unsupported claims
- 🌓 Light/dark mode
- 🔌 Fully offline — the Rust backend never makes a network call

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, TypeScript (strict), TipTap, Zustand, Tailwind CSS, citation.js |
| Backend   | Tauri 2 (Rust), serde/serde_json |
| Bridge    | `@tauri-apps/api` (`invoke`) |

## Project structure

```
academic-write/
├── src/                        # React frontend
│   ├── components/
│   │   ├── DocumentEditor.tsx  # TipTap editor + toolbar + suggestion overlay
│   │   ├── CitationPanel.tsx   # Sidebar: bibliography list + citation suggestions
│   │   ├── SuggestionPopup.tsx # Floating card for a single grammar/style suggestion
│   │   └── ImportDialog.tsx    # Modal for importing a .bib file
│   ├── lib/
│   │   ├── commands.ts         # Typed wrappers around Tauri `invoke` calls
│   │   ├── apa.ts              # APA in-text / reference-list formatting
│   │   └── suggestionExtension.ts # TipTap extension rendering suggestion highlights
│   ├── store.ts                # Zustand store (document, citations, suggestions)
│   ├── types.ts                # Shared TypeScript types
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Binary entry point
│   │   ├── lib.rs              # Tauri builder + command registration
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── ai.rs           # check_sentence, find_citation_opportunities (mocked)
│   │   │   └── citations.rs    # import_bibliography (real BibTeX parser + tests)
│   │   └── models/mod.rs       # Rust structs mirroring src/types.ts
│   ├── icons/                  # Placeholder app icons (swap before shipping)
│   ├── capabilities/default.json
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── public/sample.bib           # Example bibliography you can import to try things out
├── package.json
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
└── vite.config.ts
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) + Cargo (stable toolchain; run `rustup update` if `cargo check` complains about MSRV)
- Platform build tools required by Tauri — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/) (on Windows: the MSVC C++ Build Tools and WebView2, usually already present on Windows 10/11)

## Getting started

```bash
npm install
npm run tauri:dev
```

This starts the Vite dev server and opens the app in a native Tauri window
with hot reload. First run will take a while as Cargo compiles the Rust
dependencies.

Other useful scripts:

```bash
npm run dev          # Vite dev server only (browser preview, no Tauri backend —
                      # AI/citation buttons will fail since `invoke` has nothing
                      # to talk to; use npm run tauri:dev for the full app)
npm run build         # Type-check + build the frontend bundle
npm run tauri:build   # Build a distributable native app
cd src-tauri && cargo test   # Run the BibTeX parser's unit tests
```

## Trying it out

1. Launch the app (`npm run tauri:dev`).
2. Click **Import .bib** in the right sidebar and select `public/sample.bib`.
3. Click **Insert** next to a citation to drop an APA in-text citation at your cursor.
4. Type a long or awkward sentence and pause — a wavy underline will appear;
   click it to see the suggestion and optionally apply a fix.
5. Click **Check citations** to scan the document for claims that look like they need a source.

## AI backend (currently mocked)

`src-tauri/src/commands/ai.rs` implements `check_sentence` and
`find_citation_opportunities` using plain heuristics (filler-word detection,
long-sentence detection, claim-phrase keyword matching) so the rest of the
app has real data to render against. **No model weights are bundled with
this repo.**

To wire up real local inference:

1. Add a local-LLM crate to `src-tauri/Cargo.toml` (e.g. `llama-cpp-2` or
   `llama_cpp`) behind the existing `local-llm` feature flag.
2. Load a `.gguf` model once at startup (e.g. into `tauri::Manager` state)
   and point it at a model file the user supplies — don't commit model
   weights to git (`*.gguf` is already in `.gitignore`).
3. Replace the heuristic bodies in `check_sentence` /
   `find_citation_opportunities` with prompts to the local model, parsing
   its output back into the `Suggestion` / `CitationSuggestion` structs
   already defined in `src-tauri/src/models/mod.rs`.
4. The frontend doesn't need to change — `src/lib/commands.ts` already calls
   these commands by name and expects the same response shape.

## Known limitations (MVP)

- Suggestion highlighting locates text by substring search rather than
  tracking precise document positions, so identical repeated phrases may
  highlight the first occurrence. Fine for an MVP; a production version
  should map AI-reported offsets through ProseMirror's position system.
- The BibTeX parser (`commands/citations.rs`) covers the common subset of
  BibTeX used by Zotero/Mendeley/Google Scholar exports, not the full
  grammar (e.g. `@string` macros are not expanded).
- App icons in `src-tauri/icons/` are placeholders generated for this
  scaffold — replace them before shipping a real build.

## License

MIT
