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
PRISMA="$BASE/tools/node_modules/prisma/build/index.js"

# Deploys never reset or re-seed the database: only pending migration files are applied.
# Before applying any, take a full backup (kept: last 10) so a bad migration can be undone.
STATUS="$(node "$PRISMA" migrate status --schema prisma/schema.prisma 2>&1 || true)"
if printf '%s' "$STATUS" | grep -q "not yet been applied"; then
  echo "Pending migrations detected; backing up the database first"
  mkdir -p "$BASE/shared/backups"
  BACKUP="$BASE/shared/backups/before-$(basename "$RELEASE")-$(date +%Y%m%d-%H%M%S).sql.gz"
  # Credentials come from DATABASE_URL; the password goes via MYSQL_PWD, not the process list
  eval "$(node -e '
    const u = new URL(process.env.DATABASE_URL);
    const q = (v) => "\x27" + String(v).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
    console.log("DB_USER=" + q(decodeURIComponent(u.username)));
    console.log("DB_PASS=" + q(decodeURIComponent(u.password)));
    console.log("DB_HOST=" + q(u.hostname));
    console.log("DB_PORT=" + q(u.port || "3306"));
    console.log("DB_NAME=" + q(u.pathname.replace(/^\//, "")));
  ')"
  command -v mysqldump >/dev/null || { echo "mysqldump not installed; refusing to migrate without a backup" >&2; exit 1; }
  if ! MYSQL_PWD="$DB_PASS" mysqldump --single-transaction --routines --triggers --no-tablespaces \
      -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" | gzip > "$BACKUP.partial"; then
    rm -f "$BACKUP.partial"
    echo "Database backup failed; refusing to apply migrations" >&2
    exit 1
  fi
  mv "$BACKUP.partial" "$BACKUP"
  chmod 600 "$BACKUP"
  echo "Backup saved: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
  ls -1t "$BASE"/shared/backups/*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
fi

nice -n 10 node "$PRISMA" migrate deploy --schema prisma/schema.prisma

# --- 2. Switch + restart ---------------------------------------------------------------------
[ -f "$RELEASE/ecosystem.config.js" ] || { echo "ecosystem.config.js missing from $RELEASE"; ls -la "$RELEASE"; exit 1; }
[ -f "$RELEASE/server.js" ] || { echo "server.js missing from $RELEASE"; ls -la "$RELEASE"; exit 1; }

PREVIOUS="$(readlink -f "$BASE/current" 2>/dev/null || true)"
# `current` must be a symlink; a real directory there would swallow the new link inside it
if [ -e "$BASE/current" ] && [ ! -L "$BASE/current" ]; then
  mv "$BASE/current" "$BASE/current.old-$(date +%s)"
  PREVIOUS=""
fi
ln -sfn "$RELEASE" "$BASE/current"
[ -f "$BASE/current/ecosystem.config.js" ] || { echo "current -> $(readlink "$BASE/current") has no ecosystem.config.js"; exit 1; }

# The previous setup ran 'suara' as a cluster app from another folder; a reload cannot change that.
if pm2 describe suara 2>/dev/null | grep -qiE "exec mode.*cluster"; then
  echo "Removing old cluster-mode 'suara' app"
  pm2 delete suara
fi
pm2 startOrReload "$RELEASE/ecosystem.config.js" --update-env

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
  pm2 startOrReload "$PREVIOUS/ecosystem.config.js" --update-env
fi
exit 1
