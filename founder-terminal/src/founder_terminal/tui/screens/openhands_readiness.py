from textual.app import ComposeResult
from textual.widgets import Static
from textual.containers import Container, ScrollableContainer
from rich.panel import Panel
from rich.table import Table
from founder_terminal.config import TerminalConfig

class OpenHandsReadinessScreen(Container):
    def __init__(self, config: TerminalConfig):
        super().__init__()
        self.config = config

    def compose(self) -> ComposeResult:
        # Build Capabilities Readiness Table
        table = Table(title="OpenHands SDK Alignment Feature Matrix", show_lines=True)
        table.add_column("OpenHands SDK Capability", style="cyan", width=28)
        table.add_column("Founder Terminal Implementation", style="white", width=42)
        table.add_column("Status Alignment", style="bold", justify="center", width=16)

        # 14 Core Capabilities & Statuses
        matrix_rows = [
            ("Event Store", "normalized_events.jsonl append logs", "[bold yellow]PARTIAL[/bold yellow]"),
            ("Custom Visualizer", "founder_terminal.openhands_integration.visualizer", "[bold green]IMPLEMENTED[/bold green]"),
            ("Local Conversation", "local SDK process runner", "[bold yellow]PARTIAL[/bold yellow]"),
            ("Remote Conversation", "Local Agent Server remote connection adapter", "[bold blue]PARKED[/bold blue]"),
            ("Docker Workspace", "isolated docker workspace containers", "[bold blue]PARKED[/bold blue]"),
            ("Typed Tools", "RepoMapTool, ShipabilityScoreTool, XCmdTool", "[bold yellow]PARTIAL[/bold yellow]"),
            ("MCP Integration", "SSE / stdio server list manager", "[bold blue]PARKED[/bold blue]"),
            ("Security Analyzer", "Safety check policy and tool locks", "[bold yellow]PARTIAL[/bold yellow]"),
            ("Safety Hooks", "pre/post action and quality gate scripts", "[bold yellow]PARTIAL[/bold yellow]"),
            ("Secrets Masking", "Run logs redaction filters layer", "[bold green]IMPLEMENTED[/bold green]"),
            ("Persistence & Replay", "run store and .agentrun export packages", "[bold yellow]PARTIAL[/bold yellow]"),
            ("ask_agent() Sidebar", "Ask Agent explanation telemetry sidebar", "[bold yellow]PARTIAL[/bold yellow]"),
            ("Stuck Detection", "Dynamic run stuck alert scanner", "[bold red]MISSING[/bold red]"),
            ("QA Suite", "py_compile and verification doctor", "[bold yellow]PARTIAL[/bold yellow]")
        ]

        for cap, impl, status in matrix_rows:
            table.add_row(cap, impl, status)

        # Explanatory Notes Panel
        explanation = (
            "🚀 [bold cyan]V1.1 OpenHands SDK Integration Matrix[/bold cyan]\n"
            "This cockpit integrates as a user control plane layer over OpenHands V1.\n\n"
            "🟢 [bold green]IMPLEMENTED[/bold green]: Active and verified, ready for immediate local runs.\n"
            "🟡 [bold yellow]PARTIAL[/bold yellow]  : Active local stubs, mocks, or dry-runs configured.\n"
            "🔵 [bold blue]PARKED[/bold blue]   : Design schema mapped, scheduled for V1.2 execution.\n"
            "🔴 [bold red]MISSING[/bold red]  : Backlog requirement, scheduled for subsequent cycles."
        )

        with ScrollableContainer():
            yield Static(Panel(table, border_style="cyan"))
            yield Static(Panel(explanation, title="📊 ALIGNMENT METRICS GUIDE", border_style="magenta"))
