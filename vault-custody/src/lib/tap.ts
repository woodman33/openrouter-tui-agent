// The tap: verify the SUN message, check replay, seal a custody.tap receipt,
// decide where the phone goes next. Pure function over (query, deps) so it is
// testable without Astro or Workers.
import { appendCustodyReceipt } from './chain.js';
import { keysFor, defaultKeys, tagFor, unitFor, type TagRecord } from './registry.js';
import { type CustodyStore } from './store.js';
import { type SunOk } from './sun.js';
import { verifyTap } from './url.js';

export interface TapDeps {
  store: CustodyStore;
  keyOverrides?: string;
  now?: () => string;
}

export type TapOutcome =
  | {
      ok: true;
      serial: string;
      uid: string;
      counter: number;
      tag: TagRecord;
      sun: SunOk;
      receiptHash: string;
      receiptId: string;
      replayChecked: boolean;
      redirect: string;
    }
  | {
      ok: false;
      reason: 'bad_cmac' | 'bad_hex' | 'bad_length' | 'bad_tag' | 'missing_param' | 'unregistered' | 'replay';
      detail?: string;
      uid?: string;
      counter?: number;
      redirect: string;
    };

export async function handleTap(search: URLSearchParams, deps: TapDeps): Promise<TapOutcome> {
  // 1. Which tag is this? For the encrypted mirror we cannot know the UID until
  //    the PICC data is decrypted, so every registered keyset shares one meta
  //    read key per batch in this pilot; we try the default keys first, then
  //    the tag's own keyset once the UID is known.
  let r = await verifyTap(search, defaultKeys(deps.keyOverrides));
  let tag: TagRecord | undefined;
  if (r.ok) {
    tag = tagFor(r.uid);
    if (tag && tag.keyset !== 'demo') {
      r = await verifyTap(search, keysFor(tag, deps.keyOverrides));
    }
  }
  if (!r.ok) {
    return { ok: false, reason: r.reason, detail: r.detail, redirect: refusal(r.reason, r.detail) };
  }
  if (!tag) {
    return { ok: false, reason: 'unregistered', uid: r.uid, counter: r.readCounter, redirect: refusal('unregistered', `uid ${r.uid} is not in any batch`) };
  }

  // 2. Replay: the counter must move forward. The tag increments it on every
  //    read, so an old URL (a screenshot, a copy) fails here.
  //    Demo tags (the published AN12196 vectors on the deck and the QR) are
  //    fixed URLs by nature, so they record the tap but are never refused as
  //    replay; the receipt says so. Production tags never carry `demo`.
  const last = (await deps.store.getLastCounter(r.uid)) ?? tag.lastCounter;
  const replayed = r.readCounter <= last;
  if (replayed && !tag.demo) {
    return { ok: false, reason: 'replay', uid: r.uid, counter: r.readCounter, redirect: refusal('replay', `counter ${r.readCounter} already seen (last ${last})`) };
  }
  if (!replayed) await deps.store.setLastCounter(r.uid, r.readCounter);

  // 3. Seal the tap into the unit's chain.
  const chain = await deps.store.getChain(tag.serial);
  const rec = await appendCustodyReceipt(chain, {
    kind: 'custody.tap',
    subject: tag.serial,
    ts: deps.now?.() ?? new Date().toISOString(),
    data: {
      uid: r.uid,
      counter: r.readCounter,
      role: tag.role,
      mode: r.mode,
      sig: 'valid',
      tt: r.tagTamper?.raw ?? null,
      loop: r.tagTamper ? (r.tagTamper.permanent === 'open' ? 'broken' : 'intact') : 'unreported',
      replay_checked: deps.store.persistent,
      replay: replayed ? 'demo-vector' : 'fresh'
    }
  });
  await deps.store.putChain(tag.serial, chain);

  // 4. Where the phone goes: the receipt page, or the Custody Companion when
  //    the tag address carries app=1 (HTML5 Defold + Rive, served at /companion/).
  const unit = unitFor(tag.serial);
  const app = search.get('app') === '1';
  const to = new URL(app ? '/companion/' : `/r/${tag.serial}`, 'https://x');
  if (app) to.searchParams.set('serial', tag.serial);
  to.searchParams.set('tap', rec.hash.slice(0, 8));
  to.searchParams.set('n', String(r.readCounter));
  if (r.tagTamper) to.searchParams.set('tt', r.tagTamper.raw);
  if (!unit && !app) to.pathname = '/verify';
  return {
    ok: true,
    serial: tag.serial,
    uid: r.uid,
    counter: r.readCounter,
    tag,
    sun: r,
    receiptHash: rec.hash,
    receiptId: rec.id,
    replayChecked: deps.store.persistent,
    redirect: to.pathname + to.search
  };
}

function refusal(reason: string, detail?: string): string {
  const u = new URL('/verify', 'https://x');
  u.searchParams.set('refused', reason);
  if (detail) u.searchParams.set('detail', detail);
  return u.pathname + u.search;
}
