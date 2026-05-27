from enum import Enum
import os
import sys

class ShellKind(str, Enum):
    BASH = "bash"
    ZSH = "zsh"
    DASH = "dash"
    ASH = "ash"
    FISH = "fish"
    NUSHELL = "nu"
    ELVISH = "elvish"
    XONSH = "xonsh"
    TCSH = "tcsh"
    POWERSHELL = "powershell"
    UNKNOWN = "unknown"

class XCmdRuntimeMode(str, Enum):
    LIBRARY_FUNCTION = "library_function"
    EXTERNAL_COMMAND = "external_command"
    POWERSHELL_BRIDGE = "powershell_bridge"
    UNKNOWN = "unknown"

def detect_shell(shell_override: str = None) -> dict:
    """
    Identifies the default target user shell and derives the loading strategy.
    """
    shell_path = shell_override or os.getenv("SHELL", "")
    shell_name = os.path.basename(shell_path).lower() if shell_path else "unknown"

    posix_like = True
    runtime_mode = XCmdRuntimeMode.LIBRARY_FUNCTION
    load_strategy = "source_x_file"

    if shell_name in ["bash", "zsh", "dash", "ash", "sh"]:
        posix_like = True
        runtime_mode = XCmdRuntimeMode.LIBRARY_FUNCTION
        load_strategy = "source_x_file"
        kind = ShellKind.BASH if shell_name == "bash" else (ShellKind.ZSH if shell_name == "zsh" else ShellKind.DASH)
    elif shell_name in ["fish", "nu", "elvish", "xonsh", "tcsh"]:
        posix_like = False
        runtime_mode = XCmdRuntimeMode.EXTERNAL_COMMAND
        load_strategy = "posix_subshell_bridge"
        if shell_name == "fish":
            kind = ShellKind.FISH
        elif shell_name == "nu":
            kind = ShellKind.NUSHELL
        elif shell_name == "elvish":
            kind = ShellKind.ELVISH
        else:
            kind = ShellKind.XONSH
    elif "powershell" in shell_name or "pwsh" in shell_name:
        posix_like = False
        runtime_mode = XCmdRuntimeMode.POWERSHELL_BRIDGE
        load_strategy = "powershell_bridge"
        kind = ShellKind.POWERSHELL
    else:
        posix_like = True
        runtime_mode = XCmdRuntimeMode.LIBRARY_FUNCTION
        load_strategy = "source_x_file"
        kind = ShellKind.UNKNOWN

    return {
        "shell": kind,
        "runtime_mode": runtime_mode,
        "posix_like": posix_like,
        "load_strategy": load_strategy,
        "setup_command": None,
        "notes": [f"Shell derived dynamically from: {shell_path}"]
    }

def build_xcmd_command(args: list[str], shell_override: str = None) -> str:
    """
    Builds the safe X-CMD command string adapted to the shell environment.
    """
    shell_info = detect_shell(shell_override)
    args_str = " ".join(args)
    
    xcmd_path = '"$HOME/.x-cmd.root/X"'
    
    if shell_info["posix_like"]:
        # Direct library-function sourcing
        return f'. {xcmd_path} && x {args_str}'
    else:
        # Wrap via external POSIX bridge
        return f"sh -lc '. {xcmd_path} && x {args_str}'"

if __name__ == "__main__":
    print("Testing Shell Adapter Command Builder...")
    args = ["env", "use", "jq"]
    print("POSIX Command:", build_xcmd_command(args, "/bin/zsh"))
    print("Non-POSIX Command:", build_xcmd_command(args, "/usr/local/bin/fish"))
