import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFocus, panelMayAct } from '../hooks/useKeyDispatcher.js';
import { join } from 'path';
import type { Agent } from '../../agent/core.js';
import { PaneFocusContext } from '../components/PanelFrame.js';
import { KeyHintBar } from '../components/KeyHintBar.js';
import { Card, BudgetList } from '../ui/index.js';
import { listProjects, readProject, projectDir } from '../../utils/projects.js';
import {
  ensureProjectTree, projectTree, renderProjectIndex, syncLaneLogs,
  exportTraining, previewFile, type TreeFile
} from '../../utils/projecttree.js';
import { seedStarter } from '../../utils/starter.js';
import { theme } from '../theme.js';

interface ProjectsPanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  zone?: number;
  setZone?: (z: number) => void;
  inputLocked?: boolean;
}

/**
 * PROJECTS — the per-project tree browser. Left: projects. Right: the
 * context-optimized tree (PROJECT.md first), with in-terminal previews
 * (chafa/catimg/head) and carbonyl for the real thing.
 */
export function ProjectsPanel({ agent, zone = 0, setZone, inputLocked }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [files, setFiles] = useState<TreeFile[]>([]);
  const [fidx, setFidx] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const focused = React.useContext(PaneFocusContext);

  useEffect(() => {
    const load = () => {
      seedStarter();
      const ps = listProjects();
      setProjects(ps);
      const sel = ps[Math.min(idx, Math.max(0, ps.length - 1))];
      if (sel) setFiles(projectTree(sel));
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [idx]);

  const sel = projects[Math.min(idx, Math.max(0, projects.length - 1))];
  const file = files[Math.min(fidx, Math.max(0, files.length - 1))];
  // signature: inline gen counts — gens/ holds one file per gen-id
  const genCount = files.filter(f => f.rel.startsWith('gens/')).length;

  const __focus = useFocus();
  useInput((char, key) => {
    if (!panelMayAct(__focus, 'input:projects')) return;
    if (zone < 0) return; // nav owns the keyboard
    if (preview) {
      if (key.escape || key.return) { setPreview(null); return; }
      return;
    }
    if (key.upArrow) {
      if (zone === 0) setIdx(i => Math.max(0, i - 1));
      else setFidx(i => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      if (zone === 0) setIdx(i => Math.min(Math.max(0, projects.length - 1), i + 1));
      else setFidx(i => Math.min(Math.max(0, files.length - 1), i + 1));
      return;
    }
    // ONE GRAMMAR: ←→ move between panes (nav ↔ projects ↔ tree)
    if (key.leftArrow) { setZone?.(Math.max(-1, zone - 1)); return; }
    if (key.rightArrow) { setZone?.(Math.min(1, zone + 1)); return; }
    const c = char.toLowerCase();
    if (c === 'p' && sel && file) { setPreview(previewFile(join(projectDir(sel), file.rel))); return; }
    if (c === 'v' && sel && file && (agent as any).addBrowserPane) {
      (agent as any).addBrowserPane(`http://127.0.0.1:4273/studio/${sel}/${file.rel}`);
      setNote('opened in carbonyl (dash server must be up — [o] in SLATE starts it)');
      return;
    }
    if (c === 's' && sel) {
      const n = syncLaneLogs(sel, agent.tmuxSessions);
      setNote(`synced ${n} lane logs + reindexed`);
      renderProjectIndex(sel);
      setFiles(projectTree(sel));
      return;
    }
    if (c === 'e' && sel) {
      const r = exportTraining(sel);
      setNote(`training export: ${r.files} files${r.labelsPath ? ' + labels.json' : ''}`);
      return;
    }
    if (c === 'i' && sel) { renderProjectIndex(sel); setFiles(projectTree(sel)); setNote('PROJECT.md reindexed'); return; }
    if (c === 'o' && sel && file) { setNote(`in your terminal: ${process.env.EDITOR || 'nvim'} studio/${sel}/${file.rel}`); return; }
  }, { isActive: !inputLocked });

  const projIdx = Math.min(idx, projects.length - 1);
  const fileIdx = Math.min(fidx, files.length - 1);

  return (
    <Card
      title="Projects — per-project tree"
      focused={focused}
      purpose="context-optimized: PROJECT.md index first, descend only when relevant · cross-linked by gen-id"
      pill={{ kind: projects.length ? 'accent' : 'muted', label: `${projects.length} projects` }}
      flexGrow={1}
    >
      {note && <Text color={theme.accent}>{note}</Text>}
      {preview ? (
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color={theme.accent}>preview · {file?.rel} · Esc back</Text>
          {preview.split('\n').slice(0, 30).map((l, i) => (
            <Text key={i} color={theme.textSecondary}>{l}</Text>
          ))}
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1}>
          <Box flexDirection="column" width="26%" paddingRight={1}>
            <BudgetList
              items={projects}
              max={7}
              offset={Math.max(0, projIdx - 6)}
              render={(p, i) => (
                <Text key={p} color={i === projIdx ? theme.accent : theme.textSecondary} bold={i === projIdx} wrap="truncate">
                  {i === projIdx ? '▸ ' : '  '}{p}{i === projIdx ? ` · ${genCount} gens` : ''}
                </Text>
              )}
            />
          </Box>
          <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
            <Text bold color={theme.accent} wrap="truncate">studio/{sel || '?'}/ — {genCount} gens · PROJECT.md first</Text>
            <BudgetList
              items={files}
              max={7}
              offset={Math.max(0, Math.min(fileIdx - 6, Math.max(0, files.length - 7)))}
              overflowHint="[↓] scroll · [p] preview"
              render={(f, i) => (
                <Text key={f.rel} color={i === fileIdx ? theme.textPrimary : theme.textSecondary} bold={i === fileIdx} wrap="truncate">
                  {i === fileIdx ? '▸ ' : '  '}{f.rel.padEnd(44)} {(f.size / 1024).toFixed(1)}kb
                </Text>
              )}
            />
          </Box>
        </Box>
      )}
      <KeyHintBar hints={[
        { key: '←→', label: 'pane' },
        { key: '↑↓', label: 'move' },
        { key: 'p', label: 'preview in terminal' },
        { key: 'v', label: 'carbonyl' },
        { key: 'o', label: 'open in $EDITOR' },
        { key: 's', label: 'sync logs' },
        { key: 'e', label: 'training export' }
      ]} />
    </Card>
  );
}
