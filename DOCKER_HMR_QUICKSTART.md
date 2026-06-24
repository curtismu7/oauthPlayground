# Docker HMR Quick Start

## Prerequisites
- Docker and Docker Compose installed
- `npm install` dependencies already installed (includes nodemon v3.0.2)

## Start Development

```bash
# First time setup
docker compose -f docker-compose.dev.yml up --build

# Subsequent runs
docker compose -f docker-compose.dev.yml up

# Stop containers
docker compose -f docker-compose.dev.yml down
```

## Access
- **Frontend**: https://localhost:8000
- **Backend Health**: https://localhost:5001/api/health

## What to Expect

### Frontend Changes
Edit any `.tsx`, `.ts`, or `.css` file in `src/` and watch the browser auto-refresh within 1-2 seconds.

Examples:
- Edit `src/v8/components/Home.tsx` → browser reloads
- Edit `src/v8/styles/global.css` → styles update in real-time
- Edit `public/index.html` → page reloads

### Backend Changes
Edit `server.js` or any file in `src/server/`, `src/api/`, or `lib/` and the Express server automatically restarts.

Examples:
- Edit `server.js` → server restarts (watch logs: `docker logs -f oauth-playground-backend-dev`)
- Edit `src/server/routes.js` → routes reload
- Edit `src/api/handlers.js` → handlers reload

Database persists across restarts via the `oauth-data-dev` Docker volume.

## Monitoring

```bash
# Watch frontend logs
docker logs -f oauth-playground-frontend-dev

# Watch backend logs
docker logs -f oauth-playground-backend-dev

# Watch both
docker logs -f oauth-playground-backend-dev & docker logs -f oauth-playground-frontend-dev
```

## Troubleshooting

**Frontend changes not appearing?**
- Stop: `docker compose -f docker-compose.dev.yml down`
- Restart: `docker compose -f docker-compose.dev.yml up`

**Backend not restarting?**
- Check logs: `docker logs oauth-playground-backend-dev | grep nodemon`
- Stop and rebuild: `docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up --build`

**Port conflicts?**
- Frontend uses 8000 (mapped from container port 5000)
- Backend uses 5001
- Make sure nothing else is listening on these ports

For detailed configuration, see [DOCKER_HMR_SETUP.md](./DOCKER_HMR_SETUP.md).
