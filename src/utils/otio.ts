import type { Edl } from './edl.js';

// EDL v1 → OpenTimelineIO (T1 amendment, spec §2.9): lossless mapping — same
// clip/track/time-range semantics; timmy-specific fields (env_lock hash,
// signature, model, filters, overlays, transforms) ride in OTIO metadata
// dictionaries, which the format supports natively. Every timmy edit opens
// in Premiere/Resolve/Avid/Nuke; the receipts ride along.

const rt = (seconds: number, rate = 24) => ({
  OTIO_SCHEMA: 'RationalTime.1',
  rate,
  value: Math.round(seconds * rate)
});

export interface OtioExtras {
  env_lock_hash?: string;
  signature?: string;
  model?: string | null;
}

export function edlToOtio(edl: Edl, extra: OtioExtras = {}): Record<string, unknown> {
  return {
    OTIO_SCHEMA: 'Timeline.1',
    name: 'timmy-edl-v1',
    global_start_time: rt(0),
    tracks: {
      OTIO_SCHEMA: 'Stack.1',
      children: [
        {
          OTIO_SCHEMA: 'Track.1',
          kind: 'Video',
          name: 'timmy clips',
          children: edl.clips.map((c, i) => {
            const m = c.src.match(/^(.+)#t=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
            const start = m ? Number(m[2]) : 0;
            const end = m ? Number(m[3]) : start;
            return {
              OTIO_SCHEMA: 'Clip.2',
              name: `clip-${i}`,
              source_range: {
                OTIO_SCHEMA: 'TimeRange.1',
                start_time: rt(start),
                duration: rt(Math.max(0, end - start))
              },
              media_references: {
                DEFAULT_MEDIA: {
                  OTIO_SCHEMA: 'ExternalReference.1',
                  target_url: m ? m[1] : c.src
                }
              },
              active_media_reference_key: 'DEFAULT_MEDIA',
              metadata: {
                timmy: {
                  edl_version: 1,
                  filters: c.filters ?? [],
                  overlays: c.overlays ?? [],
                  transforms: (c as { transforms?: unknown[] }).transforms ?? [],
                  ...extra
                }
              }
            };
          })
        }
      ]
    }
  };
}
