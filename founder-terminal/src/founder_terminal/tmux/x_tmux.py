import os
import shutil
import subprocess
import datetime
from founder_terminal.tmux.detector import detect_tmux
from founder_terminal.runs.store import RunStore

class XTtmuxWrapper:
    def __init__(self):
        self.store = RunStore()

    def detect_abtop(self) -> dict:
        """
        Detects if abtop (Agent Activity Monitor) is installed globally.
        """
        abtop_path = shutil.which("abtop")
        return {
            "installed": abtop_path is not None,
            "path": abtop_path
        }

    def capture_abtop_once(self) -> str:
        """
        Captures a read-only telemetry snapshot of active processes using abtop --once.
        """
        abtop_info = self.detect_abtop()
        if not abtop_info["installed"]:
            return "✕ abtop is not installed on this host. Recommending install: x install abtop"
            
        try:
            res = subprocess.run("abtop --once", shell=True, capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return res.stdout
            else:
                return f"✕ abtop execution failed with code {res.returncode}"
        except Exception as e:
            return f"✕ abtop execution exception: {e}"

    def setup_x_tmux(self) -> str:
        """
        Configures x-cmd tmux integration in ~/.tmux.conf safely after backups.
        """
        tmux_info = detect_tmux()
        tmux_conf = os.path.expanduser("~/.tmux.conf")
        
        # 1. Create automatic timestamped backup first
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{tmux_conf}.founder-terminal-backup-{timestamp}"
        
        if os.path.exists(tmux_conf):
            try:
                shutil.copy2(tmux_conf, backup_path)
            except Exception as e:
                return f"✕ Failed to create backup of ~/.tmux.conf: {e}"
        else:
            backup_path = "None (File did not exist)"

        # 2. Append setup line safely
        setup_line = "\n# X-CMD tmux support loaded by Founder Terminal\n[ -f ~/.x-cmd.root/local/data/tmux/rc ] && source ~/.x-cmd.root/local/data/tmux/rc\n"
        try:
            with open(tmux_conf, "a") as f:
                f.write(setup_line)
            
            # Log mutation in run store
            self.store.log_config_mutation(
                file_path=tmux_conf,
                action="SETUP_X_TMUX",
                backup_path=backup_path
            )
            return f"✓ x-cmd tmux support successfully configured in {tmux_conf}\n✓ Backup created at: {backup_path}"
        except Exception as e:
            return f"✕ Failed to write ~/.tmux.conf: {e}"

if __name__ == "__main__":
    print("Testing abtop detection...")
    wrapper = XTtmuxWrapper()
    print("abtop Installed:", wrapper.detect_abtop())
