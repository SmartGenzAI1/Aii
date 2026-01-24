# Production Dockerfile for GenZ AI Backend
# - Slim Python base
# - Non-root user
# - Gunicorn with Uvicorn workers
# - Installs only backend dependencies

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONFAULTHANDLER=1 \
    ENV=production \
    LOG_LEVEL=INFO

# System deps (minimal)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -ms /bin/bash appuser

WORKDIR /app

# Only copy backend requirements first for better layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

RUN python -m pip install --upgrade pip \
    && pip install -r /app/backend/requirements.txt

# Copy backend source code
COPY backend /app/backend

# Ensure runtime directory ownership
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Gunicorn with Uvicorn workers
# -w: workers (override with env WORKERS)
# --timeout: worker timeout seconds
# --graceful-timeout: time for graceful shutdown
# --keep-alive: seconds to keep connections alive
ENV WORKERS=4
CMD [ \
  "gunicorn", "backend.main:app", \
  "-k", "uvicorn.workers.UvicornWorker", \
  "-w", "${WORKERS}", \
  "-b", "0.0.0.0:8000", \
  "--timeout", "60", \
  "--graceful-timeout", "30", \
  "--keep-alive", "5" \
]