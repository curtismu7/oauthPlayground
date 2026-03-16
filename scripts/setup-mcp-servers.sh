#!/bin/bash

# MCP Server Setup Script for OAuth Playground
# This script sets up and starts all the enhanced MCP servers

set -e

echo "🚀 Setting up Enhanced MCP Servers for OAuth Playground..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "pingone-mcp-server" ]; then
    print_error "Please run this script from the oauth-playground root directory"
    exit 1
fi

print_header "Installing Dependencies"

# Install dependencies for each MCP server
echo "Installing Memory MCP Server dependencies..."
cd memory-mcp-server
npm install
cd ..

echo "Installing Filesystem MCP Server dependencies..."
cd filesystem-mcp-server
npm install
cd ..

echo "Installing Fetch MCP Server dependencies..."
cd fetch-mcp-server
npm install
cd ..

print_header "Building MCP Servers"

# Build each server
echo "Building Memory MCP Server..."
cd memory-mcp-server
npm run build
cd ..

echo "Building Filesystem MCP Server..."
cd filesystem-mcp-server
npm run build
cd ..

echo "Building Fetch MCP Server..."
cd fetch-mcp-server
npm run build
cd ..

print_header "Creating MCP Configuration"

# Create MCP configuration directory
mkdir -p .mcp-config

# Create MCP server configuration file
cat > .mcp-config/mcp-servers.json << 'EOF'
{
  "memory": {
    "command": "node",
    "args": ["memory-mcp-server/dist/index.js"],
    "description": "OAuth Playground Memory Server - User preferences and context",
    "enabled": true
  },
  "filesystem": {
    "command": "node", 
    "args": ["filesystem-mcp-server/dist/index.js"],
    "description": "OAuth Playground Filesystem Server - Secure file operations",
    "enabled": true
  },
  "fetch": {
    "command": "node",
    "args": ["fetch-mcp-server/dist/index.js"], 
    "description": "OAuth Playground Fetch Server - API testing and validation",
    "enabled": true
  },
  "pingone": {
    "command": "node",
    "args": ["pingone-mcp-server/dist/index.js"],
    "description": "PingOne API Server - OAuth and identity management",
    "enabled": true
  }
}
EOF

# Create startup script for MCP servers
cat > scripts/start-mcp-servers.sh << 'EOF'
#!/bin/bash

# Start all MCP servers for OAuth Playground

set -e

echo "🚀 Starting MCP Servers..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to start a server in background
start_server() {
    local server_name=$1
    local server_path=$2
    
    if [ -f "$server_path" ]; then
        print_status "Starting $server_name..."
        node "$server_path" > "logs/${server_name,,}.log" 2>&1 &
        echo $! > "logs/${server_name,,}.pid"
        print_status "$server_name started (PID: $!)"
    else
        print_warning "$server_name not found at $server_path"
    fi
}

# Create logs directory
mkdir -p logs

# Start each server
start_server "Memory-Server" "memory-mcp-server/dist/index.js"
start_server "Filesystem-Server" "filesystem-mcp-server/dist/index.js" 
start_server "Fetch-Server" "fetch-mcp-server/dist/index.js"
start_server "PingOne-Server" "pingone-mcp-server/dist/index.js"

print_status "All MCP servers started!"
print_status "Check logs/ directory for server logs"
print_status "Use scripts/stop-mcp-servers.sh to stop all servers"
EOF

chmod +x scripts/start-mcp-servers.sh

# Create stop script for MCP servers
cat > scripts/stop-mcp-servers.sh << 'EOF'
#!/bin/bash

# Stop all MCP servers for OAuth Playground

echo "🛑 Stopping MCP Servers..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop a server
stop_server() {
    local server_name=$1
    local pid_file="logs/${server_name,,}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            print_status "Stopped $server_name (PID: $pid)"
        else
            print_error "$server_name process not found (PID: $pid)"
        fi
        rm -f "$pid_file"
    else
        print_error "$server_name PID file not found"
    fi
}

# Stop each server
stop_server "Memory-Server"
stop_server "Filesystem-Server" 
stop_server "Fetch-Server"
stop_server "PingOne-Server"

print_status "All MCP servers stopped!"
EOF

chmod +x scripts/stop-mcp-servers.sh

print_header "Creating Integration Documentation"

# Create MCP integration documentation
cat > docs/MCP_INTEGRATION_GUIDE.md << 'EOF'
# MCP Server Integration Guide

## Overview

This guide describes the enhanced MCP servers integrated into the OAuth Playground to provide advanced user experience and testing capabilities.

## Available MCP Servers

### 1. Memory Server (`memory-mcp-server`)
**Purpose**: User preferences and OAuth flow context management

**Tools**:
- `save-user-preference` - Save user preferences and settings
- `get-user-preference` - Retrieve user preferences and history
- `update-flow-memory` - Store OAuth flow issues and success patterns
- `search-user-history` - Search through user preferences and flow history
- `get-common-issues` - Get most common OAuth issues and resolutions
- `update-user-last-used` - Track user's last used flows

**Use Cases**:
- Remember user's preferred OAuth flows and MFA methods
- Store common configuration patterns
- Track and analyze OAuth issues for better troubleshooting
- Provide personalized user experience

### 2. Filesystem Server (`filesystem-mcp-server`)
**Purpose**: Secure configuration and log management

**Tools**:
- `save-config` - Securely save OAuth flow configurations
- `load-config` - Load saved configurations
- `delete-config` - Delete configurations
- `list-configs` - List all saved configurations
- `write-log` - Write structured log entries
- `read-logs` - Read and filter logs
- `search-logs` - Search through log entries
- `create-temp-file` - Create temporary files for testing
- `cleanup-temp-files` - Clean up old temporary files
- `export-logs` - Export logs for analysis
- `get-audit-log` - Get file operation audit trail

**Use Cases**:
- Securely store OAuth configurations
- Comprehensive logging and debugging
- Temporary file management for testing
- Audit trail for security compliance

### 3. Fetch Server (`fetch-mcp-server`)
**Purpose**: API endpoint testing and OAuth flow validation

**Tools**:
- `fetch` - Basic HTTP request functionality
- `fetch-and-parse` - Fetch and parse JSON/HTML content
- `test-oauth-endpoint` - Test OAuth-specific endpoints
- `test-redirect-flow` - Test OAuth redirect flows
- `test-well-known-endpoints` - Test OpenID Connect well-known endpoints
- `test-oauth-flow` - Comprehensive OAuth flow testing
- `get-request-history` - Get request history
- `get-fetch-analytics` - Request analytics and statistics
- `clear-fetch-history` - Clear request history

**Use Cases**:
- Test OAuth endpoint availability and responses
- Validate redirect flows and authorization URLs
- Analyze OAuth server configuration
- Debug API connectivity issues

### 4. PingOne Server (`pingone-mcp-server`)
**Purpose**: PingOne API integration and identity management

**Tools**:
- Authentication and authorization management
- User and group management
- MFA and device management
- Application and client management
- Token introspection and validation

## Usage Examples

### Enhanced User Experience

```javascript
// Remember user preferences
await memoryServer.call('save-user-preference', {
  userId: 'user123',
  preferences: {
    defaultFlow: 'admin',
    preferredMfaMethod: 'totp',
    rememberCredentials: true
  }
});

// Save successful configuration
await filesystemServer.call('save-config', {
  flowId: 'admin-flow-001',
  config: {
    environmentId: 'env-123',
    clientId: 'client-456',
    scopes: ['openid', 'profile', 'email']
  }
});
```

### Advanced Testing

```javascript
// Test OAuth endpoint
const result = await fetchServer.call('test-oauth-endpoint', {
  baseUrl: 'https://auth.pingone.com',
  path: '/oauth/token',
  token: 'Bearer token123'
});

// Comprehensive flow test
const flowResults = await fetchServer.call('test-oauth-flow', {
  baseUrl: 'https://auth.pingone.com',
  tokenEndpoint: '/oauth/token',
  authEndpoint: '/oauth/authorize'
});
```

### Debugging and Analysis

```javascript
// Search logs for errors
const errorLogs = await filesystemServer.call('search-logs', {
  query: 'error 400',
  date: '2026-03-16'
});

// Get common issues
const commonIssues = await memoryServer.call('get-common-issues');
```

## Security Considerations

### Filesystem Server
- Only accesses designated directories within the playground
- All file operations are audited and logged
- Temporary files are automatically cleaned up
- Path validation prevents directory traversal

### Memory Server
- User data is stored locally in JSON format
- No sensitive credentials are stored in preferences
- All data is encrypted at rest (optional enhancement)

### Fetch Server
- URL validation prevents access to internal networks
- SSL certificate validation can be configured
- Request history is limited and can be cleared
- No credentials are exposed in responses

## Integration with AI Assistant

The MCP servers can be integrated into the AI Assistant through the following steps:

1. **Start MCP Servers**: Use `scripts/start-mcp-servers.sh`
2. **Configure AI Assistant**: Update MCP configuration to include new servers
3. **Update AI Tools**: Add MCP server tools to the AI Assistant's tool registry
4. **Test Integration**: Verify AI Assistant can call MCP server tools

## Troubleshooting

### Common Issues

1. **Server Won't Start**: Check if Node.js is installed and ports are available
2. **Permission Errors**: Ensure script files have execute permissions
3. **Missing Dependencies**: Run `npm install` in each server directory
4. **Configuration Issues**: Verify `.mcp-config/mcp-servers.json` is correct

### Logs and Debugging

- Server logs are stored in `logs/` directory
- Use `get-audit-log` tool to track file operations
- Use `get-fetch-analytics` to analyze request patterns
- Check `get-common-issues` for recurring problems

## Performance Considerations

- Memory server uses in-memory storage with optional persistence
- Filesystem server implements file watching and cleanup
- Fetch server limits request history and implements timeouts
- All servers include graceful shutdown handling

## Future Enhancements

1. **Database Integration**: Replace JSON storage with SQLite/PostgreSQL
2. **Caching**: Add Redis caching for frequently accessed data
3. **Monitoring**: Add Prometheus metrics and health checks
4. **Security**: Add authentication and authorization for MCP servers
5. **Scalability**: Add load balancing and clustering support
EOF

print_header "Setup Complete!"

print_status "✅ MCP Servers have been set up successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Start MCP servers: ./scripts/start-mcp-servers.sh"
print_status "2. Check documentation: docs/MCP_INTEGRATION_GUIDE.md"
print_status "3. Integrate with AI Assistant using .mcp-config/mcp-servers.json"
print_status ""
print_warning "Remember to start both backend and frontend servers:"
print_warning "  npm start (for full stack)"
print_warning ""
print_status "MCP Server logs will be stored in the logs/ directory"
print_status "Use scripts/stop-mcp-servers.sh to stop all MCP servers"
