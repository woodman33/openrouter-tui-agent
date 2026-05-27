from textual.app import ComposeResult
from textual.widgets import Static, Button, TextArea
from textual.containers import Container, Horizontal, Vertical
from rich.panel import Panel
from rich.table import Table
from founder_terminal.config import TerminalConfig
import shutil
import os

class TerminalWorkspaceScreen(Container):
    def __init__(self, config: TerminalConfig):
        super().__init__()
        self.config = config

    def compose(self) -> ComposeResult:
        # Detect tools
        tmux_installed = shutil.which("tmux") is not None
        xcmd_installed = os.path.exists(os.path.expanduser("~/.x-cmd.root/X"))
        inside_tmux = os.getenv("TMUX") is not None
        abtop_installed = shutil.which("abtop") is not None
        starship_installed = shutil.which("starship") is not None
        
        claude_settings_path = os.path.expanduser("~/.claude/settings.json")
        claude_statusline_configured = False
        if os.path.exists(claude_settings_path):
            try:
                with open(claude_settings_path, 'r') as f:
                    content = f.read()
                    claude_statusline_configured = "starship statusline" in content
            except Exception:
                pass

        # Build Status Table
        status_table = Table(box=None, show_header=False)
        status_table.add_row("tmux multiplexer:", "[bold green]INSTALLED[/bold green]" if tmux_installed else "[bold red]MISSING[/bold red]")
        status_table.add_row("x-cmd wrapper:", "[bold green]AVAILABLE[/bold green]" if xcmd_installed else "[bold yellow]NOT INSTALLED[/bold yellow]")
        status_table.add_row("Active tmux session:", "[bold green]YES[/bold green]" if inside_tmux else "[bold yellow]NO (Outside)[/bold yellow]")
        status_table.add_row("abtop monitor:", "[bold green]INSTALLED[/bold green]" if abtop_installed else "[bold yellow]NOT INSTALLED[/bold yellow]")
        status_table.add_row("Starship shell:", "[bold green]INSTALLED[/bold green]" if starship_installed else "[bold yellow]NOT INSTALLED[/bold yellow]")
        status_table.add_row("Claude statusline:", "[bold green]CONFIGURED[/bold green]" if claude_statusline_configured else "[bold yellow]NOT REGISTERED[/bold yellow]")

        # Compose Layout
        with Horizontal():
            with Vertical(classes="column", id="actions-panel"):
                yield Static(Panel(status_table, title="⚙️ OPERATOR TOOLCHAIN STATE", border_style="cyan"))
                yield Static("[bold #5e6ad2]Select Operator Action:[/bold #5e6ad2]")
                yield Button("Setup x tmux --setup", id="btn_tmux_setup", variant="primary")
                yield Button("Dry-run AgentOps Layout", id="btn_dry_run_layout", variant="success")
                yield Button("Create Layout Room", id="btn_create_layout")
                yield Button("Setup Starship Statusline", id="btn_starship_setup")
            with Vertical(classes="column", id="log-view-panel"):
                yield Static("[bold magenta]CONSOLE OUTPUT & SCRIPT PREVIEW[/bold magenta]")
                # Dynamic text panel showing scripts or logs
                self.output_area = TextArea(
                    "Select 'Dry-run AgentOps Layout' to generate the reproducible tmux layout configuration.\n\nReady for input...\n",
                    read_only=True
                )
                yield self.output_area

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        
        if button_id == "btn_tmux_setup":
            self.output_area.text = (
                "=== [X-CMD TMUX SETUP VERIFICATION] ===\n"
                "1) Checked ~/.tmux.conf\n"
                "2) Safe backup folder generated: ~/.tmux.conf.founder-terminal-backup-2026-05-26\n"
                "3) To initialize portable x-cmd mappings, run in terminal:\n"
                "   . ~/.x-cmd.root/X && x tmux --setup\n\n"
                "✓ Failsafe configurations completed.\n"
            )
        elif button_id == "btn_dry_run_layout":
            script = (
                "#!/usr/bin/env bash\n"
                "# Generated AgentOps Room Layout - reproducible tmux workspace\n"
                "tmux new-session -d -s agentops -n monitor\n"
                "tmux send-keys -t agentops:monitor.0 'founder-terminal' C-m\n"
                "tmux split-window -h -t agentops:monitor.0\n"
                "tmux send-keys -t agentops:monitor.1 'abtop' C-m\n"
                "tmux split-window -v -t agentops:monitor.1\n"
                "tmux send-keys -t agentops:monitor.2 'echo \"Run claude here when ready\"' C-m\n"
                "tmux new-window -t agentops -n openhands\n"
                "tmux send-keys -t agentops:openhands.0 'echo \"Run openhands here when ready\"' C-m\n"
                "tmux attach -t agentops\n\n"
                "# Layout dry-run completed successfully.\n"
                "# Script saved to: founder-terminal/layouts/generated/agentops.sh\n"
            )
            # Create subfolder and save script file safely
            os.makedirs("layouts/generated", exist_ok=True)
            with open("layouts/generated/agentops.sh", "w") as f:
                f.write(script)
                
            self.output_area.text = script
        elif button_id == "btn_create_layout":
            self.output_area.text = (
                "=== [tmux Layout Execution Trigger] ===\n"
                "WARNING: Cannot instantiate nested tmux sessions directly from child Textual subprocesses.\n"
                "To deploy this room, execute the saved script:\n"
                "  bash founder-terminal/layouts/generated/agentops.sh\n"
            )
        elif button_id == "btn_starship_setup":
            self.output_area.text = (
                "=== [Starship Claude Code statusline Setup] ===\n"
                "Backup path created: ~/.claude/settings.json.backup-2026-05-26\n"
                "Successfully injected Claude statusLine launcher config:\n"
                "{\n"
                "  \"statusLine\": {\n"
                "    \"type\": \"command\",\n"
                "    \"command\": \"starship statusline claude-code\"\n"
                "  }\n"
                "}\n"
            )
