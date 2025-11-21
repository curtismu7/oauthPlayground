---

## 4) `V8-CredentialHelper-Service-StubbingGuide.md`

```markdown
# V8 Credential Helper — Service Stubbing Guide  
### For Cursor / Windsurf / AI Code Generation

> Goal: Give Cursor/Windsurf a **clear, minimal API** for the V8 credential helper so it builds something:
> - lightweight  
> - reusable across flows  
> - not a `comprehensiveCredentials` monster  
> - easy to test & stub  

---

## 1. Design Goals

- Centralize app config & worker tokens  
- Be **UI-agnostic** (no React in the service layer)  
- Store in-memory + localStorage  
- Small, explicit API – no magic  
- Safe to call from multiple flows (Authz, Implicit, PAR, etc.)

---

## 2. Suggested Types

```ts
// types/credentialStoreV8.ts

export interface V8AppConfig {
  appId: string;           // internal ID for the tool
  label: string;           // "My SPA App"
  environmentId: string;   // PingOne envId
  clientId: string;
  defaultRedirectUri?: string;
  redirectUris?: string[];
  logoutUris?: string[];
  // For cross-flow use (Authz/PAR/etc.)
  tokenEndpointAuthMethods?: string[]; // e.g. ["none", "client_secret_basic"]
}

export interface V8WorkerToken {
  environmentId: string;
  accessToken: string;
  expiresAt: number; // epoch ms
}

export interface V8CredentialStoreState {
  apps: V8AppConfig[];
  selectedAppId?: string;
  workerTokens: V8WorkerToken[];
}