# MasterFlow API - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Environment Setup

```bash
# Clone and install
git clone <repo-url>
cd oauth-playground
npm install

# Setup environment
cp .env.example .env
# Edit .env with your PingOne credentials
```

### 2. Required PingOne Resources

#### Minimum Required: 2 Applications

**Application 1: Web App**

- Type: Web Application
- Grant Types: Authorization Code, Client Credentials
- **Redirect URI**: `https://api.pingdemo.com/callback`
- Scopes: `openid`, `profile`, `email`

**Application 2: Worker Token**

- Type: Service/M2M
- Grant Types: Client Credentials
- Scopes: `pingone:api:read`, `pingone:api:write`, `pingone:protect:admin`

### 3. Environment Variables (.env)

```bash
# Required - Get from PingOne Admin Console
PINGONE_ENVIRONMENT_ID=your-env-id
PINGONE_CLIENT_ID=your-web-app-client-id
PINGONE_CLIENT_SECRET=your-web-app-secret
PINGONE_REDIRECT_URI=https://api.pingdemo.com/callback

# Worker Token (for advanced features)
PINGONE_WORKER_CLIENT_ID=your-worker-client-id
PINGONE_WORKER_CLIENT_SECRET=your-worker-secret

# URLs (usually these)
PINGONE_API_URL=https://api.pingone.com
PINGONE_ISSUER=https://auth.pingone.com/your-env-id
```

### 4. Start Application

```bash
npm start
```

Visit: https://api.pingdemo.com

---

## 📱 Main Flows Overview

### 🔐 Authentication Flows

| Flow                     | Use Case       | Setup Required         | Location                           |
| ------------------------ | -------------- | ---------------------- | ---------------------------------- |
| **Authorization Code**   | Web login, SSO | Web App + Redirect URI | OAuth Flows → Authorization Code   |
| **Client Credentials**   | API-to-API     | Service App            | OAuth Flows → Client Credentials   |
| **ROPC**                 | Trusted apps   | User credentials       | OAuth Flows → ROPC                 |
| **Device Authorization** | TV/IoT devices | Device Auth enabled    | OAuth Flows → Device Authorization |

### 🛡️ MFA Flows

| Flow                 | Use Case             | Setup Required         | Location                             |
| -------------------- | -------------------- | ---------------------- | ------------------------------------ |
| **MFA Registration** | Register MFA devices | Worker token + Protect | MFA Flows → Unified MFA Registration |
| **SMS Testing**      | SMS MFA              | SMS provider           | Communication Flows → SMS            |
| **Email Testing**    | Email MFA            | Email provider         | Communication Flows → Email          |
| **WhatsApp Testing** | WhatsApp MFA         | WhatsApp API           | Communication Flows → WhatsApp       |

---

## 🎯 Quick Testing Scenarios

### Scenario 1: Basic Web Login (Authorization Code)

1. Go to **OAuth Flows → Authorization Code**
2. Client ID/Secret should auto-populate from .env
3. Click "Authorize"
4. Login with PingOne credentials
5. Receive tokens and user info

### Scenario 2: API Access (Client Credentials)

1. Go to **OAuth Flows → Client Credentials**
2. Click "Request Token"
3. Receive access token immediately
4. Test API calls with token

### Scenario 3: MFA Device Registration

1. Go to **MFA Flows → Unified MFA Registration**
2. Configure worker token (if not done)
3. Enter user email/phone
4. Choose MFA method (SMS/Email/TOTP)
5. Complete registration flow

### Scenario 4: Device Authorization (Smart TV)

1. Go to **OAuth Flows → Device Authorization**
2. Click "Request Device Authorization"
3. Note the user code (e.g., "ABCD-EFGH")
4. Visit verification URL on phone
5. Enter code and approve
6. Return to original device and click "Poll for Token"

---

## 🔧 Configuration Pages

### Main Configuration

**Location**: Configuration → General

- Verify PingOne connection
- Test API connectivity
- Check environment variables

### API Keys

**Location**: Configuration → API Keys

- Add PingOne API keys for enhanced features
- Test key connectivity
- Monitor usage

### Worker Token

**Location**: Worker Token (sidebar)

- Configure worker application credentials
- Monitor token status
- Auto-refresh settings

---

## 🚨 Common Issues & Solutions

### "Invalid redirect URI"

**Fix**: Ensure PingOne app has exact redirect URI: `http://localhost:3000/callback`

### "Worker token not found"

**Fix**:

1. Go to Worker Token section
2. Click "Get Token"
3. Enter worker app credentials
4. Save configuration

### "API Key Not Set"

**Fix**:

1. Go to Configuration → API Keys
2. Add your PingOne API key
3. Test connectivity

### "Invalid user code" (Device Auth)

**Fix**: User codes expire in 30 minutes. Request a new device authorization.

---

## 📊 Monitoring & Debugging

### Token Status

**Location**: Monitoring → Token Status

- View active tokens
- Check expiration times
- Monitor refresh status

### Cleanliness Dashboard

**Location**: Cleanliness Dashboard

- View code quality metrics
- Track regression fixes
- Monitor technical debt

### API Testing

**Location**: API Documentation

- Interactive API explorer
- Test endpoints directly
- View request/response examples

---

## 🎯 Pro Tips

### 1. Use Mock Services for Development

- Enable mock mode in Configuration
- Test flows without PingOne dependency
- Perfect for development and testing

### 2. Token Management

- Always check token expiration
- Use auto-refresh for long-running sessions
- Monitor token usage in dashboard

### 3. Flow Comparison

- Use Flow Comparison tool to understand differences
- Compare security implications
- Choose right flow for your use case

### 4. Export/Import Settings

- Export your configuration for backup
- Share settings with team members
- Import across environments

---

## 🆘 Need Help?

1. **Check this guide first** - Most issues are covered here
2. **Browser Console** - Check for JavaScript errors
3. **Application Logs** - Monitor terminal output
4. **PingOne Admin Console** - Verify app configurations
5. **Full Documentation** - See `docs/MASTER_USER_GUIDE.md` for detailed info

---

## 🎉 You're Ready!

**Start with these flows:**

1. **Authorization Code** - For web applications
2. **Client Credentials** - For API access
3. **MFA Registration** - For multi-factor auth

**Advanced features:**

- Device Authorization for IoT
- Communication flows for testing
- Token monitoring for production

Happy testing! 🚀
