// FIKRION System Metrics
// Real CPU, RAM, disk, and network data via sysinfo.

use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, Networks, RefreshKind, System};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_used_gb: f64,
    pub memory_total_gb: f64,
    pub memory_percent: f32,
    pub disk_used_gb: f64,
    pub disk_total_gb: f64,
    pub disk_percent: f32,
    pub network_rx_kb: f64,
    pub network_tx_kb: f64,
    pub uptime_seconds: u64,
}

pub fn collect() -> SystemMetrics {
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );

    // sysinfo requires two refresh calls for accurate CPU %
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_usage();

    let memory_used = sys.used_memory();
    let memory_total = sys.total_memory();
    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    let disks = Disks::new_with_refreshed_list();
    let (disk_used, disk_total) = disks.iter().fold((0u64, 0u64), |(used, total), d| {
        (
            used + (d.total_space() - d.available_space()),
            total + d.total_space(),
        )
    });
    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    let networks = Networks::new_with_refreshed_list();
    let (rx, tx) = networks.iter().fold((0u64, 0u64), |(rx, tx), (_, data)| {
        (rx + data.received(), tx + data.transmitted())
    });

    SystemMetrics {
        cpu_usage,
        memory_used_gb: memory_used as f64 / 1_073_741_824.0,
        memory_total_gb: memory_total as f64 / 1_073_741_824.0,
        memory_percent,
        disk_used_gb: disk_used as f64 / 1_073_741_824.0,
        disk_total_gb: disk_total as f64 / 1_073_741_824.0,
        disk_percent,
        network_rx_kb: rx as f64 / 1024.0,
        network_tx_kb: tx as f64 / 1024.0,
        uptime_seconds: System::uptime(),
    }
}
