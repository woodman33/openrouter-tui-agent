import type { Mode } from '../index.js';

export const CHAT_MODE: Mode = {
  id: 'chat',
  name: 'Chat',
  icon: '💬',
  description: 'Conversational agent with streaming and tool use',
  tools: ['get_current_time', 'calculate', 'get_system_info', 'get_env'],
  riveStates: {
    idle: 'idle',
    thinking: 'thinking',
    streaming: 'talking',
    tool_call: 'wrench',
    error: 'error',
    success: 'success',
  },
};
