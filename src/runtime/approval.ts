import type { ApprovedRunPlan, RunPlan, RuntimeDescriptor } from './types.js';

export function requiresApproval(descriptor: RuntimeDescriptor, mode: 'read_only' | 'write' = 'read_only'): boolean {
  if (mode === 'write') return true;
  return descriptor.risk !== 'read_only';
}

export function approveRunPlan(plan: RunPlan, approvedBy = 'local-operator'): ApprovedRunPlan {
  return {
    ...plan,
    approval: plan.approvalRequired
      ? { status: 'approved', approvedAt: new Date().toISOString(), approvedBy }
      : { status: 'not_required' },
  };
}

export function assertPlanApproved(plan: ApprovedRunPlan): void {
  if (plan.approvalRequired && plan.approval?.status !== 'approved') {
    throw new Error(`Runtime run ${plan.runId} requires explicit approval`);
  }
}
