// Tap state: per-UID last counter (replay) and per-serial receipt chains.
// KV when bound, an in-memory map otherwise (dev + stateless demo). The
// interface is what the /t route and the chain API depend on.
import { type CustodyReceipt } from './chain.js';

export interface CustodyStore {
  getLastCounter(uid: string): Promise<number | undefined>;
  setLastCounter(uid: string, n: number): Promise<void>;
  getChain(serial: string): Promise<CustodyReceipt[]>;
  putChain(serial: string, chain: CustodyReceipt[]): Promise<void>;
  readonly persistent: boolean;
}

type KV = import('@cloudflare/workers-types').KVNamespace;

export class KvStore implements CustodyStore {
  readonly persistent = true;
  constructor(private kv: KV) {}
  async getLastCounter(uid: string): Promise<number | undefined> {
    const v = await this.kv.get(`ctr:${uid}`);
    return v == null ? undefined : Number(v);
  }
  async setLastCounter(uid: string, n: number): Promise<void> {
    await this.kv.put(`ctr:${uid}`, String(n));
  }
  async getChain(serial: string): Promise<CustodyReceipt[]> {
    const v = await this.kv.get(`chain:${serial}`);
    return v ? (JSON.parse(v) as CustodyReceipt[]) : [];
  }
  async putChain(serial: string, chain: CustodyReceipt[]): Promise<void> {
    await this.kv.put(`chain:${serial}`, JSON.stringify(chain));
  }
}

const memCounters = new Map<string, number>();
const memChains = new Map<string, CustodyReceipt[]>();

export class MemoryStore implements CustodyStore {
  readonly persistent = false;
  async getLastCounter(uid: string): Promise<number | undefined> {
    return memCounters.get(uid);
  }
  async setLastCounter(uid: string, n: number): Promise<void> {
    memCounters.set(uid, n);
  }
  async getChain(serial: string): Promise<CustodyReceipt[]> {
    return [...(memChains.get(serial) ?? [])];
  }
  async putChain(serial: string, chain: CustodyReceipt[]): Promise<void> {
    memChains.set(serial, [...chain]);
  }
  /** test hook */
  static reset(): void {
    memCounters.clear();
    memChains.clear();
  }
}

export function storeFor(kv: KV | undefined): CustodyStore {
  return kv ? new KvStore(kv) : new MemoryStore();
}
