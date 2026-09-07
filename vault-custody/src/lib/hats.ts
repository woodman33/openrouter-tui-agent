// Hats, not accounts. Seeded sessions (no real auth yet): the sign-in stub sets
// vc_hat + vc_session cookies from hats.json. Every chain event stamps its hat.
import hatsJson from '../data/hats.json';
import eventsJson from '../data/events.json';
import inventoryJson from '../data/inventory.json';

export type HatId = 'manufacturer' | 'distributor' | 'retailer' | 'collector' | 'seller' | 'grader';

export interface Hat {
  id: HatId;
  label: string;
  verb: string;
  blurb: string;
  identity: { hash: string; city: string; name: string };
  session: string;
  home: string;
}

export const HAT_ORDER = hatsJson.order as HatId[];
export const hats = hatsJson.hats as Record<HatId, Hat>;
export const isHat = (s: string | undefined | null): s is HatId => !!s && (HAT_ORDER as string[]).includes(s);

/** Marker shape per hat: shape encodes the hat, colour stays semantic (orange = human, phosphor = chain). */
export const HAT_SHAPE: Record<HatId, 'circle' | 'square' | 'diamond' | 'triangle' | 'hexagon' | 'ring'> = {
  manufacturer: 'hexagon',
  distributor: 'square',
  retailer: 'diamond',
  collector: 'circle',
  seller: 'triangle',
  grader: 'ring'
};

export interface ProvenanceEvent {
  seq: string;
  kind: string;
  ts: string;
  hat: HatId;
  city: string;
  title: string;
  detail: string;
  prev: string;
  this: string;
  via?: string;
  by?: string;
  counterparty?: HatId;
  from?: string;
  tamper?: boolean;
}

export const cities = eventsJson.cities as Record<string, { lat: number; lon: number }>;
export const eventsFor = (serial: string): ProvenanceEvent[] => ((eventsJson.units as Record<string, ProvenanceEvent[]>)[serial] ?? []);
export const provenanceSerials = (): string[] => Object.keys(eventsJson.units);

export type SheetId = 'locations' | 'boxes' | 'singles';
export const SHEETS: SheetId[] = ['locations', 'boxes', 'singles'];
export interface Row {
  serial: string;
  thumb: string;
  product: string;
  manufactured: string;
  received: string;
  sold: string;
  counterparty: { hash: string; city: string; hat: string };
  price: string;
  state: string;
  tamper: string;
  taps: number;
  head: string;
  verify: string;
  hats: string[];
}
export const sheet = (id: SheetId): Row[] => (inventoryJson as Record<SheetId, Row[]>)[id];
export const rowsFor = (id: SheetId, hat: HatId): Row[] => sheet(id).filter((r) => r.hats.includes(hat));

/** Chain kinds render in phosphor; everything a person did renders in orange. */
export const isChainKind = (kind: string): boolean => kind === 'custody.commit' || kind === 'chain.head';
