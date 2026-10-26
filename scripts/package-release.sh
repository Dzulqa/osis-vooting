#!/usr/bin/env bash
# Runs in CI after `next build`. Assembles a small, self-contained release tarball so the
# VPS never installs dependencies or builds anything.
set -euo pipefail
shopt -s nullglob

OUT="${1:-release.tar.gz}"

# Stop before shipping anything if a migration would delete production data
bash scripts/check-migrations.sh
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -r .next/standalone/. "$STAGE/"
mkdir -p "$STAGE/.next"
cp -r .next/static "$STAGE/.next/static"
# Gabungkan ke public/ (bukan "cp -r public $STAGE/public": bila standalone sudah punya
# folder public dari file tracing, isinya akan bersarang jadi public/public/)
mkdir -p "$STAGE/public"
cp -R public/. "$STAGE/public/"
cp ecosystem.config.js "$STAGE/"
cp scripts/deploy-remote.sh "$STAGE/deploy-remote.sh"

# Prisma: migrations are applied by the pinned CLI on the VPS (see deploy-remote.sh)
mkdir -p "$STAGE/prisma"
cp prisma/schema.prisma "$STAGE/prisma/"
cp -r prisma/migrations "$STAGE/prisma/migrations"
node -p "require('./node_modules/prisma/package.json').version" > "$STAGE/prisma/CLI_VERSION"

# Never ship secrets or things the app does not use at runtime
rm -f "$STAGE"/.env "$STAGE"/.env.*
rm -rf "$STAGE/node_modules/sharp" "$STAGE/node_modules/@img"

# Prisma runtime ships wasm/driver variants for every database; we only use MySQL + the native engine
(cd "$STAGE/node_modules/@prisma/client/runtime" &&
  rm -f *wasm-base64* *.wasm *cockroachdb* *postgresql* *sqlite* *sqlserver* query_compiler_* *.d.ts *.d.mts *.map)
(cd "$STAGE/node_modules/.prisma/client" &&
  rm -f *darwin* *windows* query_engine_bg.* wasm* edge.js)

# Every file in public/ must be served from the release root (e.g. /logo/alamanah.png)
if [ -d "$STAGE/public/public" ]; then
  echo "public/ got nested at public/public in the release" >&2
  exit 1
fi
(cd public && find . -type f) | while read -r f; do
  [ -f "$STAGE/public/$f" ] || { echo "Missing from release: public/${f#./}" >&2; exit 1; }
done

# The engine for the VPS must be present
if ! ls "$STAGE"/node_modules/.prisma/client/libquery_engine-*.so.node >/dev/null 2>&1; then
  echo "Prisma Linux query engine missing from the release" >&2
  exit 1
fi

# Password hashing (login) is a native module; its Linux build must be traced into the release
if ! ls "$STAGE"/node_modules/@node-rs/argon2-linux-*/ >/dev/null 2>&1; then
  echo "@node-rs/argon2 Linux binding missing from the release" >&2
  exit 1
fi

tar -C "$STAGE" -czf "$OUT" .
du -h "$OUT"
