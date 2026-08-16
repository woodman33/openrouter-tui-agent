import crypto from 'crypto';
import { readChain } from './receipts.js';

// Derived OpenTelemetry export of the receipt spine. The receipts stay the
// store; OTLP is a read-only projection for otel-tui / Langfuse / Jaeger.
// traceId = first 32 hex of the receipt hash (stable, content-addressed);
// spanId = 16 hex derived from the receipt id.

const hex16 = (s: string): string => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

export function receiptsToOtlp(streams: string[] = ['gens', 'harness', 'context', 'doctor'], dir?: string): unknown {
  const resourceSpans = streams
    .map(stream => {
      const chain = readChain(stream, dir);
      if (chain.length === 0) return null;
      return {
        resource: { attributes: [{ key: 'service.name', value: { stringValue: `timmy-${stream}` } }] },
        scopeSpans: [{
          scope: { name: 'timmy.receipts', version: '1' },
          spans: chain.map(r => {
            const start = BigInt(Date.parse(r.ts)) * 1000000n;
            return {
              traceId: r.hash.replace('sha256_', '').slice(0, 32),
              spanId: hex16(r.id),
              name: `${stream}/${r.kind}`,
              kind: 1,
              startTimeUnixNano: start.toString(),
              endTimeUnixNano: start.toString(),
              attributes: [
                { key: 'gen_ai.operation.name', value: { stringValue: r.kind } },
                { key: 'timmy.subject', value: { stringValue: r.subject } },
                { key: 'timmy.policy', value: { stringValue: r.policy } },
                { key: 'timmy.receipt.hash', value: { stringValue: r.hash } },
                { key: 'timmy.receipt.prev_hash', value: { stringValue: r.prev_hash } },
                ...(r.cost_usd !== undefined ? [{ key: 'timmy.cost_usd', value: { doubleValue: r.cost_usd } }] : [])
              ],
              events: (r.spans || []).map(s => ({
                name: s.kind,
                timeUnixNano: start.toString(),
                attributes: [{ key: 'span.name', value: { stringValue: s.name } }]
              }))
            };
          })
        }]
      };
    })
    .filter(Boolean);
  return { resourceSpans };
}
