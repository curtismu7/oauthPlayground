# Backend Server Setup for OAuth Token Exchange

## Overview

This backend server handles the OAuth token exchange with PingOne using Client Secret Basic authentication, keeping the client secret secure on the server side.

## Architecture

```
Frontend (SPA) → Backend Server → PingOne
     ↓              ↓              ↓
  Browser      Node.js/Express   OAuth Server
  (Public)     (Confidential)    (Client Secret Basic)
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
npm install express cors node-fetch dotenv nodemon
```

### 2. Environment Variables

The backend uses the same `.env` file as the frontend. Ensure these variables are set:

```env
PINGONE_ENVIRONMENT_ID=b9817c16-9910-4415-b67e-4ac687da74d9
PINGONE_CLIENT_ID=a4f963ea-0736-456a-be72-b1fa4f63f81f
PINGONE_CLIENT_SECRET=your_client_secret_here
PINGONE_API_URL=https://auth.pingone.com
```

### 3. Start the Application

#### Option A: Use the startup script (recommended)
```bash
./start-with-backend.sh
```

#### Option B: Start manually
```bash
# Terminal 1: Start backend server
node server.js

# Terminal 2: Start frontend
npm run dev
```

## API Endpoints

### POST /api/token-exchange

Exchanges authorization code for tokens using Client Secret Basic authentication.

**Request:**
```json
{
  "code": "authorization_code_from_pingone",
  "redirect_uri": "https://localhost:3000/callback",
  "code_verifier": "pkce_code_verifier"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJ...",
  "id_token": "eyJ...",
  "expires_at": 1234567890000,
  "refresh_expires_at": 1234567890000
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Benefits

1. **Client Secret Protection**: Client secret is never exposed to the browser
2. **Confidential Client**: Maintains PingOne's Client Secret Basic authentication
3. **PKCE Security**: Still uses PKCE for additional security
4. **CORS Protection**: Backend only accepts requests from authorized origins

## PingOne Configuration

Keep your PingOne application configured as:
- **Application Type**: Confidential Client
- **Token Endpoint Authentication Method**: Client Secret Basic
- **PKCE Enforcement**: REQUIRED
- **Grant Types**: Authorization Code

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js and npm are installed
- Check environment variables in `.env`

### CORS errors
- Ensure frontend is running on https://localhost:3000
- Check CORS configuration in server.js

### Token exchange fails
- Verify PingOne credentials in `.env`
- Check backend logs for detailed error messages
- Ensure PingOne application is configured correctly

## Development

### Backend Logs
The backend provides detailed logging for debugging:
- Request/response details
- PingOne API calls
- Error messages with correlation IDs

### Testing
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test token exchange (with valid parameters)
curl -X POST http://localhost:3001/api/token-exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"test","redirect_uri":"https://localhost:3000/callback","code_verifier":"test"}'
```



