import argparse
import sys
from founder_terminal.doctrine.loader import load_doctrine
from founder_terminal.doctrine.validator import validate_doctrine
from founder_terminal.doctrine.injector import (
    build_openrouter_system_context,
    build_openhands_task_prefix
)

def run_cli() -> int:
    parser = argparse.ArgumentParser(
        description="TIMMY AgentOps TUI — DOCTRINE Architecture-Governance CLI"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Subcommand: status
    subparsers.add_parser("status", help="Audits local DOCTRINE.md and validation metrics.")
    
    # Subcommand: show
    subparsers.add_parser("show", help="Displays the raw content of the loaded doctrine document.")
    
    # Subcommand: inject-preview
    preview_parser = subparsers.add_parser(
        "inject-preview",
        help="Previews prompt injection payloads for standard targets."
    )
    preview_parser.add_argument(
        "--target",
        required=True,
        choices=["openrouter", "openhands"],
        help="Target runtime model payload (openrouter / openhands)."
    )
    preview_parser.add_argument(
        "--no-full",
        action="store_true",
        help="Exclude full DOCTRINE.md file content and show only metadata summary."
    )
    
    args = parser.parse_args()
    
    try:
        document = load_doctrine()
        validation = validate_doctrine(document)
        
        if args.command == "status":
            print("==========================================================")
            print("TIMMY DOCTRINE STATUS REPORT")
            print("==========================================================")
            print(f"File Path        : {document.path}")
            print(f"Exists           : {'YES' if document.exists else 'NO'}")
            print(f"Byte Count       : {document.byte_count} bytes")
            print(f"SHA-256 Hash     : {document.sha256 or 'None'}")
            print("----------------------------------------------------------")
            print(f"Validation Status: {'PASS' if validation.ok else 'WARNING'}")
            print(f"Sections Present : {len(validation.present_sections)} / {validation.required_count}")
            if validation.missing_sections:
                print(f"Missing Sections : {', '.join(validation.missing_sections)}")
            print("==========================================================")
            
        elif args.command == "show":
            if not document.exists:
                print(f"✕ Error: DOCTRINE.md file does not exist at {document.path}")
                return 0
            print(document.text)
            
        elif args.command == "inject-preview":
            include_full = not args.no_full
            if args.target == "openrouter":
                preview = build_openrouter_system_context(document, validation, include_full_text=include_full)
                print(preview)
            elif args.target == "openhands":
                preview = build_openhands_task_prefix(document, validation, include_full_text=include_full)
                print(preview)
                
        return 0
    except Exception as e:
        print(f"✕ Internal Exception: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(run_cli())
