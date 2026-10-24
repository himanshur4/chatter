# ---- Stage 1: build ----------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Copy the dependency manifests first: Docker caches this layer, so `npm ci` only
# re-runs when package*.json change, not on every code edit
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are baked into the browser JavaScript during `next build`,
# so they must be passed in as build arguments (see docker-compose.yml and the CI workflow)
ARG NEXT_PUBLIC_USER_SERVICE_URL
ARG NEXT_PUBLIC_CHAT_SERVICE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 2: run ------------------------------------------------------------
# `output: "standalone"` (next.config.ts) makes Next.js emit a minimal server.js with only
# the node_modules it actually uses, so this image needs no `npm install` at all
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

# Don't run the app as root inside the container
USER node

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --start-interval=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
