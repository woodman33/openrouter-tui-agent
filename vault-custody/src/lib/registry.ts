// Registry: tags → units, keysets, fixtures. Reads the pilot fixtures; a
// production build swaps the JSON for KV/D1 reads behind the same functions.
import tagsJson from '../data/tags.json';
import unitsJson from '../data/units.json';
import cardsJson from '../data/cards.json';
import relicsJson from '../data/relics.json';
import seriesJson from '../data/series.json';
import logJson from '../data/log.json';
import manufacturerJson from '../data/manufacturer.json';
import { hex, type SunKeys } from './sun.js';

export type TimelineKind = 'sealed' | 'opened' | 'pack';
export interface TimelineEntry { kind: TimelineKind; title: string; meta: string }

export interface Unit {
  serial: string;
  series: string;
  product: string;
  state: 'sealed' | 'opened';
  sealTag: string;
  revealTag?: string;
  contentsHash: string;
  sealed: { at: string; where: string; by: string; band: string; photos: number };
  seal?: { signature: string; taps: number; loop: string };
  sold?: { at: string; posReceipt: string; counter: number };
  claimed?: { at: string; ownerInitials: string; city: string; tap: number };
  opened?: { at: string; city: string; byClaimedOwner: boolean; sealLoop: string; revealTag: string };
  packs?: { opened: number; total: number; first: string; last: string };
  cards?: { attached: number; hits: number; numbered: number };
  event?: string;
  timeline: TimelineEntry[];
}

export interface TagRecord {
  serial: string;
  role: 'seal' | 'reveal';
  type: string;
  batch: string;
  keyset: string;
  lastCounter: number;
  /** Published test-vector tag: fixed URL, recorded but never refused as replay. */
  demo?: boolean;
}

export const EPOCH: number = unitsJson.epoch;
export const units = unitsJson.units as Record<string, Unit>;
export const cards = cardsJson.cards;
export const relics = relicsJson.relics;
export const series = seriesJson.series;
export const log = logJson;
export const manufacturer = manufacturerJson;
export const tags = tagsJson.tags as Record<string, TagRecord>;

export function unitFor(serial: string): Unit | undefined {
  return units[serial];
}

export function tagFor(uidHex: string): TagRecord | undefined {
  return tags[uidHex.toLowerCase()];
}

/** Resolve the keyset for a tag. `overrides` is the CUSTODY_KEYS env JSON, when present. */
export function keysFor(tag: TagRecord | undefined, overrides?: string): SunKeys {
  const set = tag?.keyset ?? 'demo';
  let table: Record<string, { metaReadKey: string; fileReadKey: string }> = tagsJson.keys;
  if (overrides) {
    try {
      table = { ...table, ...(JSON.parse(overrides) as typeof table) };
    } catch {
      /* bad override JSON: fall through to fixtures */
    }
  }
  const k = table[set] ?? table.demo;
  return { metaReadKey: hex.from(k.metaReadKey), fileReadKey: hex.from(k.fileReadKey) };
}

/** Default keys used to verify a tag whose UID is not yet in the registry (unknown tag → still verify against demo keys, then refuse as unregistered). */
export function defaultKeys(overrides?: string): SunKeys {
  return keysFor(undefined, overrides);
}

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles' });
};
