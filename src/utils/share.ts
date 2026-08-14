import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { execFileSync, spawn } from 'child_process';
import { osc52Copy } from './notify.js';

// Share layer — croc for file sharing (encrypted, peer-to-peer, zero infra),
// ttyd for terminal-in-browser (client demos). Both degrade honestly.
// ttyd is NEVER exposed publicly without auth: Tailscale/Access or -c user:pass.

export interface ShareStatus { croc: boolean; ttyd: boolean; tailscaleIp?: string; }

const has = (cmd: string) => {
  try { execFileSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
};

export function detectShare(): ShareStatus {
  let tailscaleIp: string | undefined;
  try { tailscaleIp = execFileSync('tailscale', ['ip', '-4'], { encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { /* no tailnet */ }
  return { croc: has('croc'), ttyd: has('ttyd'), tailscaleIp: tailscaleIp || undefined };
}

export function shareFile(path: string, dir: string = process.cwd()): { ok: boolean; code?: string; reason?: string } {
  if (!existsSync(path)) return { ok: false, reason: `no such file: ${path}` };
  const st = detectShare();
  if (!st.croc) return { ok: false, reason: 'install croc (brew install croc) — then /share sends any artifact with a one-time code, encrypted, no infra' };
  const code = `timmy-${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}`;
  const log = join(dir, '.timmy', 'runs', `share-${code}.log`);
  mkdirSync(dirname(log), { recursive: true });
  const out = createWriteStream(log);
  const child = spawn('croc', ['send', '--yes', '--code', code, path], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(out);
  child.stderr.pipe(out);
  child.unref();
  osc52Copy(code); // the code lands in your clipboard — paste it to the recipient
  return { ok: true, code };
}

export function demoTerminal(dir: string = process.cwd()): { ok: boolean; url?: string; cmd?: string; reason?: string } {
  const st = detectShare();
  if (!st.ttyd) return { ok: false, reason: 'install ttyd (brew install ttyd) — then /demo puts the crew in a browser for client demos' };
  const pass = Math.random().toString(36).slice(2, 10);
  const port = 7681;
  const cmd = `ttyd -c timmy:${pass} -p ${port} tmux attach -t timmy-watch`;
  const log = join(dir, '.timmy', 'runs', 'demo-ttyd.log');
  mkdirSync(dirname(log), { recursive: true });
  const child = spawn('sh', ['-c', `${cmd} > ${JSON.stringify(log)} 2>&1`], { detached: true, stdio: 'ignore' });
  child.unref();
  const host = st.tailscaleIp || '127.0.0.1';
  return {
    ok: true,
    cmd,
    url: `http://${host}:${port} (login timmy / ${pass})`,
    reason: st.tailscaleIp ? undefined : 'no tailnet detected — URL is localhost-only. Put ttyd behind Tailscale/Access before sharing beyond this machine.'
  };
}
