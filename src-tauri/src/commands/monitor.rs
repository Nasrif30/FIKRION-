// FIKRION Commands — Monitor
// These are the Tauri IPC handlers that the React frontend calls via invoke().

use crate::monitor::{events, metrics, process};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricsResponse {
    pub metrics: metrics::SystemMetrics,
}

/// Returns real CPU, RAM, disk, and network metrics.
/// Called every 2 seconds by the Dashboard's useSystemMetrics hook.
#[tauri::command]
pub async fn get_system_metrics() -> Result<metrics::SystemMetrics, String> {
    Ok(metrics::collect())
}

/// Returns the real process list from the OS.
/// Sorted by CPU usage descending. Includes heuristic risk scores.
#[tauri::command]
pub async fn get_process_list() -> Result<Vec<process::ProcessEntry>, String> {
    Ok(process::collect())
}

/// Returns simulated system events for the Real-Time Monitor.
/// Phase 3 will replace with real ETW telemetry.
#[tauri::command]
pub async fn get_simulated_events(count: Option<usize>) -> Result<Vec<events::SystemEvent>, String> {
    Ok(events::get_recent(count.unwrap_or(10)))
}

/// Accurately checks if browsers have an active, visible window (ignores background instances).
#[tauri::command]
pub async fn get_active_browser_windows() -> Result<Vec<String>, String> {
    use std::process::Command;
    let output = Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            "(Get-Process chrome, firefox, msedge, brave -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle} | Select-Object -ExpandProperty Name) -join ','"
        ])
        .output()
        .map_err(|e| e.to_string())?;
        
    let names: Vec<String> = String::from_utf8_lossy(&output.stdout)
        .trim()
        .split(',')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();
        
    Ok(names)
}
