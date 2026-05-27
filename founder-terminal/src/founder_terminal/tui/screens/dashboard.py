from textual.app import ComposeResult
from textual.widgets import Static
from textual.containers import Container, Horizontal, Vertical
from rich.panel import Panel
from rich.table import Table
from rich.align import Align
from founder_terminal.config import TerminalConfig
import os

class DashboardScreen(Container):
    def __init__(self, config: TerminalConfig):
        super().__init__()
        self.config = config

    def compose(self) -> ComposeResult:
        # 1. Edge Integrations status
        daytona_active = "ACTIVE (Edge)" if os.getenv("DAYTONA_API_KEY") else "LOCAL (Sub)"
        trigger_active = "ACTIVE (Edge)" if os.getenv("TRIGGER_SECRET_KEY") else "MOCK (Local)"
        composio_active = "ACTIVE (Edge)" if os.getenv("COMPOSIO_API_KEY") else "MOCK (Local)"
        cloudflare_active = "ACTIVE (Edge)" if os.getenv("CLOUDFLARE_ACCOUNT_ID") else "LOCAL (DO)"

        integrations_table = Table(box=None, show_header=False)
        integrations_table.add_row("Daytona:", f"[bold green]{daytona_active}[/bold green]" if "ACTIVE" in daytona_active else f"[bold yellow]{daytona_active}[/bold yellow]")
        integrations_table.add_row("Trigger.dev:", f"[bold green]{trigger_active}[/bold green]" if "ACTIVE" in trigger_active else f"[bold yellow]{trigger_active}[/bold yellow]")
        integrations_table.add_row("Composio:", f"[bold green]{composio_active}[/bold green]" if "ACTIVE" in composio_active else f"[bold yellow]{composio_active}[/bold yellow]")
        integrations_table.add_row("Cloudflare:", f"[bold green]{cloudflare_active}[/bold green]" if "ACTIVE" in cloudflare_active else f"[bold purple]{cloudflare_active}[/bold purple]")

        # 2. Local sandbox and runtime states
        system_table = Table(box=None, show_header=False)
        system_table.add_row("Default Sandbox:", f"[bold cyan]{self.config.default_sandbox}[/bold cyan]")
        system_table.add_row("Default Runtime:", f"[bold blue]{self.config.default_runtime}[/bold blue]")
        system_table.add_row("Safe Write Mode:", "[bold green]ISOLATED COPY[/bold green]")
        system_table.add_row("Dangerous Cmds:", "[bold red]BLOCKED[/bold red]" if not self.config.enable_dangerous_commands else "[bold green]ALLOWED[/bold green]")

        # 3. Model Triage Profile
        model_table = Table(box=None, show_header=False)
        model_table.add_row("Default model:", f"[bold green]{self.config.llm_model}[/bold green]")
        model_table.add_row("Max cost/session:", f"[bold yellow]${self.config.max_cost if hasattr(self.config, 'max_cost') else '1.00'}[/bold yellow]")
        model_table.add_row("Telemetry stream:", "[bold green]READY[/bold green]")

        # Compose into columns
        with Horizontal():
            with Vertical(classes="column"):
                yield Static(Panel(integrations_table, title="🔌 EDGE INTEGRATIONS", border_style="cyan"))
                yield Static(Panel(system_table, title="🛡️ SANBOX & SECURITY SETTINGS", border_style="green"))
            with Vertical(classes="column"):
                yield Static(Panel(model_table, title="🧠 ACTIVE LLM OPS PROFILE", border_style="blue"))
                yield Static(Panel(
                    Align.center("\n[bold purple]Founder Terminal[/bold purple] is waiting for operator commands.\nUse the tabs to spin up tmux grids or run OpenHands recipes.", vertical="middle"),
                    title="⚡ OPERATOR STATUS", border_style="magenta"
                ))
