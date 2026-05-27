from pydantic import BaseModel, Field

class OpenRouterPolicy(BaseModel):
    primary_model: str = "anthropic/claude-sonnet-4"
    fallback_models: list[str] = Field(default_factory=lambda: ["google/gemini-2.5-pro", "openai/gpt-4o"])
    max_run_cost_usd: float = 1.00
    spent_usd: float = 0.00
    cache_enabled: bool = True
    zdr: bool = True
    service_tier: str = "Pro"  # "Free", "Pro", "Ultra Pro"

class PolicyEvaluationResult(BaseModel):
    status: str  # "ok" | "warning" | "blocked"
    reasons: list[str]
    recommended_action: str
    recommended_model: str
    active_fallbacks: list[str]

def evaluate_policy(policy: OpenRouterPolicy) -> PolicyEvaluationResult:
    """
    Enforces cost caps, budget thresholds, and dynamic LLM fallback actions.
    """
    status = "NORMAL"
    reasons = []
    recommended_action = "Maintain optimal primary routing profile."
    recommended_model = policy.primary_model
    active_fallbacks = list(policy.fallback_models)
    
    # 1. Budget Evaluation
    usage_pct = (policy.spent_usd / policy.max_run_cost_usd) * 100 if policy.max_run_cost_usd > 0 else 0
    
    if usage_pct >= 100.0:
        status = "BLOCKED"
        reasons.append(f"✕ Budget Blocked: Spent ${policy.spent_usd:.4f} has fully depleted the session limit of ${policy.max_run_cost_usd:.4f} (>=100%).")
        recommended_model = "google/gemini-2.5-flash"  # Block model
        active_fallbacks = ["openai/gpt-4o-mini"]
        recommended_action = "Emergency Block: Premium loops terminated. Requires manual operator approval/cost cap expansion to resume."
    elif usage_pct >= 80.0:
        status = "EMERGENCY"
        reasons.append(f"🚨 Emergency Zone: Spent ${policy.spent_usd:.4f} is at {usage_pct:.1f}% of the limit (${policy.max_run_cost_usd:.4f}).")
        recommended_model = "google/gemini-2.5-flash"  # Emergency low-cost model
        active_fallbacks = ["openai/gpt-4o-mini"]
        recommended_action = "Emergency Fallback: Critical budget depletion imminent. Routing restricted to cheapest acceptable model (Gemini-2.5-Flash)."
    elif usage_pct >= 50.0:
        status = "CAUTION"
        reasons.append(f"⚠️ Caution Zone: Spent ${policy.spent_usd:.4f} is at {usage_pct:.1f}% of the limit (${policy.max_run_cost_usd:.4f}).")
        recommended_model = "qwen/qwen-2.5-coder-32b"  # Efficient coder model
        active_fallbacks = ["google/gemini-2.5-flash"]
        recommended_action = "Cautionary Fallback: Mid-budget caution triggered. Routing shifted to efficient coder fallback (Qwen-2.5-Coder-32b) to conserve resources."
    else:
        status = "NORMAL"
        recommended_model = policy.primary_model
        active_fallbacks = list(policy.fallback_models)
        recommended_action = "Normal Operation: Spent is within safe limits (<50%). Maintain premium primary routing profile."
            
    # 2. ZDR & Response Caching Compatibility Checks
    if policy.zdr and policy.cache_enabled:
        reasons.append("⚠️ ZDR & Caching Conflict: Account-level ZDR is ON. OpenRouter response caching is DISABLED because caching requires temporary response storage.")
    elif policy.cache_enabled and not policy.zdr:
        reasons.append("⚠️ Caching is ON: Cache hits avoid provider calls, but if you expect strict account-level ZDR, note that response caching requires temporary storage (ZDR is OFF).")
    elif policy.zdr and not policy.cache_enabled:
        reasons.append("✓ ZDR enforced: Zero-Data-Retention active. Response caching is inactive.")

    # 3. Service Tier Checks
    if policy.service_tier == "Free":
        if policy.zdr:
            reasons.append("ZDR Note: Zero-Data-Retention requires Pro/Ultra Pro tiers. Standard OpenRouter provider parameters apply.")
        if policy.cache_enabled:
            reasons.append("Cache Note: Prompt caching features are limited on the Free service tier.")
    elif policy.service_tier == "Pro":
        reasons.append("✓ Active Pro billing profile active.")
    elif policy.service_tier == "Ultra Pro":
        reasons.append("✨ Active Ultra Pro billing profile active. Remote sandbox integrations enabled.")
        
    return PolicyEvaluationResult(
        status=status,
        reasons=reasons,
        recommended_action=recommended_action,
        recommended_model=recommended_model,
        active_fallbacks=active_fallbacks
    )

if __name__ == "__main__":
    print("Testing Policy Evaluator...")
    policy = OpenRouterPolicy(spent_usd=0.85, max_run_cost_usd=1.00)
    res = evaluate_policy(policy)
    print(res.model_dump_json(indent=2))
