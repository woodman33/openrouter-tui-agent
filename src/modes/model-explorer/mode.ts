import type { Mode } from '../index.js';

export const MODEL_EXPLORER_MODE: Mode = {
  id: 'model-explorer',
  name: 'Model Explorer',
  icon: '🧠',
  description: 'Browse OpenRouter models, compare, select',
  tools: ['get_current_time', 'calculate'],
  riveStates: {
    idle: 'idle',
    thinking: 'searching',
    streaming: 'listing',
    tool_call: 'wrench',
    error: 'error',
    success: 'done',
  },
};
