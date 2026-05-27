import hashlib
from founder_terminal.doctrine.loader import DoctrineDocument
from founder_terminal.doctrine.validator import DoctrineValidation

def doctrine_hash(doctrine_text: str) -> str:
    """
    Computes a deterministic SHA-256 hash of doctrine text.
    """
    if not doctrine_text:
        return ""
    return hashlib.sha256(doctrine_text.encode("utf-8")).hexdigest()

def build_openrouter_system_context(
    document: DoctrineDocument,
    validation: DoctrineValidation,
    include_full_text: bool = True,
) -> str:
    validation_status = "PASSED" if validation.ok else f"WARN_ONLY_MISSING={validation.missing_sections}"
    doctrine_body = document.text if include_full_text and document.exists else ""

    return f"""FOUNDER TERMINAL / TIMMY DOCTRINE CONTEXT
MODE: WARN_ONLY
DOCTRINE_SHA256: {document.sha256 or "none"}
VALIDATION: {validation_status}

You are operating inside Founder Terminal / TIMMY.
Follow the architecture doctrine below before proposing or editing code.

Hard rules:
- Do not silently mutate host shell, tmux, Claude, OpenHands, or env config.
- Require timestamped backups before project env/config writes.
- Mask secrets in logs and previews.
- Respect the five-layer architecture boundary.
- Prefer the 10-day local MVP over cloud overbuild.
- Warn on missing doctrine sections, but do not block execution in V1.3.

DOCTRINE.md:
{doctrine_body}
"""

def build_openhands_task_prefix(
    document: DoctrineDocument,
    validation: DoctrineValidation,
    include_full_text: bool = True,
) -> str:
    validation_status = "PASSED" if validation.ok else f"WARN_ONLY_MISSING={validation.missing_sections}"
    doctrine_body = document.text if include_full_text and document.exists else ""

    return f"""[FOUNDER TERMINAL / TIMMY DOCTRINE CONTEXT]
[MODE: WARN_ONLY]
[DOCTRINE_SHA256: {document.sha256 or "none"}]
[VALIDATION: {validation_status}]

Before implementing, check the plan against:
1. Five-layer boundaries.
2. No silent host mutation.
3. Backup-before-write.
4. Secret masking.
5. Cost and model-routing policies.
6. 10-day MVP boundary.

DOCTRINE.md:
{doctrine_body}

[END DOCTRINE CONTEXT]
"""

if __name__ == "__main__":
    from founder_terminal.doctrine.loader import load_doctrine
    from founder_terminal.doctrine.validator import validate_doctrine
    doc = load_doctrine()
    val = validate_doctrine(doc)
    print("Router Context Preview (Full):")
    print(build_openrouter_system_context(doc, val, include_full_text=True))
