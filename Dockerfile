# Built by GitHub Actions, never on the VPS.
# Same artifact the old scripts/package-release.sh produced (Next.js standalone), now inside an image.

# --- 1. Build ----------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# `next build` never connects to the database; these only satisfy tooling that reads the schema.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=mysql://build:build@127.0.0.1:3306/build \
    SHADOW_DATABASE_URL=mysql://build:build@127.0.0.1:3306/build_shadow
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# sharp/@img are unused (images are unoptimized); drop them as package-release.sh did
RUN rm -rf .next/standalone/node_modules/sharp .next/standalone/node_modules/@img
# Fail the build early if the Linux native pieces were not traced into the standalone output
RUN ls .next/standalone/node_modules/.prisma/client/libquery_engine-*.so.node >/dev/null \
 && ls -d .next/standalone/node_modules/@node-rs/argon2-linux-* >/dev/null \
 && test -f .next/standalone/server.js

# --- 2. Runtime ----------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=3008 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=256 \
    NEXT_TELEMETRY_DISABLED=1 \
    UPLOAD_DIR=/data/uploads
WORKDIR /app

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build --chown=node:node /app/prisma/migrations ./prisma/migrations

# Pinned Prisma CLI, used only for `migrate deploy` (same pin the old VPS script used)
COPY --from=build /app/node_modules/prisma/package.json /tmp/prisma-package.json
RUN mkdir -p /opt/prisma-cli && cd /opt/prisma-cli \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund --no-save "prisma@$(node -p "require('/tmp/prisma-package.json').version")" \
 && rm /tmp/prisma-package.json \
 && mkdir -p /data/uploads && chown -R node:node /data /opt/prisma-cli

USER node
EXPOSE 3008
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3008/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
