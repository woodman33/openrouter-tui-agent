import type { HermesStoreSnapshot } from './store.js';
import type { HermesEvent } from './events.js';
import type { TimmyStatus } from '../tui/components/StatusGlyph.js';

// Pure view-model reducers over the Hermes mirror snapshot + log lines.
// No React, no IO beyond what callers pass in — directly unit-testable.

export interface RunSummary {
  id: string;
  at: string;
  source: string;
  model?: string;
  prompt?: string;
  status: TimmyStatus;
  costUsd?: number;
  receiptPath?: string;
}

export interface RunStep {
  id: string;
  at: string;
  glyph: string;
  color: string;
  text: string;
  elapsedMs?: number;
}

const RUN_STATUS_MAP: Record<string, TimmyStatus> = {
  created: 'created',
  running: 'running',
  waiting: 'waiting',
  completed: 'sealed',
  failed: 'failed',
  cancelled: 'cancelled'
};

export function liveRunSummary(snap: HermesStoreSnapshot): RunSummary | null {
  const run = snap.run;
  if (!run) return null;
  return {
    id: run.id,
    at: run.createdAt,
    source: 'hermes',
    model: run.model,
    prompt: run.prompt,
    status: RUN_STATUS_MAP[run.status] ?? 'running',
    costUsd: snap.usage?.costUsd,
    receiptPath: run.receiptPath
  };
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

// Reduce a live run's event stream into human step rows. Tool starts pair
// with their completes via payload ids; approvals and routes get their own
// glyphs so the trust story (fallbacks, gates) is visible at a glance.
export function stepTimeline(events: HermesEvent[]): RunStep[] {
  const steps: RunStep[] = [];
  const toolIndex = new Map<string, number>();

  for (const e of events) {
    const p = e.payload || {};
    switch (e.type) {
      case 'tool.start': {
        const id = str(p.toolCallId, str(p.id, e.id));
        toolIndex.set(id, steps.length);
        steps.push({ id: e.id, at: e.timestamp, glyph: '●', color: '#d2a8ff', text: `tool ${str(p.name, str(p.tool, 'call'))}` });
        break;
      }
      case 'tool.complete': {
        const id = str(p.toolCallId, str(p.id, ''));
        const i = toolIndex.get(id);
        if (i !== undefined) {
          const started = Date.parse(events.find(ev => ev.id === steps[i].id)?.timestamp || e.timestamp);
          steps[i] = { ...steps[i], glyph: '✓', color: '#3fb950', elapsedMs: Math.max(0, Date.parse(e.timestamp) - (isFinite(started) ? started : Date.parse(e.timestamp))) };
        } else {
          steps.push({ id: e.id, at: e.timestamp, glyph: '✓', color: '#3fb950', text: `tool ${str(p.name, 'call')} done` });
        }
        break;
      }
      case 'tool.error': {
        const id = str(p.toolCallId, str(p.id, ''));
        const i = toolIndex.get(id);
        if (i !== undefined) steps[i] = { ...steps[i], glyph: '✕', color: '#ff6b6b', text: `${steps[i].text} failed` };
        else steps.push({ id: e.id, at: e.timestamp, glyph: '✕', color: '#ff6b6b', text: `tool ${str(p.name, 'call')} failed` });
        break;
      }
      case 'approval.request':
      case 'sudo.request':
      case 'secret.request':
        steps.push({ id: e.id, at: e.timestamp, glyph: '⚠', color: '#f5b545', text: `APPROVAL · ${str(p.title, str(p.command, e.type))}` });
        break;
      case 'approval.response':
      case 'sudo.response':
      case 'secret.response': {
        const approved = str(p.decision, str(p.status)) !== 'rejected';
        steps.push({ id: e.id, at: e.timestamp, glyph: approved ? '✓' : '⊘', color: approved ? '#3fb950' : '#8a8a94', text: approved ? 'approved by you' : 'rejected by you' });
        break;
      }
      case 'clarify.request':
        steps.push({ id: e.id, at: e.timestamp, glyph: '?', color: '#79c0ff', text: `question · ${str(p.title, str(p.question)).slice(0, 60)}` });
        break;
      case 'clarify.response':
        steps.push({ id: e.id, at: e.timestamp, glyph: '✓', color: '#79c0ff', text: 'answered' });
        break;
      case 'model.switch':
        steps.push({ id: e.id, at: e.timestamp, glyph: '🔀', color: '#79c0ff', text: `model → ${str(p.model, '?')}` });
        break;
      case 'provider.route': {
        const status = str(p.status);
        if (status === 'failed') steps.push({ id: e.id, at: e.timestamp, glyph: '✕', color: '#ff6b6b', text: `${str(p.provider)} failed${str(p.reason) ? ` · ${str(p.reason).slice(0, 40)}` : ''}` });
        else if (status === 'fallback') steps.push({ id: e.id, at: e.timestamp, glyph: '🔀', color: '#d29922', text: `fallback → ${str(p.model, str(p.provider))}` });
        break;
      }
      case 'quota.warning':
        steps.push({ id: e.id, at: e.timestamp, glyph: '⚠', color: '#f5b545', text: 'quota warning' });
        break;
      case 'run.error':
        steps.push({ id: e.id, at: e.timestamp, glyph: '✕', color: '#ff6b6b', text: `run error · ${str(p.message).slice(0, 60)}` });
        break;
      default:
        break; // deltas/completes are stream noise in the timeline
    }
  }
  return steps;
}

export function sessionCost(snap: HermesStoreSnapshot): number {
  return snap.usage?.costUsd ?? 0;
}

// History rows from the TUI's own event log: [run.created] lines carry the
// run id, source and prompt. Honest about what we can know: past runs are
// shown completed; failures surface via LOGS.
export function runHistoryFromLogs(logLines: string[]): RunSummary[] {
  const runs: RunSummary[] = [];
  for (const line of logLines) {
    if (!line.includes('[run.created]')) continue;
    const ts = (line.match(/^\[?(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\]?/) || [])[1] || '';
    const runId = (line.match(/"runId"\s*:\s*"([^"]+)"/) || [])[1] || `run_${runs.length}`;
    const source = (line.match(/"source"\s*:\s*"([^"]+)"/) || [])[1] || 'timmy';
    const prompt = (line.match(/"prompt"\s*:\s*"([^"]+)"/) || [])[1];
    runs.push({ id: runId, at: ts, source: source.replace('timmy-', ''), prompt, status: 'completed' });
  }
  return runs.reverse();
}

export function mergeRunLists(live: RunSummary | null, history: RunSummary[]): RunSummary[] {
  const hist = live ? history.filter(h => h.id !== live.id) : history;
  return live ? [live, ...hist] : hist;
}
