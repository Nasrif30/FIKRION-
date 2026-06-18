We are building an AI-native Security Intelligence Platform rather than a traditional antivirus. The platform combines Endpoint Detection and Response (EDR), behavioral malware detection, browser protection, network monitoring, AI-assisted threat investigation, threat intelligence, ransomware protection, anti-infostealer capabilities, memory analysis, sandboxing, and digital identity protection into one unified application.

The software must support Windows and Linux, with future support for macOS and mobile devices. It should work completely offline using local LLMs such as Ollama, llama.cpp, or LM Studio while also supporting optional cloud AI providers such as OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, and Cloudflare Workers AI.

Instead of relying only on malware signatures, the platform should detect attacks through behavioral analysis, anomaly detection, threat correlation, explainable AI, and continuous learning. Every detection must explain why it occurred, the evidence collected, confidence score, affected assets, MITRE ATT&CK techniques, recommended remediation, and possible malware family.

The platform should include a Security Brain that coordinates specialized AI agents such as Malware Analyst, Threat Hunter, Reverse Engineer, Digital Forensics Analyst, Browser Guardian, Network Analyst, Identity Analyst, Website Guardian, Incident Responder, and SOC Analyst. These agents collaborate to automatically investigate attacks, reconstruct timelines, correlate events, and generate professional incident reports rather than simply notifying the user that malware was detected.

**AI Provider Strategy — Zero Friction, Maximum Compatibility**

FIKRION supports four tiers of AI access so that every user — regardless of their setup — gets full AI capability:

Tier 1 — Local AI (Ollama, llama.cpp, LM Studio): Auto-detected at startup. If found, FIKRION uses it immediately with no configuration. Completely offline, fully private.

Tier 2 — MCP Server (Model Context Protocol): If the user runs an MCP-compatible host — such as Claude Desktop, Cursor, Windsurf, Continue.dev, Cline, Antigravity, or any IDE or tool that exposes an MCP server — FIKRION can connect to it as an MCP client. The user simply provides the MCP server URL (HTTP/SSE transport) or selects stdio transport. This gives access to powerful models (Claude, GPT-4o, Gemini) without requiring the user to manage API keys directly. MCP is an open standard created by Anthropic and supported by a growing ecosystem.

Tier 3 — Cloud API (BYOK): Users who have their own API keys from OpenRouter, Groq, OpenAI, Anthropic, Google Gemini, or Cloudflare Workers AI can configure them in Settings → AI Configuration. One key field, one test button. FIKRION stores keys in the OS keychain — never in plaintext.

Tier 4 — Graceful Degradation: If no AI provider is configured, FIKRION still functions as a behavioral detection and monitoring platform. AI-powered features display a friendly setup card: "Add an AI provider to unlock full FIKRION intelligence." No functionality crashes, no broken UI.

The MCP integration in FIKRION is provider-agnostic. Any tool that implements the MCP sampling specification (https://modelcontextprotocol.io/docs/concepts/sampling) can serve as FIKRION's AI backend. This includes current and future IDE extensions, desktop AI apps, and enterprise AI gateways.

**Context-Aware Dynamic Greeting**

The AI provides a highly contextual, JARVIS-style greeting upon initialization. This reinforces the "always-on" intelligence persona.
Format: `Good [time], [title]. [emoji] It's [temp] with [condition] outside. [action]. How may I assist you?`

*   **Sunny**: "Shall I suggest an outdoor route for you?"
*   **Rainy**: "I've moved your outdoor tasks indoors."
*   **Stormy**: "Please stay safe—I've postponed all outdoor commitments."
*   **Snowy**: "Shall I preheat your vehicle or adjust the thermostat?"
*   **Windy**: "I've secured your outdoor items. Be cautious."
*   **Foggy**: "Visibility is low—shall I check your commute?"
*   **Cloudy**: "A calm day ahead—perfect for focused work."
*   **Clear (night)**: "Rest well—I'll monitor for any changes."

Fallback: `Good [time], [title]. I can't read the weather right now, but I'm fully operational. How may I assist you?`