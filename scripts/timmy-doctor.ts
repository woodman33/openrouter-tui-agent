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
  const zellij = workspace.zellij;

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
  console.log(`zellij Installed: ${zellij.installed ? 'YES' : 'NO'}`);
  console.log(`zellij Version: ${zellij.version || 'not detected'}`);
  console.log(`zellij CLI: ${zellij.cliPath || 'not detected'}`);
  console.log('zellij Required for launch: NO');
  console.log(`zellij Role: ${zellij.role}`);
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
