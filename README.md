# FIKRION Autonomous Security Platform

**FIKRION** is an intelligent, AI-driven endpoint security and system monitoring platform built with Rust (Tauri), React, and Tailwind CSS. It acts as an autonomous Security Operations Center (SOC), combining system-level telemetry, real-time threat intelligence, and advanced AI reasoning to monitor, investigate, and protect endpoints.

## Architecture and Flow Diagram

FIKRION operates through a decoupled architecture where the lightweight Rust backend handles low-level operating system operations, and the React frontend provides a responsive command center.

```mermaid
graph TD
    subgraph Frontend
        UI[Dashboard and SOC Interface]
        State[State Management]
        AI[AI Assistant Module]
    end

    subgraph Backend Core
        Monitor[OS Metrics and Process Hooks]
        IPC[Tauri IPC Bridge]
        Detection[Threat Analysis Engine]
    end

    subgraph External Integrations
        LLM[Local/Cloud AI Providers]
        VT[Threat Intelligence API]
        Weather[Environment Context API]
    end

    Monitor -- Polling --> IPC
    IPC -- Real-time Data --> State
    State -- Triggers --> UI

    UI -- System Query --> AI
    AI -- Sends Context --> LLM
    LLM -- Returns Analysis --> UI
    
    Detection -- Hash Verification --> VT
    VT -- Threat Score --> State
```

## Configuring the Intelligence Engine

FIKRION utilizes a plug-and-play AI system that supports entirely local offline processing alongside powerful cloud models.

### 1. Initial Setup
Upon initial deployment, you will be greeted by the Setup Wizard. To properly configure the platform:
1. Navigate to the **Settings** module.
2. Enter your API keys and configuration parameters. These are stored locally and securely via encrypted persistence and are never pushed to source control.

### 2. Supported Inference Providers
Administrators can seamlessly switch between AI providers based on privacy requirements and hardware capabilities:
* **Ollama (Local and Private):** Requires Ollama installed on the host machine. FIKRION will auto-detect running models for entirely offline telemetry analysis.
* **Groq:** Ultra-fast cloud inference designed for real-time analysis.
* **OpenAI:** Industry-standard models for complex reasoning.
* **Model Context Protocol (MCP):** Enterprise integration for localized tooling.

### 3. Utilizing the Autonomous SOC
Once an AI provider is configured:
* Navigate to the **AI Assistant** or **AI SOC** tabs.
* You can issue direct commands or ask the engine to analyze your active threat queue.
* The AI dynamically ingests the endpoint's real-time state, environmental context, and current threat queue before generating a response or mitigation strategy.

## Security and Privacy Guidelines

All sensitive configurations, API keys, and manual location inputs are securely managed within the local client state. 

**Important:** Do not hardcode API keys into the source files or environment variables tracked by version control. FIKRION is strictly designed to ingest credentials purely through its UI runtime settings to prevent accidental credential leakage.

## Development and Deployment

To run FIKRION locally in a development environment:

```bash
# Install dependencies
npm install

# Start the Tauri development window
npm run tauri dev
```

To compile and build for production deployment:

```bash
npm run tauri build
```
