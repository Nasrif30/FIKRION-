import { useAIStore } from '@/stores/aiStore';

export default function AIUsagePanel() {
  const { sessionStats, messages, activeProvider, providerConfigs } = useAIStore();
  const config = providerConfigs[activeProvider];
  const durationMs = Date.now() - new Date(sessionStats.sessionStartTime).getTime();
  const durationMin = Math.floor(durationMs / 60000);

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-5 selectable">
      <div>
        <h1 className="text-lg font-semibold text-white">AI Usage</h1>
        <p className="text-xs text-tertiary mt-0.5">FIKRION Transparency Panel</p>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Messages', value: sessionStats.totalMessages },
          { label: 'Total Tokens', value: sessionStats.totalTokens.toLocaleString() },
          { label: 'Avg Latency', value: `${sessionStats.avgLatencyMs.toFixed(0)}ms` },
          { label: 'Session', value: `${durationMin}m` },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4">
            <div className="text-xs text-tertiary">{label}</div>
            <div className="text-xl font-semibold font-mono text-white mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Model info */}
      <div className="glass-card p-5">
        <p className="section-label mb-3">Active AI Provider</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs">
          <span className="text-tertiary">Provider</span><span className="text-white col-span-2">{config.label}</span>
          <span className="text-tertiary">Model</span><span className="text-white col-span-2 font-mono">{config.model}</span>
          <span className="text-tertiary">Mode</span>
          <span className="col-span-2">
            <span className={`pill-${activeProvider === 'ollama' ? 'safe' : activeProvider === 'mcp' ? 'brand' : 'info'} text-[10px]`}>
              {activeProvider === 'ollama' ? 'Local — fully private' : activeProvider === 'mcp' ? 'MCP Server' : 'Cloud API'}
            </span>
          </span>
        </div>
      </div>

      {/* Message log */}
      <div className="glass-card flex flex-col">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="section-label">Message Log</p>
        </div>
        {messages.filter((m) => m.role === 'assistant').length === 0 ? (
          <div className="flex items-center justify-center py-10 text-xs text-tertiary">No AI messages yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.filter((m) => m.role === 'assistant').map((m) => (
              <div key={m.id} className="px-5 py-3 grid grid-cols-4 gap-4 text-xs">
                <span className="text-tertiary font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                <span className="text-secondary truncate">{m.content.substring(0, 60)}...</span>
                <span className="text-tertiary font-mono">{m.totalTokens ?? 0} tok · {m.latencyMs ?? 0}ms</span>
                <span className="text-tertiary font-mono">{m.model ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
