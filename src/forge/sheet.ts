// FORGE reference-sheet loader (p13; decisions.md D3, D5, D8). Reads a
// tldraw sheet spec (JSON export) whose FRAMES are typed slots, normalizes,
// and gates on `cue vet` BEFORE any gen fires. slot_id uniqueness and the
// required-class counts live here (D8); CUE bounds everything else.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export interface ForgeSlot {
  slot_id: string;
  class: 'terrain' | 'material' | 'weather' | 'hero' | 'other';
  required: boolean;
  prompt: string;
  provider_pref: string;
  aspect?: string;
  est_cost_usd?: number;
}
export interface ForgeSheet {
  sheet_id: string;
  budget_cap_usd: number;
  aspect: string;
  slots: ForgeSlot[];
}

// tldraw export: shapes as object-or-array; slot data rides on shape.meta.
export function loadSheet(path: string): ForgeSheet {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  if (Array.isArray((raw as { slots?: unknown[] }).slots)) return raw as unknown as ForgeSheet;
  const shapes = (raw as { shapes?: Record<string, { meta?: Record<string, unknown> }> | { meta?: Record<string, unknown> }[] }).shapes;
  const list = Array.isArray(shapes) ? shapes : Object.values(shapes ?? {});
  const slots: ForgeSlot[] = [];
  for (const sh of list) {
    const m = (sh?.meta ?? {}) as Record<string, unknown>;
    if (typeof m.slot_id !== 'string') continue; // a frame without a slot is scenery
    slots.push({
      slot_id: String(m.slot_id),
      class: (['terrain', 'material', 'weather', 'hero', 'other'].includes(String(m.class)) ? String(m.class) : 'other') as ForgeSlot['class'],
      required: Boolean(m.required),
      prompt: String(m.prompt ?? ''),
      provider_pref: String(m.provider_pref ?? 'stub'),
      aspect: typeof m.aspect === 'string' ? m.aspect : undefined,
      est_cost_usd: typeof m.est_cost_usd === 'number' ? m.est_cost_usd : undefined,
    });
  }
  return {
    sheet_id: String(raw.sheet_id ?? 'sheet-tldraw'),
    budget_cap_usd: Number(raw.budget_cap_usd ?? 1),
    aspect: String(raw.aspect ?? '16:9'),
    slots,
  };
}

// D3: CUE decides budget/aspect/required validity; TS decides uniqueness.
export function validateSheet(sheet: ForgeSheet): void {
  const ids = sheet.slots.map(s => s.slot_id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`sheet invalid: duplicate slot_id ${dup}`);
  const rc = sheet.slots.filter(s => s.required).map(s => s.class);
  const payload = {
    ...sheet,
    required_classes: rc,
    required_count: rc.length,
    hero_required_count: rc.filter(c => c === 'hero').length,
    est_total_usd: sheet.slots.reduce((s, x) => s + (x.est_cost_usd ?? 0), 0),
  };
  const dir = mkdtempSync(join(tmpdir(), 'forge-'));
  const data = join(dir, 'sheet.json');
  writeFileSync(data, JSON.stringify(payload));
  const schema = join(fileURLToPath(new URL('.', import.meta.url)), 'sheet.cue');
  const r = spawnSync('cue', ['vet', schema, data, '-d', 'sheet'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`sheet rejected by CUE: ${(r.stderr ?? '').split('\n').slice(0, 3).join(' ')}`);
}
