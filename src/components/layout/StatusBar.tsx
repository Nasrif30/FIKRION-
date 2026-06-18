import { useSettingsStore } from '@/stores/settingsStore';
import { useThreatStore } from '@/stores/threatStore';
import { useAIStore } from '@/stores/aiStore';
import { useSystemStore } from '@/stores/systemStore';
import { Shield, Cpu, Brain, Zap } from 'lucide-react';

const AUTONOMOUS_LABELS = ['Notify', 'Kill Process', 'Disconnect', 'Lockdown', 'Emergency'];

export default function StatusBar() {
  const { autonomousLevel } = useSettingsStore();
  const { threatScore, activeCount } = useThreatStore();
  const { activeProvider, ollamaAvailable, providerConfigs } = useAIStore();
  const { metrics, lastUpdated } = useSystemStore();

  const modelLabel = activeProvider === 'ollama'
    ? (ollamaAvailable ? providerConfigs.ollama.model : 'Offline')
    : providerConfigs[activeProvider]?.label ?? activeProvider;

  const lastScan = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const scoreColor =
    threatScore >= 70 ? '#FF3B30' : threatScore >= 40 ? '#FF9F0A' : '#30D158';

  return (
    <div
      className="flex items-center justify-between h-8 px-4 shrink-0 text-xs no-drag"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}
    >
      {/* Protection state */}
      <div className="flex items-center gap-4 text-tertiary">
        <div className="flex items-center gap-1.5">
          <Shield size={11} style={{ color: activeCount > 0 ? '#FF9F0A' : '#30D158' }} />
          <span>{activeCount > 0 ? `${activeCount} Active Threat${activeCount > 1 ? 's' : ''}` : 'Protected'}</span>
        </div>
        <span className="text-white/20">|</span>
        <span>Last scan: {lastScan}</span>
        {metrics && (
          <>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <Cpu size={10} />
              <span>{metrics.cpuUsage.toFixed(0)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Center: Think Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-tertiary">Think Score</span>
        <span className="font-semibold font-mono" style={{ color: scoreColor }}>
          {threatScore}
        </span>
        <span className="text-tertiary">/100</span>
      </div>

      {/* Right: AI + autonomous level */}
      <div className="flex items-center gap-4 text-tertiary">
        <div className="flex items-center gap-1.5">
          <Brain size={10} />
          <span className="font-mono text-[10px]">{modelLabel}</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1">
          <Zap size={10} />
          <span>L{autonomousLevel} — {AUTONOMOUS_LABELS[autonomousLevel - 1]}</span>
        </div>
      </div>
    </div>
  );
}
