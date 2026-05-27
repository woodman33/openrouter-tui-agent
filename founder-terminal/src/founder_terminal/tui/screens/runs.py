from textual.app import ComposeResult
from textual.widgets import Static, Input, TextArea
from textual.containers import Container, Horizontal, Vertical
from rich.panel import Panel
from rich.table import Table
from founder_terminal.config import TerminalConfig
import os

class RunsScreen(Container):
    def __init__(self, config: TerminalConfig):
        super().__init__()
        self.config = config

    def compose(self) -> ComposeResult:
        # History list
        history_table = Table(box=None, show_header=False)
        history_table.add_row("[bold cyan]● Run #0921[/bold cyan]", "security-scan")
        history_table.add_row("[bold green]✓ Run #0834[/bold green]", "repo-map")
        history_table.add_row("[bold green]✓ Run #0742[/bold green]", "cloudflare-check")

        # Sidebar Metrics
        ask_table = Table(box=None, show_header=False)
        ask_table.add_row("Conversation Status:", "[bold green]IDLE[/bold green]")
        ask_table.add_row("Active Steps:", "[bold blue]0 / 10[/bold blue]")
        ask_table.add_row("Spent Cost:", "[bold yellow]$0.0000[/bold yellow]")
        ask_table.add_row("Sandbox Target:", "[bold cyan]Process Host[/bold cyan]")

        with Horizontal():
            with Vertical(classes="column", id="runs-history-panel", width=26):
                yield Static(Panel(history_table, title="📊 RUNS HISTORY", border_style="cyan"))
            
            with Vertical(classes="column", id="runs-event-stream"):
                yield Static("[bold green]📡 OPENHANDS LIVE COCKPIT EVENT STREAM[/bold green]")
                self.stream_area = TextArea(
                    "[System] Connected to local conversation event bus.\n"
                    "[System] Sandbox ready. Run '/run <prompt>' to start a conversation.\n"
                    "-----------------------------------------------------------------\n"
                    "▶ User: /run Scan dependencies, secrets, and security issues...\n"
                    "⚙ Tool PreToolUse hook checks: [ ALLOWED ]\n"
                    "⚙ Tool call: 'RepoMapTool' ... [ SUCCESS ]\n"
                    "◀ Assistant: No high-risk vulnerability detected. All gates passed.\n"
                    "-----------------------------------------------------------------\n"
                    "✓ Event stream ended. Normalized logs saved to .runs/run_0921/events.jsonl\n",
                    read_only=True
                )
                yield self.stream_area
                yield Input(placeholder="Type message or command (e.g. /run compile code, /steer include facts) here...", id="runs_command_input")
            
            with Vertical(classes="column", id="runs-ask-sidebar", width=34):
                yield Static(Panel(ask_table, title="🛡️ Ask Agent Sidebar", border_style="blue"))
                yield Static(Panel(
                    "💬 [bold purple]What is the agent doing?[/bold purple]\n"
                    "The agent is currently idle, waiting for a prompt or recipe trigger.\n\n"
                    "💬 [bold purple]What changed so far?[/bold purple]\n"
                    "No files changed in this active session.",
                    title="💡 SYSTEM EXPLANATION", border_style="magenta"
                ))

    def on_input_submitted(self, event: Input.Submitted) -> None:
        val = event.value.strip()
        if not val:
            return
            
        # Append input to simulated stream area
        self.stream_area.text += f"\n▶ User: {val}\n[System] Local conversation runner executed task in background thread.\n[System] Output visualizer synced.\n"
        event.input.value = ""
