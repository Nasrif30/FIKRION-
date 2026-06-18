import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAIStore } from '@/stores/aiStore';
import { checkOllama } from '@/services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Zap, ChevronRight } from 'lucide-react';

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'ai', label: 'AI Provider' },
  { id: 'sensitivity', label: 'Detection' },
  { id: 'response', label: 'Response Level' },
  { id: 'ready', label: 'Ready' },
];

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const { setFirstRunComplete } = useSettingsStore();
  const { setOllamaStatus, setActiveProvider, activeProvider, providerConfigs, setApiKey } = useAIStore();

  async function detectOllama() {
    const { available, models } = await checkOllama();
    if (available) { setOllamaStatus(available, models); setActiveProvider('ollama'); }
    return available;
  }

  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#09090B' }}>
      <motion.div className="w-[560px] flex flex-col gap-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all ${i <= step ? 'bg-brand' : 'bg-white/10'}`} />
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-brand' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" className="glass-card p-8 flex flex-col items-center gap-6 text-center"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)' }}>
                <Shield size={28} style={{ color: '#0A84FF' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">FIKRION Setup</h2>
                <p className="text-sm text-secondary mt-2">Let me get you protected. This takes about 2 minutes.</p>
              </div>
              <button className="btn-primary w-full" onClick={() => setStep(1)}>Get Started <ChevronRight size={14} /></button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="ai" className="glass-card p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-brand" />
                <h2 className="text-lg font-semibold text-white">Choose Your AI</h2>
              </div>
              <p className="text-xs text-secondary">I need an AI provider to think. Pick whichever works for you — you can change this anytime.</p>
              <div className="flex flex-col gap-2">
                {([
                  { id: 'ollama', label: 'Ollama — Local & Private', desc: 'No internet. Run AI on your machine.' },
                  { id: 'mcp', label: 'MCP Server — Use Your IDE AI', desc: 'Claude Desktop, Cursor, Windsurf, Antigravity, etc.' },
                  { id: 'openrouter', label: 'OpenRouter — Free Tier Available', desc: 'API key. Unlocks GPT-4o, Claude, Llama.' },
                  { id: 'none', label: 'Skip for now', desc: 'Configure later in Settings.' },
                ] as const).map(({ id, label, desc }) => (
                  <button key={id} onClick={() => {
                    if (id !== 'none') setActiveProvider(id as typeof activeProvider);
                    setStep(2);
                  }}
                    className={`text-left glass-card-hover p-4 rounded-xl border ${activeProvider === id ? 'border-brand/30' : 'border-transparent'}`}>
                    <div className="text-sm text-white">{label}</div>
                    <div className="text-[10px] text-tertiary mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="sensitivity" className="glass-card p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white">Detection Sensitivity</h2>
              <p className="text-xs text-secondary">How aggressively should I monitor? You can adjust this later.</p>
              {[
                { s: 'medium', label: 'Balanced (Recommended)', desc: 'Best for most users. Low false positives.' },
                { s: 'high', label: 'High', desc: 'Catches more threats. Occasional false positives.' },
                { s: 'low', label: 'Low', desc: 'Minimal alerts. For experienced users.' },
              ].map(({ s, label, desc }) => (
                <button key={s} className="text-left glass-card-hover p-4 rounded-xl" onClick={() => setStep(3)}>
                  <div className="text-sm text-white">{label}</div>
                  <div className="text-[10px] text-tertiary">{desc}</div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="response" className="glass-card p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-brand" />
                <h2 className="text-lg font-semibold text-white">Autonomous Response</h2>
              </div>
              <p className="text-xs text-secondary">How much authority should I have to act automatically?</p>
              {[
                { level: 1, label: 'Notify Only (Recommended)', desc: "I'll alert you. You decide what to do." },
                { level: 2, label: 'Auto Kill Process', desc: "I'll terminate confirmed threats automatically." },
              ].map(({ level, label, desc }) => (
                <button key={level} className="text-left glass-card-hover p-4 rounded-xl" onClick={() => setStep(4)}>
                  <div className="text-sm text-white">L{level} — {label}</div>
                  <div className="text-[10px] text-tertiary">{desc}</div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="ready" className="glass-card p-8 flex flex-col items-center gap-6 text-center"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
                <Shield size={28} style={{ color: '#30D158' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">I am ready.</h2>
                <p className="text-sm text-secondary mt-2">FIKRION is now protecting your system. I will begin learning your normal patterns over the next 7 days.</p>
              </div>
              <button className="btn-primary w-full" onClick={() => setFirstRunComplete()}>
                Enter FIKRION →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
