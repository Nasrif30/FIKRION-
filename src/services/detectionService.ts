import { invoke } from '@tauri-apps/api/core';
import type { Detection } from '@/stores/threatStore';

interface RawDetection {
  id: string; timestamp: string; title: string; severity: string;
  process: string; pid: number; confidence: number;
  mitre_techniques: string[]; malware_family?: string;
  status: string; description: string;
}

export async function getDetections(): Promise<Detection[]> {
  const raw = await invoke<RawDetection[]>('get_detections');
  return raw.map((d) => ({
    id: d.id, timestamp: d.timestamp, title: d.title,
    severity: d.severity as Detection['severity'],
    process: d.process, pid: d.pid, confidence: d.confidence,
    mitreTechniques: d.mitre_techniques,
    malwareFamily: d.malware_family,
    status: d.status as Detection['status'],
    description: d.description,
  }));
}

export async function getThreatScore(): Promise<number> {
  return invoke<number>('get_threat_score');
}

export async function scanActiveProcesses(apiKey: string): Promise<Detection[]> {
  const raw = await invoke<RawDetection[]>('scan_active_processes', { apiKey });
  return raw.map((d) => ({
    id: d.id, timestamp: d.timestamp, title: d.title,
    severity: d.severity as Detection['severity'],
    process: d.process, pid: d.pid, confidence: d.confidence,
    mitreTechniques: d.mitre_techniques,
    malwareFamily: d.malware_family,
    status: d.status as Detection['status'],
    description: d.description,
  }));
}
