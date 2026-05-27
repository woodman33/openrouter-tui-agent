import os
from pathlib import Path
from pydantic import BaseModel, Field

class TerminalConfig(BaseModel):
    # API Configurations
    llm_api_key: str = Field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    llm_model: str = Field(default_factory=lambda: os.getenv("LLM_MODEL", "anthropic/claude-3-5-sonnet"))
    llm_base_url: str = Field(default_factory=lambda: os.getenv("LLM_BASE_URL", ""))
    
    openrouter_api_key: str = Field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    openrouter_base_url: str = Field(default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"))
    
    openhands_cloud_api_key: str = Field(default_factory=lambda: os.getenv("OPENHANDS_CLOUD_API_KEY", ""))
    openhands_cloud_api_url: str = Field(default_factory=lambda: os.getenv("OPENHANDS_CLOUD_API_URL", "https://app.all-hands.dev"))
    
    github_token: str = Field(default_factory=lambda: os.getenv("GITHUB_TOKEN", ""))
    cloudflare_api_token: str = Field(default_factory=lambda: os.getenv("CLOUDFLARE_API_TOKEN", ""))
    cloudflare_account_id: str = Field(default_factory=lambda: os.getenv("CLOUDFLARE_ACCOUNT_ID", ""))

    # Paths & Workspace
    home_dir: Path = Field(default_factory=lambda: Path(os.getenv("FOUNDER_TERMINAL_HOME", "~/.founder-terminal")).expanduser())
    runs_dir: Path = Field(default_factory=lambda: Path(os.getenv("FOUNDER_TERMINAL_RUNS_DIR", "~/.founder-terminal/runs")).expanduser())
    recipes_dir: Path = Field(default_factory=lambda: Path(os.getenv("FOUNDER_TERMINAL_RECIPES_DIR", "./recipes")).expanduser())
    
    # Safety Guards & Sandbox config
    default_sandbox: str = Field(default_factory=lambda: os.getenv("DEFAULT_SANDBOX", "process"))
    default_runtime: str = Field(default_factory=lambda: os.getenv("DEFAULT_RUNTIME", "local_sdk"))
    enable_dangerous_commands: bool = Field(default_factory=lambda: os.getenv("ENABLE_DANGEROUS_COMMANDS", "false").lower() == "true")
    allow_force_push: bool = Field(default_factory=lambda: os.getenv("ALLOW_FORCE_PUSH", "false").lower() == "true")
    allow_write_actions: bool = Field(default_factory=lambda: os.getenv("ALLOW_WRITE_ACTIONS", "false").lower() == "true")

def load_config() -> TerminalConfig:
    # Ensure home and runs directory exist
    cfg = TerminalConfig()
    cfg.home_dir.mkdir(parents=True, exist_ok=True)
    cfg.runs_dir.mkdir(parents=True, exist_ok=True)
    return cfg
