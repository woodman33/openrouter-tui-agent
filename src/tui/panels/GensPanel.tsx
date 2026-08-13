import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Agent } from '../../agent/core.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { statusGlyph } from '../components/StatusGlyph.js';
import {
  listGenerations, updateGeneration, recordGeneration,
  deriveStatusFromLog, extractArtifactFromLog, parseCostFromLog,
  generationsOverview, type GenerationRecord
} from '../../utils/generations.js';
import { GENERATION_PROVIDERS } from '../../utils/providers.js';
import { locateGenAgent, buildGenAgentArgs, launchDetached } from '../../utils/genbridge.js';
import { clockTime } from '../../utils/humanlog.js';

interface GensPanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  focusArea?: string;
  inputLocked?: boolean;
}

/**
 * GENS — the generation fabric as a control room. Queue prompts at any
 * provider, watch statuses flip live, inspect prompts/costs/artifacts.
 * Every run is ledgered and sealed; nothing here is simulated.
 */
export function GensPanel({ agent, inputLocked }: GensPanelProps) {
  const [gens, setGens] = useState<GenerationRecord[]>([]);
  const [idx, setIdx] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [provIdx, setProvIdx] = useState(0);

  const providers = GENERATION_PROVIDERS.filter(p => p.kind === 'image' || p.kind === 'video');
  const prov = providers[provIdx % providers.length];

  useEffect(() => {
    const load = () => {
      for (const g of listGenerations({}).slice(0, 40)) {
        if (g.log && existsSync(g.log)) {
          const t = readFileSync(g.log, 'utf8');
          const st = deriveStatusFromLog(t, g.status);
          const art = g.artifact || extractArtifactFromLog(t);
          const cost = g.cost_usd ?? parseCostFromLog(t);
          if (st !== g.status || art !== g.artifact || cost !== g.cost_usd) {
            updateGeneration(g.id, { status: st, artifact: art, cost_usd: cost });
          }
        }
      }
      setGens(listGenerations({}).slice(0, 40));
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  const sel = gens[Math.min(idx, Math.max(0, gens.length - 1))];

  useInput((char, key) => {
    if (composing) {
      if (key.escape) { setComposing(false); setDraft(''); return; }
      if (char && char.toLowerCase() === 'm' && key.meta) { setProvIdx(i => i + 1); return; }
      if (key.tab) { setProvIdx(i => i + 1); return; }
      if (key.return) {
        const prompt = draft.trim();
        if (prompt && prov) {
          const genDir = locateGenAgent();
          const sargs = buildGenAgentArgs(prov, prompt);
          const launched = Boolean(genDir && sargs);
          const rec = recordGeneration({
            prompt, provider: prov.id, model: prov.modelId, kind: prov.kind,
            transport: prov.transport, status: launched ? 'running' : 'queued'
          });
          if (launched) {
            const log = join(process.cwd(), '.timmy', 'runs', `${rec.id}.log`);
            updateGeneration(rec.id, { log });
            launchDetached(genDir as string, sargs as string[], log);
          }
          agent.emit('run.created' as any, { runId: rec.id, source: 'timmy-gens', provider: prov.id, prompt_hash: rec.prompt_hash, timestamp: Date.now() });
        }
        setComposing(false);
        setDraft('');
        return;
      }
      if (key.backspace || key.delete) { setDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, gens.length - 1), i + 1)); return; }
    if (char.toLowerCase() === 'p') { setComposing(true); return; }
    if (char.toLowerCase() === 'l') { agent.emit('mode:change' as any, 'logs'); return; }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="🎬"
      title="GENS — GENERATION CONTROL ROOM"
      status={generationsOverview()}
      statusColor="#d2a8ff"
      explain="Queue prompts at any provider; watch statuses flip live; every run ledgered, costed, sealed."
      hints={[
        { key: '↑↓', label: 'select' },
        { key: 'p', label: 'new prompt' },
        { key: 'tab', label: 'provider (while typing)' },
        { key: 'l', label: 'logs' }
      ]}
    >
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width="46%" paddingRight={1} borderStyle="single" borderColor="#21262d">
          {gens.length === 0 && (
            <Box flexDirection="column">
              <Text color="#6e7681" dimColor>no generations yet.</Text>
              <Text color="#6e7681" dimColor>[p] writes a prompt — tab cycles {providers.length} providers.</Text>
            </Box>
          )}
          {gens.map((g, i) => {
            const glyph = statusGlyph(g.status === 'done' ? 'sealed' : g.status === 'failed' ? 'failed' : g.status === 'running' ? 'running' : 'queued');
            const isSel = i === Math.min(idx, gens.length - 1);
            return (
              <Text key={g.id} color={isSel ? '#d2a8ff' : glyph.color} bold={isSel} wrap="truncate">
                {isSel ? '▶ ' : '  '}{glyph.glyph} {clockTime(g.created_at).slice(0, 5)} {g.provider.padEnd(16)}{g.cost_usd !== undefined ? ` $${g.cost_usd.toFixed(3)}` : ''} {g.prompt.slice(0, 22)}
              </Text>
            );
          })}
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
          {sel ? (
            <>
              <Text bold color="#d2a8ff" wrap="truncate">{sel.provider}{sel.model ? ` · ${sel.model}` : ''} · {sel.status}</Text>
              <Text color="#8b949e" dimColor>{sel.created_at.replace('T', ' ').slice(0, 19)} · {sel.transport}{sel.cost_usd !== undefined ? ` · $${sel.cost_usd.toFixed(4)}` : ''}</Text>
              <Box marginTop={1} flexDirection="column">
                <Text wrap="wrap">{sel.prompt}</Text>
              </Box>
              {sel.artifact && <Text color="#3fb950">→ {sel.artifact}</Text>}
              {sel.framesDir && <Text color="#8a8a94" dimColor>frames: {sel.framesDir} ({sel.frameCount || 0})</Text>}
              {sel.log && existsSync(sel.log) && (
                <Box flexDirection="column" marginTop={1}>
                  {readFileSync(sel.log, 'utf8').split('\n').filter(Boolean).slice(-4).map((l, i) => (
                    <Text key={i} color="#6e7681" dimColor wrap="truncate">{l}</Text>
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Text color="#6e7681" dimColor>select a generation, or [p] to queue one.</Text>
          )}
          {composing && (
            <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="#79c0ff" paddingX={1}>
              <Text color="#79c0ff">provider: {prov?.id || '?'} ({prov?.kind}) — [tab] cycles</Text>
              <Text>prompt: {draft}█</Text>
              <Text color="#8a8a94" dimColor>Enter queues (real credits if launched) · Esc cancels</Text>
            </Box>
          )}
        </Box>
      </Box>
    </PanelFrame>
  );
}
