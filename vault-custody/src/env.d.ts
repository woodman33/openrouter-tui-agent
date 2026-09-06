/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

interface CustodyEnv {
  /** Per-serial receipt chains + per-UID last counters. Optional: without it the tap route runs stateless (replay unchecked). */
  CUSTODY_KV?: KVNamespace;
  /** Keyset overrides as JSON {"<keyset>":{"metaReadKey":hex,"fileReadKey":hex}}. Optional: fixtures use the AN12196 zero keys. */
  CUSTODY_KEYS?: string;
  /** timmy-ai-proxy base URL + edge token: when set, every tap is also posted as an event to the Timmy run store. */
  TIMMY_EDGE_URL?: string;
  TIMMY_EDGE_TOKEN?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<CustodyEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
