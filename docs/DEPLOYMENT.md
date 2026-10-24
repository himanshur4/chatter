# Deployment guide

How Chatter gets to production, how to set it up the first time, and how to operate it.
For *why* the pipeline is built this way, see [CI-CD.md](CI-CD.md).

```text
git push ──► GitHub Actions ──► builds 4 images ──► ghcr.io
                                     │
                                     └─(main)──► SSH to EC2 ──► deploy.sh ──► docker compose
                                                                   │
Browser ──► Cloudflare ──► Nginx (EC2:80) ──► 127.0.0.1:3000 / :5000 / :5002 (containers)
```

**On the server**, everything lives in `~/chatter-prod/`. CI writes these files on every deploy, so don't edit them by hand:

| File | Comes from |
|---|---|
| `docker-compose.yml`, `deploy.sh` | this repository |
| `.env` | `RABBITMQ_USER` / `RABBITMQ_PASS` (+ `IMAGE_TAG`, written by `deploy.sh`) |
| `backend/{user,chat,mail}/.env` | the `USER_ENV` / `CHAT_ENV` / `MAIL_ENV` secrets |

---

## One-time setup

### 1. Prepare the server

SSH in (keep your `.pem` key outside the project folder, e.g. in `~/.ssh/`):

```bash
ssh -i ~/.ssh/chatter123.pem ubuntu@<EC2_PUBLIC_IP>
```

Then check the following:

```bash
# Docker Compose v2.20+ is required
docker compose version
# If that fails:
sudo apt-get update && (sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose-v2)

# The deploy runs docker without sudo, so add your user to the docker group,
# then log out and back in
sudo usermod -aG docker $USER

# CPU type: x86_64 needs nothing; aarch64 means you must set DOCKER_PLATFORM (step 2)
uname -m

# Less than 2 GB of RAM? Add 2 GB of swap as a safety net
free -h
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile \
  && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Add secrets and variables to GitHub

In the repository, go to **Settings → Secrets and variables → Actions**.

**Secrets tab** (encrypted and hidden in logs):

| Name | Value |
|---|---|
| `EC2_HOST` | The server's public IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | The **entire** contents of your `.pem` file, including the `-----BEGIN…` and `-----END…` lines |
| `RABBITMQ_PASS` | A new strong password: `openssl rand -hex 24` |
| `USER_ENV` | Full contents of a production `backend/user/.env` (see [`.env.example`](../backend/user/.env.example)) |
| `CHAT_ENV` | Full contents of a production `backend/chat/.env` |
| `MAIL_ENV` | Full contents of a production `backend/mail/.env` |

> In production, `docker-compose.yml` sets `PORT`, `USER_SERVICE` and the three `Rabbitmq_*` values itself, so whatever those lines say in the secrets is ignored. If a value contains a `$`, write it as `$$`: Docker Compose treats `$` as the start of a variable.

**Variables tab** (plain settings):

| Name | Value |
|---|---|
| `DEPLOY_ENABLED` | `true`. **Set this last, in step 4.** Until then the pipeline builds images but never touches the server |
| `SITE_URL` | Optional. Defaults to `https://chatter-t.me`. Baked into the frontend as the API address |
| `DOCKER_PLATFORM` | Optional. Set to `linux/arm64` only if `uname -m` printed `aarch64` |
| `RABBITMQ_USER` | Optional. Defaults to `chatter` |

### 3. Push the code

Push to `main`. On the **Actions** tab you'll see four green **Build** jobs and a skipped **Deploy** job. That's expected: production hasn't been touched yet.

### 4. Switch the server from the old setup (one time, a few minutes of downtime)

The old Node processes and the manually started RabbitMQ container hold the ports the containers need. Stop them, but keep them around so you can switch back:

```bash
pm2 list                          # the old Node processes (if you used PM2)
docker ps                         # note the old RabbitMQ container's NAME
pm2 stop all
docker stop <old-rabbitmq-name>

# Should print nothing. If something is listed, stop that process too
sudo ss -ltnp | grep -E ':(3000|5000|5001|5002|5672|15672)\b'
```

Then set the `DEPLOY_ENABLED` variable to `true`, and on GitHub open **Actions → CI/CD → Run workflow**.

Nginx needs no changes: the containers use the same ports the old processes did. If you're unsure, `grep -R proxy_pass /etc/nginx/sites-enabled/` should show `localhost` or `127.0.0.1` with ports 3000, 5000 and 5002.

**If the site works**, remove the old setup so it doesn't start again after a reboot:

```bash
pm2 delete all && pm2 save
docker rm <old-rabbitmq-name>
```

**If it doesn't**, switch back and check the troubleshooting table below:

```bash
cd ~/chatter-prod && docker compose down
docker start <old-rabbitmq-name> && pm2 start all
```

### 5. Close the ports that no longer need to be public (recommended)

Everything now listens on `127.0.0.1`, so in the EC2 **security group** keep only inbound **22** (SSH) and **80** (HTTP), and delete the rules for 3000, 5000, 5001, 5002, 5672 and 15672.

- Port 22 has to stay reachable because GitHub's runners connect from changing IP addresses. EC2 only accepts SSH keys, not passwords.
- For extra hardening, allow port 80 only from [Cloudflare's IP ranges](https://www.cloudflare.com/ips/), and switch Cloudflare's SSL mode to *Full (strict)* with a Cloudflare origin certificate on Nginx.

---

## Day-to-day operations

| Task | How |
|---|---|
| **Deploy** | Push or merge to `main` |
| **Roll back** | Actions → open the last good run → **Re-run all jobs** (redeploys that commit) |
| **Change a secret** | Edit it in GitHub, then Actions → CI/CD → **Run workflow** |
| **Pause deploys** | Set `DEPLOY_ENABLED` to `false` |
| **Check status / logs** | On the server: `cd ~/chatter-prod && docker compose ps` and `docker compose logs -f user` |
| **Restart one service** | `cd ~/chatter-prod && docker compose restart chat` |
| **RabbitMQ dashboard** | `ssh -i ~/.ssh/chatter123.pem -L 15672:localhost:15672 ubuntu@<EC2_PUBLIC_IP>`, then open http://localhost:15672 |

A failed deploy rolls back by itself. The run shows ❌ and the previous version keeps serving traffic. App logs are deliberately not printed in the Actions log (it's public for a public repository). Read them on the server instead.

`deploy.sh` removes unused Docker images older than a day after each successful deploy, so the disk doesn't fill up. This assumes the server is dedicated to Chatter.

## Local development

```bash
cp .env.example .env              # choose a RabbitMQ user and password
docker compose up -d rabbitmq     # RabbitMQ on localhost:5672, dashboard on localhost:15672
```

In `backend/user/.env` and `backend/mail/.env`, set `Rabbitmq_Host=localhost` and the same username and password as in `.env`. Then run `npm run dev` in each service.

> After step 4, the production RabbitMQ is no longer reachable from your laptop. That's intentional, so use the local one. As a bonus, local testing no longer competes with production for OTP emails.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Deploy job is skipped | The `DEPLOY_ENABLED` variable isn't `true` |
| `Missing repository secrets: …` | Add the listed secrets (step 2) |
| `Permission denied (publickey)` | `EC2_SSH_KEY` must be the whole `.pem` file including the BEGIN/END lines, and `EC2_USER` must be `ubuntu` |
| `permission denied … docker.sock` | `sudo usermod -aG docker ubuntu`, then reconnect |
| `port(s) … are in use` | The old PM2 processes or RabbitMQ container are still running (step 4) |
| `no matching manifest` / wrong CPU type | Set `DOCKER_PLATFORM` to `linux/arm64` |
| `container … is unhealthy` | `docker compose logs <service>` on the server. Usually a wrong value in `USER_ENV` / `CHAT_ENV` / `MAIL_ENV` |
| Containers healthy but the site is down | Check Nginx: `sudo nginx -t` and its `proxy_pass` ports (step 4) |
| OTP emails don't arrive | `docker compose logs mail`. Check `RESEND_API_KEY`, and that `RESEND_FROM_EMAIL` uses a domain verified in Resend |
| Changed `RABBITMQ_PASS`, now services can't log in | RabbitMQ reads the password only on first start: `docker compose exec rabbitmq rabbitmqctl change_password chatter '<new password>'` |
