# ---- Stage 1: build ----------------------------------------------------------
# Installs every dependency (including dev tools like TypeScript and the Prisma CLI),
# generates the Prisma client and compiles TypeScript into dist/.
FROM node:24-alpine AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL
RUN apk add --no-cache openssl

# Copy the dependency manifests first: Docker caches this layer, so `npm ci` only
# re-runs when package*.json or the Prisma schema change, not on every code edit
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Drop devDependencies so they don't end up in the final image. `--omit=optional` is needed
# too: the Prisma CLI and TypeScript are optional peers of @prisma/client, so npm keeps them
# with --omit=dev alone. The generated client (node_modules/.prisma) is not affected.
RUN npm prune --omit=dev --omit=optional

# ---- Stage 2: run ------------------------------------------------------------
# A fresh, small image that only contains the compiled app and production dependencies
FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl
# Config comes from Docker (docker-compose.yml), not a .env file, so silence dotenv's startup tips
ENV NODE_ENV=production \
    DOTENV_CONFIG_QUIET=true

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Don't run the app as root inside the container
USER node

EXPOSE 5002
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --start-interval=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5002) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
