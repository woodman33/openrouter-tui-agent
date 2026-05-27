from textual.app import ComposeResult
from textual.widgets import Static, Button, TextArea
from textual.containers import Container, Horizontal, Vertical
from rich.panel import Panel
from rich.table import Table
from founder_terminal.config import TerminalConfig
from founder_terminal.openrouter import (
    detect_openrouter_status,
    StripeProjectsManager,
    OpenRouterPolicy,
    evaluate_policy,
    PayloadGenerator
)
from founder_terminal.openrouter.env_writer import remove_openrouter_env

class OpenRouterManagementScreen(Container):
    """
    Operator Billing & Routing TUI screen for Founder Terminal.
    Coordinates credential syncing, model fallbacks, and cost limits.
    """
    
    def __init__(self, config: TerminalConfig):
        super().__init__()
        self.config = config
        self.policy = OpenRouterPolicy(
            primary_model="anthropic/claude-sonnet-4",
            fallback_models=["google/gemini-2.5-pro", "openai/gpt-4o"],
            max_run_cost_usd=1.00,
            spent_usd=0.00,
            cache_enabled=True,
            zdr=True,
            service_tier="Pro"
        )
        self.stripe_mgr = StripeProjectsManager()
        self.provision_state = "normal"
        
    def reset_btn_states(self) -> None:
        """
        Resets all control buttons back to their baseline text, style, and variants.
        """
        self.provision_state = "normal"
        self.btn_live_provision.label = "Run Stripe Provisioning"
        self.btn_live_provision.variant = "success"
        self.btn_mock_provision.label = "Simulate Mock Provision"
        self.btn_mock_provision.variant = "default"
        self.btn_rotate_keys.label = "Rotate/Remove Keys"
        self.btn_rotate_keys.variant = "error"

    def compose(self) -> ComposeResult:
        # Create core widgets
        self.status_display = Static()
        self.policy_display = Static()
        
        self.output_area = TextArea(
            "==========================================================\n"
            "TIMMY OpenRouter Billing & Routing Cockpit — Systems Ready\n"
            "==========================================================\n"
            "Select an operator action below to get started...\n",
            read_only=True
        )
        
        self.payload_area = TextArea(
            PayloadGenerator.generate_typescript_agent_sdk(self.policy),
            read_only=True
        )
        
        # Initial status updates
        self.refresh_environmental_status()
        self.refresh_policy_status()
        
        # Grid layout composition
        with Horizontal():
            # Left side controls column
            with Vertical(classes="column", id="or-controls-col", width=36):
                yield self.status_display
                yield Static("[bold #5e6ad2]Credential Operator Actions:[/bold #5e6ad2]")
                self.btn_dry_run = Button("Dry-run Stripe CLI", id="btn_dry_run", variant="primary")
                self.btn_live_provision = Button("Run Stripe Provisioning", id="btn_live_provision", variant="success")
                self.btn_mock_provision = Button("Simulate Mock Provision", id="btn_mock_provision")
                self.btn_rotate_keys = Button("Rotate/Remove Keys", id="btn_rotate_keys", variant="error")
                self.btn_refresh_status = Button("Refresh Subsystem Status", id="btn_refresh_status")
                
                yield self.btn_dry_run
                yield self.btn_live_provision
                yield self.btn_mock_provision
                yield self.btn_rotate_keys
                yield self.btn_refresh_status
                
            # Middle policy column
            with Vertical(classes="column", id="or-policy-col", width=36):
                yield self.policy_display
                yield Static("[bold #5e6ad2]Spend Guard Policy Tools:[/bold #5e6ad2]")
                yield Button("Cycle Budget Triage Test", id="btn_budget_test", variant="warning")
                
            # Right console logs & payload previews column
            with Vertical(classes="column", id="or-logs-col"):
                yield Static("[bold magenta]🖥️ OPERATOR DIAGNOSTIC CONSOLE[/bold magenta]")
                yield self.output_area
                
                yield Static("[bold cyan]🧠 SDK CONFIGURATION BLUEPRINT PREVIEWS[/bold cyan]")
                with Horizontal(id="or-payload-tabs"):
                    yield Button("TS Agent SDK", id="btn_payload_ts", variant="primary")
                    yield Button("Python OpenAI SDK", id="btn_payload_py")
                    yield Button("Raw JSON API", id="btn_payload_json")
                yield self.payload_area

    def refresh_environmental_status(self) -> None:
        """
        Runs diagnostics and updates the status panel.
        """
        status = detect_openrouter_status()
        
        table = Table(box=None, show_header=False)
        table.add_row("Stripe CLI installed:", "[bold green]YES[/bold green]" if status.stripe_installed else "[bold red]NO[/bold red]")
        table.add_row("Projects plugin active:", "[bold green]AVAILABLE[/bold green]" if status.projects_available else "[bold yellow]NOT DETECTED[/bold yellow]")
        table.add_row("Project .env exists:", "[bold green]YES[/bold green]" if status.env_exists else "[bold yellow]NO[/bold yellow]")
        table.add_row("OpenRouter Key synced:", f"[bold green]YES ({status.openrouter_key_redacted})[/bold green]" if status.openrouter_key_present else "[bold yellow]MISSING[/bold yellow]")
        table.add_row("OpenRouter Type:", f"[bold cyan]{status.openrouter_type}[/bold cyan]" if status.openrouter_type else "[bold gray]N/A[/bold gray]")
        
        self.status_display.update(Panel(
            table,
            title="🔌 CREDENTIAL MANAGER STATE",
            border_style="cyan"
        ))
        
    def refresh_policy_status(self) -> None:
        """
        Runs policy evaluator and updates the policy panel.
        """
        eval_res = evaluate_policy(self.policy)
        
        # Color coding status
        status_colors = {
            "ok": "bold green",
            "warning": "bold yellow",
            "blocked": "bold red"
        }
        colored_status = f"[{status_colors.get(eval_res.status, 'white')}]{eval_res.status.upper()}[/{status_colors.get(eval_res.status, 'white')}]"
        
        table = Table(box=None, show_header=False)
        table.add_row("Primary Routing Model:", f"[bold blue]{self.policy.primary_model}[/bold blue]")
        table.add_row("Fallback chain:", f"[bold gray]{', '.join(self.policy.fallback_models)}[/bold gray]")
        table.add_row("Max Cost Cap:", f"[bold yellow]${self.policy.max_run_cost_usd:.2f}[/bold yellow]")
        table.add_row("Spent session cost:", f"[bold yellow]${self.policy.spent_usd:.4f}[/bold yellow]")
        table.add_row("ZDR Mode (Retention):", "[bold green]ENABLED[/bold green]" if self.policy.zdr else "[bold yellow]DISABLED[/bold yellow]")
        table.add_row("Service Tier Level:", f"[bold purple]{self.policy.service_tier}[/bold purple]")
        table.add_row("Evaluator Action Code:", colored_status)
        
        # Add reasons list
        reasons_text = "\n".join([f"• {r}" for r in eval_res.reasons])
        
        content = Vertical(
            Static(table),
            Static(f"\n[bold magenta]Policy Advice:[/bold magenta]\n[white]{eval_res.recommended_action}[/white]"),
            Static(f"\n[bold gray]Evaluator Diagnostics:[/bold gray]\n{reasons_text}")
        )
        
        self.policy_display.update(Panel(
            content,
            title="🛡️ ACTIVE MODEL POLICY & SPEND GUARD",
            border_style="green"
        ))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        
        # Guard: If user clicks another button during confirmation states, reset states
        if button_id not in ["btn_live_provision", "btn_mock_provision", "btn_rotate_keys"]:
            self.reset_btn_states()
        
        if button_id == "btn_dry_run":
            dry = self.stripe_mgr.dry_run()
            warnings_str = "\n".join([f"  ⚠️ {w}" for w in dry["warnings"]]) if dry["warnings"] else "  ✓ None"
            self.output_area.text = (
                "=== [DRY-RUN STRIPE PROJECTS PROVISION] ===\n"
                f"Planned Subprocess Command:\n  {dry['command']}\n\n"
                f"Planned Environment Updates:\n  Target File: {dry['backup_target']}\n"
                f"  Syncing Keys: OPENROUTER_API_KEY, OPENROUTER_TYPE=bearer\n\n"
                f"Environmental Warnings:\n{warnings_str}\n\n"
                "✓ Dry-run completed safely. No changes executed."
            )
            
        elif button_id == "btn_live_provision":
            if self.provision_state != "live_confirm":
                self.reset_btn_states()
                self.provision_state = "live_confirm"
                self.btn_live_provision.label = "⚠️ CONFIRM Live Provisioning"
                self.btn_live_provision.variant = "error"
                
                self.output_area.text = (
                    "==========================================================\n"
                    "🚨 HIGH-RISK PROVISIONING ACTION DETECTED\n"
                    "==========================================================\n"
                    "mutating action: stripe projects add openrouter/api\n"
                    "environmental effect: writes credentials to project .env file\n"
                    "operator security rule: requires explicit confirmation\n"
                    "----------------------------------------------------------\n"
                    "Please click the flashing button again to confirm live execution,\n"
                    "or click any other actions button to cancel.\n"
                    "==========================================================\n"
                )
            else:
                self.provision_state = "normal"
                self.btn_live_provision.label = "Run Stripe Provisioning"
                self.btn_live_provision.variant = "success"
                
                self.output_area.text = "Initializing live subprocess loop...\n"
                def log_callback(msg: str):
                    self.output_area.text += f"{msg}\n"
                
                res = self.stripe_mgr.provision_live(log_callback=log_callback)
                self.refresh_environmental_status()
                
        elif button_id == "btn_mock_provision":
            if self.provision_state != "mock_confirm":
                self.reset_btn_states()
                self.provision_state = "mock_confirm"
                self.btn_mock_provision.label = "👉 Confirm Simulation?"
                self.btn_mock_provision.variant = "warning"
                
                self.output_area.text = (
                    "==========================================================\n"
                    "💡 SIMULATED PROVISIONING FLOW\n"
                    "==========================================================\n"
                    "environmental effect: writes mock credentials to project .env file\n"
                    "operator security rule: approval requested\n"
                    "----------------------------------------------------------\n"
                    "Please click the button again to confirm simulated credentials sync,\n"
                    "or click any other action to cancel.\n"
                    "==========================================================\n"
                )
            else:
                self.provision_state = "normal"
                self.btn_mock_provision.label = "Simulate Mock Provision"
                self.btn_mock_provision.variant = "default"
                
                self.output_area.text = "Initializing simulated provisioning mode...\n"
                res = self.stripe_mgr.provision_simulated()
                for log_line in res["logs"]:
                    self.output_area.text += f"{log_line}\n"
                self.refresh_environmental_status()
                
        elif button_id == "btn_rotate_keys":
            if self.provision_state == "normal":
                self.reset_btn_states()
                self.provision_state = "rotate_confirm_1"
                self.btn_rotate_keys.label = "⚠️ CONFIRM step 1/2"
                self.btn_rotate_keys.variant = "warning"
                
                self.output_area.text = (
                    "==========================================================\n"
                    "🚨 HIGH-RISK CREDENTIAL PURGE / ROTATION (Step 1 of 2)\n"
                    "==========================================================\n"
                    "environmental effect: removes OPENROUTER_API_KEY from .env file\n"
                    "safety level: backup will be created first\n"
                    "----------------------------------------------------------\n"
                    "Operator double-confirmation required.\n"
                    "Click button again to confirm step 1, or click any other action to cancel.\n"
                    "==========================================================\n"
                )
            elif self.provision_state == "rotate_confirm_1":
                self.provision_state = "rotate_confirm_2"
                self.btn_rotate_keys.label = "💥 FINAL PURGE CONFIRM"
                self.btn_rotate_keys.variant = "error"
                
                self.output_area.text = (
                    "==========================================================\n"
                    "🚨 FINAL WARNING: SECURE CREDENTIAL REMOVAL (Step 2 of 2)\n"
                    "==========================================================\n"
                    "Purging OPENROUTER_API_KEY from current environment.\n"
                    "Click button one more time to execute secure wipe,\n"
                    "or click any other action to cancel.\n"
                    "==========================================================\n"
                )
            elif self.provision_state == "rotate_confirm_2":
                self.reset_btn_states()
                
                self.output_area.text = "Wiping OpenRouter credentials from project environment...\n"
                res = remove_openrouter_env(self.stripe_mgr.env_file)
                if res.success:
                    self.output_area.text += (
                        f"✓ Failsafe env purged. Backup path: {res.backup_path}\n"
                        "✓ OpenRouter credentials successfully removed from current .env file.\n"
                    )
                else:
                    self.output_area.text += f"✕ Environmental wipe failed: {res.error}\n"
                self.refresh_environmental_status()
                
        elif button_id == "btn_refresh_status":
            self.refresh_environmental_status()
            self.refresh_policy_status()
            self.output_area.text += "✓ Status refreshed.\n"
            
        elif button_id == "btn_budget_test":
            # Cycle through four cost phases: normal (<50%), caution (50-80%), emergency (80-99%), blocked (>=100%)
            if self.policy.spent_usd == 0.00:
                self.policy.spent_usd = 0.65
                self.output_area.text += "Budget Cycle: Spent Cost simulated at $0.65 (50-80% caution threshold).\n"
            elif self.policy.spent_usd == 0.65:
                self.policy.spent_usd = 0.85
                self.output_area.text += "Budget Cycle: Spent Cost simulated at $0.85 (80-99% emergency threshold).\n"
            elif self.policy.spent_usd == 0.85:
                self.policy.spent_usd = 1.20
                self.output_area.text += "Budget Cycle: Spent Cost simulated at $1.20 (>=100% block threshold).\n"
            else:
                self.policy.spent_usd = 0.00
                self.output_area.text += "Budget Cycle: Reset spent cost to nominal $0.00.\n"
                
            self.refresh_policy_status()
            # Update payloads viewer to reflect active policy shifts
            self.update_payload_display("btn_payload_ts")
            
        elif button_id in ["btn_payload_ts", "btn_payload_py", "btn_payload_json"]:
            self.update_payload_display(button_id)
            
    def update_payload_display(self, button_id: str) -> None:
        """
        Switches the payload blueprint content and adjusts active buttons.
        """
        # Dynamic policy evaluation for custom payloads
        eval_res = evaluate_policy(self.policy)
        active_policy = OpenRouterPolicy(
            primary_model=eval_res.recommended_model,
            fallback_models=eval_res.active_fallbacks,
            max_run_cost_usd=self.policy.max_run_cost_usd,
            spent_usd=self.policy.spent_usd,
            zdr=self.policy.zdr,
            service_tier=self.policy.service_tier,
            cache_enabled=self.policy.cache_enabled
        )
        
        if button_id == "btn_payload_ts":
            self.payload_area.text = PayloadGenerator.generate_typescript_agent_sdk(active_policy)
        elif button_id == "btn_payload_py":
            self.payload_area.text = PayloadGenerator.generate_openai_python_sdk(active_policy)
        elif button_id == "btn_payload_json":
            self.payload_area.text = PayloadGenerator.generate_raw_json(active_policy)
