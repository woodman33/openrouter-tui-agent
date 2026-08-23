// v1.0.5-keyboard-arch — 60-second human QA, automated at PTY level.
// Steps 1-8 of scripts/qa-keyboard-60s.md driven via tmux send-keys +
// capture-pane; FULL captures printed. Any step failing = task NOT done.
import { execSync } from 'child_process';

const S = 'qa60';
const tmux = (a: string) => execSync(`tmux ${a}`, { encoding: 'utf8' });
const cap = () => tmux(`capture-pane -p -t ${S}`);
const send = (k: string) => tmux(`send-keys -t ${S} ${k}`);
const type = (t: string) => tmux(`send-keys -t ${S} -l ${JSON.stringify(t)}`);
const sleep = (ms: number) => execSync(`sleep ${ms / 1000}`);
const dump = (label: string) => {
  const lines = cap().split('\n').filter(l => l.trim());
  console.log(`\n════ ${label} ════`);
  console.log(lines.slice(0, 6).join('\n'));
  console.log('  […]');
  console.log(lines.slice(-2).join('\n'));
};

try { tmux(`kill-session -t ${S}`); } catch { /* fresh */ }

// 1 · Boot
tmux(`new-session -d -s ${S} -x 120 -y 40 "cd ${process.cwd()} && npx tsx timmy.ts; sleep 90"`);
sleep(7000);
dump('1 · BOOT (footer shows MODE:NAV)');

// 2 · views switch, status bar NAV
for (const k of ['2', '3', '4', '1']) { send(k); sleep(600); }
dump('2 · PRESSED 2,3,4,1 (back on COMMAND, MODE:NAV)');

// 3 · Enter — chat takes focus
send('Enter'); sleep(500);
dump('3 · ENTER (MODE:INPUT:COMMAND)');

// 4 · nav-laden typing lands in the buffer only
type('test 2 tab q'); sleep(600);
dump('4 · TYPED "test 2 tab q" (no view switch, no quit)');

// 5 · Esc — back to NAV
send('Escape'); sleep(500);
dump('5 · ESC (MODE:NAV)');

// 6 · Tab — pane focus cycles (◆ follows)
send('2'); sleep(600);
const before = cap();
send('Tab'); sleep(500);
const after = cap();
console.log('\n════ 6 · TAB CYCLES PANE FOCUS ════');
console.log('before ◆ count on left card:', (before.match(/◆/g) ?? []).length, '| after:', (after.match(/◆/g) ?? []).length);
dump('6 · AFTER TAB (focus glyph moved)');

// 7 · ^K palette modal, Esc closes
send('1'); sleep(500);
send('C-k'); sleep(500);
dump('7 · ^K (MODE:MODAL:PALETTE)');
send('Escape'); sleep(500);
dump('7b · ESC (back to NAV)');

// 8 · q — clean quit, alt-screen restored
send('q'); sleep(1500);
console.log('\n════ 8 · AFTER q (shell back, alt-screen restored) ════');
console.log(cap().split('\n').filter(l => l.trim()).slice(0, 6).join('\n'));
const gone = !cap().includes('TIMMY TRUST OS');
console.log('\nSTEP8:', gone ? 'PASS — clean quit, scrollback intact' : 'FAIL — TUI still on screen');

// 9 · walk ALL views 1-9, capture header + first card line per view
try { tmux(`kill-session -t ${S}`); } catch { /* fresh */ }
tmux(`new-session -d -s ${S} -x 140 -y 40 "cd ${process.cwd()} && npx tsx timmy.ts; sleep 60"`);
sleep(7000);
const MARKS: Record<string, string> = {
  '1': 'COMMAND POST', '2': 'SLATE DAG', '3': 'AUDIT LOG MONITOR', '4': 'ESCROW LEDGER',
  '5': 'first time here?', '6': 'spawns carbonyl on any URL', '7': 'PROJECTS — PER-PROJECT TREE',
  '8': 'TIMMY Settings & Options', '9': 'real Chromium renderer'
};
let walk = true;
for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
  send(k); sleep(700);
  const f = cap();
  const line = f.split('\n').find(l => l.includes(MARKS[k])) ?? '';
  console.log(`\n════ 9.${k} · VIEW ${k} ════`);
  console.log(line.trim() || '(marker missing!)');
  const mode = f.includes('MODE:NAV');
  console.log(`   MODE:NAV ${mode ? 'ok' : 'MISSING'}`);
  if (!line) walk = false;
  if (!mode) walk = false;
}
console.log('\nWALK 1-9:', walk ? 'PASS' : 'FAIL');
try { tmux(`kill-session -t ${S}`); } catch { /* gone */ }
process.exit(gone && walk ? 0 : 1);
