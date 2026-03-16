# Enhanced MCP Servers for OAuth Playground

This directory contains the enhanced Model Context Protocol (MCP) servers that provide advanced user experience and testing capabilities for the OAuth Playground application.

## 🚀 Quick Start

```bash
# Set up all MCP servers
./scripts/setup-mcp-servers.sh

# Start all MCP servers
./scripts/start-mcp-servers.sh

# Stop all MCP servers
./scripts/stop-mcp-servers.sh
```

## 📁 Server Structure

```
├── memory-mcp-server/          # User preferences and context management
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── services/
│   │   │   └── memoryManager.ts
│   │   └── tools/
│   │       └── memoryTools.ts
│   ├── package.json
│   └── tsconfig.json
├── filesystem-mcp-server/      # Secure file operations
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── services/
│   │   │   └── filesystemManager.ts
│   │   └── tools/
│   │       └── filesystemTools.ts
│   ├── package.json
│   └── tsconfig.json
├── fetch-mcp-server/          # API testing and validation
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── services/
│   │   │   └── fetchManager.ts
│   │   └── tools/
│   │       └── fetchTools.ts
│   ├── package.json
│   └── tsconfig.json
└── pingone-mcp-server/        # Existing PingOne API server
    └── (existing structure)
```

## 🔧 MCP Servers Overview

### 1. Memory Server (`memory-mcp-server`)

**Purpose**: Enhanced user experience through persistent user preferences and OAuth flow context.

**Key Features**:

- User preference storage and retrieval
- OAuth flow memory (issues, success patterns)
- Search and analytics capabilities
- Common issue tracking

**Tools**:

- `save-user-preference` - Save user settings
- `get-user-preference` - Retrieve user preferences
- `update-flow-memory` - Store OAuth flow insights
- `search-user-history` - Search user data
- `get-common-issues` - Get frequent problems

### 2. Filesystem Server (`filesystem-mcp-server`)

**Purpose**: Secure configuration and log management with audit capabilities.

**Key Features**:

- Secure file operations in designated directories
- Configuration management with encryption
- Structured logging and searching
- Temporary file management
- Audit trail for security

**Tools**:

- `save-config` / `load-config` - Configuration management
- `write-log` / `read-logs` - Log operations
- `search-logs` - Log searching
- `create-temp-file` / `cleanup-temp-files` - Temp file management
- `get-audit-log` - Security audit

### 3. Fetch Server (`fetch-mcp-server`)

**Purpose**: Advanced API testing and OAuth flow validation.

**Key Features**:

- HTTP request/response handling
- OAuth endpoint testing
- Redirect flow analysis
- Well-known endpoint validation
- Request history and analytics

**Tools**:

- `fetch` / `fetch-and-parse` - HTTP requests
- `test-oauth-endpoint` - OAuth API testing
- `test-redirect-flow` - Redirect analysis
- `test-well-known-endpoints` - OIDC discovery
- `test-oauth-flow` - Comprehensive testing
- `get-fetch-analytics` - Request statistics

## 🛠️ Development

### Building Individual Servers

```bash
# Memory Server
cd memory-mcp-server
npm install
npm run build
npm start

# Filesystem Server
cd filesystem-mcp-server
npm install
npm run build
npm start

# Fetch Server
cd fetch-mcp-server
npm install
npm run build
npm start
```

### Development Mode

```bash
# Run with auto-reload
cd memory-mcp-server
npm run dev
```

### Testing

```bash
# Test server functionality
cd memory-mcp-server
npm test  # (if tests are added)

# Validate MCP protocol
npx @modelcontextprotocol/inspector memory-mcp-server/dist/index.js
```

## 🔒 Security Considerations

### Filesystem Server

- **Path Validation**: Only allows access to designated directories
- **Audit Logging**: All operations are logged and tracked
- **Sandboxing**: Operations restricted to playground directories
- **Cleanup**: Automatic temporary file cleanup

### Memory Server

- **Local Storage**: Data stored locally in JSON format
- **No Credentials**: Sensitive data never stored in preferences
- **Encryption**: Optional encryption for sensitive data

### Fetch Server

- **URL Validation**: Prevents access to internal networks
- **SSL Control**: Configurable certificate validation
- **Rate Limiting**: Built-in request limiting
- **History Limits**: Controlled request history size

## 📊 Integration with AI Assistant

The MCP servers integrate with the AI Assistant through the standard MCP protocol:

1. **Tool Registration**: Each server registers its tools with the MCP client
2. **Schema Validation**: All tools use Zod schemas for input validation
3. **Error Handling**: Consistent error reporting across all servers
4. **Resource Management**: Proper cleanup and resource management

### Example Integration

```typescript
// AI Assistant tool integration
const memoryTools = await mcpClient.listTools();
const filesystemTools = await mcpClient.listTools();
const fetchTools = await mcpClient.listTools();

// Use tools in AI Assistant
await mcpClient.call('save-user-preference', {
	userId: 'user123',
	preferences: { defaultFlow: 'admin' },
});
```

## 📈 Performance

### Memory Server

- **In-Memory Storage**: Fast access with optional persistence
- **Indexing**: Optimized search capabilities
- **Cleanup**: Automatic data cleanup

### Filesystem Server

- **Async Operations**: Non-blocking file operations
- **Caching**: Intelligent caching for frequently accessed files
- **Compression**: Optional log compression

### Fetch Server

- **Connection Pooling**: Reused HTTP connections
- **Timeouts**: Configurable request timeouts
- **Caching**: Response caching for repeated requests

## 🔍 Monitoring and Debugging

### Logs

- Server logs stored in `logs/` directory
- Structured logging with timestamps
- Error tracking and reporting

### Health Checks

- Each server provides health endpoints
- Status monitoring capabilities
- Performance metrics collection

### Debug Tools

- MCP Inspector for protocol debugging
- Request/response logging
- Performance profiling

## 🚀 Future Enhancements

### Planned Features

1. **Database Integration**: Replace JSON storage with SQLite/PostgreSQL
2. **Caching Layer**: Add Redis caching for performance
3. **Authentication**: Add server-to-server authentication
4. **Clustering**: Multi-instance support for scalability
5. **Metrics**: Prometheus metrics integration

### Community Contributions

- Bug reports and feature requests welcome
- Pull requests for new tools and capabilities
- Documentation improvements
- Performance optimizations

## 📚 Documentation

- **Integration Guide**: `docs/MCP_INTEGRATION_GUIDE.md`
- **API Reference**: Individual server documentation
- **Examples**: Code examples and use cases
- **Troubleshooting**: Common issues and solutions

## 🤝 Support

For issues and questions:

1. Check the troubleshooting guide
2. Review server logs in `logs/` directory
3. Use MCP Inspector for protocol debugging
4. Create GitHub issues for bugs and feature requests

## 📄 License

All MCP servers are licensed under the MIT License, consistent with the main OAuth Playground project.
