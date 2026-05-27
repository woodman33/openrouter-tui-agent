import shutil
import os
import json

def detect_starship() -> dict:
    """
    Checks if Starship, starship.toml, and Claude Code statusline integrations are configured.
    """
    starship_path = shutil.which("starship")
    installed = starship_path is not None
    
    starship_conf_path = os.path.expanduser("~/.config/starship.toml")
    conf_exists = os.path.exists(starship_conf_path)
    
    claude_settings_path = os.path.expanduser("~/.claude/settings.json")
    claude_exists = os.path.exists(claude_settings_path)
    
    claude_statusline_configured = False
    errors = []
    
    if claude_exists:
        try:
            with open(claude_settings_path, "r") as f:
                data = json.load(f)
                status_line = data.get("statusLine", {})
                if status_line.get("type") == "command" and "starship statusline" in status_line.get("command", ""):
                    claude_statusline_configured = True
        except Exception as e:
            errors.append(f"Failed to read ~/.claude/settings.json: {e}")

    return {
        "installed": installed,
        "path": starship_path,
        "config_path": starship_conf_path if conf_exists else None,
        "claude_settings_path": claude_settings_path if claude_exists else None,
        "claude_statusline_configured": claude_statusline_configured,
        "errors": errors
    }

if __name__ == "__main__":
    print("Detecting Starship status...")
    import pprint
    pprint.pprint(detect_starship())
