import { execFile, spawn } from 'child_process';

// Audible layer of the trust loop: seals and approvals page the human.
// OSC 9/777 for capable terminals (kitty/Ghostty/iTerm2/WezTerm), written to
// stderr so Ink's stdout diffing stays untouched; osascript fallback on macOS.
// TIMMY_NOTIFY=off kills it all. Rate-limited per kind so a seal storm can't spam.

const lastAt: Record<string, number> = {};
const MIN_GAP_MS = 1500;

export function notify(kind: string, title: string, body: string): void {
  if (process.env.TIMMY_NOTIFY === 'off') return;
  const now = Date.now();
  if (now - (lastAt[kind] || 0) < MIN_GAP_MS) return;
  lastAt[kind] = now;
  try {
    process.stderr.write(`\x1b]9;${title} — ${body}\x07`);
    process.stderr.write(`\x1b]777;notify;${title};${body}\x07`);
  } catch { /* not a terminal */ }
  if (process.platform === 'darwin' && process.stderr.isTTY) {
    const safe = (s: string) => s.replace(/["\\]/g, ' ').slice(0, 200);
    execFile('osascript', ['-e', `display notification "${safe(body)}" with title "${safe(title)}"`], () => {});
  }
}

// OSC-52 clipboard: survives SSH/tmux sessions; pbcopy fallback on macOS.
export function osc52Copy(text: string): boolean {
  try {
    const b64 = Buffer.from(text, 'utf8').toString('base64');
    process.stderr.write(`\x1b]52;c;${b64}\x07`);
  } catch { /* ignore */ }
  if (process.platform === 'darwin') {
    try {
      const child = spawn('pbcopy');
      child.stdin.write(text);
      child.stdin.end();
      return true;
    } catch {
      return false;
    }
  }
  return true;
}
