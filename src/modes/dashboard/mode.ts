import type { Mode } from '../index.js';

export const DASHBOARD_MODE: Mode = {
  id: 'dashboard',
  name: 'Dashboard',
  icon: '📊',
  description: 'Multi-panel overview: agents, models, resources',
  tools: [],
  riveStates: {
    idle: 'idle',
    thinking: 'calculating',
    streaming: 'displaying',
    tool_call: 'wrench',
    error: 'error',
    success: 'done',
  },
};
