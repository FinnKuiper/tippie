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
