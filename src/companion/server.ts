import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import fs from 'fs';
import { computeReceiptHash, Receipt } from '../receipt/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CompanionServer {
  app: express.Application;
  httpServer: ReturnType<typeof createServer>;
  wss: WebSocketServer;
  clients: Set<import('ws').WebSocket>;
  port: number;
  currentState: string;
  shutdown: () => Promise<void>;
  setState: (state: string) => void;
  sendFrame: (frame: { data: string; width: number; height: number; id: number }) => void;
  sendUpdate: (type: string, data: any) => void;
}

export async function startCompanionServer(port = 3001): Promise<CompanionServer> {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') return;
    logger.error('WebSocket server error:', err);
  });
  const clients = new Set<import('ws').WebSocket>();
  let currentState = 'idle';

  // Serve static client files
  const clientDir = path.join(__dirname, 'client');
  app.use(express.static(clientDir));

  // Serve Clerk publishable key dynamically
  app.get('/api/clerk-config', (_req, res) => {
    res.json({
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
    });
  });

  app.get('/api/cloudflare-workflows', async (req, res) => {
    const endpoint = process.env.TIMMY_TELEMETRY_URL || 'http://127.0.0.1:8787';
    const runId = typeof req.query.runId === 'string' && req.query.runId.trim()
      ? req.query.runId.trim()
      : 'default-local-run';

    try {
      const workflowRes = await fetch(`${endpoint.replace(/\/$/, '')}/workflows?runId=${encodeURIComponent(runId)}`);
      const body = await workflowRes.text();
      res
        .status(workflowRes.status)
        .type(workflowRes.headers.get('content-type') || 'application/json')
        .send(body);
    } catch (err: any) {
      res.status(503).json({
        success: false,
        runId,
        endpoint,
        error: err?.message || 'Cloudflare workflow endpoint unavailable'
      });
    }
  });

  app.post('/api/workflow/fusion', express.json(), async (req, res) => {
    try {
      const { models = [], plugins = [], riveStateHash = "", prompt = "" } = req.body;

      const runId = `run_fusion_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = Date.now();
      const createdAt = new Date(timestamp).toISOString();

      const modelsUsed = models.map((m: any, i: number) => {
        if (typeof m === 'string') {
          return { id: m, weight: i === 0 ? 0.6 : 0.2, tokens: 250 };
        }
        return {
          id: m.id || "unknown",
          weight: typeof m.weight === 'number' ? m.weight : 0.5,
          tokens: typeof m.tokens === 'number' ? m.tokens : 250
        };
      });

      const pluginsRun = plugins.map((p: any) => {
        if (typeof p === 'string') {
          if (p.includes('@')) return p;
          return `${p}@1.0.0`;
        }
        return `${p.name || "unknown"}@${p.version || "1.0.0"}`;
      });

      const replayPath = `.timmy/receipts/fusion_run_${timestamp}/replay.md`;
      const replayContent = `# Fusion Run Replay\n\nTask: ${prompt}\nModels: ${modelsUsed.map((m: any) => m.id).join(', ')}`;
      const replayHash = crypto.createHash('sha256').update(replayContent).digest('hex');

      const receiptWithoutHash: Omit<Receipt, 'receipt_sha256'> = {
        schema_version: "0.3",
        run_id: runId,
        type: "fusion",
        task: prompt,
        created_at: createdAt,
        cwd: process.cwd(),
        platform: process.platform,
        node_version: process.version,
        package: {
          name: "timmy-tui",
          version: "0.4.0"
        },
        status: "completed",
        models_used: modelsUsed,
        plugins_run: pluginsRun,
        rive_state_hash: riveStateHash || crypto.createHash('sha256').update("timmy_fusion_state").digest('hex'),
        consensus: {
          model: modelsUsed[0]?.id || "gemini-2.5-pro",
          tokens: 1800,
          latency_ms: 450
        },
        artifacts: [
          { path: replayPath, sha256: replayHash }
        ]
      };

      const finalHash = computeReceiptHash(receiptWithoutHash);
      const receipt: Receipt = {
        ...receiptWithoutHash,
        receipt_sha256: finalHash
      };

      // Write mock replay and receipt to local file system
      const receiptsDir = path.join(process.cwd(), '.timmy', 'receipts', `fusion_run_${timestamp}`);
      fs.mkdirSync(receiptsDir, { recursive: true });
      fs.writeFileSync(path.join(receiptsDir, 'replay.md'), replayContent, 'utf8');
      fs.writeFileSync(path.join(receiptsDir, 'receipt.json'), JSON.stringify(receipt, null, 2), 'utf8');

      res.json({
        success: true,
        receipt
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve the built client (if using vite)
  app.get('/', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info(`Companion client connected (total: ${clients.size})`);
    ws.send(JSON.stringify({ type: 'state', state: currentState }));
    ws.on('close', () => {
      clients.delete(ws);
      logger.info(`Companion client disconnected (total: ${clients.size})`);
    });
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const globalServer = (global as any).companionServer;

        if (msg.type === 'hello') {
          ws.send(JSON.stringify({ type: 'welcome', state: currentState }));
          
          // Send integration status
          const daytonaKey = process.env.DAYTONA_API_KEY;
          const isDaytonaActive = !!(daytonaKey && !daytonaKey.includes('your') && !daytonaKey.includes('paste_your'));

          const triggerKey = process.env.TRIGGER_SECRET_KEY;
          const isTriggerActive = !!(triggerKey && !triggerKey.includes('your') && !triggerKey.includes('paste_your'));

          const composioKey = process.env.COMPOSIO_API_KEY;
          const isComposioActive = !!(composioKey && !composioKey.includes('your') && !composioKey.includes('paste_your'));

          const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
          const isCloudflareActive = !!(cfAccount && cfAccount.trim() !== '');

          ws.send(JSON.stringify({
            type: 'integrations',
            data: {
              daytona: isDaytonaActive,
              trigger: isTriggerActive,
              composio: isComposioActive,
              cloudflare: isCloudflareActive
            }
          }));
          
          // Send initial full TUI sync upon websocket connection
          if (globalServer && globalServer.lastHistory) {
            ws.send(JSON.stringify({ type: 'sync', history: globalServer.lastHistory }));
          }
          if (globalServer && globalServer.lastTmux) {
            ws.send(JSON.stringify({ type: 'tmux', data: globalServer.lastTmux }));
          }
        } else if (msg.type === 'addTmuxSession') {
          if (globalServer && globalServer.agent) {
            globalServer.agent.addTmuxSession(msg.name || 'AgentPane', msg.model || 'claude-opus-4.7');
          }
        } else if (msg.type === 'killTmuxSession') {
          if (globalServer && globalServer.agent) {
            globalServer.agent.removeTmuxSession(msg.id);
          }
        } else if (msg.type === 'switchPaneAgent') {
          if (globalServer && globalServer.agent) {
            globalServer.agent.switchPaneAgent(msg.id, msg.agentKey);
          }
        }
      } catch { }
    });
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => {
      cleanup();
      wss.close();
      reject(err);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      httpServer.removeListener('error', onError);
      httpServer.removeListener('listening', onListening);
    };

    httpServer.once('error', onError);
    httpServer.listen(port, onListening);
  });

  return {
    app, httpServer, wss, clients, port, currentState,
    shutdown: async () => {
      for (const c of clients) c.close();
      clients.clear();
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    },
    setState: (state: string) => {
      currentState = state;
      const msg = JSON.stringify({ type: 'state', state });
      for (const c of clients) {
        if (c.readyState === 1) c.send(msg);
      }
    },
    sendFrame: (frame) => {
      const msg = JSON.stringify({ type: 'frame', ...frame });
      for (const c of clients) {
        if (c.readyState === 1) c.send(msg);
      }
    },
    sendUpdate: (type: string, data: any) => {
      const msg = JSON.stringify({ type, data });
      for (const c of clients) {
        if (c.readyState === 1) c.send(msg);
      }
    },
  };
}
