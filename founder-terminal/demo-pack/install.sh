#!/usr/bin/env bash
# AgentOps Room Zero Installer
echo '=== Installing AgentOps Room Zero Workspace ==='
if ! command -v uv &> /dev/null; then
  echo '✕ uv is missing. Please install uv first.'
  exit 1
fi
uv venv && source .venv/bin/activate && uv pip install -e .
echo '✓ Installation completed successfully.'
