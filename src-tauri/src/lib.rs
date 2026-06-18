// FIKRION — Rust Library Root
// Clean Architecture: commands/ is the IPC layer, internal modules are the domain.

mod commands;
mod monitor;
mod ai;
mod db;

pub use monitor::*;

/// Application entry point called from main.rs.
/// We register all Tauri IPC commands here so they are
/// callable from the React frontend via `invoke()`.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize the SQLite database on startup
    db::init().expect("Failed to initialize FIKRION database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // System monitoring — real data from sysinfo
            commands::monitor::get_system_metrics,
            commands::monitor::get_process_list,
            commands::monitor::get_simulated_events,
            commands::monitor::get_active_browser_windows,
            // AI engine — auto-detect Ollama, fallback to cloud
            commands::ai::check_ollama,
            commands::ai::get_ollama_models,
            commands::ai::send_message,
            commands::ai::get_session_stats,
            commands::ai::check_mcp_server,
            // Detection engine
            commands::detection::get_detections,
            commands::detection::get_threat_score,
            commands::detection::scan_active_processes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FIKRION");
}
