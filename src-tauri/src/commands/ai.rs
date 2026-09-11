//! AI-assisted writing commands.
//!
//! TODO(local-llm): This module currently returns heuristic / mock results so
//! the rest of the app has something real to render against. Replace the
//! bodies of `check_sentence` and `find_citation_opportunities` with calls
//! into a local GGUF model via `llama-cpp-2` (or `llama_cpp`), loaded once at
//! startup and shared through Tauri's managed state. Suggested shape:
//!
//! ```ignore
//! struct LlmState(Mutex<Option<LlamaModel>>);
//! // .manage(LlmState::default()) in main.rs, then accept `State<LlmState>`
//! // in these command handlers instead of computing heuristics inline.
//! ```
//!
//! No model weights are bundled with this repo — see `README.md` for how to
//! point the app at a local .gguf file once inference is implemented.

use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::{CitationSuggestion, Suggestion, SuggestionType, TextPosition};

/// Generates a reasonably unique id for a suggestion, e.g. "sugg-1699999999123-4".
fn generate_id(prefix: &str, salt: usize) -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{prefix}-{nanos}-{salt}")
}

const FILLER_WORDS: &[&str] = &["very", "really", "just", "actually", "basically", "literally"];

/// Checks a single sentence and returns grammar/clarity/style suggestions.
///
/// TODO(local-llm): swap this heuristic implementation for a prompt to the
/// local model asking it to identify grammar issues, unclear phrasing, and
/// style improvements, returning structured JSON matching `Suggestion`.
#[tauri::command]
pub fn check_sentence(sentence: String) -> Vec<Suggestion> {
    let trimmed = sentence.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }

    let mut suggestions = Vec::new();
    let mut salt = 0usize;

    // Heuristic: flag accidental double spaces (clarity).
    if trimmed.contains("  ") {
        suggestions.push(Suggestion {
            id: generate_id("sugg", salt),
            suggestion_type: SuggestionType::Clarity,
            text: trimmed.to_string(),
            replacement: Some(trimmed.split_whitespace().collect::<Vec<_>>().join(" ")),
            position: TextPosition { from: 0, to: trimmed.len() as u32 },
            message: "This sentence contains repeated spaces. Consider tidying up spacing."
                .to_string(),
        });
        salt += 1;
    }

    // Heuristic: flag overly long sentences (style).
    let word_count = trimmed.split_whitespace().count();
    if word_count > 40 {
        suggestions.push(Suggestion {
            id: generate_id("sugg", salt),
            suggestion_type: SuggestionType::Style,
            text: trimmed.to_string(),
            replacement: None,
            position: TextPosition { from: 0, to: trimmed.len() as u32 },
            message: format!(
                "This sentence is {word_count} words long. Consider splitting it into shorter sentences for readability."
            ),
        });
        salt += 1;
    }

    // Heuristic: flag filler words (style).
    for word in FILLER_WORDS {
        if let Some(idx) = trimmed.to_lowercase().find(&format!(" {word} ")) {
            suggestions.push(Suggestion {
                id: generate_id("sugg", salt),
                suggestion_type: SuggestionType::Style,
                text: word.to_string(),
                replacement: Some(String::new()),
                position: TextPosition { from: idx as u32, to: (idx + word.len()) as u32 },
                message: format!("Consider removing the filler word \"{word}\" for a more concise, academic tone."),
            });
            salt += 1;
        }
    }

    // Heuristic: flag sentences missing terminal punctuation (grammar).
    if !trimmed.ends_with(['.', '!', '?', '"', '\'']) {
        suggestions.push(Suggestion {
            id: generate_id("sugg", salt),
            suggestion_type: SuggestionType::Grammar,
            text: trimmed.to_string(),
            replacement: Some(format!("{trimmed}.")),
            position: TextPosition { from: 0, to: trimmed.len() as u32 },
            message: "This sentence appears to be missing terminal punctuation.".to_string(),
        });
    }

    suggestions
}

const CLAIM_PHRASES: &[&str] = &[
    "studies show",
    "research suggests",
    "it is well known",
    "according to",
    "evidence suggests",
    "experts agree",
];

/// Scans a block of text for sentences that look like unsupported claims and
/// would likely benefit from a citation.
///
/// TODO(local-llm): swap this keyword heuristic for a local-model pass that
/// (1) classifies sentences as factual claims vs. opinion/narration, and
/// (2) ranks `authors` (or better, full `Citation`s) by topical relevance to
/// suggest specific sources, rather than leaving `suggested_citation_ids` empty.
#[tauri::command]
pub fn find_citation_opportunities(text: String, authors: Vec<String>) -> Vec<CitationSuggestion> {
    let _ = &authors; // Reserved for future relevance ranking against known authors.

    let mut suggestions = Vec::new();
    let mut cursor = 0usize;

    for sentence in text.split_inclusive(['.', '!', '?']) {
        let start = cursor;
        cursor += sentence.len();
        let trimmed = sentence.trim();
        if trimmed.is_empty() {
            continue;
        }

        let lower = trimmed.to_lowercase();
        let already_cited = trimmed.contains('(') && trimmed.contains(')');
        let looks_like_claim = CLAIM_PHRASES.iter().any(|phrase| lower.contains(phrase));

        if looks_like_claim && !already_cited {
            suggestions.push(CitationSuggestion {
                id: generate_id("cite-sugg", suggestions.len()),
                position: TextPosition { from: start as u32, to: cursor as u32 },
                text: trimmed.to_string(),
                reason: "This sentence makes a claim that typically requires a supporting citation."
                    .to_string(),
                suggested_citation_ids: Vec::new(),
            });
        }
    }

    suggestions
}
