import { GraphicsPipeline, type FrameBuffer } from './pipeline.js';

export class SixelPipeline extends GraphicsPipeline {
  readonly type = 'sixel';

  async init(): Promise<void> {}

  async setState(state: string): Promise<void> {
    this.emit('state:change', state);
  }

  renderFrame(frame: FrameBuffer): void {
    // Basic Sixel encoding from PNG buffer using simple downsampling to ANSI half-blocks
    // Full Sixel would require decoding PNG to raw pixels; for Phase 2 we fall back to half-blocks
    this.renderHalfBlock(frame);
  }

  private renderHalfBlock(frame: FrameBuffer): void {
    // Use ANSI half-blocks to display the image at character-grid resolution
    // This is a placeholder; real Sixel requires proper encoding from raw pixel data
    // For now we just draw a colored box placeholder
    const cols = Math.floor(frame.width / 8);
    const rows = Math.floor(frame.height / 16);
    const lines: string[] = [];
    for (let y = 0; y < rows; y++) {
      let line = '';
      for (let x = 0; x < cols; x++) {
        // Sample pixel from frame (approximation)
        const px = Math.floor((x / cols) * frame.width);
        const py = Math.floor((y / rows) * frame.height);
        const idx = (py * frame.width + px) * 4;
        if (idx + 2 < frame.data.length) {
          const r = frame.data[idx] || 0x40;
          const g = frame.data[idx + 1] || 0x40;
          const b = frame.data[idx + 2] || 0x40;
          line += `\x1b[48;2;${r};${g};${b}m█`;
        } else {
          line += `\x1b[48;2;64;64;64m█`;
        }
      }
      line += '\x1b[0m';
      lines.push(line);
    }
    process.stdout.write(lines.join('\n'));
  }

  async cleanup(): Promise<void> {
    this.emit('close');
  }
}
