# PayoutBridge backend — Python 3.12 (FastAPI/uvicorn) + Node 22 (Xero MCP subprocess).
# Build context MUST be repo root: docker build -f src/backend/Dockerfile .
# (uvicorn needs the `backend` package importable from src/, so we copy src/ as-is.)

FROM python:3.12-slim

# Node 22.x via NodeSource, so `npx -y @xeroapi/xero-mcp-server@latest` (spawned by
# xero_client.py at runtime) has a working `npx` on PATH next to python/uvicorn.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/src

COPY src/backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Pre-warm the MCP server package into npm's cache so the first real request isn't
# slowed down by an on-demand npx download (best-effort; ignore failure at build time).
RUN npx -y @xeroapi/xero-mcp-server@latest --help > /dev/null 2>&1 || true

COPY src/backend backend
COPY src/data data

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Runs from src/ so `backend.main:app` resolves relative imports correctly
# (per CLAUDE.md: uvicorn main:app from inside src/backend fails).
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
