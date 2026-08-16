import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PassThrough } from 'stream';
import crypto from 'crypto';
import {
  isHermesEventType,
  normalizeGatewayEvent,
  severityFor,
  type HermesApproval,
  type HermesEvent,
} from '../src/hermes/events.js';
import { buildResponseEvent, HermesStore } from '../src/hermes/store.js';
import {
  APPROVE_ANSWER,
  prepareApprove,
  prepareReject,
  prepareTextResponse,
  REJECT_ANSWER,
} from '../src/hermes/approvals.js';
import { HermesEventLog, writeHermesReceipt } from '../src/hermes/receipt-writer.js';
import { HermesClient, resolveHermesConnectionConfig } from '../src/hermes/client.js';
import { canonicalize } from '../src/receipt/schema.js';

const ctx = (overrides: Partial<Parameters<typeof normalizeGatewayEvent>[1]> = {}) => {
  let seq = 0;
  return {
    runId: 'run_test',
    sessionId: 'sess_test',
    nextEventId: () => `hev_${++seq}`,
    now: () => '2026-07-02T00:00:00.000Z',
    ...overrides,
  };
};

describe('normalizeGatewayEvent', () => {
  it('passes canonical event types through with severity', () => {
    const event = normalizeGatewayEvent(
      { type: 'tool.start', sessionId: 'sess_x', payload: { name: 'shell' } },
      ctx(),
    );
    expect(event).toMatchObject({
      type: 'tool.start',
      runId: 'run_test',
      sessionId: 'sess_x',
      severity: 'info',
      payload: { name: 'shell' },
    });
  });

  it('folds reasoning.delta and thinking.delta into message.delta with a channel marker', () => {
    const reasoning = normalizeGatewayEvent(
      { type: 'reasoning.delta', sessionId: '', payload: { text: 'hmm' } },
      ctx(),
    );
    expect(reasoning?.type).toBe('message.delta');
    expect(reasoning?.payload.channel).toBe('reasoning');
    const thinking = normalizeGatewayEvent(
      { type: 'thinking.delta', sessionId: '', payload: {} },
      ctx(),
    );
    expect(thinking?.payload.channel).toBe('thinking');
  });

  it('maps tool.end to tool.complete and error to run.error', () => {
    expect(
      normalizeGatewayEvent({ type: 'tool.end', sessionId: '', payload: {} }, ctx())?.type,
    ).toBe('tool.complete');
    const error = normalizeGatewayEvent(
      { type: 'error', sessionId: '', payload: { message: 'boom' } },
      ctx(),
    );
    expect(error?.type).toBe('run.error');
    expect(error?.severity).toBe('error');
  });

  it('maps session.info to provider.route', () => {
    const event = normalizeGatewayEvent(
      { type: 'session.info', sessionId: '', payload: { model: 'hermes-4', provider: 'nous' } },
      ctx(),
    );
    expect(event?.type).toBe('provider.route');
  });

  it('returns null for non-receipt wire events and unknown types', () => {
    for (const type of ['gateway.ready', 'status.update', 'activity', 'gateway.stderr', 'pet.hatch']) {
      expect(normalizeGatewayEvent({ type, sessionId: '', payload: {} }, ctx())).toBeNull();
    }
  });

  it('marks blocking requests as warnings', () => {
    for (const type of ['approval.request', 'clarify.request', 'sudo.request', 'secret.request']) {
      expect(severityFor(type as HermesEvent['type'])).toBe('warning');
      expect(isHermesEventType(type)).toBe(true);
    }
  });

  it('strips raw answers from gateway-echoed response events', () => {
    const clarify = normalizeGatewayEvent(
      {
        type: 'clarify.response',
        sessionId: 's',
        payload: { request_id: 'req_1', answer: 'the launch code is 1234', status: 'answered' },
      },
      ctx(),
    );
    expect(clarify?.payload).toEqual({ request_id: 'req_1', status: 'answered' });

    const secret = normalizeGatewayEvent(
      {
        type: 'secret.response',
        sessionId: 's',
        payload: { request_id: 'req_2', answer: 'sk-live-supersecret' },
      },
      ctx(),
    );
    expect(secret?.payload.responseSummary).toBe('[SECRET_ANSWER_PROVIDED]');
    expect(JSON.stringify(secret)).not.toContain('sk-live-supersecret');

    const sudo = normalizeGatewayEvent(
      { type: 'sudo.response', sessionId: 's', payload: { request_id: 'req_3', answer: 'hunter2' } },
      ctx(),
    );
    expect(JSON.stringify(sudo)).not.toContain('hunter2');
  });
});

describe('HermesStore', () => {
  it('tracks a run through prompt, tools, approval, and completion', () => {
    const store = new HermesStore({ now: () => '2026-07-02T00:00:00.000Z' });
    store.beginRun('sess_1', 'do the thing');
    expect(store.snapshot().run?.status).toBe('created');

    store.applyGateway({ type: 'tool.start', sessionId: 'sess_1', payload: { id: 'call_1' } });
    store.applyGateway({ type: 'tool.start', sessionId: 'sess_1', payload: { id: 'call_2' } });
    expect(store.snapshot().toolCallCount).toBe(2);

    store.applyGateway({
      type: 'approval.request',
      sessionId: 'sess_1',
      payload: { request_id: 'req_1', command: 'rm -rf ./build' },
    });
    let snap = store.snapshot();
    expect(snap.run?.status).toBe('waiting');
    expect(snap.openApprovals).toHaveLength(1);
    expect(snap.openApprovals[0]).toMatchObject({ id: 'req_1', kind: 'approval', status: 'open' });

    const responseEvent = buildResponseEvent({
      approval: snap.openApprovals[0],
      responseSummary: 'approved',
      status: 'approved',
      eventId: store.nextEventId(),
      timestamp: '2026-07-02T00:00:01.000Z',
    });
    store.apply(responseEvent);
    snap = store.snapshot();
    expect(snap.openApprovals).toHaveLength(0);
    expect(snap.approvals[0].status).toBe('approved');
    expect(snap.run?.status).toBe('running');

    store.applyGateway({ type: 'message.complete', sessionId: 'sess_1', payload: {} });
    expect(store.snapshot().run?.status).toBe('completed');
  });

  it('accumulates assistant stream text but not reasoning channels', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    store.applyGateway({ type: 'message.delta', sessionId: 'sess_1', payload: { text: 'Hello ' } });
    store.applyGateway({ type: 'message.delta', sessionId: 'sess_1', payload: { text: 'world' } });
    store.applyGateway({ type: 'reasoning.delta', sessionId: 'sess_1', payload: { text: 'SECRET-THOUGHTS' } });
    expect(store.snapshot().streamText).toBe('Hello world');
  });

  it('bounds in-memory events while counting all of them', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    for (let i = 0; i < 620; i++) {
      store.applyGateway({ type: 'message.delta', sessionId: 'sess_1', payload: { text: 'x' } });
    }
    const snap = store.snapshot();
    expect(snap.eventCount).toBe(620);
    expect(snap.events.length).toBeLessThanOrEqual(500);
  });

  it('captures model, provider, routes, and usage', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    store.applyGateway({
      type: 'session.info',
      sessionId: 'sess_1',
      payload: { model: 'hermes-4-405b', provider: 'nous' },
    });
    store.applyGateway({
      type: 'message.complete',
      sessionId: 'sess_1',
      payload: { usage: { input_tokens: 10, output_tokens: 20, cost_usd: 0.005 } },
    });
    const snap = store.snapshot();
    expect(snap.model).toBe('hermes-4-405b');
    expect(snap.provider).toBe('nous');
    expect(snap.routes).toHaveLength(1);
    expect(snap.usage).toMatchObject({ inputTokens: 10, outputTokens: 20, costUsd: 0.005 });
  });

  it('sets run failed on run.error and status line from status.update', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    store.applyGateway({ type: 'status.update', sessionId: 'sess_1', payload: { text: 'planning' } });
    expect(store.snapshot().statusLine).toBe('planning');
    store.applyGateway({ type: 'error', sessionId: 'sess_1', payload: { message: 'boom' } });
    expect(store.snapshot().run?.status).toBe('failed');
  });

  it('never resurrects a failed run — not via responses, completion, or tools', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    store.applyGateway({
      type: 'approval.request',
      sessionId: 'sess_1',
      payload: { request_id: 'req_1', command: 'deploy' },
    });
    store.applyGateway({ type: 'error', sessionId: 'sess_1', payload: { message: 'boom' } });
    expect(store.snapshot().run?.status).toBe('failed');

    const responseEvent = buildResponseEvent({
      approval: store.snapshot().openApprovals[0],
      responseSummary: 'rejected',
      status: 'rejected',
      eventId: store.nextEventId(),
    });
    store.apply(responseEvent);
    expect(store.snapshot().run?.status).toBe('failed');

    store.applyGateway({ type: 'tool.start', sessionId: 'sess_1', payload: { id: 'call_9' } });
    expect(store.snapshot().run?.status).toBe('failed');

    store.applyGateway({ type: 'message.complete', sessionId: 'sess_1', payload: {} });
    expect(store.snapshot().run?.status).toBe('failed');
  });

  it('adopts pre-run events into a new run and resets prior aggregates', () => {
    const store = new HermesStore();
    // session.info can arrive while session.create is still in flight.
    store.applyGateway({
      type: 'session.info',
      sessionId: 'sess_1',
      payload: { model: 'hermes-4', provider: 'nous' },
    });
    const run = store.beginRun('sess_1');
    const snap = store.snapshot();
    expect(snap.eventCount).toBe(1);
    expect(snap.events[0].runId).toBe(run.id);
    expect(snap.routes[0].runId).toBe(run.id);
    expect(snap.model).toBe('hermes-4');

    // A second run starts clean.
    store.applyGateway({ type: 'message.delta', sessionId: 'sess_1', payload: { text: 'x' } });
    const run2 = store.beginRun('sess_1');
    const snap2 = store.snapshot();
    expect(snap2.run?.id).toBe(run2.id);
    expect(snap2.eventCount).toBe(0);
    expect(snap2.routes).toHaveLength(0);
    expect(snap2.model).toBe('hermes-4'); // session-level facts survive
  });

  it('ignores bare numeric payload fields on non-usage events', () => {
    const store = new HermesStore();
    store.beginRun('sess_1');
    store.applyGateway({ type: 'tool.complete', sessionId: 'sess_1', payload: { cost: 42 } });
    expect(store.snapshot().usage.costUsd).toBeUndefined();
    store.applyGateway({
      type: 'tool.complete',
      sessionId: 'sess_1',
      payload: { usage: { cost_usd: 0.02 } },
    });
    expect(store.snapshot().usage.costUsd).toBe(0.02);
  });
});

describe('approvals', () => {
  const approval: HermesApproval = {
    id: 'req_9',
    runId: 'run_test',
    kind: 'secret',
    status: 'open',
    title: 'secret request',
    message: 'Enter the deploy token',
    requestedAt: '2026-07-02T00:00:00.000Z',
  };

  it('uses y/n answers for approve and reject', () => {
    expect(prepareApprove(approval)).toMatchObject({ answer: APPROVE_ANSWER, status: 'approved' });
    expect(prepareReject(approval)).toMatchObject({ answer: REJECT_ANSWER, status: 'rejected' });
  });

  it('never records secret or sudo answers', () => {
    const secretValue = 'sk-or-v1-abcdef1234567890abcdef';
    const prepared = prepareTextResponse(approval, secretValue);
    expect(prepared.answer).toBe(secretValue); // transmitted to the gateway
    expect(prepared.responseSummary).toBe('[SECRET_ANSWER_PROVIDED]');
    expect(prepared.responseSummary).not.toContain(secretValue);

    const sudo = prepareTextResponse({ ...approval, kind: 'sudo' }, 'hunter2');
    expect(sudo.responseSummary).toBe('[SUDO_ANSWER_PROVIDED]');
  });

  it('redacts clarify answers before recording them', () => {
    const prepared = prepareTextResponse(
      { ...approval, kind: 'clarify' },
      'use key sk-or-v1-abcdef1234567890abcdef please',
    );
    expect(prepared.responseSummary).not.toContain('sk-or-v1-abcdef1234567890abcdef');
    expect(prepared.responseSummary).toContain('[REDACTED_OPENROUTER_KEY]');
  });
});

describe('HermesEventLog + writeHermesReceipt', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeEvent = (type: HermesEvent['type'], payload: Record<string, unknown> = {}): HermesEvent => ({
    id: `hev_${crypto.randomUUID().slice(0, 8)}`,
    runId: 'run_hermes_1',
    sessionId: 'sess_1',
    type,
    timestamp: '2026-07-02T00:00:00.000Z',
    payload,
    severity: 'info',
  });

  it('writes redacted JSONL lines and flushes buffered deltas on close', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-log-'));
    const log = new HermesEventLog({ baseDir: tmpDir });
    log.append(makeEvent('message.delta', { text: 'chunk one' }));
    log.append(makeEvent('tool.start', { name: 'shell', api_key: 'sk-or-v1-abcdef1234567890abcdef' }));
    log.append(makeEvent('message.delta', { text: 'chunk two' }));
    log.close();

    const lines = fs.readFileSync(log.path, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(3);
    const parsed = lines.map((line) => JSON.parse(line));
    expect(parsed.map((p) => p.type)).toEqual(['message.delta', 'tool.start', 'message.delta']);
    const toolLine = lines[1];
    expect(toolLine).not.toContain('sk-or-v1-abcdef1234567890abcdef');
    expect(log.failedWrites).toBe(0);
  });

  it('counts and reports failed writes instead of losing them silently', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-log-fail-'));
    // Make .timmy a FILE so mkdir/append under it fails.
    fs.writeFileSync(path.join(tmpDir, '.timmy'), 'not a dir', 'utf8');
    const errors: string[] = [];
    const log = new HermesEventLog({ baseDir: tmpDir, onWriteError: (m) => errors.push(m) });
    log.append(makeEvent('tool.start', { name: 'shell' }));
    log.close();
    expect(log.failedWrites).toBeGreaterThan(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('seals a receipt whose hash is reproducible from its own contents', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-receipt-'));
    const store = new HermesStore({ now: () => '2026-07-02T00:00:00.000Z' });
    store.beginRun('sess_1', 'prove it');
    store.applyGateway({ type: 'tool.start', sessionId: 'sess_1', payload: { id: 'call_1' } });
    store.applyGateway({
      type: 'session.info',
      sessionId: 'sess_1',
      payload: { model: 'hermes-4', provider: 'nous' },
    });
    store.applyGateway({ type: 'message.complete', sessionId: 'sess_1', payload: {} });

    const result = writeHermesReceipt({
      snapshot: store.snapshot(),
      eventLogPath: path.join(tmpDir, '.timmy', 'hermes-events.jsonl'),
      baseDir: tmpDir,
      now: () => '2026-07-02T00:00:01.000Z',
    });
    expect(result).not.toBeNull();
    const onDisk = JSON.parse(fs.readFileSync(result!.path, 'utf8'));
    expect(onDisk.schemaVersion).toBe('0.1.0');
    expect(onDisk.eventCount).toBe(3);
    expect(onDisk.toolCallCount).toBe(1);
    expect(onDisk.status).toBe('completed');
    expect(onDisk.eventLogPath).toBe(path.join('.timmy', 'hermes-events.jsonl'));
    expect(onDisk.receiptSha256).toMatch(/^[0-9a-f]{64}$/);

    const { receiptSha256, ...withoutHash } = onDisk;
    const recomputed = crypto.createHash('sha256').update(canonicalize(withoutHash)).digest('hex');
    expect(recomputed).toBe(receiptSha256);
  });

  it('returns null when there is no run to seal', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-receipt-empty-'));
    const store = new HermesStore();
    const result = writeHermesReceipt({
      snapshot: store.snapshot(),
      eventLogPath: 'nowhere.jsonl',
      baseDir: tmpDir,
    });
    expect(result).toBeNull();
  });
});

describe('resolveHermesConnectionConfig', () => {
  it('prefers TIMMY_HERMES_URL, falls back to TIMMY_HERMES_CMD, else stays disconnected', () => {
    expect(resolveHermesConnectionConfig({ TIMMY_HERMES_URL: 'ws://127.0.0.1:9/api/ws' })).toMatchObject({
      mode: 'ws',
      url: 'ws://127.0.0.1:9/api/ws',
    });
    expect(resolveHermesConnectionConfig({ TIMMY_HERMES_CMD: 'hermes gateway --stdio' })).toMatchObject({
      mode: 'spawn',
      command: 'hermes',
      args: ['gateway', '--stdio'],
    });
    expect(resolveHermesConnectionConfig({ TIMMY_HERMES_URL: 'http://nope' }).mode).toBe('none');
    expect(resolveHermesConnectionConfig({}).mode).toBe('none');
  });
});

describe('HermesClient framing (injected streams)', () => {
  function makeClient(options: { onEvent?: (e: any) => void; onStatus?: (s: any) => void } = {}) {
    const input = new PassThrough(); // client -> gateway
    const output = new PassThrough(); // gateway -> client
    const written: string[] = [];
    input.on('data', (chunk) => written.push(chunk.toString()));
    const client = new HermesClient({
      streams: { input, output },
      requestTimeoutMs: 500,
      onEvent: options.onEvent,
      onStatus: options.onStatus,
    });
    client.connect();
    const send = (frame: unknown) => output.write(JSON.stringify(frame) + '\n');
    const lastRequest = () => JSON.parse(written[written.length - 1]);
    return { client, output, send, written, lastRequest };
  }

  const tick = () => new Promise((resolve) => setImmediate(resolve));

  it('reaches ready on gateway.ready and dispatches events', async () => {
    const statuses: string[] = [];
    const events: any[] = [];
    const { send, client } = makeClient({
      onStatus: (s) => statuses.push(s),
      onEvent: (e) => events.push(e),
    });
    send({ jsonrpc: '2.0', method: 'event', params: { type: 'gateway.ready', session_id: '', payload: { skin: 'default' } } });
    send({ jsonrpc: '2.0', method: 'event', params: { type: 'tool.start', session_id: 'sess_1', payload: { name: 'shell' } } });
    await tick();
    expect(client.getStatus()).toBe('ready');
    expect(statuses).toContain('ready');
    expect(events.map((e) => e.type)).toEqual(['gateway.ready', 'tool.start']);
    expect(events[1]).toMatchObject({ sessionId: 'sess_1', payload: { name: 'shell' } });
  });

  it('parses frames split across chunk boundaries', async () => {
    const events: any[] = [];
    const { output } = (() => {
      const input = new PassThrough();
      const output = new PassThrough();
      const client = new HermesClient({ streams: { input, output }, onEvent: (e) => events.push(e) });
      client.connect();
      return { output };
    })();
    const frame = JSON.stringify({
      jsonrpc: '2.0',
      method: 'event',
      params: { type: 'message.delta', session_id: 's', payload: { text: 'hi' } },
    }) + '\n';
    output.write(frame.slice(0, 25));
    await tick();
    expect(events).toHaveLength(0);
    output.write(frame.slice(25));
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('message.delta');
  });

  it('correlates responses to requests by id and surfaces gateway errors', async () => {
    const { client, send, lastRequest } = makeClient();
    send({ jsonrpc: '2.0', method: 'event', params: { type: 'gateway.ready', session_id: '', payload: {} } });
    await tick();

    const pendingOk = client.request('session.list');
    await tick();
    const okReq = lastRequest();
    expect(okReq.method).toBe('session.list');
    send({ jsonrpc: '2.0', id: okReq.id, result: { sessions: [] } });
    await expect(pendingOk).resolves.toEqual({ sessions: [] });

    const pendingErr = client.request('session.create');
    await tick();
    const errReq = lastRequest();
    send({ jsonrpc: '2.0', id: errReq.id, error: { code: -32000, message: 'no runtime' } });
    await expect(pendingErr).rejects.toThrow('no runtime');
  });

  it('sends the documented method and param shapes for session, prompt, and respond', async () => {
    const { client, send, written, lastRequest } = makeClient();
    send({ jsonrpc: '2.0', method: 'event', params: { type: 'gateway.ready', session_id: '', payload: {} } });
    await tick();

    const sessionPromise = client.createSession();
    await tick();
    const createReq = lastRequest();
    expect(createReq.method).toBe('session.create');
    send({ jsonrpc: '2.0', id: createReq.id, result: { session_id: 'sess_abc' } });
    await expect(sessionPromise).resolves.toBe('sess_abc');

    const promptPromise = client.submitPrompt('sess_abc', 'hello');
    await tick();
    expect(lastRequest()).toMatchObject({
      method: 'prompt.submit',
      params: { session_id: 'sess_abc', prompt: 'hello' },
    });
    send({ jsonrpc: '2.0', id: lastRequest().id, result: {} });
    await promptPromise;

    const respondPromise = client.respond('approval', 'req_1', 'y');
    await tick();
    expect(lastRequest()).toMatchObject({
      method: 'approval.respond',
      params: { request_id: 'req_1', answer: 'y' },
    });
    send({ jsonrpc: '2.0', id: lastRequest().id, result: {} });
    await respondPromise;
    expect(written.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects pending requests when closed and ignores junk frames', async () => {
    const { client, output, send } = makeClient();
    send({ jsonrpc: '2.0', method: 'event', params: { type: 'gateway.ready', session_id: '', payload: {} } });
    output.write('this is not json\n');
    output.write('{"jsonrpc":"2.0"}\n'); // valid JSON, meaningless frame
    await tick();
    expect(client.getStatus()).toBe('ready');

    const pending = client.request('session.list');
    client.close();
    await expect(pending).rejects.toThrow('client closed');
    expect(client.getStatus()).toBe('closed');
  });

  it('fails the handshake when gateway.ready never arrives', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = new HermesClient({
      streams: { input, output },
      handshakeTimeoutMs: 30,
    });
    client.connect();
    expect(client.getStatus()).toBe('connecting');
    await new Promise((resolve) => setTimeout(resolve, 90));
    expect(client.getStatus()).toBe('error');
  });
});

describe('HermesClient over a real WebSocket', () => {
  it('completes the handshake and a request round-trip, without newline framing', async () => {
    const { WebSocketServer } = await import('ws');
    const wss = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => wss.once('listening', () => resolve()));
    const port = (wss.address() as { port: number }).port;
    const serverReceived: any[] = [];
    wss.on('connection', (socket) => {
      // Real gateway WS frames are complete messages with NO trailing newline.
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'event',
          params: { type: 'gateway.ready', session_id: '', payload: { skin: 'default' } },
        }),
      );
      socket.on('message', (data) => {
        const frame = JSON.parse(data.toString());
        serverReceived.push(frame);
        socket.send(JSON.stringify({ jsonrpc: '2.0', id: frame.id, result: { session_id: 'sess_ws' } }));
      });
    });

    const client = new HermesClient({
      config: { mode: 'ws', url: `ws://127.0.0.1:${port}`, hint: 'test' },
      requestTimeoutMs: 3000,
      handshakeTimeoutMs: 3000,
    });
    client.connect();
    const deadline = Date.now() + 3000;
    while (client.getStatus() !== 'ready' && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(client.getStatus()).toBe('ready');

    const sessionId = await client.createSession();
    expect(sessionId).toBe('sess_ws');
    expect(serverReceived[0]).toMatchObject({ jsonrpc: '2.0', method: 'session.create' });

    client.close();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });
});

describe('HermesMirror', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('stays cleanly disconnected with no config and reports export attempts honestly', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-mirror-'));
    const { HermesMirror } = await import('../src/hermes/mirror.js');
    const mirror = new HermesMirror({
      config: { mode: 'none', hint: 'Set TIMMY_HERMES_URL or TIMMY_HERMES_CMD' },
      baseDir: tmpDir,
    });
    const notifications: number[] = [];
    const unsubscribe = mirror.subscribe(() => notifications.push(1));

    expect(mirror.getState().status).toBe('disconnected');
    expect(mirror.getState().configMode).toBe('none');

    expect(mirror.exportReceipt()).toBeNull();
    expect(mirror.getState().lastError).toBe('no run to export yet');
    expect(notifications.length).toBeGreaterThan(0);

    await mirror.answer('req_missing', 'some typed answer');
    expect(mirror.getState().lastError).toBe('request is no longer open — answer discarded');

    unsubscribe();
    mirror.destroy();
  });
});
