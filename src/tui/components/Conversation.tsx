// The WALNUT counterflow chat — left column (work order p12; DESIGN.md §2,
// §3.2, §5.4). User lines + caret in accent (§2.3 interaction); assistant
// output streams as LIVE markdown via streammd (§2.4 registers); every
// completed turn is footed with its receipt hash in seal, never bold green
// decoration (§2.3 proof-only); failover is announced as a dim Meta line
// (§2.4), never silent.
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { EmptyState } from '../ui/EmptyState.js';
import { useKeyOwner } from '../hooks/useKeyDispatcher.js';
import { useAgent } from '../hooks/useAgent.js';
import { lastReceipt, appendReceipt } from '../../utils/receipts.js';
import { chatSealMap } from '../../utils/chat-seals.js';
import { renderMarkdown } from '../utils/streammd.js';
import { theme } from '../theme.js';
import { handleSlashCommand } from '../../utils/slash-commands.js';
import type { Agent } from '../../agent/core.js';
import { ViewportContext } from '../layout.js';

interface Turn { role: 'user' | 'assistant'; text: string; seal?: string; timestamp?: number }
interface SysLine { text: string }

const animationsOn = (): boolean =>
  process.env.TIMMY_DISABLE_ANIMATION !== '1';

export function Conversation({ agent, keys }: { agent: Agent; keys: 'dispatcher' | 'local' }) {
  const { w: width } = React.useContext(ViewportContext);
  const state = useAgent(agent);
  const [input, setInput] = useState('');
  const inputRef = useRef('');
  const put = (v: string): void => { inputRef.current = v; setInput(v); };
  const [scroll, setScroll] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [seals, setSeals] = useState<Record<number, string>>({});
  const [sys, setSys] = useState<SysLine[]>([]);
  const [blink, setBlink] = useState(true);
  const wasStreaming = useRef(false);
  const sentAt = useRef(0);
  const provRef = useRef<string>('none');

  // caret blink is the ONLY thinking motion (work order §7 / DESIGN.md §8)
  useEffect(() => {
    if (!animationsOn()) return;
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  // mirror agent messages into turns; foot completed turns with their seal
  useEffect(() => {
    const next: Turn[] = [];
    for (const m of state.messages) {
      const content = String(m.content ?? '');
      if (!content) continue;
      if (m.role === 'user') next.push({ role: 'user', text: content, timestamp: m.timestamp });
      else next.push({ role: 'assistant', text: content, timestamp: m.timestamp });
    }
    setTurns(next);
    setSeals(s => chatSealMap(next, s));
    // when a stream just ended: foot the turn with its receipt. Prefer a seal
    // the pipeline already minted this turn; else mint one through the
    // canonical appendReceipt (READ-ONLY law: we use the chain, never edit
    // its logic — DESIGN.md §1).
    if (wasStreaming.current && !state.isStreaming && next.length) {
      const lastUser = [...state.messages].reverse().find(m => m.role === 'user');
      const subj = String(lastUser?.content ?? 'chat turn').slice(0, 60);
      let rec = lastReceipt('runs');
      const fresh = rec !== null && Date.parse(rec.ts) >= sentAt.current - 500;
      if (!fresh) {
        try {
          const a = agent as unknown as { config?: { model?: string } };
          rec = appendReceipt('runs', {
            kind: 'llm', subject: 'walnut chat · ' + subj, policy: 'auto',
            usage: { provider: provRef.current, model: String(a.config?.model ?? 'local') },
          } as never);
        } catch { /* never crash the chat on receipt IO */ }
      }
      if (rec?.hash) setSeals(s => ({ ...s, [next.length - 1]: String(rec.hash) }));
    }
    wasStreaming.current = state.isStreaming;
  }, [state.messages, state.isStreaming, agent]);

  // announced failover — no silent switching (work order MODEL ROUTING)
  useEffect(() => {
    const t = setInterval(() => {
      const p = String((agent as { activeProvider?: string }).activeProvider ?? 'none');
      if (p !== provRef.current) {
        const from = provRef.current;
        provRef.current = p;
        if (from === 'openrouter' && p === 'ollama') {
          setSys(s => [...s, { text: '· failover — openrouter unreachable · local model active' }]);
        } else if (p === 'ollama' && from === 'none') {
          setSys(s => [...s, { text: '· routing — local ollama (openrouter not reachable at boot)' }]);
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, [agent]);
  const submit = (): void => {
    const text = inputRef.current.trim();
    if (!text) return;
    put('');
    sentAt.current = Date.now();
    if (text.startsWith('/')) {
      const res = handleSlashCommand(text, agent, state);
      if (res) setSys(s => [...s, { text: `· ${res}` }]);
    } else {
      state.send(text);
    }
    setScroll(0);
  };

  const onKey = (char: string, key: { upArrow: boolean; downArrow: boolean; return: boolean; backspace: boolean; delete: boolean; ctrl: boolean; meta: boolean }): void => {
    if (key.upArrow) { setScroll(s => s + 1); return; }
    if (key.downArrow) { setScroll(s => Math.max(0, s - 1)); return; }
    if (key.backspace || key.delete) { put(inputRef.current.slice(0, -1)); return; }
    // tmux/paste delivery can bundle text + return into ONE chunk ("hi\r")
    const isRet = key.return || char.includes('\r') || char.includes('\n');
    if (isRet) {
      const pre = char.split(/\r|\n/)[0] ?? '';
      if (pre && !key.ctrl && !key.meta) put(inputRef.current + pre);
      submit();
      return;
    }
    if (char && !key.ctrl && !key.meta && char !== '\t') put(inputRef.current + char);
  };
  // in-app: keys arrive ONLY while the frozen dispatcher's stack top is
  // 'input:command' (Enter claims it at nav level) — contract untouched.
  useKeyOwner('input:command', onKey);
  useInput((c, k) => { if (keys === 'local') onKey(c, k as never); }, { isActive: keys === 'local' });

  // Completed turns memoize their markdown render — re-lexing the whole
  // history on every caret blink starves the key loop at boot.
  const bodyW = Math.max(24, width - (keys === 'local' ? 44 : 4));
  const turnRows = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < turns.length; i++) {
      const t = turns[i];
      const seal = seals[i] ?? t.seal;
      if (t.role === 'user') {
        out.push(<Text key={`u${i}`} bold color={theme.accent} wrap="wrap">▸ {t.text}</Text>);
        out.push(<Text key={`ub${i}`}> </Text>);
      } else {
        for (const l of renderMarkdown(t.text, bodyW)) {
          out.push(<Text key={`a${i}-${out.length}`}>{l || ' '}</Text>);
        }
        if (seal) {
          out.push(
            <Text key={`f${i}`}>
              <Text color={theme.textMuted}>● sealed </Text>
              <Text color={theme.seal}>{seal.slice(7, 15)}…</Text>
            </Text>
          );
        }
        out.push(<Text key={`ab${i}`}> </Text>);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, seals, bodyW]);

  const rows: React.ReactNode[] = [...turnRows];
  // announcements live at the live edge so a failover is seen when it happens
  for (const s of sys.slice(-3)) rows.push(<Text key={`s${rows.length}`} color={theme.textMuted}>{s.text}</Text>);
  if (state.isStreaming && state.streamingText) {
    const md = renderMarkdown(state.streamingText, bodyW);
    md.forEach((l, i) => {
      const last = i === md.length - 1;
      rows.push(
        <Text key={`v${rows.length}`}>
          {l}
          {last && (blink ? <Text color={theme.accent}>▌</Text> : <Text> </Text>)}
        </Text>
      );
    });
  } else if (state.isThinking) {
    rows.push(<Text key="th" color={theme.textMuted}>{blink ? '●' : '○'} thinking…</Text>);
  }
  if (state.error) rows.push(<Text key="e" color={theme.danger}>× {state.error.message}</Text>);

  const INPUT_H = 3;
  const viewH = Math.max(4, (React.useContext(ViewportContext).h || 24) - INPUT_H - 6);
  const clamped = Math.min(scroll, Math.max(0, rows.length - viewH));
  const visible = rows.slice(Math.max(0, rows.length - clamped - viewH), rows.length - clamped);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column" flexGrow={1}>
        {rows.length === 0 && !state.isStreaming && (
          <EmptyState line="no conversation yet — type a mission, every run seals a receipt" action="[?] keymap" />
        )}
        {visible}
      </Box>
      <Box flexShrink={0} marginTop={1}>
        <Text color={theme.accent}>▸ </Text>
        <Text color={input ? theme.textPrimary : theme.textMuted}>
          {input ? `${input}${blink ? '▌' : ' '}` : `[COMMAND POST — type a mission…]${blink ? '▌' : ' '}`}
        </Text>
      </Box>
    </Box>
  );
}
