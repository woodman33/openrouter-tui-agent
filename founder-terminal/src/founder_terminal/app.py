import sys
from dotenv import load_dotenv

def main():
    # Load settings from environment first
    load_dotenv()
    
    try:
        from founder_terminal.tui.main_app import FounderTerminalApp
        app = FounderTerminalApp()
        app.run()
    except Exception as e:
        print(f"Fatal Error starting Founder Terminal: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
