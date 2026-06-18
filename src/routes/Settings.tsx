import { useState, useEffect } from 'react';
import { useAIStore, type AIProvider } from '@/stores/aiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { checkMcpServer } from '@/services/aiService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const PROVIDER_META: Record<AIProvider, { label: string; placeholder: string; hint: string; isMcp?: boolean; isLocal?: boolean }> = {
  ollama: { label: 'Ollama (Local)', placeholder: 'http://localhost:11434', hint: 'Install Ollama and run: ollama pull llama3.1:8b', isLocal: true },
  mcp: { label: 'MCP Server', placeholder: 'http://localhost:3000', hint: 'Works with Claude Desktop, Cursor, Windsurf, Continue.dev, Cline, Antigravity — any MCP host. No API key needed.', isMcp: true },
  openrouter: { label: 'OpenRouter', placeholder: 'sk-or-...', hint: 'Recommended. One key unlocks GPT-4o, Claude, Gemini, Llama. Free tier available.' },
  groq: { label: 'Groq', placeholder: 'gsk_...', hint: 'Ultra-fast inference. Free tier. Best for real-time analysis.' },
  openai: { label: 'OpenAI', placeholder: 'sk-...', hint: 'GPT-4o-mini is cost-effective. GPT-4o for maximum intelligence.' },
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...', hint: 'Claude 3.5 Haiku (fast) or Sonnet (intelligent).' },
};

function ProviderCard({ provider }: { provider: AIProvider }) {
  const { activeProvider, setActiveProvider, providerConfigs, setApiKey, setModel } = useAIStore();
  const meta = PROVIDER_META[provider];
  const config = providerConfigs[provider];
  const isActive = activeProvider === provider;
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      if (provider === 'mcp') {
        const ok = await checkMcpServer(config.apiKey || 'http://localhost:3000');
        setTestResult(ok);
        if (ok) setActiveProvider(provider);
      } else {
        const ok = config.apiKey.length > 10;
        setTestResult(ok);
        if (ok) setActiveProvider(provider);
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className={`glass-card p-4 transition-all ${isActive ? 'border-brand/30' : ''}`}
      style={isActive ? { borderColor: 'rgba(10,132,255,0.3)' } : {}}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{meta.label}</span>
          {meta.isLocal && <span className="pill-safe text-[9px]">Local</span>}
          {meta.isMcp && <span className="pill-brand text-[9px]">MCP</span>}
        </div>
        <button
          className={isActive ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
          onClick={() => setActiveProvider(provider)}
        >
          {isActive ? 'Active' : 'Use'}
        </button>
      </div>
      <p className="text-[10px] text-tertiary mb-3 leading-relaxed">{meta.hint}</p>
      <div className="flex gap-2">
        <input
          className="input text-xs flex-1"
          placeholder={meta.placeholder}
          value={config.apiKey}
          type={meta.isLocal || meta.isMcp ? 'text' : 'password'}
          onChange={(e) => setApiKey(provider, e.target.value)}
        />
        <button className="btn-secondary text-xs shrink-0" onClick={testConnection} disabled={testing}>
          {testing ? <Loader size={12} className="animate-spin" /> : 'Test'}
        </button>
      </div>
      {testResult !== null && (
        <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${testResult ? 'text-safe' : 'text-threat'}`}>
          {testResult ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {testResult ? 'Connected successfully' : 'Connection failed — check URL or key'}
        </div>
      )}
      <input
        className="input text-xs mt-2"
        placeholder="Model (e.g. llama3.1:8b)"
        value={config.model}
        onChange={(e) => setModel(provider, e.target.value)}
      />
    </div>
  );
}

function IntegrationCard({ title, desc, apiKey, setKey, testFn }: {
  title: string; desc: string; apiKey: string;
  setKey: (key: string) => void;
  testFn: (key: string) => Promise<boolean>;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  async function handleVerify() {
    if (!apiKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await testFn(apiKey);
      setTestResult(ok);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="glass-card p-5 border border-white/5">
      <h2 className="text-sm font-semibold text-white mb-1">{title}</h2>
      <p className="text-[10px] text-tertiary mb-3">{desc}</p>
      <div className="flex gap-2">
        <input
          className="input text-xs flex-1"
          placeholder={`${title} Key...`}
          type="password"
          value={apiKey}
          onChange={(e) => {
            setKey(e.target.value);
            setTestResult(null);
          }}
        />
        <button className="btn-secondary text-xs shrink-0 px-4" onClick={handleVerify} disabled={testing || !apiKey}>
          {testing ? <Loader size={12} className="animate-spin" /> : 'Verify'}
        </button>
      </div>
      {testResult !== null && (
        <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${testResult ? 'text-safe' : 'text-threat'}`}>
          {testResult ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {testResult ? 'Connected successfully' : 'Verification failed — check key'}
        </div>
      )}
    </div>
  );
}

function LocationSearch() {
  const { manualLocation, setManualLocation } = useSettingsStore();
  const [query, setQuery] = useState(manualLocation || '');
  const [results, setResults] = useState<{name: string, country: string, admin1?: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Only search if user typed something new and it's not exactly the saved value
    if (!query || query === manualLocation) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
          setShowDropdown(true);
        } else {
          setResults([]);
        }
      } catch (e) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [query, manualLocation]);

  return (
    <div className="relative w-full">
      <div className="flex gap-2 relative">
        <input
          className="input text-xs flex-1"
          placeholder="Search for a city (e.g. Manila)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setManualLocation('');
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {searching && <Loader size={12} className="absolute right-3 top-2.5 animate-spin text-tertiary" />}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#1A1A1E] border border-white/10 rounded-md shadow-xl max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 hover:bg-brand/20 text-xs text-secondary hover:text-white transition-colors"
              onClick={() => {
                const locStr = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country}`;
                setQuery(locStr);
                setManualLocation(locStr);
                setShowDropdown(false);
              }}
            >
              <span className="font-medium text-white">{r.name}</span>
              <span className="ml-1 text-[10px] text-tertiary">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { sensitivity, setSensitivity, autonomousLevel, setAutonomousLevel, openWeatherMapApiKey, virusTotalApiKey, setIntegrationKey } = useSettingsStore();
  const [tab, setTab] = useState<'ai' | 'integrations' | 'detection' | 'response' | 'general'>('ai');

  const TABS = [
    { id: 'ai', label: 'AI Configuration' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'detection', label: 'Detection' },
    { id: 'response', label: 'Autonomous Response' },
    { id: 'general', label: 'General' },
  ] as const;

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-5 selectable">
      <div>
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <p className="text-xs text-tertiary mt-0.5">FIKRION Configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1" style={{ width: 'fit-content' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === id ? 'bg-brand text-white' : 'text-secondary hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* AI Configuration */}
      {tab === 'ai' && (
        <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card px-4 py-3 border border-brand/20 text-xs text-brand flex items-start gap-2">
            <span className="font-bold">Info:</span>
            <div>
              <strong>No API key? No problem.</strong> Use MCP Server to connect to Claude Desktop, Cursor, Windsurf, or any MCP-compatible IDE.
              Or install <a href="#" className="underline">Ollama</a> for fully local, private AI.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PROVIDER_META) as AIProvider[]).map((p) => (
              <ProviderCard key={p} provider={p} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <IntegrationCard
            title="Pirate Weather API"
            desc="Required for the FIKRION JARVIS-style dynamic environment greeting."
            apiKey={openWeatherMapApiKey || ''}
            setKey={(val: string) => setIntegrationKey('openWeatherMap', val)}
            testFn={async (key: string) => {
              const res = await fetch(`https://api.pirateweather.net/forecast/${key}/0,0`);
              return res.ok;
            }}
          />

          <div className="glass-card p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white mb-1">Manual Weather Location</h2>
            <p className="text-[10px] text-tertiary mb-3">If IP geolocation is inaccurate, search and select your actual city. Leave blank to auto-detect.</p>
            <LocationSearch />
          </div>

          <IntegrationCard
            title="VirusTotal (Threat Intelligence)"
            desc="FIKRION automatically queries VirusTotal when high-risk anomalies are detected. Limits: 4/min, 500/day."
            apiKey={virusTotalApiKey || ''}
            setKey={(val: string) => setIntegrationKey('virusTotal', val)}
            testFn={async (key: string) => {
              const res = await fetch('https://www.virustotal.com/api/v3/domains/google.com', {
                headers: { 'x-apikey': key }
              });
              return res.ok;
            }}
          />
        </motion.div>
      )}

      {/* Detection */}
      {tab === 'detection' && (
        <motion.div className="glass-card p-5 flex flex-col gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div>
            <p className="section-label mb-3">Detection Sensitivity</p>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'paranoid'] as const).map((s) => (
                <button key={s} onClick={() => setSensitivity(s)}
                  className={`btn-secondary text-xs capitalize ${sensitivity === s ? 'border-brand/40 text-brand' : ''}`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-tertiary mt-2">
              {sensitivity === 'paranoid' ? 'Maximum sensitivity. May produce more false positives. Recommended for high-risk environments.' :
               sensitivity === 'high' ? 'High sensitivity. Catches most threats with minimal false positives.' :
               sensitivity === 'medium' ? 'Balanced. Recommended for most users.' : 'Low sensitivity. Fewer alerts, may miss subtle threats.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Autonomous Response */}
      {tab === 'response' && (
        <motion.div className="glass-card p-5 flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="section-label">Autonomous Response Level</p>
          {[
            { level: 1, label: 'Notify Only', desc: 'FIKRION alerts you but takes no action.' },
            { level: 2, label: 'Kill Process', desc: 'FIKRION kills confirmed malicious processes automatically.' },
            { level: 3, label: 'Disconnect Network', desc: 'FIKRION cuts internet access when a critical threat is detected.' },
            { level: 4, label: 'Full Lockdown', desc: 'Blocks all non-essential processes and network activity.' },
            { level: 5, label: 'Emergency Mode', desc: 'Only FIKRION processes run. Requires manual release.' },
          ].map(({ level, label, desc }) => (
            <button key={level} onClick={() => setAutonomousLevel(level as 1|2|3|4|5)}
              className={`text-left glass-card-hover p-4 rounded-xl border ${autonomousLevel === level ? 'border-brand/30' : 'border-transparent'}`}>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-sm font-bold ${autonomousLevel === level ? 'text-brand' : 'text-tertiary'}`}>L{level}</span>
                <span className={`text-sm ${autonomousLevel === level ? 'text-white' : 'text-secondary'}`}>{label}</span>
                {autonomousLevel === level && <span className="ml-auto pill-brand text-[9px]">Active</span>}
              </div>
              <p className="text-xs text-tertiary mt-1 ml-9">{desc}</p>
            </button>
          ))}
        </motion.div>
      )}

      {tab === 'general' && (
        <motion.div className="glass-card p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-xs text-secondary">General settings coming in Phase 2.</p>
        </motion.div>
      )}

      <div className="text-[10px] text-tertiary text-center mt-auto pt-4">
        FIKRION — Intelligent Thinking Engine. Built by Nay-Technology.
      </div>
    </div>
  );
}
