#!/usr/bin/env bash
# One-time VPS setup for fe-suara. Run ON THE VPS as the deploy user (not root):
#   bash vps-setup.sh
# Safe to re-run: it never overwrites an existing shared/.env.
set -euo pipefail

BASE=/apps/fe-suara
DOMAIN=suara.smkalamanah.sch.id

echo "== Checks"
command -v node >/dev/null || { echo "node not found"; exit 1; }
command -v npm  >/dev/null || { echo "npm not found";  exit 1; }
command -v pm2  >/dev/null || { echo "pm2 not found (npm i -g pm2)"; exit 1; }
command -v curl >/dev/null || { echo "curl not found"; exit 1; }
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
NODE_MINOR="$(node -p "process.versions.node.split('.')[1]")"
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 6 ]; }; then
  echo "Node >= 20.6 required for --env-file (found $(node -v))"; exit 1
fi

echo "== Folders"
sudo mkdir -p "$BASE"
sudo chown -R "$USER":"$USER" "$BASE"
mkdir -p "$BASE/releases" "$BASE/shared/uploads" "$BASE/tools"

echo "== shared/.env"
if [ -f "$BASE/shared/.env" ]; then
  echo "exists, leaving it untouched"
else
  cat > "$BASE/shared/.env" <<EOF
# Fill every value, then re-run the deploy.
DATABASE_URL="mysql://suara:CHANGE_ME@127.0.0.1:3306/suara?connection_limit=5"

SCHOOL_API_URL="https://sinar.smkalamanah.sch.id/api/service"
SCHOOL_API_KEY=""
SCHOOL_API_SECRET=""

SESSION_TTL_HOURS=12
BOOTH_TOKEN_TTL_DAYS=3
AUTH_COOKIE_SECURE=true
APP_ORIGIN="https://$DOMAIN"
UPLOAD_DIR="$BASE/shared/uploads"

# First-run accounts: created on the first login attempt when the database has no users yet.
SEED_SUPERADMIN_USERNAME="superadmin"
SEED_SUPERADMIN_PASSWORD=""   # REQUIRED, min 8 characters
SEED_KETUA_PASSWORD=""        # optional; defaults to the superadmin password
EOF
  chmod 600 "$BASE/shared/.env"
  echo "created $BASE/shared/.env  <-- EDIT IT NOW"
fi

echo "== Old PM2 app (cluster mode) -> removed so the new fork config takes over"
pm2 delete suara >/dev/null 2>&1 && echo "deleted old 'suara'" || echo "no old 'suara' app"

echo "== PM2 on boot"
pm2 startup 2>&1 | grep -E "^sudo " || true   # prints one sudo command if not set up yet; run it once

echo "== Old deploy folder"
OLD=/home/deploy/apps/fe-suara
if [ -d "$OLD" ]; then
  echo "found $OLD (old node_modules + build, can be deleted):"
  du -sh "$OLD" 2>/dev/null || true
  echo "  remove with: rm -rf $OLD"
fi

cat <<EOF

== Next steps
1. Edit $BASE/shared/.env (DATABASE_URL password, SCHOOL_API_KEY/SECRET).
2. Create the MySQL database and user if they do not exist:
     sudo mysql -e "CREATE DATABASE IF NOT EXISTS suara CHARACTER SET utf8mb4;
                    CREATE USER IF NOT EXISTS 'suara'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
                    GRANT ALL ON suara.* TO 'suara'@'127.0.0.1'; FLUSH PRIVILEGES;"
3. Copy nginx.conf from the repo to /etc/nginx/sites-available/$DOMAIN,
   enable it, then: sudo nginx -t && sudo systemctl reload nginx
4. Add the GitHub secrets VPS_HOST, VPS_USERNAME, VPS_PORT, VPS_SSH_KEY (the NEW key).
5. Push to main (or run the workflow manually) to deploy.
EOF
