# MasterFlow API - Startup Scripts Guide

## 🚀 Overview

All startup scripts have been updated to be **Windsurf-compatible** with **no prompts** and reliable server startup capabilities.

## 📋 Available Startup Scripts

### **Primary Scripts (Recommended)**

#### **1. Main Development Script**
```bash
./run.sh                    # Base directory wrapper
./scripts/development/run.sh  # Full-featured development script
```
**Features:**
- ✅ Custom domain setup
- ✅ SSL certificate generation
- ✅ Hosts file configuration
- ✅ Browser trust setup
- ✅ Health checks
- ✅ No prompts with `-quick` flag
- ✅ Complete status reporting

**Usage:**
```bash
./run.sh -quick          # No prompts, starts servers
./run.sh -default        # Use existing config, no prompts
./run.sh                 # Interactive mode
./run.sh --help          # Show help
```

---

### **Development Scripts**

#### **2. Windsurf-Compatible Startup**
```bash
./scripts/dev/start-windsurf.sh
```
**Features:**
- ✅ **Designed for Windsurf** - No prompts, automated
- ✅ JSON output for programmatic access
- ✅ Both frontend and backend startup
- ✅ Health checks and validation
- ✅ Clean error handling
- ✅ Process management

**Usage:**
```bash
./scripts/dev/start-windsurf.sh
# Starts both servers, outputs JSON status, no prompts
```

#### **3. Simple Startup**
```bash
./scripts/dev/start-simple.sh
```
**Features:**
- ✅ Quick start for both frontend and backend
- ✅ No prompts
- ✅ Health checks
- ✅ Process cleanup on exit
- ✅ Error handling

**Usage:**
```bash
./scripts/dev/start-simple.sh
# Fast startup with basic status reporting
```

#### **4. Enhanced Startup**
```bash
./scripts/dev/start-dev.sh
```
**Features:**
- ✅ Detailed system information
- ✅ Comprehensive status reporting
- ✅ Logging to `logs/startup.log`
- ✅ No prompts
- ✅ Both frontend and backend

**Usage:**
```bash
./scripts/dev/start-dev.sh
# Detailed startup with system info and logging
```

---

## 🔧 Common Features Across All Scripts

### **✅ Windsurf Compatibility**
- **No interactive prompts** - All scripts run without user input
- **Reliable startup** - Consistent server initialization
- **Error handling** - Graceful failure with clear messages
- **Process management** - Automatic cleanup on exit

### **✅ Server Management**
- **Port management** - Automatic cleanup of existing processes
- **Health checks** - Verify servers are ready
- **SSL support** - HTTPS configuration
- **Custom domains** - Full domain setup support

### **✅ Logging & Debugging**
- **Structured logging** - Timestamped status messages
- **Error logs** - Detailed error information
- **Process tracking** - PID monitoring
- **Health endpoints** - Server status verification

---

## 🎯 Recommended Usage

### **For Windsurf/Automated Tools**
```bash
./scripts/dev/start-windsurf.sh
```
- Best for automated environments
- JSON output for programmatic access
- No prompts, reliable startup

### **For Daily Development**
```bash
./run.sh -quick
```
- Quick startup with existing config
- Full feature set available
- Base directory convenience

### **For First-Time Setup**
```bash
./run.sh
```
- Interactive domain setup
- Complete configuration
- Custom domain support

### **For Simple Testing**
```bash
./scripts/dev/start-simple.sh
```
- Fast startup
- Basic status reporting
- Good for quick tests

---

## 📊 Script Comparison

| Script | Prompts | Custom Domain | Health Checks | JSON Output | Logging | Best For |
|--------|---------|---------------|---------------|-------------|---------|----------|
| `run.sh` | Optional | ✅ Full | ✅ Comprehensive | ❌ | ✅ Detailed | Daily development |
| `start-windsurf.sh` | ❌ None | ❌ Basic | ✅ Basic | ✅ Yes | ✅ Basic | Windsurf/Automation |
| `start-simple.sh` | ❌ None | ❌ Basic | ✅ Basic | ❌ | ✅ Basic | Quick testing |
| `start-dev.sh` | ❌ None | ❌ Basic | ✅ Basic | ❌ | ✅ Detailed | Development with logging |

---

## 🔍 Server URLs

### **Default Configuration**
- **Frontend**: https://localhost:3000
- **Backend**:  https://localhost:3001
- **Health**:  https://localhost:3001/api/health

### **Custom Domain Configuration**
- **Frontend**: https://auth.pingdemo.com:3000
- **Backend**:  https://auth.pingdemo.com:3001
- **Health**:  https://auth.pingdemo.com:3001/api/health

---

## 🛠 Troubleshooting

### **Common Issues**

#### **Ports Already in Use**
All scripts automatically detect and kill processes on ports 3000 and 3001.

#### **Dependencies Missing**
Scripts automatically install npm dependencies if needed.

#### **SSL Certificate Issues**
Use the main script for custom domain setup:
```bash
./run.sh
```

#### **Server Fails to Start**
Check log files:
- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs
- `logs/startup.log` - Development script logs

### **Manual Server Management**
```bash
# Kill all servers
./scripts/dev/stop-servers.sh

# Check running processes
ps aux | grep -E "(node server.js|npm run dev)"

# Check port usage
lsof -i :3000 -i :3001
```

---

## 🎉 Success Indicators

All scripts show clear success messages:

### **Windsurf Script**
```
🎉 WINDSURF READY!
✅ Both servers running and healthy
```

### **Main Script**
```
🎉 ALL SERVERS RUNNING SUCCESSFULLY
✅ Backend server started successfully
✅ Frontend server started successfully
```

### **Simple Script**
```
🎉 SERVERS READY!
✅ Both servers running and healthy
```

---

## 📚 Additional Resources

- **Main Documentation**: `./README.md`
- **API Documentation**: https://localhost:3001/docs
- **Custom Domain Setup**: `./run.sh` (interactive mode)
- **Troubleshooting**: Check individual log files

---

**🚀 All scripts are now Windsurf-compatible and ready for automated server startup!**
