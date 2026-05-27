from pydantic import BaseModel, Field
from typing import List

class TaskForgeLaunchPlan(BaseModel):
    plan_id: str
    task_title: str
    target_runner: str = "openhands"  # "openhands" | "claude-code"
    required_passport_scopes: List[str] = Field(default_factory=lambda: [
        "workspace.read", 
        "workspace.write", 
        "context.read.openrouter_agent_sdk"
    ])
    doctrine_required: bool = True
    agentpass_required: bool = True
    approval_required: bool = True
