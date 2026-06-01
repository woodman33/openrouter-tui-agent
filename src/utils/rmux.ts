import { spawnSync } from 'node:child_process';

export interface RmuxCapabilityStatus {
  installed: boolean;
  version: string | null;
  required: false;
  role: 'optional Workspace Evidence Backend';
  versionCheck: 'rmux --version' | 'rmux -V fallback' | 'not-run' | 'unavailable';
}

function cleanVersionOutput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim().length > 0);
  return firstLine ? firstLine.trim() : null;
}

export function detectRmux(): RmuxCapabilityStatus {
  const commandCheck = spawnSync('sh', ['-lc', 'command -v rmux'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 800,
  });

  if (commandCheck.status !== 0 || !commandCheck.stdout.trim()) {
    return {
      installed: false,
      version: null,
      required: false,
      role: 'optional Workspace Evidence Backend',
      versionCheck: 'not-run',
    };
  }

  const longVersion = spawnSync('rmux', ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 800,
  });

  if (longVersion.status === 0) {
    return {
      installed: true,
      version: cleanVersionOutput(longVersion.stdout || longVersion.stderr),
      required: false,
      role: 'optional Workspace Evidence Backend',
      versionCheck: 'rmux --version',
    };
  }

  const shortVersion = spawnSync('rmux', ['-V'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 800,
  });

  return {
    installed: true,
    version: shortVersion.status === 0 ? cleanVersionOutput(shortVersion.stdout || shortVersion.stderr) : null,
    required: false,
    role: 'optional Workspace Evidence Backend',
    versionCheck: shortVersion.status === 0 ? 'rmux -V fallback' : 'unavailable',
  };
}
