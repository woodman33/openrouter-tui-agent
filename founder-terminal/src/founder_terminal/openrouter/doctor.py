from founder_terminal.config import load_config
from founder_terminal.openrouter import (
    detect_openrouter_status,
    OpenRouterPolicy,
    evaluate_policy
)

def run_openrouter_doctor() -> dict:
    """
    Executes a specific diagnostic sanity check of the OpenRouter model integration environment.
    """
    passed = []
    failed = []
    
    # Check 1: Environmental status and credentials
    try:
        status = detect_openrouter_status()
        if status.openrouter_key_present:
            passed.append(f"OpenRouter API key detected in environment: [bold green]{status.openrouter_key_redacted}[/bold green]")
        else:
            failed.append("OpenRouter API key is missing or unset in the .env configuration")
            
        if status.stripe_installed:
            passed.append("Stripe CLI is installed on host system.")
            if status.projects_available:
                passed.append("Stripe projects command active and verified.")
            else:
                failed.append("Stripe projects plugin is missing from the CLI.")
        else:
            failed.append("Stripe CLI not found on host system.")
    except Exception as e:
        failed.append(f"Stripe status check exception: {e}")
        
    # Check 2: Endpoint URL Configuration
    config = load_config()
    base_url = config.openrouter_base_url
    if base_url:
        passed.append(f"OpenRouter base URL endpoint configured: [bold green]{base_url}[/bold green]")
    else:
        failed.append("OpenRouter base URL is unset (recommending: https://openrouter.ai/api/v1)")

    # Check 3: Default Model Configuration
    default_model = config.llm_model
    if default_model:
        passed.append(f"Default LLM model target active: [bold green]{default_model}[/bold green]")
    else:
        failed.append("Default LLM model target is unset in settings")

    # Check 4: Budget Policy Controller Verification
    try:
        policy = OpenRouterPolicy(
            primary_model=default_model or "anthropic/claude-sonnet-4",
            max_run_cost_usd=config.llm_api_key if hasattr(config, 'max_cost') else 1.00
        )
        report = evaluate_policy(policy)
        passed.append(f"Budget controller verified: active model {report.recommended_model} (limit: ${policy.max_run_cost_usd:.2f})")
    except Exception as e:
        failed.append(f"Budget controller policy exception: {e}")

    return {
        "passed": passed,
        "failed": failed
    }

if __name__ == "__main__":
    print("Running OpenRouter Diagnostic Doctor...")
    res = run_openrouter_doctor()
    print("\n--- Passed ---")
    for p in res["passed"]: print("✓", p)
    print("\n--- Failed ---")
    for f in res["failed"]: print("✕", f)
