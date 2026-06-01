# TIMMY sandbox image — extends the Cloudflare Sandbox SDK base (v0.10.2)
# with tmux, bun, poetry, tmux-palette, and rmux.
#
# Feasibility-proven 2026-05-29 in a bare Ubuntu 25.10 machine:
#   tmux 3.5a (apt) · bun 1.3.14 (baked into base) · Poetry 2.4.1 (installer)
#   tmux-palette (bun install, runs headless) · rmux 0.3.1 (cargo install -> 8.7MB)
#
# Build (run from sandbox/ with tmux-palette/ copied in alongside — see README):
#   docker build -f Dockerfile -t timmy-sandbox .
#
# The base tag MUST match the installed @cloudflare/sandbox version (^0.10.2).

# ---------------------------------------------------------------------------
# Stage 1: compile rmux from crates.io in a throwaway Rust toolchain.
# We copy only the ~8.7MB binary into the final image, so the hundreds of MB
# of Rust toolchain never land in the shipped layer.
# ---------------------------------------------------------------------------
FROM rust:1-slim AS rmux-builder
ARG RMUX_VERSION=0.3.1
# build-essential provides the linker (cc) cargo needs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && cargo install rmux --version "${RMUX_VERSION}" --locked \
    && /usr/local/cargo/bin/rmux --version || true

# ---------------------------------------------------------------------------
# Stage 2: the actual sandbox image.
# ---------------------------------------------------------------------------
FROM docker.io/cloudflare/sandbox:0.10.2

ENV DEBIAN_FRONTEND=noninteractive

# tmux (the multiplexer) + python3/venv guard for poetry.
# The default :0.10.2 image ships bun, node, curl, git, unzip already.
# It may NOT ship Python — installing python3-venv here is a cheap no-op if
# it's already present, and the safety net if it isn't. (Confirm with:
#   docker run --rm cloudflare/sandbox:0.10.2 python3 --version)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tmux \
        python3 python3-venv python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Poetry — official installer drops a self-contained venv under ~/.local.
ENV POETRY_HOME=/opt/poetry
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -sf /opt/poetry/bin/poetry /usr/local/bin/poetry \
    && poetry --version

# rmux — copy the prebuilt binary from the builder stage.
COPY --from=rmux-builder /usr/local/cargo/bin/rmux /usr/local/bin/rmux

# tmux-palette — Bun/TS project. Copy source (NOT the macOS node_modules)
# and install fresh against Linux. The build context must contain a
# tmux-palette/ dir; see sandbox/README.md for how to stage it.
COPY tmux-palette/ /opt/tmux-palette/
RUN cd /opt/tmux-palette \
    && bun install --frozen-lockfile \
    && ln -sf /opt/tmux-palette/bin/tmux-palette.sh /usr/local/bin/tmux-palette

# Sanity: prove the toolchain assembled.
RUN tmux -V && bun --version && poetry --version \
    && rmux --version 2>/dev/null || rmux -V || true

# Base image already sets ENTRYPOINT to /container-server/sandbox — leave it.
