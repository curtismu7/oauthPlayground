# PingOne OAuth 2.0 & OpenID Connect Playground

[![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0-blue.svg)](https://tools.ietf.org/html/rfc6749)
[![OpenID Connect](https://img.shields.io/badge/OpenID-Connect-green.svg)](https://openid.net/connect/)
[![PingOne](https://img.shields.io/badge/PingOne-Identity-orange.svg)](https://www.pingidentity.com/)

An interactive web application for learning, testing, and mastering OAuth 2.0 and OpenID Connect flows using PingOne as the identity provider.

## 🚀 Quick Start

The fastest way to get the OAuth Playground running:

```bash
# Clone the repository
git clone https://github.com/curtismu7/oauthPlayground.git
cd oauthPlayground

# Install dependencies
npm install

# Start the full stack (frontend + backend)
npm start
```

That's it! The app will be available at https://localhost:3000

*Note: Your project already has a pre-configured `.env` file, so no additional configuration is needed.*

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 6.0 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows
- **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)

### PingOne Account
You'll need a PingOne account with:
- An environment configured
- An OAuth/OIDC application set up
- Client credentials (Client ID and Secret)
- Proper redirect URIs configured

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
# HTTPS
git clone https://github.com/curtismu7/oauthPlayground.git

# SSH (if you have SSH keys set up)
git clone git@github.com:curtismu7/oauthPlayground.git

# Change to project directory
cd oauthPlayground
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter permission issues, try:
sudo npm install
```

### Step 3: Configure Environment Variables (Optional - .env file exists and is configured)

Your project already has a `.env` file with PingOne configuration. The server uses this file for backend configuration, and Vite uses `VITE_` prefixed variables for frontend configuration.

**Current Environment Variables** (already configured in your `.env` file):

```env
# PingOne Configuration - REQUIRED
VITE_PINGONE_ENVIRONMENT_ID=b9817c16-9910-4415-b67e-4ac687da74d9
VITE_PINGONE_CLIENT_ID=a4f963ea-0736-456a-be72-b1fa4f63f81f
VITE_PINGONE_CLIENT_SECRET=0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
VITE_PINGONE_REDIRECT_URI=https://localhost:3000/authz-callback
VITE_PINGONE_LOGOUT_REDIRECT_URI=https://localhost:3000
VITE_PINGONE_API_URL=https://auth.pingone.com

# Application Configuration
VITE_APP_TITLE="PingOne OAuth/OIDC Playground"
VITE_APP_VERSION=5.8.5
VITE_APP_DEFAULT_THEME=light
VITE_DEV_SERVER_PORT=3000
VITE_DEV_SERVER_HTTPS=true
```

**To modify configuration:**
```bash
# Edit the existing .env file
nano .env  # or use your preferred editor
```

**If you need to recreate the .env file:**
```bash
# Copy from example (if needed)
cp .env.example .env
# Then edit as above
```

### Step 4: Start the Application

### Option 1: Full Stack (Recommended)

This starts both frontend and backend with comprehensive monitoring:

```bash
npm start
# or
./restart-servers.sh
```

**Features:**
- ✅ Automatic port management (kills old processes)
- ✅ Health checks for both servers
- ✅ Detailed status reporting
- ✅ Error detection and logging
- ✅ Auto-opens browser when ready

### Option 2: Development Mode

For active development with hot reloading:

```bash
npm run dev
# or
./start-dev.sh
```

### Option 3: Simple Start

Quick start without advanced monitoring:

```bash
npm run start:simple
# or
./start-simple.sh
```

### Option 4: Individual Servers

**Frontend Only:**
```bash
npm run start:frontend
# Runs on https://localhost:3000
```

**Backend Only:**
```bash
npm run start:backend
# Runs on https://localhost:3001
```

## 🔧 Available Scripts

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `./start-full-stack.sh` | **Recommended** - Full stack with monitoring |
| `npm run dev` | `vite` | Development mode with hot reload |
| `npm run build` | `vite build` | Build for production |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run start:simple` | `./start-simple.sh` | Quick start without monitoring |
| `npm run start:frontend` | `vite` | Frontend only |
| `npm run start:backend` | `BACKEND_PORT=3001 node server.js` | Backend only |

### Shell Scripts

| Script | Description |
|--------|-------------|
| `./restart-servers.sh` | **Main script** - Kills old processes, starts servers, health checks |
| `./start-full-stack.sh` | Full stack with comprehensive monitoring |
| `./start-dev.sh` | Development mode startup |
| `./start-simple.sh` | Minimal startup |
| `./kill-servers.sh` | Kill all running servers |

## 🌐 Accessing the Application

Once running, access the application at:

- **Main Application**: https://localhost:3000
- **Backend API**: https://localhost:3001
- **Health Check**: https://localhost:3001/api/health

The restart script will automatically open your browser to https://localhost:3000 when ready.

## 🛑 Stopping the Application

### Graceful Shutdown
Press `Ctrl+C` in the terminal where the script is running.

### Force Stop
```bash
# Kill all OAuth Playground processes
./kill-servers.sh

# Or manually kill by ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

## 🔍 Troubleshooting

### Port Already in Use

The restart script automatically handles this, but if issues persist:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001

# Kill specific processes
kill -9 <PID>

# Then restart
npm start
```

### Dependencies Issues

```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend Not Starting

1. Check Node.js version: `node --version` (must be 16+)
2. Verify `.env` file exists and has required variables
3. Check backend logs: `tail -f backend.log`

### Frontend Not Starting

1. Verify dependencies: `npm install`
2. Check for syntax errors: `npm run lint`
3. Check frontend logs: `tail -f frontend.log`

### SSL/Certificate Issues

The app uses HTTPS in development. If you see certificate warnings:
- Click "Advanced" → "Proceed to localhost (unsafe)" in Chrome
- Or set `VITE_DEV_SERVER_HTTPS=false` in `.env` for HTTP-only mode

### Environment Variable Issues

1. Ensure `.env` file exists in project root
2. Check variable names match exactly (case-sensitive)
3. Restart servers after changing `.env` file
4. Verify PingOne credentials are correct

## 📁 Project Structure

```
oauth-playground/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── utils/          # Utilities
├── server.js          # Express backend server
├── package.json       # Dependencies and scripts
├── vite.config.ts     # Vite configuration
├── .env.example       # Environment template
└── restart-servers.sh # Main startup script
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, unique client secrets
- Configure proper redirect URIs in PingOne
- The app uses HTTPS in development for security

## 📚 Documentation

- **[Complete Documentation](https://localhost:3000/about)** - Detailed overview of what the OAuth Playground does, including all features, use cases, and educational content
- **[Setup Guide](./SETUP.md)** - Comprehensive setup and troubleshooting guide
- **[API Documentation](./server.js)** - Backend API endpoints and usage

## 🆘 Support

### Log Files
- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs
- `server.log` - General server logs

### Common Issues
1. **"Port already in use"** → The restart script handles this automatically
2. **"Module not found"** → Run `npm install`
3. **"Environment variables not set"** → Check `.env` file
4. **"PingOne connection failed"** → Verify credentials and network

### Getting Help
1. Check the troubleshooting section above
2. Review log files for error details
3. Ensure all prerequisites are met
4. Verify PingOne configuration

## 🎯 What You Can Do

The OAuth Playground provides interactive learning and testing for:

### OAuth 2.0 Flows
- **Authorization Code Flow** - Complete flow with PKCE
- **Client Credentials Flow** - Machine-to-machine authentication
- **Device Code Flow** - IoT and input-constrained devices
- **Implicit Flow** - Legacy flow with security considerations
- **JWT Bearer Token Flow** - Token exchange with assertions

### OpenID Connect
- **User Authentication** - Complete OIDC login flows
- **ID Token Validation** - JWT parsing and verification
- **User Profile** - Claims and user information retrieval
- **Session Management** - Login/logout and session handling

### Advanced Features
- **Token Management** - JWT inspection, refresh, and introspection
- **Security Features** - PKCE, state parameters, nonce validation
- **API Testing** - RESTful endpoint testing with authentication
- **Configuration Tools** - Application setup and environment switching

## 📚 Additional Resources

### Identity Management for AI Agents
- **[Identity Management for Agentic AI](https://openid.net/wp-content/uploads/2025/10/Identity-Management-for-Agentic-AI.pdf)** - A comprehensive whitepaper from the OpenID Foundation exploring authentication, authorization, and identity management challenges for AI agents and autonomous systems. This document addresses current frameworks, future challenges, and provides strategic guidance for stakeholders working at the intersection of AI agents and access management.

### OAuth & OpenID Connect Documentation
- [OAuth 2.0 Specification (RFC 6749)](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Specification](https://openid.net/connect/)
- [OAuth 2.1 Draft Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13)
- [PingOne Documentation](https://docs.pingidentity.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PingOne](https://www.pingidentity.com/) for providing the OAuth/OIDC platform
- [OAuth 2.0](https://tools.ietf.org/html/rfc6749) and [OpenID Connect](https://openid.net/connect/) specifications
- The open source community for the amazing tools and libraries

---

**Built with ❤️ using React, TypeScript, Vite, and PingOne**

For additional help, check the [Complete Documentation](https://localhost:3000/about) or create an issue in the repository.
