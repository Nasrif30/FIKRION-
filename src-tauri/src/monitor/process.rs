// FIKRION Process Monitor
// Real process list from the operating system via sysinfo.
// We expose PID, name, CPU%, memory, status, and a computed risk score.

use serde::{Deserialize, Serialize};
use sysinfo::{ProcessRefreshKind, RefreshKind, System};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessEntry {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub memory_mb: f64,
    pub status: String,
    pub risk_score: u8, // 0-100, computed heuristically
    pub parent_pid: Option<u32>,
}

/// Known high-risk process names (heuristic only — not a detection engine)
const SUSPICIOUS_NAMES: &[&str] = &[
    "powershell", "cmd", "wscript", "cscript", "mshta", "regsvr32",
    "rundll32", "certutil", "bitsadmin", "curl", "wget",
];

fn compute_risk(name: &str, _cpu: f32) -> u8 {
    let name_lower = name.to_lowercase();
    let name_base = name_lower
        .trim_end_matches(".exe")
        .trim_end_matches(".com");

    if SUSPICIOUS_NAMES.iter().any(|s| name_base.contains(s)) {
        35 // Elevated baseline for dual-use tools
    } else {
        5 // Default low risk for known system processes
    }
}

pub fn collect() -> Vec<ProcessEntry> {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_processes(ProcessRefreshKind::everything()),
    );
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_all();

    let mut processes: Vec<ProcessEntry> = sys
        .processes()
        .iter()
        .map(|(pid, proc)| {
            let name = proc.name().to_string_lossy().to_string();
            let cpu = proc.cpu_usage();
            ProcessEntry {
                pid: pid.as_u32(),
                name: name.clone(),
                cpu_percent: cpu,
                memory_mb: proc.memory() as f64 / 1_048_576.0,
                status: format!("{:?}", proc.status()),
                risk_score: compute_risk(&name, cpu),
                parent_pid: proc.parent().map(|p| p.as_u32()),
            }
        })
        .collect();

    // Sort by CPU desc for a useful default view
    processes.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap_or(std::cmp::Ordering::Equal));
    processes
}
