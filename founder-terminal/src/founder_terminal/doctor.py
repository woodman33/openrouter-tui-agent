import sys
import os
import json
import shutil
import importlib
import datetime
from pathlib import Path

# Absolute path imports to verify core components
from founder_terminal.xcmd.detector import detect_xcmd
from founder_terminal.tmux.detector import detect_tmux
from founder_terminal.starship.detector import detect_starship
from founder_terminal.tmux.x_tmux import XTtmuxWrapper
from founder_terminal.runs.store import RunStore
from founder_terminal.runs.redaction import redact_secrets
from founder_terminal.tmux.layout import TmuxLayoutGenerator

def run_central_doctor() -> dict:
    """
    Executes a comprehensive multi-point diagnostic check of the TUI cockpit environment.
    """
    passed = []
    failed = []
    parked = []
    
    # 1. Verify core library imports
    try:
        importlib.import_module("textual")
        passed.append(("Python Textual Import", "Textual UI libraries successfully resolved", "active"))
    except ImportError as e:
        failed.append(("Python Textual Import", f"Failed to import textual library: {e}", "missing"))

    try:
        importlib.import_module("pydantic")
        passed.append(("Pydantic Validation Import", "Pydantic parsing modules resolved", "active"))
    except ImportError as e:
        failed.append(("Pydantic Validation Import", f"Failed to import pydantic: {e}", "missing"))

    # OpenHands SDK import check (marked optional for V1 fallback process sandboxing)
    try:
        importlib.import_module("openhands")
        passed.append(("OpenHands SDK Import", "OpenHands SDK library modules resolved", "active"))
    except ImportError:
        passed.append(("OpenHands SDK Import", "OpenHands SDK missing (optional, fallback local process runners will be used)", "fallback_active"))

    # 2. Verify X-CMD & Sourcing Adapter
    xcmd_info = detect_xcmd()
    if xcmd_info["xcmd_installed"]:
        passed.append(("X-CMD Sourcing CLI", "X-CMD portable package manager found (~/.x-cmd.root/X)", "active"))
    else:
        failed.append(("X-CMD Sourcing CLI", "X-CMD root is missing (recommending: eval '$(curl https://get.x-cmd.com)')", "missing"))

    # 3. Verify tmux & x tmux setups
    tmux_info = detect_tmux()
    if tmux_info["installed"]:
        passed.append(("tmux Multiplexer", f"tmux binary found at {tmux_info['path']}", "active"))
        if tmux_info["x_tmux_setup_detected"]:
            passed.append(("x tmux Configuration", "x-cmd tmux setup block detected inside ~/.tmux.conf", "active"))
        else:
            failed.append(("x tmux Configuration", "x-cmd tmux setup block missing from ~/.tmux.conf (recommending: x tmux --setup)", "unconfigured"))
    else:
        failed.append(("tmux Multiplexer", "tmux is not installed on the host system", "missing"))

    # 4. Verify abtop Process Monitor
    tmux_wrapper = XTtmuxWrapper()
    abtop_info = tmux_wrapper.detect_abtop()
    if abtop_info["installed"]:
        passed.append(("abtop Agent Monitor", f"abtop binary found at {abtop_info['path']}", "active"))
    else:
        passed.append(("abtop Agent Monitor", "abtop not installed (observability panel will run with empty/simulated frames)", "missing"))

    # 5. Verify Starship Prompt Hooks
    starship_info = detect_starship()
    if starship_info["installed"]:
        passed.append(("Starship Telemetry Prompt", f"Starship binary found at {starship_info['path']}", "active"))
        if starship_info["claude_statusline_configured"]:
            passed.append(("Claude Code starship Statusline", "Claude Code is successfully hooked to starship statusline telemetry", "active"))
        else:
            passed.append(("Claude Code starship Statusline", "Claude Code is not yet hooked to starship statusline (run Setup in TUI)", "unconfigured"))
    else:
        passed.append(("Starship Telemetry Prompt", "Starship prompt multiplexer not found on the host system", "missing"))

    # 6. Verify Run Store Writable
    try:
        store = RunStore()
        test_path = store.runs_dir / "doctor_write_check.txt"
        with open(test_path, "w") as f:
            f.write("sanity check pass")
        os.remove(test_path)
        passed.append(("Run Store Writable", f"Verified write access under {store.runs_dir}", "active"))
    except Exception as e:
        failed.append(("Run Store Writable", f"Failed write test under run store: {e}", "failed"))

    # 7. Verify Redaction Masking Layer
    test_key = "OPENROUTER_API_KEY='sk-or-v1-abcdef1234567890'"
    redacted = redact_secrets(test_key)
    if "[REDACTED_SECRET]" in redacted:
        passed.append(("Secrets Redaction Masking", "Secrets masking filters parsed and masked tokens successfully", "active"))
    else:
        failed.append(("Secrets Redaction Masking", "Secrets masking layer failed to redact test token", "failed"))

    # 8. Verify Layout dry-run generation
    try:
        layout_gen = TmuxLayoutGenerator()
        script = layout_gen.generate_agentops_layout(dry_run=True)
        if "agentops" in script and "monitor" in script:
            passed.append(("tmux Workspace Layout dry-run", "Generated reproducible monitor layout script successfully", "active"))
        else:
            failed.append(("tmux Workspace Layout dry-run", "Generated script structure mismatch", "failed"))
    except Exception as e:
        failed.append(("tmux Workspace Layout dry-run", f"Failed to generate layout: {e}", "failed"))

    # 9. Parked integrations checklist
    parked.append(("Local Agent Server Bridge", "Planned daemon start, stop, and conversation adapters parked", "parked"))
    parked.append(("Docker Workspace Container Sandbox", "Planned isolated container copy mounts parked", "parked"))

    # 10. Run OpenRouter diagnostics
    try:
        from founder_terminal.openrouter.doctor import run_openrouter_doctor
        or_results = run_openrouter_doctor()
        for msg in or_results["passed"]:
            passed.append(("OpenRouter Diagnostic", msg, "active"))
        for msg in or_results["failed"]:
            failed.append(("OpenRouter Diagnostic", msg, "failed"))
    except Exception as e:
        failed.append(("OpenRouter Diagnostic Check", f"Failed to execute OpenRouter diagnostics: {e}", "failed"))

    # 11. Run DOCTRINE diagnostics
    try:
        from founder_terminal.doctrine.loader import load_doctrine
        from founder_terminal.doctrine.validator import validate_doctrine
        
        doc = load_doctrine()
        if doc.exists:
            val = validate_doctrine(doc)
            if val.ok:
                passed.append(("Architecture Doctrine", f"✓ Loaded and validated successfully (hash: [bold green]{doc.sha256}[/bold green])", "active"))
            else:
                failed.append(("Architecture Doctrine", f"✕ Validation warnings (missing headings: {', '.join(val.missing_sections)})", "warning"))
        else:
            failed.append(("Architecture Doctrine", "✕ DOCTRINE.md is missing from docs/architecture/ (recommending: create DOCTRINE.md contract)", "missing"))
    except Exception as e:
        failed.append(("Architecture Doctrine Check", f"Failed to run doctrine validation: {e}", "failed"))

    return {
        "passed": passed,
        "failed": failed,
        "parked": parked
    }

def print_doctor_markdown(results: dict) -> None:
    """
    Renders diagnostic checks in beautiful Github-flavored Markdown.
    """
    print("# 🧑‍⚕️ Founder Terminal / AgentOps TUI — Central Doctor Report")
    print(f"Timestamp: {os.getenv('CURRENT_TIME', datetime.date.today().isoformat())}\n")
    
    print("## 🟢 Passed Checks")
    for check_name, msg, _ in results["passed"]:
        print(f"* **{check_name}**: ✓ {msg}")
        
    if results["failed"]:
        print("\n## 🔴 Failed / Unconfigured Checks")
        for check_name, msg, _ in results["failed"]:
            print(f"* **{check_name}**: ✕ {msg}")
            
    print("\n## 🔵 Parked Integrations (V1.2 Backlog)")
    for check_name, msg, _ in results["parked"]:
        print(f"* **{check_name}**: {msg}")

def main():
    results = run_central_doctor()
    
    if "--json" in sys.argv:
        print(json.dumps(results, indent=2))
    else:
        import datetime
        print_doctor_markdown(results)

if __name__ == "__main__":
    main()
