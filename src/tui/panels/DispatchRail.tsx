import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { LANE_RUNNERS } from '../../agent/lanes.js';
import {
  createPlan, armPlan, dispatchPlan, tailLane, pauseOrCancelLane, collectRun,
  type DispatchPlan, type StoredPlan
} from '../../utils/dispatch.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Command Post v0.1 — compact Dispatch rail (J-BANG: Job Bundle, Authorization,
// Navigation and Guarantees). Extends ChatPanel; never replaces it. The exact
// plan hash is shown before launch; launch requires an operator token.
export function DispatchRail({ width }: { width: number }) {
  const harnessIds = Object.keys(LANE_RUNNERS);
  const [hIdx, setHIdx] = useState(0);
  const [copies, setCopies] = useState(1);
  const [wallS, setWallS] = useState(300);
  const [budget, setBudget] = useState(0);
  const [objective, setObjective] = useState('');
  const [typing, setTyping] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planHash, setPlanHash] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('rail: [o] objective · [h] harness · [+-] copies/budget/wall · [p] plan · [g] arm+launch (J-BANG) · [t] tail · [c] cancel');

  const stored = useMemo<StoredPlan | null>(() => {
    if (!planId) return null;
    try { return JSON.parse(readFileSync(join(process.cwd(), '.timmy', 'dispatch', `${planId}.json`), 'utf8')); } catch { return null; }
  }, [planId, msg]);

  useInput((char, key) => {
    if (typing) {
      if (key.return) { setTyping(false); return; }
      if (key.backspace || key.delete) { setObjective(o => o.slice(0, -1)); return; }
      if (key.escape) { setTyping(false); return; }
      setObjective(o => o + char);
      return;
    }
    switch (char) {
      case 'o': setTyping(true); setMsg('type objective, Enter to commit'); break;
      case 'h': setHIdx(i => (i + 1) % harnessIds.length); break;
      case '+': setCopies(c => Math.min(8, c + 1)); break;
      case '-': setCopies(c => Math.max(1, c - 1)); break;
      case 'w': setWallS(w => w === 300 ? 900 : 300); break;
      case '$': setBudget(b => b === 0 ? 0.5 : 0); break;
      case 'p': {
        const plan: DispatchPlan = {
          schema_version: 'dispatch/0.1',
          objective: objective || '(no objective)',
          deliverables: ['result'], acceptance_tests: ['see collect'],
          harnesses: [harnessIds[hIdx]],
          model_policy: { requested: LANE_RUNNERS[harnessIds[hIdx]].model ?? 'auto', allow_paid: budget > 0, max_spend_usd: budget },
          copies, cadence: { mode: 'parallel', depends_on: [] },
          context_manifest: [], repo_ref: 'HEAD',
          workspace: { kind: 'host-ephemeral' },
          permissions: { filesystem: 'rw-ephemeral', network: budget > 0, tools: [], secrets: [] },
          limits: { cost_usd: budget, wall_ms: wallS * 1000 },
          retry_limit: 1, approval: { required: true, mode: 'manual' },
          expected_artifacts: [], telemetry: { redact: true, events: true }
        };
        const r = createPlan(plan);
        if (r.ok) { setPlanId(r.id!); setPlanHash(r.plan_hash!); setArmed(false); setMsg(`plan ${r.id} · hash ${r.plan_hash} · operator: timmy approve ${r.plan_hash}`); }
        else setMsg(`plan rejected: ${r.note}`);
        break;
      }
      case 'g': {
        if (!planId || !planHash) { setMsg('create a plan first [p]'); break; }
        if (!token) { setMsg(`J-BANG needs the operator token for ${planHash.slice(0, 12)}… (paste via [v] after \`timmy approve\`)`); break; }
        const a = armPlan(planId, token.trim());
        if (!a.ok) { setMsg(`arm denied: ${a.note}`); break; }
        const d = dispatchPlan(planId);
        setArmed(d.ok);
        setMsg(d.ok ? `J-BANG! launched ${d.session}` : `launch refused: ${d.note ?? d.blocked?.note}`);
        break;
      }
      case 'v': setTyping(true); setMsg('paste approval token, Enter'); setToken(''); break;
      case 't': {
        const t = planId ? tailLane(planId) : null;
        setMsg(t?.ok ? (t.lines ?? []).slice(-3).join(' | ').slice(0, 120) : 'no lane');
        break;
      }
      case 'c': {
        const x = planId ? pauseOrCancelLane(planId, 'cancel') : null;
        setMsg(x?.ok ? 'cancelled · receipt sealed' : 'nothing to cancel');
        break;
      }
      case 'j': {
        const c = planId ? collectRun(planId) : null;
        setMsg(c?.ok ? `collected · over_wall=${c.over_wall} · receipt ${String(c.receipt).slice(0, 12)}…` : 'nothing to collect');
        break;
      }
    }
  });

  const harness = harnessIds[hIdx];
  return (
    <Box flexDirection="column" width={width} borderStyle="single" borderColor="#5d4a8a" paddingX={1} flexShrink={0}>
      <Text bold color="#a78bfa">DISPATCH · J-BANG</Text>
      <Text color="#8892a0">harness  <Text color="#e8ecf0">{harness}</Text> ({LANE_RUNNERS[harness].label})</Text>
      <Text color="#8892a0">copies   <Text color="#e8ecf0">{copies}</Text> · wall <Text color="#e8ecf0">{wallS}s</Text> · budget <Text color="#ffaa33">${budget}</Text></Text>
      <Text color="#8892a0">objective <Text color="#e8ecf0">{objective.slice(0, width - 12) || '—'}</Text></Text>
      <Text color="#8892a0">plan     <Text color="#e8ecf0">{planId ?? '—'}</Text> · {stored?.lifecycle ?? 'draft'}</Text>
      <Text color="#8892a0">hash     <Text color="#4ade80">{planHash ? planHash.slice(0, 16) + '…' : '— shown before launch'}</Text></Text>
      <Text color="#8892a0">armed    <Text color={armed ? '#4ade80' : '#f5b545'}>{armed ? 'yes' : 'no'}</Text></Text>
      <Text color="#5a6470">{msg}</Text>
    </Box>
  );
}
