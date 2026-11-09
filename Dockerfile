# syntax=docker/dockerfile:1
# Imagen de producción de KEY — The Spark Index.
# Targets:
#   tools  → node_modules completos + Prisma CLI (migraciones y seed)
#   runner → servidor Next.js standalone (lo que se publica)

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma necesita OpenSSL para su motor de migraciones.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS source
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# --- Migraciones y seed -------------------------------------------------------
FROM source AS tools
RUN mkdir -p storage/uploads && chown -R node:node storage
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# --- Build de Next.js ---------------------------------------------------------
# El build prerenderiza páginas que consultan la base de datos, así que necesita
# una DATABASE_URL alcanzable durante el build (ver deploy/docker-compose.yml).
FROM source AS builder
ARG DATABASE_URL
ENV NODE_ENV=production
RUN npm run build

# --- Imagen final -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p storage/uploads && chown -R node:node storage
USER node
EXPOSE 3000
CMD ["node", "server.js"]
