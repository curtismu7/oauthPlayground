# Server Restart Script Guide

## Overview
The `restart-servers.sh` script provides a comprehensive solution for restarting your OAuth Playground servers with full error checking and status reporting.

**Fixed Ports:**
- Frontend (Vite): **Port 3000** (https://localhost:3000)
- Backend (Express): **Port 3001** (https://localhost:3001)

## Usage

### Basic Usage
```bash
./restart-servers.sh
```

### What the Script Does

1. **📁 Directory Detection**: Finds and changes to the OAuth Playground directory
2. **🔍 System Check**: Verifies Node.js, npm, and required files
3. **🛑 Kill Servers**: Safely terminates all existing servers and cleans up ports
4. **🚀 Start Backend**: Launches the Express server on port 3001
5. **🚀 Start Frontend**: Launches the Vite dev server on port 3000
6. **🏥 Health Checks**: Verifies both servers are responding correctly
7. **📊 Status Report**: Provides detailed status of both servers
8. **🎯 Final Summary**: Shows current server status and success message

### Exit Codes
- `0`: Success - Both servers started successfully
- `1`: Failure - Both servers failed to start
- `2`: Partial - One server started, one failed
- `3`: Unknown - Unexpected error occurred
- `130`: Interrupted - User pressed Ctrl+C

### Features

#### Smart Directory Detection
- Automatically finds OAuth Playground directory
- Checks common locations (current dir, parent dirs, ~/oauth-playground, etc.)
- Prompts user if directory not found automatically
- Validates directory contains required files (package.json, server.js)

#### Comprehensive Cleanup
- Kills processes by PID files
- Kills processes by port numbers
- Force kills stubborn processes
- Cleans up Node.js processes by name

#### Error Detection
- Checks if processes died during startup
- Monitors port availability
- Validates server responses
- Provides detailed error logs

#### Status Reporting
- Real-time progress updates
- Color-coded status messages
- Final comprehensive status report
- Log file locations for debugging

#### Health Checks
- Backend API health endpoint
- Frontend accessibility check
- Port availability verification
- Process status monitoring

### Log Files
The script creates log files for debugging:
- `backend.log` - Backend server output and errors
- `frontend.log` - Frontend server output and errors

### Example Output

#### Directory Not Found (Interactive Prompt)
```
[10:30:14] 🔍 Locating OAuth Playground project directory...
[10:30:14] ℹ️ Searching common locations for OAuth Playground...
[10:30:14] ⚠️ OAuth Playground directory not found in common locations

Please provide the path to your OAuth Playground directory:
(The directory should contain package.json and server.js files)

Enter directory path (or 'quit' to exit): ~/Projects/my-oauth-playground
[10:30:20] ✅ Using directory: /Users/username/Projects/my-oauth-playground
```

#### Successful Restart
```
🔄 OAuth Playground Server Restart 🔄

[10:30:14] 🔍 Locating OAuth Playground project directory...
[10:30:14] ✅ Already in OAuth Playground directory: /Users/username/oauth-playground

[10:30:15] 🔍 Checking system requirements...
[10:30:15] ✅ Node.js v18.17.0 ✓
[10:30:15] ✅ npm 9.6.7 ✓
[10:30:15] ✅ package.json ✓
[10:30:15] ✅ server.js ✓
[10:30:15] ✅ System requirements check passed

[10:30:15] 🛑 Killing all existing servers...
[10:30:15] ✅ All servers killed successfully

[10:30:15] 🔧 Starting servers...
[10:30:15] 🚀 Starting backend server...
[10:30:16] ✅ Backend server started successfully on https://localhost:3001

[10:30:16] 🚀 Starting frontend server...
[10:30:18] ✅ Frontend server started successfully on https://localhost:3000

[10:30:18] 🏥 Running health checks...
[10:30:18] ✅ Backend health check passed
[10:30:18] ✅ Frontend health check passed
[10:30:18] ✅ All health checks passed

╔══════════════════════════════════════════════════════════════════════════════╗
║                              📊 FINAL STATUS REPORT                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Backend Server:
║   Status: ✅ RUNNING
║   URL:    https://localhost:3001
║   Health: ✅ HEALTHY
║
║ Frontend Server:
║   Status: ✅ RUNNING
║   URL:    https://localhost:3000
║   Health: ✅ HEALTHY
║
║ Overall Status: 🎉 ALL SERVERS RUNNING SUCCESSFULLY
║
║ ✅ OAuth Playground is ready to use!
║ ✅ Open your browser and navigate to: https://localhost:3000
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎉 OAUTH PLAYGROUND STATUS 🎉                            ║
║                                                                              ║
║                          ALL SYSTEMS OPERATIONAL                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Backend Server (Port 3001):
║   ✅ RUNNING and HEALTHY - https://localhost:3001
║
║ Frontend Server (Port 3000):
║   ✅ RUNNING and HEALTHY - https://localhost:3000
║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 🎉 SUCCESS: OAuth Playground is fully operational!
║ 🌐 Ready to use at: https://localhost:3000
║ 🔧 Backend API available at: https://localhost:3001
║
║ 📝 Log files: backend.log, frontend.log
║ 🔄 To restart again: ./restart-servers.sh
║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### Partial Failure
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ⚠️  OAUTH PLAYGROUND STATUS ⚠️                           ║
║                                                                              ║
║                        PARTIAL SUCCESS - ONE SERVER DOWN                    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Backend Server (Port 3001):
║   ✅ RUNNING and HEALTHY - https://localhost:3001
║
║ Frontend Server (Port 3000):
║   ❌ NOT RUNNING - https://localhost:3000
║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ⚠️  PARTIAL SUCCESS: Check server status above
║ 🔍 Review logs for troubleshooting information
║
║ 📝 Log files: backend.log, frontend.log
║ 🔄 To restart again: ./restart-servers.sh
║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### Complete Failure
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ❌ OAUTH PLAYGROUND STATUS ❌                            ║
║                                                                              ║
║                         SYSTEM FAILURE - SERVERS DOWN                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Backend Server (Port 3001):
║   ❌ NOT RUNNING - https://localhost:3001
║
║ Frontend Server (Port 3000):
║   ❌ NOT RUNNING - https://localhost:3000
║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ❌ FAILURE: Both servers failed to start
║ 🔍 Check backend.log and frontend.log for details
║
║ 📝 Log files: backend.log, frontend.log
║ 🔄 To restart again: ./restart-servers.sh
║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Troubleshooting

#### Common Issues

1. **Port Already in Use**
   - The script automatically kills processes on required ports
   - If issues persist, manually check: `lsof -i :3000` and `lsof -i :3001`

2. **Permission Denied**
   - Make sure the script is executable: `chmod +x restart-servers.sh`
   - Check file permissions for package.json and server.js

3. **Node.js/npm Not Found**
   - Install Node.js 16+ and npm
   - Verify installation: `node --version` and `npm --version`

4. **Directory Not Found**
   - The script will prompt you to enter the correct path
   - Make sure you're pointing to the directory containing `package.json` and `server.js`
   - Use absolute paths if relative paths don't work: `/full/path/to/oauth-playground`

5. **Dependencies Missing**
   - The script will attempt to install dependencies automatically
   - If issues persist, run: `npm install`

6. **Server Startup Failures**
   - Check the log files: `backend.log` and `frontend.log`
   - Verify environment variables in `.env` file
   - Check for syntax errors in server.js

#### Manual Debugging

If the script fails, you can debug manually:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001

# Kill specific processes
kill -9 <PID>

# Check logs
tail -f backend.log
tail -f frontend.log

# Test servers individually
node server.js
npm run dev
```

### Integration with Other Scripts

You can use this script in combination with other project scripts:

```bash
# Restart and run tests
./restart-servers.sh && npm test

# Restart and check status
./restart-servers.sh && ./health-check.js

# Use in CI/CD pipelines
if ./restart-servers.sh; then
    echo "Servers started successfully"
    # Run your tests or deployment
else
    echo "Server startup failed"
    exit 1
fi
```

### Port Configuration

The script uses fixed ports for consistency:
- **Frontend**: Always port 3000 (https://localhost:3000)
- **Backend**: Always port 3001 (https://localhost:3001)

Both servers use HTTPS with self-signed certificates for development. The backend will automatically fall back to HTTP if certificate generation fails.

These ports are hardcoded in the script to ensure the OAuth Playground works correctly with its configured redirect URIs and API endpoints.

## Support

If you encounter issues with the restart script:

1. Check the log files (`backend.log`, `frontend.log`)
2. Verify system requirements (Node.js 16+, npm)
3. Ensure all required files exist (package.json, server.js)
4. Check for port conflicts
5. Review the final status report for specific error details

The script provides comprehensive error reporting to help diagnose and resolve issues quickly.