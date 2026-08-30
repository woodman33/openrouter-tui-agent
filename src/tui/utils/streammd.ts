// DESIGN.md §2.4 — terminal typography is weight + color + case; §2 one
// palette; §8 bans decorative chrome. Streaming markdown renders through
// `marked` (the single permitted renderer dependency) with a Clearinghouse-
// styled token walk, so tokens format LIVE as they arrive (never
// raw-then-reformat): the caller re-renders the accumulated text per delta.
import { marked, type Token } from 'marked';
import chalk from 'chalk';
import { theme } from '../theme.js';

type Run = { text: string; style: (t: string) => string };

const plain: Run['style'] = t => t;
const display = (t: string): string => chalk.hex(theme.textPrimary).bold(t);
const dim = (t: string): string => chalk.hex(theme.textSecondary)(t);
const interaction = (t: string): string => chalk.hex(theme.accent)(t);

// Inline tokens → styled runs (recursive; version-stable token shapes).
function inlineRuns(tokens: Token[] | undefined, out: Run[] = []): Run[] {
  for (const tk of (tokens ?? []) as (Token & { tokens?: Token[]; text?: string; href?: string })[]) {
    const type = String(tk.type);
    if (type === 'text') {
      if (tk.tokens) inlineRuns(tk.tokens, out);
      else out.push({ text: String(tk.text ?? ''), style: plain });
    } else if (type === 'strong') {
      const inner = inlineRuns(tk.tokens);
      for (const r of inner) out.push({ text: r.text, style: t => display(r.style(t)) });
    } else if (type === 'em') {
      const inner = inlineRuns(tk.tokens);
      for (const r of inner) out.push({ text: r.text, style: t => chalk.italic(r.style(t)) });
    } else if (type === 'codespan') {
      out.push({ text: String(tk.text ?? ''), style: dim });
    } else if (type === 'del') {
      const inner = inlineRuns(tk.tokens);
      for (const r of inner) out.push({ text: r.text, style: t => chalk.strikethrough(r.style(t)) });
    } else if (type === 'link') {
      const inner = inlineRuns(tk.tokens);
      out.push({ text: inner.map(r => r.text).join('') || String(tk.href ?? ''), style: interaction });
    } else if (type === 'br') {
      out.push({ text: '\n', style: plain });
    } else {
      out.push({ text: String((tk as { text?: string }).text ?? (tk as { raw?: string }).raw ?? ''), style: plain });
    }
  }
  return out;
}

// Wrap styled runs at width into lines of concatenated styled segments.
function wrapRuns(runs: Run[], width: number, indent: string): string[] {
  const lines: string[] = [];
  let cur = '';
  let curLen = 0;
  const push = (): void => { lines.push(indent + cur); cur = ''; curLen = 0; };
  for (const run of runs) {
    for (const word of run.text.split(/(\s+)/)) {
      if (!word) continue;
      const wl = word.length;
      if (word === '\n') { push(); continue; }
      if (curLen + wl > width && curLen > 0 && word.trim() !== '') push();
      if (word.trim() === '' && curLen === 0) continue;
      cur += run.style(word);
      curLen += wl;
    }
  }
  if (cur.trim() !== '' || lines.length === 0) push();
  return lines;
}
// One render pass per delta. Partial markdown is tolerated: marked closes
// open blocks implicitly, so the live view is always a legal document.
export function renderMarkdown(md: string, width: number): string[] {
  let tokens: Token[] = [];
  try {
    tokens = marked.lexer(md);
  } catch {
    return md.split('\n'); // never crash the chat on a renderer edge
  }
  const out: string[] = [];
  for (const tk of tokens as (Token & { [k: string]: unknown })[]) {
    const type = String(tk.type);
    if (type === 'space') continue;
    else if (type === 'heading') out.push('', display(String(tk.text ?? '')), '');
    else if (type === 'paragraph') out.push(...wrapRuns(inlineRuns(tk.tokens as Token[]), width, ''), '');
    else if (type === 'code') {
      for (const l of String(tk.text ?? '').split('\n')) out.push('  ' + dim(l.length > width - 2 ? l.slice(0, width - 3) + '…' : l));
      out.push('');
    } else if (type === 'blockquote') {
      const inner = ((tk.tokens as Token[] | undefined) ?? marked.lexer(String(tk.text ?? '')))
        .filter(b => b.type === 'paragraph');
      for (const p of inner) out.push(...wrapRuns(inlineRuns((p as { tokens?: Token[] }).tokens), width - 4, '  ').map(l => dim(l)));
      out.push('');
    } else if (type === 'list') {
      let n = 0;
      for (const item of (tk.items as { tokens?: Token[]; text?: string }[]) ?? []) {
        n += 1;
        const bullet = (tk as { ordered?: boolean }).ordered ? `  ${n}.` : '  ▸';
        out.push(...wrapRuns(inlineRuns(item.tokens), width - 4, bullet + ' '));
      }
      out.push('');
    } else if (type === 'hr') out.push(dim('─'.repeat(Math.min(width, 24))), '');
    else if (type === 'table') {
      const head = ((tk.header as { text?: string }[]) ?? []).map(h => display(String(h.text ?? '')));
      out.push('  ' + head.join('  '));
      for (const row of (tk.rows as { text?: string }[][]) ?? []) {
        out.push('  ' + row.map(c => dim(String(c.text ?? ''))).join('  '));
      }
      out.push('');
    } else out.push(...wrapRuns(inlineRuns(tk.tokens as Token[]), width, ''), '');
  }
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}
