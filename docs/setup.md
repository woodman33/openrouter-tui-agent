# TIMMYTUI V2.1 Setup & Installation Guide

This document outlines the canonical first-run configuration and launch procedures for the **production-demo ready** TIMMYTUI V2.1 console.

---

## 🚀 First-Run Sequence

To initialize your local workspace and verify system compatibility before launching the terminal interface, run these steps in order:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/woodman33/openrouter-tui-agent.git
   cd openrouter-tui-agent
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   ```bash
   cp .env.example .env
   ```

4. **Add OpenRouter API Key**:
   Open the `.env` file and append or edit your key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```

5. **Verify System Setup**:
   Run the system diagnostic tool:
   ```bash
   npm run timmy -- doctor
   ```

6. **Launch the TUI Console**:
   ```bash
   npm start
   ```

---

## 🧭 Launching TIMMYTUI

The primary and canonical path to launch the interactive terminal console is:

```bash
cd openrouter-tui-agent
npm start
```

> [!IMPORTANT]
> Always launch using the canonical `npm start` command. Do not use development watch systems (`npm run dev`) or package executor commands (`npx install`). This ensures correct binding of the Browser Companion socket bridge on port `3001` and loading of the `cmux` workspace launch panel.

---

## 🛠️ CLI Command Reference

TIMMY has several built-in commands you can execute via the `timmy` package script:

* `npm run timmy -- setup` — Idempotently prepares the local workspace directory structure.
* `npm run timmy -- doctor` — Validates system health and prints demo readiness status.
* `npm run timmy -- docs verify` — Evaluates GitBook sync links and environment configurations.
* `npm run timmy -- docs preview` — Runs a local documentation web server.

### Planned Features
* `timmy start` — *PLANNED alias for npm start (under construction)*
