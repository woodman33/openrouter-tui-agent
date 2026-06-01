# TIMMY Sandbox image

Extends the Cloudflare Sandbox SDK base (`cloudflare/sandbox:0.10.2`, matching
`@cloudflare/sandbox@^0.10.2` in the repo) with the TIMMY terminal stack:

| Tool | Source | Notes |
|------|--------|-------|
| **tmux** 3.5a | `apt-get install tmux` | the multiplexer |
| **bun** 1.3.x | baked into the base image | 0 added cost |
| **poetry** 2.4.x | official installer | needs `python3` (guarded by apt install) |
| **tmux-palette** | `COPY` + `bun install` | Bun/TS palette popup; depends on tmux + bun |
| **rmux** 0.3.1 | `cargo install rmux` (crates.io) | Rust tmux reimpl; built in a throwaway stage, only the 8.7 MB binary is copied in |

All five were install-tested on a bare Ubuntu 25.10 machine on 2026-05-29 (a
barer proxy than the Ubuntu 22.04 base), so the base — which already ships
bun/node/unzip — is a strict superset.

## Build

The build context needs a copy of the `tmux-palette` source (without its macOS
`node_modules`). Stage it next to the Dockerfile, then build:

```bash
cd sandbox
rsync -a --exclude node_modules --exclude .git ~/Sites/tmux-palette/ ./tmux-palette/
docker build -f Dockerfile -t timmy-sandbox .
```

`tmux-palette/` is gitignored here — it's vendored at build time, not committed.

## Base image inventory (confirmed 2026-05-30)

`cloudflare/sandbox:0.10.2` = Ubuntu 22.04.5, linux/amd64, 847 MB. Verified by
running the image:

- **Present:** bun 1.3.12, node v22.22.3, npm 10.9.8, unzip, curl, git
- **Absent:** python3 / pip3 (so the `python3*` apt install is **mandatory** —
  poetry can't install without it), tmux, cargo

Nothing optional to trim here; every install line in the Dockerfile is required.
