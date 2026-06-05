import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from founder_terminal.taskforge.council import COUNCIL_ROLES

def print_governed_orchestration_diagram():
    """
    Renders a stunning structured orchestration diagram showing the full TIMMY governance chain.
    """
    console = Console()
    
    diagram = """
   [bold cyan]┌───────────────────────┐[/bold cyan]
   [bold cyan]│    TaskForge Labs     │[/bold cyan]  (Launch-plan authoring & recipe selection)
   [bold cyan]└───────────┬───────────┘[/bold cyan]
               │
               ▼  [dim]Generates repeatable launch plan & requested scope visa[/dim]
   [bold yellow]┌───────────┴───────────┐[/bold yellow]
   [bold yellow]│ TIMMY Governed Runner │[/bold yellow]  (Operator cockpit cockpit panel & doctrine validation)
   [bold yellow]└───────────┬───────────┘[/bold yellow]
               │
               ▼  [dim]Submits token passport & tool call payload parameters[/dim]
   [bold green]┌───────────┴───────────┐[/bold green]
   [bold green]│  AgentPass Shim Gate  │[/bold green]  (Scopes evaluation, risk ceiling & cost budgeting)
   [bold green]└───────────┬───────────┘[/bold green]
               │
               ├───────────────────────────────┐
               ▼ [dim]Gated Tool Pass[/dim]                      ▼ [dim]Denied / Blocked[/dim]
   [bold blue]┌───────────┴───────────┐[/bold blue]             [bold red]┌──────┴──────┐[/bold red]
   [bold blue]│   OpenRouter Edge     │[/bold blue]             [bold red]│ Gating Halt │[/bold red] (Run aborted immediately)
   [bold blue]│ (Model loop execution)│[/bold blue]             [bold red]└─────────────┘[/bold red]
   [bold blue]└───────────┬───────────┘[/bold blue]
               │
               ▼  [dim]Audits all files, tool calls, and fallback routing[/dim]
   [bold magenta]┌───────────┴───────────┐[/bold magenta]
   [bold magenta]│  .agentrun Receipt    │[/bold magenta]  (Redacted secure audit package & CITATION receipts)
   [bold magenta]└───────────────────────┘[/bold magenta]
"""
    
    console.print(Panel(
        diagram,
        title="[bold green]TIMMY v1.5 Governed Execution Loop Blueprint[/bold green]",
        border_style="green",
        expand=False
    ))

def print_council_table():
    """
    Renders the 5-Agent Council configurations in a beautiful Rich table.
    """
    console = Console()
    table = Table(title="TaskForge 5-Agent Council Schema", border_style="cyan")
    table.add_column("Role ID", style="bold cyan")
    table.add_column("Purpose", style="dim white")
    table.add_column("Preferred Model", style="magenta")
    table.add_column("Fallback Model", style="yellow")
    table.add_column("Risk Ceiling", style="red")
    table.add_column("Budget Limit", style="green")
    table.add_column("Status", style="bold green")
    
    for role in COUNCIL_ROLES:
        status_str = "✓ ACTIVE" if role.active else "✕ INACTIVE"
        table.add_row(
            role.role_id,
            role.purpose,
            role.preferred_model,
            role.fallback_model,
            role.risk_ceiling.upper(),
            f"${role.budget_ceiling_usd:.2f}",
            status_str
        )
        
    console.print(table)

def run_cli() -> int:
    print_governed_orchestration_diagram()
    print_council_table()
    return 0

if __name__ == "__main__":
    sys.exit(run_cli())
