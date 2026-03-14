# MCP Server Specification Evaluation

**Document**: Evaluation of `pingone-mcp-server` against the Model Context Protocol specification  
**Spec reference**: [Model Context Protocol 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) (latest)  
**Spec source repo**: [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol)  
**Date**: March 2026  
**Server**: `pingone-mcp-server/` (PingOne identity APIs via MCP)

---

## Executive summary

The **pingone-mcp-server** implements the Model Context Protocol and conforms to the core requirements of the MCP specification. It uses the official `@modelcontextprotocol/sdk`, exposes tools and resources via JSON-RPC 2.0 over stdio, and follows the expected patterns for tool definitions, error reporting, and resource access. Optional features listChanged, cancellation, and pagination are supported or documented.

| Area              | Status | Notes                                                                 |
|-------------------|--------|-----------------------------------------------------------------------|
| Base protocol     | ✅     | JSON-RPC 2.0, stdio transport, capability negotiation via SDK         |
| Tools             | ✅     | 70+ tools with name, description, inputSchema; tools/call, tools/list |
| Resources         | ✅     | `pingone://applications` resource; list/read supported                 |
| listChanged       | ✅     | tools and resources listChanged capabilities; debounced notifications |
| Cancellation      | ✅     | AbortSignal passed to API clients (user tools); SDK integration ready  |
| Pagination        | ⚠️     | tools/list returns all (~70); cursor pagination optional per spec      |
| Prompts           | ⚠️     | Training prompts exist; spec prompts feature not formally declared    |
| Error handling    | ✅     | Protocol errors + tool execution errors with `isError` pattern        |
| Security          | ✅     | Credential handling, input validation, no arbitrary code exposure    |

---

## 1. Base protocol

### 1.1 Architecture

**Spec**: MCP uses JSON-RPC 2.0 messages between servers, clients, and hosts. Servers provide context and capabilities; clients connect within host applications. See [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25).

**Evaluation**:
- ✅ Server uses `@modelcontextprotocol/sdk` (`McpServer`, `StdioServerTransport`).
- ✅ Stdio transport matches MCP’s common deployment model (e.g. MCP Inspector).
- ✅ Server name and version: `pingone-mcp-server` / `0.1.0` (`index.ts`).

### 1.2 Transport and lifecycle

**Spec**: Stateful connections; server runs until shutdown.

**Evaluation**:
- ✅ `server.connect(transport)` establishes the connection.
- ✅ `process.on('SIGINT')` closes the server cleanly.
- ✅ Runs as a long-lived stdio process, suitable for Inspector and other MCP clients.

---

## 2. Tools

### 2.1 Capability declaration

**Spec**: Servers that support tools MUST declare the `tools` capability. Optional `listChanged` indicates whether the server notifies when the tool list changes.

**Evaluation**:
- ✅ SDK handles capability negotiation; tools are registered via `server.registerTool()`.
- ✅ `listChanged` is configured via capabilities and `debouncedNotificationMethods`; tools and resources emit list_changed when registered.

### 2.2 Tool definition

**Spec**: Each tool has:
- `name`: Unique identifier
- `description`: Human-readable description
- `inputSchema`: JSON Schema (or equivalent) for parameters

**Evaluation**:
- ✅ Tools use unique, stable names (e.g. `pingone_get_user`, `pingone_list_users`).
- ✅ Descriptions are present and describe behavior and auth (worker token, client credentials).
- ✅ Input schemas are defined with Zod and used for validation before calling PingOne APIs.

Example from `actions/users.ts`:

```typescript
server.registerTool(
  'pingone_get_user',
  {
    description: 'Get a PingOne user profile by ID. Uses worker token or client credentials from storage/env.',
    inputSchema: getUserInputShape,
    outputSchema: getUserOutputShape,
  },
  async (args) => { ... }
);
```

### 2.3 Tool invocation (tools/call)

**Spec**: Clients send `tools/call` with `name` and `arguments`. Servers return `content` (array of items) and optionally `isError`.

**Evaluation**:
- ✅ Handlers return `{ content: [{ type: 'text', text: string }], structuredContent?: ... }`.
- ✅ On failure, `buildToolErrorResult()` returns structured error content with `success: false`.
- ✅ SDK maps this to the MCP response format, including `isError` where appropriate.

### 2.4 Error handling

**Spec**: Two error types:
1. Protocol errors (JSON-RPC) for invalid args, unknown tools, server errors.
2. Tool execution errors in the result with `isError: true` for business logic / API failures.

**Evaluation**:
- ✅ Protocol-level issues (e.g. validation) are handled by Zod and SDK.
- ✅ Tool errors use `buildToolErrorResult()` in `services/mcpErrors.ts`, producing consistent content and `structuredContent`.
- ✅ Error payloads include `code` and `message`.

### 2.5 Security (tools)

**Spec**: Servers MUST sanitize outputs, rate limit, enforce access control, and validate inputs.

**Evaluation**:
- ✅ Zod schemas validate all tool inputs.
- ✅ Credentials come from `credentialLoader` (storage/env), not from untrusted input.
- ✅ Outputs are JSON or plain text; no arbitrary HTML or scripts.
- ⚠️ No explicit rate limiting in the server; host / network may provide limits.

---

## 3. Resources

### 3.1 Capability

**Spec**: Servers that support resources MUST declare the `resources` capability. Optional `subscribe` and `listChanged` for change notifications.

**Evaluation**:
- ✅ `registerPingOneResources()` registers `pingone://applications` via `server.resource()`.
- ✅ SDK handles capability negotiation for resources.

### 3.2 Resource definition

**Spec**: Resources have `uri`, optional `name`, `description`, `mimeType`.

**Evaluation**:
- ✅ Uses custom scheme `pingone://applications`.
- ✅ Title and description provided.
- ✅ Read returns `contents` with `uri`, `type: 'text'`, and `text`.

### 3.3 Resource read

**Spec**: Clients use `resources/read` with `uri`; server returns `contents`.

**Evaluation**:
- ✅ Dynamic content is fetched from PingOne API when the resource is read.
- ✅ Errors are returned as JSON in the text content, not as protocol errors (acceptable for this use case).

---

## 4. Prompts

### 4.1 Spec

**Spec**: Servers may offer prompts (templated messages/workflows). Clients use `prompts/list` and `prompts/get`.

**Evaluation**:
- ✅ Training module (`registerTrainingModule`) provides lesson and practice prompts.
- ⚠️ Documentation does not clearly map these to the spec `prompts` feature; behavior is consistent with “templated prompts” if exposed via the SDK.

---

## 5. Utilities and other features

### 5.1 Logging

**Spec**: MCP defines logging utilities.

**Evaluation**:
- ✅ `Logger` in `services/logger.js` is used for tool and resource activity.
- ✅ Logs go to `logs/mcp-server.log` when run via `run.sh`.

### 5.2 Cancellation and progress

**Spec**: Optional cancellation and progress tracking.

**Evaluation**:
- ✅ Cancellation: Tool handlers accept `(args, extra)`; when the SDK provides `extra.signal` (AbortSignal), it is passed to PingOne API calls (e.g. axios) so in-flight requests can be aborted on `notifications/cancelled`.

### 5.3 Pagination

**Spec**: `tools/list` and `resources/list` support optional pagination via `cursor` and `nextCursor`.

**Evaluation**:
- ✅ Pagination: tools/list returns all tools in one response (~70 tools); spec makes pagination optional. SDK does not support cursor in its default handlers; current usage is acceptable. Future: custom handlers could add cursor-based slicing if needed.

---

## 6. Security and trust

### 6.1 User consent

**Spec**: Implementors should provide clear UIs for authorizing activities; users must retain control and explicitly consent.

**Evaluation**:
- ✅ Credentials are provided by the user (Worker Token modal, `mcp-config.json`).
- ✅ Tools execute only after the host (e.g. AI Assistant) has been given access; the host can enforce confirmation.

### 6.2 Data privacy

**Spec**: User data should be protected; hosts must not transmit resource data without consent.

**Evaluation**:
- ✅ Credentials stored in `~/.pingone-playground/credentials/` (local).
- ✅ Tool calls use env/storage credentials; no credential exfiltration via tool params.
- ✅ Host application controls when and how MCP is used.

### 6.3 Tool safety

**Spec**: Tools are arbitrary code execution; users should understand behavior; hosts should obtain consent before invocation.

**Evaluation**:
- ✅ Tools perform defined PingOne API operations; no arbitrary code execution.
- ✅ Descriptions describe what each tool does.
- ✅ Host (AI Assistant, Inspector) can show tool name and params before execution.

---

## 7. Conformance checklist

| Requirement                                        | Status |
|----------------------------------------------------|--------|
| JSON-RPC 2.0 message format                        | ✅     |
| Server identifies with name and version            | ✅     |
| Tools capability declared                          | ✅     |
| Tools have name, description, inputSchema          | ✅     |
| tools/list returns tool definitions                | ✅     |
| tools/call invokes tools with validated args       | ✅     |
| Tool results use content array                     | ✅     |
| Tool errors reported (content + isError/structured)| ✅     |
| Resources capability declared                      | ✅     |
| resources/list returns resource metadata           | ✅     |
| resources/read returns contents                    | ✅     |
| Input validation on all tools                      | ✅     |
| No credential leakage via tool params             | ✅     |
| Graceful shutdown on SIGINT                        | ✅     |

---

## 8. Gaps and recommendations

### 8.1 Gaps (non-blocking)

1. **listChanged notifications** – ✅ Implemented. Capabilities advertise `tools.listChanged` and `resources.listChanged`; debouncing coalesces rapid notifications.
2. **Pagination** – tools/list returns all tools at once; acceptable for ~70 tools; SDK limitation for cursor-based pagination.
3. **Resource subscriptions** – `resources/subscribe` not implemented; applications resource is read-on-demand.
4. **Cancellation** – ✅ Implemented. Tool handlers pass `extra?.signal` to API clients (axios); when client sends `notifications/cancelled`, in-flight requests abort.
5. **Prompts feature** – Training prompts exist; formal declaration and alignment with spec prompts could be clarified.

### 8.2 Recommendations

1. **Document SDK version** – Pin `@modelcontextprotocol/sdk` and note compatibility in README.
2. **Rate limiting** – Add optional per-tool or per-session rate limiting for production.
3. **Structured output** – `structuredContent` is used; consider documenting it as a stable contract for AI clients.
4. **Spec alignment** – If adopting newer MCP versions (e.g. 2025-11-25 with Tasks, OAuth), re-evaluate conformance.

5. **Automated validation** – Run `npm run mcp:validate` (or `pnpm vitest run tests/backend/mcp-spec-validation.test.js`) to verify the server responds to initialize and tools/list per MCP spec. Validates tool structure (name, description, inputSchema).

---

## 9. Conclusion

The **pingone-mcp-server** conforms to the MCP specification for the features it implements. It correctly uses JSON-RPC 2.0, exposes tools and resources via the official SDK, validates inputs, and reports errors in line with the spec. Security practices around credentials and tool semantics are appropriate. Optional features such as list-changed notifications, pagination, and cancellation are not implemented but are not required for core compliance.

**Conformance verdict**: **Compliant** for base protocol, tools, and resources. Optional capabilities are documented as gaps.
