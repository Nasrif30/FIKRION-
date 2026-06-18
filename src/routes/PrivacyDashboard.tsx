import { useSettingsStore } from '@/stores/settingsStore';
import { Lock, Cloud, Server, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LOCAL_ITEMS = ['All behavior logs', 'AI inference (Ollama)', 'Browser activity', 'AI Memory', 'Digital Twin model', 'Detection database', 'Incident reports'];
const EXTERNAL_ITEMS = [
  { label: 'VirusTotal hash lookups', desc: 'File SHA-256 only', key: 'allowVirusTotalLookups' as const },
  { label: 'AbuseIPDB queries', desc: 'IP address only', key: 'allowAbuseIPDB' as const },
];

export default function PrivacyDashboard() {
  const { zeroKnowledgeMode, setZeroKnowledgeMode, allowVirusTotalLookups, allowAbuseIPDB, toggle } = useSettingsStore();

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-5 selectable">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Privacy Dashboard</h1>
          <p className="text-xs text-tertiary mt-0.5">Data transparency and control</p>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <Lock size={14} className={zeroKnowledgeMode ? 'text-safe' : 'text-tertiary'} />
          <div>
            <div className="text-xs font-medium text-white">Zero-Knowledge Mode</div>
            <div className="text-[10px] text-tertiary">All external calls disabled</div>
          </div>
          <button onClick={() => setZeroKnowledgeMode(!zeroKnowledgeMode)}>
            {zeroKnowledgeMode
              ? <ToggleRight size={22} className="text-safe" />
              : <ToggleLeft size={22} className="text-tertiary" />}
          </button>
        </div>
      </div>

      {zeroKnowledgeMode && (
        <motion.div className="glass-card px-5 py-3 border border-safe/20 text-xs text-safe"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          I am now thinking entirely on your device. Nothing leaves.
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Local */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={14} className="text-safe" />
            <span className="text-sm font-medium text-white">Stays Local</span>
          </div>
          {LOCAL_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-safe" />
              <span className="text-xs text-secondary">{item}</span>
            </div>
          ))}
        </div>

        {/* External */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={14} className="text-warning" />
            <span className="text-sm font-medium text-white">External Calls</span>
          </div>
          {EXTERNAL_ITEMS.map(({ label, desc, key }) => {
            const enabled = key === 'allowVirusTotalLookups' ? allowVirusTotalLookups : allowAbuseIPDB;
            return (
              <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <div className="text-xs text-secondary">{label}</div>
                  <div className="text-[10px] text-tertiary">{desc}</div>
                </div>
                <button onClick={() => toggle(key)} disabled={zeroKnowledgeMode}>
                  {enabled && !zeroKnowledgeMode
                    ? <ToggleRight size={20} className="text-brand" />
                    : <ToggleLeft size={20} className="text-tertiary" />}
                </button>
              </div>
            );
          })}
          <div className="mt-4 text-[10px] text-tertiary leading-relaxed">
            Only hashes and IPs are sent — never file contents or personal data.
          </div>
        </div>
      </div>
    </div>
  );
}
