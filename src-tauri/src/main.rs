// FIKRION — Tauri v2 Entry Point
// Security note: windows_subsystem = "windows" hides the console in release builds
// to prevent information leakage via console output.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    fikrion::run()
}
