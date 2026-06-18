import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'ollama' | 'mcp' | 'openrouter' | 'groq' | 'openai' | 'anthropic';

export interface AIProviderConfig {
  provider: AIProvider;
  label: string;
  model: string;
  apiKey: string;       // also used as MCP server URL for provider="mcp"
  isConfigured: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  estimatedCost?: number;
  isThinking?: boolean;
}

interface SessionStats {
  totalMessages: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  fastestMs: number;
  slowestMs: number;
  sessionStartTime: string;
}

interface AIStore {
  // Provider config
  activeProvider: AIProvider;
  ollamaAvailable: boolean;
  ollamaModels: string[];
  mcpServerUrl: string;
  providerConfigs: Record<AIProvider, AIProviderConfig>;

  // Conversation
  messages: ChatMessage[];
  isThinking: boolean;
  currentThinkingId: string | null;

  // Stats
  sessionStats: SessionStats;

  // Actions
  setActiveProvider: (p: AIProvider) => void;
  setOllamaStatus: (available: boolean, models: string[]) => void;
  setMcpServerUrl: (url: string) => void;
  setApiKey: (provider: AIProvider, key: string) => void;
  setModel: (provider: AIProvider, model: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setThinking: (thinking: boolean, thinkingId?: string) => void;
  clearConversation: () => void;
  updateSessionStats: (msg: ChatMessage) => void;
}

const DEFAULT_STATS: SessionStats = {
  totalMessages: 0, totalPromptTokens: 0, totalCompletionTokens: 0,
  totalTokens: 0, estimatedCostUsd: 0, avgLatencyMs: 0,
  fastestMs: Infinity, slowestMs: 0,
  sessionStartTime: new Date().toISOString(),
};

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      activeProvider: 'ollama',
      ollamaAvailable: false,
      ollamaModels: [],
      mcpServerUrl: 'http://localhost:3000',
      providerConfigs: {
        ollama: { provider: 'ollama', label: 'Ollama (Local)', model: 'llama3.1:8b', apiKey: '', isConfigured: false },
        mcp: { provider: 'mcp', label: 'MCP Server', model: 'auto', apiKey: 'http://localhost:3000', isConfigured: false },
        openrouter: { provider: 'openrouter', label: 'OpenRouter', model: 'meta-llama/llama-3.1-8b-instruct:free', apiKey: '', isConfigured: false },
        groq: { provider: 'groq', label: 'Groq', model: 'llama-3.1-8b-instant', apiKey: '', isConfigured: false },
        openai: { provider: 'openai', label: 'OpenAI', model: 'gpt-4o-mini', apiKey: '', isConfigured: false },
        anthropic: { provider: 'anthropic', label: 'Anthropic', model: 'claude-3-5-haiku-20241022', apiKey: '', isConfigured: false },
      },
      messages: [],
      isThinking: false,
      currentThinkingId: null,
      sessionStats: DEFAULT_STATS,

      setActiveProvider: (p) => set({ activeProvider: p }),
      setOllamaStatus: (available, models) => set({ ollamaAvailable: available, ollamaModels: models }),
      setMcpServerUrl: (url) => set({ mcpServerUrl: url }),
      setApiKey: (provider, key) =>
        set((s) => ({
          providerConfigs: {
            ...s.providerConfigs,
            [provider]: { ...s.providerConfigs[provider], apiKey: key, isConfigured: key.length > 0 },
          },
        })),
      setModel: (provider, model) =>
        set((s) => ({
          providerConfigs: { ...s.providerConfigs, [provider]: { ...s.providerConfigs[provider], model } },
        })),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, patch) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      setThinking: (thinking, thinkingId) => set({ isThinking: thinking, currentThinkingId: thinkingId ?? null }),
      clearConversation: () => set({ messages: [], sessionStats: { ...DEFAULT_STATS, sessionStartTime: new Date().toISOString() } }),
      updateSessionStats: (msg) =>
        set((s) => {
          const stats = s.sessionStats;
          const latency = msg.latencyMs ?? 0;
          const tokens = msg.totalTokens ?? 0;
          const n = stats.totalMessages + 1;
          return {
            sessionStats: {
              ...stats,
              totalMessages: n,
              totalPromptTokens: stats.totalPromptTokens + (msg.promptTokens ?? 0),
              totalCompletionTokens: stats.totalCompletionTokens + (msg.completionTokens ?? 0),
              totalTokens: stats.totalTokens + tokens,
              avgLatencyMs: (stats.avgLatencyMs * (n - 1) + latency) / n,
              fastestMs: Math.min(stats.fastestMs, latency),
              slowestMs: Math.max(stats.slowestMs, latency),
            },
          };
        }),
    }),
    { name: 'fikrion-ai-store', partialize: (s) => ({ activeProvider: s.activeProvider, providerConfigs: s.providerConfigs, mcpServerUrl: s.mcpServerUrl }) }
  )
);
