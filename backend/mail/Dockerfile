# ---- Stage 1: build ----------------------------------------------------------
# Installs every dependency (including dev tools like TypeScript) and compiles
# TypeScript into dist/.
FROM node:24-alpine AS build
WORKDIR /app

# Copy the dependency manifests first: Docker caches this layer, so `npm ci` only
# re-runs when package*.json change, not on every code edit
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop devDependencies so they don't end up in the final image
RUN npm prune --omit=dev

# ---- Stage 2: run ------------------------------------------------------------
# A fresh, small image that only contains the compiled app and production dependencies
FROM node:24-alpine
WORKDIR /app
# Config comes from Docker (docker-compose.yml), not a .env file, so silence dotenv's startup tips
ENV NODE_ENV=production \
    DOTENV_CONFIG_QUIET=true

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Don't run the app as root inside the container
USER node

EXPOSE 5001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --start-interval=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5001) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
