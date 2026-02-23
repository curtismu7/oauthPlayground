# Enhanced Startup Guide

## Command Line Switches

The enhanced startup script provides three main command line switches for different startup modes:

### Available Scripts

```bash
# Enhanced startup with interactive prompts
npm run start:enhanced

# Full clear mode - kills processes and clears all cache
npm run start:clear

# Default mode - normal startup without prompts
npm run start:default

# Quick mode - minimal checks, no cache clearing
npm run start:quick
```

### Command Line Switches

You can also use the enhanced startup script directly with command line switches:

```bash
# Interactive startup (default behavior)
./scripts/startup-enhanced.sh

# Full clear - kills processes + clear all cache
./scripts/startup-enhanced.sh -clear

# No prompts, normal startup
./scripts/startup-enhanced.sh -default

# Quick startup (minimal checks, no cache clearing)
./scripts/startup-enhanced.sh -quick

# Show help
./scripts/startup-enhanced.sh -help
```

## Startup Modes

### 🧹 Full Clear Mode (`-clear`)
- **Purpose**: Complete reset of the development environment
- **Actions**:
  - Kills all running processes on ports 3000 and 3001
  - Clears `dist` directory
  - Clears Vite cache (`node_modules/.vite`)
  - Removes package-lock.json files
  - Installs fresh dependencies
- **Use Case**: When you're experiencing build issues or need a completely fresh start
- **Command**: `npm run start:clear` or `./scripts/startup-enhanced.sh -clear`

### 🚀 Default Mode (`-default`)
- **Purpose**: Normal startup without interactive prompts
- **Actions**:
  - Kills existing processes if ports are in use
  - Performs system requirements check
  - Installs dependencies if needed
  - Starts backend and frontend servers
- **Use Case**: Automated scripts or CI/CD pipelines
- **Command**: `npm run start:default` or `./scripts/startup-enhanced.sh -default`

### ⚡ Quick Mode (`-quick`)
- **Purpose**: Fast startup with minimal checks
- **Actions**:
  - Skips system requirements check
  - Skips port availability checks
  - Starts servers immediately
  - Minimal logging
- **Use Case**: Development iterations when you know everything is set up
- **Command**: `npm run start:quick` or `./scripts/startup-enhanced.sh -quick`

### 🎯 Interactive Mode (default)
- **Purpose**: Full-featured startup with user prompts
- **Actions**:
  - Complete system requirements check
  - Port availability checks with prompts
  - Cache clearing options
  - Full logging and status updates
- **Use Case**: First-time setup or when you want full control
- **Command**: `npm run start:enhanced` or `./scripts/startup-enhanced.sh`

## Server Information

- **Frontend**: http://localhost:3000
- **Backend**: https://localhost:3001
- **Process Management**: Uses PID files for clean shutdown

## Troubleshooting

### Port Already in Use
- Use `-clear` mode to automatically kill processes and clear ports
- Or manually kill processes: `pkill -f "vite"` and `pkill -f "node server.js"`

### Build Issues
- Use `-clear` mode to clear all caches and dependencies
- Or manually clear: `rm -rf dist node_modules/.vite`

### Quick Development Iterations
- Use `-quick` mode for fastest startup when you're making frequent changes
- Skip system checks and port verification

## Examples

```bash
# First time setup - use interactive mode
npm run start:enhanced

# Daily development - use quick mode
npm run start:quick

# When experiencing issues - use full clear
npm run start:clear

# Automated scripts - use default mode
npm run start:default
```

## Process Management

The startup script automatically:
- Creates PID files for process tracking
- Handles graceful shutdown on Ctrl+C
- Monitors process health
- Cleans up resources on exit

## Environment Variables

You can customize ports using environment variables:

```bash
FRONTEND_PORT=8080 BACKEND_PORT=8081 npm run start:enhanced
```

## Help

For more information about available options:
```bash
./scripts/startup-enhanced.sh -help
```
