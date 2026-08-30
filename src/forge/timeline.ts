// FORGE OTIO emitter (p13; decisions.md D3/D6; DESIGN.md §1). `timmy
// timeline emit` assembles gen.result receipts into a valid OpenTimelineIO
// file; each clip's metadata carries timmy:{receipt_hash, prev,
// prompt_hash, gen_id, rights}. Defaults come from the CUE-validated
// timeline spec. Emits seal timeline.emit with the file hash. JSON shape
// mirrors otio 0.18.1 serialization exactly (Clip.2 + media_references).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readChain, appendReceipt, type Receipt } from '../utils/receipts.js';
import { forgeEnabled, sha256 } from './gen.js';

export interface TimelineSpec {
  clip_seconds: number; width: number; height: number;
  transition: string; xfade_seconds: number; rate: number; rights_line: string;
}
const DEFAULT_SPEC: TimelineSpec = {
  clip_seconds: 5, width: 1280, height: 720, transition: 'cut',
  xfade_seconds: 1, rate: 24, rights_line: 'generated in timmy, proven by receipts',
};

export function validateTimelineSpec(spec: TimelineSpec): void {
  const dir = mkdtempSync(join(tmpdir(), 'forge-tl-'));
  const data = join(dir, 'spec.json');
  writeFileSync(data, JSON.stringify(spec));
  const schema = join(fileURLToPath(new URL('.', import.meta.url)), 'timeline.cue');
  const r = spawnSync('cue', ['vet', schema, data, '-d', 'spec'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`timeline spec rejected by CUE: ${(r.stderr ?? '').split('\n')[0]}`);
}

const OTIO_PY = join(homedir(), '.local', 'share', 'uv', 'tools', 'opentimelineio', 'bin', 'python');

interface GenResultSource {
  slot_id?: string;
  sheet_id?: string;
  local?: boolean;
}

const genSource = (r: Receipt): GenResultSource | undefined =>
  Array.isArray(r.sources) ? (r.sources as GenResultSource[])[0] : undefined;

function latestGenResults(gens: Receipt[]): Receipt[] {
  const latestSheetId = [...gens].reverse().map(genSource).find(s => typeof s?.sheet_id === 'string')?.sheet_id;
  const scoped = latestSheetId ? gens.filter(g => genSource(g)?.sheet_id === latestSheetId) : gens;
  const order: string[] = [];
  const latestBySlot = new Map<string, Receipt>();
  for (const g of scoped) {
    const src = genSource(g);
    const key = src?.slot_id ? `${src.sheet_id ?? 'legacy'}:${src.slot_id}` : g.hash;
    if (!latestBySlot.has(key)) order.push(key);
    latestBySlot.set(key, g);
  }
  return order.map(k => latestBySlot.get(k)).filter((g): g is Receipt => Boolean(g));
}

export function emitTimeline(opts: { specPath?: string; out?: string; dir?: string } = {}): { file: string; clips: number; seal: string } {
  if (!forgeEnabled()) throw new Error('forge lane gated: run with TIMMY_FORGE=1 (D1)');
  const dir = opts.dir ?? process.cwd();
  const spec: TimelineSpec = opts.specPath
    ? { ...DEFAULT_SPEC, ...JSON.parse(readFileSync(opts.specPath, 'utf8')) as Partial<TimelineSpec> }
    : DEFAULT_SPEC;
  validateTimelineSpec(spec);
  const gens = latestGenResults(readChain('runs', dir).filter(r => r.kind === 'gen.result'));
  if (gens.length === 0) throw new Error('no gen.result receipts to cut — run timmy gen first');
  const clips = gens.map(g => {
    const src = genSource(g);
    return {
      OTIO_SCHEMA: 'Clip.2',
      metadata: {
        timmy: {
          receipt_hash: g.hash, prev: g.prev_hash, prompt_hash: g.prompt_hash ?? '',
          gen_id: g.id, rights: spec.rights_line, slot_id: src?.slot_id ?? '', sheet_id: src?.sheet_id ?? '',
        },
      },
      name: `forge ${src?.slot_id ?? g.id}`,
      source_range: {
        OTIO_SCHEMA: 'TimeRange.1',
        duration: { OTIO_SCHEMA: 'RationalTime.1', rate: spec.rate, value: spec.clip_seconds * spec.rate },
        start_time: { OTIO_SCHEMA: 'RationalTime.1', rate: spec.rate, value: 0 },
      },
      effects: [], markers: [], enabled: true, color: null,
      media_references: {
        DEFAULT_MEDIA: {
          OTIO_SCHEMA: 'ExternalReference.1', metadata: {}, name: '',
          available_range: null, available_image_bounds: null,
          target_url: `file://${(g.artifacts ?? [''])[0]}`,
        },
      },
      active_media_reference_key: 'DEFAULT_MEDIA',
    };
  });
  const tl = {
    OTIO_SCHEMA: 'Timeline.1', metadata: {}, name: 'timmy-forge', global_start_time: null,
    tracks: {
      OTIO_SCHEMA: 'Stack.1', metadata: {}, name: 'tracks', source_range: null,
      effects: [], markers: [], enabled: true, color: null,
      children: [{
        OTIO_SCHEMA: 'Track.1', metadata: {}, name: 'forge', source_range: null,
        effects: [], markers: [], enabled: true, color: null,
        children: clips, kind: 'Video',
      }],
    },
  };
  const out = opts.out ?? join(dir, '.timmy', 'forge', 'timeline.otio');
  writeFileSync(out, JSON.stringify(tl, null, 2));
  // D6 acceptance: the pinned OTIO python must parse what we wrote.
  const chk = spawnSync(OTIO_PY, ['-c',
    'import opentimelineio as otio,sys; t=otio.adapters.read_from_file(sys.argv[1]); ' +
    'c=list(t.tracks[0]); assert len(c)>0; assert "timmy" in c[0].metadata; ' +
    'print(len(c), c[0].metadata["timmy"]["receipt_hash"][:12])', out], { encoding: 'utf8' });
  if (chk.status !== 0) throw new Error(`OTIO acceptance failed: ${(chk.stderr ?? '').slice(0, 300)}`);
  const seal = appendReceipt('runs', {
    kind: 'timeline.emit', subject: `forge timeline · ${clips.length} clips`,
    policy: 'auto', output_sha256: sha256(readFileSync(out)), artifacts: [out],
    status: 'ok', sources: [{ clips: clips.length, transition: spec.transition }],
  } as never, dir);
  return { file: out, clips: clips.length, seal: seal.hash };
}
