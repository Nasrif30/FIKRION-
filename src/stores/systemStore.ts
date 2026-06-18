import { create } from 'zustand';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  memoryPercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  diskPercent: number;
  networkRxKb: number;
  networkTxKb: number;
  uptimeSeconds: number;
}

export interface ProcessEntry {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  status: string;
  riskScore: number;
  parentPid?: number;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  process: string;
  pid: number;
  riskScore: number;
}

interface SystemStore {
  metrics: SystemMetrics | null;
  processes: ProcessEntry[];
  events: SystemEvent[];
  isLoadingMetrics: boolean;
  isLoadingProcesses: boolean;
  lastUpdated: string | null;
  setMetrics: (m: SystemMetrics) => void;
  setProcesses: (p: ProcessEntry[]) => void;
  setEvents: (e: SystemEvent[]) => void;
  setLoadingMetrics: (v: boolean) => void;
  setLoadingProcesses: (v: boolean) => void;
  weatherData: { temp: number; condition: string; location: string } | null;
  setWeatherData: (w: { temp: number; condition: string; location: string } | null) => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  metrics: null,
  processes: [],
  events: [],
  isLoadingMetrics: false,
  isLoadingProcesses: false,
  lastUpdated: null,
  setMetrics: (m) => set({ metrics: m, lastUpdated: new Date().toISOString() }),
  setProcesses: (p) => set({ processes: p }),
  setEvents: (e) => set({ events: e }),
  setLoadingMetrics: (v) => set({ isLoadingMetrics: v }),
  setLoadingProcesses: (v) => set({ isLoadingProcesses: v }),
  weatherData: null,
  setWeatherData: (w) => set({ weatherData: w }),
}));
