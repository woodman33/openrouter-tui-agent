import fnmatch
from pydantic import BaseModel
from typing import List, Optional
from founder_terminal.agentpass.passport import AgentPassPassport

class PassportVerificationResult(BaseModel):
    ok: bool
    status: str  # "PASS" | "DENIED" | "APPROVAL_REQUIRED"
    diagnostics: List[str]

VALID_RISK_CLASSES = [
    "read_only", 
    "workspace_mutation", 
    "network_call", 
    "secret_access", 
    "external_publish", 
    "payment_or_billing", 
    "context_injection", 
    "model_execution", 
    "deployment"
]

def verify_action(
    passport: AgentPassPassport,
    tool: str,
    risk_level: str = "low",
    risk_class: str = "read_only",
    cost: float = 0.0,
    accumulated_spent: float = 0.0
) -> PassportVerificationResult:
    """
    Evaluates requested tool actions, context access parameters, and tool risk taxonomy against AgentPass.
    Gating sequence: doctrine validation → passport validity → context entitlement → tool risk authorization → budget policy.
    """
    diagnostics = []
    
    # 1. Expiration check (Passport Validity)
    if passport.has_expired():
        diagnostics.append("✕ Passport Verification: Token has expired.")
        return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
        
    # 2. Risk Class Gating (Tool Risk Authorization)
    if risk_class not in VALID_RISK_CLASSES:
        diagnostics.append(f"✕ Risk Taxonomy: Invalid risk class '{risk_class}'. Must be one of {VALID_RISK_CLASSES}.")
        return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
        
    diagnostics.append(f"✓ Risk Taxonomy Checked: Action classified under '{risk_class}' (Risk level: '{risk_level.upper()}').")
    
    # Strictly block payment or billing in developer environments without ultra permissions
    if risk_class == "payment_or_billing":
        diagnostics.append("✕ Risk Gating: Payment or billing operations are strictly blocked in this local sandbox environment.")
        return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)

    # 3. Context Entitlement Gating
    if tool.startswith("context.read."):
        pack_id = tool.replace("context.read.", "").replace("_", "-")
        
        # Free context packs
        if pack_id in ["openrouter-agent-sdk", "openverse-openapi"]:
            # Allowed for all, but let's check scope
            req_scope = f"context.read.{pack_id.replace('-', '_')}"
            if req_scope not in passport.scopes:
                diagnostics.append(f"✕ Context Gating: Missing required scope '{req_scope}' for free context pack.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
            else:
                diagnostics.append(f"✓ Entitlement Gating: Free context pack '{pack_id}' is allowed.")
                
        # Pro gated context packs
        elif pack_id == "canva-apps-sdk":
            if "context.read.canva_apps_sdk" not in passport.scopes:
                diagnostics.append("✕ Context Gating: Canva Apps SDK requires Pro/Team passport entitlement scope.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
            else:
                diagnostics.append("✓ Entitlement Gating: Canva Apps SDK Pro scope verified.")
                
        # Builder gated context packs
        elif pack_id == "cloudflare-workers":
            if "context.read.cloudflare_workers" not in passport.scopes:
                diagnostics.append("✕ Context Gating: Cloudflare Workers requires Builder/Pro/Team passport scope.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
            else:
                diagnostics.append("✓ Entitlement Gating: Cloudflare Workers scope verified.")
                
        elif pack_id == "openhands-sdk":
            if "context.read.openhands_sdk" not in passport.scopes:
                diagnostics.append("✕ Context Gating: OpenHands SDK requires Builder/Pro/Team passport scope.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
            else:
                diagnostics.append("✓ Entitlement Gating: OpenHands SDK scope verified.")
                
        # Team gated context packs
        elif pack_id == "private-docs":
            if "context.read.private_docs" not in passport.scopes:
                diagnostics.append("✕ Context Gating: Organization Private Docs requires Team subscription scope.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
            else:
                diagnostics.append("✓ Entitlement Gating: Private Docs Team scope verified.")
    else:
        # 4. General Tool Allowed & Denied Glob Checks
        for pattern in passport.denied_tools:
            if fnmatch.fnmatch(tool, pattern):
                diagnostics.append(f"✕ Tool Security: Action '{tool}' matches denied pattern '{pattern}'.")
                return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)
                
        allowed = False
        for pattern in passport.allowed_tools:
            if fnmatch.fnmatch(tool, pattern):
                allowed = True
                break
                
        if not allowed:
            diagnostics.append(f"✕ Tool Security: Action '{tool}' not matched by allowed patterns.")
            return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)

    # 5. Risk Level Gating
    risk_priority = {"low": 1, "medium": 2, "high": 3}
    req_priority = risk_priority.get(risk_level.lower(), 1)
    limit_priority = risk_priority.get(passport.risk_level.lower(), 2)
    
    if req_priority > limit_priority:
        diagnostics.append(f"✕ Risk Level Gating: Requested risk '{risk_level.upper()}' exceeds passport ceiling '{passport.risk_level.upper()}'.")
        return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)

    # 6. Budget Gating
    remaining_budget = passport.budget_usd - accumulated_spent
    if cost > remaining_budget:
        diagnostics.append(f"✕ Budget Gating: Action cost ${cost:.4f} exceeds remaining passport session budget ${remaining_budget:.4f}.")
        return PassportVerificationResult(ok=False, status="DENIED", diagnostics=diagnostics)

    # 7. Human Approval Check
    # Gating check: High risk levels, workspace mutations, secret access, or deployment operations require operator double-confirmation
    approval_required = False
    if (
        risk_level.lower() == "high" 
        or risk_class in ["workspace_mutation", "deployment", "secret_access", "external_publish"]
        or tool in ["workspace.write", "credentials.purge", "credentials.rotate"]
    ):
        approval_required = True
        diagnostics.append(f"⚠️ Approval Required: Action matches human double-confirmation parameters (Risk Class: '{risk_class}').")
        
    status = "APPROVAL_REQUIRED" if approval_required else "PASS"
    diagnostics.append(f"✓ Security Gate: Checked '{tool}' under risk class '{risk_class}'. Status: {status}")
    
    return PassportVerificationResult(ok=True, status=status, diagnostics=diagnostics)
