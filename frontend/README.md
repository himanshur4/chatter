# Chatter: frontend

The Next.js 16 (App Router) client for Chatter. See the [main README](../README.md) for the architecture, features and full setup.

| Path | Contents |
|---|---|
| `src/app/` | Routes: `/login`, `/verify`, `/chat`, `/profile` |
| `src/components/` | Chat UI (sidebar, header, messages, input) and shadcn/ui primitives |
| `src/context/` | `AppContext` (auth, users, chats) and `SocketContext` (Socket.IO connection, online users) |

```bash
cp .env.example .env   # API URLs (baked into the bundle at build time)
npm install
npm run dev            # http://localhost:3000
```

In production the app runs from the Docker image built by [`Dockerfile`](Dockerfile) (`output: "standalone"`).
