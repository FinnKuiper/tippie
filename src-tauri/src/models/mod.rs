//! Shared data structures passed between the Rust backend and the React
//! frontend. Field names are serialized as camelCase to match the
//! TypeScript types in `src/types.ts` — keep the two files in sync.

use serde::{Deserialize, Serialize};

/// A single bibliography entry imported from a .bib file.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
    /// Stable unique id (bibtex citation key, e.g. "smith2020").
    pub id: String,
    /// Author string, e.g. "Smith, J., & Doe, A."
    pub author: String,
    pub title: String,
    pub year: String,
    /// Journal, publisher, or conference name.
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entry_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

/// Category of an AI-generated writing suggestion.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SuggestionType {
    Grammar,
    Clarity,
    Style,
    Citation,
}

/// Position of a suggestion within the plain-text content of the document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextPosition {
    pub from: u32,
    pub to: u32,
}

/// A single AI-generated suggestion attached to a span of text.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
    pub id: String,
    #[serde(rename = "type")]
    pub suggestion_type: SuggestionType,
    /// The original text the suggestion refers to.
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replacement: Option<String>,
    pub position: TextPosition,
    /// Human-readable explanation shown to the user.
    pub message: String,
}

/// A suggestion that a citation is likely needed near a given span of text.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CitationSuggestion {
    pub id: String,
    pub position: TextPosition,
    pub text: String,
    pub reason: String,
    /// Citation ids from the bibliography that could plausibly support this claim.
    pub suggested_citation_ids: Vec<String>,
}

/// Timestamps and title for a saved `.awrite` document.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentMetadata {
    pub title: String,
    /// ISO 8601 timestamp set once, when the document is first saved.
    pub created_at: String,
    /// ISO 8601 timestamp, updated on every save.
    pub last_modified: String,
}

/// The document body, in the formats the frontend needs.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentBody {
    /// TipTap's HTML serialization — the source of truth.
    pub html: String,
    /// Markdown rendering of `html`.
    ///
    /// TODO(export): currently always empty. Populating this needs an
    /// HTML→Markdown conversion (e.g. a `turndown`-equivalent crate/JS lib),
    /// which is a new dependency out of scope for Phase 1 document save/load.
    /// Real markdown/Word/PDF export is a later phase per `AGENTS.md`.
    pub markdown: String,
}

/// On-disk representation of a `.awrite` file: editor content, metadata, and
/// a snapshot of the bibliography used by the document.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedDocument {
    /// File format version, for forward compatibility. Currently always "1.0".
    pub version: String,
    pub metadata: DocumentMetadata,
    pub content: DocumentBody,
    pub bibliography: Vec<Citation>,
}

/// Structured error returned by document file-I/O commands, so the frontend
/// can branch on `code` (e.g. to word the message differently) without
/// parsing a free-text string.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentError {
    /// Stable machine-readable reason: "FILE_NOT_FOUND", "PERMISSION_DENIED",
    /// "INVALID_FORMAT", "IO_ERROR", or "SERIALIZE_FAILED".
    pub code: String,
    /// Human-readable, user-facing explanation.
    pub message: String,
    /// The file path involved, if any.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

impl std::fmt::Display for DocumentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.message, self.code)
    }
}

impl std::error::Error for DocumentError {}
