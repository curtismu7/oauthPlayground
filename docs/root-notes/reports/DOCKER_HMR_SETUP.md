# Docker Hot Module Reload (HMR) Configuration

This document describes the Docker HMR setup for the OAuth Playground. Changes to source files on the host machine are automatically reflected in Docker containers without requiring a rebuild.

## Architecture

### Frontend (Vite + React)
- **Port**: 8000 (mapped from container port 5000)
- **Technology**: Vite dev server with Hot Module Replacement
- **Watch mode**: File polling across Docker volume mounts (via CHOKIDAR_USEPOLLING)
- **HMR WebSocket**: Configured to connect to `localhost:8000` from the browser

### Backend (Express + Node.js)
- **Port**: 5001
- **Technology**: nodemon for auto-restart on file changes
- **Watch mode**: Monitors `server.js`, `src/server/`, `src/api/`, and `lib/` directories
- **Development-only**: nodemon only activates when `NODE_ENV=development` (set in docker-compose.dev.yml)

## File Structure

### Volume Mounts
```yaml
# Frontend volumes (docker-compose.dev.yml)
- ./src:/app/src                      # Source code (watched)
- ./public:/app/public:ro             # Static assets
- ./index.html:/app/index.html:ro
- ./vite.config.ts:/app/vite.config.ts:ro
- oauth-nm-dev:/app/node_modules      # Isolated Linux node_modules

# Backend volumes (docker-compose.dev.yml)
- ./server.js:/app/server.js:ro       # Entry point (watched)
- ./src/server:/app/src/server:ro     # Backend API (watched)
- ./src/api:/app/src/api:ro           # Shared API code (watched)
- ./lib:/app/lib:ro                   # Library code (watched)
- oauth-data-dev:/app/src/server/data # SQLite data persistence
```

## Configuration Files

### 1. docker-compose.dev.yml
Already configured for HMR:
- Frontend volume mounts for hot reload
- `CHOKIDAR_USEPOLLING=true` enables file watching across Docker volumes
- `VITE_HMR_CLIENT_PORT=8000` tells browser to connect to host port 8000 for HMR

### 2. Dockerfile.dev (Frontend)
Already configured:
- Runs `npx vite --host=0.0.0.0` to bind Vite to all interfaces
- node_modules in isolated container volume
- Source files mounted at runtime

### 3. Dockerfile.backend (Backend)
Updated for HMR:
- Conditional CMD: Uses `npx nodemon server.js` when `NODE_ENV=development`
- Falls back to `node server.js` for production

### 4. nodemon.json (NEW)
Configuration file for backend auto-restart:
```json
{
  "watch": ["server.js", "src/server", "src/api", "lib"],
  "ext": "js,json",
  "ignore": ["src/server/data", "node_modules", "dist", "coverage"],
  "delay": 500,
  "env": { "NODE_ENV": "development" },
  "exec": "node"
}
```

### 5. package.json
Added nodemon as devDependency:
```json
"nodemon": "^3.0.2"
```

### 6. vite.config.ts
Already configured for HMR:
- Conditional HMR config based on environment (lines 173-179)
- Disabled when custom HTTPS cert is used (to avoid WebSocket issues)
- Enabled by default with `{ port: 8000, host: 'localhost', clientPort: 8000 }`

## How to Use

### First Time Setup
```bash
# Install dependencies (including nodemon)
npm install

# Build and start containers
docker compose -f docker-compose.dev.yml up --build

# Access the app
# Frontend: https://localhost:8000
# Backend Health: https://localhost:5001/api/health
```

### Development Workflow

1. **Edit Frontend Code** (`src/**/*.tsx`, `src/**/*.css`, etc.)
   - Vite automatically detects changes
   - Browser page hot-reloads within seconds
   - No rebuild needed

2. **Edit Backend Code** (`server.js`, `src/server/`, `src/api/`, `lib/`)
   - nodemon detects changes
   - Backend automatically restarts
   - Database state persists (via `oauth-data-dev` volume)

3. **Update Configuration** (`package.json`, `vite.config.ts`, etc.)
   - Stop containers: `docker compose -f docker-compose.dev.yml down`
   - Rebuild and restart: `docker compose -f docker-compose.dev.yml up --build`

### Monitoring

Check container logs to see HMR activity:
```bash
# Frontend logs (watch for Vite compilation messages)
docker logs -f oauth-playground-frontend-dev

# Backend logs (watch for nodemon restart messages)
docker logs -f oauth-playground-backend-dev
```

## Troubleshooting

### Frontend Changes Not Appearing

**Symptom**: Edit a `.tsx` file, browser doesn't update
- Check `CHOKIDAR_USEPOLLING=true` is set in docker-compose.dev.yml
- Verify volume mounts: `docker inspect oauth-playground-frontend-dev | grep Mounts`
- Check browser console for connection errors
- Try a manual refresh (Cmd+Shift+R or Ctrl+Shift+R)

**Solution**:
1. Stop containers: `docker compose -f docker-compose.dev.yml down`
2. Restart: `docker compose -f docker-compose.dev.yml up`

### Backend Restart Not Triggering

**Symptom**: Edit `server.js`, backend doesn't restart
- Check nodemon is running: `docker logs -f oauth-playground-backend-dev`
- Verify volume mounts: `docker inspect oauth-playground-backend-dev | grep Mounts`
- Ensure `NODE_ENV=development` is set (check docker-compose.dev.yml)

**Solution**:
1. Stop containers: `docker compose -f docker-compose.dev.yml down`
2. Rebuild and restart: `docker compose -f docker-compose.dev.yml up --build`
3. Check that nodemon.json is included in image: `docker exec oauth-playground-backend-dev ls -la /app/nodemon.json`

### HMR WebSocket Connection Error

**Symptom**: Console shows "WebSocket connection failed" or HMR not working
- This is expected with custom HTTPS certs (vite.config.ts disables HMR in that case)
- On localhost without custom cert, HMR should work
- Try connecting to `https://localhost:8000` (not `https://api.ping.demo:8000`)

**Solution**:
1. Edit vite.config.ts and comment out the custom cert logic
2. Restart containers

## Performance Tuning

### Reduce File Watch Polling Frequency
If Docker is using too much CPU due to file polling:
```yaml
# In docker-compose.dev.yml for frontend service
environment:
  CHOKIDAR_INTERVAL: "1000"  # Increase from default 300ms
```

### Increase nodemon Restart Delay
If backend is restarting too frequently:
```json
// In nodemon.json
"delay": 1000  // Increase from 500ms
```

## Production Build

The HMR configuration only affects development:
- Production uses `docker-compose.yml` (not `docker-compose.dev.yml`)
- Production Dockerfile.backend runs plain `node server.js` (no nodemon)
- Production frontend is pre-built (`npm run build`) and served statically

## Key Environment Variables

| Variable | Frontend/Backend | Purpose |
|----------|------------------|---------|
| `NODE_ENV` | Both | Set to `development` for HMR, `production` for static build |
| `CHOKIDAR_USEPOLLING` | Frontend | Enable file polling across Docker volumes |
| `CHOKIDAR_INTERVAL` | Frontend | File poll frequency (ms) |
| `VITE_HMR_CLIENT_PORT` | Frontend | Browser's HMR WebSocket port (mapped host port) |
| `BROWSER` | Frontend | Set to `none` to prevent browser spawn in container |
| `BACKEND_PORT` | Backend | Express server port (default 5001) |

## References

- [Vite HMR Configuration](https://vitejs.dev/config/server-options.html#server-hmr)
- [nodemon Configuration](https://nodemon.io/config.html)
- [Chokidar File Watcher](https://github.com/paulmillr/chokidar)
- [Docker Compose Volumes](https://docs.docker.com/compose/compose-file/compose-file-v3/#volumes)
