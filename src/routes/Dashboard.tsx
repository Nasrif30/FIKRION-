import { useState, useEffect } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { getDynamicGreeting } from '@/utils/greeting';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThreatStore } from '@/stores/threatStore';
import { useAIStore } from '@/stores/aiStore';
import { scanActiveProcesses } from '@/services/detectionService';
import { motion } from 'framer-motion';
import { Shield, Cpu, HardDrive, Wifi, Activity, ChevronRight, Zap, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// FIKRION Threat Index Ring — animated SVG circle
function ThreatRing({ score }: { score: number }) {
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? '#FF3B30' : score >= 40 ? '#FF9F0A' : '#30D158';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="100" cy="100" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold font-mono"
          style={{ color }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest text-tertiary mt-1">Think Score</span>
      </div>
    </div>
  );
}

// Metric sparkline bar
function MetricCard({ icon: Icon, label, value, percent, color }: {
  icon: React.ElementType; label: string; value: string; percent: number; color: string;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-secondary">
          <Icon size={13} />
          <span className="text-xs">{label}</span>
        </div>
        <span className="text-xs font-mono text-white">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-tertiary">{percent.toFixed(0)}% used</span>
    </div>
  );
}

// Status message from FIKRION personality
function useStatusMessage(activeCount: number, score: number) {
  const { openWeatherMapApiKey } = useSettingsStore();
  const [greeting, setGreeting] = useState(getDynamicGreeting(true));

  useEffect(() => {
    // If there are threats, we don't show the greeting anyway, so skip fetching.
    if (activeCount > 0 || score >= 40 || !openWeatherMapApiKey) {
      setGreeting(getDynamicGreeting(true));
      return;
    }
    
    let isMounted = true;
    async function fetchWeather() {
      try {
        const locRes = await fetch('http://ip-api.com/json/');
        if (!locRes.ok) throw new Error('Location fetch failed');
        const locData = await locRes.json();
        
        if (!locData.lat || !locData.lon) throw new Error('Invalid location data');
        
        const weatherRes = await fetch(`https://api.pirateweather.net/forecast/${openWeatherMapApiKey}/${locData.lat},${locData.lon}?units=si`);
        if (!weatherRes.ok) throw new Error('Weather fetch failed');
        const weatherData = await weatherRes.json();
        
        if (!isMounted) return;
        
        const temp = Math.round(weatherData.currently.temperature);
        const condition = weatherData.currently.summary;
        
        const hour = new Date().getHours();
        let timePeriod = 'morning';
        if (hour >= 12 && hour < 17) timePeriod = 'afternoon';
        else if (hour >= 17 && hour < 21) timePeriod = 'evening';
        else if (hour >= 21 || hour < 5) timePeriod = 'night';
        
        setGreeting(`Good ${timePeriod}, sir. It's ${temp}°C with ${condition} outside. System health is excellent. I am ready.`);
      } catch (e) {
        console.error('Failed to fetch dynamic weather:', e);
        if (isMounted) setGreeting(getDynamicGreeting(true));
      }
    }
    
    fetchWeather();
    return () => { isMounted = false; };
  }, [openWeatherMapApiKey, activeCount, score]);

  if (activeCount > 0) return `I have detected ${activeCount} active threat${activeCount > 1 ? 's' : ''} requiring attention.`;
  if (score >= 70) return 'Threat level is elevated. I recommend reviewing active alerts immediately.';
  if (score >= 40) return 'Some behavioral anomalies detected. Monitoring closely.';
  
  return greeting;
}

export default function Dashboard() {
  const { metrics } = useSystemStore();
  const { threatScore, detections, activeCount, setDetections } = useThreatStore();
  const { activeProvider, ollamaAvailable } = useAIStore();
  const { virusTotalApiKey } = useSettingsStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultMsg, setScanResultMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const statusMsg = useStatusMessage(activeCount, threatScore);
  const recentDetections = detections.slice(0, 5);

  async function handleScanNow() {
    if (!virusTotalApiKey) {
      alert('Please add a VirusTotal API Key in Settings first.');
      navigate('/settings');
      return;
    }
    
    setIsScanning(true);
    setScanResultMsg(null);
    try {
      const results = await scanActiveProcesses(virusTotalApiKey);
      setDetections(results);
      if (results.length === 0) {
        setScanResultMsg("Scan complete. 0 threats found.");
      } else {
        setScanResultMsg(`Scan complete. Found ${results.length} threats!`);
      }
      setTimeout(() => setScanResultMsg(null), 5000);
    } catch (e: any) {
      alert(`Scan failed: ${e.message || e}`);
    } finally {
      setIsScanning(false);
    }
  }

  const SEVERITY_STYLE: Record<string, string> = {
    critical: 'pill-critical', high: 'pill-high', medium: 'pill-medium',
    low: 'pill-low', info: 'pill-info',
  };

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-6 selectable">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-tertiary mt-0.5">FIKRION Security Intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs" onClick={() => navigate('/monitor')}>
            <Activity size={13} /> Real-Time
          </button>
          
          {scanResultMsg && (
            <span className={`text-xs flex items-center px-2 ${scanResultMsg.includes('0') ? 'text-safe' : 'text-threat'}`}>
              {scanResultMsg}
            </span>
          )}

          <button className="btn-primary text-xs" onClick={handleScanNow} disabled={isScanning}>
            {isScanning ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      </div>

      {/* Top row: Threat ring + status + quick actions */}
      <div className="flex gap-6">
        {/* Threat index */}
        <div className="glass-card p-6 flex flex-col items-center gap-4 w-64 shrink-0">
          <span className="section-label">FIKRION Threat Index</span>
          <ThreatRing score={threatScore} />
          <p className="text-xs text-secondary text-center leading-relaxed">{statusMsg}</p>
        </div>

        {/* System metrics */}
        <div className="flex-1 flex flex-col gap-3">
          <span className="section-label">System Health</span>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <MetricCard
              icon={Cpu} label="CPU Usage"
              value={`${metrics?.cpuUsage.toFixed(1) ?? '—'}%`}
              percent={metrics?.cpuUsage ?? 0}
              color="#0A84FF"
            />
            <MetricCard
              icon={Activity} label="Memory"
              value={`${metrics?.memoryUsedGb.toFixed(1) ?? '—'} / ${metrics?.memoryTotalGb.toFixed(0) ?? '—'} GB`}
              percent={metrics?.memoryPercent ?? 0}
              color="#5E5CE6"
            />
            <MetricCard
              icon={HardDrive} label="Disk"
              value={`${metrics?.diskUsedGb.toFixed(0) ?? '—'} / ${metrics?.diskTotalGb.toFixed(0) ?? '—'} GB`}
              percent={metrics?.diskPercent ?? 0}
              color="#30D158"
            />
            <MetricCard
              icon={Wifi} label="Network RX"
              value={`${(metrics?.networkRxKb ?? 0).toFixed(0)} KB/s`}
              percent={Math.min((metrics?.networkRxKb ?? 0) / 10, 100)}
              color="#FF9F0A"
            />
          </div>
        </div>

        {/* Active protections */}
        <div className="glass-card p-5 w-52 shrink-0 flex flex-col gap-4">
          <span className="section-label">Active Protections</span>
          {[
            { label: 'Behavioral Analysis', active: true },
            { label: 'Browser Shield', active: true },
            { label: 'Ransomware Guard', active: true },
            { label: 'Network Monitor', active: true },
            { label: 'AI SOC', active: ollamaAvailable || activeProvider !== 'ollama' },
            { label: 'Kernel Monitor', active: false, phase: '3' },
          ].map(({ label, active, phase }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-secondary">{label}</span>
              {phase
                ? <span className="pill-info" style={{ fontSize: 9 }}>Ph.{phase}</span>
                : <span className={active ? 'pill-safe' : 'pill-info'} style={{ fontSize: 9 }}>
                    <span className="pill-dot" style={{ background: active ? '#30D158' : '#636366' }} />
                    {active ? 'ON' : 'OFF'}
                  </span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Recent detections */}
      <div className="glass-card flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="section-label">Recent Detections</span>
          <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => navigate('/threats')}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="divider" />
        {recentDetections.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-tertiary gap-2">
            <Shield size={14} /> No detections. System is clean.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentDetections.map((d, i) => (
              <motion.div
                key={d.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] cursor-pointer"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/threats')}
              >
                <span className={SEVERITY_STYLE[d.severity] ?? 'pill-info'} style={{ minWidth: 60, justifyContent: 'center' }}>
                  {d.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{d.title}</p>
                  <p className="text-[10px] text-tertiary font-mono">{d.process} · PID {d.pid}</p>
                </div>
                <span className="text-[10px] text-tertiary font-mono shrink-0">
                  {d.confidence}% confidence
                </span>
                <ChevronRight size={12} className="text-tertiary" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
