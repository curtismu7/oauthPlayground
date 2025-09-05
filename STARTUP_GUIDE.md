# OAuth Playground Startup Guide

## Quick Start

### Start Both Servers
```bash
./start-oauth-playground.sh
# or
npm start
# or
./start.sh
```

### Check Server Status
```bash
./start-oauth-playground.sh --check
# or
npm run status
```

### Stop All Servers
```bash
./start-oauth-playground.sh --stop
# or
npm run stop
```

## Common Issues & Solutions

### 🚨 "500 Internal Server Error" or "Failed to exchange code for tokens"

**Problem**: Backend server is not running

**Solution**:
```bash
# Start both servers
./start-oauth-playground.sh

# Or start just the backend
./start-oauth-playground.sh --backend-only

# Or manually
node server.js
```

### 🚨 "EADDRINUSE" Error

**Problem**: Ports 3000 or 3001 are already in use

**Solution**:
```bash
# Stop all servers first
./start-oauth-playground.sh --stop

# Or kill processes manually
lsof -ti:3000,3001 | xargs kill -9

# Then start again
./start-oauth-playground.sh
```

### 🚨 "command not found" Errors

**Problem**: Missing dependencies

**Solution**:
```bash
# Install all dependencies
npm install

# Install backend dependencies specifically
npm install express cors node-fetch dotenv
```

### 🚨 Configuration Errors

**Problem**: Missing or incorrect .env file

**Solution**:
1. Copy the example: `cp env.example .env`
2. Edit `.env` with your PingOne credentials:
   ```
   PINGONE_ENVIRONMENT_ID=your-environment-id
   PINGONE_CLIENT_ID=your-client-id
   PINGONE_CLIENT_SECRET=your-client-secret
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `./start-oauth-playground.sh` | Start both frontend and backend |
| `./start-oauth-playground.sh --frontend-only` | Start only frontend |
| `./start-oauth-playground.sh --backend-only` | Start only backend |
| `./start-oauth-playground.sh --check` | Check server status |
| `./start-oauth-playground.sh --stop` | Stop all servers |
| `./start-oauth-playground.sh --restart` | Restart all servers |
| `./start-oauth-playground.sh --help` | Show help |

## NPM Scripts

| Script | Command |
|--------|---------|
| `npm start` | Start both servers |
| `npm run start:frontend` | Start only frontend |
| `npm run start:backend` | Start only backend |
| `npm run status` | Check server status |
| `npm run stop` | Stop all servers |
| `npm run restart` | Restart all servers |

## Server URLs

- **Frontend**: https://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Token Exchange**: http://localhost:3001/api/token-exchange

## Logs

- **Frontend logs**: `logs/frontend.log`
- **Backend logs**: `logs/backend.log`

## Troubleshooting

1. **Check if servers are running**:
   ```bash
   ./start-oauth-playground.sh --check
   ```

2. **View logs**:
   ```bash
   tail -f logs/frontend.log
   tail -f logs/backend.log
   ```

3. **Restart everything**:
   ```bash
   ./start-oauth-playground.sh --restart
   ```

4. **Get help**:
   ```bash
   ./start-oauth-playground.sh --help
   ```
