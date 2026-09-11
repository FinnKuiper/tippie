//! Document file I/O commands: save and open `.awrite` files.
//!
//! Scope note (Phase 1 — core save/load): "New Document" needs no backend
//! command (it just resets frontend state), and "Save As" is handled by the
//! frontend calling [`save_document`] with a new path and then updating its
//! own `currentFilePath` — a dedicated `save_document_as` command would just
//! duplicate this one. Recent-documents persistence and auto-save are
//! Phase 2, per `AGENTS.md`'s phasing rule and the feature checklist.

use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use tokio::fs;

use crate::models::{DocumentError, SavedDocument};

/// Maps a [`std::io::Error`] to a [`DocumentError`] with a stable `code` and
/// a user-friendly message, preserving the path for context.
fn io_error(err: std::io::Error, path: &str) -> DocumentError {
    let code = match err.kind() {
        ErrorKind::NotFound => "FILE_NOT_FOUND",
        ErrorKind::PermissionDenied => "PERMISSION_DENIED",
        _ => "IO_ERROR",
    };
    let message = match err.kind() {
        ErrorKind::NotFound => format!("File not found: {path}"),
        ErrorKind::PermissionDenied => format!("Permission denied writing to: {path}"),
        _ => format!("Could not access {path}: {err}"),
    };
    DocumentError {
        code: code.to_string(),
        message,
        path: Some(path.to_string()),
    }
}

/// Writes `document` to `file_path` as pretty-printed JSON, creating any
/// missing parent directories first. Overwrites an existing file at that
/// path silently (used for both "Save" and "Save As").
#[tauri::command]
pub async fn save_document(file_path: String, document: SavedDocument) -> Result<(), DocumentError> {
    if file_path.trim().is_empty() {
        return Err(DocumentError {
            code: "INVALID_PATH".to_string(),
            message: "No file path was provided.".to_string(),
            path: None,
        });
    }

    let path = PathBuf::from(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| io_error(e, &file_path))?;
        }
    }

    let json = serde_json::to_string_pretty(&document).map_err(|e| DocumentError {
        code: "SERIALIZE_FAILED".to_string(),
        message: format!("Failed to serialize document: {e}"),
        path: Some(file_path.clone()),
    })?;

    fs::write(&path, json).await.map_err(|e| io_error(e, &file_path))
}

/// Reads and parses a `.awrite` file from disk.
#[tauri::command]
pub async fn open_document(file_path: String) -> Result<SavedDocument, DocumentError> {
    let path: &Path = Path::new(&file_path);
    let raw = fs::read_to_string(path).await.map_err(|e| io_error(e, &file_path))?;

    serde_json::from_str::<SavedDocument>(&raw).map_err(|e| DocumentError {
        code: "INVALID_FORMAT".to_string(),
        message: format!("This file isn't a valid AcademicWrite document: {e}"),
        path: Some(file_path.clone()),
    })
}
