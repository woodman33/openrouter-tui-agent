import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { PanelFrame } from '../components/PanelFrame.js';
import { listClipJobs, createClipJob, detectClip, ffmpegCheat, CLIP_INSTALL, type ClipJob } from '../../utils/clip.js';
import { listProjects } from '../../utils/projects.js';
import { BRAND } from '../../utils/brand.js';
import { osc52Copy } from '../../utils/notify.js';

interface ClipPanelProps {
  agent: any;
  setInspector?: (s: string | null) => void;
  zone?: number;
  setZone?: (z: number) => void;
  setModalInput?: (b: boolean) => void;
  inputLocked?: boolean;
}

/**
 * TIMMY Clip — the video-editing tab. Lists receipt-linked clip manifests;
 * the actual cutting happens via open-edit (agent-driven, Apple Silicon) or
 * the deterministic ffmpeg one-liners ([y] yanks them). TIMMY never pretends
 * to be a timeline GUI: it links generations, writes the runbook, seals proof.
 */
export function ClipPanel({ zone = 0, setZone, setModalInput, inputLocked }: ClipPanelProps) {
  const [jobs, setJobs] = useState<ClipJob[]>([]);
  const [idx, setIdx] = useState(0);
  const [composing, setComposing] = useState(false);
  const [projIdx, setProjIdx] = useState(0);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setJobs(listClipJobs()); }, [tick]);

  const sel = jobs[Math.min(idx, Math.max(0, jobs.length - 1))];
  const projects = listProjects();
  const st = detectClip();

  useInput((char, key) => {
    if (zone < 0) return;
    if (composing) {
      if (key.escape) { setComposing(false); setDraft(''); setModalInput?.(false); return; }
      if (key.upArrow) { setProjIdx(i => Math.max(0, i - 1)); return; }
      if (key.downArrow) { setProjIdx(i => Math.min(Math.max(0, projects.length - 1), i + 1)); return; }
      if (key.return) {
        const p = projects[projIdx];
        if (p) {
          const job = createClipJob(p, draft.trim() || 'assemble the beats in order', []);
          setNote(`${job.id} queued for ${p} — link sources from SLATE [c] for receipted provenance`);
        }
        setComposing(false);
        setDraft('');
        setModalInput?.(false);
        return;
      }
      if (key.backspace || key.delete) { setDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, jobs.length - 1), i + 1)); return; }
    if (key.leftArrow) { setZone?.(Math.max(-1, zone - 1)); return; }
    if (key.rightArrow) { setZone?.(Math.min(1, zone + 1)); return; }
    const c = char.toLowerCase();
    if (c === 'n') { setComposing(true); setModalInput?.(true); return; }
    if (c === 'o' && sel) { setNote(`in your terminal: ${process.env.EDITOR || 'nvim'} ${sel.output.replace(/\.mp4$/, '.md')}`); return; }
    if (c === 'y' && sel?.sources[0]) {
      osc52Copy(ffmpegCheat(sel.sources[0].artifact).join('\n'));
      setNote('ffmpeg one-liners yanked (probe/cut/compress/audio)');
      return;
    }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="✂️"
      title={`${BRAND.clip} — VIDEO EDITING OVER OPEN-EDIT`}
      status={`${jobs.length} job${jobs.length === 1 ? '' : 's'} · ${st.dir ? 'open-edit ready' : 'open-edit missing'}`}
      statusColor="#79c0ff"
      explain={BRAND.clipTagline}
      hints={[
        { key: '↑↓', label: 'job' },
        { key: 'n', label: 'new job' },
        { key: 'o', label: 'runbook in $EDITOR' },
        { key: 'y', label: 'yank ffmpeg lines' }
      ]}
    >
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width="42%" paddingRight={1} borderStyle="single" borderColor={zone === 0 ? '#a98bff' : '#30363d'}>
          {jobs.length === 0 && (
            <Box flexDirection="column">
              <Text color="#8b949e">no clip jobs yet.</Text>
              <Text color="#8b949e">[n] here, or SLATE [c] on a project (links its gens).</Text>
            </Box>
          )}
          {jobs.map((j, i) => {
            const isSel = i === Math.min(idx, jobs.length - 1);
            return (
              <Text key={j.id} color={isSel ? '#79c0ff' : '#a5b0bc'} bold={isSel} wrap="truncate">
                {isSel ? '▶ ' : '  '}{j.id} · {j.project} · {j.sources.length} src · {j.status}
              </Text>
            );
          })}
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
          {sel ? (
            <>
              <Text bold color="#79c0ff" wrap="truncate">{sel.id} · {sel.project}</Text>
              <Text color="#8b949e" wrap="wrap">instruction: {sel.instruction}</Text>
              <Box marginTop={1} flexDirection="column">
                {sel.sources.map(s => (
                  <Text key={s.genId + s.artifact} color="#a5b0bc" wrap="truncate">
                    • {s.label} → {s.artifact}{s.receiptHash ? ` · receipt ${s.receiptHash.slice(7, 19)}` : ''}
                  </Text>
                ))}
                {sel.sources.length === 0 && <Text color="#8b949e">• no linked sources — SLATE [c] links gens with receipt hashes</Text>}
              </Box>
              <Text color="#3fb950" wrap="truncate">out: {sel.output}</Text>
              <Box marginTop={1} flexDirection="column">
                <Text color="#8b949e">deterministic layer ([y] yanks these):</Text>
                {ffmpegCheat(sel.sources[0]?.artifact ?? sel.output).slice(1).map(l => (
                  <Text key={l} color="#a5b0bc" wrap="truncate">  {l}</Text>
                ))}
              </Box>
              {!st.dir && <Text color="#f5b540" wrap="truncate">agent layer: {st.note ?? CLIP_INSTALL}</Text>}
              {note && <Text color="#3fb950" wrap="truncate">{note}</Text>}
            </>
          ) : (
            <Text color="#8b949e">select a job, or [n] to queue one.</Text>
          )}
          {composing && (
            <Box marginTop={1} borderStyle="single" borderColor="#79c0ff" paddingX={1} flexDirection="column">
              <Text color="#79c0ff">NEW CLIP JOB — ↑↓ project · instruction:</Text>
              <Text>{projects[projIdx] ?? '(no projects)'} ▸ {draft}█</Text>
              <Text color="#8b949e">Enter queues · Esc cancels</Text>
            </Box>
          )}
        </Box>
      </Box>
    </PanelFrame>
  );
}
