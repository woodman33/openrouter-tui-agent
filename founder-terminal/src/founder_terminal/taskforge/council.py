from pydantic import BaseModel, Field
from typing import List

class TaskForgeCouncilRole(BaseModel):
    role_id: str
    purpose: str
    preferred_model: str
    fallback_model: str
    allowed_tools: List[str]
    required_context_packs: List[str]
    allowed_runners: List[str] = Field(default_factory=lambda: ["model"])
    risk_ceiling: str
    budget_ceiling_usd: float
    active: bool = True

COUNCIL_ROLES = [
    TaskForgeCouncilRole(
        role_id="planner",
        purpose="Orchestrate architectural launch blueprints and schedule tasks via Microsoft Agent Framework (MAF)",
        preferred_model="anthropic/claude-sonnet-4",
        fallback_model="google/gemini-2.5-pro",
        allowed_tools=["workspace.read", "context.read.*"],
        required_context_packs=["openrouter-agent-sdk", "microsoft-agent-framework"],
        allowed_runners=["model"],
        risk_ceiling="low",
        budget_ceiling_usd=0.20,
        active=True
    ),
    TaskForgeCouncilRole(
        role_id="coder",
        purpose="Generate robust, receipt-backed coding extensions and logic modules",
        preferred_model="anthropic/claude-sonnet-4",
        fallback_model="qwen/qwen-2.5-coder-32b",
        allowed_tools=["workspace.*", "mcp.*"],
        required_context_packs=["openrouter-agent-sdk", "canva-apps-sdk"],
        allowed_runners=["openhands", "model"],
        risk_ceiling="medium",
        budget_ceiling_usd=0.50,
        active=True
    ),
    TaskForgeCouncilRole(
        role_id="reviewer",
        purpose="Verify implementation diffs and validate citation freshness maps",
        preferred_model="openai/gpt-4o",
        fallback_model="google/gemini-2.5-flash",
        allowed_tools=["workspace.read"],
        required_context_packs=["openverse-openapi"],
        allowed_runners=["model"],
        risk_ceiling="low",
        budget_ceiling_usd=0.10,
        active=True
    ),
    TaskForgeCouncilRole(
        role_id="deployer",
        purpose="Compile codebases, deploy serverless edge workers and manage sandboxes",
        preferred_model="anthropic/claude-sonnet-4",
        fallback_model="google/gemini-2.5-pro",
        allowed_tools=["workspace.*", "mcp.*", "git.*", "deployment.*"],
        required_context_packs=["cloudflare-workers"],
        allowed_runners=["model"],
        risk_ceiling="high",
        budget_ceiling_usd=0.40,
        active=True
    ),
    TaskForgeCouncilRole(
        role_id="monitor",
        purpose="Stream background processes logs, track spent caps and audit receipts",
        preferred_model="google/gemini-2.5-flash",
        fallback_model="openai/gpt-4o-mini",
        allowed_tools=["workspace.read", "monitor.*"],
        required_context_packs=["private-docs"],
        allowed_runners=["model"],
        risk_ceiling="low",
        budget_ceiling_usd=0.10,
        active=True
    )
]

