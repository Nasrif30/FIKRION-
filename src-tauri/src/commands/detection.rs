use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;
use reqwest::Client;
use sha2::{Sha256, Digest};
use sysinfo::System;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Detection {
    pub id: String,
    pub timestamp: String,
    pub title: String,
    pub severity: String, // "critical" | "high" | "medium" | "low"
    pub process: String,
    pub pid: u32,
    pub confidence: u8,
    pub mitre_techniques: Vec<String>,
    pub malware_family: Option<String>,
    pub status: String, // "active" | "investigating" | "resolved"
    pub description: String,
}

// Retain a static function just for initial loading if needed, or we can just return empty.
#[tauri::command]
pub async fn get_detections() -> Result<Vec<Detection>, String> {
    // In Phase 2, this returns an empty array initially since we scan on-demand.
    Ok(vec![])
}

#[tauri::command]
pub async fn get_threat_score() -> Result<u8, String> {
    Ok(0)
}

fn hash_file(path: &str) -> Result<String, std::io::Error> {
    let bytes = std::fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    Ok(format!("{:x}", hasher.finalize()))
}

#[tauri::command]
pub async fn scan_active_processes(api_key: String) -> Result<Vec<Detection>, String> {
    if api_key.is_empty() {
        return Err("VirusTotal API Key is missing. Add it in Settings.".to_string());
    }

    let mut sys = System::new();
    // Refresh all processes to get CPU usage
    sys.refresh_processes_specifics(
        sysinfo::ProcessesToUpdate::All,
        sysinfo::ProcessRefreshKind::new().with_cpu(),
    );

    // Give the system a brief moment to measure CPU usage deltas
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    sys.refresh_processes_specifics(
        sysinfo::ProcessesToUpdate::All,
        sysinfo::ProcessRefreshKind::new().with_cpu(),
    );

    let mut procs: Vec<_> = sys.processes().values().collect();
    // Sort by CPU usage descending
    procs.sort_by(|a, b| b.cpu_usage().partial_cmp(&a.cpu_usage()).unwrap_or(std::cmp::Ordering::Equal));

    // Take top 4 unique executable paths to hash (due to VT 4/min limit)
    let mut to_scan = Vec::new();
    let mut seen_paths = std::collections::HashSet::new();

    for p in procs {
        if to_scan.len() >= 4 { break; }
        if let Some(exe) = p.exe() {
            let path_str = exe.to_string_lossy().to_string();
            // Skip empty or inaccessible paths
            if path_str.is_empty() { continue; }
            if seen_paths.insert(path_str.clone()) {
                if let Ok(hash) = hash_file(&path_str) {
                    to_scan.push((p.pid().as_u32(), p.name().to_string_lossy().to_string(), hash));
                }
            }
        }
    }

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
        
    let mut detections = Vec::new();

    for (pid, name, hash) in to_scan {
        let url = format!("https://www.virustotal.com/api/v3/files/{}", hash);
        let resp = match client.get(&url).header("x-apikey", &api_key).send().await {
            Ok(r) => r,
            Err(_) => continue, // Network error
        };

        if resp.status().is_success() {
            let data: serde_json::Value = resp.json().await.unwrap_or_default();
            if let Some(stats) = data["data"]["attributes"]["last_analysis_stats"].as_object() {
                let malicious = stats.get("malicious").and_then(|v| v.as_u64()).unwrap_or(0);
                let suspicious = stats.get("suspicious").and_then(|v| v.as_u64()).unwrap_or(0);
                
                if malicious > 0 || suspicious > 0 {
                    let confidence = std::cmp::min((malicious * 10 + suspicious * 5) as u8, 100);
                    let severity = if malicious > 5 { "critical" } else if malicious > 0 { "high" } else { "medium" };
                    
                    detections.push(Detection {
                        id: Uuid::new_v4().to_string(),
                        timestamp: Utc::now().to_rfc3339(),
                        title: format!("VT Flagged: {} ({} flags)", name, malicious + suspicious),
                        severity: severity.to_string(),
                        process: name,
                        pid,
                        confidence,
                        mitre_techniques: vec![],
                        malware_family: None,
                        status: "active".to_string(),
                        description: format!("VirusTotal scan found {} malicious and {} suspicious vendors flagging this executable hash.", malicious, suspicious),
                    });
                }
            }
        }
    }

    Ok(detections)
}
