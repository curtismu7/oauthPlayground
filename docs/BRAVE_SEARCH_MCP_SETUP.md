# Brave Search MCP Setup Guide

## Overview

The Brave Search MCP (Model Context Protocol) server has been added to your Windsurf configuration, enabling AI assistants to perform web searches using the Brave Search API.

## Configuration

The Brave Search MCP has been configured in `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

## Setup Instructions

### 1. Get Brave Search API Key

1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for a free account
3. Navigate to your API dashboard
4. Generate a new API key
5. Copy the API key for the next step

### 2. Set Environment Variable

Add your Brave Search API key to your environment:

#### **Option A: Add to `.env` file**
```bash
# Add to your .env file
BRAVE_API_KEY=your_brave_api_key_here
```

#### **Option B: Set in shell**
```bash
# For current session
export BRAVE_API_KEY=your_brave_api_key_here

# Add to ~/.zshrc or ~/.bashrc for persistence
echo 'export BRAVE_API_KEY=your_brave_api_key_here' >> ~/.zshrc
source ~/.zshrc
```

#### **Option C: Add to Windsurf settings**
In Windsurf, go to Settings → MCP Servers → Brave Search and add the API key there.

### 3. Restart Windsurf

After setting up the API key, restart Windsurf to load the new MCP server configuration.

## Usage

Once configured, you can use web search capabilities in your AI conversations:

### **Example Usage**

```
Search for the latest React best practices for 2024
```

```
Find information about TypeScript 5.0 features
```

```
Look up documentation for PingOne Advanced Identity Cloud
```

### **Available Tools**

The Brave Search MCP provides the following tools:

- **`brave_search`**: Perform web searches
- **`brave_web_search`**: Advanced web search with filtering options

### **Search Parameters**

- **Query**: Your search query
- **Count**: Number of results (default: 10)
- **Offset**: Pagination offset (default: 0)
- **Country**: Country code for localized results (default: us)
- **Search_lang**: Language for search results (default: en)
- **Safesearch**: Safe search level (strict, moderate, off)
- **Freshness**: Time filter (pd, pw, pm, py) - past day/week/month/year

## Features

### **Web Search Capabilities**
- Real-time web search using Brave's search index
- Up-to-date information from across the web
- Support for various search parameters and filters
- Localized search results by country

### **Integration Benefits**
- AI assistants can access current information
- Enhanced research capabilities
- Real-time data for development decisions
- Access to latest documentation and tutorials

### **Use Cases**

1. **Research**: Look up latest API documentation
2. **Troubleshooting**: Find solutions to technical problems
3. **Best Practices**: Get current industry standards
4. **News & Updates**: Stay informed about technology trends
5. **Code Examples**: Find recent code examples and tutorials

## Troubleshooting

### **Common Issues**

#### **API Key Not Found**
```
Error: BRAVE_API_KEY environment variable not set
```
**Solution**: Ensure the BRAVE_API_KEY environment variable is properly set and restart Windsurf.

#### **Invalid API Key**
```
Error: Invalid API key
```
**Solution**: Verify your API key is correct and active in your Brave Search API dashboard.

#### **Network Issues**
```
Error: Failed to connect to Brave Search API
```
**Solution**: Check your internet connection and ensure no firewall is blocking the request.

#### **Server Not Starting**
```
Error: MCP server failed to start
```
**Solution**: 
1. Ensure Node.js is installed
2. Try running `npx @modelcontextprotocol/server-brave-search` manually
3. Check if the MCP package is properly installed

### **Debug Mode**

To enable debug logging, add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search",
        "--debug"
      ],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}",
        "DEBUG": "1"
      }
    }
  }
}
```

## API Limits and Pricing

### **Free Tier**
- **Requests**: 1,000 searches per month
- **Rate Limit**: 100 requests per minute
- **Cost**: Free

### **Paid Tiers**
- **Starter**: $5/month for 10,000 searches
- **Pro**: $25/month for 50,000 searches
- **Enterprise**: Custom pricing

For most development use cases, the free tier should be sufficient.

## Security Considerations

### **API Key Protection**
- Never commit API keys to version control
- Use environment variables for key storage
- Rotate keys periodically
- Monitor API usage for unusual activity

### **Search Privacy**
- Brave Search doesn't track users
- Search queries are not stored or profiled
- More private than alternative search APIs

## Advanced Configuration

### **Custom Search Parameters**

You can modify the MCP configuration to set default search parameters:

```json
{
  "mcpServers": {
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}",
        "DEFAULT_COUNT": "20",
        "DEFAULT_COUNTRY": "us",
        "DEFAULT_LANG": "en",
        "DEFAULT_SAFESEARCH": "moderate"
      }
    }
  }
}
```

### **Multiple MCP Servers**

Your configuration now includes both MCP servers:

```json
{
  "mcpServers": {
    "pingone-mcp-server": {
      "type": "stdio",
      "command": "npm",
      "args": [
        "run",
        "dev",
        "--prefix",
        "/Users/cmuir/P1Import-apps/oauth-playground/pingone-mcp-server"
      ]
    },
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

## Testing the Setup

### **Verification Steps**

1. **Check MCP Server Status**
   - Open Windsurf
   - Go to Settings → MCP Servers
   - Verify "brave-search" shows as connected

2. **Test Search Functionality**
   - Start a new AI conversation
   - Try a simple search: "Search for React hooks documentation"
   - Verify you get relevant search results

3. **Check API Usage**
   - Visit your Brave Search API dashboard
   - Monitor your API usage
   - Ensure requests are being logged

### **Example Test Queries**

```
Search for "TypeScript 5.0 release notes"
```

```
Find "PingOne authentication best practices 2024"
```

```
Look up "React Server Components documentation"
```

## Next Steps

1. **Set up your API key** following the instructions above
2. **Test the search functionality** with sample queries
3. **Explore advanced features** like search filters
4. **Monitor usage** in your Brave Search API dashboard
5. **Integrate with workflows** for enhanced development productivity

## Support

- **Brave Search API Documentation**: https://brave.com/search/api/
- **MCP Documentation**: https://modelcontextprotocol.io/
- **Windsurf Documentation**: Available in Windsurf help section

---

**Status**: ✅ **CONFIGURATION COMPLETE**

The Brave Search MCP has been successfully added to your Windsurf configuration. Follow the setup instructions above to activate web search capabilities in your AI conversations.
