import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/tui/utils/streammd.js';

const stripAnsi = (text: string): string => text.replace(/\u001b\[[0-9;]*m/g, '');

describe('renderMarkdown', () => {
  it('renders blockquote body text', () => {
    const rendered = stripAnsi(renderMarkdown('> quoted **assistant** text', 80).join('\n'));

    expect(rendered).toContain('quoted');
    expect(rendered).toContain('assistant');
    expect(rendered.trim().length).toBeGreaterThan(0);
  });
});
