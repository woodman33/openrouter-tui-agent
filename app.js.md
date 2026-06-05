import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  NAV,
  PIPELINE,
  PORTER_CHIPS,
  PORTER_CARD,
  RECEIPT,
  WORKSPACES,
  OPTIONS,
} from "./data.js";

/*---------- shared atoms ----------*/

function StatePill({ label, value, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs"
      style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </span>
  );
}

function TButton({ children, icon, variant = "ghost", onClick, accent }) {
  const ref = useRef(null);
  const styles = {
    primary: { bg: "rgba(169,139,255,0.10)", bd: "rgba(169,139,255,0.35)", fg: "var(--agent)" },
    proof: { bg: "rgba(79,156,255,0.10)", bd: "rgba(79,156,255,0.32)", fg: "var(--proof)" },
    verified: { bg: "rgba(67,214,160,0.10)", bd: "rgba(67,214,160,0.32)", fg: "var(--verified)" },
    action: { bg: "rgba(245,181,69,0.10)", bd: "rgba(245,181,69,0.32)", fg: "var(--action)" },
    ghost: { bg: "var(--panel-2)", bd: "var(--border)", fg: "var(--text)" },
  };
  const s = styles[accent || variant] || styles.ghost;
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => gsap.to(ref.current, { y: -1, duration: 0.18, ease: "power2.out" })}
      onMouseLeave={() => gsap.to(ref.current, { y: 0, duration: 0.18, ease: "power2.out" })}
      onMouseDown={() => gsap.to(ref.current, { scale: 0.97, duration: 0.1 })}
      onMouseUp={() => gsap.to(ref.current, { scale: 1, duration: 0.12 })}
      className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors"
      style={{ background: s.bg, border: `1px solid ${s.bd}`, color: s.fg }}
    >
      {icon && <iconify-icon icon={icon} width="16" />}
      {children}
    </button>
  );
}

function Panel({ children, title, hint, className = "" }) {
  return (
    <section
      className={`rounded-xl ${className}`}
      style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
    >
      {(title || hint) && (
        <header
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <h2 className="text-sm tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          {hint && (
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              {hint}
            </span>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/*---------- page: brief ----------*/

function Typewriter({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = "";
    const obj = { n: 0 };
    const tw = gsap.to(obj, {
      n: text.length,
      duration: text.length * 0.022,
      ease: "none",
      delay: 0.3,
      onUpdate: () => {
        el.textContent = text.slice(0, Math.round(obj.n));
      },
    });
    return () => tw.kill();
  }, [text]);
  return (
    <span style={{ color: "var(--text-dim)" }}>
      <span ref={ref} />
      <span className="tt-caret" style={{ height: "0.9em" }} />
    </span>
  );
}

function BriefPage({ go, onSelect }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState([]);
  const stageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      stageRef.current?.children || [],
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power3.out" }
    );
  }, []);

  const send = () => {
    if (!msg.trim()) return;
    setSent((s) => [...s, msg.trim()]);
    setMsg("");
    onSelect({
      title: "Mission brief",
      kind: "Intent",
      agentPass: "VERIFIED",
      visa: "READY",
      risk: "low",
      scope: "routing only",
      receipt: "PENDING",
    });
  };

  return (
    <div ref={stageRef} className="mx-auto flex h-full max-w-3xl flex-col gap-6 py-2">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "rgba(169,139,255,0.12)", border: "1px solid rgba(169,139,255,0.3)" }}
        >
          <iconify-icon icon="solar:ufo-3-linear" width="20" style={{ color: "var(--agent)" }} />
        </div>
        <div>
          <p className="text-sm tracking-tight" style={{ color: "var(--text)" }}>
            TIMMY · Quartermaster
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            agent trust os
          </p>
        </div>
      </div>

      <div className="text-sm leading-relaxed">
        <Typewriter text="Tell TIMMY the mission. I'll route the work, guard the tools, and seal the receipt." />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {sent.length === 0 ? (
          <div
            className="rounded-lg p-4 text-sm"
            style={{ background: "var(--panel)", border: "1px dashed var(--border)", color: "var(--text-faint)" }}
          >
            Any tool can become a command. Any command can become governed work.
            Any governed work can become proof.
          </div>
        ) : (
          sent.map((m, i) => (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[80%] rounded-lg px-3.5 py-2 text-sm"
                style={{ background: "rgba(169,139,255,0.10)", border: "1px solid rgba(169,139,255,0.3)", color: "var(--text)" }}
              >
                {m}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className="rounded-xl p-2"
        style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span style={{ color: "var(--agent)" }}>›</span>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Describe the mission…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <TButton variant="primary" icon="solar:plain-2-linear" onClick={send}>
            Send
          </TButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <TButton accent="proof" icon="solar:link-round-angle-linear" onClick={() => go("porter")}>
          Add Tool by URL
        </TButton>
        <TButton accent="verified" icon="solar:command-linear" onClick={() => go("workspace")}>
          Open Workspace
        </TButton>
        <TButton accent="action" icon="solar:bill-check-linear" onClick={() => go("proof")}>
          View Last Receipt
        </TButton>
      </div>
    </div>
  );
}

/*---------- page: porter ----------*/

function Pipeline() {
  const stepRefs = useRef([]);
  const lineRefs = useRef([]);
  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    PIPELINE.forEach((_, i) => {
      tl.to(stepRefs.current[i], {
        borderColor: "rgba(79,156,255,0.5)",
        color: "var(--proof)",
        boxShadow: "0 0 18px rgba(79,156,255,0.18)",
        duration: 0.35,
        ease: "power2.out",
      });
      if (lineRefs.current[i]) {
        tl.fromTo(lineRefs.current[i], { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, "<0.1");
      }
      tl.to(stepRefs.current[i], {
        borderColor: "var(--border)",
        color: "var(--text-dim)",
        boxShadow: "none",
        duration: 0.4,
        delay: 0.25,
      });
    });
    return () => tl.kill();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-1 px-5 py-6">
      {PIPELINE.map((p, i) => (
        <React.Fragment key={p.id}>
          <div
            ref={(el) => (stepRefs.current[i] = el)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
          >
            <iconify-icon icon={p.icon} width="15" />
            {p.label}
          </div>
          {i < PIPELINE.length - 1 && (
            <div className="relative h-px w-6 sm:w-8" style={{ background: "var(--border)" }}>
              <div
                ref={(el) => (lineRefs.current[i] = el)}
                className="absolute inset-0 origin-left"
                style={{ background: "var(--proof)", transform: "scaleX(0)" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function PorterPage({ onSelect }) {
  const [card, setCard] = useState(PORTER_CARD);
  const [active, setActive] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".tt-anim",
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" }
    );
  }, []);

  const approve = () => {
    setCard((c) => ({ ...c, status: "ready", agentPass: "VERIFIED", visa: "READY" }));
    gsap.fromTo(
      cardRef.current,
      { boxShadow: "0 0 0 rgba(67,214,160,0)" },
      { boxShadow: "0 0 28px rgba(67,214,160,0.25)", duration: 0.5, yoyo: true, repeat: 1, ease: "power2.out" }
    );
    onSelect({
      title: card.cli,
      kind: "Generated CLI",
      agentPass: "VERIFIED",
      visa: "READY",
      risk: card.risk,
      scope: card.scope,
      receipt: "ARMED",
    });
  };

  const riskColor = card.risk === "medium" ? "var(--action)" : "var(--verified)";

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-y-auto py-2 pr-1">
      <div className="tt-anim">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          MCP → CLI bridge
        </p>
        <h1 className="mt-1 text-xl tracking-tight" style={{ color: "var(--text)" }}>
          Your tools can become governed commands.
        </h1>
      </div>

      <Panel className="tt-anim" title="MCPorter pipeline" hint="live">
        <Pipeline />
      </Panel>

      <div className="tt-anim flex flex-wrap gap-2">
        {PORTER_CHIPS.map((c) => (
          <button
            key={c.cmd}
            onClick={() => setActive(active === c.cmd ? null : c.cmd)}
            onMouseEnter={(e) => gsap.to(e.currentTarget, { y: -1, duration: 0.15 })}
            onMouseLeave={(e) => gsap.to(e.currentTarget, { y: 0, duration: 0.15 })}
            className="rounded-md px-2.5 py-1.5 text-xs transition-colors"
            style={{
              background: active === c.cmd ? "rgba(169,139,255,0.12)" : "var(--panel-2)",
              border: `1px solid ${active === c.cmd ? "rgba(169,139,255,0.4)" : "var(--border)"}`,
              color: active === c.cmd ? "var(--agent)" : "var(--text-dim)",
            }}
          >
            {c.cmd}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="rounded-lg px-4 py-3 text-xs"
          style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          <span style={{ color: "var(--agent)" }}>{active}</span> — {PORTER_CHIPS.find((c) => c.cmd === active)?.desc}
        </div>
      )}

      <Panel className="tt-anim" title="Detected source" hint={`${card.commands} commands`}>
        <div ref={cardRef} className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <iconify-icon icon="simple-icons:github" width="26" style={{ color: "var(--text)" }} />
              <div>
                <p className="text-sm tracking-tight" style={{ color: "var(--text)" }}>
                  {card.source}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {card.endpoint}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatePill label="risk" value={card.risk} color={riskColor} />
              <StatePill
                label="status"
                value={card.status}
                color={card.status === "ready" ? "var(--verified)" : "var(--action)"}
              />
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <span style={{ color: "var(--verified)" }}>$</span>
            <span style={{ color: "var(--text)" }}>{card.cli}</span>
            <span style={{ color: "var(--text-faint)" }}>--scope "{card.scope}"</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TButton
              accent="verified"
              icon="solar:check-circle-linear"
              onClick={approve}
            >
              {card.status === "ready" ? "Approved" : "/porter approve"}
            </TButton>
            <TButton accent="proof" icon="solar:eye-linear">
              /porter inspect
            </TButton>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/*---------- page: workspace ----------*/

function WorkspacePage({ onSelect }) {
  useEffect(() => {
    gsap.fromTo(
      ".tt-ws",
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
    );
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-y-auto py-2 pr-1">
      <div className="tt-ws">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          launcher
        </p>
        <h1 className="mt-1 text-xl tracking-tight" style={{ color: "var(--text)" }}>
          Launch real agent work in the right shell.
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {WORKSPACES.map((w) => (
          <div
            key={w.id}
            className="tt-ws rounded-xl p-5 transition-colors"
            onClick={() =>
              onSelect({
                title: w.name,
                kind: "Workspace shell",
                agentPass: "VERIFIED",
                visa: "READY",
                risk: "low",
                scope: w.role.toLowerCase(),
                receipt: "ARMED",
              })
            }
            style={{
              background: "var(--panel)",
              border: `1px solid ${w.primary ? "rgba(67,214,160,0.3)" : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}
              >
                <iconify-icon icon={w.icon} width="18" style={{ color: w.primary ? "var(--verified)" : "var(--action)" }} />
              </div>
              <StatePill label="" value={w.state} color={w.stateColor} />
            </div>
            <p className="mt-4 text-lg tracking-tight" style={{ color: "var(--text)" }}>
              {w.name}
            </p>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {w.role}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
              {w.detail}
            </p>
            <div className="mt-4">
              <TButton accent={w.primary ? "verified" : "action"} icon="solar:play-linear">
                Open in {w.name}
              </TButton>
            </div>
          </div>
        ))}
      </div>

      <Panel className="tt-ws" title="Continue & attach">
        <div className="flex flex-wrap gap-2.5 p-5">
          <TButton accent="proof" icon="solar:history-linear">
            Call Previous Work
          </TButton>
          <TButton accent="primary" icon="solar:paperclip-linear">
            Attach Receipt
          </TButton>
        </div>
      </Panel>
    </div>
  );
}

/*---------- page: proof ----------*/

function ProofPage({ onSelect }) {
  const [open, setOpen] = useState(false);
  const sealRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".tt-proof",
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power3.out" }
    );
    gsap.fromTo(
      sealRef.current,
      { scale: 0.6, opacity: 0, rotate: -12 },
      { scale: 1, opacity: 1, rotate: -8, duration: 0.6, delay: 0.4, ease: "back.out(1.7)" }
    );
    onSelect({
      title: RECEIPT.id,
      kind: "TIMMY receipt",
      agentPass: "VERIFIED",
      visa: "USED",
      risk: "low",
      scope: RECEIPT.approved.join(", "),
      receipt: "SEALED",
    });
  }, [onSelect]);

  const Row = ({ label, value, icon }) => (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
      <span className="flex items-center gap-2 text-xs" style={{ color: "var(--text-faint)" }}>
        <iconify-icon icon={icon} width="14" />
        {label}
      </span>
      <span className="text-right text-sm" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto py-2 pr-1">
      <div className="tt-proof">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          proof
        </p>
        <h1 className="mt-1 text-xl tracking-tight" style={{ color: "var(--text)" }}>
          Trust the receipt, not the model.
        </h1>
      </div>

      <Panel className="tt-proof relative overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:bill-check-linear" width="18" style={{ color: "var(--proof)" }} />
            <span className="text-sm tracking-tight" style={{ color: "var(--text)" }}>
              {RECEIPT.id}
            </span>
          </div>
          <div
            ref={sealRef}
            className="rounded-md px-2.5 py-1 text-xs tracking-wide"
            style={{
              color: "var(--verified)",
              border: "1.5px solid rgba(67,214,160,0.5)",
              background: "rgba(67,214,160,0.08)",
            }}
          >
            ● SEALED · tamper-evident
          </div>
        </div>

        <div className="px-5 py-2">
          <Row label="What ran" value={RECEIPT.task} icon="solar:play-circle-linear" />
          <Row label="Which agent" value={RECEIPT.agent} icon="solar:ufo-3-linear" />
          <Row label="Tools used" value={RECEIPT.tools.join(", ")} icon="solar:code-linear" />
          <Row label="What was approved" value={RECEIPT.approved.join(", ")} icon="solar:key-minimalistic-linear" />
          <Row label="What changed" value={RECEIPT.changed} icon="solar:diff-linear" />
          <Row label="Duration" value={RECEIPT.duration} icon="solar:clock-circle-linear" />
          <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="flex items-center gap-2 text-xs" style={{ color: "var(--text-faint)" }}>
              <iconify-icon icon="solar:hashtag-linear" width="14" />
              Manifest hash
            </span>
            <span
              className="break-all text-right text-xs"
              style={{ color: "var(--proof)" }}
            >
              {RECEIPT.manifest}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-5 pt-1">
          <StatePill label="" value="hash-bound" color="var(--proof)" />
          <StatePill label="" value="verifiable" color="var(--verified)" />
        </div>
      </Panel>

      <div className="tt-proof">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          <span className="flex items-center gap-2">
            <iconify-icon icon="solar:document-text-linear" width="16" />
            Raw logs & diff
          </span>
          <iconify-icon
            icon="solar:alt-arrow-down-linear"
            width="16"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
          />
        </button>
        {open && (
          <pre
            className="mt-2 overflow-x-auto rounded-lg p-4 text-xs"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-faint)" }}
          >
{`+ label("bug", #4012)

+ label("p1", #4012)
~ milestone("v2.1", reassigned)

- stale("needs-triage", #3990)
… 33 more operations · manifest verified`}
          </pre>
        )}
      </div>
    </div>
  );

}

/*---------- page: options ----------*/

function OptionsPage() {
  useEffect(() => {
    gsap.fromTo(
      ".tt-opt",
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-5 overflow-y-auto py-2 pr-1">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          options
        </p>
        <h1 className="mt-1 text-xl tracking-tight" style={{ color: "var(--text)" }}>
          Customize without clutter.
        </h1>
      </div>

      <div className="rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
        {OPTIONS.map((o, i) => (
          <div
            key={o.label}
            className="tt-opt flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < OPTIONS.length - 1 ? "1px solid var(--border-soft)" : "none" }}
          >
            <span className="w-28 shrink-0 text-sm" style={{ color: "var(--text)" }}>
              {o.label}
            </span>
            <span className="w-28 shrink-0 text-sm" style={{ color: "var(--agent)" }}>
              {o.value}
            </span>
            <span className="flex-1 truncate text-xs" style={{ color: "var(--text-faint)" }}>
              {o.desc}
            </span>
            <button
              onMouseEnter={(e) => gsap.to(e.currentTarget, { y: -1, duration: 0.15 })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { y: 0, duration: 0.15 })}
              className="shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors"
              style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
            >
              {o.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/*---------- trust inspector ----------*/

function Inspector({ item }) {
  const data = item || {
    title: "Nothing selected",
    kind: "—",
    agentPass: "VERIFIED",
    visa: "READY",
    risk: "—",
    scope: "—",
    receipt: "READY",
  };
  const colorFor = (v) =>
    ({
      VERIFIED: "var(--verified)",
      READY: "var(--proof)",
      USED: "var(--proof)",
      SEALED: "var(--verified)",
      ARMED: "var(--action)",
      PENDING: "var(--action)",
      HOLD: "var(--action)",
    }[v] || "var(--text-dim)");

  const riskColor =
    data.risk === "medium" ? "var(--action)" : data.risk === "high" ? "#ff6b6b" : "var(--verified)";

  const Field = ({ label, value, color }) => (
    <div className="py-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm" style={{ color: color || "var(--text)" }}>
        {value}
      </p>
    </div>
  );

  return (
    <aside
      className="hidden w-72 shrink-0 flex-col lg:flex"
      style={{ background: "var(--panel)", borderLeft: "1px solid var(--border)" }}
    >
      <header className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          <iconify-icon icon="solar:shield-keyhole-linear" width="14" style={{ color: "var(--proof)" }} />
          Trust Inspector
        </p>
        <p className="mt-1.5 text-sm tracking-tight" style={{ color: "var(--text)" }}>
          {data.title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          {data.kind}
        </p>
      </header>
      <div className="px-5">
        <Field label="AgentPass state" value={data.agentPass} color={colorFor(data.agentPass)} />
        <Field label="Visa state" value={data.visa} color={colorFor(data.visa)} />
        <Field label="Risk class" value={data.risk} color={riskColor} />
        <Field label="Scope" value={data.scope} />
        <Field label="Receipt state" value={data.receipt} color={colorFor(data.receipt)} />
      </div>
    </aside>
  );
}

/*---------- trust rail ----------*/

function TrustRail() {
  const items = [
    { label: "AgentPass", value: "VERIFIED", color: "var(--verified)" },
    { label: "Visa", value: "READY", color: "var(--proof)" },
    { label: "Stamp", value: "ARMED", color: "var(--action)" },
    { label: "Receipt", value: "READY", color: "var(--proof)" },
  ];
  return (
    <footer
      className="flex items-center gap-1 overflow-x-auto px-5 py-2.5 text-xs"
      style={{ background: "var(--panel)", borderTop: "1px solid var(--border)" }}
    >
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span style={{ color: "var(--text-faint)" }}>{it.label}</span>
            <span style={{ color: it.color }}>{it.value}</span>
          </span>
          <span style={{ color: "var(--border)" }} className="px-2">
            |
          </span>
        </React.Fragment>
      ))}
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span style={{ color: "var(--text-faint)" }}>Cost</span>
        <span style={{ color: "var(--text-dim)" }}>$0.0000</span>
      </span>
    </footer>
  );
}

/*---------- nav ----------*/

function Nav({ page, setPage }) {
  const glowRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const el = itemRefs.current[page];
    const glow = glowRef.current;
    if (el && glow) {
      gsap.to(glow, {
        y: el.offsetTop,
        height: el.offsetHeight,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [page]);

  return (
    <nav
      className="flex w-16 shrink-0 flex-col items-stretch py-4 md:w-52"
      style={{ background: "var(--panel)", borderRight: "1px solid var(--border)" }}
    >
      <div className="mb-6 flex items-center gap-2.5 px-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "rgba(169,139,255,0.12)", border: "1px solid rgba(169,139,255,0.3)" }}
        >
          <iconify-icon icon="solar:ufo-3-bold" width="18" style={{ color: "var(--agent)" }} />
        </div>
        <span className="hidden text-sm tracking-tight md:block" style={{ color: "var(--text)" }}>
          TIMMY<span style={{ color: "var(--agent)" }}>TUI</span>
        </span>
      </div>

      <div className="relative px-2">
        <div
          ref={glowRef}
          className="absolute left-2 right-2 rounded-lg"
          style={{
            background: "rgba(169,139,255,0.10)",
            border: "1px solid rgba(169,139,255,0.3)",
            top: 0,
            height: 0,
          }}
        />
        {NAV.map((n) => (
          <button
            key={n.id}
            ref={(el) => (itemRefs.current[n.id] = el)}
            onClick={() => setPage(n.id)}
            className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            style={{ color: page === n.id ? "var(--agent)" : "var(--text-dim)" }}
          >
            <iconify-icon icon={n.icon} width="18" />
            <span className="hidden md:block">{n.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto hidden px-4 md:block">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
          Capability → Control → Proof → Reuse
        </p>
      </div>
    </nav>
  );
}

/*---------- app shell ----------*/

export default function App() {
  const [page, setPage] = useState("brief");
  const [selected, setSelected] = useState(null);
  const stageRef = useRef(null);

  const onSelect = useCallback((item) => setSelected(item), []);

  const go = useCallback((id) => setPage(id), []);

  useEffect(() => {
    if (!stageRef.current) return;
    gsap.fromTo(
      stageRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }, [page]);

  const pages = {
    brief: <BriefPage go={go} onSelect={onSelect} />,
    porter: <PorterPage onSelect={onSelect} />,
    workspace: <WorkspacePage onSelect={onSelect} />,
    proof: <ProofPage onSelect={onSelect} />,
    options: <OptionsPage />,
  };

  return (
    <div className="tt-grain flex h-full flex-col" style={{ position: "relative", zIndex: 0 }}>
      <div className="flex min-h-0 flex-1">
        <Nav page={page} setPage={setPage} />
        <main ref={stageRef} className="min-w-0 flex-1 overflow-hidden px-6 py-6 md:px-10">
          {pages[page]}
        </main>
        <Inspector item={selected} />
      </div>
      <TrustRail />
    </div>
  );
}
