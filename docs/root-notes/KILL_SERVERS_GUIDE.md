# Kill Servers Script Guide

## Overview
The `kill-servers.sh` script safely terminates all OAuth Playground servers without restarting them.

## Usage

### Basic Usage
```bash
./kill-servers.sh
```

### What the Script Does

1. **🔍 PID File Cleanup**: Kills processes using stored PID files
2. **🔌 Port Cleanup**: Kills processes using ports 3000 and 3001
3. **🧹 Process Cleanup**: Kills related Node.js processes (vite, server.js, oauth-playground)
4. **✅ Verification**: Confirms all servers are stopped
5. **📊 Status Report**: Shows final status of both servers

### Features

#### Smart Process Detection
- Kills by PID files first (graceful)
- Kills by port numbers (targeted)
- Kills by process name (comprehensive)
- Shows process information (PID, name)

#### Graceful Shutdown
- Tries `SIGTERM` first (graceful shutdown)
- Falls back to `SIGKILL` if needed (force kill)
- Waits between attempts for clean shutdown
- Verifies processes are actually dead

#### Comprehensive Status
- Real-time progress updates
- Color-coded status messages
- Final verification of port availability
- Clear success/failure indicators

### Example Output

#### Successful Kill
```
🛑 OAuth Playground Server Killer 🛑

[10:30:15] 🛑 Killing OAuth Playground servers...
[10:30:15] ℹ️ Checking PID files...
[10:30:15] ℹ️ Killing Frontend (PID: 12345, Process: node)
[10:30:17] ✅ Frontend stopped (PID: 12345)
[10:30:17] ℹ️ Killing Backend (PID: 12346, Process: node)
[10:30:19] ✅ Backend stopped (PID: 12346)
[10:30:19] ℹ️ Checking ports...
[10:30:19] ℹ️ Port 3000 is already free
[10:30:19] ℹ️ Port 3001 is already free

╔══════════════════════════════════════════════════════════════════════════════╗
║                           🎯 SERVER KILL COMPLETE 🎯                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

[10:30:19] 📋 Final Server Status:

   Frontend Server (Port 3000):
   └─ ✅ STOPPED - Port is free
   Backend Server (Port 3001):
   └─ ✅ STOPPED - Port is free

🎉 SUCCESS: All OAuth Playground servers stopped!
✅ Both ports are now free
✅ Ready for restart or other applications

🔄 To restart servers: ./restart-servers.sh
🔍 To check what's using ports: lsof -i :3000 -i :3001
```

#### No Servers Running
```
🛑 OAuth Playground Server Killer 🛑

[10:30:15] 🛑 Killing OAuth Playground servers...
[10:30:15] ℹ️ Checking PID files...
[10:30:15] ℹ️ No PID file found for Frontend
[10:30:15] ℹ️ No PID file found for Backend
[10:30:15] ℹ️ Checking ports...
[10:30:15] ℹ️ No process found on port 3000
[10:30:15] ℹ️ No process found on port 3001

🎉 SUCCESS: All OAuth Playground servers stopped!
✅ Both ports are now free
```

#### Partial Success
```
⚠️  PARTIAL SUCCESS: Some processes may still be running
🔍 You may need to manually kill remaining processes
   Frontend still on port 3000 (PID: 12345)

🔄 To restart servers: ./restart-servers.sh
🔍 To check what's using ports: lsof -i :3000 -i :3001
```

### Exit Codes
- `0`: Success - All servers stopped
- `1`: Partial - Some processes still running
- `130`: Interrupted - User pressed Ctrl+C

### Manual Cleanup

If the script can't kill all processes, you can manually clean up:

```bash
# Check what's using the ports
lsof -i :3000 -i :3001

# Kill specific processes
kill -9 <PID>

# Kill all Node.js processes (use with caution)
pkill -f node

# Kill specific processes by name
pkill -f vite
pkill -f server.js
```

### When to Use

#### Use `kill-servers.sh` when:
- ✅ You want to stop servers without restarting
- ✅ Servers are unresponsive or stuck
- ✅ You need to free up ports 3000 and 3001
- ✅ You're switching to a different project
- ✅ You're debugging server startup issues

#### Use `restart-servers.sh` when:
- ✅ You want to stop AND restart servers
- ✅ You want a full system restart
- ✅ You want health checks and status reports

### Troubleshooting

#### Common Issues

1. **Permission Denied**
   - Make sure the script is executable: `chmod +x kill-servers.sh`
   - You may need sudo for system processes: `sudo ./kill-servers.sh`

2. **Processes Won't Die**
   - Some processes may be protected or stuck
   - Try manual cleanup with `kill -9 <PID>`
   - Restart your terminal or system if needed

3. **Ports Still in Use**
   - Check what's using the ports: `lsof -i :3000 -i :3001`
   - Kill the specific processes manually
   - Wait a few seconds for ports to be released

4. **Script Not Found**
   - Make sure you're in the OAuth Playground directory
   - Check the script exists: `ls -la kill-servers.sh`

### Integration

You can use this script in combination with other scripts:

```bash
# Kill then restart
./kill-servers.sh && ./restart-servers.sh

# Kill and check status
./kill-servers.sh && echo "Servers killed, ports are free"

# Use in automation
if ./kill-servers.sh; then
    echo "All servers stopped successfully"
else
    echo "Some processes may still be running"
fi
```

### Safety Features

- **Graceful shutdown first**: Tries SIGTERM before SIGKILL
- **Process verification**: Confirms processes are actually dead
- **Port verification**: Ensures ports are actually free
- **Detailed logging**: Shows exactly what's being killed
- **Safe targeting**: Only kills OAuth Playground related processes

The script is designed to be safe and won't accidentally kill unrelated processes.

## Support

If you encounter issues with the kill script:

1. Check the final status report for specific error details
2. Use manual cleanup commands if automatic cleanup fails
3. Verify you have permission to kill the processes
4. Check for any system-level process protection

The script provides comprehensive status reporting to help diagnose and resolve issues quickly.