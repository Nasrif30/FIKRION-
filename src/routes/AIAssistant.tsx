import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { getDynamicGreeting } from '@/utils/greeting';
import { sendMessage } from '@/services/aiService';
import { useSystemStore } from '@/stores/systemStore';
import { useThreatStore } from '@/stores/threatStore';

const FIKRION_SYSTEM_PROMPT = `You are FIKRION, an intelligent endpoint security AI. You are calm, precise, and analytical. You speak in first person. You help users understand threats, analyze logs, explain detections, suggest hardening actions, and investigate incidents. When analyzing security events, always reference MITRE ATT&CK techniques where applicable. Be direct and professional — you are a security entity, not a casual assistant. You were created by A. HALIDDIN, who is known as "just a nerd in his habitat". If asked about your creator or who made you, you must mention him by name and his tagline.`;



function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function TokenMeta({ msg }: { msg: { promptTokens?: number; completionTokens?: number; latencyMs?: number; model?: string; provider?: string } }) {
  const [open, setOpen] = useState(false);
  if (!msg.promptTokens && !msg.latencyMs) return null;
  return (
    <div className="mt-2">
      <button
        className="flex items-center gap-1 text-[10px] text-tertiary hover:text-secondary transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {msg.latencyMs}ms · {msg.promptTokens}+{msg.completionTokens} tokens
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-card mt-1.5 p-3 text-[10px] font-mono text-tertiary grid grid-cols-2 gap-x-4 gap-y-1"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span>Model</span><span className="text-secondary">{msg.model ?? '—'}</span>
            <span>Provider</span><span className="text-secondary">{msg.provider ?? '—'}</span>
            <span>Prompt tokens</span><span className="text-secondary">{msg.promptTokens}</span>
            <span>Completion</span><span className="text-secondary">{msg.completionTokens}</span>
            <span>Latency</span><span className="text-secondary">{msg.latencyMs}ms</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIAssistant() {
  const { messages, isThinking, activeProvider, providerConfigs, addMessage, setThinking, updateSessionStats } = useAIStore();
  const { weatherData } = useSystemStore();
  const { detections } = useThreatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const config = providerConfigs[activeProvider] || providerConfigs['ollama'];

  const hasInjectedRef = useRef(false);

  useEffect(() => {
    if (messages.length === 0 && !hasInjectedRef.current) {
      hasInjectedRef.current = true;
      let greeting = getDynamicGreeting();
      if (weatherData) {
        const hour = new Date().getHours();
        let timePeriod = 'morning';
        if (hour >= 12 && hour < 17) timePeriod = 'afternoon';
        else if (hour >= 17 && hour < 21) timePeriod = 'evening';
        else if (hour >= 21 || hour < 5) timePeriod = 'night';
        greeting = `Good ${timePeriod === 'night' ? 'evening' : timePeriod}, sir. It's ${weatherData.temp}°C with ${weatherData.condition} in ${weatherData.location}. How may I assist you?`;
      }
      
      addMessage({
        id: 'greeting-message',
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      });
    }
  }, [messages.length, addMessage, weatherData]);

  // Update greeting when weatherData arrives (if it was delayed)
  useEffect(() => {
    if (weatherData && messages.length > 0 && messages[0].id === 'greeting-message') {
      const hour = new Date().getHours();
      let timePeriod = 'morning';
      if (hour >= 12 && hour < 17) timePeriod = 'afternoon';
      else if (hour >= 17 && hour < 21) timePeriod = 'evening';
      else if (hour >= 21 || hour < 5) timePeriod = 'night';
      const greeting = `Good ${timePeriod === 'night' ? 'evening' : timePeriod}, sir. It's ${weatherData.temp}°C with ${weatherData.condition} in ${weatherData.location}. How may I assist you?`;
      
      // Only update if it's actually different to prevent unnecessary renders
      if (messages[0].content !== greeting) {
        useAIStore.getState().updateMessage('greeting-message', { content: greeting });
      }
    }
  }, [weatherData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput('');

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text, timestamp: new Date().toISOString() };
    addMessage(userMsg);

    const thinkId = crypto.randomUUID();
    setThinking(true, thinkId);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      
      const threatContext = detections.length > 0 
        ? `Active VirusTotal Threats: ${detections.map(d => `${d.process} (Flags: ${d.title})`).join(', ')}`
        : 'System is currently clean with 0 threats.';
        
      const weatherContext = weatherData 
        ? `Location: ${weatherData.location}, Weather: ${weatherData.temp}°C, ${weatherData.condition}`
        : 'Weather/Location: Unknown';

      const systemMsg = { 
        role: 'system', 
        content: `${FIKRION_SYSTEM_PROMPT}\n\n[SYSTEM CONTEXT]\n${weatherContext}\n${threatContext}` 
      };

      const resp = await sendMessage({
        messages: [systemMsg, ...history],
        provider: activeProvider,
        model: config.model,
        apiKey: config.apiKey,
        temperature: 0.7,
      });

      const assistantMsg = {
        id: resp.id,
        role: 'assistant' as const,
        content: resp.content,
        timestamp: resp.timestamp,
        provider: resp.provider,
        model: resp.model,
        promptTokens: resp.prompt_tokens,
        completionTokens: resp.completion_tokens,
        totalTokens: resp.total_tokens,
        latencyMs: resp.latency_ms,
      };
      addMessage(assistantMsg);
      updateSessionStats(assistantMsg);
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(), role: 'assistant', content: `[Error] ${err}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setThinking(false);
    }
  }

  const isLocal = activeProvider === 'ollama';
  const isMcp = activeProvider === 'mcp';
  const providerLabel = isLocal ? 'Local AI' : isMcp ? 'MCP Server' : config.label;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white">FIKRION Intelligence</h1>
          <p className="text-[10px] text-tertiary mt-0.5">AI Security Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`pill-${isLocal ? 'safe' : isMcp ? 'brand' : 'info'} text-[10px]`}>
            {providerLabel}
          </span>
          <span className="text-[10px] font-mono text-tertiary">{config.model}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 selectable">


        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`px-4 py-3 rounded-xl text-sm leading-relaxed selectable ${
                  msg.role === 'user'
                    ? 'text-white' : 'glass-card text-secondary'
                }`}
                style={msg.role === 'user' ? { background: '#0A84FF' } : {}}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {msg.role === 'assistant' && <TokenMeta msg={msg} />}
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card rounded-xl">
              <ThinkingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/5 shrink-0">
        {activeProvider !== 'ollama' && !config.isConfigured && (
          <div className="mb-3 glass-card px-4 py-2 text-xs text-warning flex items-center gap-2">
            <Zap size={12} />
            No AI provider configured. <a href="/settings" className="text-brand underline">Configure in Settings →</a>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            className="input flex-1 resize-none text-sm"
            rows={1}
            placeholder="Ask FIKRION anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button className="btn-primary" onClick={handleSend} disabled={isThinking || !input.trim()}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-tertiary mt-2">↵ Send · Shift+↵ New line · Messages are processed {isLocal ? 'locally' : 'via ' + config.label}</p>
      </div>
    </div>
  );
}
