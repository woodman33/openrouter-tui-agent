import { GraphicsPipeline, type FrameBuffer } from './pipeline.js';

export class KittyGraphicsPipeline extends GraphicsPipeline {
  readonly type = 'kitty';
  private imageId = 1;

  async init(): Promise<void> {
    // Test kitty graphics support
    process.stdout.write('\x1b_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1b\\');
  }

  async setState(state: string): Promise<void> {
    // Kitty pipeline doesn't care about state changes directly, just renders frames
    this.emit('state:change', state);
  }

  renderFrame(frame: FrameBuffer): void {
    const b64 = frame.data.toString('base64');
    // Chunk into 4096-byte pieces for the Kitty protocol
    const chunkSize = 4096;
    const chunks: string[] = [];
    for (let i = 0; i < b64.length; i += chunkSize) {
      chunks.push(b64.slice(i, i + chunkSize));
    }

    const id = this.imageId++;
    chunks.forEach((chunk, i) => {
      const isFirst = i === 0;
      const isLast = i === chunks.length - 1;
      const control = isFirst
        ? `a=T,f=100,s=${frame.width},v=${frame.height},i=${id},m=${isLast ? 0 : 1}`
        : `m=${isLast ? 0 : 1}`;
      process.stdout.write(`\x1b_G${control};${chunk}\x1b\\`);
    });
  }

  async cleanup(): Promise<void> {
    // Delete all images
    process.stdout.write('\x1b_Ga=d,d=A\x1b\\');
    this.emit('close');
  }
}
