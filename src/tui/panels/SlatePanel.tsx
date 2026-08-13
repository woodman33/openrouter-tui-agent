import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Agent } from '../../agent/core.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { listProjects, readProject, initProject, renderProjectSite, renderCanvasPage } from '../../utils/projects.js';
import { listTemplates, loadTemplate } from '../../utils/templates.js';
import { ensureDashServer } from '../../utils/dash.js';

interface SlatePanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  focusArea?: string;
  inputLocked?: boolean;
}

interface SlateItem { kind: 'project' | 'template'; name: string; }

/**
 * SLATE — the TIMMY visual language console. Left: projects + templates.
 * Right: storyboard beats, refs, gens. [c] opens the live canvas/site in a
 * carbonyl pane (your tldraw on localhost, or the published project site).
 * The terminal authors; the canvas renders. One schema, many targets.
 */
export function SlatePanel({ agent, inputLocked }: SlatePanelProps) {
  const [items, setItems] = useState<SlateItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const load = () => setItems([
      ...listProjects().map(name => ({ kind: 'project' as const, name })),
      ...listTemplates().map(name => ({ kind: 'template' as const, name }))
    ]);
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const sel = items[Math.min(idx, Math.max(0, items.length - 1))];
  const proj = sel?.kind === 'project' ? readProject(sel.name) : null;
  const tmpl = sel?.kind === 'template' ? loadTemplate(sel.name, '{brief}') : null;

  const openCanvas = (item: SlateItem) => {
    ensureDashServer();
    if (item.kind === 'project') renderCanvasPage(item.name);
    const url = item.kind === 'project'
      ? `http://127.0.0.1:4273/studio/${item.name}/site/canvas.html`
      : (process.env.TIMMY_SLATE_URL || 'http://127.0.0.1:5173/');
    agent.addBrowserPane(url);
  };

  const openSite = (item: SlateItem) => {
    ensureDashServer();
    if (item.kind === 'project') renderProjectSite(item.name);
    agent.addBrowserPane(`http://127.0.0.1:4273/studio/${item.name}/site/index.html`);
  };

  useInput((char, key) => {
    if (naming) {
      if (key.escape) { setNaming(false); setDraft(''); return; }
      if (key.return) {
        const name = draft.trim().replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
        if (name) initProject(name);
        setNaming(false);
        setDraft('');
        return;
      }
      if (key.backspace || key.delete) { setDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, items.length - 1), i + 1)); return; }
    const c = char.toLowerCase();
    if (c === 'n') { setNaming(true); return; }
    if (c === 'p' && sel?.kind === 'project') {
      const site = renderProjectSite(sel.name);
      if (site) ensureDashServer();
      return;
    }
    if (c === 'c' && sel) { openCanvas(sel); return; }
    if (c === 'w' && sel) { openSite(sel); return; }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="📐"
      title="SLATE — TIMMY VISUAL LANGUAGE"
      status={`${listProjects().length} projects · ${listTemplates().length} templates`}
      statusColor="#d2a8ff"
      explain="Author storyboards + projects in the terminal; watch them live in a carbonyl canvas. One schema → HyperFrames, sites, tldraw."
      hints={[
        { key: '↑↓', label: 'select' },
        { key: 'n', label: 'new project' },
        { key: 'p', label: 'publish site' },
        { key: 'c', label: 'tldraw canvas pane' },
        { key: 'w', label: 'site pane' }
      ]}
    >
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width="38%" paddingRight={1} borderStyle="single" borderColor="#30363d">
          {items.length === 0 && (
            <Box flexDirection="column">
              <Text color="#8b949e">no projects yet.</Text>
              <Text color="#8b949e">[n] creates one; templates seed from /studio.</Text>
            </Box>
          )}
          {items.map((it, i) => (
            <Text key={`${it.kind}-${it.name}`} color={i === Math.min(idx, items.length - 1) ? '#d2a8ff' : '#e6edf3'} bold={i === Math.min(idx, items.length - 1)} wrap="truncate">
              {i === Math.min(idx, items.length - 1) ? '▶ ' : '  '}{it.kind === 'project' ? '📁' : '📐'} {it.name}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
          {proj && (
            <>
              <Text bold color="#d2a8ff">📁 {proj.name}</Text>
              <Text color="#8b949e">{proj.created_at.replace('T', ' ').slice(0, 16)} · template: {proj.template || '—'}</Text>
              <Text color="#8b949e">{proj.refs.length} refs · {proj.gens.length} gens</Text>
              {(proj.beats || []).map((b, i) => (
                <Text key={i} color="#9aa4b2" wrap="truncate">• {b.at}s–{b.at + b.dur}s [{b.label}] {b.text}</Text>
              ))}
              {proj.gens.slice(-4).map(g => (
                <Text key={g.id} color="#a5b0bc" wrap="truncate">  🎬 {g.label} · {g.provider}{g.artifact ? ` → ${g.artifact}` : ''}</Text>
              ))}
              <Text color="#a5b0bc">[p] renders site/ · [c] opens it live</Text>
            </>
          )}
          {tmpl && (
            <>
              <Text bold color="#d2a8ff">📐 {tmpl.name} ({tmpl.source}, {tmpl.total}s)</Text>
              {tmpl.beats.map((b, i) => (
                <Text key={i} color="#9aa4b2" wrap="truncate">• {b.at}s–{b.at + b.dur}s [{b.label}] {b.text}</Text>
              ))}
              <Text color="#a5b0bc">use with /studio --template {tmpl.name} &lt;idea&gt;</Text>
              <Text color="#a5b0bc">[c] opens your tldraw Slate canvas (TIMMY_SLATE_URL)</Text>
            </>
          )}
          {!proj && !tmpl && <Text color="#8b949e">select a project or template.</Text>}
          {naming && (
            <Box marginTop={1} borderStyle="single" borderColor="#79c0ff" paddingX={1}>
              <Text color="#79c0ff">new project name: {draft}█</Text>
            </Box>
          )}
        </Box>
      </Box>
    </PanelFrame>
  );
}
