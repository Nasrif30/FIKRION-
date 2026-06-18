import { invoke } from '@tauri-apps/api/core';
import type { AIProvider } from '@/stores/aiStore';

export interface SendMessageParams {
  messages: { role: string; content: string }[];
  model?: string;
  provider?: AIProvider;
  apiKey?: string;
  temperature?: number;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  timestamp: string;
}

export interface OllamaStatus {
  available: boolean;
  models: string[];
}

export async function checkOllama(): Promise<OllamaStatus> {
  return invoke<OllamaStatus>('check_ollama');
}

export async function getOllamaModels(): Promise<string[]> {
  return invoke<string[]>('get_ollama_models');
}

/** Check if an MCP server is reachable — used in Settings → AI Config */
export async function checkMcpServer(url: string): Promise<boolean> {
  return invoke<boolean>('check_mcp_server', { url });
}

export async function sendMessage(params: SendMessageParams): Promise<AIResponse> {
  return invoke<AIResponse>('send_message', {
    request: {
      messages: params.messages,
      model: params.model,
      provider: params.provider,
      api_key: params.apiKey,
      temperature: params.temperature,
    },
  });
}
