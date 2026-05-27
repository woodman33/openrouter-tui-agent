import shutil
import os

def detect_tmux() -> dict:
    """
    Examines if tmux, x tmux setup blocks, and shell environments are active.
    """
    tmux_path = shutil.which("tmux")
    installed = tmux_path is not None
    inside_tmux = os.getenv("TMUX") is not None
    
    tmux_conf_path = os.path.expanduser("~/.tmux.conf")
    conf_exists = os.path.exists(tmux_conf_path)
    
    x_tmux_setup_detected = False
    if conf_exists:
        try:
            with open(tmux_conf_path, "r") as f:
                content = f.read()
                x_tmux_setup_detected = "x-cmd" in content or "x tmux" in content
        except Exception:
            pass

    return {
        "installed": installed,
        "path": tmux_path,
        "config_path": tmux_conf_path if conf_exists else None,
        "x_tmux_setup_detected": x_tmux_setup_detected,
        "inside_tmux": inside_tmux
    }

if __name__ == "__main__":
    print("Detecting tmux...")
    import pprint
    pprint.pprint(detect_tmux())
