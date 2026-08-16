import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { renderComfyWorkflow } from '../src/utils/comfy.js';
import { initProject, addCastToProject } from '../src/utils/projects.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-comfy-'));
});

describe('ComfyUI ControlNet lane', () => {
  it('renders a pinned workflow with the call sheet in the prompt node', () => {
    initProject('north', {}, dir);
    addCastToProject('north', { id: 'C1', name: 'Danny', wardrobe: 'blood-stain shirt', emotion: 'wired' }, dir);
    const wf = renderComfyWorkflow('north', dir)!;
    const body = JSON.parse(readFileSync(wf, 'utf8'));
    expect(body.nodes.some((n: any) => n.type === 'ControlNetApply')).toBe(true);
    expect(body.nodes.some((n: any) => n.type === 'ScribblePreprocessor')).toBe(true);
    const promptNode = body.nodes.find((n: any) => n.title?.includes('PROMPT'));
    expect(promptNode.widgets_values[0]).toContain('C1 (Danny)');
    expect(promptNode.widgets_values[0]).toContain('wardrobe: blood-stain shirt');
    const neg = body.nodes.find((n: any) => n.title?.includes('NEGATIVE'));
    expect(neg.widgets_values[0]).toContain('identity drift');
    expect(body.nodes.find((n: any) => n.type === 'KSampler').widgets_values[1]).toBe('fixed');
  });

  it('renders the conditioning svg next to the workflow', () => {
    initProject('north', {}, dir);
    addCastToProject('north', { id: 'C1', name: 'Danny' }, dir);
    renderComfyWorkflow('north', dir);
    expect(existsSync(join(dir, 'studio', 'north', 'conditioning.svg'))).toBe(true);
  });
});
