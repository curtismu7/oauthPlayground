# Local Webhook Tunnel Setup for PingOne
<!-- markdownlint-disable -->

When you run the OAuth Playground on `https://localhost:3000`, PingOne cannot reach your machine directly. Use one of the tunnel tools below to expose the webhook endpoint (`/api/webhooks/pingone`) through a public HTTPS URL that you can configure in the PingOne Admin Console.

## Prerequisites

- macOS (instructions focus on Homebrew-based installs)
- The OAuth Playground running with HTTPS (the Vite dev server already serves `https://localhost:3000`)
- PingOne environment credentials stored in the Playground so the Webhook Viewer can fetch events

## Quick Checklist

| Task | Command | Notes |
| --- | --- | --- |
| Install Homebrew (if missing) | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` | Required for most tools |
| Start the dev server | `npm install && npm run dev` | Serves `https://localhost:3000` |
| Pick a tunnel (see sections below) | – | Each tool prints a public HTTPS URL |
| Configure PingOne | `https://<public-url>/api/webhooks/pingone` | Paste into the PingOne Webhook destination |
| Monitor traffic | Use the Webhook Viewer in the Playground | Requires environment ID + worker token |

## Option 1: Cloudflare Tunnel (Quick Tunnel, no account required)

1. Install or upgrade `cloudflared`:
   ```bash
   brew update
   brew install cloudflared
   # or if already installed
   brew upgrade cloudflared
   ```
2. Launch a quick tunnel (no certificate or configuration needed):
   ```bash
   cloudflared tunnel --url https://localhost:3000
   ```
3. Note the `https://...trycloudflare.com` URL printed in the console.
4. In PingOne, set the webhook destination to:
   ```
   https://<trycloudflare-subdomain>/api/webhooks/pingone
   ```
5. Keep the tunnel process running while you test.

### Optional: Named Cloudflare Tunnel (custom domain)
Requires a domain managed in Cloudflare.

1. Authenticate and download the origin cert:
   ```bash
   cloudflared login
   ```
   Approve the domain in the browser window that opens.
2. Create a named tunnel and map it to a hostname:
   ```bash
   cloudflared tunnel create webhook-playground
   cloudflared tunnel route dns webhook-playground webhooks.yourdomain.com
   cloudflared tunnel run webhook-playground --url https://localhost:3000
   ```
3. Use `https://webhooks.yourdomain.com/api/webhooks/pingone` in PingOne.

## Option 2: LocalTunnel (simple, npm-based)

1. Install globally or use `npx` each time:
   ```bash
   npm install -g localtunnel
   ```
2. Start the tunnel:
   ```bash
   lt --port 3000 --local-host localhost --https true --subdomain youralias
   ```
3. LocalTunnel prints a URL like `https://youralias.loca.lt`.
4. Use `https://youralias.loca.lt/api/webhooks/pingone` in PingOne.

> LocalTunnel is quick but sometimes unstable. If the tunnel drops, restart the command and update PingOne with the new URL.

## Option 3: inlets (self-hosted)

Use this when you control the exit node or want to avoid third-party tunnels.

1. Install the client:
   ```bash
   brew install inlets
   ```
2. On a cloud VM, run the exit server (example):
   ```bash
   inlets-pro tcp server --auto-tls --auto-tls-san webhooks.yourdomain.com
   ```
3. On your Mac, run the client:
   ```bash
   inlets-pro tcp client --url wss://webhooks.yourdomain.com --upstream localhost:3000
   ```
4. Map `https://webhooks.yourdomain.com/api/webhooks/pingone` in PingOne.

## Option 4: Tailscale Funnel

If your team uses Tailscale, enable [Tailscale Funnel](https://tailscale.com/kb/1223/funnel/) on your dev machine. Funnel exposes `https://localhost:3000` through a Tailscale-managed HTTPS endpoint without extra infrastructure.

## Verifying the Webhook

1. In the Playground, open **PingOne Webhook Viewer**.
2. Ensure your PingOne environment ID and a worker token (with `p1:read:webhooks p1:manage:webhooks`) are configured; the UI will display their status.
3. Click **Start Monitoring** to poll PingOne for events.
4. Trigger a webhook from PingOne (or wait for real events) and confirm they appear in the viewer.
5. Use the **Copy URL** button in the viewer to grab the `https://localhost:3000/api/webhooks/pingone` path used by the tunnel.

## Common Issues

| Symptom | Fix |
| --- | --- |
| `Cannot determine default origin certificate` from `cloudflared` | Upgrade to the latest build for quick tunnels, or run `cloudflared login` to download `~/.cloudflared/cert.pem` before using a named tunnel. |
| PingOne returns 400/401 after tunnel setup | Ensure the worker token you configured has `p1:read:webhooks p1:manage:webhooks` (or open any worker-token modal so the viewer can mint one). |
| Webhook viewer shows “Environment ID is missing” | Open the worker-token modal, enter your environment details, and generate credentials. |
| Tunnel URL changes on restart | Update the destination URL in PingOne each time the public URL changes, or use a named tunnel/domain. |
