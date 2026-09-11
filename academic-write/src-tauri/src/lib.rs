//! AcademicWrite Tauri application: window setup and command registration.
//!
//! Split into `lib.rs` (this file, the reusable entry point) and a thin
//! `main.rs` so the app can also be built for mobile targets in the future,
//! per the standard Tauri v2 project layout.

mod commands;
mod models;

/// Builds and runs the Tauri application.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::citations::import_bibliography,
            commands::ai::check_sentence,
            commands::ai::find_citation_opportunities,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AcademicWrite");
}
