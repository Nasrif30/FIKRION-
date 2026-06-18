// FIKRION Simulated Events
// Phase 1: File/registry/network events are simulated with realistic data.
// Phase 3 will replace this with real ETW (Event Tracing for Windows) hooks.
//
// Why simulate? Real ETW requires a kernel driver or elevated privileges +
// complex async event processing. Simulation lets us prove the UI/AI layer first.

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemEvent {
    pub id: String,
    pub timestamp: String,
    pub event_type: String, // "file", "registry", "network", "process", "memory"
    pub description: String,
    pub process: String,
    pub pid: u32,
    pub risk_score: u8,
    pub details: serde_json::Value,
}

static EVENT_POOL: &[(&str, &str, &str, u8, &str)] = &[
    ("file", "chrome.exe", "File read: C:\\Users\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cookies", 10, "cookie_access"),
    ("network", "svchost.exe", "DNS query: api.windows.com", 5, "windows_telemetry"),
    ("file", "explorer.exe", "File created: C:\\Users\\Downloads\\setup.exe", 45, "download"),
    ("registry", "powershell.exe", "Registry write: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", 75, "persistence"),
    ("network", "chrome.exe", "TCP connect: 142.250.80.46:443 (google.com)", 5, "normal_traffic"),
    ("process", "cmd.exe", "Child process spawned by: explorer.exe", 55, "shell_spawn"),
    ("memory", "svchost.exe", "Memory allocation: 128MB executable region", 20, "mem_alloc"),
    ("file", "python.exe", "File write: C:\\Temp\\output.log", 15, "script_output"),
    ("network", "powershell.exe", "HTTP GET: pastebin.com/raw/abc123", 85, "suspicious_download"),
    ("registry", "msiexec.exe", "Registry read: HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", 10, "version_check"),
];

pub fn get_recent(count: usize) -> Vec<SystemEvent> {
    let now = Utc::now();

    EVENT_POOL
        .iter()
        .take(count)
        .enumerate()
        .map(|(i, (etype, proc, desc, risk, _tag))| SystemEvent {
            id: Uuid::new_v4().to_string(),
            timestamp: (now - chrono::Duration::seconds(i as i64 * 12)).to_rfc3339(),
            event_type: etype.to_string(),
            description: desc.to_string(),
            process: proc.to_string(),
            pid: 1000 + (i as u32 * 100),
            risk_score: *risk,
            details: serde_json::json!({ "source": "fikrion_monitor_v1" }),
        })
        .collect()
}
