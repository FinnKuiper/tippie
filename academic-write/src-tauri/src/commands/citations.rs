//! Bibliography import commands.
//!
//! Implements a small, dependency-free BibTeX parser sufficient for typical
//! `.bib` exports (Zotero, Mendeley, Google Scholar). It intentionally does
//! not attempt to cover the full BibTeX grammar (e.g. `@string` macro
//! expansion, `@preamble`) — see inline TODOs for known gaps.

use std::collections::HashMap;

use crate::models::Citation;

/// Parses raw `.bib` file content into a list of [`Citation`]s.
#[tauri::command]
pub fn import_bibliography(file_content: String) -> Vec<Citation> {
    extract_entries(&file_content)
        .iter()
        .filter_map(|entry| parse_entry(entry))
        .collect()
}

/// Splits the raw file content into individual `@type{...}` entry strings by
/// tracking brace depth (so nested `{}` inside field values don't confuse
/// entry boundaries).
fn extract_entries(content: &str) -> Vec<String> {
    let mut entries = Vec::new();
    let mut depth = 0i32;
    let mut start: Option<usize> = None;
    let chars: Vec<char> = content.chars().collect();

    for (i, &c) in chars.iter().enumerate() {
        if c == '@' && depth == 0 {
            start = Some(i);
        }
        if c == '{' {
            depth += 1;
        }
        if c == '}' {
            depth -= 1;
            if depth == 0 {
                if let Some(s) = start {
                    entries.push(chars[s..=i].iter().collect());
                    start = None;
                }
            }
        }
    }

    entries
}

/// Splits `s` on top-level occurrences of `delim`, ignoring delimiters that
/// appear inside nested `{}` braces.
fn split_top_level(s: &str, delim: char) -> Vec<String> {
    let mut parts = Vec::new();
    let mut depth = 0i32;
    let mut current = String::new();

    for c in s.chars() {
        match c {
            '{' => {
                depth += 1;
                current.push(c);
            }
            '}' => {
                depth -= 1;
                current.push(c);
            }
            d if d == delim && depth == 0 => {
                if !current.trim().is_empty() {
                    parts.push(current.trim().to_string());
                }
                current = String::new();
            }
            _ => current.push(c),
        }
    }
    if !current.trim().is_empty() {
        parts.push(current.trim().to_string());
    }

    parts
}

/// Strips one or more layers of wrapping `{ }` or `" "` from a field value.
/// Used for most fields (title, journal, etc.) where nested braces carry no
/// special meaning we need to preserve.
fn strip_braces_quotes(value: &str) -> String {
    let mut s = value.trim().to_string();
    loop {
        if s.len() >= 2 && s.starts_with('{') && s.ends_with('}') {
            s = s[1..s.len() - 1].trim().to_string();
        } else if s.len() >= 2 && s.starts_with('"') && s.ends_with('"') {
            s = s[1..s.len() - 1].trim().to_string();
        } else {
            break;
        }
    }
    s
}

/// Strips exactly one layer of wrapping `{ }` or `" "` (the mandatory BibTeX
/// field delimiter). Used for the `author`/`editor` fields, where an extra
/// inner `{...}` layer is a BibTeX convention marking a literal
/// (organizational) name that should not be split into "Last, First" parts —
/// see [`format_single_author_apa`].
fn strip_outer_braces_quotes(value: &str) -> String {
    let s = value.trim();
    if s.len() >= 2 && s.starts_with('{') && s.ends_with('}') {
        return s[1..s.len() - 1].trim().to_string();
    }
    if s.len() >= 2 && s.starts_with('"') && s.ends_with('"') {
        return s[1..s.len() - 1].trim().to_string();
    }
    s.to_string()
}

/// Parses a single `@type{key, field = {value}, ...}` entry string.
fn parse_entry(entry: &str) -> Option<Citation> {
    let entry = entry.trim();
    let after_at = entry.strip_prefix('@')?;
    let brace_pos = after_at.find('{')?;
    let entry_type = after_at[..brace_pos].trim().to_lowercase();

    if matches!(entry_type.as_str(), "comment" | "string" | "preamble") {
        return None;
    }

    // Strip the entry's outer braces (opening handled by `brace_pos`, closing
    // is the entry's final character since `extract_entries` matched depth).
    let inner = after_at.get(brace_pos + 1..after_at.len().saturating_sub(1))?;
    let comma_pos = inner.find(',')?;
    let key = inner[..comma_pos].trim().to_string();
    let fields_str = &inner[comma_pos + 1..];

    let mut fields: HashMap<String, String> = HashMap::new();
    for part in split_top_level(fields_str, ',') {
        if let Some(eq_pos) = part.find('=') {
            let field_name = part[..eq_pos].trim().to_lowercase();
            let raw_value = &part[eq_pos + 1..];
            // Preserve one layer of braces for author/editor so an inner
            // `{...}` marking an organizational name survives to
            // `format_single_author_apa`.
            let value = if field_name == "author" || field_name == "editor" {
                strip_outer_braces_quotes(raw_value)
            } else {
                strip_braces_quotes(raw_value)
            };
            fields.insert(field_name, value);
        }
    }

    let author = fields
        .get("author")
        .map(|raw| format_authors_apa(raw))
        .unwrap_or_default();
    let title = fields.get("title").cloned().unwrap_or_default();
    let year = fields.get("year").cloned().unwrap_or_default();
    let source = source_for_entry(&entry_type, &fields);
    let url = fields
        .get("url")
        .cloned()
        .or_else(|| fields.get("doi").map(|doi| format!("https://doi.org/{doi}")));

    Some(Citation {
        id: key,
        author,
        title,
        year,
        source,
        entry_type: Some(entry_type),
        url,
    })
}

/// Picks the best "source" field (journal/publisher/conference) for a given
/// BibTeX entry type.
fn source_for_entry(entry_type: &str, fields: &HashMap<String, String>) -> String {
    let candidate = match entry_type {
        "article" => fields.get("journal"),
        "inproceedings" | "incollection" | "conference" => fields.get("booktitle"),
        "book" | "phdthesis" | "mastersthesis" | "techreport" => fields.get("publisher"),
        _ => None,
    };

    candidate
        .or_else(|| fields.get("publisher"))
        .or_else(|| fields.get("journal"))
        .or_else(|| fields.get("howpublished"))
        .cloned()
        .unwrap_or_default()
}

/// Converts a raw BibTeX `author` field (authors joined by " and ") into an
/// APA-style author string, e.g. "Smith, J., & Doe, A."
fn format_authors_apa(raw: &str) -> String {
    let formatted: Vec<String> = raw
        .split(" and ")
        .map(str::trim)
        .filter(|a| !a.is_empty())
        .map(format_single_author_apa)
        .collect();

    match formatted.as_slice() {
        [] => String::new(),
        [only] => only.clone(),
        [first, second] => format!("{first}, & {second}"),
        _ => {
            let (last, rest) = formatted.split_last().expect("non-empty slice");
            format!("{}, & {}", rest.join(", "), last)
        }
    }
}

/// Formats a single author name ("Last, First" or "First Last") as
/// "Last, F." (APA style, surname + initials).
fn format_single_author_apa(name: &str) -> String {
    // BibTeX sometimes wraps organizational authors in double braces, e.g.
    // "{{American Psychological Association}}" — pass those through as-is.
    if name.starts_with('{') {
        return name.trim_matches(|c| c == '{' || c == '}').to_string();
    }

    if let Some(comma_idx) = name.find(',') {
        let last = name[..comma_idx].trim();
        let first = name[comma_idx + 1..].trim();
        format!("{}, {}", last, initials_of(first))
    } else {
        let parts: Vec<&str> = name.split_whitespace().collect();
        match parts.as_slice() {
            [] => String::new(),
            [single] => single.to_string(),
            _ => {
                let (last, first_parts) = parts.split_last().expect("non-empty slice");
                format!("{}, {}", last, initials_of(&first_parts.join(" ")))
            }
        }
    }
}

/// Converts "John Michael" into "J. M."
fn initials_of(first_names: &str) -> String {
    first_names
        .split_whitespace()
        .filter_map(|part| part.chars().next())
        .map(|c| format!("{}.", c.to_uppercase()))
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_basic_article() {
        let bib = r#"
            @article{smith2020,
              author = {Smith, John and Doe, Alice},
              title = {A Great Paper},
              journal = {Journal of Things},
              year = {2020}
            }
        "#;
        let citations = import_bibliography(bib.to_string());
        assert_eq!(citations.len(), 1);
        let c = &citations[0];
        assert_eq!(c.id, "smith2020");
        assert_eq!(c.author, "Smith, J., & Doe, A.");
        assert_eq!(c.title, "A Great Paper");
        assert_eq!(c.year, "2020");
        assert_eq!(c.source, "Journal of Things");
    }

    #[test]
    fn skips_comment_entries() {
        let bib = "@comment{ignored, x = {y}}";
        let citations = import_bibliography(bib.to_string());
        assert!(citations.is_empty());
    }

    #[test]
    fn handles_organizational_author() {
        let bib = r#"
            @misc{apa2020,
              author = {{American Psychological Association}},
              title = {Publication Manual},
              year = {2020}
            }
        "#;
        let citations = import_bibliography(bib.to_string());
        assert_eq!(citations[0].author, "American Psychological Association");
    }
}
