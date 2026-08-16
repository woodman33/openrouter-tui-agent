export interface MultiplexerManager {
  init(): void;
  spawnSession(id: string, name?: string): void;
  killSession(id: string): void;
  getCwd(id: string): string;
  capturePane(id: string): string[];
  sendCommand(id: string, command: string, approved?: boolean): Promise<void>;
  poll(): void;
  destroy(): void;
}
