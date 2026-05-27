// Shared types for OpenRouter TUI

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  timestamp?: number;
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  fallbackModel?: string;
  instructions: string;
  maxSteps: number;
  maxCost: number;
  temperature?: number;
  maxOutputTokens?: number;
  telemetryUrl?: string;
}

export interface ModePanel {
  id: string;
  title: string;
  width?: number | 'auto';
  flexGrow?: number;
  component: string;
}

export interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: string;
  description: string;
}

export interface RiveStateMapping {
  idle: string;
  thinking: string;
  streaming: string;
  tool_call: string;
  error: string;
  success: string;
}

export interface GraphicsCapabilities {
  kittyGraphics: boolean;
  iterm2Images: boolean;
  sixel: boolean;
  trueColor: boolean;
  mouseEvents: boolean;
  cellSize: { width: number; height: number };
  program: string;
}

export type GraphicsPipelineType =
  | 'kitty'
  | 'iterm2'
  | 'sixel'
  | 'companion'
  | 'ansi';

export interface FrameMetadata {
  id: number;
  timestamp: number;
  width: number;
  height: number;
}
