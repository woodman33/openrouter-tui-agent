import os
import shutil
import subprocess

def detect_xcmd() -> dict:
    """
    Scans the host system to determine if X-CMD and tmux utilities are configured correctly.
    """
    xcmd_root_path = os.path.expanduser("~/.x-cmd.root/X")
    xcmd_installed = os.path.exists(xcmd_root_path)
    tmux_installed = shutil.which("tmux") is not None
    inside_tmux = os.getenv("TMUX") is not None
    
    tmux_conf_path = os.path.expanduser("~/.tmux.conf")
    tmux_conf_exists = os.path.exists(tmux_conf_path)
    
    x_tmux_setup_detected = False
    if tmux_conf_exists:
        try:
            with open(tmux_conf_path, "r") as f:
                content = f.read()
                x_tmux_setup_detected = "x-cmd" in content or "x tmux" in content
        except Exception:
            pass

    x_tmux_available = False
    errors = []
    if xcmd_installed and tmux_installed:
        # Dry run checking x tmux help using standard shell sourcing
        try:
            cmd = f'. {xcmd_root_path} && x tmux --help'
            res = subprocess.run(cmd, shell=True, executable="/bin/bash", capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                x_tmux_available = True
            else:
                errors.append(f"x tmux --help returned exit code {res.returncode}")
        except Exception as e:
            errors.append(f"Dry-run execution failed: {e}")

    return {
        "xcmd_installed": xcmd_installed,
        "tmux_installed": tmux_installed,
        "x_tmux_available": x_tmux_available,
        "inside_tmux": inside_tmux,
        "tmux_conf": tmux_conf_path if tmux_conf_exists else None,
        "x_tmux_setup_detected": x_tmux_setup_detected,
        "errors": errors
    }

if __name__ == "__main__":
    print("Running Host X-CMD Detection Check...")
    import pprint
    pprint.pprint(detect_xcmd())
