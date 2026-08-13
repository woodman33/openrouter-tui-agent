import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readProject, renderBlockingSvg, castPromptBlock, projectDir } from './projects.js';

// ComfyUI ControlNet lane — the Slate blocking diagram becomes the pose
// conditioning. The workflow is a TEMPLATE: pinned node types, call-sheet
// prompt injected, fixed seed. Runs in the isolated Docker ComfyUI
// (lab/comfy) — never host python.
export function renderComfyWorkflow(name: string, dir?: string): string | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  renderBlockingSvg(name, dir); // conditioning.svg lands next to the workflow
  const prompt = castPromptBlock(proj) || `${name} — slate generation`;
  const workflow = {
    last_node_id: 9,
    last_link_id: 7,
    nodes: [
      { id: 1, type: 'LoadImage', title: 'TIMMY conditioning (blocking diagram → png)', widgets_values: ['timmy_conditioning.png'] },
      { id: 2, type: 'ScribblePreprocessor', widgets_values: [] },
      { id: 3, type: 'ControlNetLoader', widgets_values: ['control_v11p_sd15_scribble.pth'] },
      { id: 4, type: 'ControlNetApply', widgets_values: [] },
      { id: 5, type: 'CheckpointLoaderSimple', widgets_values: ['sd_xl_base_1.0.safetensors'] },
      { id: 6, type: 'CLIPTextEncode', title: 'PROMPT — call sheet rides here', widgets_values: [prompt] },
      { id: 7, type: 'CLIPTextEncode', title: 'NEGATIVE — the consistency guard', widgets_values: ['identity drift, wardrobe change, haircut mid-scene, extra limbs'] },
      { id: 8, type: 'KSampler', widgets_values: [42, 'fixed', 24, 6.5, 'euler', 'normal', 1.0] },
      { id: 9, type: 'SaveImage', widgets_values: [`timmy_${name}_`] }
    ],
    links: [
      [1, 1, 0, 2, 0, 'IMAGE'],
      [2, 2, 0, 4, 0, 'IMAGE'],
      [3, 3, 0, 4, 1, 'CONTROL_NET'],
      [4, 5, 1, 6, 0, 'CLIP'],
      [5, 5, 1, 7, 0, 'CLIP'],
      [6, 4, 0, 8, 2, 'CONDITIONING'],
      [7, 8, 0, 9, 0, 'IMAGE']
    ],
    groups: [{ title: 'TIMMY Slate → ControlNet · pose from blocking diagram · seed fixed for reproducibility' }],
    version: 0.4
  };
  const p = join(projectDir(name, dir), 'comfy');
  mkdirSync(p, { recursive: true });
  writeFileSync(join(p, 'pose-workflow.json'), JSON.stringify(workflow, null, 2), 'utf8');
  return join(p, 'pose-workflow.json');
}
