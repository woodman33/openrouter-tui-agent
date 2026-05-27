#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function printHelp() {
  console.log(`Usage: timmy <command>

Commands:
  docs verify     Verify GitBook docs structure, CLI, and safe env setup
  docs preview    Render and serve local docs preview
  docs publish    Verify GitBook auth and prepare Git Sync publication
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args[0] !== 'docs') {
  printHelp();
  process.exit(2);
}

const docsCommand = args[1] || 'verify';
const docsScript = fileURLToPath(new URL('./scripts/timmy-docs.js', import.meta.url));
const child = spawn(process.execPath, [docsScript, docsCommand, ...args.slice(2)], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
