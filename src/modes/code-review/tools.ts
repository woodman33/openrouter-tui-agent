import { tool } from '@openrouter/sdk/lib/tool.js';
import { z } from 'zod/v4';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const diffTool = tool({
  name: 'get_git_diff',
  description: 'Get the current git diff',
  inputSchema: z.object({
    staged: z.boolean().optional().describe('Show only staged changes'),
  }),
  outputSchema: z.object({
    diff: z.string(),
  }),
  execute: async ({ staged = false }: { staged?: boolean }) => {
    try {
      const cmd = staged ? 'git diff --cached' : 'git diff';
      const diff = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return { diff: diff || 'No changes detected' };
    } catch (e: any) {
      return { diff: `Error: ${e.message}` };
    }
  },
} as any);

export const lintTool = tool({
  name: 'run_linter',
  description: 'Run a linting command',
  inputSchema: z.object({
    command: z.string().describe('Lint command to run (e.g., "eslint .", "tsc --noEmit")'),
  }),
  outputSchema: z.object({
    output: z.string(),
    exitCode: z.number(),
  }),
  execute: async ({ command }: { command: string }) => {
    try {
      const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return { output, exitCode: 0 };
    } catch (e: any) {
      return { output: e.stdout || e.stderr || e.message, exitCode: e.status || 1 };
    }
  },
} as any);

export const readFileTool = tool({
  name: 'file_read',
  description: 'Read the contents of a file',
  inputSchema: z.object({
    path: z.string().describe('Absolute or relative path to the file'),
  }),
  outputSchema: z.object({
    content: z.string(),
  }),
  execute: async ({ path }: { path: string }) => {
    try {
      const content = readFileSync(path, 'utf-8');
      return { content };
    } catch (e: any) {
      return { content: `Error reading file: ${e.message}` };
    }
  },
} as any);

export const writeFileTool = tool({
  name: 'file_write',
  description: 'Write or overwrite a file with new content',
  inputSchema: z.object({
    path: z.string().describe('Absolute or relative path to the file'),
    content: z.string().describe('The content to write to the file'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ path, content }: { path: string; content: string }) => {
    try {
      writeFileSync(path, content, 'utf-8');
      return { success: true, message: `Successfully wrote file to ${path}` };
    } catch (e: any) {
      return { success: false, message: `Error writing file: ${e.message}` };
    }
  },
} as any);

export const editFileTool = tool({
  name: 'file_edit',
  description: 'Search and replace a specific block of text in a file',
  inputSchema: z.object({
    path: z.string().describe('Path to the file'),
    targetContent: z.string().describe('Exact block of text to replace'),
    replacementContent: z.string().describe('New content to replace the target content with'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ path, targetContent, replacementContent }: { path: string; targetContent: string; replacementContent: string }) => {
    try {
      const fileContent = readFileSync(path, 'utf-8');
      if (!fileContent.includes(targetContent)) {
        return { success: false, message: 'Target content not found in file' };
      }
      const updated = fileContent.replace(targetContent, replacementContent);
      writeFileSync(path, updated, 'utf-8');
      return { success: true, message: `Successfully updated ${path}` };
    } catch (e: any) {
      return { success: false, message: `Error editing file: ${e.message}` };
    }
  },
} as any);

function grepDirectory(dir: string, pattern: string, results: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file.startsWith('.') || file === 'dist') continue;
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        grepDirectory(fullPath, pattern, results);
      } else if (stat.isFile()) {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes(pattern)) {
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (line.includes(pattern)) {
              results.push(`${fullPath}:${i + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  } catch {}
  return results;
}

export const grepTool = tool({
  name: 'grep',
  description: 'Search for exact pattern matches within files in the repository',
  inputSchema: z.object({
    pattern: z.string().describe('Text pattern to search for'),
    dir: z.string().optional().describe('Directory to search in (defaults to current directory)'),
  }),
  outputSchema: z.object({
    matches: z.array(z.string()),
  }),
  execute: async ({ pattern, dir = '.' }: { pattern: string; dir?: string }) => {
    const matches = grepDirectory(dir, pattern).slice(0, 50);
    return { matches };
  },
} as any);

function globDirectory(dir: string, pattern: string, results: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    const cleanPattern = pattern.replace(/\*/g, '').replace(/\?/g, '');
    for (const file of files) {
      if (file === 'node_modules' || file.startsWith('.') || file === 'dist') continue;
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        globDirectory(fullPath, pattern, results);
      } else if (stat.isFile()) {
        if (file.includes(cleanPattern) || fullPath.includes(cleanPattern)) {
          results.push(fullPath);
        }
      }
    }
  } catch {}
  return results;
}

export const globTool = tool({
  name: 'glob',
  description: 'Search for files matching a pattern or extension',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern (e.g., "*.ts", "src/**/*.tsx")'),
  }),
  outputSchema: z.object({
    files: z.array(z.string()),
  }),
  execute: async ({ pattern }: { pattern: string }) => {
    const files = globDirectory('.', pattern).slice(0, 50);
    return { files };
  },
} as any);

export const shellTool = tool({
  name: 'shell',
  description: 'Execute a shell command securely and return its output',
  inputSchema: z.object({
    command: z.string().describe('Command to run in the shell'),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
  }),
  execute: async ({ command }: { command: string }) => {
    try {
      const output = execSync(command, { encoding: 'utf-8', timeout: 15000, maxBuffer: 10 * 1024 * 1024 });
      return { stdout: output, stderr: '', exitCode: 0 };
    } catch (e: any) {
      return {
        stdout: e.stdout || '',
        stderr: e.stderr || e.message,
        exitCode: e.status || 1,
      };
    }
  },
} as any);
