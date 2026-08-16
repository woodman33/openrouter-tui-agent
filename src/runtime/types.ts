export type RuntimeTransport = 'spawn' | 'sdk' | 'remote';

export type RuntimeCapability =
  | 'analyze'
  | 'edit'
  | 'shell'
  | 'browser'
  | 'mcp'
  | 'sandbox'
  | 'resume'
  | 'streaming'
  | 'usage';

export type RuntimeRisk = 'read_only' | 'workspace_mutation' | 'host_mutation' | 'remote_mutation';

export interface RuntimeDescriptor {
  id: string;
  displayName: string;
  transport: RuntimeTransport;
  capabilities: RuntimeCapability[];
  risk: RuntimeRisk;
  command?: string;
  requiredEnv?: string[];
  documentationUrl?: string;
  maturity: 'mvp' | 'profile' | 'planned';
}

export interface RuntimeAvailability {
  available: boolean;
  version?: string;
  reason?: string;
  missingEnv?: string[];
}

export interface RunRequest {
  task: string;
  cwd: string;
  mode?: 'read_only' | 'write';
  model?: string;
  maxCostUsd?: number;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export interface RunPlan {
  runId: string;
  runtimeId: string;
  request: RunRequest;
  command?: string;
  args?: string[];
  risk: RuntimeRisk;
  approvalRequired: boolean;
  createdAt: string;
}

export interface ApprovedRunPlan extends RunPlan {
  approval?: {
    status: 'not_required' | 'approved';
    approvedAt?: string;
    approvedBy?: string;
  };
}

export type RuntimeEventType =
  | 'run.planned'
  | 'approval.required'
  | 'process.started'
  | 'output.stdout'
  | 'output.stderr'
  | 'usage.updated'
  | 'artifact.created'
  | 'workspace.changed'
  | 'run.completed'
  | 'run.failed';

export interface RuntimeEvent {
  runId: string;
  runtimeId: string;
  type: RuntimeEventType;
  timestamp: string;
  data?: Record<string, unknown>;
}

export type RuntimeEventSink = (event: RuntimeEvent) => void | Promise<void>;

export interface RuntimeUsage {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  estimatedCostUsd?: number;
  actualCostUsd?: number;
}

export interface RunResult {
  runId: string;
  runtimeId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  finishedAt: string;
  exitCode?: number | null;
  usage?: RuntimeUsage;
  artifacts?: string[];
  error?: string;
}

export interface AgentRuntime {
  readonly descriptor: RuntimeDescriptor;
  detect(): Promise<RuntimeAvailability>;
  plan(request: RunRequest): Promise<RunPlan>;
  execute(plan: ApprovedRunPlan, sink?: RuntimeEventSink): Promise<RunResult>;
  cancel(runId: string): Promise<boolean>;
}
