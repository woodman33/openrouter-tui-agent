def generate_run_title(first_message: str) -> str:
    """
    Generates a deterministic local run title by scanning keywords inside the first user message.
    Avoids external LLM dependencies during early V1 initialization.
    """
    msg = first_message.lower()
    
    # 1. Match security and credential scans
    if any(k in msg for k in ["security", "vulnerability", "cve", "secret", "scan", "audit"]):
        return "security"
    # 2. Match bug reports and hotfixes
    elif any(k in msg for k in ["bug", "fix", "resolve", "crash", "error", "hotfix"]):
        return "bugfix"
    # 3. Match upgrades and package updates
    elif any(k in msg for k in ["dependency", "upgrade", "npm", "pip", "uv", "package", "version"]):
        return "dependency"
    # 4. Match system alerts and failures
    elif any(k in msg for k in ["incident", "alert", "outage", "downtime", "critical"]):
        return "incident"
    # 5. Match documentations
    elif any(k in msg for k in ["doc", "readme", "comment", "guide", "license"]):
        return "docs"
    # 6. Match research and investigations
    elif any(k in msg for k in ["research", "explain", "analyze", "explore", "inspect"]):
        return "research"
    # 7. Match new features or files
    elif any(k in msg for k in ["feature", "add", "create", "new", "build", "generate"]):
        return "feature"
    else:
        return "general"

if __name__ == "__main__":
    tests = [
        "Scan dependencies, secrets, and security issues...",
        "Fix the infinite loop crash in the workspace panel",
        "Add a Starship statusline detector command",
        "Explain how the X-CMD shell sourcing works"
    ]
    print("Running Title Generation Tests:")
    for t in tests:
        print(f"Prompt: {t:50} => Title: {generate_run_title(t)}")
