import crypto from 'crypto';

export interface ReceiptArtifact {
  path: string;
  sha256: string;
}

export interface Receipt {
  schema_version: string;
  run_id: string;
  type: 'demo' | 'proof';
  task: string;
  created_at: string;
  cwd: string;
  platform: string;
  node_version: string;
  package: {
    name: string;
    version: string;
  };
  status: 'completed' | 'running' | 'failed';
  artifacts: ReceiptArtifact[];
  receipt_sha256: string;
}

/**
 * Deterministically serializes an object by recursively sorting keys.
 */
export function canonicalize(obj: any): string {
  if (obj === null) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalize(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalize(obj[key]);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes a deterministic SHA-256 hash of a receipt object (excluding receipt_sha256).
 */
export function computeReceiptHash(receipt: Omit<Receipt, 'receipt_sha256'>): string {
  const serialized = canonicalize(receipt);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
