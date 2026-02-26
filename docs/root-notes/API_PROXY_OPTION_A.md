# Option A — Proxy: Frontend on port 3000, proxy /api to backend

When the app is served at **https://api.pingdemo.com:3000** (or any host:3000) and the backend runs on **port 3001**, the server that serves the frontend must **proxy** `/api/*` to the backend so that `/api-status`, `/api/health`, and other API calls work.

## 1. Nginx (recommended if you control the server)

Use the example config and point it at your backend:

- **Config:** `config/nginx-api-proxy.conf.example`
- Set `root` to your built app directory (e.g. `dist`).
- Set `proxy_pass` in `location /api/` to your backend (e.g. `https://api.pingdemo.com:3001` or `https://127.0.0.1:3001`).
- Reload nginx after editing: `sudo nginx -t && sudo nginx -s reload`.

## 2. Node proxy server (no nginx)

If you prefer not to use nginx, run the included proxy server on port 3000; it serves the built app and proxies `/api` to the backend:

```bash
# Build the app
npm run build

# Backend must be running on 3001 (e.g. BACKEND_PORT=3001 node server.js)

# Start proxy on 3000 (serves dist + proxies /api to backend)
npm run start:frontend-proxy
```

Environment variables (optional):

- `FRONTEND_PORT` — port for the proxy (default: 3000)
- `BACKEND_URL` — backend base URL (default: https://localhost:3001)

The proxy listens on **HTTP**. For HTTPS in production, put nginx (or another TLS terminator) in front of it, or run the backend on the same port and serve the app from the backend (server.js already serves `dist` and `/api` when run on one port).

If the backend uses a self-signed certificate, set `NODE_TLS_REJECT_UNAUTHORIZED=0` when running the proxy (dev only).

Then open **http://localhost:3000** (or your host). `/api-status` and `/api/health` will work because `/api` is proxied to the backend.

## Summary

| Approach   | When to use                          |
|-----------|---------------------------------------|
| **Nginx** | You already use nginx in front of the app. |
| **Node**  | You want a single-command proxy without nginx. |

No frontend code changes are required; the app keeps using relative `/api/*` URLs.
