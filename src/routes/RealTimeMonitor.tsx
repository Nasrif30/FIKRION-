import { useSystemStore } from '@/stores/systemStore';
import { motion } from 'framer-motion';

const EVENT_COLORS: Record<string, string> = {
  file: '#0A84FF', registry: '#FF9F0A', network: '#30D158',
  process: '#FF3B30', memory: '#5E5CE6',
};

export default function RealTimeMonitor() {
  const { processes, events } = useSystemStore();

  return (
    <div className="h-full flex gap-0 overflow-hidden">
      {/* Process tree */}
      <div className="w-1/2 flex flex-col border-r border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-sm font-semibold text-white">Process Tree</h2>
          <p className="text-[10px] text-tertiary mt-0.5">{processes.length} processes · Real data from OS</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: '#09090B' }}>
              <tr className="text-tertiary border-b border-white/5">
                <th className="text-left px-5 py-2 font-medium">Process</th>
                <th className="text-right px-3 py-2 font-medium">CPU%</th>
                <th className="text-right px-3 py-2 font-medium">RAM</th>
                <th className="text-right px-5 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {processes.slice(0, 80).map((p, i) => (
                <motion.tr
                  key={`${p.pid}-${i}`}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                >
                  <td className="px-5 py-2">
                    <div className="font-mono text-white truncate max-w-[160px]">{p.name}</div>
                    <div className="text-[9px] text-tertiary">PID {p.pid}</div>
                  </td>
                  <td className="text-right px-3 py-2 font-mono text-secondary">{p.cpuPercent.toFixed(1)}%</td>
                  <td className="text-right px-3 py-2 font-mono text-secondary">{p.memoryMb.toFixed(0)}M</td>
                  <td className="text-right px-5 py-2">
                    <span className={`pill font-mono ${
                      p.riskScore >= 70 ? 'pill-critical' : p.riskScore >= 35 ? 'pill-medium' : 'pill-safe'
                    }`} style={{ fontSize: 9 }}>
                      {p.riskScore}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event feed */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-sm font-semibold text-white">Event Feed</h2>
          <p className="text-[10px] text-tertiary mt-0.5">Simulated Phase 1 · Real ETW in Phase 3</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 selectable">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              className="glass-card px-3 py-2.5 flex items-start gap-3"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{ background: EVENT_COLORS[e.eventType] ?? '#636366' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-medium" style={{ color: EVENT_COLORS[e.eventType] ?? '#636366' }}>
                    {e.eventType}
                  </span>
                  <span className="text-[9px] font-mono text-tertiary">{e.process}</span>
                </div>
                <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">{e.description}</p>
              </div>
              <span className={`pill shrink-0 ${e.riskScore >= 70 ? 'pill-critical' : e.riskScore >= 40 ? 'pill-medium' : 'pill-info'}`}
                style={{ fontSize: 9 }}>
                {e.riskScore}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
