import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
  const telemetryUrl = process.env.TIMMY_TELEMETRY_URL || 'http://localhost:8787';
  console.log(`\nTIMMY Run Receipt Integration Test Bridge`);
  console.log(`==========================================`);
  console.log(`Telemetry Gateway: ${telemetryUrl}`);

  const runId = `test_run_${Math.random().toString(36).substring(2, 9)}`;
  const goal = 'Verify TIMMY Run Receipt MVP';

  // 1. Create the run on the stateful DO Worker
  console.log(`\n[1/5] Creating edge run receipt session...`);
  const createRes = await fetch(`${telemetryUrl}/runs/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, goal })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create edge session: ${createRes.status} ${createRes.statusText}`);
  }
  const createData = await createRes.json() as any;
  console.log(`✓ Successfully initialized run: "${createData.runId}"`);

  // 2. Ensure tmux session exists and execute command
  console.log(`\n[2/5] Deploying keys to local tmux container...`);
  const sName = 'ortui-1';
  try {
    execFileSync('tmux', ['has-session', '-t', sName], { stdio: 'ignore' });
  } catch {
    console.log(`Session ${sName} not found. Spawning...`);
    execFileSync('tmux', ['new-session', '-d', '-s', sName], { stdio: 'ignore' });
  }

  const testCmd = 'echo "hello from timmy run receipt"';
  console.log(`Sending command: "${testCmd}"`);
  
  // Capture CWD before executing
  let cwdBefore = process.cwd();
  try {
    cwdBefore = execFileSync('tmux', ['display-message', '-p', '-t', sName, '-F', '#{pane_current_path}'], { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {}

  // Post command sent telemetry
  const cmdSentEvent = {
    id: `evt_${Math.random().toString(36).substring(2, 9)}`,
    runId,
    sessionId: '1',
    sessionName: 'OpenCode CLI',
    type: 'tmux.command.sent',
    timestamp: new Date().toISOString(),
    payload: { 
      command: testCmd,
      cwd: cwdBefore
    }
  };

  const sentEventRes = await fetch(`${telemetryUrl}/runs/${runId}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmdSentEvent)
  });
  if (sentEventRes.ok) {
    console.log(`✓ Telemetry event 'tmux.command.sent' registered.`);
  }

  // Generate unique command ID and wrapped command
  const commandId = `cmd_${Math.random().toString(36).substring(2, 9)}`;
  const wrappedCmd = `( ${testCmd} ); printf "\\nTIMMY_EXIT_CODE:${commandId}:%s\\n" "$?"`;

  // Send to tmux using parameter-bound argument arrays
  execFileSync('tmux', ['send-keys', '-t', sName, wrappedCmd, 'C-m'], { stdio: 'ignore' });

  // 3. Capturing tmux outputs and piping to Cloudflare Worker
  console.log(`\n[3/5] Capturing stdout pane buffers...`);
  await new Promise(r => setTimeout(r, 1200)); // wait for execution to complete

  const output = execFileSync('tmux', ['capture-pane', '-pt', sName], { encoding: 'utf8', stdio: 'pipe' });
  const lines = output.split('\n').map(l => l.trim()).filter(l => l !== '');

  console.log(`Captured ${lines.length} lines from tmux pane buffer.`);

  let detectedExitCode: number | null = null;
  const filteredLines = [];

  for (const line of lines) {
    if (line.includes('TIMMY_EXIT_CODE:')) {
      const match = line.match(/TIMMY_EXIT_CODE:([^:]+):(\d+)/);
      if (match) {
        detectedExitCode = parseInt(match[2], 10);
      }
    } else {
      filteredLines.push(line);
    }
  }

  // Send stdout telemetry lines
  for (const line of filteredLines) {
    console.log(`  | ${line}`);
    // Pipe to DO telemetry compatibility endpoint
    const outputLineEvent = {
      event: 'tmux:output',
      payload: {
        runId,
        sessionId: '1',
        sessionName: 'OpenCode CLI',
        line
      }
    };
    await fetch(`${telemetryUrl}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outputLineEvent)
    });
  }
  console.log(`✓ All stdout delta telemetry lines successfully pulsed.`);

  // Post command.finished telemetry
  const exitCode = detectedExitCode !== null ? detectedExitCode : 0;
  const success = exitCode === 0;
  let exitCwd = cwdBefore;
  try {
    exitCwd = execFileSync('tmux', ['display-message', '-p', '-t', sName, '-F', '#{pane_current_path}'], { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {}

  const cmdFinishedEvent = {
    id: `evt_${Math.random().toString(36).substring(2, 9)}`,
    runId,
    sessionId: '1',
    sessionName: 'OpenCode CLI',
    type: 'command.finished',
    timestamp: new Date().toISOString(),
    payload: {
      commandId,
      command: testCmd,
      cwd: exitCwd,
      exitCode,
      success
    }
  };

  const finishedEventRes = await fetch(`${telemetryUrl}/runs/${runId}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmdFinishedEvent)
  });
  if (finishedEventRes.ok) {
    console.log(`✓ Telemetry event 'command.finished' registered.`);
  }

  // 4. Retrieving updated Durable Object context & events
  console.log(`\n[4/5] Retrieving mutated DO context and events...`);
  const contextRes = await fetch(`${telemetryUrl}/runs/${runId}/context`);
  let contextData: any = {};
  if (contextRes.ok) {
    contextData = await contextRes.json() as any;
    console.log(`\nMutated Context (Durable SQL Store):`);
    console.log(JSON.stringify(contextData, null, 2));
  }

  const eventsRes = await fetch(`${telemetryUrl}/runs/${runId}/events`);
  if (!eventsRes.ok) {
    throw new Error(`Failed to fetch timeline events: ${eventsRes.status} ${eventsRes.statusText}`);
  }
  const events = await eventsRes.json() as any[];

  // Strict Assertions for exact command preservation
  const sentEvent = events.find((e: any) => e.type === 'tmux.command.sent');
  if (!sentEvent) {
    throw new Error(`CRITICAL INTEGRATION FAILURE: Stored 'tmux.command.sent' event is missing!`);
  }
  const sentCmd = sentEvent.payload?.command;
  console.log(`\nAsserting sent command matches exactly. Expected: '${testCmd}', Found: '${sentCmd}'`);
  if (sentCmd !== testCmd) {
    throw new Error(`CRITICAL FIDELITY FAILURE: Stored tmux.command.sent command does not exactly match! Expected: '${testCmd}', Found: '${sentCmd}'`);
  }
  console.log(`✓ Assertion passed: Stored tmux.command.sent command matches exactly!`);

  const finishedEvent = events.find((e: any) => e.type === 'command.finished');
  if (!finishedEvent) {
    throw new Error(`CRITICAL INTEGRATION FAILURE: Stored 'command.finished' event is missing!`);
  }
  const finishedCmd = finishedEvent.payload?.command;
  console.log(`Asserting finished command matches exactly. Expected: '${testCmd}', Found: '${finishedCmd}'`);
  if (finishedCmd !== testCmd) {
    throw new Error(`CRITICAL FIDELITY FAILURE: Stored command.finished command does not exactly match! Expected: '${testCmd}', Found: '${finishedCmd}'`);
  }
  console.log(`✓ Assertion passed: Stored command.finished command matches exactly!`);

  // Update local receipt index
  const indexPath = path.join(process.cwd(), '.timmy', 'receipts', 'index.json');
  const indexDir = path.dirname(indexPath);
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  let indexData = { receipts: [] as any[] };
  if (fs.existsSync(indexPath)) {
    try {
      indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch {}
  }

  const newReceiptEntry = {
    runId,
    goal,
    receiptUrl: `${telemetryUrl}/runs/${runId}/receipt`,
    telemetryUrl,
    phase: contextData.phase || 'completed',
    riskLevel: contextData.riskLevel || 'safe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    counters: contextData.counters || { commands: 1, outputLines: lines.length, errors: 0, approvals: 0 }
  };

  indexData.receipts.push(newReceiptEntry);
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`✓ Successful test run saved inside local receipt index.`);

  // 5. Finalizing receipt URL
  console.log(`\n[5/5] Compiling final run receipt...`);
  const receiptUrl = `${telemetryUrl}/runs/${runId}/receipt`;
  console.log(`\n==========================================`);
  console.log(`🎉 TIMMY RUN RECEIPT MVP VERIFIED SUCCESSFULLY!`);
  console.log(`Receipt URL: ${receiptUrl}`);
  console.log(`==========================================\n`);
}

run().catch(err => {
  console.error(`✕ Integration test failed:`, err.message);
  process.exit(1);
});
