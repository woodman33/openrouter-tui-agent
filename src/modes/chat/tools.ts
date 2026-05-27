import { tool } from '@openrouter/sdk/lib/tool.js';
import { z } from 'zod/v4';

export const summarizeTool = tool({
  name: 'summarize',
  description: 'Summarize a block of text',
  inputSchema: z.object({
    text: z.string().describe('The text to summarize'),
    maxLength: z.number().optional().describe('Maximum summary length'),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ text, maxLength = 200 }: { text: string; maxLength?: number }) => {
    const sentences = text.split(/[.!?]+/).filter(Boolean).slice(0, 3);
    const summary = sentences.join('. ').trim();
    return { summary: summary.slice(0, maxLength) + (summary.length > maxLength ? '...' : '') };
  },
} as any);
