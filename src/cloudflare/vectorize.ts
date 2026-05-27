/**
 * Cloudflare Vectorize Stub Adapter
 */

export class VectorizeStub {
  async insert(vectors: any[]) {
    return { count: vectors.length };
  }
  async query(vector: number[], options?: any) {
    return { matches: [] };
  }
}
