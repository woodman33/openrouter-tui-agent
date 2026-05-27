import { GraphicsPipeline, type FrameBuffer } from './pipeline.js';
import { gradientText, format, rgb, rgbBg } from '../utils/ansi.js';

export class AnsiPipeline extends GraphicsPipeline {
  readonly type = 'ansi';
  private currentState = 'idle';

  async init(): Promise<void> {
    // Silent no-op to prevent corrupting Ink's virtual stdout render tree
  }

  async setState(state: string): Promise<void> {
    this.currentState = state;
    this.emit('state:change', state);
  }

  renderFrame(_frame: FrameBuffer): void {
    // Silent fallback
  }

  async cleanup(): Promise<void> {
    this.emit('close');
  }
}

const MASCOT_ART: Record<string, string> = {
  idle: `
    ╭──────────────╮
    │  ◉         ◉ │
    │              │
    │    ╰────╯    │
    │              │
    ╰──────────────╯
`.trimStart(),
  thinking: `
    ╭──────────────╮
    │  ● ●  ···    │
    │   \\      /   │
    │    ╰────╯    │
    │   ?  ?  ?    │
    ╰──────────────╯
`.trimStart(),
  streaming: `
    ╭──────────────╮
    │  ◉         ◉ │
    │    ╭────╮    │
    │    │ !! │    │
    │    ╰────╯    │
    ╰──────────────╯
      ▂▃▄▅▆▇█▇▆▅▄▃▂
`.trimStart(),
  tool_call: `
    ╭──────────────╮
    │  ◉         ◉ │
    │      ⚙️       │
    │    ╰────╯    │
    │  ⟲ working   │
    ╰──────────────╯
`.trimStart(),
  error: `
    ╭──────────────╮
    │  ✕         ✕ │
    │    ╭────╮    │
    │    │ !! │    │
    │    ╰────╯    │
    ╰──────────────╯
`.trimStart(),
  success: `
    ╭──────────────╮
    │  ◉         ◉ │
    │    ^    ^    │
    │    ╰────╯    │
    │   ✓ done!    │
    ╰──────────────╯
`.trimStart(),
};
