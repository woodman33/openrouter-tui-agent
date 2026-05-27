import os
import json
import shutil
import datetime
from founder_terminal.starship.detector import detect_starship
from founder_terminal.runs.store import RunStore

def setup_starship_claude_statusline() -> str:
    """
    Configures Claude Code settings to use starship statusline telemetry.
    Applies automatic backups and logs mutations.
    """
    info = detect_starship()
    claude_settings = os.path.expanduser("~/.claude/settings.json")
    
    # 1. Ensure directory exists
    os.makedirs(os.path.dirname(claude_settings), exist_ok=True)
    
    # 2. Make backup of settings file if it exists
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{claude_settings}.backup-{timestamp}"
    
    if os.path.exists(claude_settings):
        try:
            shutil.copy2(claude_settings, backup_path)
        except Exception as e:
            return f"✕ Failed to create backup of ~/.claude/settings.json: {e}"
    else:
        backup_path = "None (New Settings File)"

    # 3. Read existing or start clean
    data = {}
    if os.path.exists(claude_settings):
        try:
            with open(claude_settings, "r") as f:
                data = json.load(f)
        except Exception:
            # Overwrite if corrupted
            pass
            
    # 4. Inject starship statusLine
    data["statusLine"] = {
        "type": "command",
        "command": "starship statusline claude-code"
    }

    # 5. Write back safely
    try:
        with open(claude_settings, "w") as f:
            json.dump(data, f, indent=2)
            
        # Log mutation in run store
        store = RunStore()
        store.log_config_mutation(
            file_path=claude_settings,
            action="SETUP_STARSHIP_CLAUDE_STATUSLINE",
            backup_path=backup_path
        )
        return f"✓ Claude Code statusLine configured successfully in {claude_settings}\n✓ Backup created at: {backup_path}"
    except Exception as e:
        return f"✕ Failed to update ~/.claude/settings.json: {e}"

if __name__ == "__main__":
    import sys
    print("Testing Starship statusline setup...")
    if "--dry-run" in sys.argv:
        print("=== [DRY-RUN SETUP STARSHIP STATUSLINE] ===")
        print("Planned Action: Backup ~/.claude/settings.json")
        print("Planned Action: Inject starship statusline config into settings.json")
        print("✓ Dry-run completed safely. No files mutated.")
    else:
        res = setup_starship_claude_statusline()
        print(res)
