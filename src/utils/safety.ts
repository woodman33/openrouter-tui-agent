/**
 * TIMMY Command Safety Classifier Shield
 * Evaluates command lines against security heuristics and assigns risk levels.
 */

export interface CommandSafetyResult {
  riskLevel: 'safe' | 'medium' | 'dangerous';
  approvalRequired: boolean;
  reason?: string;
}

export function classifyCommand(command: string): CommandSafetyResult {
  const trimmed = command.trim();
  if (!trimmed) {
    return { riskLevel: 'safe', approvalRequired: false };
  }

  const lowercase = trimmed.toLowerCase();

  // 1. Extreme Danger Commands
  const dangerousPatterns = [
    { pattern: 'rm -rf /', reason: 'Destructive recursive root deletion attempt blocked.' },
    { pattern: 'sudo rm', reason: 'Destructive root administrative deletion attempt blocked.' },
    { pattern: 'disk erase', reason: 'Hardware disk partition erasure attempt blocked.' },
    { pattern: 'mkfs', reason: 'Partition file system formatting attempt blocked.' },
    { pattern: 'dd if=', reason: 'Low-level disk block write operation blocked.' },
    { pattern: 'curl', matches: [/\bcurl\b.*\b\|\s*(?:bash|sh|zsh)\b/i], reason: 'Arbitrary remote shell script execution piped through curl blocked.' },
    { pattern: 'wget', matches: [/\bwget\b.*\b\|\s*(?:bash|sh|zsh)\b/i], reason: 'Arbitrary remote shell script execution piped through wget blocked.' },
  ];

  for (const item of dangerousPatterns) {
    if (item.matches) {
      if (item.matches.some(regex => regex.test(trimmed))) {
        return { riskLevel: 'dangerous', approvalRequired: true, reason: item.reason };
      }
    } else if (lowercase.includes(item.pattern)) {
      return { riskLevel: 'dangerous', approvalRequired: true, reason: item.reason };
    }
  }

  // 2. Production wrangler deployment commands (require approval unless explicitly flagged or bypassed)
  if (lowercase.includes('wrangler deploy') || lowercase.includes('wrangler publish')) {
    return {
      riskLevel: 'dangerous',
      approvalRequired: true,
      reason: 'Production Cloudflare deployment operations require explicit operator approval.'
    };
  }

  // 3. Medium risk commands (destructive or sensitive, but not outright blocked)
  const mediumPatterns = [
    'rm ',
    'kill ',
    'killall',
    'pkill',
    'docker stop',
    'docker rm',
    'git reset --hard',
    'git clean',
    'npm publish',
    'cargo publish',
    'pip install',
    'npm install',
    'yarn add',
    'pnpm add',
    'sudo '
  ];

  if (mediumPatterns.some(pattern => lowercase.includes(pattern))) {
    return {
      riskLevel: 'medium',
      approvalRequired: false,
      reason: 'State-mutating system command executed.'
    };
  }

  // 4. Safe commands
  return {
    riskLevel: 'safe',
    approvalRequired: false
  };
}
