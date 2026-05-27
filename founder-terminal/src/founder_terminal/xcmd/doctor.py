from founder_terminal.xcmd.detector import detect_xcmd
from founder_terminal.xcmd.shell_adapter import detect_shell, build_xcmd_command
import subprocess
import shutil

def run_doctor() -> dict:
    """
    Executes a multi-point sanity check of the shell and X-CMD toolchain.
    """
    shell_info = detect_shell()
    xcmd_info = detect_xcmd()
    
    passed_checks = []
    failed_checks = []
    recommended_fixes = []
    risk_level = "READ_ONLY"

    # Check 1: Shell kind
    passed_checks.append(f"Detected default shell is [bold cyan]{shell_info['shell']}[/bold cyan] ({shell_info['load_strategy']} strategy)")

    # Check 2: X-CMD Local Installation
    if xcmd_info["xcmd_installed"]:
        passed_checks.append("X-CMD local directory exists (~/.x-cmd.root/X)")
    else:
        failed_checks.append("X-CMD is not installed locally on the host")
        recommended_fixes.append("Install X-CMD: eval \"$(curl https://get.x-cmd.com)\"")
        risk_level = "HIGH_RISK"

    # Check 3: Safe execution check (x nihao test)
    if xcmd_info["xcmd_installed"]:
        try:
            cmd = build_xcmd_command(["nihao", "--llmstxt"])
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                passed_checks.append("Executable connection verified (x nihao ran successfully)")
            else:
                failed_checks.append(f"Verification execution failed with code {res.returncode}")
        except Exception as e:
            failed_checks.append(f"Sanity test execution exception: {e}")
            
    # Check 4: x tmux availability
    if xcmd_info["x_tmux_available"]:
        passed_checks.append("x tmux workspace launcher is fully active and ready")
    else:
        failed_checks.append("x tmux wrapper is currently missing or unconfigured")
        recommended_fixes.append("Configure x-cmd tmux integration: x tmux --setup")

    # Check 5: abtop availability
    abtop_installed = shutil.which("abtop") is not None
    if abtop_installed:
        passed_checks.append("abtop agent monitor sidecar is active in path")
    else:
        passed_checks.append("abtop sidecar not installed (optional, TUI will load without it)")

    return {
        "passed": passed_checks,
        "failed": failed_checks,
        "fixes": recommended_fixes,
        "risk": risk_level
    }

if __name__ == "__main__":
    print("Running Doctor...")
    res = run_doctor()
    print("\n--- Passed ---")
    for p in res["passed"]: print("✓", p)
    print("\n--- Failed ---")
    for f in res["failed"]: print("✕", f)
