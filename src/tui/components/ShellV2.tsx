import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { spawn, spawnSync } from 'child_process';
import { readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import qr from 'qrcode-terminal';
import { shellOnKey, initialShell, type ShellState } from '../shell-mode.js';
import { ShellFooter, WhichKeyOverlay } from './ShellChrome.js';
import { theme } from '../theme.js';
import { readChain, verifyChain, appendReceipt, hashOf, type Receipt } from '../../utils/receipts.js';
import { subscribe } from '../../bus/index.js';
import { listLanes } from '../../utils/dispatch.js';
import { listModelsSync, readNotes, notesPath, type ModelEntry } from '../../models/registry.js';
import { readPolicy, setModel, ADAPTERS } from '../../harness/policy.js';
import { dropRoot, SHIPPED_RULES } from '../../drop/index.js';
import { listEscrows, lockEscrow, cancelEscrow, type Escrow } from '../../utils/escrow-engine.js';
import { journeyRows, journeyDoneCount } from '../journey.js';
import { Card } from '../ui/Card.js';
import { useAgent } from '../hooks/useAgent.js';
import type { Agent } from '../../agent/core.js';

// TUI REDESIGN (spec §01/§02/§03) — IA collapse: nine tabs become four.
// HOME · RUN · CHAIN · LIBRARY. HOME is the journey ladder: seven steps read
// from the chain, next unsealed = the only orange, STATUS from bus/chain
// (off = dim, never red), rails = LATEST PROOF + ACTIVITY (refusals red only),
// header cluster from the bus (chain head, bus liveness, drops, active model).
const COMPANION_PORT = (): number => Number(process.env.TIMMY_LOGS_PORT ?? 4310);

interface BusRow { line: string; refused: boolean; sealed: boolean }

const stamp = (ts: string): string => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const ago = (ts: string): string => {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};
// FIX 3 (director): a hash prefix is 8 hex chars everywhere; genesis keeps its name.
const prevLabel8 = (p: string): string => (p.startsWith('genesis') ? 'genesis' : p.slice(7, 15));

// SPEC §08: in CHAT the screen underneath stays visible but dimmed. ink 7 has
// no container-level dim, so pane CONTENT swaps to a muted palette for the
// duration of the CHAT render (Card borders keep their structure colors).
const DIM: typeof theme = {
  ...theme,
  seal: theme.textMuted, warn: theme.textMuted, danger: theme.textMuted,
  textPrimary: theme.textMuted, textSecondary: theme.textMuted,
};
let PAL: typeof theme = theme;

// SPEC §01/§02 — the sovereign chat drawer. Without a live agent (direct
// ShellV2 renders in tests) a noop agent keeps the hook contract intact.
const NOOP_AGENT = {
  on: () => undefined, off: () => undefined, send: async () => null,
  getModel: () => null, clearHistory: () => undefined, setModel: () => undefined,
  conversation: { getHistory: () => [] }, totalCost: 0,
} as unknown as Agent;

export function ShellV2({ width = 120, agent }: { width?: number; agent?: Agent }) {
  const chat = useAgent(agent ?? NOOP_AGENT);
  const [s, setS] = useState<ShellState>(initialShell);
  const sRef = React.useRef<ShellState>(s);
  const [chain, setChain] = useState<{ ok: boolean; count: number }>({ ok: false, count: 0 });
  const [recs, setRecs] = useState<Receipt[]>([]);
  const [head, setHead] = useState('');
  const [busLive, setBusLive] = useState(false);
  const [activity, setActivity] = useState<BusRow[]>([]);
  const [docker, setDocker] = useState<boolean | null>(null);
  const [flash, setFlash] = useState('');
  const [qrText, setQrText] = useState('');
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  // SPEC §04 W4: the LIVE pane ticks from bus events, never from a poll.
  const [laneLive, setLaneLive] = useState<Record<string, { ticks: number; last: string; lifecycle: string; at: string }>>({});
  // SPEC §05: the VERIFY strip glows ONLY after a real verify — either one run
  // this session ([v]) or one already on the chain covering the current head.
  const [verified, setVerified] = useState<null | { ok: boolean; count: number; epochs: number; head: string; at: string; via: string }>(null);

  // status glyphs + ladder facts from the chain verify + bus subscribe (never a poll)
  useEffect(() => {
    const refresh = () => {
      try {
        const v = verifyChain('runs');
        const all = readChain('runs');
        setChain({ ok: v.ok, count: v.count });
        setRecs(all);
        setHead(String(all[all.length - 1]?.hash ?? ''));
        setEscrows(listEscrows());
        // a verify receipt whose head matches the current head is a real verify
        const lv = [...all].reverse().find(r => r.kind === 'verify');
        if (lv && String(lv.subject).includes(String(all[all.length - 1]?.hash ?? '').slice(7, 15))) {
          setVerified({ ok: lv.status !== 'failed', count: v.count, epochs: v.segments.length, head: String(all[all.length - 1]?.hash ?? '').slice(7, 15), at: String(lv.ts), via: String(lv.id) });
        }
      } catch { /* none yet */ }
    };
    refresh();
    const h = subscribe(ev => {
      setBusLive(true);
      const e = ev as unknown as { kind?: string; subject?: string; hash?: string; status?: string; ts?: string; payload?: Record<string, unknown> };
      if (String(e.kind ?? '').startsWith('dispatch.')) {
        const p = (e.payload ?? {}) as Record<string, unknown>;
        const ids = String(p.harness ?? '').split(',').map(x => x.trim()).filter(Boolean);
        const life = String(p.status ?? '');
        if (ids.length) {
          setLaneLive(prev => {
            const next = { ...prev };
            for (const ln of ids) {
              const cur = next[ln] ?? { ticks: 0, last: '', lifecycle: '', at: '' };
              next[ln] = { ticks: cur.ticks + 1, last: String(e.kind), lifecycle: life, at: String(e.ts ?? new Date().toISOString()) };
            }
            return next;
          });
        }
      }
      if (e.hash) {
        // a receipt line: sealed row; denied = REFUSED, failed = FAILED (both
        // red per the approved statusColor map; the words stay distinct)
        const refused = e.status === 'denied' || e.status === 'failed';
        const word = e.status === 'denied' ? 'REFUSED' : e.status === 'failed' ? 'FAILED ' : 'sealed ';
        setActivity(a => [{ line: `${String(e.subject ?? e.kind ?? '').slice(0, 22).padEnd(22)} ${word} ${String(e.hash).slice(7, 15)}`, refused, sealed: !refused }, ...a].slice(0, 12));
      } else if (e.kind && e.kind !== 'receipt.sealed') {
        setActivity(a => [{ line: `${e.kind} ${JSON.stringify(e.payload ?? {}).slice(0, 40)}`, refused: false, sealed: false }, ...a].slice(0, 12));
      }
      if (e.kind === 'receipt.sealed' || e.hash) refresh();
    }, { tail: 12 });
    return () => h.stop();
  }, []);

  // docker is a capability, not a danger: off renders dim ○, never red
  useEffect(() => {
    const r = spawnSync('docker', ['info', '--format', 'ok'], { timeout: 2500, stdio: 'ignore' });
    setDocker(r.status === 0);
  }, []);

  // FIX 3 (director): first run seeds a default model policy (pinned model,
  // else openrouter/auto) and seals model.policy — "policy unset" becomes
  // unreachable after the first run.
  useEffect(() => {
    if (readPolicy(pdir).default) return;
    const seeded = models.find(m => m.pinned)?.id ?? 'openrouter/auto';
    setModel(seeded, null, pdir);
    appendReceipt('runs', { kind: 'seal', subject: `model.policy · default ${seeded}`, policy: 'auto', status: 'ok' });
    setModelsTick(t => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInput((input, key) => {
    const k = key.return ? 'Enter' : key.escape ? 'Esc' : key.tab ? 'Tab' : input;
    // CHAT Enter ships the buffer: capture before the reducer clears it
    const chatText = sRef.current.mode === 'CHAT' ? sRef.current.input : '';
    // a ref advanced synchronously: pasted/programmatic chunks can arrive in
    // one tick, and the reducer must see the state after the previous chunk,
    // not the last rendered one (otherwise paste drops keys).
    const step = shellOnKey(sRef.current, k);
    sRef.current = step.state;
    setS(step.state);
    for (const a of step.actions) {
      if (a === 'verify-now') {
        const v = verifyChain('runs');
        setChain({ ok: v.ok, count: v.count });
        const h8 = head.slice(7, 15) || '—';
        // a real verify seals, so the glow is evidence, not a repaint
        const rec = appendReceipt('runs', { kind: 'verify', subject: `chain.verify · ${v.ok ? 'ok' : 'BROKEN'} · head ${h8}`, policy: 'human-gated', status: v.ok ? 'ok' : 'failed' });
        setVerified({ ok: v.ok, count: v.count, epochs: v.segments.length, head: h8, at: rec.ts, via: String(rec.id) });
        setFlash(v.ok ? `chain ok · ${v.count} receipts · head ${h8}` : `chain BROKEN at ${String(v.brokenAt ?? '?')}`);
      }
      if (a === 'open-crosslink' && selectedRec) {
        const url = `http://localhost:${COMPANION_PORT()}/?receipt=${selectedRec.hash}`;
        const c = spawn('open', [url], { stdio: 'ignore', detached: true });
        c.unref();
        setFlash(`cross-linked ${selectedRec.hash.slice(7, 15)} → ${url}`);
      }
      if (a === 'copy-hash' && selectedRec) {
        spawnSync('pbcopy', { input: selectedRec.hash, timeout: 2000 });
        setFlash(`copied ${selectedRec.hash.slice(0, 16)}`);
      }
      // SPEC §04: escrow verbs — approve locks, refuse cancels WITH a reason;
      // both refresh the pending set so the pane disappears when resolved.
      if (a === 'escrow-approve' && pendingEscrows[0]) {
        const r = lockEscrow(pendingEscrows[0].escrow_id);
        setEscrows(listEscrows());
        setFlash(r.ok ? `escrow ${pendingEscrows[0].escrow_id.slice(0, 12)} locked` : `approve failed: ${r.note ?? '?'}`);
      }
      if (a.startsWith('escrow-refuse::') && pendingEscrows[0]) {
        const reason = a.slice('escrow-refuse::'.length);
        const r = cancelEscrow(pendingEscrows[0].escrow_id, reason);
        setEscrows(listEscrows());
        setFlash(r.ok ? `escrow refused · ${reason}` : `refuse failed: ${r.note ?? '?'}`);
      }
      if (a === 'refuse-needs-reason') setFlash('refusal needs a reason — [r] again');
      // SPEC §04: Enter on a sealed run jumps to its receipts in CHAIN
      if (a === 'open' && sRef.current.tab === 'RUN') {
        const row = runRows.rows[Math.min(sRef.current.selected, Math.max(0, runRows.rows.length - 1))];
        if (row && row.state === 'sealed') {
          const nxt = { ...sRef.current, tab: 'CHAIN' as const, filter: row.group[0] ? String(row.group[0].hash).slice(7, 15) : row.lane };
          sRef.current = nxt;
          setS(nxt);
        }
      }
      // FIX 1: [n] new run picks from the fleet and dispatches a real run
      if (a === 'new-run-now') {
        const lane = lanes[Math.min(sRef.current.pick, lanes.length - 1)]?.id;
        if (lane) {
          const c = spawn('npx', ['tsx', 'src/cli.ts', 'do', `${lane} smoke run`, '--yes'], { stdio: 'ignore', detached: true });
          c.unref();
          setFlash(`dispatching ${lane} smoke run (--yes)`);
        }
      }
      // SPEC §06 picker writes: policy default, per-harness scope, pin, note
      if (a === 'open' && sRef.current.tab === 'LIBRARY' && selModel) {
        setModel(selModel.id, null, pdir);
        setModelsTick(t => t + 1);
        setFlash(`policy model → ${selModel.id}`);
      }
      if (a === 'harness-set-now' && selModel) {
        const h = ADAPTERS[Math.min(sRef.current.pick, ADAPTERS.length - 1)]?.name;
        if (h) { setModel(selModel.id, `harness:${h}`, pdir); setModelsTick(t => t + 1); setFlash(`${h} → ${selModel.id} (harness.policy)`); }
      }
      if (a === 'pin-now' && selModel) {
        const notes = readNotes();
        const cur = Boolean(notes[selModel.id]?.pinned);
        writeFileSync(notesPath(), JSON.stringify({ ...notes, [selModel.id]: { ...notes[selModel.id], pinned: !cur } }, null, 2));
        setModelsTick(t => t + 1);
        setFlash(`${selModel.id} ${cur ? 'unpinned' : 'pinned'}`);
      }
      if (a.startsWith('note-save::') && selModel) {
        const text = a.slice('note-save::'.length);
        const notes = readNotes();
        writeFileSync(notesPath(), JSON.stringify({ ...notes, [selModel.id]: { ...notes[selModel.id], notes: text } }, null, 2));
        setModelsTick(t => t + 1);
        setFlash(`note saved for ${selModel.id}`);
      }
      // SPEC §08: each chat exchange seals as chat.turn citing model + cost.
      // The agent's own legacy writes reach the bus through the eventbus shim.
      if (a === 'chat-send' && chatText.trim()) {
        const model = chat.model || policy.default || '—';
        const costBefore = Number((agent as unknown as { totalCost?: number })?.totalCost ?? 0);
        setFlash(`sovereign chat → ${model}`);
        void (async () => {
          await chat.send(chatText.trim());
          const costAfter = Number((agent as unknown as { totalCost?: number })?.totalCost ?? 0);
          appendReceipt('runs', {
            kind: 'chat', subject: `chat.turn · ${model}`, policy: 'human-gated', status: 'ok',
            cost_usd: Math.max(0, Math.round((costAfter - costBefore) * 1e6) / 1e6), model_resolved: model,
          });
        })();
      }
      if (a === 'doctor-now') {
        const c = spawn('npx', ['tsx', 'scripts/timmy-doctor.ts'], { stdio: 'ignore', detached: true });
        c.unref();
        setFlash('doctor running — seals doctor.pass on completion');
      }
      if (a === 'seal-now') {
        appendReceipt('runs', { kind: 'seal', subject: 'owner.seal · via HOME [s]', policy: 'human-gated', status: 'ok' });
        setFlash('sealed an owner note onto the chain');
      }
      if (a === 'open-qr') {
        qr.generate(`http://localhost:${COMPANION_PORT()}`, { small: true }, t => setQrText(t));
      }
    }
  });

  const narrow = width < 100; // degrade 120x32 -> 80x24 by dropping the right rail
  // 80x24 also starves VERTICALLY (wrapped chrome eats rows): compact mode
  // drops the card purpose lines so the ladder never clips.
  const compact = (process.stdout.rows ?? 32) <= 26;
  const lanes = useMemo(() => listLanes(), []);
  const [modelsTick, setModelsTick] = useState(0);
  const models = useMemo(() => listModelsSync(), [modelsTick]);
  // policy lives beside the store so per-test TIMMY_STORE isolates it too
  const pdir = useMemo(() => (process.env.TIMMY_STORE ? dirname(process.env.TIMMY_STORE) : undefined), []);
  const policy = useMemo(() => readPolicy(pdir), [modelsTick, pdir]);
  const drops = useMemo(() => {
    try { return [...new Set([...readdirSync(dropRoot()).filter(f => !f.startsWith('.')), ...Object.keys(SHIPPED_RULES)])].length; }
    catch { return Object.keys(SHIPPED_RULES).length; }
  }, []);
  const model = readPolicy().default ?? models.find(m => m.pinned)?.id ?? '—';
  const harness = lanes.find(l => l.available)?.id ?? '—';
  const fleet = lanes.filter(l => l.available).length;
  const last = recs[recs.length - 1] ?? null;
  const pendingEscrows = escrows.filter(e => e.state === 'armed');
  const allClear = journeyDoneCount(recs) === 7 && pendingEscrows.length === 0 && chain.ok && busLive;
  // SPEC §04 + director FIX 1: LANES shows RUNS, not connectors. A run is a
  // dispatch sequence per lane (bus) or a receipt group (chain). Active runs
  // first, then the last 12 sealed/refused; idle connectors collapse to one
  // line. FIX 2: durations are real (receipt ms or ts delta). FIX 4: a hash
  // appears only on sealed/refused rows.
  const runRows = useMemo(() => {
    interface R { id: string; lane: string; state: 'running' | 'queued' | 'sealed' | 'REFUSED'; dur: string; hash: string; group: Receipt[]; ticks: number; endedAt: string }
    const fmtMs = (ms: number): string => ms < 1000 ? `${ms}ms` : ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s`;
    // past runs: group run receipts by their second subject token (clip/lot/plan)
    const groups = new Map<string, Receipt[]>();
    for (const r of recs) {
      if (r.kind !== 'run' && r.kind !== 'verify') continue;
      if (r.status !== 'ok' && r.status !== 'failed' && r.status !== 'denied') continue;
      const parts = String(r.subject).split(' · ');
      const key = parts[1] ?? parts[0];
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    const laneOf = (g: Receipt[]): string => {
      const subj = String(g[0].subject);
      return lanes.map(l => l.id).find(id => subj.includes(id)) ?? subj.split(' · ')[0].split(' ')[0];
    };
    const past: R[] = [...groups.entries()].map(([key, g]) => {
      const ts = g.map(r => new Date(r.ts).getTime());
      const delta = Math.max(0, Math.max(...ts) - Math.min(...ts));
      const ms = g.find(r => r.ms != null)?.ms;
      const refusedRec = g.find(r => r.status === 'denied' || r.status === 'failed');
      return {
        id: key, lane: laneOf(g),
        state: refusedRec ? 'REFUSED' as const : 'sealed' as const,
        dur: ms != null ? fmtMs(ms) : fmtMs(delta),
        hash: String((refusedRec ?? g[g.length - 1]).hash).slice(7, 15),
        group: g, ticks: 0, endedAt: new Date(Math.max(...ts)).toISOString(),
      };
    }).sort((a, b) => b.endedAt.localeCompare(a.endedAt));
    const active: R[] = Object.entries(laneLive)
      .filter(([, lv]) => lv.lifecycle !== 'done')
      .map(([lane, lv]) => {
        const running = lv.lifecycle === 'running' || lv.last === 'dispatch.container_started';
        const started = new Date(lv.at).getTime();
        return {
          id: `${lane}·live`, lane,
          state: running ? 'running' as const : 'queued' as const,
          dur: running ? fmtMs(Math.max(0, Date.now() - started)) : '--:--',
          hash: '', group: [], ticks: lv.ticks, endedAt: lv.at,
        };
      });
    return { rows: [...active, ...past.slice(0, 12)], idle: lanes.filter(l => !past.some(p => p.lane === l.id) && !laneLive[l.id]).length };
  }, [recs, lanes, laneLive]);
  const dropFeed = useMemo(() => {
    const out: { lane: string; file: string }[] = [];
    for (const id of Object.keys(SHIPPED_RULES)) {
      try {
        for (const f of readdirSync(join(dropRoot(), id))) out.push({ lane: id, file: f });
      } catch { /* lane dir absent = quiet */ }
    }
    return out;
  }, [recs]);
  const escrowRequester = pendingEscrows[0]
    ? (recs.find(r => r.plan_hash === pendingEscrows[0].plan_hash && !String(r.subject).startsWith('escrow'))?.id
      ?? recs.find(r => String(r.subject).includes(pendingEscrows[0].escrow_id))?.id ?? '—')
    : '—';
  // the receipt the CHAIN detail pane + [o]/[y] act on
  const filtered = useMemo(() => {
    const q = s.filter.trim().toLowerCase();
    if (!q) return recs;
    return recs.filter(r => {
      if (String(r.kind).toLowerCase().includes(q)) return true;
      if (String(r.subject).toLowerCase().includes(q)) return true;
      if (String(r.id).toLowerCase().includes(q)) return true;
      if (String(r.hash).toLowerCase().includes(q) || String(r.hash).slice(7).startsWith(q)) return true;
      return JSON.stringify(r).toLowerCase().includes(q); // any field value
    });
  }, [recs, s.filter]);
  const selectedRec = filtered[Math.min(s.selected, Math.max(0, filtered.length - 1))] ?? null;
  // SPEC §06 — MODELS picker: role-grouped, / fuzzy over id/role/notes,
  // pinned float to top (registry order), selection drives Enter/h/p/n.
  const modelsView = useMemo(() => {
    const q = s.filter.trim().toLowerCase();
    const ms = models.filter(m => !q
      || m.id.toLowerCase().includes(q)
      || String(m.role ?? '').toLowerCase().includes(q)
      || String(m.notes ?? '').toLowerCase().includes(q));
    const flat: { role?: string; m?: ModelEntry }[] = [];
    // pinned float to top: roles holding a pinned model sort first (§06)
    const roles = [...new Set(ms.map(m => m.role ?? 'general'))].sort((a, b) => {
      const pa = ms.some(m => (m.role ?? 'general') === a && m.pinned) ? 0 : 1;
      const pb = ms.some(m => (m.role ?? 'general') === b && m.pinned) ? 0 : 1;
      return pa - pb || a.localeCompare(b);
    });
    for (const r of roles) {
      flat.push({ role: r });
      for (const m of ms.filter(x => (x.role ?? 'general') === r)) flat.push({ m });
    }
    return flat;
  }, [models, s.filter]);
  const selectableModels = modelsView.filter(x => x.m).map(x => x.m as ModelEntry);
  const selModel = selectableModels[Math.min(s.selected, Math.max(0, selectableModels.length - 1))] ?? null;
  const boards = useMemo(() => {
    const ls = (p: string) => { try { return readdirSync(p).filter(f => !f.startsWith('.')); } catch { return [] as string[]; } };
    return {
      templates: ls(join(process.cwd(), 'src', 'jbone', 'templates')).map(f => f.replace(/\.cue$/, '')),
      blueprints: ls(join(process.cwd(), 'blueprints')).map(f => f.replace(/\.yaml$/, '')),
      missions: ls(join(process.cwd(), '.timmy', 'missions')),
    };
  }, []);
  const projects = useMemo(() => {
    try {
      const parent = dirname(process.cwd());
      return readdirSync(parent)
        .filter(d => { try { return existsSync(join(parent, d, '.timmy')); } catch { return false; } });
    } catch { return [] as string[]; }
  }, []);
  const costToday = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    return recs.filter(r => String(r.ts).slice(0, 10) === day).reduce((n, r) => n + (r.cost_usd ?? 0), 0);
  }, [recs]);

  PAL = s.mode === 'CHAT' ? DIM : theme;
  return (
    // the root declares its width so frames lay out at the reference grid
    // even when the host stdout reports a different column count; keyed by tab
    // so a tab swap rewrites the WHOLE frame (ink's line-diff otherwise eats
    // the header + first card title on TTYs — PTY evidence, step 6)
    <Box flexDirection="column" width={width} key={`root:${s.tab}`}>
      <Box>
        <Text bold color={theme.textPrimary}>TIMMY</Text>
        <Text color={theme.textMuted}>  </Text>
        {(['HOME', 'RUN', 'CHAIN', 'LIBRARY'] as const).map((t, i) => (
          <Text key={t} color={s.tab === t ? theme.seal : theme.textMuted}>{s.tab === t ? ` ${i + 1} ${t} ` : ` ${i + 1} ${t}`}</Text>
        ))}
        <Text color={theme.seal}>   chain {chain.ok ? '✓' : '—'} {chain.count}{head ? ` · ${head.slice(7, 15)}` : ''}</Text>
        <Text color={theme.textMuted}>  bus {busLive ? '●' : '○'}  drops {drops}</Text>
        {/* FIX C (director): 7/7 + no pending escrow + chain ✓ + bus ● ⇒ the
            orange slot stays empty and says so, in dim mono (takes the model
            segment's place; STATUS still names the policy model). */}
        {allClear
          ? <Text color={theme.textMuted}>  nothing needs you</Text>
          : <Text color={theme.textMuted}>  model {model}</Text>}
      </Box>
      <Text color={theme.line}>{'─'.repeat(width)}</Text>
      {/* SPEC §08: in CHAT the screen underneath stays visible, dimmed (PAL) */}
      <Box flexGrow={1}>
        {/* keyed by tab: panes are stateless, and a fresh mount makes ink
            repaint the whole column — its line-diff drops the first line of a
            swapped column otherwise (PTY evidence, step 6 captures) */}
        <Box flexDirection="column" width={narrow ? width : 74} key={`L:${s.tab}`}>
          {s.tab === 'HOME' && (
            <HomePane
              recs={recs} chain={chain} busLive={busLive} docker={docker}
              fleet={fleet} costToday={costToday} model={model} harness={harness} flash={flash}
              pendingEscrows={pendingEscrows} compact={compact}
            />
          )}
          {s.tab === 'RUN' && (
            <RunsPane
              rows={runRows.rows} idle={runRows.idle} selected={Math.min(s.selected, Math.max(0, runRows.rows.length - 1))}
              feed={dropFeed} watched={Object.keys(SHIPPED_RULES)} compact={compact}
              liveCollapsed={!runRows.rows.some(r => r.state === 'running')}
            />
          )}
          {narrow && s.tab === 'RUN' && (
            <>
              <Box height={1} />
              <LivePane row={runRows.rows[Math.min(s.selected, Math.max(0, runRows.rows.length - 1))]} recs={recs} compact={compact} />
              {pendingEscrows[0] && <><Box height={1} /><EscrowPane escrow={pendingEscrows[0]} requester={escrowRequester} /></>}
            </>
          )}
          {s.tab === 'CHAIN' && <ChainPane recs={recs} filtered={filtered} selected={Math.min(s.selected, Math.max(0, filtered.length - 1))} chain={chain} verified={verified} filter={s.filter} />}
          {s.tab === 'LIBRARY' && (
            <>
              <ModelsPane view={modelsView} selected={Math.min(s.selected, Math.max(0, selectableModels.length - 1))} sel={selModel} filter={s.filter} compact={compact} />
              {/* FIX 2: BOARDS + PROJECTS live under MODELS on the left */}
              <Box height={1} />
              <BoardsPane boards={boards} projects={projects} />
            </>
          )}
        </Box>
        {!narrow && s.tab === 'HOME' && (
          <Box flexDirection="column" width={44} marginLeft={2} flexGrow={1} key={`R:${s.tab}`}>
            <Card title="LATEST PROOF" purpose="the only thing that glows green">
              {last ? (
                <>
                  <Text color={theme.seal}>✓ {last.hash.slice(0, 15)}</Text>
                  <Text color={theme.textMuted} wrap="truncate">{last.subject} · {stamp(last.ts)} · {ago(last.ts)}</Text>
                </>
              ) : (
                <Text color={theme.textMuted}>no receipts yet — run anything</Text>
              )}
            </Card>
            <Box height={1} />
            <Card title="ACTIVITY" purpose="refusals red only" flexGrow={1}>
              {activity.length === 0 ? (
                <Text color={theme.textMuted}>quiet so far</Text>
              ) : (
                activity.slice(0, 10).map((row, i) => (
                  <Text key={i} color={row.refused ? theme.danger : row.sealed ? theme.textSecondary : theme.textMuted} wrap="truncate">{row.line}</Text>
                ))
              )}
            </Card>
          </Box>
        )}
        {!narrow && s.tab === 'CHAIN' && (
          <Box flexDirection="column" width={44} marginLeft={2} flexGrow={1} key={`R:${s.tab}`}>
            <DetailPane rec={selectedRec} />
          </Box>
        )}
        {!narrow && s.tab === 'LIBRARY' && (
          /* FIX 2: FLEET owns the full-height right rail */
          <Box flexDirection="column" width={44} marginLeft={2} flexGrow={1} key={`R:${s.tab}`}>
            <FleetPane lanes={lanes} policy={policy} />
          </Box>
        )}
        {!narrow && s.tab === 'RUN' && (
          <Box flexDirection="column" width={44} marginLeft={2} flexGrow={1} key={`R:${s.tab}`}>
            <LivePane row={runRows.rows[Math.min(s.selected, Math.max(0, runRows.rows.length - 1))]} recs={recs} compact={compact} />
            {pendingEscrows[0] ? <><Box height={1} /><EscrowPane escrow={pendingEscrows[0]} requester={escrowRequester} /></> : null}
          </Box>
        )}
        {s.overlay === 'qr' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.textPrimary}>COMPANION PAIR</Text>
            <Text color={theme.textMuted}>{`http://localhost:${COMPANION_PORT()}`}</Text>
            {qrText.split('\n').map((l, i) => <Text key={i} color={theme.seal}>{l}</Text>)}
            <Text color={theme.textMuted}>[Esc] close</Text>
          </Box>
        )}
        {s.overlay === 'sealconfirm' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.warn}>SEAL — confirm</Text>
            <Text color={theme.textPrimary}>seal an owner note onto the chain?</Text>
            <Text color={theme.textMuted}>[Enter/s] seal  [Esc] cancel</Text>
          </Box>
        )}
        {s.overlay === 'refuse' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.danger}>REFUSE — reason required</Text>
            <Text color={theme.textPrimary}>{`> ${s.input}`}</Text>
            <Text color={theme.textMuted}>[Enter] refuse with reason  [Esc] abandon</Text>
          </Box>
        )}
        {s.overlay === 'newrun' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.textPrimary}>NEW RUN — pick a lane</Text>
            {lanes.map((l, i) => (
              <Text key={l.id} color={i === s.pick ? theme.textPrimary : l.available ? theme.textSecondary : theme.textMuted}>
                {`${i === s.pick ? '▶' : ' '} ${l.id}${l.available ? '' : '  (not configured)'}`}
              </Text>
            ))}
            <Text color={theme.textMuted}>[j/k] move  [Enter] dispatch  [Esc] back</Text>
          </Box>
        )}
        {s.overlay === 'harnesspick' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.textPrimary}>HARNESS — who gets this model?</Text>
            {ADAPTERS.map((ad, i) => (
              <Text key={ad.name} color={i === s.pick ? theme.textPrimary : theme.textSecondary}>
                {`${i === s.pick ? '▶' : ' '} ${ad.name}${ad.canOpenRouter() ? '  (openrouter-capable)' : ''}`}
              </Text>
            ))}
            <Text color={theme.textMuted}>[j/k] move  [Enter] write harness.policy  [Esc] back</Text>
          </Box>
        )}
        {s.overlay === 'note' && (
          <Box position="absolute" top={2} left={20} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.textPrimary}>NOTE — {selModel?.id ?? '—'}</Text>
            <Text color={theme.textPrimary}>{`> ${s.input}`}</Text>
            <Text color={theme.textMuted}>[Enter] save  [Esc] cancel</Text>
          </Box>
        )}
        {/* SPEC §01/§02 — sovereign chat drawer: opaque which-key-style panel
            over the dimmed screen; CHAT mode owns every key but Esc */}
        {s.mode === 'CHAT' && (
          <Box position="absolute" top={2} left={10} width={Math.min(100, width - 20)} backgroundColor={theme.surfaceRaised} paddingX={1} flexDirection="column">
            <Text bold color={theme.textPrimary}>{`SOVEREIGN CHAT · ${chat.model || policy.default || '—'}`}</Text>
            {chat.messages.slice(-6).map((m, i) => (
              <Text key={i} color={m.role === 'user' ? theme.textSecondary : theme.textMuted} wrap="truncate">
                {`${m.role === 'user' ? 'you:' : 'ai:  '} ${String(m.content).slice(0, 90)}`}
              </Text>
            ))}
            {chat.isStreaming ? <Text color={theme.textMuted} wrap="truncate">{`${chat.streamingText.slice(0, 90)}…`}</Text> : null}
            {chat.error ? <Text color={theme.danger} wrap="truncate">{String(chat.error.message).slice(0, 90)}</Text> : null}
            <Box height={1} />
            <Text color={theme.textPrimary}>{`> ${s.input}`}</Text>
            <Text color={theme.textMuted}>[Enter] send · [Esc] leave · digits are text</Text>
          </Box>
        )}
      </Box>
      {/* action feedback is global, not a HOME-only line: picker writes from
          LIBRARY/RUN must be visible where they happen */}
      {flash ? <Text color={theme.seal} wrap="truncate">{flash}</Text> : null}
      {s.overlay === 'whichkey' && <WhichKeyOverlay mode={s.mode} tab={s.tab} />}
      <ShellFooter mode={s.mode} tab={s.tab} chainOk={chain.ok} chainCount={chain.count} busLive={busLive} width={width} model={policy.default ?? undefined} />
    </Box>
  );
}

// SPEC §03 — HOME: journey ladder (left, 62 cols) + STATUS strip; the right
// rail lives in ShellV2 (LATEST PROOF + ACTIVITY). Exactly one orange element:
// a pending escrow if one exists (money waiting beats a journey step), else
// the next unsealed step. FIX A: STATUS stretches so no blank band remains.
function HomePane(props: {
  recs: Receipt[]; chain: { ok: boolean; count: number }; busLive: boolean; docker: boolean | null;
  fleet: number; costToday: number; model: string; harness: string; flash: string;
  pendingEscrows: Escrow[]; compact: boolean;
}) {
  const rows = journeyRows(props.recs);
  const done = rows.filter(r => r.state === 'done').length;
  const escrowOrange = props.pendingEscrows.length > 0;
  return (
    <Box flexDirection="column">
      <Card title="YOUR JOURNEY" purpose={props.compact ? undefined : 'seven steps · the next unsealed step is the only orange'}>
        {escrowOrange && (
          <Text color={PAL.warn} wrap="truncate">
            {`▶ escrow ${String(props.pendingEscrows[0].escrow_id).slice(0, 12)} · ceiling $${props.pendingEscrows[0].ceiling_usd} awaits lock`}
          </Text>
        )}
        {rows.map(r => (
          r.state === 'done' ? (
            <Text key={r.step.id} wrap="truncate">
              <Text color={PAL.seal}>{`✓ ${r.step.verb.padEnd(10)}`}</Text>
              <Text color={PAL.textSecondary}>{r.hash.padEnd(12)}</Text>
              <Text color={PAL.textMuted}> {r.fact}</Text>
            </Text>
          ) : r.state === 'next' && !escrowOrange ? (
            <Text key={r.step.id} color={PAL.warn} wrap="truncate">{`▶ ${r.step.verb.padEnd(10)} ${r.fact}`}</Text>
          ) : (
            <Text key={r.step.id} color={PAL.textMuted} wrap="truncate">{`  ${r.step.verb.padEnd(10)} ${r.fact}`}</Text>
          )
        ))}
        {done === rows.length && <Text color={PAL.seal}>journey complete · {done}/{rows.length} sealed</Text>}
      </Card>
      <Box height={1} />
      <Card title="STATUS" purpose={props.compact ? undefined : 'one line · off is dim, never red'} flexGrow={1}>
        <Text wrap="truncate">
          <Text color={props.fleet > 0 ? PAL.seal : PAL.textMuted}>{`${props.fleet > 0 ? '●' : '○'} fleet ${props.fleet} connected`}</Text>
          <Text color={props.busLive ? PAL.seal : PAL.textMuted}>{`  ${props.busLive ? '●' : '○'} bus ${props.busLive ? 'live' : 'quiet'}`}</Text>
          <Text color={PAL.textMuted}>{`  ${props.docker ? '●' : '○'} docker ${props.docker ? 'on' : 'off'}`}</Text>
        </Text>
        <Text color={PAL.textMuted} wrap="truncate">
          {`cost today $${props.costToday.toFixed(2)} · model policy: ${props.model} · harness: ${props.harness}`}
        </Text>
      </Card>
    </Box>
  );
}

// SPEC §05 — CHAIN: receipts list (Telescope-style / filter over any field),
// status column from the chain (OK sealed · — unverified · FAIL refused), and
// the VERIFY strip: the only place "chain ok" is asserted, glowing only after
// a real verify. The fixed detail pane is the right rail (DetailPane).
function ChainPane(props: {
  recs: Receipt[]; filtered: Receipt[]; selected: number; chain: { ok: boolean; count: number };
  verified: null | { ok: boolean; count: number; epochs: number; head: string; at: string; via: string };
  filter: string;
}) {
  const { filtered, selected } = props;
  const start = Math.max(0, selected - 16);
  const windowRows = filtered.slice(start, start + 20);
  const refusals = props.recs.filter(r => r.status === 'denied' || r.status === 'failed').length;
  return (
    <Box flexDirection="column">
      <Text color={PAL.seal}>
        {`RECEIPTS  ${props.filter ? `/ ${props.filter} · ${filtered.length}/${props.recs.length}` : `${props.recs.length} · [/] filter`}`}
      </Text>
      {windowRows.map((r, i) => {
        const idx = start + i;
        const sel = idx === selected;
        const st = r.status === 'ok' ? 'OK' : r.status === 'failed' || r.status === 'denied' ? 'FAIL' : '—';
        const col = r.status === 'ok' ? PAL.seal : r.status === 'failed' || r.status === 'denied' ? PAL.danger : PAL.textMuted;
        // FIX 1 (director): column budget at 120x32 — status 4 · hash 8 ·
        // subject 43 (fills) · env-lock 14 = 72 of the 74-col column, leaving
        // gutter 2 before the DETAIL border (selection is white, no glyph).
        // FIX 3: hash prefix is exactly 8 chars everywhere.
        const statusCell = st.padEnd(4);
        const hashCell = String(r.hash).slice(7, 15);
        const subjectCell = String(r.subject).slice(0, 43).padEnd(43);
        const lockCell = (r.env_lock ? hashOf(r.env_lock as unknown as Record<string, unknown>).slice(7, 15) : '').padEnd(14);
        return (
          <Text key={r.id} wrap="truncate">
            <Text color={sel ? PAL.textPrimary : col}>{statusCell}</Text>
            <Text color={sel ? PAL.textPrimary : PAL.textSecondary}>{` ${hashCell} ${subjectCell}`}</Text>
            <Text color={PAL.textMuted}>{lockCell}</Text>
          </Text>
        );
      })}
      <Box height={1} />
      {props.verified ? (
        <>
          <Text color={props.verified.ok ? PAL.seal : PAL.danger} wrap="truncate">
            {`${props.verified.ok ? '✓' : '✕'} chain ${props.verified.ok ? 'ok' : 'BROKEN'} · ${props.verified.count} receipts · ${props.verified.epochs} epochs · head ${props.verified.head}`}
          </Text>
          <Text color={PAL.textMuted} wrap="truncate">
            {`refusals ${refusals} · verified ${stamp(props.verified.at)} via ${props.verified.via.slice(0, 12)}`}
          </Text>
        </>
      ) : (
        <Text color={PAL.textMuted} wrap="truncate">{`— not verified · press [v] · refusals ${refusals}`}</Text>
      )}
    </Box>
  );
}

// SPEC §05 C2 — the detail pane is always visible; fixed fields in schema
// order: prev_hash → hash, kind, policy, ts, via, sources/env_lock, actions.
function DetailPane({ rec }: { rec: Receipt | null }) {
  if (!rec) {
    return (
      <Card title="DETAIL" purpose="fixed fields · schema names" flexGrow={1}>
        <Text color={PAL.textMuted}>nothing selected</Text>
      </Card>
    );
  }
  const srcs = Array.isArray(rec.sources) ? rec.sources.length : 0;
  return (
    <Card title="DETAIL" purpose="fixed fields · schema names" flexGrow={1}>
      <Text color={PAL.seal} wrap="truncate">{`prev_hash ${prevLabel8(String(rec.prev_hash))} → hash ${rec.hash.slice(7, 15)}`}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">kind     {rec.kind}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">policy   {rec.policy}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">ts       {stamp(rec.ts)}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">via      {rec.via ?? rec.model_resolved ?? '—'}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">
        {`sources  ${srcs} · env_lock ${rec.env_lock ? hashOf(rec.env_lock as unknown as Record<string, unknown>).slice(7, 15) : '—'}`}
      </Text>
      <Text color={PAL.textMuted} wrap="truncate">actions [v] verify [o] open [y] copy</Text>
      <Box height={1} />
      <Text color={PAL.textMuted} wrap="truncate">{rec.subject}</Text>
      {rec.status && rec.status !== 'ok' ? <Text color={PAL.danger} wrap="truncate">status   {rec.status}</Text> : null}
    </Card>
  );
}

// SPEC §04 + FIX 1 — RUN: the list shows RUNS (running orange w/ elapsed +
// progress · queued dim · sealed phosphor w/ duration + hash · REFUSED red
// w/ hash), idle connectors collapse to one line with [n] new run.
interface RunRow { id: string; lane: string; state: 'running' | 'queued' | 'sealed' | 'REFUSED'; dur: string; hash: string; group: Receipt[]; ticks: number; endedAt: string }
function RunsPane(props: {
  rows: RunRow[]; idle: number; selected: number; feed: { lane: string; file: string }[];
  watched: string[]; compact: boolean; liveCollapsed: boolean;
}) {
  return (
    <Box flexDirection="column">
      <Card title="RUNS" purpose={props.compact ? undefined : 'running orange · queued dim · sealed phosphor · REFUSED red'}>
        {props.rows.length === 0
          ? <Text color={PAL.textMuted}>no runs yet</Text>
          : props.rows.map((r, i) => {
            const sel = i === props.selected;
            const col = r.state === 'running' ? PAL.warn : r.state === 'sealed' ? PAL.seal : r.state === 'REFUSED' ? PAL.danger : PAL.textMuted;
            const bar = r.state === 'running' ? ` ${'▮'.repeat(Math.min(4, r.ticks))}${'▯'.repeat(Math.max(0, 4 - Math.min(4, r.ticks)))}` : '';
            return (
              <Text key={r.id} wrap="truncate">
                <Text color={sel ? PAL.textPrimary : col}>{`${sel ? '▶' : ' '} ${r.lane.slice(0, 14).padEnd(14)}`}</Text>
                <Text color={col}>{r.state.padEnd(8)}</Text>
                <Text color={PAL.textMuted}>{r.dur.padEnd(7)}</Text>
                <Text color={col}>{r.state === 'running' ? bar : r.hash}</Text>
              </Text>
            );
          })}
        <Text color={PAL.textMuted}>{`${props.idle} idle · [n] new run`}</Text>
      </Card>
      <Box height={1} />
      <Card title="DROPS" purpose={props.compact ? undefined : `watched: ${props.watched.join(' · ')}`} flexGrow={props.liveCollapsed ? 1 : undefined}>
        {props.feed.length === 0
          ? <Text color={PAL.textMuted}>drops quiet — nothing waiting in intake</Text>
          : props.feed.slice(0, 6).map((f, i) => (
            <Text key={i} color={PAL.textMuted} wrap="truncate">{`↓ drop/${f.lane}/${f.file} · intake pending`}</Text>
          ))}
      </Card>
    </Box>
  );
}

// FIX 3 — LIVE: a running run shows the ticking bar; a sealed/refused run
// shows its sealed log tail (last 8 receipts) + env-lock; with nothing
// selected it collapses to one line so DROPS can grow.
function LivePane(props: { row: RunRow | undefined; recs: Receipt[]; compact: boolean }) {
  const row = props.row;
  if (!row) {
    return (
      <Card title="LIVE" purpose={props.compact ? undefined : 'bus-subscribed · never a poll'}>
        <Text color={PAL.textMuted}>nothing running · [n] new run</Text>
      </Card>
    );
  }
  if (row.state === 'running' || row.state === 'queued') {
    const stage = row.state === 'running' ? Math.min(8, 2 + row.ticks) : 2;
    const bar = '▮'.repeat(stage) + '▯'.repeat(8 - stage);
    const spin = '|/-\\'[row.ticks % 4];
    return (
      <Card title={`LIVE · ${row.lane}`} purpose={props.compact ? undefined : 'bus-subscribed · ticks from events, never a poll'} flexGrow={1}>
        <Text color={PAL.warn}>{`${spin} ${bar} ${row.dur}`}</Text>
        <Text color={PAL.textMuted} wrap="truncate">{`${row.ticks} bus events · ${row.state}`}</Text>
      </Card>
    );
  }
  const tail = row.group.slice(-8);
  const lockRec = [...row.group].reverse().find(r => r.env_lock);
  const tools = lockRec?.env_lock
    ? Object.entries(lockRec.env_lock.tools).slice(0, 2).map(([n, t]) => `${n} ${String(t.sha256).slice(0, 8)}`)
    : [];
  return (
    <Card title={`LIVE · ${row.lane}`} purpose={props.compact ? undefined : 'sealed log tail + env-lock'} flexGrow={1}>
      {tail.map((r, i) => (
        <Text key={i} color={r.status === 'ok' ? PAL.textSecondary : PAL.danger} wrap="truncate">
          {`${stamp(r.ts)} ${r.status === 'ok' ? 'ok ' : r.status === 'denied' ? 'DEN' : 'FAIL'} ${String(r.subject).slice(0, 30)}`}
        </Text>
      ))}
      <Text color={PAL.textSecondary} wrap="truncate">{lockRec ? `env-lock ${tools.join(' · ')}` : 'env-lock —'}</Text>
    </Card>
  );
}

function EscrowPane({ escrow, requester }: { escrow: Escrow; requester: string }) {
  return (
    <Card title="ESCROW · NEEDS YOU" purpose="appears only when something needs you">
        <Text color={PAL.warn} wrap="truncate">
          {`▶ ${String(escrow.plan_hash).slice(7, 15)} · est $${(escrow.ceiling_usd - escrow.drawn_usd).toFixed(2)}`}
        </Text>
        <Text color={PAL.textMuted} wrap="truncate">{`requested by: ${requester}`}</Text>
        <Text color={PAL.textMuted}>[a] approve  [r] refuse (reason)</Text>
    </Card>
  );
}
// SPEC §06 — LIBRARY: MODELS picker (role-grouped, fuzzy /, pinned float,
// real spend from receipts), FLEET (● connected / ○ not configured dim, with
// the harness→model route from harness.policy), BOARDS + PROJECTS.
function ModelsPane(props: {
  view: { role?: string; m?: ModelEntry }[]; selected: number; sel: ModelEntry | null;
  filter: string; compact: boolean;
}) {
  let mi = -1;
  return (
    <Box flexDirection="column">
      <Card title="MODELS" purpose={props.compact ? undefined : `from models.registry · ${props.filter ? `/ ${props.filter}` : '[/] fuzzy filter'}`} flexGrow={1}>
        {props.view.length === 0 ? <Text color={PAL.textMuted}>no models match</Text> : props.view.map((row, i) => {
          if (row.role) return <Text key={`r${i}`} color={PAL.textMuted}>{`role: ${row.role} ▾`}</Text>;
          mi += 1;
          const m = row.m as ModelEntry;
          const selIdx = mi;
          const sel = selIdx === props.selected;
          // FIX 1 (director): row budget inside the 71-col panel —
          // model 30 · ctx 5 · $in/$out 10 · caps 9 · spend 6, single-space
          // gutters, role ONLY in the group header, no ellipsis in any cell.
          // FIX 1+3 (close): ctx + $in/$out + caps (tools · vis · reason) come
          // from the catalog cache; dashes ONLY for models the API doesn't list
          const ctxFmt = (c: number): string => (c >= 1e6 ? `${Math.round(c / 1e6)}M` : `${Math.round(c / 1000)}k`);
          const ctx = (m.ctx ? ctxFmt(m.ctx) : '—').padEnd(5);
          // catalog placeholder pricing (negative per-token) is not a price:
          // dashes stay honest and keep the 10-col budget
          const pin = m.price_in !== undefined && m.price_in >= 0 ? m.price_in * 1e6 : null;
          const pout = m.price_out !== undefined && m.price_out >= 0 ? m.price_out * 1e6 : null;
          const fm = (x: number): string => (x % 1 === 0 ? String(x) : x.toFixed(1));
          const price = (pin !== null ? `$${fm(pin)}/$${fm(pout ?? 0)}` : '—/—').padEnd(10);
          const cp = m.supported_parameters ?? [];
          const caps = `${cp.includes('tools') ? 'T' : '·'}${cp.includes('vision') || cp.includes('image') ? 'V' : '·'}${cp.includes('reasoning') ? 'R' : '·'}`.padEnd(9);
          const sp = m.spend_usd ?? 0;
          const spend = (sp < 10 ? `$${sp.toFixed(2)}` : sp < 100 ? `$${sp.toFixed(1)}` : `$${Math.round(sp)}`).padEnd(6).slice(0, 6);
          return (
            // pin rides the marker column (✦) so no cell ever overflows the
            // 71-col budget — FIX 1 forbids ellipsis in any cell
            <Text key={m.id} wrap="truncate">
              <Text color={sel ? PAL.textPrimary : PAL.textSecondary}>
                {`${sel ? '▶' : m.pinned ? '✦' : ' '} ${m.id.slice(0, 30).padEnd(30)} ${ctx} ${price}`}
              </Text>
              <Text color={PAL.textMuted}>{` ${caps} ${spend}`}</Text>
            </Text>
          );
        })}
        {props.sel?.notes ? <Text color={PAL.textMuted} wrap="truncate">{`notes: "${props.sel.notes}"`}</Text> : null}
        <Text color={PAL.textMuted}>[Enter] set policy  [h] harness ▸  [p] pin  [n] note</Text>
      </Card>
    </Box>
  );
}

function FleetPane({ lanes, policy }: {
  lanes: { id: string; label: string; available: boolean; install?: string; model?: string }[];
  policy: { default: string | null; scopes: Record<string, string> };
}) {
  const idw = Math.max(...lanes.map(l => l.id.length), 8);
  return (
    <Card title="FLEET" purpose="absence is dim, not red" flexGrow={1}>
      {lanes.map(l => {
        // FIX 3: policy-followers read "→ <model> (policy)"; a harness scope
        // wins with "(harness)"; "policy unset" is unreachable after first run
        const scope = policy.scopes[`harness:${l.id}`];
        // FIX 2 (close): never cut a fleet name mid-token — the id column is
        // as wide as the longest fleet id; the route's model segment breaks at
        // a hyphen boundary if it cannot fit whole.
        const model = String(scope ?? policy.default ?? '');
        let last = model.split('/').pop() ?? '';
        const routeBudget = 40 - 2 - idw - 1 - (scope ? '(harness) '.length : '(policy) '.length);
        if (last.length > routeBudget) {
          const cut = last.lastIndexOf('-', routeBudget);
          last = cut > 0 ? last.slice(0, cut) : last.slice(0, routeBudget);
        }
        const route = !l.available
          ? 'not_configured'
          : scope ? `(harness) ${last}`
            : policy.default ? `(policy) ${last}`
              : 'policy unset';
        return (
          <Text key={l.id} color={l.available ? PAL.seal : PAL.textMuted} wrap="truncate">
            {`${l.available ? '●' : '○'} ${l.id.padEnd(idw)} ${route}`}
          </Text>
        );
      })}
    </Card>
  );
}

function BoardsPane(props: { boards: { templates: string[]; blueprints: string[]; missions: string[] }; projects: string[] }) {
  const b = props.boards;
  return (
    <Card title="BOARDS" purpose="mission · blueprint · template">
      <Text color={PAL.textSecondary} wrap="truncate">{`mission    ${b.missions.length ? b.missions.join(' · ') : '—'}`}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">{`blueprint  ${b.blueprints.length ? b.blueprints.join(' · ') : '—'}`}</Text>
      <Text color={PAL.textSecondary} wrap="truncate">{`template   ${b.templates.length ? b.templates.join(' · ') : '—'}`}</Text>
      <Text color={PAL.textMuted} wrap="truncate">{`PROJECTS  ${props.projects.join(' · ') || '—'}`}</Text>
    </Card>
  );
}
