src/
├── main.tsx                    # Entry point, Ink render
├── components/
│   ├── App.tsx                 # Root layout (3-pane)
│   ├── Header.tsx              # Top bar with branding
│   ├── ChatPane.tsx            # Main conversation area
│   ├── Message.tsx             # Individual message (streaming)
│   ├── ChatInput.tsx           # Text input with history
│   ├── Sidebar.tsx             # File explorer + git status
│   ├── FileTree.tsx            # Interactive file tree
│   ├── AgentMonitor.tsx        # Mission control dashboard
│   ├── AgentCard.tsx           # Single agent status card
│   ├── StatusBar.tsx           # Bottom status bar
│   ├── Button.tsx              # Reusable button component
│   ├── ToolCallPanel.tsx       # Expandable tool call details
│   ├── DiffViewer.tsx          # Git diff / code change view
│   ├── ModelSelector.tsx       # OpenRouter model picker
│   ├── Spinner.tsx             # Custom spinner states
│   └── GradientHeader.tsx      # Big branded headers
├── store/
│   ├── agentStore.ts           # Zustand: agent state
│   ├── uiStore.ts              # Zustand: UI state (focus, layout)
│   ├── sessionStore.ts         # Zustand: persistence
│   └── types.ts                # Shared interfaces
├── agent/
│   ├── AgentRuntime.ts         # Core agent loop
│   ├── AgentSwarm.ts           # Multi-agent orchestration
│   ├── toolRegistry.ts         # Tool definitions
│   ├── tools/
│   │   ├── readFile.ts
│   │   ├── writeFile.ts
│   │   ├── runCommand.ts
│   │   ├── gitTool.ts
│   │   └── searchCode.ts
│   └── modelRouter.ts          # OpenRouter model selection
├── services/
│   ├── openrouter.ts           # API client with retries
│   ├── filesystem.ts           # FS abstraction
│   ├── terminal.ts             # node-pty wrapper
│   ├── gitService.ts           # Git operations
│   └── watcher.ts              # File watching
├── bus/
│   └── agentBus.ts             # RxJS event bus
├── db/
│   ├── schema.sql              # SQLite schema
│   └── index.ts                # Database wrapper
├── hooks/
│   ├── useAgentStream.ts       # AI streaming hook
│   ├── useFileWatcher.ts       # File watch hook
│   ├── useTerminal.ts          # PTY integration hook
│   ├── useKeyboard.ts          # Global keybinds
│   └── useCostTracker.ts       # Real-time cost tracking
├── utils/
│   ├── tokenCounter.ts         # Token estimation
│   ├── formatters.ts           # Time, cost formatting
│   └── colors.ts               # Theme palette
└── types/
    └── index.ts                # Global TypeScript type5. Why This Beats Every Alternative
React mental model — Every frontend dev on your team can contribute
True components — <AgentMonitor />, <DiffViewer /> are self-contained, testable, reusable
Hot reload — tsx watch updates the TUI instantly during development
Streaming first — React's concurrent features handle AI streaming naturally
Layout engine — Flexbox in terminal is game-changing vs manual coordinate math
Ecosystem — npm has packages for everything (Markdown, images, gradients, tables)
Future-proof — Components can be ported to a web dashboard later with minimal changes
TypeScript — End-to-end type safety across agents, tools, and UI
The result: a terminal app that feels like VS Code's UI sophistication inside your shell, powered by OpenRouter's model diversity, with agents you can actually monitor and control in real-time.s