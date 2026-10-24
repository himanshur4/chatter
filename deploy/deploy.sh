#!/usr/bin/env bash
# Deploys one version of Chatter. Runs ON the EC2 server.
#
# GitHub Actions calls it after every successful build of `main`
# (.github/workflows/ci-cd.yml), but you can also run it by hand on the server:
#   ./deploy.sh sha-<full git commit sha>
#
#   1. Safety checks: if one fails, nothing is changed
#   2. Pull the new images
#   3. Recreate the containers and wait until every health check passes
#   4. If anything is unhealthy, roll back to the version that was running before
set -euo pipefail
cd "$(dirname "$0")"

NEW_TAG="${1:?Usage: ./deploy.sh <image-tag>}"
PREV_TAG="$(cat .deployed_tag 2>/dev/null || true)"
APP_SERVICES=(user chat mail frontend)
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"   # seconds to wait for health checks

step() { printf '\n==> %s\n' "$*"; }

# Keeps IMAGE_TAG in .env pointing at the running version, so manual
# `docker compose ...` commands on the server use the same images
set_tag() {
  touch .env
  sed -i '/^IMAGE_TAG=/d' .env
  echo "IMAGE_TAG=$1" >> .env
}

step "Deploying $NEW_TAG (currently running: ${PREV_TAG:-nothing yet})"
docker compose version
# CI rewrites .env on every deploy, so point it back at the running version for now
if [ -n "$PREV_TAG" ]; then set_tag "$PREV_TAG"; fi

# --- 1. Safety checks ---------------------------------------------------------
# First deploy only: the old setup (PM2 processes, a manually started RabbitMQ container)
# must be stopped, or the ports would clash halfway through the deploy
if [ -z "$(docker compose ps -a -q)" ]; then
  step "First deploy: checking that the ports are free"
  busy=""
  for port in 3000 5000 5002 5672 15672; do
    # A process listening on the port, or another container publishing it
    if ss -Htln "sport = :$port" | grep -q . || [ -n "$(docker ps -q --filter "publish=$port")" ]; then
      busy="$busy $port"
    fi
  done
  if [ -n "$busy" ]; then
    echo "ERROR: port(s)$busy are in use, probably by the old PM2 processes or a manually"
    echo "started RabbitMQ container. Stop those first (docs/DEPLOYMENT.md, step 4)."
    echo "Nothing was changed."
    exit 1
  fi
fi

# --- 2. Pull the new images ---------------------------------------------------
step "Pulling images"
export IMAGE_TAG="$NEW_TAG"   # takes precedence over IMAGE_TAG in .env
# Images only run on the CPU type they were built for
server_arch="$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
if ! docker compose pull "${APP_SERVICES[@]}"; then
  echo "ERROR: couldn't pull the images. If the error above says \"no matching manifest\", they were"
  echo "built for another CPU type: set the DOCKER_PLATFORM repository variable to linux/$server_arch"
  echo "(docs/DEPLOYMENT.md). Nothing was changed."
  exit 1
fi
image_arch="$(docker image inspect --format '{{.Architecture}}' "$(docker compose config --images | grep chatter-user)")"
if [ "$server_arch" != "$image_arch" ]; then
  echo "ERROR: the images are built for $image_arch but this server is $server_arch."
  echo "Set the DOCKER_PLATFORM repository variable to linux/$server_arch (docs/DEPLOYMENT.md)."
  echo "Nothing was changed."
  exit 1
fi

# --- 3. Start the new version -------------------------------------------------
step "Starting containers and waiting for their health checks (up to ${WAIT_TIMEOUT}s)"
if docker compose up -d --no-build --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"; then
  set_tag "$NEW_TAG"
  echo "$NEW_TAG" > .deployed_tag
  docker compose ps
  step "Removing unused images older than a day"
  docker image prune -af --filter "until=24h" >/dev/null
  step "$NEW_TAG is live"
  exit 0
fi

# --- 4. Something is unhealthy: roll back -------------------------------------
step "Deploy failed. Container status:"
docker compose ps -a
# App logs are not printed here: GitHub Actions logs of a public repository are public
echo "See what went wrong on the server with:  cd $(pwd) && docker compose logs --tail 100"

if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$NEW_TAG" ]; then
  step "Rolling back to $PREV_TAG"
  if IMAGE_TAG="$PREV_TAG" docker compose up -d --no-build --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"; then
    echo "Rolled back: $PREV_TAG is running again."
  else
    echo "The rollback failed too. Check the logs on the server."
  fi
fi
exit 1
