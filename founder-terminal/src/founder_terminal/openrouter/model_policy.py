from founder_terminal.openrouter.fallback_profiles import ModelFallbackManager

class ModelPolicyController:
    """
    Enforces operational cost allocation controls, budget caps, and dynamic routing
    policies based on real-time API spending metrics.
    """
    def __init__(self, budget_limit: float = 1.0):
        self.budget_limit = budget_limit
        self.fallback_mgr = ModelFallbackManager()

    def evaluate_cost_policy(self, spent_cost: float, current_model: str) -> dict:
        """
        Evaluates spent cost against budget caps and decides on active routing profiles.
        If cost spent is approaching the budget limit, automatically switches to a cheaper
        failover model profile to preserve funds.
        """
        is_blocked = spent_cost >= self.budget_limit
        
        # Calculate budget usage percentage
        usage_pct = (spent_cost / self.budget_limit) * 100 if self.budget_limit > 0 else 0
        
        recommended_model = current_model
        active_profile = "default_strong"
        action_note = "Core operational profile active."

        if is_blocked:
            recommended_model = "google/gemini-2.5-flash"  # Emergency ultra-cheap fallback
            active_profile = "default_fast"
            action_note = "✕ BUDGET EXCEEDED: Run blocked. Emergency fallback forced."
        elif usage_pct >= 80.0:
            # Shift to cheap coder models to safeguard budget
            recommended_model = "qwen/qwen-2.5-coder-32b"
            active_profile = "cheap_coder"
            action_note = "⚠️ BUDGET WARNING (>80%): Dynamic fallback shifted to high-value cheap coder models."
        elif usage_pct >= 50.0:
            # Shift to mid-tier fallbacks
            recommended_model = "google/gemini-2.5-flash"
            active_profile = "default_fast"
            action_note = "⚠️ BUDGET WARNING (>50%): Dynamic fallback shifted to low-cost fast models."

        return {
            "spent_cost": spent_cost,
            "budget_limit": self.budget_limit,
            "usage_percentage": usage_pct,
            "is_blocked": is_blocked,
            "recommended_model": recommended_model,
            "active_fallback_profile": active_profile,
            "action_note": action_note,
            "payload_openai": self.fallback_mgr.build_openai_sdk_payload(recommended_model, active_profile)
        }

if __name__ == "__main__":
    print("Testing Model Policy Controller...")
    controller = ModelPolicyController(budget_limit=2.0)
    
    # Scenario A: Low usage
    print("\nScenario A (Low Usage - $0.15 spent):")
    import pprint
    pprint.pprint(controller.evaluate_cost_policy(0.15, "anthropic/claude-3-5-sonnet"))
    
    # Scenario B: High usage (>80%)
    print("\nScenario B (High Usage - $1.75 spent):")
    pprint.pprint(controller.evaluate_cost_policy(1.75, "anthropic/claude-3-5-sonnet"))
    
    # Scenario C: Exceeded budget ($2.10 spent)
    print("\nScenario C (Budget Exceeded - $2.10 spent):")
    pprint.pprint(controller.evaluate_cost_policy(2.10, "anthropic/claude-3-5-sonnet"))
