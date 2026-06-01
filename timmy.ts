#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function printHelp() {
  console.log(`Usage: timmy <command>

Commands:
  doctor          Check optional local capabilities without running workloads
  docs verify     Verify GitBook docs structure, CLI, and safe env setup
  docs preview    Render and serve local docs preview
  docs publish    Verify GitBook auth and prepare Git Sync publication
  providers audit List provider readiness without printing secrets
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args[0] !== 'doctor' && args[0] !== 'docs' && args[0] !== 'providers') {
  printHelp();
  process.exit(2);
}

const scriptPath =
  args[0] === 'doctor'
    ? fileURLToPath(new URL('./scripts/timmy-doctor.js', import.meta.url))
    : args[0] === 'docs'
      ? fileURLToPath(new URL('./scripts/timmy-docs.js', import.meta.url))
      : fileURLToPath(new URL('./scripts/timmy-providers.js', import.meta.url));
const command = args[1] || (args[0] === 'docs' ? 'verify' : args[0] === 'providers' ? 'audit' : 'doctor');
const child = spawn(process.execPath, [scriptPath, command, ...args.slice(2)], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
