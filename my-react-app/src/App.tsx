import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  PAGES,
  MODELS,
  DISCOVERED_TOOLS,
  FILE_CHANGES,
  VM_LOGS
} from "./data";
import type { VMLogRow } from "./data";


const fontHead = { fontFamily: "Geist, Outfit, ui-sans-serif, sans-serif" };

interface StatusDotProps {
  color?: string;
  animate?: boolean;
}

function StatusDot({ color = "#10b981", animate }: StatusDotProps) {
  return (
    <span
      className={animate ? "pulse-dot" : ""}
      style={{
        width: 7,
        height: 7,
        borderRadius: 99,
        background: color,
        display: "inline-block",
        flex: "none",
        position: "relative"
      }}
    />
  );
}

interface SidebarProps {
  active: string;
  setActive: (id: string) => void;
  developerMode: boolean;
}

function Sidebar({ active, setActive, developerMode }: SidebarProps) {
  const allowedPages = developerMode ? PAGES : PAGES.filter(p => p.id !== "discovery" && p.id !== "teams");

  return (
    <aside className="w-64 flex-none h-full flex flex-col" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: "rgba(16,185,129,0.12)" }}>
            <span className="flex items-center justify-center">
              <iconify-icon icon="solar:shield-check-bold" width="18" style={{ color: "var(--accent)" }} />
            </span>
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight" style={fontHead}>TIMMY V2.0</div>
            <div className="text-xs" style={{ color: "var(--slate)" }}>AgentOps Cockpit · v2.0.4</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-5 pb-2 text-xs uppercase tracking-widest" style={{ color: "var(--slate)", fontSize: 10 }}>screens</div>
        {allowedPages.map((p) => {
          const on = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className="w-full text-left px-5 py-2.5 flex items-center gap-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
              style={{
                background: on ? "rgba(255,255,255,0.04)" : "transparent",
                borderLeft: on ? `2px solid ${p.accent}` : "2px solid transparent"
              }}
            >
              <iconify-icon icon={p.glyph} width="17" style={{ color: on ? p.accent : "var(--steel)" }} />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight" style={{ color: on ? "var(--ink)" : "var(--steel)" }}>{p.label}</div>
                <div className="text-xs truncate" style={{ color: "var(--slate)", fontSize: 10.5 }}>{p.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--steel)" }}>
          <StatusDot animate />
          <span>runtime healthy · local-first</span>
        </div>
      </div>
    </aside>
  );
}

interface TopbarProps {
  page: string;
}

function Topbar({ page }: TopbarProps) {
  const meta = PAGES.find((p) => p.id === page);
  if (!meta) return null;
  return (
    <header className="h-14 flex-none flex items-center justify-between px-6" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: "var(--slate)" }}>timmy</span>
        <span style={{ color: "var(--slate)" }}>/</span>
        <span style={{ color: meta.accent }}>{meta.label.toLowerCase()}</span>
        <span className="cursor-blink ml-1 animate-pulse" style={{ color: meta.accent }}>▋</span>
      </div>
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--steel)" }}>
        <span className="flex items-center gap-1.5"><iconify-icon icon="simple-icons:cloudflare" width="14" style={{ color: "#f38020" }} />connected</span>
        <span className="flex items-center gap-1.5"><iconify-icon icon="solar:bolt-circle-linear" width="14" />27 req/s</span>
        <span className="flex items-center gap-1.5"><StatusDot animate />live telemetry</span>
      </div>
    </header>
  );
}

interface TrustInspectorProps {
  activeRunId: string;
  webhookEnabled: boolean;
  webhookCount: number;
}

function TrustInspector({ activeRunId, webhookEnabled, webhookCount }: TrustInspectorProps) {
  return (
    <aside className="w-80 flex-none h-full flex flex-col p-5" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <iconify-icon icon="solar:shield-check-bold" width="16" style={{ color: "var(--accent)" }} />
        <span className="text-xs uppercase font-bold tracking-wider" style={fontHead}>Trust Inspector</span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Verification Status */}
        <div className="p-3.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: "var(--slate)" }}>verification status</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "var(--steel)" }}>Doctrine Compliance</span>
              <span className="font-semibold text-emerald-400">100% PASS</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "var(--steel)" }}>Redaction Shielding</span>
              <span className="font-semibold text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "var(--steel)" }}>Passport Visa Check</span>
              <span className="font-semibold text-emerald-400">VERIFIED</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: "var(--steel)" }}>ZDR Security Policy</span>
              <span className="font-semibold text-emerald-400">ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Budget Safety Console */}
        <div className="p-3.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: "var(--slate)" }}>budget safety console</div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "var(--steel)" }}>Spend Ratio</span>
            <span className="font-semibold text-emerald-400">4.0% ($0.04 / $1.00)</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--canvas)" }}>
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: "4%" }} />
          </div>
          <div className="text-[10px] mt-2" style={{ color: "var(--slate)" }}>Zone: NORMAL (Premium allowed)</div>
        </div>

        {/* Live Run Credentials */}
        <div className="p-3.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: "var(--slate)" }}>live run telemetry</div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Run ID:</span>
              <span className="text-sky-400">{activeRunId}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Embassy D1:</span>
              <span style={{ color: "var(--steel)" }}>Synced</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Webhook Relay:</span>
              <span style={{ color: webhookEnabled ? "#10b981" : "var(--slate)" }}>
                {webhookEnabled ? `ACTIVE (${webhookCount})` : "INACTIVE"}
              </span>
            </div>
          </div>
        </div>

        {/* Doctrine Hash */}
        <div className="p-3.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase font-bold tracking-wider mb-1.5" style={{ color: "var(--slate)" }}>doctrine verification hash</div>
          <div className="text-[10px] font-mono break-all p-1.5 rounded bg-black/40 text-purple-300" style={{ border: "1px solid var(--border)" }}>
            sha256_e430f8219ab92cd0c07d391cb48f
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 text-[10px] text-center" style={{ borderTop: "1px solid var(--border)", color: "var(--slate)" }}>
        🔒 SECURE BOUNDARY ENFORCED
      </div>
    </aside>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`border-gradient rounded-xl p-4 ${className}`} style={{ background: "var(--surface)", boxShadow: "0 20px 40px -22px rgba(0,0,0,0.6)" }}>
      {children}
    </div>
  );
}

/* ---------- 1. BRIEF VIEW ---------- */
interface BriefProps {
  onRunStarted: () => void;
  messages: Array<{ who: string; txt: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ who: string; txt: string }>>>;
  setActivePage: (page: string) => void;
}

function Brief({ onRunStarted, messages, setMessages, setActivePage }: BriefProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || busy) return;
    const task = input.trim();
    setMessages((f) => [...f, { who: "you", txt: task }]);
    setInput("");
    setBusy(true);
    onRunStarted();

    const steps = [
      { who: "lead", txt: `Planning Swarm Task: "${task}"...` },
      { who: "research", txt: "Scanning workspace code repositories and validating architecture DOCTRINE rules..." },
      { who: "codegen", txt: "Applying non-destructive modifications inside compiler-isolated local workspace..." },
      { who: "verify", txt: "Zero compilation errors found. 47 tests passed cleanly. Syncing proof receipts." },
      { who: "lead", txt: "Run completed successfully! Sealed verifiable proof ledger exported to Proof panel." }
    ];

    steps.forEach((s, i) => {
      setTimeout(() => {
        setMessages((f) => [...f, s]);
        if (i === steps.length - 1) {
          setBusy(false);
        }
      }, 900 * (i + 1));
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--slate)" }}>User Intent / Briefing Interface</div>
      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:chat-round-line-bold" width="16" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={fontHead}>Timmy Dialog Swarm</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(16,185,129,0.1)", color: "var(--accent)" }}>lead · claude-3-5</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className="text-sm leading-relaxed flex items-start gap-2.5">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-none uppercase"
                style={{
                  background: m.who === "you" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                  color: m.who === "you" ? "var(--accent)" : "var(--slate)"
                }}
              >
                {m.who}
              </span>
              <span className="flex-1" style={{ color: m.who === "you" ? "var(--ink)" : "var(--steel)" }}>
                {m.txt}
              </span>
            </div>
          ))}
          {busy && (
            <div className="text-sm flex items-center gap-2" style={{ color: "var(--slate)" }}>
              <span>Swarm processing</span>
              <span className="cursor-blink">…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Three direct actions */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={() => setActivePage("porter")}
            className="cursor-pointer text-xs px-3 py-1.5 rounded font-mono font-semibold transition-all text-[#00f0ff] border border-[#00f0ff]/30 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10"
          >
            [Add Tool by URL]
          </button>
          <button
            onClick={() => setActivePage("workspace")}
            className="cursor-pointer text-xs px-3 py-1.5 rounded font-mono font-semibold transition-all text-[#e11d48] border border-[#e11d48]/30 hover:border-[#e11d48] hover:bg-[#e11d48]/10"
          >
            [Open Workspace]
          </button>
          <button
            onClick={() => setActivePage("proof")}
            className="cursor-pointer text-xs px-3 py-1.5 rounded font-mono font-semibold transition-all text-[#a78bfa] border border-[#a78bfa]/30 hover:border-[#a78bfa] hover:bg-[#a78bfa]/10"
          >
            [View Last Receipt]
          </button>
        </div>

        {/* Chat Input */}
        <div className="mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span style={{ color: "var(--accent)" }}>›</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Describe intent (e.g. generate order API routing with zero-data retention)..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
            style={{ color: "var(--ink)" }}
          />
          <button
            onClick={send}
            disabled={busy}
            className="cursor-pointer text-xs px-4 py-1.5 rounded transition-all hover:opacity-90 font-semibold"
            style={{
              background: busy ? "var(--surface)" : "var(--accent)",
              color: busy ? "var(--slate)" : "#06090e"
            }}
          >
            run
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------- 2. DISCOVERY VIEW ---------- */
function Discovery() {
  const [search, setSearch] = useState("");

  const filtered = DISCOVERED_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest" style={{ color: "var(--slate)" }}>mcp capability registry</div>
        <div className="flex items-center gap-2 rounded bg-black/40 px-2 py-1" style={{ border: "1px solid var(--border)" }}>
          <iconify-icon icon="solar:magnifer-linear" width="14" style={{ color: "var(--slate)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tools..."
            className="bg-transparent outline-none text-xs w-48 text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filtered.map((t, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border-gradient flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-x-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-blue-400">{t.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                  style={{
                    background: t.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    color: t.status === "active" ? "#10b981" : "#f59e0b"
                  }}
                >
                  {t.status}
                </span>
              </div>
              <div className="text-xs text-gray-400">{t.desc}</div>
              <div className="text-[11px] font-mono text-gray-500">
                <span className="text-pink-400">Schema: </span>{t.schema}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-none">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">provider</div>
              <div className="text-xs font-mono text-white flex items-center gap-1">
                <iconify-icon icon="solar:box-bold" width="12" style={{ color: "var(--accent)" }} />
                {t.provider}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-500">No matching capabilities found.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- 3. TEAMS VIEW ---------- */
function Teams() {
  return (
    <div className="grid gap-4 h-full" style={{ gridTemplateRows: "auto 1fr" }}>
      {/* Top Models row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {MODELS.map((m) => (
          <div key={m.id} className="p-3 rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">{m.name}</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: m.role === "lead" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)",
                  color: m.role === "lead" ? "#10b981" : "#3b82f6"
                }}
              >
                {m.role}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400">
              <span>Latency: <strong className="text-white">{m.lat}</strong></span>
              <span>Load: <strong className="text-white">{Math.round(m.load * 100)}%</strong></span>
            </div>
            <div className="w-full h-1 bg-black/40 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.load * 100}%`, background: m.role === "lead" ? "#10b981" : "#3b82f6" }} />
            </div>
          </div>
        ))}
      </div>

      {/* DAG Diagram Stage */}
      <div className="flex flex-col min-h-0">
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--slate)" }}>Multi-Agent swarm workflow DAG</div>
        <div className="flex-1 rounded-xl relative overflow-hidden flex flex-col justify-between p-4 bg-black/50" style={{ border: "1px solid var(--border)" }}>
          {/* Animated Dotted Flowing Lines via SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Draw edge flows */}
            <path d="M 120 100 L 250 180" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[dash_10s_linear_infinite]" />
            <path d="M 120 100 L 450 180" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M 120 100 L 650 180" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M 250 180 L 380 280" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M 450 180 L 380 280" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M 650 180 L 380 280" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>

          {/* Node Placement */}
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Row 1: Orchestrator */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-emerald-500 bg-emerald-950/20 text-center" style={{ width: 150 }}>
                <iconify-icon icon="solar:cpu-bold" width="22" style={{ color: "#10b981" }} />
                <span className="text-xs font-bold text-white leading-none">Lead Swarm</span>
                <span className="text-[10px] text-emerald-400">claude-3.5-sonnet</span>
              </div>
            </div>

            {/* Row 2: Specialists */}
            <div className="flex justify-around items-center my-6">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-blue-500 bg-blue-950/20 text-center" style={{ width: 140 }}>
                <iconify-icon icon="solar:magnifer-bold" width="20" style={{ color: "#3b82f6" }} />
                <span className="text-xs font-bold text-white leading-none">Research Agent</span>
                <span className="text-[10px] text-blue-400">hermes-3-llama</span>
              </div>

              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-purple-500 bg-purple-950/20 text-center" style={{ width: 140 }}>
                <iconify-icon icon="solar:code-bold" width="20" style={{ color: "#a78bfa" }} />
                <span className="text-xs font-bold text-white leading-none">Codegen Agent</span>
                <span className="text-[10px] text-purple-400">qwen-2.5-coder</span>
              </div>

              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-amber-500 bg-amber-950/20 text-center" style={{ width: 140 }}>
                <iconify-icon icon="solar:ranking-bold" width="20" style={{ color: "#f59e0b" }} />
                <span className="text-xs font-bold text-white leading-none">Verify Agent</span>
                <span className="text-[10px] text-amber-400">llama-3.3-mcp</span>
              </div>
            </div>

            {/* Row 3: Edge SQLite D1 Commit */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-pink-500 bg-pink-950/20 text-center" style={{ width: 150 }}>
                <iconify-icon icon="simple-icons:cloudflare" width="20" style={{ color: "#ec4899" }} />
                <span className="text-xs font-bold text-white leading-none">Commit Ledger</span>
                <span className="text-[10px] text-pink-400">D1 SQLite Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. WORKSPACE VIEW ---------- */
function Workspace() {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const activeFile = FILE_CHANGES[activeFileIdx];

  return (
    <div className="grid gap-4 h-full min-h-0" style={{ gridTemplateRows: "1.2fr 1fr" }}>
      {/* File Diff Stage */}
      <div className="grid gap-4 min-h-0" style={{ gridTemplateColumns: "1fr 2.2fr" }}>
        {/* File selector list */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">modified files</div>
          {FILE_CHANGES.map((f, idx) => (
            <button
              key={f.file}
              onClick={() => setActiveFileIdx(idx)}
              className="text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer"
              style={{
                background: activeFileIdx === idx ? "var(--surface-2)" : "var(--surface)",
                borderColor: activeFileIdx === idx ? "var(--accent)" : "var(--border)"
              }}
            >
              <div className="min-w-0">
                <div className="font-mono truncate text-white">{f.file.split("/").pop()}</div>
                <div className="text-[10px] text-gray-500 truncate">{f.file}</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] flex-none">
                <span className="text-emerald-400">+{f.linesAdded}</span>
                {f.linesRemoved > 0 && <span className="text-red-400">-{f.linesRemoved}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Code Diff Panel */}
        <Card className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 text-xs pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="font-mono text-gray-400">{activeFile.file}</span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase">{activeFile.type}</span>
          </div>
          <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-3 bg-black/60 rounded border border-white/5 scrollbar-thin">
            {activeFile.diff.map((line, idx) => {
              const isAdd = line.startsWith("+");
              const isSub = line.startsWith("-");
              const isHeader = line.startsWith("@@");
              let lineClass = "text-slate-400";
              let lineBg = "transparent";
              if (isAdd) {
                lineClass = "text-emerald-300";
                lineBg = "rgba(16,185,129,0.1)";
              } else if (isSub) {
                lineClass = "text-red-300";
                lineBg = "rgba(225,29,72,0.1)";
              } else if (isHeader) {
                lineClass = "text-sky-300 opacity-60";
              }
              return (
                <div key={idx} className={`px-2 py-0.5 rounded ${lineClass}`} style={{ background: lineBg }}>
                  {line}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tmux Shell Chamber */}
      <div className="flex flex-col min-h-0">
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--slate)" }}>interactive local bridge / tmux pane</div>
        <div className="flex-1 rounded-xl p-4 font-mono text-xs overflow-hidden scanline bg-[#040508]" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 border-b border-white/5 pb-1">
            <span>[tmux: timmy-tui-run]</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <StatusDot color="#10b981" animate />active pane
            </span>
          </div>
          <div className="text-slate-300 space-y-1 select-none">
            <div><span className="text-emerald-400">$</span> tsx cli.tsx build</div>
            <div className="text-gray-500">→ resolving Vite local asset directories...</div>
            <div className="text-gray-500">→ processing local workspace files under secure chmod 600 gates...</div>
            <div className="text-emerald-400 font-semibold">✓ build outputs compiled cleanly in 1482ms (outputs/chatgpt-openai-apps-deck/output.pptx)</div>
            <div className="text-sky-400">→ Telemetry synced successfully. Standing by for next command.<span className="cursor-blink">▋</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. PROOF VIEW (THE VERIFIABLE EVIDENCE PANEL) ---------- */
interface ProofProps {
  vmLogs: VMLogRow[];
  logScrollOffset: number;
  scrollLogsUp: () => void;
  scrollLogsDown: () => void;
}

function Proof({ vmLogs, logScrollOffset, scrollLogsUp, scrollLogsDown }: ProofProps) {
  return (
    <div className="grid gap-4 h-full min-h-0" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
      {/* Left column: Relayed multi-agent VM thread evidence */}
      <div className="flex flex-col min-h-0">
        <div className="text-xs uppercase tracking-widest mb-2.5" style={{ color: "var(--slate)" }}>
          💻 Relayed Multi-Agent VM Thread (Verified Evidence)
        </div>
        <div className="flex-1 rounded-xl p-4 font-mono text-xs overflow-hidden scanline bg-[#040508] flex flex-col justify-between relative" style={{ border: "1px solid var(--border)" }}>
          {/* Main list container */}
          <div className="space-y-1.5 flex-1 overflow-hidden pr-2">
            {vmLogs.slice(logScrollOffset, logScrollOffset + 9).map((r, i) => {
              const cmap: Record<string, string> = {
                info: "#3b82f6",
                ok: "#10b981",
                warn: "#f59e0b",
                err: "#e11d48"
              };
              return (
                <div key={i} className="flex gap-2.5 items-start hover:bg-white/[0.02] px-1.5 py-0.5 rounded transition-all">
                  <span className="text-[10px] text-gray-500 flex-none">{r.t}</span>
                  <span className="uppercase text-[9px] px-1 font-bold rounded flex-none" style={{ color: cmap[r.lvl], background: `${cmap[r.lvl]}15` }}>{r.lvl}</span>
                  <span className="text-[10px] text-gray-400 font-semibold flex-none">[{r.src}]</span>
                  <span className="text-slate-300 break-words flex-grow">{r.msg}</span>
                </div>
              );
            })}
            <div className="text-xs text-sky-400 pt-1 font-semibold flex items-center gap-1.5">
              <span>tail -f vm_session_logs.log</span>
              <span className="cursor-blink">▋</span>
            </div>
          </div>

          {/* Scrolling controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 flex-none">
            <span className="text-[10px] text-gray-500">Use control arrows to scroll audit log</span>
            <div className="flex gap-2">
              <button
                onClick={scrollLogsUp}
                className="w-7 h-7 rounded border border-white/10 hover:border-white/30 flex items-center justify-center cursor-pointer text-white bg-white/5 hover:bg-white/10"
              >
                ▲
              </button>
              <button
                onClick={scrollLogsDown}
                className="w-7 h-7 rounded border border-white/10 hover:border-white/30 flex items-center justify-center cursor-pointer text-white bg-white/5 hover:bg-white/10"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Sealed receipt, verdict, and strategy suggestions */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Verifiable Sealed Receipt */}
        <Card>
          <div className="flex items-center justify-between pb-2 mb-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs uppercase font-bold text-sky-400 font-mono">🧾 Sealed TIMMY Receipt</span>
            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded font-mono">sealed & locked</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Run ID:</span>
              <span className="text-white font-semibold">run_jti_81f292</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Passport:</span>
              <span className="text-white font-semibold">AgentPass_Coding_v2</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Visa Actions Allowed:</span>
              <span className="text-sky-300">fs.read, fs.write, cmd.exec</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--slate)" }}>Database Backend:</span>
              <span style={{ color: "var(--steel)" }}>Cloudflare D1 DDO SQLite</span>
            </div>
          </div>
        </Card>

        {/* Grader Verdict */}
        <Card>
          <div className="flex items-center justify-between pb-2 mb-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs uppercase font-bold text-emerald-400 font-mono">🤖 Built-in Grader Verdict</span>
            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded font-mono">GRADE A</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--steel)" }}>• TypeScript Safety Checks</span>
              <span className="font-semibold text-emerald-400">[PASS]</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--steel)" }}>• Empty State & Focus Lock</span>
              <span className="font-semibold text-emerald-400">[PASS]</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--steel)" }}>• Git Redaction Shield checks</span>
              <span className="font-semibold text-emerald-400">[PASS]</span>
            </div>
          </div>
        </Card>

        {/* Strategic Evolution Suggestions */}
        <div className="p-4 rounded-xl border border-dashed flex flex-col gap-2" style={{ background: "rgba(167,139,250,0.04)", borderColor: "rgba(167,139,250,0.2)" }}>
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <iconify-icon icon="solar:magic-stick-bold" width="14" />
            Strategic Evolution Tips
          </div>
          <div className="text-[11px] text-gray-400 leading-relaxed space-y-1">
            <div>• <strong>Sandbox isolation:</strong> Enroll Daytona VM sandbox mode in Options to isolate future runs.</div>
            <div>• <strong>Webhook integration:</strong> Run <code>/porter add webhook-bridge</code> or click Porter to enable live webhook push.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. PORTER VIEW ---------- */
interface PorterProps {
  onWebhookInstalled: () => void;
}

function Porter({ onWebhookInstalled }: PorterProps) {
  const [packs, setPacks] = useState([
    { id: "stratum", name: "Cloudflare Stratum Pack", desc: "Syncs run manifests, KV keys, and Durables to Cloudflare edge meshes.", status: "installed" },
    { id: "daytona", name: "Daytona VM Sandbox Pack", desc: "Configures local Docker isolations so agents run code safely.", status: "available" },
    { id: "svix", name: "Svix Webhooks Bridge", desc: "Real-time secure payload broadcasts for completed runs.", status: "available" }
  ]);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const install = (id: string) => {
    if (installingId) return;
    setInstallingId(id);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPacks((pk) =>
              pk.map((x) => (x.id === id ? { ...x, status: "installed" } : x))
            );
            setInstallingId(null);
            if (id === "svix") {
              onWebhookInstalled();
            }
          }, 300);
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--slate)" }}>porter asset and connector installer</div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {packs.map((p) => (
          <div key={p.id} className="p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                  style={{
                    background: p.status === "installed" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)",
                    color: p.status === "installed" ? "#10b981" : "var(--slate)"
                  }}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-xs text-gray-400 max-w-xl">{p.desc}</div>
            </div>

            <div className="flex-none">
              {p.status === "installed" ? (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <iconify-icon icon="solar:check-circle-bold" width="14" />
                  ActiveConnector
                </div>
              ) : installingId === p.id ? (
                <div className="w-32">
                  <div className="flex justify-between text-[10px] mb-1 font-mono text-gray-400">
                    <span>provisioning...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => install(p.id)}
                  disabled={installingId !== null}
                  className="cursor-pointer text-xs px-3.5 py-1.5 rounded transition-all hover:bg-cyan-500 hover:text-black font-semibold text-cyan-400 border border-cyan-400/40 hover:border-cyan-400"
                >
                  Provision Pack
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 7. OPTIONS VIEW ---------- */
interface OptionsProps {
  webhookEnabled: boolean;
  onToggleWebhook: () => void;
  developerMode: boolean;
  onToggleDeveloperMode: () => void;
}

function Options({ webhookEnabled, onToggleWebhook, developerMode, onToggleDeveloperMode }: OptionsProps) {
  const [themeName, setThemeName] = useState("Dark Carbon");
  const [mascot, setMascot] = useState("Robotic Timmy (Owl)");
  const [speed, setSpeed] = useState("Normal (350ms)");
  const [density, setDensity] = useState("Comfortable");

  return (
    <div className="h-full overflow-y-auto space-y-4 max-w-2xl pr-1">
      <div className="text-xs uppercase tracking-widest" style={{ color: "var(--slate)" }}>TUI theme & options configuration</div>

      {/* Options Form Card */}
      <Card className="space-y-4">
        <div className="text-xs uppercase font-bold tracking-wider text-sky-400 mb-2">general aesthetics & runtime</div>

        {/* Theme select */}
        <div className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--steel)" }}>Visual Theme Style</span>
          <select
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className="bg-black/60 text-xs text-white border border-white/10 rounded p-1.5 outline-none font-mono"
          >
            <option>Dark Carbon</option>
            <option>Glassmorphism Emerald</option>
            <option>Warm Paper Classic</option>
            <option>Cyberpunk Neon</option>
          </select>
        </div>

        {/* Mascot select */}
        <div className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--steel)" }}>Swarm Core Mascot</span>
          <select
            value={mascot}
            onChange={(e) => setMascot(e.target.value)}
            className="bg-black/60 text-xs text-white border border-white/10 rounded p-1.5 outline-none font-mono"
          >
            <option>Robotic Timmy (Owl)</option>
            <option>Plexus Neural Star</option>
            <option>Autonomous Agent Grid</option>
          </select>
        </div>

        {/* Animation select */}
        <div className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--steel)" }}>GSAP Animation Speed</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="bg-black/60 text-xs text-white border border-white/10 rounded p-1.5 outline-none font-mono"
          >
            <option>Off (Instant)</option>
            <option>Fast (150ms)</option>
            <option>Normal (350ms)</option>
            <option>Relaxed (600ms)</option>
          </select>
        </div>

        {/* Layout Density */}
        <div className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--steel)" }}>Interface Grid Density</span>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="bg-black/60 text-xs text-white border border-white/10 rounded p-1.5 outline-none font-mono"
          >
            <option>Cozy</option>
            <option>Comfortable</option>
            <option>High Density (Compact)</option>
          </select>
        </div>

        {/* Developer Mode toggle */}
        <div className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <span style={{ color: "var(--steel)" }}>Developer Mode</span>
            <div className="text-[10px] text-gray-500">Enable advanced MCP Discovery and Multi-Agent Teams view.</div>
          </div>
          <button
            onClick={onToggleDeveloperMode}
            className="cursor-pointer rounded-full transition-colors"
            style={{ width: 38, height: 21, background: developerMode ? "var(--accent)" : "var(--surface-2)", padding: 2 }}
          >
            <span className="block rounded-full transition-transform" style={{ width: 17, height: 17, background: "#fff", transform: developerMode ? "translateX(17px)" : "translateX(0)" }} />
          </button>
        </div>

        {/* Svix webhook bridge toggle */}
        <div className="flex items-center justify-between py-2.5 text-sm">
          <div>
            <span style={{ color: "var(--steel)" }}>Svix Webhooks Bridge</span>
            <div className="text-[10px] text-gray-500">Relay all verifiable proofs to webhook endpoints.</div>
          </div>
          <button
            onClick={onToggleWebhook}
            className="cursor-pointer rounded-full transition-colors"
            style={{ width: 38, height: 21, background: webhookEnabled ? "var(--accent)" : "var(--surface-2)", padding: 2 }}
          >
            <span className="block rounded-full transition-transform" style={{ width: 17, height: 17, background: "#fff", transform: webhookEnabled ? "translateX(17px)" : "translateX(0)" }} />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("brief");
  const [activeRunId, setActiveRunId] = useState("run_jti_81f292");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookCount, setWebhookCount] = useState(0);
  const [developerMode, setDeveloperMode] = useState(false);

  // Chat/Brief messages state
  const [messages, setMessages] = useState<Array<{ who: string; txt: string }>>([
    { who: "lead", txt: "Standing by. Describe a task to orchestrate across worker panes." }
  ]);

  // Scrolling logs state
  const [logScrollOffset, setLogScrollOffset] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);

  // Guard routing if Developer Mode is turned off and active screen is discovery/teams
  useEffect(() => {
    if (!developerMode && (active === "discovery" || active === "teams")) {
      setActive("brief");
    }
  }, [developerMode, active]);

  // Smooth page transitions via GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fade-up",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 }
      );
    }, mainRef);
    return () => ctx.revert();
  }, [active]);

  const onRunStarted = useCallback(() => {
    // Generate new random run ID
    const nextRun = `run_jti_${Math.random().toString(36).substring(2, 8)}`;
    setActiveRunId(nextRun);
    if (webhookEnabled) {
      setWebhookCount((c) => c + 1);
    }
  }, [webhookEnabled]);

  const onWebhookInstalled = useCallback(() => {
    setWebhookEnabled(true);
    setWebhookCount(1);
  }, []);

  const onToggleWebhook = useCallback(() => {
    setWebhookEnabled((prev) => {
      const next = !prev;
      if (next && webhookCount === 0) {
        setWebhookCount(1);
      }
      return next;
    });
  }, [webhookCount]);

  const scrollLogsUp = () => {
    setLogScrollOffset((prev) => Math.max(0, prev - 1));
  };

  const scrollLogsDown = () => {
    const maxScroll = Math.max(0, VM_LOGS.length - 9);
    setLogScrollOffset((prev) => Math.min(maxScroll, prev + 1));
  };

  const renderActiveView = () => {
    switch (active) {
      case "brief":
        return <Brief onRunStarted={onRunStarted} messages={messages} setMessages={setMessages} setActivePage={setActive} />;
      case "discovery":
        return <Discovery />;
      case "teams":
        return <Teams />;
      case "workspace":
        return <Workspace />;
      case "proof":
        return (
          <Proof
            vmLogs={VM_LOGS}
            logScrollOffset={logScrollOffset}
            scrollLogsUp={scrollLogsUp}
            scrollLogsDown={scrollLogsDown}
          />
        );
      case "porter":
        return <Porter onWebhookInstalled={onWebhookInstalled} />;
      case "options":
        return (
          <Options
            webhookEnabled={webhookEnabled}
            onToggleWebhook={onToggleWebhook}
            developerMode={developerMode}
            onToggleDeveloperMode={() => setDeveloperMode(prev => !prev)}
          />
        );
      default:
        return <Brief onRunStarted={onRunStarted} messages={messages} setMessages={setMessages} setActivePage={setActive} />;
    }
  };

  return (
    <div className="flex h-full text-white bg-black select-none font-sans">
      {/* 1. Persistent Left Navigation */}
      <Sidebar active={active} setActive={setActive} developerMode={developerMode} />

      {/* 2. Large Main Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar page={active} />
        <main ref={mainRef} className="flex-1 p-6 min-h-0 overflow-hidden">
          <div className="fade-up h-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* 3. Persistent Right Trust Inspector */}
      <TrustInspector
        activeRunId={activeRunId}
        webhookEnabled={webhookEnabled}
        webhookCount={webhookCount}
      />
    </div>
  );
}
