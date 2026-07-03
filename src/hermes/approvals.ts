// Approve / reject / respond helpers for Hermes blocking requests.
//
// Safety rule enforced here: answers to `secret` and `sudo` requests are sent
// to the gateway but NEVER recorded — receipts and logs only ever see a
// placeholder summary. Approval/clarify answers are recorded after redaction.

import { redactString } from '../utils/redact.js';
import type { HermesApproval } from './events.js';

/**
 * ASSUMPTION (kept alongside client.ts assumptions): the gateway's approval
 * gate stores the raw answer string; the Hermes reference TUI answers
 * approvals with y/n.
 */
export const APPROVE_ANSWER = 'y';
export const REJECT_ANSWER = 'n';

export type RespondKind = HermesApproval['kind'];

export interface PreparedResponse {
  kind: RespondKind;
  requestId: string;
  /** Raw answer to transmit to the gateway. */
  answer: string;
  /** What receipts/logs are allowed to record about this response. */
  responseSummary: string;
  status: HermesApproval['status'];
}

export function prepareApprove(approval: HermesApproval): PreparedResponse {
  return {
    kind: approval.kind,
    requestId: approval.id,
    answer: APPROVE_ANSWER,
    responseSummary: 'approved',
    status: 'approved',
  };
}

export function prepareReject(approval: HermesApproval): PreparedResponse {
  return {
    kind: approval.kind,
    requestId: approval.id,
    answer: REJECT_ANSWER,
    responseSummary: 'rejected',
    status: 'rejected',
  };
}

export function prepareTextResponse(approval: HermesApproval, text: string): PreparedResponse {
  const isSensitive = approval.kind === 'secret' || approval.kind === 'sudo';
  return {
    kind: approval.kind,
    requestId: approval.id,
    answer: text,
    responseSummary: isSensitive
      ? `[${approval.kind.toUpperCase()}_ANSWER_PROVIDED]`
      : redactString(text).slice(0, 200),
    status: 'answered',
  };
}
