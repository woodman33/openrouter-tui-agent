import { GraphicsPipeline, type FrameBuffer } from './pipeline.js';
import { WebSocketServer, WebSocket } from 'ws';

export class CompanionPipeline extends GraphicsPipeline {
  readonly type = 'companion';
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number;
  private currentState = 'idle';
  private isStandalone = true;

  constructor(port = 3001) {
    super();
    this.port = port;
  }

  async init(): Promise<void> {
    const globalServer = (global as any).companionServer;
    if (globalServer) {
      this.wss = globalServer.wss;
      this.clients = globalServer.clients;
      this.currentState = globalServer.currentState;
      this.isStandalone = false;
      return;
    }

    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port });
      this.wss.on('connection', (ws: WebSocket) => {
        this.clients.add(ws);
        // Send current state to new client
        ws.send(JSON.stringify({ type: 'state', state: this.currentState }));
        ws.on('close', () => this.clients.delete(ws));
      });
      this.wss.on('listening', () => resolve());
      this.wss.on('error', reject);
    });
  }

  getPort(): number {
    return this.port;
  }

  async setState(state: string): Promise<void> {
    this.currentState = state;
    this.emit('state:change', state);
    const msg = JSON.stringify({ type: 'state', state });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  renderFrame(frame: FrameBuffer): void {
    // Convert frame to base64 and send to clients
    const msg = JSON.stringify({
      type: 'frame',
      data: frame.data.toString('base64'),
      width: frame.width,
      height: frame.height,
      id: frame.id,
    });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.isStandalone) {
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();
      if (this.wss) {
        await new Promise<void>((resolve) => {
          this.wss!.close(() => resolve());
        });
      }
    }
    this.emit('close');
  }
}
