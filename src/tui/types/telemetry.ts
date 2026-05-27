/**
 * TIMMY TUI Telemetry Types Definitions
 */

export type TelemetryStatus = "online" | "offline" | "degraded" | "syncing";

export type TelemetryPriority = "critical" | "high" | "medium" | "low";

export type TelemetryEventName =
  | "thinking.start"
  | "thinking.end"
  | "stream.start"
  | "stream.delta"
  | "stream.end"
  | "tool.call"
  | "tool.result"
  | "cost.update"
  | "error"
  | "model.switch"
  | "mode.change"
  | "tmux.command.sent"
  | "tmux.output.line"
  | "approval.required"
  | "approval.granted"
  | "command.finished"
  | "receipt.generated"
  | "agent.intent"
  | "simulation.started"
  | "simulation.plan.created"
  | "simulation.score.created"
  | "simulation.finished"
  | "tui.heartbeat"
  | "tmux:output"; // backward compatibility legacy name

export interface TelemetryQueueItem {
  id: string;
  event: TelemetryEventName;
  operator: string;
  timestamp: number;
  mode: string;
  model: string;
  totalCost: number;
  activeRunId?: string;
  activeReceiptUrl?: string;
  payload: any;
  priority: TelemetryPriority;
  retries: number;
}
