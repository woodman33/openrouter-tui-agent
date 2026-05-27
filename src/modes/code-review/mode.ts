import type { Mode } from '../index.js';

export const CODE_REVIEW_MODE: Mode = {
  id: 'code-review',
  name: 'Code Review',
  icon: '🔍',
  description: 'Analyze diffs, suggest fixes, run tests',
  tools: ['get_current_time', 'file_read', 'file_write', 'file_edit', 'grep', 'glob', 'shell'],
  riveStates: {
    idle: 'idle',
    thinking: 'analyzing',
    streaming: 'reviewing',
    tool_call: 'wrench',
    error: 'error',
    success: 'done',
  },
};
