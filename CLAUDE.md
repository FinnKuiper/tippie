# How to Help with AcademicWrite Development

You are helping build **AcademicWrite**, an open-source academic document editor (Word alternative).

## QUICK REFERENCE

**Before you start:**

1. Read `agents.md` thoroughly
2. Ask clarifying questions about scope
3. Suggest improvements to the plan
4. Default to conservative/tested approaches

**When generating code:**

- Follow all rules in `agents.md` exactly
- Type everything (strict TypeScript)
- Include JSDoc comments
- Test assumptions before coding
- Suggest better approaches if you see them

## CURRENT PHASE

**MVP Phase 1:** Basic editor + bibliography import + manual citations

**In Scope:**

- Rich text editing with TipTap
- .bib file parsing and display
- Citation insertion at cursor
- Basic UI layout

**Out of Scope:**

- AI/LLM features (backend stubs only)
- Export to Word/PDF
- Collaborative editing
- Advanced formatting

## HOW TO REQUEST FEATURES

**Good request:**

> "Add a 'Cite' button to the citation panel that inserts [Author, Year] at the cursor. Should appear in CitationPanel.tsx and integrate with TipTap's insertContent method."

**Bad request:**

> "Make it better"
> "Add AI"
> "Build everything"

## HOW TO REPORT ISSUES

**Good issue report:**

Component: DocumentEditor.tsx
Problem: Editor crashes when pasting large text
Expected: Graceful handling or warning
Stack trace: [include if available]
Steps to reproduce: Paste 10MB text

**Include:**

- File/component name
- What happened vs. what should happen
- Steps to reproduce
- Error messages
- Relevant code snippets

## CONSTRAINTS TO REMEMBER

- **Offline only**: No external APIs
- **Privacy**: Nothing leaves the computer
- **Tauri-based**: Desktop app, not web
- **Type-safe**: Strict TypeScript always
- **Open source**: Code must be readable and reusable

## TESTING APPROACH

After generating a feature:

1. Does it compile without warnings?
2. Does it match the TypeScript style?
3. Are error cases handled?
4. Could it be simplified?
5. Is it tested?

## COMMON WORKFLOWS

### "Add a new component"

Request should include:

- What it displays
- What state it needs
- How it communicates with store
- Where it appears in the app

### "Fix a bug"

Include:

- Current behavior
- Expected behavior
- File/component affected
- Reproduction steps

### "Integrate new library"

Include:

- Why it's needed
- What problem it solves
- Impact on bundle/performance
- Alternative considered

### "Generate file structure"

Specify:

- Current state of project
- What's being added
- How it relates to existing code

## ESCALATION CHECKLIST

Ask me before proceeding if:

- Refactoring would affect multiple files
- Adding major new dependencies
- Changing core architecture
- Unclear if feature is in MVP scope
- Security or performance implications
- Breaking changes to existing API

## RUNNING & TESTING

**Development:**

```bash
npm run tauri dev
```

**Check:**

- App starts without errors
- No TypeScript warnings
- Editor is responsive
- Citation panel shows imported citations

## SUCCESS METRICS

Code is good if:

- ✅ Compiles without warnings
- ✅ Follows agents.md exactly
- ✅ Typed correctly (strict TS)
- ✅ Clear error handling
- ✅ Documented with JSDoc
- ✅ No console errors
- ✅ Feature works as expected
- ✅ Readable for other developers

## WHEN TO STOP

Don't:

- Add features beyond current phase
- Over-engineer solutions
- Add unnecessary libraries
- Write code that's "clever" but unclear
- Generate test files without asking
- Make UI decisions without confirming

## SUCCESS =

A new feature that:

1. Works correctly
2. Follows all style rules
3. Includes proper documentation
4. Integrates smoothly
5. Doesn't break existing code
6. Is tested
7. Is ready to commit

---

**If stuck:** Ask me for clarification rather than guessing.
