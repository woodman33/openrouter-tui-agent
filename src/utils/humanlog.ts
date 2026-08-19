import { theme } from '../tui/theme.js';
// Human log layer — raw log lines are machine noise; TIMMY shows short,
// readable events instead. Telemetry spam is counted, never printed per-line.

export interface HumanEvent {
  ts?: string;
  icon: string;
  text: string;
  color: string;
  count?: number;
}

export interface HumanizedLog {
  events: HumanEvent[];
  telemetryCount: number;
}

const TS_RE = /^\[?(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\]?\s*/;

export function parseTs(line: string): string | undefined {
  const m = line.match(TS_RE);
  return m ? m[1] : undefined;
}

export function relTime(iso?: string, nowMs: number = Date.now()): string {
  if (!iso) return '     ';
  const t = Date.parse(iso);
  if (!isFinite(t)) return '     ';
  const s = Math.max(0, Math.round((nowMs - t) / 1000));
  if (s < 5) return ' now ';
  if (s < 60) return `${String(s).padStart(2, ' ')}s `;
  if (s < 3600) return `${Math.floor(s / 60)}m `;
  if (s < 86400) return `${Math.floor(s / 3600)}h `;
  return iso.slice(5, 10);
}

export function clockTime(iso?: string): string {
  if (!iso) return '        ';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '        ';
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
}

function clean(line: string, max = 64): string {
  return line
    .replace(TS_RE, '')
    .replace(/\[(INFO|WARN|ERROR|DEBUG)\]\s*/g, '')
    .replace(/\s*\{[\s\S]*$/, '') // drop JSON blobs — humans get words, not payloads
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function humanizeLine(line: string): HumanEvent | null {
  const ts = parseTs(line);
  if (/Telemetry sync|spool/i.test(line)) return null; // aggregated, never printed
  if (/mode\.change/.test(line)) return null; // navigation noise

  let m: RegExpMatchArray | null;
  // JSON events: ledger entries carry genId; agent-internal events don't.
  if ((m = line.match(/"event"\s*:\s*"([^"]+)"/))) {
    const ev = m[1];
    if (/"genId"/.test(line)) {
      const detail = (line.match(/"detail"\s*:\s*"([^"]*)"/) || [])[1] || '';
      if (ev === 'recorded') {
        const prov = detail.split('/')[0];
        return { ts, icon: '🎬', color: theme.brand, text: `gen queued${prov ? ` · ${prov}` : ''}` };
      }
      if (ev === 'status') {
        if (detail === 'done') return { ts, icon: '✓', color: theme.success, text: 'gen done — artifact in ledger' };
        if (detail === 'failed') return { ts, icon: '✕', color: theme.error, text: 'gen failed — see /gens' };
        if (detail === 'running') return { ts, icon: '●', color: theme.warning, text: 'gen running' };
        return { ts, icon: '◌', color: theme.textTertiary, text: `gen ${detail || 'queued'}` };
      }
      return { ts, icon: '🎬', color: theme.textTertiary, text: `gen ${ev}` };
    }
    switch (ev) {
      case 'model.selected': {
        const model = (line.match(/"model"\s*:\s*"([^"]+)"/) || [])[1];
        return { ts, icon: '🔀', color: theme.info, text: model ? `→ ${model}` : 'model selected' };
      }
      case 'model.test.started':
        return null; // noise; only outcomes matter
      case 'model.test.succeeded':
        return { ts, icon: '✓', color: theme.success, text: 'health ok' };
      case 'model.fallback.used':
        return { ts, icon: '🔀', color: theme.warning, text: 'provider fallback used' };
      case 'openrouter.request.failed':
        return { ts, icon: '✕', color: theme.error, text: 'openrouter request failed' };
      case 'run.started':
        return { ts, icon: '⛁', color: theme.success, text: 'run started' };
      default:
        return { ts, icon: '·', color: theme.textTertiary, text: ev.replace(/\./g, ' ') };
    }
  }
  if (/run\.created/.test(line)) {
    const src = (line.match(/"source"\s*:\s*"([^"]+)"/) || [])[1];
    return { ts, icon: '⛁', color: theme.success, text: `run sealed${src && src !== 'timmy' ? ` · ${src.replace('timmy-', '')}` : ''}` };
  }
  if (/model\.switch/.test(line) && (m = line.match(/"model"\s*:\s*"([^"]+)"/))) {
    return { ts, icon: '🔀', color: theme.info, text: `model → ${m[1]}` };
  }
  if (/model\.test\.succeeded/.test(line)) return { ts, icon: '✓', color: theme.success, text: 'provider health ok' };
  if (/Ctrl\+C captured/.test(line)) return { ts, icon: '⏻', color: theme.textTertiary, text: 'clean exit' };
  if (/browser\.spawned|lane\.spawned|carbonyl/.test(line)) return { ts, icon: '🖥', color: theme.brand, text: 'browser lane opened' };
  if (/lane\.command\.sent/.test(line)) return { ts, icon: '→', color: theme.info, text: 'task sent to lane' };
  if (/approval\.granted/.test(line)) return { ts, icon: '✓', color: theme.success, text: 'you approved a blocked command' };
  if (/approval\.(requested|required)|blocked command/i.test(line)) return { ts, icon: '⚠', color: theme.warning, text: 'command parked — waiting your approval' };
  if (/Companion port|companion.{0,20}unreachable/i.test(line)) return { ts, icon: '✕', color: theme.error, text: 'companion unreachable' };
  if (/Companion client connected/.test(line)) return { ts, icon: '☁', color: theme.textTertiary, text: 'companion joined' };
  if (/Companion client disconnected/.test(line)) return { ts, icon: '☁', color: theme.textTertiary, text: 'companion left' };
  if (/\[ERROR\]/.test(line)) return { ts, icon: '✕', color: theme.error, text: clean(line) };
  if (/\[WARN\]/.test(line)) return { ts, icon: '⚠', color: theme.warning, text: clean(line) };
  if (/failed|Failed/.test(line)) return { ts, icon: '✕', color: theme.error, text: clean(line) };

  const c = clean(line);
  if (c.length < 5) return null;
  return { ts, icon: '·', color: theme.textSecondary, text: c };
}

export function humanizeLines(lines: string[]): HumanizedLog {
  let telemetryCount = 0;
  const events: HumanEvent[] = [];
  for (const line of lines) {
    if (/Telemetry sync/i.test(line)) {
      telemetryCount++;
      continue;
    }
    const ev = humanizeLine(line);
    if (!ev) continue;
    // collapse consecutive repeats (health ok ×3) into one counted line
    const prev = events[events.length - 1];
    if (prev && prev.icon === ev.icon && prev.text.replace(/ ×\d+$/, '') === ev.text) {
      prev.count = (prev.count || 1) + 1;
      prev.text = `${ev.text} ×${prev.count}`;
      prev.ts = ev.ts;
    } else {
      events.push(ev);
    }
  }
  return { events, telemetryCount };
}
