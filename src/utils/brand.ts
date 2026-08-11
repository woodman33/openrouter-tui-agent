// TIMMY brand system. Names live ONLY here so a rename is a one-file change
// and the "pick once, never rename" rule stays cheap to keep.

export const BRAND = {
  umbrella: 'TIMMY',
  tui: 'TIMMY TUI',
  // The adapting generation agent (absorbs tools/openrouter-agent):
  studios: 'TIMMY Studios',
  studiosEngine: 'Studios Engine',
  // The tldraw visual language / agent-authorable template layer:
  slate: 'TIMMY Slate',
  porter: 'TIMMY Porter',
  tagline: 'Receipts for everything.',
  studiosTagline: 'The adapting generation agent — any provider, every model, every receipt.',
  slateTagline: 'The visual language any agent can template.'
} as const;
