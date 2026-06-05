#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`Usage: timmy <command>

First run:
1. npm install
2. npm run timmy -- setup
3. npm run timmy -- doctor
4. npm start

Commands:
  setup           Initialize directory and template folder structure
  doctor          Check optional local capabilities without running workloads
  docs verify     Verify GitBook docs structure, CLI, and safe env setup
  docs preview    Render and serve local docs preview
  docs publish    Verify GitBook auth and prepare Git Sync publication
  providers audit List provider readiness without printing secrets
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h') || args[0] === 'help') {
  printHelp();
  process.exit(0);
}

const command = args[0];

if (command === 'start') {
  console.log('timmy start — PLANNED alias for npm start');
  process.exit(0);
}

if (command === 'setup') {
  console.log('Initializing TIMMY workspace folder structure...');
  const workspaceRoot = process.cwd();
  const requiredDirs = ['skills', 'souls', 'context', 'porter-packs', 'receipts', '.timmy', 'auth', 'mcp-cli'];

  try {
    for (const d of requiredDirs) {
      const fullDir = path.join(workspaceRoot, d);
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
    }

    // Default SKILL.md
    const skillDir = path.join(workspaceRoot, 'skills', 'example-skill');
    if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      fs.writeFileSync(skillFile, `# Example Skill\n\n## Description\nThis is an example TIMMY governed capability definition.\n`, 'utf8');
    }

    // Default SOUL.md
    const soulDir = path.join(workspaceRoot, 'souls', 'quartermaster');
    if (!fs.existsSync(soulDir)) fs.mkdirSync(soulDir, { recursive: true });
    const soulFile = path.join(soulDir, 'SOUL.md');
    if (!fs.existsSync(soulFile)) {
      fs.writeFileSync(soulFile, `# Quartermaster Soul\n\n## Description\nThis defines the behavior and personality of the Quartermaster agent.\n`, 'utf8');
    }

    // Default Auth files
    const authDir = path.join(workspaceRoot, 'auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    const authM = path.join(authDir, 'auth.md');
    if (!fs.existsSync(authM)) {
      fs.writeFileSync(authM, `# TIMMY Auth Doctrine\n\n“Humans log in. Agents show passports. Tools require visas. Receipts prove the trip.”\n`, 'utf8');
    }
    const passM = path.join(authDir, 'passports.md');
    if (!fs.existsSync(passM)) {
      fs.writeFileSync(passM, `# Passport Registry\n\n- agent.quartermaster: Nerdy Quartermaster auditor agent passport\n`, 'utf8');
    }
    const visaM = path.join(authDir, 'visas.md');
    if (!fs.existsSync(visaM)) {
      fs.writeFileSync(visaM, `# Visa Policy\n\n- visa.local.read: Granted\n`, 'utf8');
    }
    const scopeM = path.join(authDir, 'scopes.md');
    if (!fs.existsSync(scopeM)) {
      fs.writeFileSync(scopeM, `# AgentPass Scopes\n\n- fs.read.workspace\n`, 'utf8');
    }

    // Receipts
    const receiptDir = path.join(workspaceRoot, 'receipts');
    if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

    console.log('✓ TIMMY Governed Workspace Root folder structure initialized successfully.');
    process.exit(0);
  } catch (e: any) {
    console.error(`✕ Setup failed: ${e.message}`);
    process.exit(1);
  }
}

if (command !== 'doctor' && command !== 'docs' && command !== 'providers') {
  printHelp();
  process.exit(2);
}

// Helper function to resolve script path dynamically for TS and JS environments
function getScriptPath(cmd: string): string {
  const baseName = cmd === 'doctor' ? 'timmy-doctor' : cmd === 'docs' ? 'timmy-docs' : 'timmy-providers';
  const tsPath = fileURLToPath(new URL(`../scripts/${baseName}.ts`, import.meta.url));
  const jsPath = fileURLToPath(new URL(`../scripts/${baseName}.js`, import.meta.url));
  
  if (fs.existsSync(tsPath)) {
    return tsPath;
  }
  return jsPath;
}

const scriptPath = getScriptPath(command);
const isTs = scriptPath.endsWith('.ts');
const spawnCmd = isTs ? 'npx' : process.execPath;
const spawnArgs = isTs 
  ? ['tsx', scriptPath, args[1] || (command === 'docs' ? 'verify' : command === 'providers' ? 'audit' : 'doctor'), ...args.slice(2)]
  : [scriptPath, args[1] || (command === 'docs' ? 'verify' : command === 'providers' ? 'audit' : 'doctor'), ...args.slice(2)];

const child = spawn(spawnCmd, spawnArgs, {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
