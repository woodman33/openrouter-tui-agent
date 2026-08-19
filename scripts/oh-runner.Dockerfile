# TIMMY Phase C — ephemeral OpenHands runner container.
# The agent loop AND its tools execute inside this container against /work
# (the only mount). Versions pinned to the host uv tool environment so local
# and containerized runs are comparable.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends git nodejs \
    && rm -rf /var/lib/apt/lists/*

# pip's backtracking resolver dies on the lmnr↔opentelemetry conflict; uv
# resolves it exactly as the host tool environment (uv tool install openhands).
RUN pip install --no-cache-dir uv
RUN uv pip install --system --no-cache-dir \
    openhands-sdk==1.21.0 \
    openhands-tools==1.21.0 \
    openhands-workspace==1.11.1

# the default tool preset instantiates a browser tool; install Chromium so the
# container toolset matches the host run (parity, not decoration)
RUN uv pip install --system --no-cache-dir playwright \
    && playwright install --with-deps --no-shell chromium

# npm ships separately from nodejs on Debian; acceptance runs `npm test`.
# Own layer AFTER the expensive ones so cache survives future apt tweaks.
RUN apt-get update && apt-get install -y --no-install-recommends npm \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/openhands-sdk-bridge.py /bridge.py

WORKDIR /work
ENTRYPOINT ["python3", "/bridge.py"]
