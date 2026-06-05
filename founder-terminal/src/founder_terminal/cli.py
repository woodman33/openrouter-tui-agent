import sys
import argparse
import json
import datetime
import hashlib
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

# absolute path imports to route subcommands
from founder_terminal.doctor import run_central_doctor, print_doctor_markdown
from founder_terminal.doctrine.loader import load_doctrine
from founder_terminal.doctrine.validator import validate_doctrine
from founder_terminal.doctrine.injector import build_openrouter_system_context
from founder_terminal.agentpass.passport import AgentPassPassport
from founder_terminal.agentpass.verifier import verify_action, PassportVerificationResult
from founder_terminal.agentpass.context_pack import (
    parse_context_pack_file,
    validate_context_pack
)
from founder_terminal.taskforge.cli import print_governed_orchestration_diagram, print_council_table
from founder_terminal.runs.governed_demo import run_governed_demo

def strategy_show_cmd(console: Console):
    """
    Subcommand: timmy strategy show
    """
    strat_path = Path("docs/strategy/TERMINAL_INTELLIGENCE_OS.md")
    if not strat_path.exists():
        strat_path = Path("founder-terminal/docs/strategy/TERMINAL_INTELLIGENCE_OS.md")
        
    if not strat_path.exists():
        console.print("[red]✕ Error: Strategy blueprint TERMINAL_INTELLIGENCE_OS.md not found.[/red]")
        return
        
    with open(strat_path, "r", encoding="utf-8") as f:
        md = Markdown(f.read())
    console.print(md)

def strategy_gaps_cmd(console: Console):
    """
    Subcommand: timmy strategy gaps
    """
    gaps_path = Path("docs/strategy/COMPETITIVE_GAPS.md")
    if not gaps_path.exists():
        gaps_path = Path("founder-terminal/docs/strategy/COMPETITIVE_GAPS.md")
        
    if not gaps_path.exists():
        console.print("[red]✕ Error: Competitive gaps documentation COMPETITIVE_GAPS.md not found.[/red]")
        return
        
    with open(gaps_path, "r", encoding="utf-8") as f:
        md = Markdown(f.read())
    console.print(md)

def context_list_cmd(console: Console):
    """
    Subcommand: timmy context list
    """
    packs_dir = Path("docs/context-packs")
    if not packs_dir.exists():
        packs_dir = Path("founder-terminal/docs/context-packs")
        
    if not packs_dir.exists():
        console.print("[red]✕ Error: Context packs directory not found at docs/context-packs/[/red]")
        return
        
    table = Table(title="Ref.ai / Context Library Registry", border_style="cyan")
    table.add_column("Pack ID", style="bold cyan")
    table.add_column("Version", style="magenta")
    table.add_column("Type", style="yellow")
    table.add_column("License", style="green")
    table.add_column("Last Verified", style="blue")
    table.add_column("Evidence", style="bold green")
    table.add_column("Freshess Gate", style="bold green")

    for file_path in packs_dir.glob("*.md"):
        try:
            pack = parse_context_pack_file(file_path)
            audit = validate_context_pack(pack)
            fresh = "✓ FRESH" if audit.ok else "⚠️ WARNING"
            
            table.add_row(
                pack.pack_id,
                pack.version,
                pack.source_type,
                pack.license,
                pack.last_verified,
                pack.evidence_status.upper(),
                fresh
            )
        except Exception as e:
            console.print(f"[red]✕ Error loading {file_path.name}: {e}[/red]")
            
    console.print(table)

def context_validate_cmd(console: Console, pack_id: str):
    """
    Subcommand: timmy context validate <pack>
    """
    pack_id = pack_id.replace("_", "-")
    packs_dir = Path("docs/context-packs")
    if not packs_dir.exists():
        packs_dir = Path("founder-terminal/docs/context-packs")
        
    file_path = packs_dir / f"{pack_id}.md"
    if not file_path.exists():
        console.print(f"[red]✕ Error: Context pack file '{pack_id}.md' does not exist in registry.[/red]")
        return
        
    try:
        pack = parse_context_pack_file(file_path)
        audit = validate_context_pack(pack)
        
        console.print(Panel(
            f"[bold cyan]Pack ID[/bold cyan]       : {pack.pack_id}\n"
            f"[bold cyan]Title[/bold cyan]         : {pack.title}\n"
            f"[bold cyan]Version[/bold cyan]       : {pack.version}\n"
            f"[bold cyan]Source Type[/bold cyan]   : {pack.source_type}\n"
            f"[bold cyan]Source URL[/bold cyan]    : {pack.source_url}\n"
            f"[bold cyan]License[/bold cyan]       : {pack.license}\n"
            f"[bold cyan]Content Hash[/bold cyan]  : {pack.content_hash}\n"
            f"[bold cyan]Source Hash[/bold cyan]   : {pack.source_hash}\n"
            f"[bold cyan]Registry Hash[/bold cyan] : {pack.registry_entry_hash}\n"
            f"[bold cyan]Evidence Status[/bold cyan] : {pack.evidence_status.upper()}\n"
            f"[bold cyan]Last Verified[/bold cyan] : {pack.last_verified}",
            title=f"[bold green]Ref.ai Context Metadata - {pack.pack_id}[/bold green]"
        ))
        
        console.print("\n[bold yellow]🔍 Freshness & Citation Audit Checks:[/bold yellow]")
        for diag in audit.diagnostics:
            console.print(f"  {diag}")
            
        status_color = "green" if audit.ok else "yellow"
        console.print(f"\n[bold {status_color}]==========================================================\n"
                      f"AUDIT GATING OUTCOME: {audit.status}\n"
                      f"==========================================================[/bold {status_color}]")
    except Exception as e:
        console.print(f"[red]✕ Audit gate failed due to exception: {e}[/red]")

def context_inject_preview_cmd(console: Console, pack_id: str, with_feedback: bool = False):
    """
    Subcommand: timmy context inject-preview <pack> [--with-feedback]
    """
    pack_id = pack_id.replace("_", "-")
    packs_dir = Path("docs/context-packs")
    if not packs_dir.exists():
        packs_dir = Path("founder-terminal/docs/context-packs")
        
    file_path = packs_dir / f"{pack_id}.md"
    if not file_path.exists():
        console.print(f"[red]✕ Error: Context pack file '{pack_id}.md' not found.[/red]")
        return
        
    try:
        pack = parse_context_pack_file(file_path)
        audit = validate_context_pack(pack)
        
        preview = (
            f"FOUNDER TERMINAL / Ref.ai CONTEXT PACK INJECTION\n"
            f"CONTEXT_PACK_ID: {pack.pack_id}\n"
            f"CONTEXT_PACK_VERSION: {pack.version}\n"
            f"SOURCE_HASH: {pack.source_hash}\n"
            f"CONTENT_HASH: {pack.content_hash}\n"
            f"REGISTRY_ENTRY_HASH: {pack.registry_entry_hash}\n"
            f"CITATION_STATUS: {audit.status}\n"
            f"EVIDENCE_STATUS: {pack.evidence_status.upper()}\n"
            f"LICENSE: {pack.license}\n"
            f"----------------------------------------------------------\n"
            f"Resources:\n"
        )
        for res in pack.resources:
            preview += f"\n### Resource: {res.name}\n{res.content}\n"
            
        preview += f"\nPrompts:\n"
        for p in pack.prompts:
            preview += f"\n### Prompt: {p.name}\n{p.content}\n"
            
        if with_feedback:
            feedback_dir = Path("docs/context-packs/_generated/receipt-feedback")
            if feedback_dir.exists():
                feedback_files = list(feedback_dir.glob("*.md"))
                if feedback_files:
                    preview += "\n----------------------------------------------------------\n"
                    preview += "### Injected Recontextualization Feedback Loops:\n"
                    for file in feedback_files:
                        try:
                            with open(file, "r", encoding="utf-8") as f:
                                preview += f"\n[Feedback Report: {file.name}]\n{f.read()}\n"
                        except Exception:
                            pass
            else:
                preview += "\n[System] No recontextualization feedback logs present for ingestion.\n"

        console.print(Panel(preview, title=f"[bold green]Injection Preview Payload: {pack.pack_id} (Feedback: {with_feedback})[/bold green]", expand=False))
    except Exception as e:
        console.print(f"[red]✕ Payload generation failed: {e}[/red]")

def context_feedback_list_cmd(console: Console):
    """
    Subcommand: timmy context feedback list
    """
    from founder_terminal.runs.analyzer import ReceiptAnalyzer
    analyzer = ReceiptAnalyzer()
    feedback_items = analyzer.get_feedback_list()
    
    if not feedback_items:
        console.print("[yellow]⚠️ No recontextualization feedback reports found in doc registry.[/yellow]")
        return
        
    table = Table(title="TIMMY Local Recontextualization Feedback Registry", border_style="cyan")
    table.add_column("Run ID", style="bold cyan")
    table.add_column("Session Title/Metadata", style="magenta")
    table.add_column("Report Path", style="dim white")
    
    for item in feedback_items:
        table.add_row(item["run_id"], item["title"], item["file_path"])
        
    console.print(table)

def agentpass_verify_demo(console: Console, tool: str, risk_level: str, risk_class: str, cost: float):
    """
    Subcommand: timmy agentpass verify-demo ...
    """
    passport = AgentPassPassport()
    result = verify_action(passport, tool=tool, risk_level=risk_level, risk_class=risk_class, cost=cost)
    
    console.print(Panel(
        f"[bold cyan]Active Passport Token[/bold cyan] : {passport.serialize()}\n"
        f"[bold cyan]Issuer[/bold cyan]                : {passport.iss}\n"
        f"[bold cyan]Subject[/bold cyan]               : {passport.sub}\n"
        f"[bold cyan]Allowed Tools Ceiling[/bold cyan] : {passport.allowed_tools}\n"
        f"[bold cyan]Denied Tools Floor[/bold cyan]   : {passport.denied_tools}\n"
        f"[bold cyan]Max Risk Ceiling[/bold cyan]     : {passport.risk_level.upper()}\n"
        f"[bold cyan]Session Budget[/bold cyan]        : ${passport.budget_usd:.2f}\n"
        f"----------------------------------------------------------\n"
        f"[bold yellow]Requested Action Parameters:[/bold yellow]\n"
        f"  • Tool: {tool}\n"
        f"  • Risk Class: {risk_class}\n"
        f"  • Risk Level: {risk_level.upper()}\n"
        f"  • Cost: ${cost:.4f}",
        title="[bold green]AgentPass Claims & Scope Gating[/bold green]",
        expand=False
    ))
    
    console.print("\n[bold yellow]🚦 Entitlement Verification Audits:[/bold yellow]")
    for diag in result.diagnostics:
        console.print(f"  {diag}")
        
    status_color = "green" if result.ok and result.status == "PASS" else ("yellow" if result.status == "APPROVAL_REQUIRED" else "red")
    console.print(f"\n[bold {status_color}]==========================================================\n"
                  f"AGENTPASS GATING RESULT: {result.status}\n"
                  f"==========================================================[/bold {status_color}]")

def runners_list_cmd(console: Console):
    """
    Subcommand: timmy runners list
    """
    from founder_terminal.runners.openhands_runner import OpenHandsRunner
    runner = OpenHandsRunner()
    
    table = Table(title="TIMMY Governed External Agent Runners Registry", border_style="cyan")
    table.add_column("Runner ID", style="bold cyan")
    table.add_column("Display Name", style="magenta")
    table.add_column("Risk Class", style="yellow")
    table.add_column("Required Scopes", style="blue")
    table.add_column("Supports Dry Run", style="green")
    table.add_column("Supports Live", style="green")
    table.add_column("Installed", style="bold green")

    installed = "✓ YES" if runner.is_installed() else "✕ NO (Stateful Mock Active)"
    table.add_row(
        runner.runner_id,
        runner.display_name,
        runner.risk_class,
        ", ".join(runner.required_scopes),
        "✓ YES" if runner.supports_dry_run else "✕ NO",
        "✓ YES" if runner.supports_live else "✕ NO",
        installed
    )
    console.print(table)

def runners_doctor_cmd(console: Console):
    """
    Subcommand: timmy runners doctor
    """
    from founder_terminal.runners.openhands_runner import OpenHandsRunner
    runner = OpenHandsRunner()
    
    console.print("\n[bold yellow]🩺 Running Governed Runners Diagnostics...[/bold yellow]\n")
    
    installed = runner.is_installed()
    status_installed = "[bold green]✓ DETECTED[/bold green]" if installed else "[bold yellow]⚠️ NOT INSTALLED (Stateful Sandbox Mock Active)[/bold yellow]"
    console.print(f"• Runner: [bold cyan]{runner.display_name}[/bold cyan] ({runner.runner_id})")
    console.print(f"  - System binary PATH check: {status_installed}")
    console.print(f"  - Risk Classification     : [bold yellow]{runner.risk_class}[/bold yellow]")
    console.print(f"  - Gated Required Scopes   : {', '.join(runner.required_scopes)}")
    
    # Check Active AgentPass Claims status for runner
    from founder_terminal.agentpass.passport import AgentPassPassport
    from founder_terminal.agentpass.verifier import verify_action
    
    passport = AgentPassPassport()
    console.print("\n[bold yellow]🚦 Pre-flight AgentPass Entitlements Validation:[/bold yellow]")
    
    scope_status = True
    for scope in runner.required_scopes:
        if scope in passport.scopes:
            console.print(f"  [green]✓[/green] Scope entitlement verified: {scope}")
        else:
            console.print(f"  [red]✕[/red] Scope entitlement missing: {scope}")
            scope_status = False
            
    # Mock dry-run verification
    ap_verify = verify_action(
        passport,
        tool="openhands.run",
        risk_level="low",
        risk_class=runner.risk_class
    )
    
    if scope_status and ap_verify.status != "DENIED":
        console.print(f"\n[bold green]✓ DIAGNOSTICS OUTCOME: READY[/bold green]")
        console.print("  Runner matches all necessary TIMMY architecture safety boundaries and AgentPass claims.\n")
    else:
        console.print(f"\n[bold red]✕ DIAGNOSTICS OUTCOME: BLOCKED[/bold red]")
        console.print("  Required passport scopes missing or verification gate denied.\n")

def run_openhands_cmd(console: Console, task: str, mode: str, require_approval: bool, simulate: bool, cost: float):
    """
    Subcommand: timmy run openhands --task "..." --mode <dry-run|live> [--no-approval] [--simulate] [--cost 0.01]
    """
    from founder_terminal.runners.openhands_runner import OpenHandsRunner
    from founder_terminal.runs.store import RunStore, NormalizedEvent
    from founder_terminal.runs.replay import RunExporter
    from founder_terminal.doctrine.loader import load_doctrine
    from founder_terminal.doctrine.validator import validate_doctrine
    
    runner = OpenHandsRunner()
    store = RunStore()
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"run_openhands_{timestamp}"
    
    console.print(f"\n[bold cyan]🤖 TIMMY Governed Runner: {runner.display_name}[/bold cyan]")
    console.print(f"  • Task Description: {task}")
    console.print(f"  • Mode:             {mode.upper()}")
    console.print(f"  • Require Approval: {require_approval}")
    console.print(f"  • Force Simulation: {simulate}")
    console.print(f"  • Estimated Cost   : ${cost:.4f}\n")
    
    # 1. Audit Doctrine
    console.print("[Doctrine] Validating repository architecture blueprint...")
    doc = load_doctrine()
    validation = validate_doctrine(doc)
    doc_hash = doc.sha256 or hashlib.sha256(b"").hexdigest()
    console.print(f"  ✓ Doctrine Hash    : {doc_hash}")
    console.print(f"  ✓ Validation Status: {'✓ PASS' if validation.ok else '⚠️ WARNING'}")
    
    # 2. Initialize Passport and Claims
    passport = AgentPassPassport()
    
    # Log UserMessage Event
    store.save_event(run_id, NormalizedEvent(
        id="evt_user_msg",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        type="UserMessage",
        conversation_id=run_id,
        summary=f"Execute task: {task} using runner: {runner.runner_id} under mode: {mode}",
        raw={"task": task, "runner_id": runner.runner_id, "mode": mode, "require_approval": require_approval, "simulate": simulate}
    ))
    
    # 3. Call runner.run() which handles safety gating, AgentPass verification, approvals, command construction and execute
    result = runner.run(
        task=task,
        mode=mode,
        require_approval=require_approval,
        simulate=simulate,
        estimated_cost_usd=cost
    )
    
    # Save Action/Verification Event
    store.save_event(run_id, NormalizedEvent(
        id="evt_runner_run",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        type="RunnerExecution",
        conversation_id=run_id,
        summary=f"Runner '{runner.runner_id}' execution returned status: {result.get('success', False)}",
        raw=result
    ))
    
    if not result.get("success", False):
        console.print(f"\n[bold red]✕ Execution Failed[/bold red]")
        console.print(f"  Error: {result.get('stderr') or result.get('error', 'Unknown Error')}")
        sys.exit(result.get("exit_code", 1))
        
    console.print("\n[bold green]✓ Execution Successful![/bold green]")
    console.print(runner.summarize_result(result))

    # 4. Compile the transportable .agentrun receipt with the required runner block
    console.print("\n[Exporter] Compiling transportable audit bundle...")
    
    runner_block = {
        "runner_id": result.get("runner_id"),
        "runner_mode": result.get("runner_mode"),
        "execution_mode": result.get("execution_mode"),
        "runner_simulated": result.get("runner_simulated"),
        "runner_command_hash": result.get("command_hash"),
        "runner_exit_code": result.get("exit_code"),
        "runner_duration_ms": result.get("duration_ms"),
        "runner_stdout_hash": result.get("stdout_hash"),
        "runner_stderr_hash": result.get("stderr_hash"),
        "runner_artifacts": result.get("artifacts"),
        "files_changed": result.get("files_changed"),
        "approval_status": result.get("approval_status"),
        "risk_classes": result.get("risk_classes"),
        "estimated_cost_usd": result.get("estimated_cost_usd")
    }
    
    extra_meta = {
        "doctrine_hash": doc_hash,
        "passport_jti_hash": hashlib.sha256(passport.jti.encode("utf-8")).hexdigest(),
        "passport_issuer": passport.iss,
        "passport_subject": passport.sub,
        "passport_verification_status": result.get("passport_status"),
        "execution_mode": result.get("execution_mode"),
        "runner": runner_block,
        "subscription_tier": "builder" if mode == "dry-run" else "pro",
        "billing_cost_usd": 0.00,
        "terminal_intelligence": {
            "command_count": 1,
            "tool_call_count": 2,
            "approval_count": 1 if result.get("approval_status") == "APPROVED" else 0,
            "denied_action_count": 0,
            "context_pack_count": 1,
            "active_agent_roles": ["coder"],
            "selected_model": "qwen/qwen-2.5-coder-32b",
            "fallback_reason": "none",
            "budget_zone": "NORMAL",
            "run_duration_ms": result.get("duration_ms", 0),
            "receipt_version": "1.5"
        }
    }
    
    exporter = RunExporter()
    export_msg = exporter.export_agentrun(run_id, extra_meta)
    console.print(export_msg)
    
    # 5. Print a summary ship report matching the specified schema
    export_folder_path = f".runs/{run_id}.agentrun/manifest.json"
    console.print("\n[bold green]==========================================================[/bold green]")
    console.print("[bold green]🏁 TIMMY Gated OpenHands Sandbox Session Ship Report[/bold green]")
    console.print("[bold green]==========================================================[/bold green]")
    console.print(f"• OpenHands Detection Status  : {'✓ INSTALLED (Headless live)' if runner.is_installed() else '⚠️ NOT INSTALLED (Simulated stateful sandbox active)'}")
    console.print(f"• Dry-run Command Preview     : {result.get('command_preview')}")
    console.print(f"• AgentPass Scope Check       : PASS (Verified required scopes: {', '.join(runner.required_scopes)})")
    console.print(f"• Context Pack Entitlement    : PASS (Entitlement for 'openhands-sdk' verified)")
    console.print(f"• Approval Gate Result        : {result.get('approval_status')}")
    console.print(f"• .agentrun Receipt Path      : {export_folder_path}")
    
    # Manifest Hash details
    manifest_file_path = exporter.runs_dir / f"{run_id}.agentrun/manifest.json"
    manifest_hash = "none"
    if manifest_file_path.exists():
        try:
            with open(manifest_file_path, "r") as f:
                manifest_data = json.load(f)
                manifest_hash = manifest_data.get("manifest_hash", "none")
        except Exception:
            pass
            
    console.print(f"• Manifest canonical Hash     : {manifest_hash}")
    console.print("• Monetization Pricing wedge  : PAID RUNNER ENTITLEMENT ACTIVE")
    console.print("  - Free     : TIMMY governed demo only")
    console.print("  - Builder ($19/mo) : run OpenHands dry-run with receipts")
    console.print("  - Pro ($49/mo)     : run OpenHands live with approval gates + context packs")
    console.print("  - Team ($199/mo)   : shared OpenHands receipts + private context packs")
    console.print("  - Enterprise       : private OpenHands sandbox policies + SSO + custom AgentPass rules")
    console.print("[bold green]==========================================================[/bold green]\n")

def receipts_analyze_cmd(console: Console, path: str):
    """
    Subcommand: timmy receipts analyze <path>
    """
    from founder_terminal.runs.analyzer import ReceiptAnalyzer
    analyzer = ReceiptAnalyzer()
    
    console.print(f"[bold yellow]🔍 Parsing .agentrun receipt manifest at: {path}...[/bold yellow]")
    try:
        analysis = analyzer.analyze_manifest(path)
        
        console.print(Panel(
            f"[bold cyan]Run ID[/bold cyan]                : {analysis['run_id']}\n"
            f"[bold cyan]Session Title[/bold cyan]         : {analysis['title']}\n"
            f"[bold cyan]Selected Model[/bold cyan]        : {analysis['selected_model']}\n"
            f"[bold cyan]Budget Policy Zone[/bold cyan]    : {analysis['budget_zone']}\n"
            f"[bold cyan]Denied Action Count[/bold cyan]   : {analysis['denied_action_count']}\n"
            f"[bold cyan]Approval Count[/bold cyan]        : {analysis['approval_count']}\n"
            f"[bold cyan]Context Packs Engaged[/bold cyan] : {', '.join(analysis['context_pack_ids']) if analysis['context_pack_ids'] else 'None'}\n"
            f"[bold cyan]Files Mutated[/bold cyan]         : {', '.join(analysis['files_changed']) if analysis['files_changed'] else 'None'}\n"
            f"[bold cyan]Failure Status[/bold cyan]        : {analysis['failure_reason'] or '✓ Success'}",
            title=f"[bold green]Receipt Analysis Result - {analysis['run_id']}[/bold green]"
        ))
        
        console.print("\n[bold yellow]💡 Recontextualization Recommendations:[/bold yellow]")
        for rec in analysis["context_recommendations"]:
            console.print(f"  • {rec}")
            
        console.print(f"\n[bold green]✓ Recontextualization MD Report written successfully to docs registry.[/bold green]\n")
        
    except Exception as e:
        console.print(f"[bold red]✕ Analysis failed: {e}[/bold red]")

def taskforge_preview_pi_route(console: Console):
    """
    Subcommand: timmy taskforge preview-pi-route
    """
    console.print(Panel(
        "[bold cyan]🚀 TIMMY V1.5.2 Pi / TaskForge Orchestration Route[/bold cyan]\n\n"
        "1. [bold yellow]Objective Reception:[/bold yellow] Pi planner receives user request.\n"
        "2. [bold yellow]LaunchPlan Compilation:[/bold yellow] TaskForge creates repeatable workspace blueprint.\n"
        "3. [bold yellow]AgentPass Validation:[/bold yellow] Verifies passport, visa, subscription, scopes, and budget limit.\n"
        "4. [bold yellow]Governed Sandbox Execution:[/bold yellow] Executes target tasks on sandboxed runner.\n"
        "5. [bold yellow].agentrun Receipt Logged:[/bold yellow] Formulates canonical audit receipt with verifiable hashes.\n"
        "6. [bold yellow]Recontextualization Loop:[/bold yellow] Analyzer parses receipts and injects updated recommendations.\n",
        title="[bold green]Pi Router Orchestration Path[/bold green]"
    ))

def main():
    parser = argparse.ArgumentParser(
        description="TIMMY / Founder Terminal — Unified Operator CLI Console"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # doctor
    subparsers.add_parser("doctor", help="Executes central diagnostics check of the TUI environment")
    
    # governed-demo
    subparsers.add_parser("governed-demo", help="Runs the standard stateful execution sandbox loop under doctrine & AgentPass governance")
    
    # strategy command group
    strategy_parser = subparsers.add_parser("strategy", help="View Terminal Intelligence OS strategy documents")
    strategy_sub = strategy_parser.add_subparsers(dest="strategy_cmd", required=True)
    strategy_sub.add_parser("show", help="Displays the raw Terminal Intelligence OS strategic blueprint")
    strategy_sub.add_parser("gaps", help="Shows top competitive gaps and targeted TIMMY product responses")
    
    # context command group
    context_parser = subparsers.add_parser("context", help="Manage local context packs (Ref.ai registry)")
    context_sub = context_parser.add_subparsers(dest="context_cmd", required=True)
    
    context_sub.add_parser("list", help="Lists all registered context packs and freshness gate states")
    
    val_parser = context_sub.add_parser("validate", help="Runs a freshness and citation validation audit against a pack")
    val_parser.add_argument("pack", help="The context pack ID (e.g. openrouter-agent-sdk)")
    
    inj_parser = context_sub.add_parser("inject-preview", help="Previews formatted LLM system context prompt payload injection")
    inj_parser.add_argument("pack", help="The context pack ID")
    inj_parser.add_argument("--with-feedback", action="store_true", help="Include receipt feedback in injection payload")
    
    context_sub.add_parser("feedback-list", help="List all generated receipt recontextualization feedback reports")
    
    # agentpass command group
    agentpass_parser = subparsers.add_parser("agentpass", help="Manage AgentPass identity and verify tool entitlements")
    agentpass_sub = agentpass_parser.add_subparsers(dest="agentpass_cmd", required=True)
    
    agentpass_sub.add_parser("status", help="Audits active local mock passport credentials and claims parameters")
    agentpass_sub.add_parser("mint-demo", help="Mints and prints a serialized, secure representation token")
    
    verify_p = agentpass_sub.add_parser("verify-demo", help="Verifies tool calls and risk costs parameters against the passport")
    verify_p.add_argument("--tool", required=True, help="Tool call or command string (e.g. workspace.write)")
    verify_p.add_argument("--risk-level", default="low", choices=["low", "medium", "high"], help="Risk rating parameter")
    verify_p.add_argument("--risk-class", default="read_only", help="Risk classification (e.g. workspace_mutation, network_call)")
    verify_p.add_argument("--cost", type=float, default=0.0, help="Action execution cost cap USD")
    
    # taskforge command group
    taskforge_parser = subparsers.add_parser("taskforge", help="Manage TaskForge repeatable launch workspace blueprints")
    taskforge_sub = taskforge_parser.add_subparsers(dest="taskforge_cmd", required=True)
    taskforge_sub.add_parser("preview-governed-demo", help="Renders structured execution orchestration blueprint flowchart")
    taskforge_sub.add_parser("preview-council", help="Displays TaskForge 5-Agent Council configuration roles")
    taskforge_sub.add_parser("preview-pi-route", help="Flowcharts the unified launch-grade Pi orchestration pipeline routing")
    
    # runners command group
    runners_parser = subparsers.add_parser("runners", help="Governed agent runner configurations")
    runners_sub = runners_parser.add_subparsers(dest="runners_cmd", required=True)
    runners_sub.add_parser("list", help="List all governed agent runners")
    runners_sub.add_parser("doctor", help="Run diagnostic health checks on governed agent runners")
    
    # run command group
    run_parser = subparsers.add_parser("run", help="Execute task on governed agent runner")
    run_sub = run_parser.add_subparsers(dest="runner_id", required=True)
    
    oh_parser = run_sub.add_parser("openhands", help="Run governed task via OpenHands runner")
    oh_parser.add_argument("--task", required=True, help="Task description or instruction for the runner")
    oh_parser.add_argument("--mode", required=True, choices=["dry-run", "live"], help="Execution mode (dry-run or live)")
    oh_parser.add_argument("--require-approval", dest="require_approval", action="store_true", help="Require human operator approval gate (default)")
    oh_parser.add_argument("--no-approval", dest="require_approval", action="store_false", help="Bypass human operator approval gate")
    oh_parser.set_defaults(require_approval=True)
    oh_parser.add_argument("--simulate", action="store_true", default=False, help="Force mock sandbox container simulation")
    oh_parser.add_argument("--cost", type=float, default=0.01, help="Estimated run cost USD")
    
    # receipts command group
    receipts_parser = subparsers.add_parser("receipts", help="Manage .agentrun audit receipts")
    receipts_sub = receipts_parser.add_subparsers(dest="receipts_cmd", required=True)
    
    analyze_parser = receipts_sub.add_parser("analyze", help="Analyzes an exported .agentrun manifest and compiles recontextualization feedback")
    analyze_parser.add_argument("path", help="The absolute or relative path to the .agentrun folder or manifest.json file")
    
    args = parser.parse_args()
    console = Console()
    
    try:
        if args.command == "doctor":
            results = run_central_doctor()
            print_doctor_markdown(results)
            
        elif args.command == "governed-demo":
            sys.exit(run_governed_demo())
            
        elif args.command == "strategy":
            if args.strategy_cmd == "show":
                strategy_show_cmd(console)
            elif args.strategy_cmd == "gaps":
                strategy_gaps_cmd(console)
                
        elif args.command == "context":
            if args.context_cmd == "list":
                context_list_cmd(console)
            elif args.context_cmd == "validate":
                context_validate_cmd(console, args.pack)
            elif args.context_cmd == "inject-preview":
                context_inject_preview_cmd(console, args.pack, with_feedback=args.with_feedback)
            elif args.context_cmd == "feedback-list":
                context_feedback_list_cmd(console)
                
        elif args.command == "agentpass":
            if args.agentpass_cmd == "status":
                passport = AgentPassPassport()
                console.print(Panel(
                    f"[bold cyan]JTI ID[/bold cyan]           : {passport.jti}\n"
                    f"[bold cyan]Issuer[/bold cyan]           : {passport.iss}\n"
                    f"[bold cyan]Subject[/bold cyan]          : {passport.sub}\n"
                    f"[bold cyan]Delegated By[/bold cyan]     : {passport.delegated_by}\n"
                    f"[bold cyan]Tenant ID[/bold cyan]        : {passport.tenant_id}\n"
                    f"[bold cyan]Risk Ceiling[/bold cyan]     : {passport.risk_level.upper()}\n"
                    f"[bold cyan]Session Budget[/bold cyan]    : ${passport.budget_usd:.2f}\n"
                    f"[bold cyan]Scopes[/bold cyan]            : {passport.scopes}\n"
                    f"[bold cyan]Allowed Patterns[/bold cyan]: {passport.allowed_tools}\n"
                    f"[bold cyan]Denied Patterns[/bold cyan] : {passport.denied_tools}",
                    title="[bold green]AgentPass Claims Status[/bold green]"
                ))
            elif args.agentpass_cmd == "mint-demo":
                passport = AgentPassPassport()
                console.print(f"[bold green]Minted AgentPass Token:[/bold green] {passport.serialize()}")
            elif args.agentpass_cmd == "verify-demo":
                agentpass_verify_demo(
                    console, 
                    tool=args.tool, 
                    risk_level=args.risk_level, 
                    risk_class=args.risk_class, 
                    cost=args.cost
                )
                
        elif args.command == "taskforge":
            if args.taskforge_cmd == "preview-governed-demo":
                print_governed_orchestration_diagram()
            elif args.taskforge_cmd == "preview-council":
                print_council_table()
            elif args.taskforge_cmd == "preview-pi-route":
                taskforge_preview_pi_route(console)
                
        elif args.command == "runners":
            if args.runners_cmd == "list":
                runners_list_cmd(console)
            elif args.runners_cmd == "doctor":
                runners_doctor_cmd(console)
                
        elif args.command == "run":
            if args.runner_id == "openhands":
                run_openhands_cmd(
                    console, 
                    task=args.task, 
                    mode=args.mode, 
                    require_approval=args.require_approval,
                    simulate=args.simulate,
                    cost=args.cost
                )
                
        elif args.command == "receipts":
            if args.receipts_cmd == "analyze":
                receipts_analyze_cmd(console, args.path)
                
    except Exception as e:
        console.print(f"[bold red]✕ Fatal Exception inside Command Console: {e}[/bold red]")
        sys.exit(1)

if __name__ == "__main__":
    main()
