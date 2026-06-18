import { invoke } from '@tauri-apps/api/core';
import type { SystemMetrics, ProcessEntry, SystemEvent } from '@/stores/systemStore';

/** Fetch real CPU/RAM/disk/network from Rust backend */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const raw = await invoke<Record<string, number>>('get_system_metrics');
  return {
    cpuUsage: raw.cpu_usage,
    memoryUsedGb: raw.memory_used_gb,
    memoryTotalGb: raw.memory_total_gb,
    memoryPercent: raw.memory_percent,
    diskUsedGb: raw.disk_used_gb,
    diskTotalGb: raw.disk_total_gb,
    diskPercent: raw.disk_percent,
    networkRxKb: raw.network_rx_kb,
    networkTxKb: raw.network_tx_kb,
    uptimeSeconds: raw.uptime_seconds,
  };
}

/** Fetch real process list from the OS */
export async function getProcessList(): Promise<ProcessEntry[]> {
  const raw = await invoke<Array<Record<string, unknown>>>('get_process_list');
  return raw.map((p) => ({
    pid: p.pid as number,
    name: p.name as string,
    cpuPercent: p.cpu_percent as number,
    memoryMb: p.memory_mb as number,
    status: p.status as string,
    riskScore: p.risk_score as number,
    parentPid: p.parent_pid as number | undefined,
  }));
}

/** Fetch simulated event feed */
export async function getSystemEvents(count = 10): Promise<SystemEvent[]> {
  const raw = await invoke<Array<Record<string, unknown>>>('get_simulated_events', { count });
  return raw.map((e) => ({
    id: e.id as string,
    timestamp: e.timestamp as string,
    eventType: e.event_type as string,
    description: e.description as string,
    process: e.process as string,
    pid: e.pid as number,
    riskScore: e.risk_score as number,
  }));
}
