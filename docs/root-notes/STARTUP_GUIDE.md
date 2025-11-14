# OAuth Playground v4.0.0 - Startup Guide

This guide explains how to start the OAuth Playground application with both frontend and backend servers.

## 🚀 Quick Start

### Option 1: Full Stack (Recommended)
```bash
npm start
# or
./start-full-stack.sh
```

### Option 2: Simple Start
```bash
npm run start:simple
# or
./start-simple.sh
```

## 📋 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Full Stack** | `npm start` | Starts both frontend and backend with full monitoring |
| **Simple** | `npm run start:simple` | Quick start for both servers |
| **Frontend Only** | `npm run start:frontend` | Starts only the Vite dev server |
| **Backend Only** | `npm run start:backend` | Starts only the Express server |
| **Interactive** | `npm run start:interactive` | Legacy interactive startup |
| **Development** | `npm run start:dev` | Development mode startup |

## 🔧 Configuration

### Environment Variables

You can customize the startup behavior using these environment variables:

```bash
# Port configuration
export FRONTEND_PORT=5173
export BACKEND_PORT=3001

# URLs
export FRONTEND_URL=http://localhost:5173
export BACKEND_URL=http://localhost:3001

# Then run
npm start
```

### Default Ports
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 🛠️ System Requirements

- **Node.js**: Version 16 or higher
- **npm**: Latest version
- **Operating System**: macOS, Linux, or Windows

## 📊 Features

### Full Stack Script (`start-full-stack.sh`)
- ✅ **Health Checks**: Verifies both servers are running
- ✅ **Port Management**: Automatically handles port conflicts
- ✅ **Dependency Installation**: Installs missing dependencies
- ✅ **Process Monitoring**: Monitors server health
- ✅ **Graceful Shutdown**: Clean shutdown on Ctrl+C
- ✅ **Colored Output**: Easy-to-read status messages
- ✅ **Auto Browser**: Opens browser automatically
- ✅ **Error Handling**: Comprehensive error reporting

### Simple Script (`start-simple.sh`)
- ✅ **Quick Start**: Fastest way to get running
- ✅ **Minimal Dependencies**: Basic process management
- ✅ **Clean Shutdown**: Proper cleanup on exit

## 🔍 Troubleshooting

### Port Already in Use
If you get a "port already in use" error:

```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9  # Frontend port
lsof -ti:3001 | xargs kill -9  # Backend port

# Then restart
npm start
```

### Dependencies Issues
If you encounter dependency issues:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Then start
npm start
```

### Backend Not Starting
If the backend fails to start:

1. Check if `server.js` exists
2. Verify Node.js version: `node --version`
3. Install backend dependencies: `npm install express cors node-fetch dotenv`

### Frontend Not Starting
If the frontend fails to start:

1. Check if `package.json` exists
2. Install frontend dependencies: `npm install`
3. Build the project: `npm run build`

## 📝 Logs

### Full Stack Script Logs
The full stack script provides detailed logging:
- 🟦 **Blue**: General status messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warning messages
- 🔴 **Red**: Error messages
- 🟣 **Purple**: Banner and headers

### Process Monitoring
The full stack script continuously monitors both processes and will alert you if either server stops unexpectedly.

## 🎯 Usage Examples

### Development Mode
```bash
# Start with full monitoring
npm start

# Or quick start for development
npm run start:simple
```

### Production Testing
```bash
# Build first
npm run build

# Then start full stack
npm start
```

### Frontend Only (for UI development)
```bash
npm run start:frontend
```

### Backend Only (for API testing)
```bash
npm run start:backend
```

## 🔄 Stopping the Servers

### Graceful Shutdown
Press `Ctrl+C` in the terminal where the script is running. The script will:
1. Stop both frontend and backend servers
2. Clean up process files
3. Display shutdown confirmation

### Force Stop
If graceful shutdown doesn't work:
```bash
# Kill all Node.js processes
pkill -f node

# Or kill specific ports
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## 📱 Accessing the Application

Once started, you can access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

The full stack script will automatically open your browser to the frontend URL.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check the console output for error messages
4. Ensure ports 5173 and 3001 are available

For more help, check the main README.md or create an issue in the repository.

