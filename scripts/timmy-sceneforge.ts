#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { callSceneForge, sceneForgeUrl, type SceneForgeCall } from '../src/sceneforge/client.js';
import { computeReceiptHash, type Receipt } from '../src/receipt/schema.js';
import { redactTelemetryPayload } from '../src/utils/redact.js';

type ParsedArgs = {
  command: string;
  project: string;
  json: boolean;
  values: string[];
  options: Map<string, string>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] || 'status';
  const values: string[] = [];
  const options = new Map<string, string>();
  let json = false;

  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('--')) {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        options.set(value.slice(2), next);
        index += 1;
      }
      continue;
    }
    values.push(value);
  }

  return {
    command,
    project: options.get('project') || process.env.SCENEFORGE_PROJECT || 'stalker-anomaly',
    json,
    values,
    options,
  };
}

function required(value: string | undefined, message: string): string {
  if (!value?.trim()) throw new Error(message);
  return value.trim();
}

function buildCall(args: ParsedArgs): SceneForgeCall {
  switch (args.command) {
    case 'capabilities':
      return { tool: 'sceneforge_capabilities' };
    case 'status':
      return {
        tool: 'sceneforge_project_status',
        args: { project: args.project },
      };
    case 'ask':
      return {
        tool: 'sceneforge_ask',
        args: {
          project: args.project,
          question: required(args.values.join(' '), 'Usage: timmy sceneforge ask "question"'),
        },
      };
    case 'note':
      return {
        tool: 'sceneforge_note',
        args: {
          project: args.project,
          text: required(args.values.join(' '), 'Usage: timmy sceneforge note "text"'),
          source: 'timmy',
        },
      };
    case 'jobs':
      return {
        tool: 'sceneforge_list_jobs',
        args: {
          project: args.project,
          ...(args.options.get('status') ? { status: args.options.get('status') } : {}),
        },
      };
    case 'propose':
      return {
        tool: 'sceneforge_propose_job',
        args: {
          project: args.project,
          title: required(
            args.options.get('title') || args.values[0],
            'Usage: timmy sceneforge propose --title "title" --description "description"',
          ),
          description: required(
            args.options.get('description'),
            'Usage: timmy sceneforge propose --title "title" --description "description"',
          ),
          source: 'timmy',
          ...(args.options.get('lane') ? { requestedLane: args.options.get('lane') } : {}),
          ...(args.options.get('tool') ? { requestedTool: args.options.get('tool') } : {}),
          ...(args.options.get('manifest') ? { manifestId: args.options.get('manifest') } : {}),
        },
      };
    default: {
      const exhaustive: never = args.command as never;
      throw new Error(`Unknown SceneForge command: ${exhaustive}`);
    }
  }
}

function writeReceipt(
  call: SceneForgeCall,
  project: string,
  result: unknown,
): { receipt: Receipt; runDir: string } {
  const runId = `run_sceneforge_${Date.now()}`;
  const runDir = path.join(process.cwd(), '.timmy', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });

  const evidence = redactTelemetryPayload({
    run_id: runId,
    endpoint: sceneForgeUrl(),
    project,
    tool: call.tool,
    arguments: call.args ?? {},
    result,
    local_houdini_invoked: false,
    recorded_at: new Date().toISOString(),
  });
  const evidencePath = path.join(runDir, 'sceneforge-evidence.json');
  const evidenceText = `${JSON.stringify(evidence, null, 2)}\n`;
  fs.writeFileSync(evidencePath, evidenceText, { encoding: 'utf8', mode: 0o600 });
  const evidenceHash = crypto.createHash('sha256').update(evidenceText).digest('hex');

  const receiptWithoutHash: Omit<Receipt, 'receipt_sha256'> = {
    schema_version: '0.1.0',
    run_id: runId,
    type: 'proof',
    task: `SceneForge ${call.tool} (${project})`,
    created_at: new Date().toISOString(),
    cwd: process.cwd(),
    platform: process.platform,
    node_version: process.version,
    package: { name: 'timmy-tui', version: '0.4.3' },
    status: 'completed',
    plugins_run: ['mcporter', 'sceneforge-cloud'],
    artifacts: [
      {
        path: path.relative(process.cwd(), evidencePath),
        sha256: evidenceHash,
      },
    ],
  };
  const receipt: Receipt = {
    ...receiptWithoutHash,
    receipt_sha256: computeReceiptHash(receiptWithoutHash),
  };
  fs.writeFileSync(path.join(runDir, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return { receipt, runDir };
}

function printHelp(): void {
  console.log(`TIMMY SceneForge

Usage:
  timmy sceneforge status [--project <slug>]
  timmy sceneforge ask "question" [--project <slug>]
  timmy sceneforge note "text" [--project <slug>]
  timmy sceneforge jobs [--status <status>] [--project <slug>]
  timmy sceneforge propose --title "title" --description "description"
  timmy sceneforge capabilities

Environment:
  SCENEFORGE_AGENT_KEY       Required bearer key (never written to receipts)
  SCENEFORGE_MCP_URL         Defaults to the deployed Houdini/SceneForge Worker
  SCENEFORGE_PROJECT         Defaults to stalker-anomaly
  SCENEFORGE_MCPORTER_CONFIG Optional custom MCPorter config
`);
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--help') || rawArgs.includes('-h') || rawArgs[0] === 'help') {
    printHelp();
    return;
  }

  const parsed = parseArgs(rawArgs);
  const call = buildCall(parsed);
  const result = await callSceneForge(call);
  const { receipt, runDir } = writeReceipt(call, parsed.project, result);

  if (parsed.json) {
    console.log(JSON.stringify({ result, receipt, runDir }, null, 2));
    return;
  }
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n✓ TIMMY receipt: ${path.relative(process.cwd(), runDir)}/receipt.json`);
  console.log(`✓ Local Houdini invoked: no`);
}

main().catch((error: unknown) => {
  console.error(`✕ SceneForge failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
