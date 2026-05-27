import { EventEmitter } from 'eventemitter3';

export interface FrameBuffer {
  data: Buffer;
  width: number;
  height: number;
  id: number;
  timestamp: number;
}

export interface GraphicsPipelineEvents {
  'frame': (frame: FrameBuffer) => void;
  'state:change': (state: string) => void;
  'error': (error: Error) => void;
  'close': () => void;
}

export abstract class GraphicsPipeline extends EventEmitter<GraphicsPipelineEvents> {
  abstract readonly type: string;
  abstract init(): Promise<void>;
  abstract setState(state: string): Promise<void>;
  abstract renderFrame(frame: FrameBuffer): void;
  abstract cleanup(): Promise<void>;
}
