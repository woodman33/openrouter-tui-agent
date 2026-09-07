// warroom-t3b1: the commander is the durable Cloudflare agent (Claude Code's
// MIND+SHIP order). We CONNECT to its WebSocket and render its events — the
// loop is never reimplemented here.
export interface CommanderEvent { kind?: string; model?: string; spend?: number; text?: string; ts?: string }

export class CommanderClient {
  private ws: WebSocket | null = null;
  constructor(private url: string | null, private onEvent: (e: CommanderEvent) => void) {}
  connect(): void {
    if (!this.url) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = m => {
        try { this.onEvent(JSON.parse(String(m.data)) as CommanderEvent); } catch { /* ignore non-json */ }
      };
      this.ws.onclose = () => { this.ws = null; };
      this.ws.onerror = () => { this.ws = null; };
    } catch { this.ws = null; }
  }
  get online(): boolean { return this.ws?.readyState === 1; }
  send(x: unknown): void { if (this.online) this.ws?.send(JSON.stringify(x)); }
  close(): void { try { this.ws?.close(); } catch { /* already closed */ } }
}
