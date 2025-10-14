# Restart Script Port Configuration Changes

## Summary
Updated `restart-servers.sh` to use **fixed ports** instead of environment variables to ensure consistency with OAuth Playground configuration.

## Changes Made

### 1. Fixed Port Configuration
**Before:**
```bash
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-3001}
```

**After:**
```bash
# Configuration - Fixed ports for OAuth Playground
# These ports are hardcoded to ensure consistency with OAuth redirect URIs
# and API endpoint configurations. Do not change these values.
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTP)
```

### 2. Updated Banner
Added port information to the startup banner:
```
║  Frontend: https://localhost:3000 (Vite Dev Server)                        ║
║  Backend:  http://localhost:3001  (Express API Server)                     ║
```

### 3. Updated Documentation
- Removed environment variable customization section
- Added clear port configuration section
- Emphasized that ports are fixed for OAuth consistency

## Why Fixed Ports?

1. **OAuth Redirect URIs**: The OAuth flows are configured with specific redirect URIs that expect port 3000
2. **API Endpoints**: Frontend is configured to call backend APIs on port 3001
3. **SSL Certificates**: HTTPS setup expects port 3000 for the frontend
4. **Consistency**: Eliminates confusion and ensures the playground works out-of-the-box

## Impact

- ✅ **More Reliable**: No port conflicts from environment variables
- ✅ **Consistent**: Always uses the same ports across all environments
- ✅ **OAuth Compatible**: Matches configured redirect URIs
- ✅ **Simplified**: No need to manage port environment variables

## Usage
The script now **always** uses:
- Frontend: `https://localhost:3000`
- Backend: `https://localhost:3001`

Run with: `./restart-servers.sh`

No environment variables needed or accepted for port configuration.

## NEW: Directory Detection Feature

### Added Smart Directory Detection
The script now automatically finds the OAuth Playground directory:

1. **Auto-Detection**: Checks common locations first
   - Current directory
   - `./oauth-playground`
   - `../oauth-playground` 
   - `~/oauth-playground`
   - `~/Projects/oauth-playground`
   - `~/Development/oauth-playground`
   - `~/Code/oauth-playground`
   - `~/Desktop/oauth-playground`
   - `~/Documents/oauth-playground`

2. **Interactive Prompt**: If not found, asks user for directory path
3. **Validation**: Ensures directory contains `package.json` and `server.js`
4. **Project Verification**: Confirms it's the OAuth Playground project

### Benefits
- ✅ **Run from anywhere**: No need to be in the project directory
- ✅ **Smart detection**: Finds common project locations automatically  
- ✅ **User-friendly**: Interactive prompt if auto-detection fails
- ✅ **Validation**: Ensures you're in the right directory before starting

## HTTPS Configuration Updates

### Both Servers Now Use HTTPS
- **Frontend**: Uses Vite with `@vitejs/plugin-basic-ssl` for self-signed certificates
- **Backend**: Generates self-signed certificates with OpenSSL, falls back to HTTP if needed
- **Health Checks**: Updated to handle HTTPS with `-k` flag for self-signed certificates
- **Proxy Configuration**: Vite proxy configured to use HTTPS backend with fallback support

### Security Benefits
- ✅ **Secure Communication**: All traffic encrypted between frontend and backend
- ✅ **OAuth Compliance**: HTTPS required for secure OAuth flows
- ✅ **Production-like**: Development environment matches production security
- ✅ **Automatic Fallback**: Backend falls back to HTTP if certificate generation fails

### Updated URLs
- Frontend: `https://localhost:3000` (unchanged)
- Backend: `https://localhost:3001` (changed from HTTP)

The restart script now properly handles HTTPS for both servers while maintaining backward compatibility through automatic HTTP fallback if certificate generation fails.