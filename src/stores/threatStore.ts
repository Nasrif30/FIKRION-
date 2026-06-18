import { create } from 'zustand';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type DetectionStatus = 'active' | 'investigating' | 'resolved';

export interface Detection {
  id: string;
  timestamp: string;
  title: string;
  severity: Severity;
  process: string;
  pid: number;
  confidence: number;
  mitreTechniques: string[];
  malwareFamily?: string;
  status: DetectionStatus;
  description: string;
}

interface ThreatStore {
  detections: Detection[];
  threatScore: number; // 0-100 FIKRION Think Score
  activeCount: number;
  setDetections: (d: Detection[]) => void;
  setThreatScore: (score: number) => void;
  updateDetectionStatus: (id: string, status: DetectionStatus) => void;
}

export const useThreatStore = create<ThreatStore>((set) => ({
  detections: [],
  threatScore: 0,
  activeCount: 0,
  setDetections: (d) => set({ detections: d, activeCount: d.filter((x) => x.status === 'active').length }),
  setThreatScore: (score) => set({ threatScore: score }),
  updateDetectionStatus: (id, status) =>
    set((s) => ({
      detections: s.detections.map((d) => (d.id === id ? { ...d, status } : d)),
      activeCount: s.detections.filter((d) => d.status === 'active').length,
    })),
}));
