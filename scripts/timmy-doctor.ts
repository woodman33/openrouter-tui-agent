import { getWorkspaceEvidenceStatus } from '../src/utils/workspace-evidence.js';
import { depsDoctor, networkDoctor, hardwareDoctor, printRows } from '../src/utils/doctors.js';
import { runDoctor } from '../src/utils/doctor.js';

function parseArgs(argv: string[]) {
  const command = argv.find((arg) => !arg.startsWith('-')) || 'doctor';
  const json = argv.includes('--json');
  return { command, json };
}

async function printDoctor(json = false): Promise<void> {
  const workspace = getWorkspaceEvidenceStatus();
  const pre = await runDoctor();
  const rmux = workspace.rmux;
  const tmuxSessions = workspace.tmux.sessions;
  const palette = workspace.palette;
  const zellij = workspace.zellij;

  if (json) {
    console.log(JSON.stringify({ ...workspace, preflight: pre }, null, 2));
    return;
  }

  console.log('TIMMY Doctor');
  console.log('');
  console.log(`RMUX Installed: ${rmux.installed ? 'YES' : 'NO'}`);
  console.log(`RMUX Version: ${rmux.version || 'not detected'}`);
  console.log('Required for launch: NO');
  console.log('Role: optional Workspace Evidence Backend');
  console.log('');
  console.log(`tmux Version: ${workspace.tmux.version || 'not detected'}`);
  console.log(`tmux Sessions: ${tmuxSessions.length}`);
  console.log(`tmux-palette Installed: ${palette.installed ? 'YES' : 'NO'}`);
  console.log(`tmux-palette TIMMY Palette: ${palette.timmyPaletteInstalled ? 'YES' : 'NO'}`);
  console.log(`tmux-palette Bindings: ${palette.bindingHint}`);
  console.log('');
  console.log(`zellij Installed: ${zellij.installed ? 'YES' : 'NO'}`);
  console.log(`zellij Version: ${zellij.version || 'not detected'}`);
  console.log(`zellij CLI: ${zellij.cliPath || 'not detected'}`);
  console.log('zellij Required for launch: NO');
  console.log(`zellij Role: ${zellij.role}`);
  console.log('');
  console.log('Preflight (v1.0.0-rc1):');
  for (const c of pre.checks) {
    console.log(`  ${c.state === 'ok' ? '✓' : c.state === 'warn' ? '!' : '✗'} ${c.name}${c.required ? ' (required)' : ''}${c.note ? ' — ' + c.note : ''}`);
  }
  console.log(pre.ok ? 'Preflight READY — lanes may arm' : 'Preflight BLOCKED — required checks missing');
  console.log('');
  console.log('Ready for demo: YES');
  console.log('Next step: npm start');
}

const { command, json } = parseArgs(process.argv.slice(2));

if (command === 'deps') {
  const rows = depsDoctor();
  if (json) console.log(JSON.stringify(rows, null, 2));
  else printRows('dependency posture', rows);
  process.exit(0);
}

if (command === 'network') {
  const rows = await networkDoctor();
  if (json) console.log(JSON.stringify(rows, null, 2));
  else printRows('network layers (dns → tcp → tls → http)', rows);
  process.exit(0);
}

if (command === 'hardware') {
  const rows = hardwareDoctor();
  if (json) console.log(JSON.stringify(rows, null, 2));
  else printRows('compute inventory', rows);
  process.exit(0);
}

if (command === 'preflight') {
  const rep = await runDoctor();
  if (json) console.log(JSON.stringify(rep, null, 2));
  else {
    console.log('TIMMY Doctor · preflight');
    for (const c of rep.checks) {
      console.log(`${c.state === 'ok' ? '✓' : c.state === 'warn' ? '!' : '✗'} ${c.name}${c.required ? ' (required)' : ''}${c.note ? ' — ' + c.note : ''}`);
    }
    console.log(rep.ok ? 'preflight: READY' : 'preflight: BLOCKED');
  }
  process.exit(rep.ok ? 0 : 1);
}

if (command !== 'doctor') {
  console.error('Usage: timmy doctor [deps|network|hardware|preflight] [--json]');
  process.exit(2);
}

await printDoctor(json);
