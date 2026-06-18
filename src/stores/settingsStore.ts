import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AutonomousLevel = 1 | 2 | 3 | 4 | 5;
export type DetectionSensitivity = 'low' | 'medium' | 'high' | 'paranoid';

interface SettingsStore {
  // Privacy
  zeroKnowledgeMode: boolean;
  allowVirusTotalLookups: boolean;
  allowAbuseIPDB: boolean;
  // Detection
  sensitivity: DetectionSensitivity;
  autonomousLevel: AutonomousLevel;
  // Notifications
  soundAlerts: boolean;
  criticalModalEnabled: boolean;
  // Focus / performance
  focusMode: boolean;
  // General
  firstRunComplete: boolean;
  // Integrations
  virusTotalApiKey: string;
  openWeatherMapApiKey: string;
  manualLocation: string;

  // Actions
  setZeroKnowledgeMode: (v: boolean) => void;
  setSensitivity: (v: DetectionSensitivity) => void;
  setAutonomousLevel: (v: AutonomousLevel) => void;
  setFirstRunComplete: () => void;
  setManualLocation: (loc: string) => void;
  setIntegrationKey: (provider: 'virusTotal' | 'openWeatherMap', key: string) => void;
  toggle: (key: 'allowVirusTotalLookups' | 'allowAbuseIPDB' | 'soundAlerts' | 'criticalModalEnabled' | 'focusMode') => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      zeroKnowledgeMode: false,
      allowVirusTotalLookups: true,
      allowAbuseIPDB: true,
      sensitivity: 'medium',
      autonomousLevel: 1,
      soundAlerts: true,
      criticalModalEnabled: true,
      focusMode: false,
      firstRunComplete: false,
      virusTotalApiKey: '',
      openWeatherMapApiKey: '',
      manualLocation: '',

      setZeroKnowledgeMode: (v) => set({ zeroKnowledgeMode: v }),
      setSensitivity: (v) => set({ sensitivity: v }),
      setAutonomousLevel: (v) => set({ autonomousLevel: v }),
      setFirstRunComplete: () => set({ firstRunComplete: true }),
      setManualLocation: (loc) => set({ manualLocation: loc }),
      setIntegrationKey: (provider, key) => set((s) => ({
        ...s,
        ...(provider === 'virusTotal' ? { virusTotalApiKey: key } : { openWeatherMapApiKey: key })
      })),
      toggle: (key) => set((s) => ({ [key]: !s[key] } as Partial<SettingsStore>)),
    }),
    { name: 'fikrion-settings' }
  )
);
