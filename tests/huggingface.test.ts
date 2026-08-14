import { describe, expect, it } from 'vitest';
import { detectHf } from '../src/utils/huggingface.js';

describe('huggingface connector', () => {
  it('reads the token from env first', () => {
    const prev = process.env.HF_TOKEN;
    process.env.HF_TOKEN = 'hf_test_123';
    try {
      const st = detectHf();
      expect(st.token).toBe('hf_test_123');
      expect(st.source).toContain('env');
    } finally {
      if (prev === undefined) delete process.env.HF_TOKEN;
      else process.env.HF_TOKEN = prev;
    }
  });

  it('never stores or fabricates a token', () => {
    const prev = process.env.HF_TOKEN;
    delete process.env.HF_TOKEN;
    delete process.env.HUGGINGFACE_TOKEN;
    delete process.env.HUGGING_FACE_TOKEN;
    try {
      const st = detectHf();
      // either the real hf cache exists (token from cache) or an honest note
      if (!st.token) expect(st.note).toContain('hf auth login');
      else expect(st.source).toContain('cache');
    } finally {
      if (prev !== undefined) process.env.HF_TOKEN = prev;
    }
  });
});
