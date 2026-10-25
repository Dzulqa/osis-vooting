#!/usr/bin/env sh
# Runs `docker compose` (plugin) or falls back to the standalone `docker-compose` binary.
if docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
else
  exec docker-compose "$@"
fi
