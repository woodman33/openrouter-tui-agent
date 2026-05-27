import { GraphicsPipeline, type FrameBuffer } from './pipeline.js';

export class ITerm2Pipeline extends GraphicsPipeline {
  readonly type = 'iterm2';
  private displayCount = 0;

  async init(): Promise<void> {
    // iTerm2 doesn't need explicit initialization
  }

  async setState(state: string): Promise<void> {
    this.emit('state:change', state);
  }

  renderFrame(frame: FrameBuffer): void {
    // If not first frame, move cursor up to overwrite previous image
    if (this.displayCount > 0) {
      const lines = Math.ceil(frame.height / 16); // approx lines consumed
      process.stdout.write(`\x1b[${lines}A`);
    }

    const b64 = frame.data.toString('base64');
    const args = `File=size=${frame.data.length};inline=1;width=${frame.width}px;height=${frame.height}px`;
    process.stdout.write(`\x1b]1337;${args}:${b64}\x07`);
    this.displayCount++;
  }

  async cleanup(): Promise<void> {
    this.emit('close');
  }
}
