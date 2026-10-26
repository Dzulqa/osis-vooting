#!/usr/bin/env bash
# Runs in CI before packaging. `prisma migrate deploy` applies every pending migration to the
# production database as-is, so a migration that deletes data must say so explicitly.
# Destructive statements: DROP TABLE, DROP COLUMN, TRUNCATE, DELETE FROM.
# To allow one on purpose, add a line to that migration.sql:   -- allow-destructive: <why>
set -euo pipefail
shopt -s nullglob

PATTERN='^[[:space:]]*(DROP[[:space:]]+TABLE|TRUNCATE|DELETE[[:space:]]+FROM)|DROP[[:space:]]+COLUMN'
failed=0

for file in prisma/migrations/*/migration.sql; do
  if grep -qiE '^[[:space:]]*--[[:space:]]*allow-destructive:' "$file"; then
    continue
  fi
  hits="$(grep -inE "$PATTERN" "$file" || true)"
  if [ -n "$hits" ]; then
    echo "::error file=$file::Destructive SQL without an '-- allow-destructive: <reason>' line" >&2
    echo "$file:" >&2
    echo "$hits" | sed 's/^/    /' >&2
    failed=1
  fi
done

if [ "$failed" -eq 1 ]; then
  echo "Refusing to deploy: these migrations would delete production data (see above)." >&2
  exit 1
fi
echo "Migrations OK: no unapproved destructive statements"
