import { getWorkspaceEvidenceStatus } from '../src/utils/workspace-evidence.js';

function parseArgs(argv: string[]) {
  const command = argv.find((arg) => !arg.startsWith('-')) || 'doctor';
  const json = argv.includes('--json');
  return { command, json };
}

function printDoctor(json = false): void {
  const workspace = getWorkspaceEvidenceStatus();
  const rmux = workspace.rmux;
  const tmuxSessions = workspace.tmux.sessions;
  const palette = workspace.palette;
  const cmux = workspace.cmux;

  if (json) {
    console.log(JSON.stringify(workspace, null, 2));
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
  console.log(`cmux Installed: ${cmux.installed ? 'YES' : 'NO'}`);
  console.log(`cmux Connected: ${cmux.connected ? 'YES' : 'NO'} (${cmux.connection})`);
  console.log(`cmux Version: ${cmux.version || 'not detected'}`);
  console.log(`cmux CLI: ${cmux.cliPath || 'not detected'}`);
  console.log(`cmux App: ${cmux.appPath || 'not detected'}`);
  console.log('cmux Required for launch: NO');
  console.log(`cmux Role: ${cmux.role}`);
  console.log('');
  console.log('Ready for demo: YES');
  console.log('Next step: npm start');
}

const { command, json } = parseArgs(process.argv.slice(2));

if (command !== 'doctor') {
  console.error('Usage: timmy doctor [--json]');
  process.exit(2);
}

printDoctor(json);
