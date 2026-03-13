# GitHub MCP Setup Guide

## Overview

The GitHub MCP (Model Context Protocol) server has been added to your Windsurf configuration, enabling AI assistants to interact with GitHub repositories, issues, pull requests, and more.

## Configuration

The GitHub MCP has been configured in `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Setup Instructions

### 1. Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Configure the token:
   - **Note**: Enter a descriptive name (e.g., "Windsurf MCP Server")
   - **Expiration**: Choose an appropriate expiration period
   - **Scopes**: Select the permissions you need:

#### **Recommended Scopes for Development**

**Repository Access:**
- ✅ `repo` - Full control of private repositories
- ✅ `public_repo` - Access public repositories

**Issues and Pull Requests:**
- ✅ `issues:write` - Read and write issues
- ✅ `pull_request:write` - Manage pull requests

**Actions and Workflows:**
- ✅ `workflow` - Update GitHub Actions workflows
- ✅ `write:packages` - Publish packages

**Administration:**
- ✅ `read:org` - Read organization data
- ✅ `admin:org_hook` - Manage organization hooks

4. Click "Generate token"
5. **Important**: Copy the token immediately (you won't be able to see it again)

### 2. Set Environment Variable

Add your GitHub Personal Access Token to your environment:

#### **Option A: Add to `.env` file**
```bash
# Add to your .env file
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_your_token_here
```

#### **Option B: Set in shell**
```bash
# For current session
export GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_your_token_here

# Add to ~/.zshrc or ~/.bashrc for persistence
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

#### **Option C: Add to Windsurf settings**
In Windsurf, go to Settings → MCP Servers → GitHub and add the token there.

### 3. Restart Windsurf

After setting up the token, restart Windsurf to load the new MCP server configuration.

## Available Capabilities

### **Repository Management**
- **Repository Information**: Get details about repositories
- **Repository Creation**: Create new repositories
- **Repository Settings**: Update repository configuration
- **Branch Management**: Create, list, and manage branches

### **Issues and Pull Requests**
- **Issue Management**: Create, read, update, and close issues
- **Pull Request Operations**: Create, review, and manage pull requests
- **Comments**: Add comments to issues and pull requests
- **Labels**: Manage issue and PR labels

### **Code Operations**
- **File Operations**: Read, create, update, and delete files
- **Content Management**: Get file contents and metadata
- **Commits**: View commit history and details
- **Releases**: Manage repository releases

### **Actions and Workflows**
- **Workflow Management**: Trigger and monitor GitHub Actions
- **Workflow Files**: Update workflow configuration files
- **Build Status**: Check build and deployment status

### **Organization Management**
- **Organization Info**: Get organization details
- **Team Management**: Manage teams and memberships
- **Repository Permissions**: Set repository access levels

## Usage Examples

### **Repository Operations**

```
Create a new repository called "my-new-project" with description
```

```
List all repositories in the oauth-playground organization
```

```
Get information about the main branch of the current repository
```

### **Issue Management**

```
Create an issue in the oauth-playground repo titled "Add universal settings documentation" with description
```

```
List all open issues in the repository with the "enhancement" label
```

```
Add a comment to issue #123 about the implementation status
```

### **Pull Request Operations**

```
Create a pull request from feature-branch to main with title and description
```

```
List all open pull requests in the repository
```

```
Add a review comment to pull request #45
```

### **File Operations**

```
Read the contents of src/components/UniversalSettingsToggle.tsx
```

```
Create a new file docs/NEW_FEATURE.md with content
```

```
Update the README.md file with new information
```

### **Code Analysis**

```
Get the commit history for the src/services/ directory
```

```
List all files changed in the last 10 commits
```

```
Get the diff between main and feature-branch
```

## Development Workflow Integration

### **For Your OAuth Playground Project**

#### **Documentation Management**
```
Create a GitHub issue for documenting the Universal Settings architecture
```

```
Update the README.md with the latest features and setup instructions
```

#### **Code Review Automation**
```
Create a pull request for the universal settings feature
```

```
Add review comments about TypeScript best practices
```

#### **Release Management**
```
Create a new release for version 9.14.0 with release notes
```

```
Update the changelog with new features and fixes
```

#### **Issue Tracking**
```
List all bugs reported in the last month
```

```
Create issues for performance optimization tasks
```

### **Collaboration Features**

#### **Team Coordination**
```
List all team members and their repository permissions
```

```
Assign issue #123 to a specific team member
```

#### **Project Management**
```
Create project board columns for development workflow
```

```
Move issues between project board columns
```

## Advanced Usage

### **Multi-Repository Operations**
```
Search across all repositories in the organization for files containing "OAuth"
```

```
List all repositories that use TypeScript
```

### **Automation and CI/CD**
```
Trigger a GitHub Actions workflow run
```

```
Update the workflow file with new build steps
```

### **Security and Compliance**
```
List all repository collaborators and their permissions
```

```
Check for security vulnerabilities in dependencies
```

## Troubleshooting

### **Common Issues**

#### **Token Not Found**
```
Error: GITHUB_PERSONAL_ACCESS_TOKEN environment variable not set
```
**Solution**: Ensure the GITHUB_PERSONAL_ACCESS_TOKEN environment variable is properly set and restart Windsurf.

#### **Insufficient Permissions**
```
Error: 403 Forbidden - Insufficient permissions for this operation
```
**Solution**: Update your personal access token with the required scopes.

#### **Repository Not Found**
```
Error: 404 Not Found - Repository does not exist or no access
```
**Solution**: Verify the repository name and ensure your token has access to it.

#### **Rate Limiting**
```
Error: 403 Rate limit exceeded
```
**Solution**: Wait for the rate limit to reset or use a token with higher rate limits.

### **Debug Mode**

Enable debug logging for troubleshooting:

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github",
        "--debug"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}",
        "DEBUG": "1"
      }
    }
  }
}
```

## Security Best Practices

### **Token Security**
- **Never commit tokens** to version control
- **Use environment variables** for token storage
- **Rotate tokens regularly** (every 90 days recommended)
- **Use least privilege principle** - only grant necessary scopes
- **Monitor token usage** in GitHub settings

### **Scope Management**
- **Minimum required scopes**: Only request permissions you need
- **Regular audit**: Review and remove unused scopes
- **Separate tokens**: Use different tokens for different purposes

### **Access Control**
- **Organization tokens**: Use organization-level tokens when possible
- **Repository-specific**: Limit access to specific repositories when feasible
- **Time-limited**: Set appropriate expiration dates

## API Limits and Quotas

### **Rate Limits**
- **Authenticated requests**: 5,000 requests per hour
- **Search API**: 30 requests per minute
- **GraphQL API**: 5,000 points per hour

### **Best Practices**
- **Batch operations**: Use GraphQL for complex queries
- **Caching**: Cache frequently accessed data
- **Efficient queries**: Use specific query parameters

## Integration with Other MCPs

### **Combined Workflows**

#### **Research + Implementation**
```
Search for "React authentication patterns 2024" then create GitHub issue for implementation
```

#### **Code Analysis + Documentation**
```
Analyze repository code and create documentation issues for missing areas
```

#### **Security Research + Fixes**
```
Search for security vulnerabilities then create pull requests with fixes
```

### **Multi-Server Examples**

```
Search for OAuth best practices, then implement them in a new branch and create a pull request
```

```
Research TypeScript patterns, update code files, and create documentation
```

## Current MCP Configuration

Your `.windsurf/mcp.json` now includes:

```json
{
  "mcpServers": {
    "pingone-mcp-server": { /* Your custom MCP */ },
    "brave-search": { /* Web search capabilities */ },
    "github": { /* GitHub repository management */ }
  }
}
```

## Next Steps

1. **Create your GitHub Personal Access Token** with appropriate scopes
2. **Add the token** to your environment variables
3. **Restart Windsurf** to load the GitHub MCP
4. **Test basic operations** like listing repositories or creating issues
5. **Explore advanced features** for your specific development workflow

## Support

- **GitHub API Documentation**: https://docs.github.com/en/rest
- **GitHub GraphQL API**: https://docs.github.com/en/graphql
- **Personal Access Tokens**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- **MCP Documentation**: https://modelcontextprotocol.io/

---

**Status**: ✅ **CONFIGURATION COMPLETE**

The GitHub MCP has been successfully added to your Windsurf configuration. Follow the setup instructions above to activate GitHub repository management capabilities in your AI conversations.
