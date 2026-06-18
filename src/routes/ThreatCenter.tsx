import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreatStore, type Detection } from '@/stores/threatStore';
import { ChevronDown, ChevronRight, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const MITRE_NAMES: Record<string, string> = {
  'T1059.001': 'PowerShell', 'T1086': 'PowerShell (Legacy)', 'T1547.001': 'Registry Run Keys',
  'T1003.001': 'LSASS Memory', 'T1055': 'Process Injection', 'T1027': 'Obfuscated Files',
};

const SEVERITY_ICON: Record<string, React.ElementType> = { critical: AlertTriangle, high: AlertTriangle, medium: Clock, low: CheckCircle, info: CheckCircle };

function MitreTag({ tech }: { tech: string }) {
  return (
    <span className="pill-brand font-mono" style={{ fontSize: 10 }}>
      {tech} {MITRE_NAMES[tech] ? `· ${MITRE_NAMES[tech]}` : ''}
    </span>
  );
}

function ThreatCard({ d }: { d: Detection }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SEVERITY_ICON[d.severity] ?? Shield;
  const severityClass = `pill-${d.severity}`;

  return (
    <motion.div
      className="glass-card overflow-hidden"
      layout
      transition={{ duration: 0.2 }}
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <Icon size={15} className={d.severity === 'critical' || d.severity === 'high' ? 'text-threat' : 'text-warning'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{d.title}</span>
            <span className={severityClass}>{d.severity}</span>
            {d.malwareFamily && (
              <span className="pill-info text-[10px]">{d.malwareFamily}</span>
            )}
          </div>
          <p className="text-[11px] text-tertiary font-mono mt-1">{d.process} · PID {d.pid} · {new Date(d.timestamp).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs font-mono text-brand">{d.confidence}%</div>
            <div className="text-[9px] text-tertiary">confidence</div>
          </div>
          {expanded ? <ChevronDown size={14} className="text-tertiary" /> : <ChevronRight size={14} className="text-tertiary" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-5 pb-5 flex flex-col gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="divider" />

            {/* Description */}
            <div>
              <p className="section-label mb-2">FIKRION Analysis</p>
              <p className="text-xs text-secondary leading-relaxed">{d.description}</p>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="section-label">Confidence Score</span>
                <span className="text-xs font-mono text-brand">{d.confidence}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-brand" style={{ width: `${d.confidence}%` }}
                  initial={{ width: 0 }} animate={{ width: `${d.confidence}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>

            {/* MITRE techniques */}
            {d.mitreTechniques.length > 0 && (
              <div>
                <p className="section-label mb-2">MITRE ATT&amp;CK Techniques</p>
                <div className="flex flex-wrap gap-2">
                  {d.mitreTechniques.map((t: string) => <MitreTag key={t} tech={t} />)}
                </div>
              </div>
            )}

            {/* AI Explainability */}
            <div className="glass-card p-4">
              <p className="section-label mb-3">AI Explainability</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Behavioral signature matched', confirmed: true },
                  { label: 'Parent process chain is suspicious', confirmed: d.severity !== 'low' },
                  { label: 'Network activity during execution', confirmed: d.confidence > 75 },
                  { label: 'Known malware family pattern', confirmed: !!d.malwareFamily },
                ].map(({ label, confirmed }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] ${confirmed ? 'bg-safe/20 text-safe' : 'bg-white/5 text-tertiary'}`}>
                      {confirmed ? '✓' : '—'}
                    </div>
                    <span className={`text-xs ${confirmed ? 'text-secondary' : 'text-tertiary'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="btn-danger text-xs">Kill Process</button>
              <button className="btn-secondary text-xs">Quarantine</button>
              <button className="btn-secondary text-xs">Block IP</button>
              <button className="btn-ghost text-xs ml-auto">Mark Resolved</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ThreatCenter() {
  const { detections } = useThreatStore();

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-4 selectable">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Threat Center</h1>
          <p className="text-xs text-tertiary mt-0.5">FIKRION Detection Timeline</p>
        </div>
        <span className="pill-info">{detections.length} detections</span>
      </div>
      {detections.length === 0 ? (
        <div className="glass-card flex items-center justify-center h-48 text-xs text-tertiary gap-2">
          <Shield size={14} /> No detections recorded.
        </div>
      ) : (
        detections.map((d) => <ThreatCard key={d.id} d={d} />)
      )}
    </div>
  );
}
