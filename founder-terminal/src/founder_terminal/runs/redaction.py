import re

# Precise patterns to detect and mask API keys, tokens, and credentials safely
SECRET_PATTERNS = [
    # Match sk-... style API keys
    (r"sk-[a-zA-Z0-9]{20,}", "[REDACTED_API_KEY]"),
    # Match direct key allocations: OPENAI_API_KEY, GITHUB_TOKEN, etc.
    (r"(OPENAI_API_KEY|ANTHROPIC_API_KEY|OPENROUTER_API_KEY|CLOUDFLARE_API_TOKEN|GITHUB_TOKEN)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-\.\+]{8,}['\"]?", r"\1=[REDACTED_SECRET]"),
    # Match HTTP Authorization Bearer headers
    (r"Bearer\s+[a-zA-Z0-9_\-\.\+]{10,}", "Bearer [REDACTED_BEARER_TOKEN]"),
    # Match common credential variables: password=, api_key=, secret=
    (r"(password|api_key|secret|token)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-\.\+]{4,}['\"]?", r"\1=[REDACTED_VALUE]")
]

def redact_secrets(text: str) -> str:
    """
    Scrubs and replaces common secret patterns with high-visibility redaction tags.
    """
    if not text:
        return text
    for pattern, replacement in SECRET_PATTERNS:
        try:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        except Exception:
            pass
    return text

def run_redaction_dry_run() -> dict:
    """
    Unit-style dry-run verification to confirm that fake secrets are masked successfully.
    """
    samples = {
        "key_test": "export OPENROUTER_API_KEY='sk-or-v1-abcdef1234567890'",
        "bearer_test": "Authorization: Bearer my_secret_token_12345",
        "credential_test": "database_password = 'super_secure_pass123'",
        "generic_secret": "api_key=mykeyval"
    }
    
    results = {}
    for name, val in samples.items():
        results[name] = {
            "original": val,
            "masked": redact_secrets(val)
        }
    return results

if __name__ == "__main__":
    print("Running Redaction Verification...")
    import pprint
    pprint.pprint(run_redaction_dry_run())
