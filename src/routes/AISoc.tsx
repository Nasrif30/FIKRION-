import { motion } from 'framer-motion';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { useThreatStore } from '@/stores/threatStore';

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function AISoc() {
  const { detections } = useThreatStore();

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-4 selectable">
      <div>
        <h1 className="text-lg font-semibold text-white">AI SOC</h1>
        <p className="text-xs text-tertiary mt-0.5">FIKRION Autonomous Investigation Center</p>
      </div>
      
      {detections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
          <CheckCircle size={48} className="text-safe mb-4 opacity-50" />
          <p className="text-sm font-medium text-white">No Active Investigations</p>
          <p className="text-xs text-tertiary mt-2 max-w-md">The system is currently clean. FIKRION is silently monitoring all system events and process executions in the background.</p>
        </div>
      ) : (
        detections.map((det, i) => (
          <motion.div key={det.id} className="glass-card p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="flex items-center gap-3 mb-3">
              {det.status === 'resolved' && <CheckCircle size={15} className="text-safe" />}
              {det.status === 'investigating' && (
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Brain size={15} className="text-brand" />
                </motion.div>
              )}
              {det.status === 'active' && <AlertCircle size={15} className="text-threat" />}
              <span className="text-sm font-medium text-white">{det.title}</span>
              <span className={`ml-auto pill-${det.status === 'resolved' ? 'safe' : det.status === 'investigating' ? 'brand' : 'critical'} text-[10px]`}>
                {det.status === 'investigating' ? 'Investigating...' : det.status === 'active' ? 'Queued' : 'Resolved'}
              </span>
              <span className="text-[10px] text-tertiary">
                {getTimeAgo(det.timestamp)}
              </span>
            </div>
            
            {det.status === 'investigating' && (
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="flex gap-1">
                  {[0,1,2].map((j) => <div key={j} className="thinking-dot" style={{ animationDelay: `${j*0.2}s` }} />)}
                </div>
                I am reconstructing the attack timeline for {det.process}...
              </div>
            )}
            
            {det.description && (
              <p className="text-xs text-secondary leading-relaxed border-t border-white/5 pt-3 mt-1">
                {det.description} <br/>
                <span className="text-tertiary mt-1 block">PID: {det.pid} | Confidence: {det.confidence}% | TTPs: {det.mitreTechniques.join(', ')}</span>
              </p>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}
