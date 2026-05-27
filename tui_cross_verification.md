# Cross-Verification: TUI Apps Research

## High Confidence (Confirmed by ≥2 sources)

### The Undisputed Top Tier
- **lazygit** (76K stars): Confirmed as #1 Git TUI by wide01, wide06, multiple blog posts [^820^]
- **k9s** (33.7K stars): Confirmed as standard K8s TUI by wide02, multiple sources
- **btop++** (32.5K stars): Confirmed as most popular system monitor by wide02
- **lazydocker** (51.2K stars): Confirmed as essential Docker TUI by wide02
- **helix** (35K stars): Confirmed as top post-vim editor by wide01, wide06
- **delta** (29.6K stars): Confirmed as standard diff tool by wide01
- **fzf** (~59K stars): Confirmed as universal fuzzy finder by wide06, landscape scan
- **ripgrep** (~64K stars): Confirmed as grep replacement by wide06, landscape scan
- **bat** (~59K stars): Confirmed as cat replacement by wide06, wide01
- **zellij** (~30-33K stars): Confirmed as leading tmux alternative by wide04, wide06
- **atuin** (~25K stars): Confirmed by landscape scan, wide06
- **yazi** (growing fast): Confirmed as fastest file manager by wide06, landscape scan
- **chafa** (4.9K): Confirmed as gold standard image-to-ASCII by wide03
- **neovim** (~99.9K): Confirmed as modern vim champion by wide06
- **Ghostty**: Confirmed as modern terminal emulator by landscape scan [^818^]

### tmux Ecosystem (Confirmed by wide04 + wide06)
- tmux + TPM + resurrect + continuum = essential foundation
- zellij wins on UX/modern features; tmux wins on ubiquity
- gpakosz/.tmux (25K stars) = best config framework
- vim-tmux-navigator (6.2K) = essential navigation

### Cloudflare (Confirmed by wide05 + direct searches)
- wrangler v4.x = essential CLI for Workers
- cloudflared = tunnel management
- No native TUI analytics dashboard exists (GAP identified)
- rclone + ncdu = best R2 storage TUI

## Medium Confidence
- **Crush** (charmbracelet AI agent): Single source [^816^] but credible (charm ecosystem)
- **Codex CLI** (75.6K): OpenAI official but very new (2026)
- **sqlit-tui** for Cloudflare D1: Single source, niche tool
- **tealdeer** vs **tldr** Rust: Competing implementations

## Conflict Zones
- **zellij vs tmux**: Not a true conflict — both are valid. zellij for local, tmux for remote.
- **helix vs neovim**: Helix for simplicity (post-modal), Neovim for extensibility. Different use cases.
- **yazi vs ranger**: yazi wins on speed (Rust + async I/O); ranger wins on maturity and Python ecosystem
- **eza vs lsd**: Both compete as ls replacements. eza has more stars but lsd has more features.

## Key Gaps Identified
1. **No Cloudflare Analytics TUI** — biggest opportunity
2. **No mature Terraform/Pulumi TUI** — pug exists but niche
3. **tmux AI integration** still early stage
4. **Cloudflare D1 TUI** — only sqlit-tui partially covers
