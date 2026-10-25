#!/usr/bin/env bash
# Runs on the VPS (as the deploy user) from inside the freshly extracted release directory.
# Zero builds, zero `npm install` of the app. Layout under /apps/fe-suara:
#   releases/<sha>/   one directory per deploy (kept: last 3)
#   current -> releases/<sha>
#   shared/.env       secrets (never overwritten by deploys)
#   shared/uploads/   candidate photos etc. (UPLOAD_DIR)
#   tools/            pinned prisma CLI, reinstalled only when its version changes
set -euo pipefail

BASE=/apps/fe-suara
RELEASE="$(pwd)"
PORT="${PORT:-3008}"
KEEP=3

[ -f "$BASE/shared/.env" ] || { echo "Missing $BASE/shared/.env"; exit 1; }
mkdir -p "$BASE/shared/uploads" "$BASE/tools"

# --- 1. Database migrations (only when something is pending) -----------------------------
WANT="$(cat prisma/CLI_VERSION)"
HAVE="$(node -p "require('$BASE/tools/node_modules/prisma/package.json').version" 2>/dev/null || true)"
if [ "$WANT" != "$HAVE" ]; then
  echo "Installing prisma@$WANT CLI into tools/ (one-off)"
  (cd "$BASE/tools" && npm init -y >/dev/null 2>&1 || true
   nice -n 10 npm install --no-audit --no-fund --no-save --loglevel=error "prisma@$WANT")
fi

set -a; . "$BASE/shared/.env"; set +a
# The schema references SHADOW_DATABASE_URL and Prisma insists it differs from DATABASE_URL,
# but `migrate deploy` never connects to it. A placeholder name is enough.
export SHADOW_DATABASE_URL="${SHADOW_DATABASE_URL:-mysql://unused:unused@127.0.0.1:3306/unused_shadow}"
nice -n 10 node "$BASE/tools/node_modules/prisma/build/index.js" migrate deploy --schema prisma/schema.prisma

# --- 2. Switch + restart ---------------------------------------------------------------------
PREVIOUS="$(readlink -f "$BASE/current" 2>/dev/null || true)"
ln -sfn "$RELEASE" "$BASE/current"
pm2 startOrReload "$BASE/current/ecosystem.config.js" --update-env

# --- 3. Health check, roll back on failure ---------------------------------------------------
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    echo "Healthy after ${i} check(s)"
    pm2 save >/dev/null
    # --- 4. Prune old releases ---------------------------------------------------------------
    ls -1dt "$BASE"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
    exit 0
  fi
  sleep 2
done

echo "Health check failed, rolling back" >&2
pm2 logs suara --lines 30 --nostream >&2 || true
if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
  ln -sfn "$PREVIOUS" "$BASE/current"
  pm2 startOrReload "$BASE/current/ecosystem.config.js" --update-env
fi
exit 1
