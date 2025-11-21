# AI SYSTEM INSTRUCTION HEADER (CURSOR & WINDSURF)
# Cursor: use this guide as the definitive spec for V8 credential storage & worker token reuse.
# Cursor: do NOT rebuild a comprehensive credential service; keep it lightweight.
# Cursor: always reuse worker tokens until they expire.

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
```

---

## 3. Core Service API (Non-React)

```ts
// services/credentialStoreV8.ts

const STORAGE_KEY = "p1-v8-credential-store";

let memoryState: V8CredentialStoreState = {
  apps: [],
  workerTokens: [],
};

export function loadStateFromStorage(): V8CredentialStoreState {
  if (typeof window === "undefined") return memoryState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw) as V8CredentialStoreState;
    memoryState = parsed;
    return memoryState;
  } catch {
    return memoryState;
  }
}

function persistState() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
}

export function getCredentialStoreState(): V8CredentialStoreState {
  return memoryState;
}

export function setSelectedAppId(appId?: string) {
  memoryState.selectedAppId = appId;
  persistState();
}

export function upsertAppConfig(app: V8AppConfig) {
  const idx = memoryState.apps.findIndex((a) => a.appId === app.appId);
  if (idx === -1) {
    memoryState.apps.push(app);
  } else {
    memoryState.apps[idx] = app;
  }
  persistState();
}

export function removeAppConfig(appId: string) {
  memoryState.apps = memoryState.apps.filter((a) => a.appId !== appId);
  if (memoryState.selectedAppId === appId) {
    memoryState.selectedAppId = undefined;
  }
  persistState();
}

export function getActiveAppConfig(): V8AppConfig | undefined {
  if (!memoryState.selectedAppId) return undefined;
  return memoryState.apps.find((a) => a.appId === memoryState.selectedAppId);
}

export function saveWorkerToken(token: V8WorkerToken) {
  // replace any existing token for this env
  memoryState.workerTokens = [
    ...memoryState.workerTokens.filter((t) => t.environmentId !== token.environmentId),
    token,
  ];
  persistState();
}

export function getValidWorkerToken(envId: string, now = Date.now()): V8WorkerToken | undefined {
  const token = memoryState.workerTokens.find((t) => t.environmentId === envId);
  if (!token) return undefined;
  if (token.expiresAt <= now) return undefined;
  return token;
}
```

---

## 4. React Hook Wrapper

```ts
// hooks/useCredentialStoreV8.ts

import { useEffect, useState } from "react";
import {
  loadStateFromStorage,
  getCredentialStoreState,
  setSelectedAppId,
  upsertAppConfig,
  removeAppConfig,
  getActiveAppConfig,
  saveWorkerToken,
  getValidWorkerToken,
} from "../services/credentialStoreV8";
import type { V8AppConfig, V8WorkerToken, V8CredentialStoreState } from "../types/credentialStoreV8";

export function useCredentialStoreV8() {
  const [state, setState] = useState<V8CredentialStoreState>(() => loadStateFromStorage());

  useEffect(() => {
    const id = setInterval(() => {
      setState({ ...getCredentialStoreState() });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    apps: state.apps,
    selectedAppId: state.selectedAppId,
    workerTokens: state.workerTokens,

    selectApp: (appId?: string) => {
      setSelectedAppId(appId);
      setState({ ...getCredentialStoreState() });
    },

    addOrUpdateApp: (app: V8AppConfig) => {
      upsertAppConfig(app);
      setState({ ...getCredentialStoreState() });
    },

    deleteApp: (appId: string) => {
      removeAppConfig(appId);
      setState({ ...getCredentialStoreState() });
    },

    getActiveAppConfig: () => getActiveAppConfig(),

    getValidWorkerToken: (envId: string, now?: number) =>
      getValidWorkerToken(envId, now),

    saveWorkerToken: (token: V8WorkerToken) => {
      saveWorkerToken(token);
      setState({ ...getCredentialStoreState() });
    },
  };
}
```

---

## 5. How to Tell Cursor / Windsurf to Use This

Prompt guidelines:

- Use the `credentialStoreV8` service as the **single source of truth** for apps and worker tokens.
- Do **not** create large credential-management sections on any flow page.
- Access credentials only via:
  - the app picker,
  - the “Manage Apps” popup,
  - shared hooks (`useCredentialStoreV8`).
- When a worker token is needed:
  - always call `getValidWorkerToken(envId)` first.
  - only call the PingOne worker-token API if no valid token exists or it is expired.
  - then persist via `saveWorkerToken`.
- Never re-invent a new “comprehensiveCredentials” style service.

This ensures a **minimal, reusable, V8-safe credential subsystem**.
