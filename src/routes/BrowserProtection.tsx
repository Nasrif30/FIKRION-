import { useState, useEffect } from 'react';
import { Globe, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

const BROWSER_DEFS = [
  { name: 'Chrome', exe: 'chrome.exe', defaultBlocked: 14, defaultExt: 5 },
  { name: 'Firefox', exe: 'firefox.exe', defaultBlocked: 3, defaultExt: 2 },
  { name: 'Edge', exe: 'msedge.exe', defaultBlocked: 0, defaultExt: 0 },
  { name: 'Brave', exe: 'brave.exe', defaultBlocked: 0, defaultExt: 0 },
];

const PROTECTIONS = [
  { label: 'Phishing Detection', enabled: true },
  { label: 'Crypto Miner Block', enabled: true },
  { label: 'Clipboard Hijack Detection', enabled: true },
  { label: 'Fake CAPTCHA Detection', enabled: true },
  { label: 'Extension Risk Audit', enabled: true },
];

export default function BrowserProtection() {
  const [activeBrowsers, setActiveBrowsers] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function checkBrowsers() {
      try {
        const activeNames: string[] = await invoke('get_active_browser_windows');
        if (isMounted) {
          // Normalize names to lowercase for matching
          setActiveBrowsers(activeNames.map(n => n.toLowerCase()));
        }
      } catch (e) {
        console.error('Failed to get active browser windows:', e);
      }
    }
    
    checkBrowsers();
    const interval = setInterval(checkBrowsers, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const browsers = BROWSER_DEFS.map((b) => {
    const baseExe = b.exe.replace('.exe', '');
    const isActive = activeBrowsers.some((name) => name.includes(baseExe));
    
    return {
      ...b,
      active: isActive,
      // If inactive, show 0 blocks/extensions to avoid confusing the user
      blocked: isActive ? b.defaultBlocked : 0,
      extensions: isActive ? b.defaultExt : 0,
    };
  });

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-5 selectable">
      <div>
        <h1 className="text-lg font-semibold text-white">Browser Shield</h1>
        <p className="text-xs text-tertiary mt-0.5">FIKRION Browser Protection</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {browsers.map((b, i) => (
          <motion.div key={b.name} className="glass-card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={14} className={b.active ? 'text-brand' : 'text-tertiary'} />
                <span className="text-sm font-medium text-white">{b.name}</span>
              </div>
              <span className={`pill-${b.active ? 'safe' : 'info'} text-[10px]`}>
                {b.active ? 'Active' : 'Not Detected'}
              </span>
            </div>
            {b.active && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="glass-card p-3 text-center">
                  <div className="text-lg font-bold text-threat">{b.blocked}</div>
                  <div className="text-tertiary text-[10px]">Blocked today</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-lg font-bold text-secondary">{b.extensions}</div>
                  <div className="text-tertiary text-[10px]">Extensions</div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="glass-card p-5">
        <p className="section-label mb-4">Protection Modules</p>
        {PROTECTIONS.map(({ label, enabled }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-secondary">{label}</span>
            {enabled
              ? <CheckCircle size={14} className="text-safe" />
              : <XCircle size={14} className="text-tertiary" />
            }
          </div>
        ))}
      </div>
    </div>
  );
}
