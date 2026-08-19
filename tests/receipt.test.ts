import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { canonicalize, computeReceiptHash, Receipt } from '../src/receipt/schema.js';
import { truncateMiddleOrEnd, splitModelNameAndBlurb, getModelColors } from '../src/tui/utils/text.js';
import { theme } from '../src/tui/theme.js';
import { VERSION } from '../src/version.js';


describe('TIMMY Receipt System', () => {
  describe('Canonicalization & Hashing', () => {
    it('should sort keys recursively in canonicalize', () => {
      const objA = { z: 1, a: { y: 2, b: 3 } };
      const objB = { a: { b: 3, y: 2 }, z: 1 };
      
      expect(canonicalize(objA)).toBe(canonicalize(objB));
      expect(canonicalize(objA)).toContain('"a":{"b":3,"y":2}');
    });

    it('should compute deterministic hashes', () => {
      const receiptA: Omit<Receipt, 'receipt_sha256'> = {
        schema_version: '0.1.0',
        run_id: 'run_test_1',
        type: 'demo',
        task: 'test run',
        created_at: '2026-06-07T00:00:00.000Z',
        cwd: '/test/dir',
        platform: 'darwin',
        node_version: 'v20.0.0',
        package: { name: 'timmy-tui', version: '0.1.0' },
        status: 'completed',
        artifacts: []
      };

      const receiptB: Omit<Receipt, 'receipt_sha256'> = {
        package: { version: '0.1.0', name: 'timmy-tui' },
        status: 'completed',
        artifacts: [],
        created_at: '2026-06-07T00:00:00.000Z',
        cwd: '/test/dir',
        platform: 'darwin',
        node_version: 'v20.0.0',
        schema_version: '0.1.0',
        run_id: 'run_test_1',
        type: 'demo',
        task: 'test run'
      };

      const hashA = computeReceiptHash(receiptA);
      const hashB = computeReceiptHash(receiptB);
      expect(hashA).toBe(hashB);
      expect(hashA).toHaveLength(64); // 64 hex characters (SHA-256)
    });

    it('should result in different hashes for different values', () => {
      const receiptA: Omit<Receipt, 'receipt_sha256'> = {
        schema_version: '0.1.0',
        run_id: 'run_test_1',
        type: 'demo',
        task: 'test run',
        created_at: '2026-06-07T00:00:00.000Z',
        cwd: '/test/dir',
        platform: 'darwin',
        node_version: 'v20.0.0',
        package: { name: 'timmy-tui', version: '0.1.0' },
        status: 'completed',
        artifacts: []
      };

      const receiptB = { ...receiptA, task: 'different task' };
      expect(computeReceiptHash(receiptA)).not.toBe(computeReceiptHash(receiptB));
    });
  });

  describe('CLI Commands Integration', () => {
    const tempTestDir = path.join(process.cwd(), 'tmp_test_outputs');

    beforeAll(() => {
      if (fs.existsSync(tempTestDir)) {
        fs.rmSync(tempTestDir, { recursive: true, force: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(tempTestDir)) {
        fs.rmSync(tempTestDir, { recursive: true, force: true });
      }
    });

    // Direct node --import tsx (no npx resolution) + explicit budget: under
    // full-suite parallel load the old npx spawn exceeded the 5s default and
    // read as a flake; the spawn itself was never the contract under test.
    const tsx = (args: string, timeout = 30000) =>
      execSync(`${process.execPath} --import tsx timmy.ts ${args}`, { encoding: 'utf8', timeout });
    // CLI-spawn integration file: give every test a real budget; hot-machine
    // load must not read as failure (runbook gotcha).
    vi.setConfig({ testTimeout: 60000 });

    it('should print help information with timmy help', () => {
      const output = tsx('help');
      expect(output).toContain('TIMMY AgentOps');
      expect(output).toContain('Usage: timmy <command>');
      expect(output).toContain('demo');
      expect(output).toContain('proof');
    }, 30000);

    it('should print version information with timmy version', () => {
      const output = tsx('version');
      expect(output).toContain('timmy-tui v' + VERSION);
    }, 30000);

    it('should execute demo command and write demo-receipt.json', () => {
      const output = tsx(`demo --out ${tempTestDir}`, 60000);
      expect(output).toContain('TIMMY AgentOps Demo');
      expect(output).toContain('✓ Created');
      expect(output).toContain('✓ Generated receipt hash');

      const receiptPath = path.join(tempTestDir, 'receipts', 'demo-receipt.json');
      expect(fs.existsSync(receiptPath)).toBe(true);

      const receipt: Receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      expect(receipt.schema_version).toBe('0.1.0');
      expect(receipt.type).toBe('demo');
      expect(receipt.status).toBe('completed');
      expect(receipt.receipt_sha256).toHaveLength(64);
    });

    it('should execute proof command and write manifest, receipt, and replay files', () => {
      const taskDescription = 'create a hello world Cloudflare Worker';
      const output = tsx(`proof "${taskDescription}" --out ${tempTestDir}`, 60000);
      expect(output).toContain('TIMMY Proof Run');
      expect(output).toContain('✓ Run created');
      expect(output).toContain('✓ Receipt generated');
      expect(output).toContain('✓ Replay markdown generated');
      expect(output).toContain('✓ Manifest hash sealed');

      // Find the generated run folder
      const runsDir = path.join(tempTestDir, 'runs');
      expect(fs.existsSync(runsDir)).toBe(true);
      const runFolders = fs.readdirSync(runsDir);
      expect(runFolders.length).toBe(1);

      const runFolder = path.join(runsDir, runFolders[0]);
      const manifestPath = path.join(runFolder, 'manifest.json');
      const receiptPath = path.join(runFolder, 'receipt.json');
      const replayPath = path.join(runFolder, 'replay.md');

      expect(fs.existsSync(manifestPath)).toBe(true);
      expect(fs.existsSync(receiptPath)).toBe(true);
      expect(fs.existsSync(replayPath)).toBe(true);

      const receipt: Receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      expect(receipt.schema_version).toBe('0.1.0');
      expect(receipt.type).toBe('proof');
      expect(receipt.task).toBe(taskDescription);
      expect(receipt.status).toBe('completed');
      expect(receipt.artifacts[0].path).toContain('replay.md');

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.run_id).toBe(receipt.run_id);
      expect(manifest.task).toBe(taskDescription);
      expect(manifest.receipt_hash).toBe(receipt.receipt_sha256);

      const replay = fs.readFileSync(replayPath, 'utf8');
      expect(replay).toContain(`# Replay: ${taskDescription}`);
    });

    it('should support --json flag on demo command', () => {
      const output = tsx(`demo --json --out ${tempTestDir}`, 60000);
      const receipt = JSON.parse(output);
      expect(receipt.schema_version).toBe('0.1.0');
      expect(receipt.type).toBe('demo');
    });

    it('should support --json flag on proof command', () => {
      const output = tsx(`proof "json task" --json --out ${tempTestDir}`, 60000);
      const receipt = JSON.parse(output);
      expect(receipt.schema_version).toBe('0.1.0');
      expect(receipt.type).toBe('proof');
      expect(receipt.task).toBe('json task');
    });
  });

  describe('TUI Model Rail Utilities', () => {
    it('should preserve full model name when width allows', () => {
      const name = 'Claude 3.5 Sonnet';
      expect(truncateMiddleOrEnd(name, 30)).toBe(name);
    });

    it('should truncate model names preserving model portion in provider/model format', () => {
      const id = 'google/gemini-3.5-flash-instruct';
      const truncated = truncateMiddleOrEnd(id, 25);
      expect(truncated).toContain('google/');
      expect(truncated.length).toBeLessThanOrEqual(25);
    });

    it('should truncate descriptions at the end', () => {
      const desc = 'high-performance general reasoning and code assistance model';
      const truncated = truncateMiddleOrEnd(desc, 20, true);
      expect(truncated).toBe('high-performance ...');
    });

    it('should split marketing blurbs correctly', () => {
      const rawName = 'Claude Opus 4.8 is Anthropic\'s most powerful model';
      const result = splitModelNameAndBlurb(rawName);
      expect(result.cleanName).toBe('Claude Opus 4.8');
      expect(result.cleanDesc).toBe('Anthropic\'s most powerful model');
    });

    it('should return correct high-contrast colors based on model states', () => {
      // palette law: colors are Tokyo Night tokens from src/tui/theme.ts
      const disabled = getModelColors(false, false, true);
      expect(disabled.nameColor).toBe(theme.textTertiary);

      const selected = getModelColors(true, false, false);
      expect(selected.nameColor).toBe(theme.warning);

      const active = getModelColors(false, true, false);
      expect(active.nameColor).toBe(theme.focus);

      const normal = getModelColors(false, false, false);
      expect(normal.nameColor).toBe(theme.textPrimary);
    });
  });

  describe('Version Consistency', () => {
    it('VERSION constant matches package.json version', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(VERSION).toBe(packageJson.version);
    });
  });
});
