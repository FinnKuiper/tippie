# AcademicWrite: AI Programming Guide

This document helps AI assistants (Claude, etc.) understand the project context, constraints, and best practices to generate high-quality, consistent code.

## PROJECT CONTEXT

**Project Name**: AcademicWrite
**Description**: Open-source academic document editor with local AI-powered suggestions
**Type**: Tauri desktop app (Rust backend + React frontend)
**Status**: MVP phase - building core scaffold

## CORE PRINCIPLES

1. **Offline-first**: No cloud dependencies, all processing local
2. **Privacy**: Zero data leaves the machine
3. **Type-safe**: Strict TypeScript, no `any` types
4. **Modular**: Each component has single responsibility
5. **Open source**: Code must be readable and well-documented
6. **Performance**: Keep React renders efficient, Rust async where possible

## TECH STACK SPECIFICATIONS

### Frontend (React)

- **Framework**: React 18 with TypeScript (strict mode)
- **Editor**: TipTap (NOT Monaco, NOT code-focused)
- **State**: Zustand (not Context, not Redux)
- **Styling**: Tailwind CSS (no CSS modules, no styled-components)
- **APIs**: @tauri-apps/api for backend communication
- **Citations**: Citation.js library for parsing

### Backend (Tauri + Rust)

- **Framework**: Tauri 1.x (or latest stable)
- **Language**: Rust (strict safety)
- **Async**: tokio runtime
- **Serialization**: serde + serde_json (always derive traits)
- **LLM**: llama-cpp-rs (stub for now, real implementation later)
- **No**: No external HTTP servers, no shell commands

## TYPESCRIPT RULES

```typescript
// ✅ GOOD
interface Citation {
  id: string
  author: string
  title: string
  year: number
}

type Suggestion = {
  id: string
  type: 'grammar' | 'clarity' | 'style'
  message: string
}

// ❌ BAD
const data: any = ...
let result = ... // inferred type
interface Citation { [key: string]: any }
```

**Requirements:**

- All function parameters must have type annotations
- All function return types must be explicit
- No implicit `any` types
- Use discriminated unions for complex types
- Export types from `types.ts` file only

## COMPONENT ARCHITECTURE

### Frontend Structure

components/
├── DocumentEditor.tsx # Main editor (TipTap integration)
├── CitationPanel.tsx # Sidebar citation list
├── SuggestionPopup.tsx # Suggestions overlay/popover
├── ImportDialog.tsx # .bib file import
└── Editor/
├── extensions/
│ └── CitationExtension.ts # Custom TipTap extension
└── utils/
└── formatting.ts # APA formatting helpers

**Component Rules:**

- Use functional components with hooks only
- Max 300 lines per component
- Extract complex logic to custom hooks
- Prop drilling max 2 levels (use Zustand for deeper)
- All props must be typed with interfaces
- Use React.memo for expensive renders
- Always include error boundaries for critical sections

### Store (Zustand) Structure

```typescript
// store.ts - Single Zustand store
interface EditorState {
  // State
  documentContent: string;
  citations: Citation[];
  suggestions: Suggestion[];
  selectedCitationId: string | null;
  isLoading: boolean;

  // Actions
  setDocumentContent: (content: string) => void;
  addCitations: (citations: Citation[]) => void;
  addSuggestions: (suggestions: Suggestion[]) => void;
  clearSuggestions: () => void;

  // Computed
  getSelectedCitation: () => Citation | undefined;
}
```

**Rules:**

- Single store only (not multiple stores)
- Actions are methods on the store
- No complex derived state in store (use selectors)
- Async operations done in components, not store

## RUST BACKEND RULES

### Module Organization

src-tauri/src/
├── main.rs # Tauri setup, window creation
├── commands/
│ ├── mod.rs # Public API exports
│ ├── ai.rs # AI-related commands
│ └── citations.rs # Bibliography commands
└── models/
└── mod.rs # Shared types

### Command Guidelines

```rust
// ✅ GOOD - Always return Result, proper error handling
#[tauri::command]
async fn check_sentence(
    sentence: String,
) -> Result<Vec<Suggestion>, String> {
    validate_input(&sentence)?;
    let suggestions = process_sentence(&sentence)?;
    Ok(suggestions)
}

// ❌ BAD - Panics, no error handling, improper types
#[tauri::command]
fn check_sentence(text: &str) -> Vec<Map<String, Value>> {
    let result = ai_process(text).unwrap();
    result
}
```

**Requirements:**

- All commands must be `async`
- Return `Result<T, String>` for error handling
- Use `#[serde(rename_all = "camelCase")]` for JSON conversion
- Document with doc comments `///`
- Validate inputs before processing
- No unwrap() or panic!() in commands

### Serialization Pattern

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
    pub id: String,
    pub author: String,
    pub title: String,
    pub year: i32,
}

// For responses
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}
```

## TAURI IPC PATTERNS

### Frontend → Backend Communication

```typescript
// ✅ GOOD - Typed, error handling, debouncing
const checkSentence = async (sentence: string) => {
  try {
    const result: SuggestionResponse = await invoke("check_sentence", {
      sentence,
    });
    store.addSuggestions(result.suggestions);
  } catch (error) {
    console.error("Sentence check failed:", error);
    // User feedback
  }
};

// Use debouncing for frequent calls
const debouncedCheck = useMemo(() => debounce(checkSentence, 1000), []);
```

**Rules:**

- Always type the response: `await invoke<ResponseType>(...)`
- Wrap in try-catch
- Debounce frequent operations
- Show loading state during async operations
- Never block UI on backend calls
- Timeout long-running operations

## FILE NAMING CONVENTIONS

TypeScript/React:

Components: PascalCase.tsx (DocumentEditor.tsx)
Hooks: camelCase.ts (useCitations.ts)
Utils: camelCase.ts (formatAPA.ts)
Types: index.ts or types.ts
Stores: store.ts or lowercase-domain.ts

Rust:

Modules: snake_case.rs (ai_commands.rs)
Types: PascalCase in code, snake_case filenames
Tests: filename_test.rs or in mod.rs

## ERROR HANDLING

### Frontend Pattern

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof TauriError) {
    // Handle Tauri-specific errors
  } else if (error instanceof TypeError) {
    // Handle type errors
  } else {
    // Generic fallback
  }
  // Always show user feedback
}
```

### Rust Pattern

```rust
fn operation() -> Result<Output, String> {
    let data = some_operation()
        .map_err(|e| format!("Operation failed: {}", e))?;
    Ok(data)
}
```

## DOCUMENTATION REQUIREMENTS

Every function must have:

```typescript
/**
 * Processes a sentence and returns suggestions
 * @param sentence - Raw text to analyze
 * @returns Array of grammar/clarity/style suggestions
 * @throws Will reject if sentence is empty
 */
export const checkSentence = async (
  sentence: string,
): Promise<Suggestion[]> => {
  // ...
};
```

## TESTING EXPECTATIONS

- New features must include basic tests
- Use Jest for React component tests
- Use #[test] for Rust unit tests
- Mock external dependencies
- Test error cases, not just happy path
- No untested async operations

## PERFORMANCE REQUIREMENTS

### React

- Editor updates should be < 16ms (60fps)
- Suggestions debounced to 500-1000ms
- Citation panel virtualized if > 100 items
- Use React.memo for static components

### Rust

- Commands should complete within 5 seconds
- Async operations for all I/O
- No blocking in event loop
- Cache parsed citations in memory

## COMMON PITFALLS TO AVOID

### Frontend

- ❌ Creating store in component render
- ❌ Not debouncing frequent Tauri calls
- ❌ Mutating objects in Zustand store
- ❌ Props with 5+ boolean flags (use config object)
- ❌ Inline component definitions in render

### Backend

- ❌ Blocking operations in async context
- ❌ Unwrapping Result without handling
- ❌ String errors without context
- ❌ Cloning large data structures
- ❌ Hardcoding paths or configs

## GIT COMMIT CONVENTIONS

feat: Add citation suggestion UI
fix: Resolve TipTap extension memory leak
docs: Update API documentation
refactor: Simplify suggestion algorithm
style: Format code with Prettier
test: Add tests for sentence checker
chore: Update dependencies

## WHEN TO ASK FOR HELP

AI should **NOT** proceed and should ask for clarification when:

1. Unclear if feature fits MVP scope
2. Multiple valid architectural approaches exist
3. Optimization needed (premature optimization question)
4. Breaking changes to existing components
5. Third-party library conflicts
6. UX design decisions

## PHASING STRATEGY

**Phase 1 (Current):** Basic scaffold + manual citation insertion
**Phase 2:** Add sentence suggestions backend
**Phase 3:** Add citation opportunity detection
**Phase 4:** Export to Word/PDF
**Phase 5:** Collaborative editing (future)

Only generate code for current phase.

## PROJECT STRUCTURE RULES

✅ DO:

Keep related files in same folder
Export from index.ts in folders
One major feature per branch
Small focused commits
Keep dependencies minimal

❌ DON'T:

Create files without folder structure
Circular imports
Mixed concerns in single file
Large monolithic files
Add dependencies without justification

## DEPENDENCY GUIDELINES

Before adding a dependency:

- Is it actively maintained?
- Does it align with tech stack?
- Check bundle size impact
- Prefer well-known libraries
- Document why it was added in comments

**Current approved libraries:**

```json
{
  "@tiptap/*": "Rich text editing",
  "@citation-js/core": "Bibliography parsing",
  "zustand": "State management",
  "@tauri-apps/api": "Desktop integration",
  "tailwindcss": "Styling",
  "typescript": "Type safety"
}
```

## FINAL CHECKLIST FOR AI

Before generating code, verify:

- [ ] Follows TypeScript strict mode
- [ ] All types are explicit (no `any`)
- [ ] Error handling in place
- [ ] Follows naming conventions
- [ ] Includes JSDoc/comments
- [ ] No external dependencies added without mention
- [ ] Rust code uses Result<T, String>
- [ ] All Tauri commands are async
- [ ] Frontend debounces heavy operations
- [ ] Code is testable
- [ ] Breaking changes documented
