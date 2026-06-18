// FIKRION AI Commands — routes to Ollama or cloud providers
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub messages: Vec<ChatMessage>,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub api_key: Option<String>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIResponse {
    pub id: String,
    pub content: String,
    pub model: String,
    pub provider: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub latency_ms: u64,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub available: bool,
    pub models: Vec<String>,
}

#[tauri::command]
pub async fn check_ollama() -> Result<OllamaStatus, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get("http://localhost:11434/api/tags").send().await {
        Ok(resp) if resp.status().is_success() => {
            let body: serde_json::Value = resp.json().await.unwrap_or_default();
            let models: Vec<String> = body["models"]
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
                .collect();
            Ok(OllamaStatus { available: true, models })
        }
        _ => Ok(OllamaStatus { available: false, models: vec![] }),
    }
}

#[tauri::command]
pub async fn get_ollama_models() -> Result<Vec<String>, String> {
    let status = check_ollama().await?;
    Ok(status.models)
}

#[tauri::command]
pub async fn send_message(request: SendMessageRequest) -> Result<AIResponse, String> {
    let start = Instant::now();
    let provider = request.provider.as_deref().unwrap_or("ollama").to_string();
    let model = request.model.clone().unwrap_or_else(|| match provider.as_str() {
        "groq" => "llama-3.1-8b-instant".to_string(),
        "openai" => "gpt-4o-mini".to_string(),
        _ => "meta-llama/llama-3.1-8b-instruct:free".to_string(),
    });

    let (content, prompt_t, completion_t) = match provider.as_str() {
        "ollama" => call_ollama(&request, &model).await?,
        "mcp" => call_mcp(&request, &model).await?,
        "groq" => call_openai_compat(&request, &model, "https://api.groq.com/openai/v1/chat/completions").await?,
        "openai" => call_openai_compat(&request, &model, "https://api.openai.com/v1/chat/completions").await?,
        "anthropic" => call_anthropic(&request, &model).await?,
        _ => call_openai_compat(&request, &model, "https://openrouter.ai/api/v1/chat/completions").await?,
    };

    Ok(AIResponse {
        id: Uuid::new_v4().to_string(),
        content,
        model,
        provider,
        prompt_tokens: prompt_t,
        completion_tokens: completion_t,
        total_tokens: prompt_t + completion_t,
        latency_ms: start.elapsed().as_millis() as u64,
        timestamp: Utc::now().to_rfc3339(),
    })
}

async fn call_ollama(req: &SendMessageRequest, model: &str) -> Result<(String, u32, u32), String> {
    let client = Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": req.messages,
        "stream": false,
        "options": { "temperature": req.temperature.unwrap_or(0.7) }
    });
    let resp = client.post("http://localhost:11434/api/chat").json(&body).send().await
        .map_err(|e| format!("Ollama offline: {e}"))?;
    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok((
        data["message"]["content"].as_str().unwrap_or("").to_string(),
        data["prompt_eval_count"].as_u64().unwrap_or(0) as u32,
        data["eval_count"].as_u64().unwrap_or(0) as u32,
    ))
}

async fn call_openai_compat(req: &SendMessageRequest, model: &str, url: &str) -> Result<(String, u32, u32), String> {
    let api_key = req.api_key.as_deref().unwrap_or("");
    if api_key.is_empty() {
        return Err("API key not configured. Go to Settings → AI Configuration.".to_string());
    }
    let client = Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": req.messages,
        "temperature": req.temperature.unwrap_or(0.7),
    });
    let resp = client.post(url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("HTTP-Referer", "https://fikrion.app")
        .header("X-Title", "FIKRION")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok((
        data["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string(),
        data["usage"]["prompt_tokens"].as_u64().unwrap_or(0) as u32,
        data["usage"]["completion_tokens"].as_u64().unwrap_or(0) as u32,
    ))
}

/// MCP (Model Context Protocol) Client
/// Connects to any MCP-compatible host: Claude Desktop, Cursor, Windsurf,
/// Continue.dev, Cline, Antigravity, or any IDE extension exposing MCP.
/// Uses the MCP sampling specification over HTTP/SSE transport.
/// The user provides the MCP server URL — no API key required if they
/// already have a running MCP host.
async fn call_mcp(req: &SendMessageRequest, model: &str) -> Result<(String, u32, u32), String> {
    // MCP server URL is passed in the api_key field for simplicity
    // (reusing the field as "mcp_server_url" — Phase 2 will add a dedicated field)
    let server_url = req.api_key.as_deref().unwrap_or("http://localhost:3000");
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    // MCP sampling request format per spec
    let mcp_request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": uuid::Uuid::new_v4().to_string(),
        "method": "sampling/createMessage",
        "params": {
            "messages": req.messages.iter().map(|m| serde_json::json!({
                "role": m.role,
                "content": { "type": "text", "text": m.content }
            })).collect::<Vec<_>>(),
            "modelPreferences": {
                "hints": [{ "name": model }],
                "intelligencePriority": 0.8,
                "speedPriority": 0.5
            },
            "maxTokens": 4096,
            "temperature": req.temperature.unwrap_or(0.7)
        }
    });

    let resp = client
        .post(format!("{}/mcp", server_url.trim_end_matches('/')))
        .header("Content-Type", "application/json")
        .json(&mcp_request)
        .send()
        .await
        .map_err(|e| format!("MCP server unreachable at {server_url}: {e}. Ensure your MCP host is running."))?;

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    // Extract content from MCP sampling response
    let content = data["result"]["content"]["text"]
        .as_str()
        .or_else(|| data["result"]["content"].as_str())
        .unwrap_or("")
        .to_string();

    if content.is_empty() {
        return Err(format!(
            "MCP server returned empty response. Check your MCP host is configured correctly.\nRaw: {}",
            data
        ));
    }

    // MCP spec doesn't mandate token counts — estimate from content length
    let approx_tokens = (content.split_whitespace().count() as f32 * 1.3) as u32;
    Ok((content, approx_tokens / 2, approx_tokens / 2))
}

/// Check if an MCP server is reachable at a given URL.
#[tauri::command]
pub async fn check_mcp_server(url: String) -> Result<bool, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    // MCP servers respond to initialize ping
    let ping = serde_json::json!({
        "jsonrpc": "2.0", "id": "ping", "method": "initialize",
        "params": { "protocolVersion": "2024-11-05", "capabilities": {} }
    });

    match client.post(format!("{}/mcp", url.trim_end_matches('/')))
        .json(&ping).send().await
    {
        Ok(r) => Ok(r.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// Anthropic direct client (claude-3-5-sonnet, claude-3-haiku, etc.)
async fn call_anthropic(req: &SendMessageRequest, model: &str) -> Result<(String, u32, u32), String> {
    let api_key = req.api_key.as_deref().unwrap_or("");
    if api_key.is_empty() {
        return Err("Anthropic API key not configured. Go to Settings → AI Configuration.".to_string());
    }
    let client = Client::new();

    // Anthropic uses a system message separately from messages[]
    let system = req.messages.iter()
        .find(|m| m.role == "system")
        .map(|m| m.content.clone())
        .unwrap_or_default();
    let messages: Vec<_> = req.messages.iter()
        .filter(|m| m.role != "system")
        .collect();

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "system": system,
        "messages": messages,
        "temperature": req.temperature.unwrap_or(0.7),
    });

    let resp = client.post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok((
        data["content"][0]["text"].as_str().unwrap_or("").to_string(),
        data["usage"]["input_tokens"].as_u64().unwrap_or(0) as u32,
        data["usage"]["output_tokens"].as_u64().unwrap_or(0) as u32,
    ))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionStats {
    pub total_messages: u32,
    pub total_tokens: u32,
    pub estimated_cost_usd: f64,
}

#[tauri::command]
pub async fn get_session_stats() -> Result<SessionStats, String> {
    Ok(SessionStats { total_messages: 0, total_tokens: 0, estimated_cost_usd: 0.0 })
}
