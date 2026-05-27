from __future__ import annotations
import shutil
import subprocess
import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field

class OpenRouterStatus(BaseModel):
    stripe_installed: bool
    projects_available: bool
    env_exists: bool
    openrouter_key_present: bool
    openrouter_key_redacted: Optional[str] = None
    openrouter_type: Optional[str] = None
    diagnostics: list[str] = Field(default_factory=list)

def redact_api_key(key: str) -> str:
    if not key:
        return ""
    if key.startswith("sk-or-v1-"):
        # Redact as sk-or-v1-...LAST4
        suffix = key[-4:] if len(key) >= 13 else key[-2:]
        return f"sk-or-v1-...{suffix}"
    # Generic fallback
    if len(key) <= 8:
        return "********"
    return f"{key[:4]}...{key[-4:]}"

def detect_openrouter_status(project_dir: str = ".") -> OpenRouterStatus:
    project_path = Path(project_dir).resolve()
    env_path = project_path / ".env"
    
    stripe_installed = shutil.which("stripe") is not None
    projects_available = False
    diagnostics = []
    
    if stripe_installed:
        try:
            # Detect projects plugin support
            res = subprocess.run(["stripe", "projects", "--help"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                projects_available = True
                diagnostics.append("Stripe CLI is installed and projects command is active.")
            else:
                diagnostics.append("Stripe CLI is installed, but the 'projects' command is not supported.")
        except Exception as e:
            diagnostics.append(f"Stripe projects plugin check failed: {e}")
    else:
        diagnostics.append("Stripe CLI is missing from host. Run: brew install stripe/stripe-cli/stripe")
        
    env_exists = env_path.exists()
    openrouter_key_present = False
    openrouter_key_redacted = None
    openrouter_type = None
    
    if env_exists:
        diagnostics.append(f"Project env file detected at {env_path}")
        # Parse .env
        try:
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        if k == "OPENROUTER_API_KEY":
                            if v:
                                openrouter_key_present = True
                                openrouter_key_redacted = redact_api_key(v)
                        elif k == "OPENROUTER_TYPE":
                            openrouter_type = v
        except Exception as e:
            diagnostics.append(f"Failed to read .env file: {e}")
    else:
        diagnostics.append("No local .env file found in project CWD.")
        
    if openrouter_key_present:
        diagnostics.append(f"OpenRouter API key is synced: {openrouter_key_redacted}")
    else:
        diagnostics.append("OpenRouter API key is missing or empty in .env.")
        
    return OpenRouterStatus(
        stripe_installed=stripe_installed,
        projects_available=projects_available,
        env_exists=env_exists,
        openrouter_key_present=openrouter_key_present,
        openrouter_key_redacted=openrouter_key_redacted,
        openrouter_type=openrouter_type,
        diagnostics=diagnostics
    )

if __name__ == "__main__":
    print("Testing detector status...")
    status = detect_openrouter_status()
    print(status.model_dump_json(indent=2))
